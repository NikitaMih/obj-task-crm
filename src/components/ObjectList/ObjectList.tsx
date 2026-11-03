import clsx from 'clsx'
import type { Profile, Site, Task } from '@/lib'
import { ROLES, TASK_STATUS } from '@/constants'
import styles from './ObjectList.module.scss'
import ui from '@/styles/ui.module.scss'

type ObjectListProps = {
  objects: Site[]
  tasks: Task[]
  role: Profile['role']
  onSelect: (id: string) => void
  onCreate: () => void
}

export const ObjectList = ({ objects, tasks, role, onSelect, onCreate }: ObjectListProps) => {
  return (
    <>
      <div className={ui.pageHeading}>
        <div>
          <div className={ui.eyebrow}>РАБОЧЕЕ ПРОСТРАНСТВО</div>
          <h1>Объекты</h1>
          <p>
            {role === ROLES.MANAGER
              ? 'Все строительные объекты и их задачи'
              : 'Объекты с вашими задачами'}
          </p>
        </div>
        {role === ROLES.MANAGER && (
          <button className={ui.primary} onClick={onCreate}>
            + Новый объект
          </button>
        )}
      </div>
      <div className={styles.stats}>
        <div>
          <small>Объектов</small>
          <strong>{objects.length}</strong>
        </div>
        <div>
          <small>Всего задач</small>
          <strong>{tasks.length}</strong>
        </div>
        <div>
          <small>На проверке</small>
          <strong>{tasks.filter((task) => task.status === TASK_STATUS.REVIEW).length}</strong>
        </div>
      </div>
      <div className={clsx(ui.sectionTitle, styles.objectsTitle)}>
        <h2>Список объектов</h2>
        <span>{objects.length}</span>
      </div>
      <div className={styles.objectGrid}>
        {objects.map((site) => (
          <button className={styles.objectCard} key={site.id} onClick={() => onSelect(site.id)}>
            <div className={styles.cardIcon}>▥</div>
            <h3>{site.name}</h3>
            <p>⌖ {site.address}</p>
            <div className={styles.cardBottom}>
              <span>{tasks.filter((task) => task.object_id === site.id).length} задач</span>
              <span>Открыть →</span>
            </div>
          </button>
        ))}
      </div>
      {objects.length === 0 && <div className={clsx(ui.empty, ui.panel)}>Объектов пока нет.</div>}
    </>
  )
}
