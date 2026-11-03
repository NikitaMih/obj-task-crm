import { useForm } from 'react-hook-form'
import { FORM_LIMITS } from '@/constants'
import type { Profile, Site, Task } from '@/lib'
import { Dialog } from '@/components/Dialog'
import ui from '@/styles/ui.module.scss'

export type TaskInput = {
  title: string
  description: string
  object_id: string
  assignee_id: string
}

type TaskEditorProps = {
  task?: Task
  objectId: string | null
  objects: Site[]
  executors: Profile[]
  busy: boolean
  error?: string
  onClose: () => void
  onSave: (input: TaskInput) => Promise<void>
}

export const TaskEditor = ({
  task,
  objectId,
  objects,
  executors,
  busy,
  error,
  onClose,
  onSave,
}: TaskEditorProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskInput>({
    mode: 'onBlur',
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      object_id: task?.object_id ?? objectId ?? objects[0]?.id ?? '',
      assignee_id: task?.assignee_id ?? executors[0]?.id ?? '',
    },
  })

  const submit = (input: TaskInput) =>
    onSave({
      ...input,
      title: input.title.trim(),
      description: input.description.trim(),
    })

  return (
    <Dialog
      title={`${task ? 'Редактировать' : 'Создать'} задачу`}
      category="ЗАДАЧА"
      busy={busy || isSubmitting}
      submitDisabled={objects.length === 0 || executors.length === 0}
      error={
        error ||
        (objects.length === 0 ? 'Сначала создайте объект.' : undefined) ||
        (executors.length === 0 ? 'Сначала добавьте исполнителя.' : undefined)
      }
      onClose={onClose}
      onSubmit={handleSubmit(submit)}
    >
      <label>
        Название
        <input
          autoFocus
          aria-invalid={Boolean(errors.title)}
          {...register('title', {
            required: 'Укажите название.',
            maxLength: {
              value: FORM_LIMITS.TASK_TITLE,
              message: `Не больше ${FORM_LIMITS.TASK_TITLE} символов.`,
            },
            validate: (value) => value.trim().length > 0 || 'Укажите название.',
          })}
        />
        {errors.title && (
          <span className={ui.fieldError} role="alert">
            {errors.title.message}
          </span>
        )}
      </label>
      <label>
        Описание
        <textarea
          rows={4}
          aria-invalid={Boolean(errors.description)}
          {...register('description', {
            maxLength: {
              value: FORM_LIMITS.TASK_DESCRIPTION,
              message: `Не больше ${FORM_LIMITS.TASK_DESCRIPTION} символов.`,
            },
          })}
        />
        {errors.description && (
          <span className={ui.fieldError} role="alert">
            {errors.description.message}
          </span>
        )}
      </label>
      <label>
        Объект
        <select
          aria-invalid={Boolean(errors.object_id)}
          {...register('object_id', {
            required: 'Выберите объект.',
            validate: (value) => objects.some((site) => site.id === value) || 'Выберите объект.',
          })}
        >
          {objects.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
        {errors.object_id && (
          <span className={ui.fieldError} role="alert">
            {errors.object_id.message}
          </span>
        )}
      </label>
      <label>
        Исполнитель
        <select
          aria-invalid={Boolean(errors.assignee_id)}
          {...register('assignee_id', {
            required: 'Выберите исполнителя.',
            validate: (value) =>
              executors.some((person) => person.id === value) || 'Выберите исполнителя.',
          })}
        >
          {executors.map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name}
            </option>
          ))}
        </select>
        {errors.assignee_id && (
          <span className={ui.fieldError} role="alert">
            {errors.assignee_id.message}
          </span>
        )}
      </label>
    </Dialog>
  )
}
