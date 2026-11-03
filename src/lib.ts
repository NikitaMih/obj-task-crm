import { createClient } from '@supabase/supabase-js'
import { ROLES, TASK_STATUS, type Role, type Status } from './constants'

export type { Role, Status } from './constants'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const configured = Boolean(url && key && !url.includes('YOUR_PROJECT'))
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder')

export type Profile = { id: string; full_name: string; role: Role }
export type Site = { id: string; name: string; address: string; created_at: string }
export type Task = {
  id: string
  object_id: string
  title: string
  description: string
  assignee_id: string
  author_id: string
  status: Status
  created_at: string
}
export type Event = {
  id: string
  task_id: string
  actor_id: string
  from_status: Status | null
  to_status: Status
  comment: string | null
  created_at: string
}

export const availableActions = (
  task: Task,
  role: Role,
  userId: string,
): { status: Status; label: string; comment: boolean }[] => {
  if (role === ROLES.EXECUTOR && task.assignee_id === userId) {
    if (task.status === TASK_STATUS.NEW || task.status === TASK_STATUS.REWORK)
      return [{ status: TASK_STATUS.IN_PROGRESS, label: 'Взять в работу', comment: false }]
    if (task.status === TASK_STATUS.IN_PROGRESS)
      return [{ status: TASK_STATUS.REVIEW, label: 'Отправить на проверку', comment: false }]
  }
  if (role === ROLES.MANAGER && task.status === TASK_STATUS.REVIEW)
    return [
      { status: TASK_STATUS.ACCEPTED, label: 'Принять', comment: false },
      { status: TASK_STATUS.REWORK, label: 'Вернуть на доработку', comment: true },
    ]
  return []
}
