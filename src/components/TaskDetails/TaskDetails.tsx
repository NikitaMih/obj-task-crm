import clsx from 'clsx'
import { ROLES, STATUS_LABEL, TASK_STATUS } from '@/constants'
import { availableActions, type Event, type Profile, type Status, type Task } from '@/lib'
import { StatusBadge } from '@/components/StatusBadge'
import styles from './TaskDetails.module.scss'
import ui from '@/styles/ui.module.scss'

type TaskDetailsProps = {
  task: Task
  history: Event[]
  profile: Profile
  objectName: string
  nameOf: (id: string) => string
  busy: boolean
  onBack: () => void
  onTransition: (status: Status, requiresComment: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )

export const TaskDetails = ({
  task,
  history,
  profile,
  objectName,
  nameOf,
  busy,
  onBack,
  onTransition,
  onEdit,
  onDelete,
}: TaskDetailsProps) => {
  const actions = availableActions(task, profile.role, profile.id)

  return (
    <>
      <button className={ui.back} onClick={onBack}>
        ← Назад к объекту
      </button>
      <div className={ui.pageHeading}>
        <div>
          <div className={ui.eyebrow}>ЗАДАЧА</div>
          <h1>{task.title}</h1>
          <p>{objectName}</p>
        </div>
        <StatusBadge status={task.status} />
      </div>
      <div className={styles.detailGrid}>
        <section className={ui.panel}>
          <h2>Описание</h2>
          <p className={styles.description}>{task.description || 'Описание не добавлено.'}</p>
          <div className={styles.facts}>
            <div>
              <small>Исполнитель</small>
              <b>{nameOf(task.assignee_id)}</b>
            </div>
            <div>
              <small>Автор</small>
              <b>{nameOf(task.author_id)}</b>
            </div>
            <div>
              <small>Создана</small>
              <b>{formatDate(task.created_at)}</b>
            </div>
          </div>
          <div className={styles.actions}>
            {actions.map((action) => (
              <button
                key={action.status}
                disabled={busy}
                className={action.status === TASK_STATUS.REWORK ? ui.secondary : ui.primary}
                onClick={() => onTransition(action.status, action.comment)}
              >
                {action.label}
              </button>
            ))}
            {profile.role === ROLES.MANAGER && (
              <>
                <button className={ui.secondary} onClick={onEdit}>
                  Редактировать
                </button>
                <button className={ui.dangerText} disabled={busy} onClick={onDelete}>
                  Удалить
                </button>
              </>
            )}
          </div>
        </section>
        <section className={clsx(ui.panel, styles.history)}>
          <h2>История статусов</h2>
          {history.length === 0 ? (
            <p className={styles.muted}>Записей пока нет.</p>
          ) : (
            <div className={styles.timeline}>
              {history.map((event) => (
                <div className={styles.event} key={event.id}>
                  <span className={styles.eventDot} />
                  <div>
                    <b>
                      {event.from_status ? `${STATUS_LABEL[event.from_status]} → ` : ''}
                      {STATUS_LABEL[event.to_status]}
                    </b>
                    <small>
                      {nameOf(event.actor_id)} · {formatDate(event.created_at)}
                    </small>
                    {event.comment && <p>«{event.comment}»</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
