-- Run in the Supabase SQL editor or with `supabase db push`.
create extension if not exists pgcrypto;

create type public.app_role as enum ('manager', 'executor');
create type public.task_status as enum ('new', 'in_progress', 'review', 'accepted', 'rework');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) between 1 and 120),
  role public.app_role not null
);

create table public.objects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  address text not null check (length(trim(address)) between 1 and 300),
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  object_id uuid not null references public.objects(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 200),
  description text not null default '',
  assignee_id uuid not null references public.profiles(id),
  author_id uuid not null references public.profiles(id),
  status public.task_status not null default 'new',
  created_at timestamptz not null default now()
);

create table public.task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  from_status public.task_status,
  to_status public.task_status not null,
  comment text,
  created_at timestamptz not null default now()
);
create index tasks_assignee_idx on public.tasks (assignee_id);
create index tasks_object_idx on public.tasks (object_id);
create index history_task_time_idx on public.task_history (task_id, created_at);

-- SECURITY DEFINER helpers bypass profiles RLS without making roles client-editable.
create function public.is_manager() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'manager');
$$;
create function public.is_executor(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = p_id and role = 'executor');
$$;

-- Managers may edit task fields, but status, author, and timestamps are immutable through REST.
create function public.guard_task_write() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.author_id <> (select auth.uid()) or new.status <> 'new' or not public.is_executor(new.assignee_id) then
      raise exception 'Invalid task author, status, or assignee';
    end if;
  else
    if new.status is distinct from old.status or new.author_id is distinct from old.author_id
       or new.created_at is distinct from old.created_at or new.id is distinct from old.id
       or not public.is_executor(new.assignee_id) then
      raise exception 'Status and system fields are immutable; use transition_task';
    end if;
  end if;
  return new;
end;
$$;
create trigger task_write_guard before insert or update on public.tasks
  for each row execute function public.guard_task_write();

create function public.record_new_task() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.task_history (task_id, actor_id, from_status, to_status)
  values (new.id, new.author_id, null, 'new');
  return new;
end;
$$;
create trigger task_created after insert on public.tasks for each row execute function public.record_new_task();

create function public.transition_task(p_task_id uuid, p_to public.task_status, p_comment text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_task public.tasks%rowtype; v_actor uuid := (select auth.uid()); v_role public.app_role;
begin
  if v_actor is null then raise exception 'Authentication required'; end if;
  select role into v_role from public.profiles where id = v_actor;
  select * into v_task from public.tasks where id = p_task_id for update;
  if not found then raise exception 'Task not found'; end if;
  if not (
    (v_role = 'executor' and v_task.assignee_id = v_actor and
      ((v_task.status in ('new', 'rework') and p_to = 'in_progress') or
       (v_task.status = 'in_progress' and p_to = 'review')))
    or
    (v_role = 'manager' and v_task.status = 'review' and p_to in ('accepted', 'rework'))
  ) then raise exception 'Transition not allowed'; end if;
  if p_to = 'rework' and nullif(trim(p_comment), '') is null then
    raise exception 'Comment required for rework';
  end if;
  -- Disable only this function's ordinary-write guard during its own atomic update.
  perform set_config('crm.transition_task', 'true', true);
  update public.tasks set status = p_to where id = p_task_id;
  perform set_config('crm.transition_task', 'false', true);
  insert into public.task_history (task_id, actor_id, from_status, to_status, comment)
  values (p_task_id, v_actor, v_task.status, p_to, nullif(trim(p_comment), ''));
end;
$$;

-- Replace the guard to allow only an update performed within the checked RPC.
create or replace function public.guard_task_write() returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.author_id <> (select auth.uid()) or new.status <> 'new' or not public.is_executor(new.assignee_id) then
      raise exception 'Invalid task author, status, or assignee';
    end if;
  else
    if new.id is distinct from old.id or new.author_id is distinct from old.author_id
       or new.created_at is distinct from old.created_at then
      raise exception 'System fields are immutable';
    end if;
    if new.status is distinct from old.status then
      if current_setting('crm.transition_task', true) is distinct from 'true'
         or new.object_id is distinct from old.object_id or new.title is distinct from old.title
         or new.description is distinct from old.description or new.assignee_id is distinct from old.assignee_id then
        raise exception 'Use transition_task for status changes';
      end if;
    elsif not public.is_executor(new.assignee_id) then
      raise exception 'Assignee must be an executor';
    end if;
  end if;
  return new;
end;
$$;

alter table public.profiles enable row level security;
alter table public.objects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_history enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (
  id = (select auth.uid()) or public.is_manager() or
  exists (select 1 from public.tasks t where t.assignee_id = (select auth.uid()) and (t.author_id = profiles.id or t.assignee_id = profiles.id)) or
  exists (select 1 from public.task_history h join public.tasks t on t.id = h.task_id
          where t.assignee_id = (select auth.uid()) and h.actor_id = profiles.id)
);
create policy objects_read on public.objects for select to authenticated using (
  public.is_manager() or exists (select 1 from public.tasks t where t.object_id = objects.id and t.assignee_id = (select auth.uid()))
);
create policy objects_insert on public.objects for insert to authenticated with check (public.is_manager());
create policy objects_update on public.objects for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy objects_delete on public.objects for delete to authenticated using (public.is_manager());
create policy tasks_read on public.tasks for select to authenticated using (public.is_manager() or assignee_id = (select auth.uid()));
create policy tasks_insert on public.tasks for insert to authenticated with check (public.is_manager() and author_id = (select auth.uid()) and status = 'new');
create policy tasks_update on public.tasks for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy tasks_delete on public.tasks for delete to authenticated using (public.is_manager());
create policy history_read on public.task_history for select to authenticated using (
  exists (select 1 from public.tasks t where t.id = task_id and (public.is_manager() or t.assignee_id = (select auth.uid())))
);

revoke all on public.profiles, public.objects, public.tasks, public.task_history from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.objects to authenticated;
grant select, delete on public.tasks to authenticated;
grant insert (object_id, title, description, assignee_id, author_id) on public.tasks to authenticated;
grant update (object_id, title, description, assignee_id) on public.tasks to authenticated;
grant select on public.task_history to authenticated;
revoke all on function public.is_manager(), public.is_executor(uuid), public.transition_task(uuid, public.task_status, text),
  public.guard_task_write(), public.record_new_task() from public, anon;
grant execute on function public.is_manager(), public.is_executor(uuid), public.transition_task(uuid, public.task_status, text) to authenticated;
