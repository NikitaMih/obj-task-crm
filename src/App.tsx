import { useState } from 'react'
import { Navigate, Route, Routes, useLocation, useMatch, useNavigate } from 'react-router'
import { EDITOR_KIND, ROLES, ROUTES, TASK_STATUS, type EditorKind } from './constants'
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
import { LoginPage } from '@/pages/LoginPage'
import { ObjectsPage } from '@/pages/ObjectsPage'
import { ObjectPage } from '@/pages/ObjectPage'
import { MyTasksPage } from '@/pages/MyTasksPage'
import { TaskPage } from '@/pages/TaskPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ObjectEditor, type ObjectInput } from '@/components/ObjectEditor'
import { TaskEditor, type TaskInput } from '@/components/TaskEditor'
import { ReworkDialog } from '@/components/ReworkDialog'
import styles from './App.module.scss'
import ui from '@/styles/ui.module.scss'

type EditorState = { kind: EditorKind; id?: string } | null

const App = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const objectMatch = useMatch(ROUTES.OBJECT_PATTERN)
  const taskMatch = useMatch(ROUTES.TASK_PATTERN)
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
  const taskId = taskMatch?.params.taskId ?? null
  const selectedTask = tasks.find((task) => task.id === taskId)
  const objectId = objectMatch?.params.objectId ?? selectedTask?.object_id ?? null
  const selectedObject = objects.find((site) => site.id === objectId)
  const [editor, setEditor] = useState<EditorState>(null)
  const [reworkTaskId, setReworkTaskId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const {
    history,
    error: historyError,
    clearError: clearHistoryError,
  } = useTaskHistory(user && selectedTask ? taskId : null, revision)
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
      setEditor(null)
    }
  }

  const deleteTask = async () => {
    if (!taskId || !window.confirm('Удалить задачу и её историю?')) return
    const ok = await run(() => removeTask(taskId))
    if (ok) navigate(selectedTask ? ROUTES.object(selectedTask.object_id) : ROUTES.OBJECTS)
  }

  const deleteObject = async () => {
    if (!objectId || !window.confirm('Удалить объект вместе со всеми задачами и историей?')) return
    const ok = await run(() => removeObject(objectId))
    if (ok) navigate(ROUTES.OBJECTS)
  }

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
  if (!user)
    return location.pathname === ROUTES.LOGIN ? (
      <LoginPage onSignIn={signIn} />
    ) : (
      <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />
    )
  if (location.pathname === ROUTES.LOGIN) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? ROUTES.OBJECTS} replace />
  }
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

  return (
    <>
      <AppShell
        profile={profile}
        selectedObject={selectedObject}
        selectedTask={selectedTask}
        onSignOut={logOut}
      >
        {error && (
          <div className={styles.errorBanner}>
            {error}
            <button onClick={clearErrors}>×</button>
          </div>
        )}
        <Routes>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.OBJECTS} replace />} />
          <Route
            path={ROUTES.OBJECTS}
            element={
              <ObjectsPage
                objects={objects}
                tasks={tasks}
                role={profile.role}
                onCreate={() => setEditor({ kind: EDITOR_KIND.OBJECT })}
              />
            }
          />
          <Route
            path={ROUTES.OBJECT_PATTERN}
            element={
              <ObjectPage
                site={selectedObject}
                tasks={objectTasks}
                role={profile.role}
                nameOf={nameOf}
                busy={busy}
                onCreateTask={() => setEditor({ kind: EDITOR_KIND.TASK })}
                onEdit={() =>
                  selectedObject && setEditor({ kind: EDITOR_KIND.OBJECT, id: selectedObject.id })
                }
                onDelete={() => void deleteObject()}
              />
            }
          />
          <Route
            path={ROUTES.TASK_PATTERN}
            element={
              <TaskPage
                task={selectedTask}
                history={history}
                profile={profile}
                objectName={selectedTask ? objectName(selectedTask.object_id) : ''}
                nameOf={nameOf}
                busy={busy}
                onTransition={(status, requiresComment) => void transition(status, requiresComment)}
                onEdit={() =>
                  selectedTask && setEditor({ kind: EDITOR_KIND.TASK, id: selectedTask.id })
                }
                onDelete={() => void deleteTask()}
              />
            }
          />
          <Route
            path={ROUTES.MY_TASKS}
            element={
              profile.role === ROLES.EXECUTOR ? (
                <MyTasksPage tasks={mine} objectName={objectName} />
              ) : (
                <Navigate to={ROUTES.OBJECTS} replace />
              )
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
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
