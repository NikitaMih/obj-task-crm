import clsx from 'clsx'
import type { Profile, Site, Task } from '@/lib'
import { ROLES } from '@/constants'
import { TaskList } from '@/components/TaskList'
import styles from './ObjectDetails.module.scss'
import ui from '@/styles/ui.module.scss'

type ObjectDetailsProps = {
  site: Site
  tasks: Task[]
  role: Profile['role']
  nameOf: (id: string) => string
  busy: boolean
  onBack: () => void
  onCreateTask: () => void
  onEdit: () => void
  onDelete: () => void
  onSelectTask: (task: Task) => void
}

export const ObjectDetails = ({
  site,
  tasks,
  role,
  nameOf,
  busy,
  onBack,
  onCreateTask,
  onEdit,
  onDelete,
  onSelectTask,
}: ObjectDetailsProps) => {
  return (
    <>
      <button className={ui.back} onClick={onBack}>
        ← Все объекты
      </button>
      <div className={ui.pageHeading}>
        <div>
          <div className={ui.eyebrow}>ОБЪЕКТ</div>
          <h1>{site.name}</h1>
          <p>⌖ {site.address}</p>
        </div>
        {role === ROLES.MANAGER && (
          <div className={ui.headingActions}>
            <button className={ui.secondary} onClick={onEdit}>
              Изменить
            </button>
            <button className={ui.primary} onClick={onCreateTask}>
              + Создать задачу
            </button>
          </div>
        )}
      </div>
      <section className={clsx(ui.panel, ui.listPanel)}>
        <div className={ui.sectionTitle}>
          <h2>Задачи объекта</h2>
          <span>{tasks.length}</span>
        </div>
        <TaskList
          tasks={tasks}
          subtitle={(task) => nameOf(task.assignee_id)}
          onSelect={onSelectTask}
          emptyText="Задач пока нет."
        />
      </section>
      {role === ROLES.MANAGER && (
        <button
          className={clsx(ui.dangerText, styles.objectDelete)}
          disabled={busy}
          onClick={onDelete}
        >
          Удалить объект
        </button>
      )}
    </>
  )
}
