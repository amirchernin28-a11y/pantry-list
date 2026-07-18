import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { CategoryManager } from '@/components/CategoryManager'
import { ThemeSampler } from '@/components/ThemeSampler'
import { VersionFooter } from '@/components/VersionFooter'
import { clearHouseholdId, getInviteUrl } from '@/lib/household'
import type { AppContext } from '@/App'

type SettingsTab = 'general' | 'appearance'

const settingsTabs: { id: SettingsTab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
]

export function SettingsPage() {
  const navigate = useNavigate()
  const { household, updateHouseholdName, categories, addCategory, renameCategory, deleteCategory } =
    useOutletContext<AppContext>()

  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [homeName, setHomeName] = useState(household.name)
  const [copied, setCopied] = useState(false)
  const inviteUrl = getInviteUrl(household.invite_code)

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const leaveHome = () => {
    if (!confirm('Leave this home? You can rejoin with the invite link from your partner.')) return
    clearHouseholdId()
    navigate('/welcome', { replace: true })
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-app">Settings</h1>
      </header>

      <nav
        className="flex gap-1 rounded-xl border border-app bg-surface p-1"
        role="tablist"
        aria-label="Settings sections"
      >
        {settingsTabs.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selected ? 'bg-accent-muted text-accent' : 'text-muted hover:text-app'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      {activeTab === 'general' && (
        <>
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
            <p className="mt-1 text-sm text-muted">Send this link to your partner so they can join on their phone</p>

            <div className="mt-4 rounded-lg border border-app bg-app px-4 py-3">
              <p className="break-all text-sm text-app">{inviteUrl}</p>
            </div>

            <button
              type="button"
              onClick={copyInvite}
              className="btn-primary mt-3 w-full rounded-lg py-2.5 text-sm font-medium"
            >
              {copied ? 'Copied!' : 'Copy invite link'}
            </button>
          </section>

          <section className="rounded-2xl border border-app bg-surface p-5">
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
            className="w-full rounded-lg border border-red-500/30 py-3 text-sm font-medium text-red-400 active:bg-red-500/10"
          >
            Leave home
          </button>
        </>
      )}

      {activeTab === 'appearance' && <ThemeSampler />}

      <VersionFooter />
    </div>
  )
}
