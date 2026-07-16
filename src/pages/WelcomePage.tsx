import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useHousehold } from '@/hooks/useHousehold'
import { storeHouseholdId } from '@/lib/household'
import { isSupabaseConfigured } from '@/lib/supabase'

export function WelcomePage() {
  const navigate = useNavigate()
  const { code: urlCode } = useParams()
  const { createHousehold, joinHousehold, loading, error } = useHousehold(null)
  const [joinCode, setJoinCode] = useState(urlCode?.toUpperCase() ?? '')
  const [homeName, setHomeName] = useState('Our Home')

  const handleCreate = async () => {
    const household = await createHousehold(homeName.trim() || 'My Home')
    storeHouseholdId(household.id)
    navigate('/')
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const household = await joinHousehold(joinCode)
    storeHouseholdId(household.id)
    navigate('/')
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-amber-900">Setup required</h1>
          <p className="mt-2 text-sm text-amber-800">
            Copy <code className="rounded bg-amber-100 px-1">.env.example</code> to{' '}
            <code className="rounded bg-amber-100 px-1">.env</code> and add your Supabase
            credentials. See README for details.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-3xl text-white">
          🏠
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Pantry List</h1>
        <p className="mt-2 text-gray-500">
          Track what you have at home. Shop when you run low.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Create a home</h2>
          <p className="mt-1 text-sm text-gray-500">Start fresh and invite your partner</p>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-gray-700">Home name</span>
            <input
              type="text"
              value={homeName}
              onChange={(e) => setHomeName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Join with invite code</h2>
          <p className="mt-1 text-sm text-gray-500">Enter the code from your partner</p>

          <form onSubmit={handleJoin} className="mt-4 space-y-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC12345"
              maxLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-center font-mono text-lg tracking-widest focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={loading || joinCode.length < 6}
              className="w-full rounded-lg border border-gray-300 py-3 font-medium text-gray-900 active:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Joining…' : 'Join home'}
            </button>
          </form>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
      </div>
    </div>
  )
}
