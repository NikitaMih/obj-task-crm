export const ROLES = {
  MANAGER: 'manager',
  EXECUTOR: 'executor',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const TASK_STATUS = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  ACCEPTED: 'accepted',
  REWORK: 'rework',
} as const

export type Status = (typeof TASK_STATUS)[keyof typeof TASK_STATUS]

export const SCREENS = {
  OBJECTS: 'objects',
  MINE: 'mine',
} as const

export type Screen = (typeof SCREENS)[keyof typeof SCREENS]

export const EDITOR_KIND = {
  OBJECT: 'object',
  TASK: 'task',
} as const

export type EditorKind = (typeof EDITOR_KIND)[keyof typeof EDITOR_KIND]

export const TABLES = {
  PROFILES: 'profiles',
  OBJECTS: 'objects',
  TASKS: 'tasks',
  TASK_HISTORY: 'task_history',
} as const

export const RPC = {
  TRANSITION_TASK: 'transition_task',
} as const

export const COLUMNS = {
  ID: 'id',
  NAME: 'name',
  CREATED_AT: 'created_at',
  FULL_NAME: 'full_name',
  TASK_ID: 'task_id',
} as const

export const STATUS_LABEL: Record<Status, string> = {
  [TASK_STATUS.NEW]: 'Новая',
  [TASK_STATUS.IN_PROGRESS]: 'В работе',
  [TASK_STATUS.REVIEW]: 'На проверке',
  [TASK_STATUS.ACCEPTED]: 'Принята',
  [TASK_STATUS.REWORK]: 'На доработке',
}

export const ROLE_LABEL: Record<Role, string> = {
  [ROLES.MANAGER]: 'Постановщик',
  [ROLES.EXECUTOR]: 'Исполнитель',
}

export const FORM_LIMITS = {
  EMAIL: 254,
  PASSWORD_MIN: 6,
  OBJECT_NAME: 200,
  ADDRESS: 300,
  TASK_TITLE: 200,
  TASK_DESCRIPTION: 5000,
  REWORK_COMMENT: 2000,
} as const

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
