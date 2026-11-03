-- First create three users in Authentication > Users (Add user, Auto Confirm User).
-- Replace these three emails with the emails you created before running this file.
do $$
declare
  manager_id uuid;
  worker_one_id uuid;
  worker_two_id uuid;
  site_one uuid;
  site_two uuid;
  site_three uuid;
begin
  select id into manager_id from auth.users where email = 'manager@example.com';
  select id into worker_one_id from auth.users where email = 'worker1@example.com';
  select id into worker_two_id from auth.users where email = 'worker2@example.com';
  if manager_id is null or worker_one_id is null or worker_two_id is null then
    raise exception 'Create all three auth users before running seed.sql';
  end if;

  insert into public.profiles (id, full_name, role) values
    (manager_id, 'Анна Миронова', 'manager'),
    (worker_one_id, 'Илья Петров', 'executor'),
    (worker_two_id, 'Мария Соколова', 'executor')
  on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;

  perform set_config('request.jwt.claim.sub', manager_id::text, true);

  -- A fresh run creates exactly three demo objects and five tasks.
  insert into public.objects (name, address) values ('ЖК Северный берег', 'Минск, ул. Нововиленская, 8') returning id into site_one;
  insert into public.objects (name, address) values ('Бизнес центр Парк', 'Минск, пр. Независимости, 142') returning id into site_two;
  insert into public.objects (name, address) values ('Складской комплекс Юг', 'Минский район, д. Прилесье') returning id into site_three;

  insert into public.tasks (object_id, title, description, assignee_id, author_id) values
    (site_one, 'Проверить электропроводку', 'Осмотреть разводку на втором этаже и приложить замечания.', worker_one_id, manager_id),
    (site_one, 'Согласовать план отделки', 'Проверить материалы и размеры по спецификации.', worker_two_id, manager_id),
    (site_two, 'Подготовить акт приёмки', 'Сверить выполненные работы с проектом.', worker_one_id, manager_id),
    (site_two, 'Осмотреть вентиляцию', 'Проверить монтаж воздуховодов.', worker_two_id, manager_id),
    (site_three, 'Проверить фундамент', 'Проверить контрольные замеры.', worker_one_id, manager_id);

  -- Seed data needs different statuses. These calls use the same transition rules
  -- as the application, with simulated authenticated users.
  perform set_config('request.jwt.claim.sub', worker_one_id::text, true);
  perform public.transition_task((select id from public.tasks where title = 'Проверить электропроводку' and object_id = site_one), 'in_progress', null);
  perform public.transition_task((select id from public.tasks where title = 'Подготовить акт приёмки' and object_id = site_two), 'in_progress', null);
  perform public.transition_task((select id from public.tasks where title = 'Подготовить акт приёмки' and object_id = site_two), 'review', null);
  perform public.transition_task((select id from public.tasks where title = 'Проверить фундамент' and object_id = site_three), 'in_progress', null);
  perform public.transition_task((select id from public.tasks where title = 'Проверить фундамент' and object_id = site_three), 'review', null);
  perform set_config('request.jwt.claim.sub', worker_two_id::text, true);
  perform public.transition_task((select id from public.tasks where title = 'Осмотреть вентиляцию' and object_id = site_two), 'in_progress', null);
  perform public.transition_task((select id from public.tasks where title = 'Осмотреть вентиляцию' and object_id = site_two), 'review', null);
  perform set_config('request.jwt.claim.sub', manager_id::text, true);
  perform public.transition_task((select id from public.tasks where title = 'Осмотреть вентиляцию' and object_id = site_two), 'rework', 'Нужно проверить крепления у третьего этажа.');
  perform public.transition_task((select id from public.tasks where title = 'Проверить фундамент' and object_id = site_three), 'accepted', null);
end;
$$;
