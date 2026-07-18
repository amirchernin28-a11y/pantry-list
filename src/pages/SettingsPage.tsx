import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { CategoryManager } from '@/components/CategoryManager'
import { ThemeSampler } from '@/components/ThemeSampler'
import { VersionFooter } from '@/components/VersionFooter'
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
    navigate('/welcome', { replace: true })
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-app">Settings</h1>
      </header>

      <section className="rounded-2xl border border-app bg-surface p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-label">Home name</h3>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={homeName}
            onChange={(e) => setHomeName(e.target.value)}
            className="input-app min-w-0 flex-1 rounded-lg border px-3 py-2"
          />
          <button
            type="button"
            onClick={() => updateHouseholdName(homeName.trim())}
            disabled={!homeName.trim() || homeName.trim() === household.name}
            className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
          >
            Save
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-app bg-surface p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-label">
          Invite partner
        </h3>
        <p className="mt-1 text-sm text-muted">
          Share this link or code so your partner can join on their phone
        </p>

        <div className="mt-4 rounded-lg border border-app bg-app px-4 py-3">
          <p className="text-xs text-muted">Invite code</p>
          <p className="font-mono text-2xl font-bold tracking-widest text-app">
            {household.invite_code}
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={copyInvite}
            className="btn-primary flex-1 rounded-lg py-2.5 text-sm font-medium"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button
            type="button"
            onClick={copyCode}
            className="rounded-lg border border-app-muted px-4 py-2.5 text-sm font-medium text-app active:bg-surface-elevated"
          >
            Copy code
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-app bg-surface p-5">
        <CategoryManager
          categories={categories}
          onAdd={addCategory}
          onRename={renameCategory}
          onDelete={deleteCategory}
        />
      </section>

      <ThemeSampler />

      <button
        type="button"
        onClick={leaveHome}
        className="w-full rounded-lg border border-red-500/30 py-3 text-sm font-medium text-red-400 active:bg-red-500/10"
      >
        Leave home
      </button>

      <VersionFooter />
    </div>
  )
}
