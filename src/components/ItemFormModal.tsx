import { useState } from 'react'
import type { Category } from '@/types'

interface ItemFormProps {
  categories: Category[]
  initial?: {
    name: string
    categoryId: string
    targetQuantity: number
    currentQuantity: number
  }
  onSubmit: (data: {
    name: string
    categoryId: string
    targetQuantity: number
    currentQuantity: number
  }) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
  title: string
}

export function ItemFormModal({
  categories,
  initial,
  onSubmit,
  onDelete,
  onClose,
  title,
}: ItemFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '')
  const [targetQuantity, setTargetQuantity] = useState(initial?.targetQuantity ?? 1)
  const [currentQuantity, setCurrentQuantity] = useState(initial?.currentQuantity ?? 0)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !categoryId) return

    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        categoryId,
        targetQuantity,
        currentQuantity,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-app bg-surface p-5 shadow-2xl shadow-black/40">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-app">{title}</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-app">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-label">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-app mt-1 w-full rounded-lg border px-3 py-2.5"
              placeholder="e.g. Milk"
              autoFocus
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-label">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="input-app mt-1 w-full rounded-lg border px-3 py-2.5"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium text-label">Target at home</span>
              <input
                type="number"
                min={0}
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(Number(e.target.value))}
                className="input-app mt-1 w-full rounded-lg border px-3 py-2.5"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-label">Current stock</span>
              <input
                type="number"
                min={0}
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(Number(e.target.value))}
                className="input-app mt-1 w-full rounded-lg border px-3 py-2.5"
              />
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            {onDelete && (
              <button
                type="button"
                onClick={async () => {
                  setSaving(true)
                  try {
                    await onDelete()
                    onClose()
                  } finally {
                    setSaving(false)
                  }
                }}
                className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 active:bg-red-500/10"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="btn-primary ml-auto flex-1 rounded-lg py-2.5 text-sm font-medium"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
