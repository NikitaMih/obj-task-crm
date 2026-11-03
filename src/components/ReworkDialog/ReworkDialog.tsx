import { useForm } from 'react-hook-form'
import { FORM_LIMITS } from '@/constants'
import { Dialog } from '@/components/Dialog'
import ui from '@/styles/ui.module.scss'

type ReworkInput = { comment: string }

type ReworkDialogProps = {
  busy: boolean
  error?: string
  onClose: () => void
  onSave: (comment: string) => Promise<void>
}

export const ReworkDialog = ({ busy, error, onClose, onSave }: ReworkDialogProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReworkInput>({ mode: 'onBlur', defaultValues: { comment: '' } })

  const submit = ({ comment }: ReworkInput) => onSave(comment.trim())

  return (
    <Dialog
      title="Вернуть на доработку"
      category="КОММЕНТАРИЙ"
      busy={busy || isSubmitting}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit(submit)}
    >
      <label>
        Что нужно исправить
        <textarea
          rows={4}
          autoFocus
          aria-invalid={Boolean(errors.comment)}
          {...register('comment', {
            required: 'Укажите причину доработки.',
            maxLength: {
              value: FORM_LIMITS.REWORK_COMMENT,
              message: `Не больше ${FORM_LIMITS.REWORK_COMMENT} символов.`,
            },
            validate: (value) => value.trim().length > 0 || 'Укажите причину доработки.',
          })}
        />
        {errors.comment && (
          <span className={ui.fieldError} role="alert">
            {errors.comment.message}
          </span>
        )}
      </label>
    </Dialog>
  )
}
