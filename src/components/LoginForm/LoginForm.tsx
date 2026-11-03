import clsx from 'clsx'
import { useForm } from 'react-hook-form'
import { EMAIL_PATTERN, FORM_LIMITS } from '@/constants'
import styles from './LoginForm.module.scss'
import ui from '@/styles/ui.module.scss'

type LoginInput = { email: string; password: string }
type LoginFormProps = { onSignIn: (email: string, password: string) => Promise<void> }

export const LoginForm = ({ onSignIn }: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ mode: 'onBlur' })

  const submit = async ({ email, password }: LoginInput) => {
    try {
      await onSignIn(email.trim(), password)
    } catch {
      setError('root', { message: 'Неверный email или пароль.' })
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginBrand}>
        ▦{' '}
        <span>
          ОБЪЕКТЫ
          <br />И ЗАДАЧИ
        </span>
      </div>
      <form className={styles.loginCard} onSubmit={handleSubmit(submit)} noValidate>
        <div className={ui.eyebrow}>МИНИ CRM</div>
        <h1>С возвращением</h1>
        <p>Войдите в рабочее пространство</p>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            placeholder="name@company.ru"
            aria-invalid={Boolean(errors.email)}
            {...register('email', {
              required: 'Укажите email.',
              setValueAs: (value: string) => value.trim(),
              maxLength: { value: FORM_LIMITS.EMAIL, message: 'Email слишком длинный.' },
              pattern: { value: EMAIL_PATTERN, message: 'Введите корректный email.' },
            })}
          />
          {errors.email && (
            <span className={ui.fieldError} role="alert">
              {errors.email.message}
            </span>
          )}
        </label>
        <label>
          Пароль
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Введите пароль"
            aria-invalid={Boolean(errors.password)}
            {...register('password', {
              required: 'Укажите пароль.',
              minLength: {
                value: FORM_LIMITS.PASSWORD_MIN,
                message: `Пароль должен содержать минимум ${FORM_LIMITS.PASSWORD_MIN} символов.`,
              },
            })}
          />
          {errors.password && (
            <span className={ui.fieldError} role="alert">
              {errors.password.message}
            </span>
          )}
        </label>
        {errors.root && (
          <div className={ui.error} role="alert">
            {errors.root.message}
          </div>
        )}
        <button className={clsx(ui.primary, styles.submit)} disabled={isSubmitting}>
          {isSubmitting ? 'Входим…' : 'Войти'}
        </button>
        <small>Доступы выдаёт администратор системы.</small>
      </form>
    </div>
  )
}
