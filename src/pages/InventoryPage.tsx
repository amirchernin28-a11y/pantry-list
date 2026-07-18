import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ItemRow } from '@/components/ItemRow'
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
          <h1 className="text-2xl font-bold text-slate-100">{household.name}</h1>
          <p className="text-sm text-slate-400">Tap − when you use something</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white active:bg-brand-700"
        >
          + Add item
        </button>
      </header>

      {categories.length === 0 ? (
        <p className="text-center text-slate-400">Add categories in Settings first.</p>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryItems = itemsByCategory.get(category.id) ?? []
            if (categoryItems.length === 0) return null

            return (
              <section key={category.id}>
                <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
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
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-12 text-center">
              <p className="text-slate-400">No items yet</p>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="mt-3 text-sm font-medium text-brand-500"
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
    </div>
  )
}
