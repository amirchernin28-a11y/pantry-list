import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { CategoryManager } from '@/components/CategoryManager'
import { clearHouseholdId, getInviteUrl } from '@/lib/household'
import type { AppContext } from '@/App'

export function SettingsPage() {
  const navigate = useNavigate()
  const { household, updateHouseholdName, categories, addCategory, renameCategory, deleteCategory } =
    useOutletContext<AppContext>()

  const [homeName, setHomeName] = useState(household.name)
  const [copied, setCopied] = useState(false)
  const inviteUrl = getInviteUrl(household.invite_code)

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(household.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const leaveHome = () => {
    if (!confirm('Leave this home? You can rejoin with the invite code.')) return
    clearHouseholdId()
    navigate('/welcome')
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Home name</h3>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={homeName}
            onChange={(e) => setHomeName(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="button"
            onClick={() => updateHouseholdName(homeName.trim())}
            disabled={!homeName.trim() || homeName.trim() === household.name}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Invite partner
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Share this link or code so your partner can join on their phone
        </p>

        <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-500">Invite code</p>
          <p className="font-mono text-2xl font-bold tracking-widest text-gray-900">
            {household.invite_code}
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={copyInvite}
            className="flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white active:bg-brand-700"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 active:bg-gray-50"
          >
            Copy code
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <CategoryManager
          categories={categories}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
        />
      </section>

      <button
        type="button"
        onClick={leaveHome}
        className="w-full rounded-lg border border-red-200 py-3 text-sm font-medium text-red-600 active:bg-red-50"
      >
        Leave home
      </button>
    </div>
  )
}
