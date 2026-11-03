import { useState } from 'react'
import { EDITOR_KIND, ROLES, SCREENS, TASK_STATUS, type EditorKind, type Screen } from './constants'
import { configured, type Status } from './lib'
import {
  createObject,
  createTask,
  deleteObject as removeObject,
  deleteTask as removeTask,
  transitionTask,
  updateObject,
  updateTask,
} from '@/api/crm'
import { useAuth } from '@/hooks/useAuth'
import { useCrmData } from '@/hooks/useCrmData'
import { useTaskHistory } from '@/hooks/useTaskHistory'
import { AppShell } from '@/components/AppShell'
import { LoginForm } from '@/components/LoginForm'
import { ObjectList } from '@/components/ObjectList'
import { ObjectDetails } from '@/components/ObjectDetails'
import { MyTasks } from '@/components/MyTasks'
import { TaskDetails } from '@/components/TaskDetails'
import { ObjectEditor, type ObjectInput } from '@/components/ObjectEditor'
import { TaskEditor, type TaskInput } from '@/components/TaskEditor'
import { ReworkDialog } from '@/components/ReworkDialog'
import styles from './App.module.scss'
import ui from '@/styles/ui.module.scss'

type EditorState = { kind: EditorKind; id?: string } | null

const App = () => {
  const { user, loading: authLoading, signIn, signOut } = useAuth()
  const {
    data,
    revision,
    loading: dataLoading,
    error: dataError,
    clearError: clearDataError,
    reload,
  } = useCrmData(user?.id ?? null)
  const profile = data?.profile ?? null
  const objects = data?.objects ?? []
  const tasks = data?.tasks ?? []
  const profiles = data?.profiles ?? []
  const [screen, setScreen] = useState<Screen>(SCREENS.OBJECTS)
  const [objectId, setObjectId] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState>(null)
  const [reworkTaskId, setReworkTaskId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const {
    history,
    error: historyError,
    clearError: clearHistoryError,
  } = useTaskHistory(user ? taskId : null, revision)
  const error = actionError || dataError || historyError

  const clearErrors = () => {
    setActionError('')
    clearDataError()
    clearHistoryError()
  }

  const logOut = () => {
    clearErrors()
    void signOut().catch((issue: unknown) =>
      setActionError(issue instanceof Error ? issue.message : 'Не удалось выйти'),
    )
  }

  const run = async (action: () => Promise<void>): Promise<boolean> => {
    if (!user) return false
    setBusy(true)
    clearErrors()
    try {
      await action()
      await reload()
      return true
    } catch (issue) {
      setActionError(issue instanceof Error ? issue.message : 'Не удалось выполнить действие')
      return false
    } finally {
      setBusy(false)
    }
  }

  const transition = async (status: Status, requiresComment: boolean) => {
    if (!taskId) return
    if (requiresComment) {
      setReworkTaskId(taskId)
      return
    }
    await run(() => transitionTask(taskId, status))
  }

  const saveRework = async (comment: string) => {
    if (!reworkTaskId) return
    const ok = await run(() => transitionTask(reworkTaskId, TASK_STATUS.REWORK, comment))
    if (ok) setReworkTaskId(null)
  }

  const saveObject = async (input: ObjectInput) => {
    const ok = await run(() => (editor?.id ? updateObject(editor.id, input) : createObject(input)))
    if (ok) setEditor(null)
  }

  const saveTask = async (input: TaskInput) => {
    if (!user) return
    const ok = await run(() =>
      editor?.id ? updateTask(editor.id, input) : createTask(input, user.id),
    )
    if (ok) {
      if (editor?.id && taskId === editor.id) setObjectId(input.object_id)
      setEditor(null)
    }
  }

  const deleteTask = async () => {
    if (!taskId || !window.confirm('Удалить задачу и её историю?')) return
    const ok = await run(() => removeTask(taskId))
    if (ok) setTaskId(null)
  }

  const deleteObject = async () => {
    if (!objectId || !window.confirm('Удалить объект вместе со всеми задачами и историей?')) return
    const ok = await run(() => removeObject(objectId))
    if (ok) setObjectId(null)
  }

  const navigate = (next: Screen) => {
    setScreen(next)
    setObjectId(null)
    setTaskId(null)
  }

  const selectedObject = objects.find((site) => site.id === objectId)
  const selectedTask = tasks.find((task) => task.id === taskId)
  const objectTasks = tasks.filter((task) => task.object_id === objectId)
  const mine = tasks.filter((task) => task.assignee_id === user?.id)
  const nameOf = (id: string) =>
    profiles.find((person) => person.id === id)?.full_name ?? 'Пользователь'
  const objectName = (id: string) => objects.find((site) => site.id === id)?.name ?? 'Объект'

  if (!configured)
    return (
      <div className={styles.setup}>
        <h1>Объекты и задачи</h1>
        <p>
          Укажите <code>VITE_SUPABASE_URL</code> и <code>VITE_SUPABASE_ANON_KEY</code> в файле{' '}
          <code>.env</code>, затем запустите приложение.
        </p>
        <p>Порядок настройки описан в README.</p>
      </div>
    )
  if (authLoading)
    return (
      <div className={styles.setup}>
        <h1>Проверка входа</h1>
        <p>Загружаем сессию…</p>
      </div>
    )
  if (!user) return <LoginForm onSignIn={signIn} />
  if (dataLoading)
    return (
      <div className={styles.setup}>
        <h1>Загрузка профиля</h1>
        <p>Загружаем данные пользователя…</p>
      </div>
    )
  if (!data && dataError)
    return (
      <div className={styles.setup}>
        <h1>Не удалось загрузить данные</h1>
        <p className={ui.error}>{dataError}</p>
        <button onClick={() => void reload().catch(() => {})}>Повторить</button>
        <button onClick={logOut}>Выйти</button>
      </div>
    )
  if (!profile)
    return (
      <div className={styles.setup}>
        <h1>Профиль недоступен</h1>
        <p>
          Для этого пользователя нужен профиль в таблице <code>profiles</code>.
        </p>
        {error && <p className={ui.error}>{error}</p>}
        <button onClick={logOut}>Выйти</button>
      </div>
    )

  let content
  if (selectedTask) {
    content = (
      <TaskDetails
        task={selectedTask}
        history={history}
        profile={profile}
        objectName={objectName(selectedTask.object_id)}
        nameOf={nameOf}
        busy={busy}
        onBack={() => setTaskId(null)}
        onTransition={(status, requiresComment) => {
          void transition(status, requiresComment)
        }}
        onEdit={() => setEditor({ kind: EDITOR_KIND.TASK, id: selectedTask.id })}
        onDelete={() => {
          void deleteTask()
        }}
      />
    )
  } else if (selectedObject) {
    content = (
      <ObjectDetails
        site={selectedObject}
        tasks={objectTasks}
        role={profile.role}
        nameOf={nameOf}
        busy={busy}
        onBack={() => setObjectId(null)}
        onCreateTask={() => setEditor({ kind: EDITOR_KIND.TASK })}
        onEdit={() => setEditor({ kind: EDITOR_KIND.OBJECT, id: selectedObject.id })}
        onDelete={() => {
          void deleteObject()
        }}
        onSelectTask={(task) => setTaskId(task.id)}
      />
    )
  } else if (screen === SCREENS.MINE) {
    content = (
      <MyTasks
        tasks={mine}
        objectName={objectName}
        onSelect={(task) => {
          setObjectId(task.object_id)
          setTaskId(task.id)
        }}
      />
    )
  } else {
    content = (
      <ObjectList
        objects={objects}
        tasks={tasks}
        role={profile.role}
        onSelect={setObjectId}
        onCreate={() => setEditor({ kind: EDITOR_KIND.OBJECT })}
      />
    )
  }

  return (
    <>
      <AppShell
        profile={profile}
        screen={screen}
        selectedObject={selectedObject}
        selectedTask={selectedTask}
        onNavigate={navigate}
        onBackToObject={() => setTaskId(null)}
        onSignOut={logOut}
      >
        {error && (
          <div className={styles.errorBanner}>
            {error}
            <button onClick={clearErrors}>×</button>
          </div>
        )}
        {content}
      </AppShell>

      {editor?.kind === EDITOR_KIND.OBJECT && (
        <ObjectEditor
          key={editor.id ?? 'new-object'}
          site={objects.find((site) => site.id === editor.id)}
          busy={busy}
          error={error}
          onClose={() => setEditor(null)}
          onSave={saveObject}
        />
      )}
      {editor?.kind === EDITOR_KIND.TASK && (
        <TaskEditor
          key={editor.id ?? 'new-task'}
          task={tasks.find((task) => task.id === editor.id)}
          objectId={objectId}
          objects={objects}
          executors={profiles.filter((person) => person.role === ROLES.EXECUTOR)}
          busy={busy}
          error={error}
          onClose={() => setEditor(null)}
          onSave={saveTask}
        />
      )}
      {reworkTaskId && (
        <ReworkDialog
          busy={busy}
          error={error}
          onClose={() => setReworkTaskId(null)}
          onSave={saveRework}
        />
      )}
    </>
  )
}

export default App
