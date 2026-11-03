import type { ReactNode } from 'react'
import { Link, NavLink, useMatch } from 'react-router'
import clsx from 'clsx'
import { ROLE_LABEL, ROLES, ROUTES } from '@/constants'
import type { Profile, Site, Task } from '@/lib'
import styles from './AppShell.module.scss'

type AppShellProps = {
  profile: Profile
  selectedObject?: Site
  selectedTask?: Task
  onSignOut: () => void
  children: ReactNode
}

export const AppShell = ({
  profile,
  selectedObject,
  selectedTask,
  onSignOut,
  children,
}: AppShellProps) => {
  const onMyTasks = Boolean(useMatch(ROUTES.MY_TASKS))

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>▦</span>
          <div>
            ОБЪЕКТЫ<span>И ЗАДАЧИ</span>
          </div>
        </div>
        <nav>
          <NavLink
            className={({ isActive }) => clsx(isActive && styles.active)}
            to={ROUTES.OBJECTS}
          >
            ▤ <span>Объекты</span>
          </NavLink>
          {profile.role === ROLES.EXECUTOR && (
            <NavLink
              className={({ isActive }) => clsx(isActive && styles.active)}
              to={ROUTES.MY_TASKS}
            >
              ◷ <span>Мои задачи</span>
            </NavLink>
          )}
        </nav>
        <div className={styles.sideFoot}>
          <div className={styles.avatar}>{profile.full_name.charAt(0).toUpperCase()}</div>
          <div className={styles.userMeta}>
            <b>{profile.full_name}</b>
            <small>{ROLE_LABEL[profile.role]}</small>
          </div>
          <button title="Выйти" onClick={onSignOut}>
            ↪
          </button>
        </div>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.crumbs}>
            <Link to={ROUTES.OBJECTS}>Объекты</Link>
            {onMyTasks && (
              <>
                {' '}
                / <span>Мои задачи</span>
              </>
            )}
            {selectedObject && (
              <>
                {' '}
                / <Link to={ROUTES.object(selectedObject.id)}>{selectedObject.name}</Link>
              </>
            )}
            {selectedTask && (
              <>
                {' '}
                / <span>{selectedTask.title}</span>
              </>
            )}
          </div>
          <div className={styles.headerRight}>
            Мини CRM <span className={styles.onlineDot} />
          </div>
        </header>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  )
}
