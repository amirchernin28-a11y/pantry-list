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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              placeholder="e.g. Milk"
              autoFocus
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Category</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
              <span className="text-sm font-medium text-gray-700">Target at home</span>
              <input
                type="number"
                min={0}
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Current stock</span>
              <input
                type="number"
                min={0}
                value={currentQuantity}
                onChange={(e) => setCurrentQuantity(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
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
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 active:bg-red-50"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="ml-auto flex-1 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white active:bg-brand-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
