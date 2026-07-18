import type { ShoppingNeed } from '@/types'

interface ShoppingItemProps {
  entry: ShoppingNeed
  onPurchase: () => void
}

export function ShoppingItem({ entry, onPurchase }: ShoppingItemProps) {
  const { item, category, needed } = entry

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-100">{item.name}</p>
        <p className="text-sm text-slate-400">
          {category.name} · buy {needed}
        </p>
      </div>

      <button
        type="button"
        onClick={onPurchase}
        className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white active:bg-brand-700"
      >
        Got it
      </button>
    </div>
  )
}
