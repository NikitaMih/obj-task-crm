import { useNavigate } from 'react-router'
import { ROUTES } from '@/constants'
import type { Task } from '@/lib'
import { MyTasks } from '@/components/MyTasks'

type MyTasksPageProps = {
  tasks: Task[]
  objectName: (id: string) => string
}

export const MyTasksPage = ({ tasks, objectName }: MyTasksPageProps) => {
  const navigate = useNavigate()

  return (
    <MyTasks
      tasks={tasks}
      objectName={objectName}
      onSelect={(task) => navigate(ROUTES.task(task.id))}
    />
  )
}
