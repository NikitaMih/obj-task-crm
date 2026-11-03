import { useNavigate } from 'react-router'
import { ROUTES } from '@/constants'
import type { Profile, Site, Task } from '@/lib'
import { ObjectDetails } from '@/components/ObjectDetails'
import { NotFoundPage } from '@/pages/NotFoundPage'

type ObjectPageProps = {
  site?: Site
  tasks: Task[]
  role: Profile['role']
  nameOf: (id: string) => string
  busy: boolean
  onCreateTask: () => void
  onEdit: () => void
  onDelete: () => void
}

export const ObjectPage = ({
  site,
  tasks,
  role,
  nameOf,
  busy,
  onCreateTask,
  onEdit,
  onDelete,
}: ObjectPageProps) => {
  const navigate = useNavigate()
  if (!site) return <NotFoundPage message="Объект не найден или у вас нет к нему доступа." />

  return (
    <ObjectDetails
      site={site}
      tasks={tasks}
      role={role}
      nameOf={nameOf}
      busy={busy}
      onBack={() => navigate(ROUTES.OBJECTS)}
      onCreateTask={onCreateTask}
      onEdit={onEdit}
      onDelete={onDelete}
      onSelectTask={(task) => navigate(ROUTES.task(task.id))}
    />
  )
}
