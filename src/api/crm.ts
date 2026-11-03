import { COLUMNS, RPC, TABLES, type Status } from '@/constants'
import { supabase, type Event, type Profile, type Site, type Task } from '@/lib'

type ObjectInput = Pick<Site, 'name' | 'address'>
type TaskInput = Pick<Task, 'title' | 'description' | 'object_id' | 'assignee_id'>
type QueryResult = { error: { message: string } | null }

export type CrmSnapshot = {
  profile: Profile | null
  objects: Site[]
  tasks: Task[]
  profiles: Profile[]
}

const execute = async (query: PromiseLike<QueryResult>): Promise<void> => {
  const { error } = await query
  if (error) throw new Error(error.message)
}

export const getCrmSnapshot = async (userId: string): Promise<CrmSnapshot> => {
  const [me, sites, work, people] = await Promise.all([
    supabase.from(TABLES.PROFILES).select('*').eq(COLUMNS.ID, userId).maybeSingle(),
    supabase.from(TABLES.OBJECTS).select('*').order(COLUMNS.NAME),
    supabase.from(TABLES.TASKS).select('*').order(COLUMNS.CREATED_AT, { ascending: false }),
    supabase.from(TABLES.PROFILES).select('*').order(COLUMNS.FULL_NAME),
  ])

  const error = me.error || sites.error || work.error || people.error
  if (error) throw new Error(error.message)

  return {
    profile: me.data as Profile | null,
    objects: sites.data as Site[],
    tasks: work.data as Task[],
    profiles: people.data as Profile[],
  }
}

export const getTaskHistory = async (taskId: string): Promise<Event[]> => {
  const { data, error } = await supabase
    .from(TABLES.TASK_HISTORY)
    .select('*')
    .eq(COLUMNS.TASK_ID, taskId)
    .order(COLUMNS.CREATED_AT)

  if (error) throw new Error(error.message)
  return data as Event[]
}

export const createObject = (input: ObjectInput) =>
  execute(supabase.from(TABLES.OBJECTS).insert(input))

export const updateObject = (id: string, input: ObjectInput) =>
  execute(supabase.from(TABLES.OBJECTS).update(input).eq(COLUMNS.ID, id))

export const deleteObject = (id: string) =>
  execute(supabase.from(TABLES.OBJECTS).delete().eq(COLUMNS.ID, id))

export const createTask = (input: TaskInput, authorId: string) =>
  execute(supabase.from(TABLES.TASKS).insert({ ...input, author_id: authorId }))

export const updateTask = (id: string, input: TaskInput) =>
  execute(supabase.from(TABLES.TASKS).update(input).eq(COLUMNS.ID, id))

export const deleteTask = (id: string) =>
  execute(supabase.from(TABLES.TASKS).delete().eq(COLUMNS.ID, id))

export const transitionTask = (taskId: string, status: Status, comment: string | null = null) =>
  execute(
    supabase.rpc(RPC.TRANSITION_TASK, {
      p_task_id: taskId,
      p_to: status,
      p_comment: comment,
    }),
  )
