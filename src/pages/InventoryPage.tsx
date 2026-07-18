import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ItemRow } from '@/components/ItemRow'
import { VersionFooter } from '@/components/VersionFooter'
import { ItemFormModal } from '@/components/ItemFormModal'
import type { AppContext } from '@/App'
import type { Item } from '@/types'

export function InventoryPage() {
  const { household, categories, itemsByCategory, addItem, updateItem, deleteItem, decrementQuantity, incrementQuantity, mutationError } =
    useOutletContext<AppContext>()

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isSearchActive = normalizedQuery.length > 0

  const filterItems = (items: Item[]) => {
    if (!isSearchActive) return items
    return items.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
  }

  const hasAnyItems = Array.from(itemsByCategory.values()).some((list) => list.length > 0)
  const hasMatchingItems = categories.some(
    (category) => filterItems(itemsByCategory.get(category.id) ?? []).length > 0,
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-app">{household.name}</h1>
          <p className="text-sm text-muted">Tap − when you use something</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="btn-primary shrink-0 rounded-lg px-4 py-2 text-sm font-medium"
        >
          + Add item
        </button>
      </header>

      {mutationError && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
          {mutationError}
        </p>
      )}

      <div className="relative mb-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items…"
          className="input-app w-full rounded-lg border px-3 py-2.5 pr-10"
          aria-label="Search items"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-muted hover:text-app"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {categories.length === 0 ? (
        <p className="text-center text-muted">Add categories in Settings first.</p>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = filterItems(itemsByCategory.get(category.id) ?? [])
            if (categoryItems.length === 0) return null

            return (
              <section key={category.id}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-label">
                  {category.name}
                </h2>
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onDecrement={() => decrementQuantity(item.id)}
                      onIncrement={() => incrementQuantity(item.id)}
                      onEdit={() => setEditingItem(item)}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          {isSearchActive && hasAnyItems && !hasMatchingItems && (
            <div className="rounded-2xl border border-dashed border-app-muted bg-surface/50 px-6 py-12 text-center">
              <p className="text-muted">No items match your search</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-sm font-medium text-accent"
              >
                Clear search
              </button>
            </div>
          )}

          {!isSearchActive && !hasAnyItems && (
            <div className="rounded-2xl border border-dashed border-app-muted bg-surface/50 px-6 py-12 text-center">
              <p className="text-muted">No items yet</p>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="mt-3 text-sm font-medium text-accent"
              >
                Add your first item
              </button>
            </div>
          )}
        </div>
      )}
      </div>

      {showAdd && (
        <ItemFormModal
          title="Add item"
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSubmit={async (data) => {
            await addItem(data.name, data.categoryId, data.targetQuantity, data.currentQuantity)
          }}
        />
      )}

      {editingItem && (
        <ItemFormModal
          title="Edit item"
          categories={categories}
          initial={{
            name: editingItem.name,
            categoryId: editingItem.category_id,
            targetQuantity: editingItem.target_quantity,
            currentQuantity: editingItem.current_quantity,
          }}
          onClose={() => setEditingItem(null)}
          onSubmit={async (data) => {
            await updateItem(editingItem.id, {
              name: data.name,
              category_id: data.categoryId,
              target_quantity: data.targetQuantity,
              current_quantity: data.currentQuantity,
            })
          }}
          onDelete={async () => {
            await deleteItem(editingItem.id)
          }}
        />
      )}

      <VersionFooter />
    </div>
  )
}
