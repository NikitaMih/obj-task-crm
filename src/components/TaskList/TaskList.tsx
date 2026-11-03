import type { Task } from '@/lib'
import { StatusBadge } from '@/components/StatusBadge'
import styles from './TaskList.module.scss'
import ui from '@/styles/ui.module.scss'

type TaskListProps = {
  tasks: Task[]
  subtitle: (task: Task) => string
  onSelect: (task: Task) => void
  emptyText: string
}

export const TaskList = ({ tasks, subtitle, onSelect, emptyText }: TaskListProps) => {
  if (tasks.length === 0) return <div className={ui.empty}>{emptyText}</div>

  return (
    <div className={styles.taskList}>
      {tasks.map((task) => (
        <button className={styles.taskRow} key={task.id} onClick={() => onSelect(task)}>
          <span className={styles.taskTitle}>
            <b>{task.title}</b>
            <small>{subtitle(task)}</small>
          </span>
          <StatusBadge status={task.status} />
          <span className={styles.rowArrow}>→</span>
        </button>
      ))}
    </div>
  )
}
