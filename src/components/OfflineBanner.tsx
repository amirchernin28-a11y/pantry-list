import { useEffect, useState } from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { getPendingOpsCount } from '@/lib/offline/db'
import { getStoredHouseholdId } from '@/lib/household'

export function OfflineBanner() {
  const online = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const householdId = getStoredHouseholdId()

  useEffect(() => {
    if (!householdId) return

    const refresh = () => {
      void getPendingOpsCount(householdId).then(setPendingCount)
    }

    refresh()
    window.addEventListener('offline-queue-changed', refresh)
    window.addEventListener('offline-sync-complete', refresh)
    return () => {
      window.removeEventListener('offline-queue-changed', refresh)
      window.removeEventListener('offline-sync-complete', refresh)
    }
  }, [householdId])

  if (online && pendingCount === 0) return null

  const message = online
    ? 'Syncing…'
    : 'Offline — changes saved, will sync when connected'

  return (
    <div
      className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-200"
      role="status"
    >
      {message}
    </div>
  )
}
