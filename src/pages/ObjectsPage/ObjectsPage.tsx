import { useNavigate } from 'react-router'
import { ROUTES } from '@/constants'
import type { Profile, Site, Task } from '@/lib'
import { ObjectList } from '@/components/ObjectList'

type ObjectsPageProps = {
  objects: Site[]
  tasks: Task[]
  role: Profile['role']
  onCreate: () => void
}

export const ObjectsPage = ({ objects, tasks, role, onCreate }: ObjectsPageProps) => {
  const navigate = useNavigate()

  return (
    <ObjectList
      objects={objects}
      tasks={tasks}
      role={role}
      onSelect={(id) => navigate(ROUTES.object(id))}
      onCreate={onCreate}
    />
  )
}
