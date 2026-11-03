import { useEffect, useState } from 'react'
import { getTaskHistory } from '@/api/crm'
import type { Event } from '@/lib'

export const useTaskHistory = (taskId: string | null, revision: number) => {
  const [result, setResult] = useState<{ taskId: string; events: Event[] } | null>(null)
  const [error, setError] = useState<{ taskId: string; message: string } | null>(null)

  useEffect(() => {
    if (!taskId) return
    let active = true
    void getTaskHistory(taskId)
      .then((events) => {
        if (active) {
          setResult({ taskId, events })
          setError(null)
        }
      })
      .catch((issue: unknown) => {
        if (active)
          setError({
            taskId,
            message: issue instanceof Error ? issue.message : 'Не удалось загрузить историю',
          })
      })
    return () => {
      active = false
    }
  }, [taskId, revision])

  return {
    history: result?.taskId === taskId ? result.events : [],
    error: error?.taskId === taskId ? error.message : '',
    clearError: () => setError(null),
  }
}
