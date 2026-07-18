import { useOutletContext } from 'react-router-dom'
import { ShoppingItem } from '@/components/ShoppingItem'
import { getNeededQuantity } from '@/types'
import type { AppContext } from '@/App'

export function ShoppingPage() {
  const { shoppingList, markPurchased } = useOutletContext<AppContext>()

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-app">Shopping list</h1>
        <p className="text-sm text-muted">
          Items below your target stock · {shoppingList.length} to buy
        </p>
      </header>

      {shoppingList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-app-muted bg-surface/50 px-6 py-12 text-center">
          <p className="text-4xl text-accent">✓</p>
          <p className="mt-3 font-medium text-app">All stocked up!</p>
          <p className="mt-1 text-sm text-muted">Nothing to buy right now</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shoppingList.map((entry) => (
            <ShoppingItem
              key={entry.item.id}
              entry={entry}
              onPurchase={() => markPurchased(entry.item.id, getNeededQuantity(entry.item))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
