import { useCallback, useEffect, useRef, useState } from 'react'
import { getCrmSnapshot, type CrmSnapshot } from '@/api/crm'

export const useCrmData = (userId: string | null) => {
  const [snapshot, setSnapshot] = useState<{
    userId: string
    data: CrmSnapshot
    revision: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ userId: string; message: string } | null>(null)
  const requestId = useRef(0)

  const reload = useCallback(async () => {
    if (!userId) return
    const currentRequest = ++requestId.current
    setLoading(true)
    try {
      const data = await getCrmSnapshot(userId)
      if (currentRequest === requestId.current) {
        setSnapshot((previous) => ({ userId, data, revision: (previous?.revision ?? 0) + 1 }))
        setError(null)
      }
    } catch (issue) {
      if (currentRequest === requestId.current)
        setError({
          userId,
          message: issue instanceof Error ? issue.message : 'Не удалось загрузить данные',
        })
      throw issue
    } finally {
      if (currentRequest === requestId.current) setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    // Data is fetched asynchronously; state changes after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload().catch(() => {})
    return () => {
      requestId.current += 1
    }
  }, [reload])

  return {
    data: snapshot?.userId === userId ? snapshot.data : null,
    revision: snapshot?.userId === userId ? snapshot.revision : 0,
    loading:
      Boolean(userId) && (loading || (snapshot?.userId !== userId && error?.userId !== userId)),
    error: error?.userId === userId ? error.message : '',
    clearError: () => setError(null),
    reload,
  }
}
