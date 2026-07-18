import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useHousehold } from '@/hooks/useHousehold'
import { VersionFooter } from '@/components/VersionFooter'
import { getStoredHouseholdId, storeHouseholdId } from '@/lib/household'
import { isSupabaseConfigured } from '@/lib/supabase'

export function WelcomePage() {
  const navigate = useNavigate()
  const { code: urlCode } = useParams()
  const existingHouseholdId = getStoredHouseholdId()
  const { createHousehold, joinHousehold, loading, error } = useHousehold(null)
  const [homeName, setHomeName] = useState('Our Home')
  const [joinFailed, setJoinFailed] = useState(false)
  const autoJoinAttempted = useRef(false)

  const isJoinLink = Boolean(urlCode)
  const isAutoJoining = isJoinLink && !joinFailed

  const performJoin = async (code: string) => {
    const normalized = code.trim().toUpperCase()
    if (normalized.length < 6) throw new Error('Invalid invite link. Ask your partner for a fresh link.')
    const household = await joinHousehold(normalized)
    storeHouseholdId(household.id)
    navigate('/')
  }

  const handleCreate = async () => {
    const household = await createHousehold(homeName.trim() || 'My Home')
    storeHouseholdId(household.id)
    navigate('/')
  }

  useEffect(() => {
    if (!urlCode || autoJoinAttempted.current) return
    autoJoinAttempted.current = true
    performJoin(urlCode).catch(() => setJoinFailed(true))
  }, [urlCode])

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-app px-4">
        <div className="flex flex-1 flex-col justify-center">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
            <h1 className="text-xl font-semibold text-amber-300">Setup required</h1>
            <p className="mt-2 text-sm text-amber-200/90">
              Copy <code className="rounded bg-amber-500/20 px-1 text-amber-100">.env.example</code> to{' '}
              <code className="rounded bg-amber-500/20 px-1 text-amber-100">.env</code> and add your Supabase
              credentials. See README for details.
            </p>
          </div>
        </div>
        <VersionFooter />
      </div>
    )
  }

  if (isAutoJoining) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-app px-4">
        <div className="flex flex-1 flex-col justify-center text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl text-white">
            🏠
          </div>
          <h1 className="text-2xl font-bold text-app">Joining home…</h1>
          <p className="mt-2 text-muted">
            {existingHouseholdId
              ? 'Switching to your partner\u2019s pantry list.'
              : 'Connecting you to your partner\u2019s pantry list.'}
          </p>
        </div>
        <VersionFooter />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-app px-4">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-3xl text-white">
            🏠
          </div>
          <h1 className="text-2xl font-bold text-app">Pantry List</h1>
          <p className="mt-2 text-muted">Track what you have at home. Shop when you run low.</p>
        </div>

        <div className="space-y-6">
          {existingHouseholdId && isJoinLink && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              You&apos;re already in a home. Joining will switch you to your partner&apos;s list.
            </p>
          )}

          {isJoinLink && joinFailed && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
              <h2 className="font-semibold text-red-200">Couldn&apos;t join this home</h2>
              <p className="mt-2 text-sm text-red-200/90">
                This invite link may be expired or invalid. Ask your partner to send you a fresh link from
                Settings.
              </p>
              {urlCode && (
                <p className="mt-3 text-xs text-red-200/70">
                  Code in link: <span className="font-mono">{urlCode.toUpperCase()}</span>
                </p>
              )}
            </div>
          )}

          {(!isJoinLink || joinFailed) && (
            <div className="rounded-2xl border border-app bg-surface p-5">
              <h2 className="font-semibold text-app">Create a home</h2>
              <p className="mt-1 text-sm text-muted">Start fresh and invite your partner</p>

              <label className="mt-4 block">
                <span className="text-sm font-medium text-label">Home name</span>
                <input
                  type="text"
                  value={homeName}
                  onChange={(e) => setHomeName(e.target.value)}
                  className="input-app mt-1 w-full rounded-lg border px-3 py-2.5"
                />
              </label>

              <button
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="btn-primary mt-4 w-full rounded-lg py-3 font-medium"
              >
                {loading ? 'Creating…' : 'Create home'}
              </button>
            </div>
          )}

          {!isJoinLink && (
            <div className="rounded-2xl border border-app bg-surface p-5">
              <h2 className="font-semibold text-app">Join a home</h2>
              <p className="mt-2 text-sm text-muted">
                Already have a home? Open the invite link your partner shared with you.
              </p>
              <p className="mt-2 text-xs text-muted">
                Invite links look like <span className="font-mono">…/join/ABC12345</span>
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>
      </div>
      <VersionFooter />
    </div>
  )
}
