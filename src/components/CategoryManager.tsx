import { useState } from 'react'
import type { Category } from '@/types'

interface CategoryManagerProps {
  categories: Category[]
  onAdd: (name: string) => Promise<void>
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function CategoryManager({ categories, onAdd, onRename, onDelete }: CategoryManagerProps) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    await onAdd(newName.trim())
    setNewName('')
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-label">Categories</h3>

      <ul className="space-y-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex items-center gap-2 rounded-xl border border-app bg-surface px-3 py-2"
          >
            {editingId === cat.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-app min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-sm"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={async () => {
                    await onRename(cat.id, editName)
                    setEditingId(null)
                  }}
                  className="text-sm font-medium text-accent"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate font-medium text-app">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(cat.id)
                    setEditName(cat.name)
                  }}
                  className="text-sm text-muted hover:text-app"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(cat.id)}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="input-app min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="btn-primary rounded-lg px-4 py-2 text-sm font-medium"
        >
          Add
        </button>
      </form>
    </div>
  )
}
