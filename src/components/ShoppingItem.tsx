import type { ShoppingNeed } from '@/types'

interface ShoppingItemProps {
  entry: ShoppingNeed
  onPurchase: () => void
}

export function ShoppingItem({ entry, onPurchase }: ShoppingItemProps) {
  const { item, category, needed } = entry

  return (
    <div className="flex items-center gap-3 rounded-xl border border-app bg-surface px-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-app">{item.name}</p>
        <p className="text-sm text-muted">
          {category.name} · buy {needed}
        </p>
      </div>

      <button
        type="button"
        onClick={onPurchase}
        className="btn-primary shrink-0 rounded-lg px-4 py-2 text-sm font-medium"
      >
        Got it
      </button>
    </div>
  )
}
