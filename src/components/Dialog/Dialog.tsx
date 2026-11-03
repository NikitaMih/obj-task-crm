import type { FormEventHandler, ReactNode } from 'react'
import styles from './Dialog.module.scss'
import ui from '@/styles/ui.module.scss'

type DialogProps = {
  title: string
  category: string
  busy: boolean
  submitDisabled?: boolean
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  error?: string
  children: ReactNode
}

export const Dialog = ({
  title,
  category,
  busy,
  submitDisabled,
  onClose,
  onSubmit,
  error,
  children,
}: DialogProps) => {
  return (
    <div className={styles.modalBackdrop} onMouseDown={onClose}>
      <form
        className={styles.modal}
        noValidate
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className={styles.modalHead}>
          <div>
            <div className={ui.eyebrow}>{category}</div>
            <h2>{title}</h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose}>
            ×
          </button>
        </div>
        {children}
        {error && (
          <div className={ui.error} role="alert">
            {error}
          </div>
        )}
        <div className={styles.modalActions}>
          <button type="button" className={ui.secondary} onClick={onClose}>
            Отмена
          </button>
          <button className={ui.primary} disabled={busy || submitDisabled}>
            {busy ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  )
}
