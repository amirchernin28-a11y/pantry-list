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
        low ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'
      }`}
    >
      <button
        type="button"
        onClick={onEdit}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate font-medium text-gray-900">{item.name}</p>
        <p className={`text-sm ${low ? 'text-amber-700' : 'text-gray-500'}`}>
          {item.current_quantity} / {item.target_quantity}
          {low && ' · needs restock'}
        </p>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onDecrement}
          disabled={item.current_quantity <= 0}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg font-medium text-gray-700 active:bg-gray-200 disabled:opacity-30"
          aria-label={`Use one ${item.name}`}
        >
          −
        </button>
        <button
          type="button"
          onClick={onIncrement}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-lg font-medium text-brand-700 active:bg-brand-100/80"
          aria-label={`Add one ${item.name}`}
        >
          +
        </button>
      </div>
    </div>
  )
}
