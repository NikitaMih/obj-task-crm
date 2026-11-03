import clsx from 'clsx'
import type { Task } from '@/lib'
import { TaskList } from '@/components/TaskList'
import ui from '@/styles/ui.module.scss'

type MyTasksProps = {
  tasks: Task[]
  objectName: (id: string) => string
  onSelect: (task: Task) => void
}

export const MyTasks = ({ tasks, objectName, onSelect }: MyTasksProps) => {
  return (
    <>
      <div className={ui.pageHeading}>
        <div>
          <div className={ui.eyebrow}>РАБОЧЕЕ ПРОСТРАНСТВО</div>
          <h1>Мои задачи</h1>
          <p>Задачи, назначенные вам</p>
        </div>
      </div>
      <section className={clsx(ui.panel, ui.listPanel)}>
        <div className={ui.sectionTitle}>
          <h2>Все задачи</h2>
          <span>{tasks.length}</span>
        </div>
        <TaskList
          tasks={tasks}
          subtitle={(task) => objectName(task.object_id)}
          onSelect={onSelect}
          emptyText="У вас пока нет задач."
        />
      </section>
    </>
  )
}
