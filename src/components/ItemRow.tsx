import type { Item } from '@/types'
import { isLowStock } from '@/types'

interface ItemRowProps {
  item: Item
  onDecrement: () => void
  onIncrement: () => void
  onEdit: () => void
}

export function ItemRow({ item, onDecrement, onIncrement, onEdit }: ItemRowProps) {
  const low = isLowStock(item)

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${
        low ? 'border-amber-500/30 bg-amber-500/10' : 'border-slate-800 bg-slate-900'
      }`}
    >
      <button
        type="button"
        onClick={onEdit}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate font-medium text-slate-100">{item.name}</p>
        <p className={`text-sm ${low ? 'text-amber-300' : 'text-slate-400'}`}>
          {item.current_quantity} / {item.target_quantity}
          {low && ' · needs restock'}
        </p>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onDecrement}
          disabled={item.current_quantity <= 0}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-lg font-medium text-slate-200 active:bg-slate-700 disabled:opacity-30"
          aria-label={`Use one ${item.name}`}
        >
          −
        </button>
        <button
          type="button"
          onClick={onIncrement}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/15 text-lg font-medium text-brand-500 active:bg-brand-500/25"
          aria-label={`Add one ${item.name}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
