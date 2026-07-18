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
  const [joinCode, setJoinCode] = useState(urlCode?.toUpperCase() ?? '')
  const [homeName, setHomeName] = useState('Our Home')
  const [joinFailed, setJoinFailed] = useState(false)
  const autoJoinAttempted = useRef(false)

  const isJoinLink = Boolean(urlCode)
  const isAutoJoining = isJoinLink && !joinFailed

  const performJoin = async (code: string) => {
    const normalized = code.trim().toUpperCase()
    if (normalized.length < 6) throw new Error('Invalid invite code. Check the link and try again.')
    const household = await joinHousehold(normalized)
    storeHouseholdId(household.id)
    navigate('/')
  }

  const handleCreate = async () => {
    const household = await createHousehold(homeName.trim() || 'My Home')
    storeHouseholdId(household.id)
    navigate('/')
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinFailed(false)
    try {
      await performJoin(joinCode)
    } catch {
      setJoinFailed(true)
    }
  }

  useEffect(() => {
    if (!urlCode || autoJoinAttempted.current) return
    autoJoinAttempted.current = true
    performJoin(urlCode).catch(() => setJoinFailed(true))
  }, [urlCode])

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4">
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
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4">
        <div className="flex flex-1 flex-col justify-center text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-3xl text-white">
            🏠
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Joining home…</h1>
          <p className="mt-2 text-slate-400">
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
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-3xl text-white">
          🏠
        </div>
        <h1 className="text-2xl font-bold text-slate-100">Pantry List</h1>
        <p className="mt-2 text-slate-400">
          {isJoinLink && !joinFailed
            ? 'Enter the invite code below to join your partner\u2019s home.'
            : 'Track what you have at home. Shop when you run low.'}
        </p>
      </div>

      <div className="space-y-6">
        {existingHouseholdId && isJoinLink && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            You&apos;re already in a home. Joining will switch you to your partner&apos;s list.
          </p>
        )}

        {(!isJoinLink || joinFailed) && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold text-slate-100">Create a home</h2>
          <p className="mt-1 text-sm text-slate-400">Start fresh and invite your partner</p>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-300">Home name</span>
            <input
              type="text"
              value={homeName}
              onChange={(e) => setHomeName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </label>

          <button
            type="button"
            onClick={handleCreate}
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-brand-600 py-3 font-medium text-white active:bg-brand-700 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create home'}
          </button>
        </div>
        )}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="font-semibold text-slate-100">Join with invite code</h2>
          <p className="mt-1 text-sm text-slate-400">
            {isJoinLink && joinFailed
              ? 'Could not join automatically. Check the code and try again.'
              : 'Enter the code from your partner'}
          </p>

          <form onSubmit={handleJoin} className="mt-4 space-y-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC12345"
              maxLength={8}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-center font-mono text-lg tracking-widest text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={loading || joinCode.length < 6}
              className="w-full rounded-lg border border-slate-700 py-3 font-medium text-slate-100 active:bg-slate-800 disabled:opacity-50"
            >
              {loading ? 'Joining…' : 'Join home'}
            </button>
          </form>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
        )}
      </div>
      </div>
      <VersionFooter />
    </div>
  )
}
