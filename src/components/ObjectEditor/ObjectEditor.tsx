import { useForm } from 'react-hook-form'
import { FORM_LIMITS } from '@/constants'
import type { Site } from '@/lib'
import { Dialog } from '@/components/Dialog'
import ui from '@/styles/ui.module.scss'

export type ObjectInput = { name: string; address: string }

type ObjectEditorProps = {
  site?: Site
  busy: boolean
  error?: string
  onClose: () => void
  onSave: (input: ObjectInput) => Promise<void>
}

export const ObjectEditor = ({ site, busy, error, onClose, onSave }: ObjectEditorProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ObjectInput>({
    mode: 'onBlur',
    defaultValues: { name: site?.name ?? '', address: site?.address ?? '' },
  })

  const submit = (input: ObjectInput) =>
    onSave({ name: input.name.trim(), address: input.address.trim() })

  return (
    <Dialog
      title={`${site ? 'Редактировать' : 'Создать'} объект`}
      category="ОБЪЕКТ"
      busy={busy || isSubmitting}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit(submit)}
    >
      <label>
        Название
        <input
          autoFocus
          aria-invalid={Boolean(errors.name)}
          {...register('name', {
            required: 'Укажите название.',
            maxLength: {
              value: FORM_LIMITS.OBJECT_NAME,
              message: `Не больше ${FORM_LIMITS.OBJECT_NAME} символов.`,
            },
            validate: (value) => value.trim().length > 0 || 'Укажите название.',
          })}
        />
        {errors.name && (
          <span className={ui.fieldError} role="alert">
            {errors.name.message}
          </span>
        )}
      </label>
      <label>
        Адрес
        <input
          aria-invalid={Boolean(errors.address)}
          {...register('address', {
            required: 'Укажите адрес.',
            maxLength: {
              value: FORM_LIMITS.ADDRESS,
              message: `Не больше ${FORM_LIMITS.ADDRESS} символов.`,
            },
            validate: (value) => value.trim().length > 0 || 'Укажите адрес.',
          })}
        />
        {errors.address && (
          <span className={ui.fieldError} role="alert">
            {errors.address.message}
          </span>
        )}
      </label>
    </Dialog>
  )
}
