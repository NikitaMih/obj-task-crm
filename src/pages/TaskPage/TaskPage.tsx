import { useNavigate } from 'react-router'
import { ROUTES, type Status } from '@/constants'
import type { Event, Profile, Task } from '@/lib'
import { TaskDetails } from '@/components/TaskDetails'
import { NotFoundPage } from '@/pages/NotFoundPage'

type TaskPageProps = {
  task?: Task
  history: Event[]
  profile: Profile
  objectName: string
  nameOf: (id: string) => string
  busy: boolean
  onTransition: (status: Status, requiresComment: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export const TaskPage = ({
  task,
  history,
  profile,
  objectName,
  nameOf,
  busy,
  onTransition,
  onEdit,
  onDelete,
}: TaskPageProps) => {
  const navigate = useNavigate()
  if (!task) return <NotFoundPage message="Задача не найдена или у вас нет к ней доступа." />

  return (
    <TaskDetails
      task={task}
      history={history}
      profile={profile}
      objectName={objectName}
      nameOf={nameOf}
      busy={busy}
      onBack={() => navigate(ROUTES.object(task.object_id))}
      onTransition={onTransition}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
