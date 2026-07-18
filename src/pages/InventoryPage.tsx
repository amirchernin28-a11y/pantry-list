import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ItemRow } from '@/components/ItemRow'
import { VersionFooter } from '@/components/VersionFooter'
import { ItemFormModal } from '@/components/ItemFormModal'
import type { AppContext } from '@/App'
import type { Item } from '@/types'

export function InventoryPage() {
  const { household, categories, itemsByCategory, addItem, updateItem, deleteItem, decrementQuantity, incrementQuantity } =
    useOutletContext<AppContext>()

  const [showAdd, setShowAdd] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)

  return (
    <div>
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

      {categories.length === 0 ? (
        <p className="text-center text-muted">Add categories in Settings first.</p>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = itemsByCategory.get(category.id) ?? []
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

          {Array.from(itemsByCategory.values()).every((list) => list.length === 0) && (
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
