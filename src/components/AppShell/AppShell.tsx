import type { ReactNode } from 'react'
import clsx from 'clsx'
import { ROLE_LABEL, ROLES, SCREENS, type Screen } from '@/constants'
import type { Profile, Site, Task } from '@/lib'
import styles from './AppShell.module.scss'

type AppShellProps = {
  profile: Profile
  screen: Screen
  selectedObject?: Site
  selectedTask?: Task
  onNavigate: (screen: Screen) => void
  onBackToObject: () => void
  onSignOut: () => void
  children: ReactNode
}

export const AppShell = ({
  profile,
  screen,
  selectedObject,
  selectedTask,
  onNavigate,
  onBackToObject,
  onSignOut,
  children,
}: AppShellProps) => {
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
          <button
            className={clsx(screen === SCREENS.OBJECTS && styles.active)}
            onClick={() => onNavigate(SCREENS.OBJECTS)}
          >
            ▤ <span>Объекты</span>
          </button>
          {profile.role === ROLES.EXECUTOR && (
            <button
              className={clsx(screen === SCREENS.MINE && styles.active)}
              onClick={() => onNavigate(SCREENS.MINE)}
            >
              ◷ <span>Мои задачи</span>
            </button>
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
            <button onClick={() => onNavigate(SCREENS.OBJECTS)}>Объекты</button>
            {selectedObject && (
              <>
                {' '}
                / <button onClick={onBackToObject}>{selectedObject.name}</button>
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
