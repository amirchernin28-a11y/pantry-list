import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { WelcomePage } from '@/pages/WelcomePage'
import { InventoryPage } from '@/pages/InventoryPage'
import { ShoppingPage } from '@/pages/ShoppingPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { useHousehold } from '@/hooks/useHousehold'
import { useCategories } from '@/hooks/useCategories'
import { useItems } from '@/hooks/useItems'
import { clearHouseholdId, getStoredHouseholdId } from '@/lib/household'
import type { Category, Household, Item, ShoppingNeed } from '@/types'

export interface AppContext {
  household: Household
  categories: Category[]
  itemsByCategory: Map<string, Item[]>
  shoppingList: ShoppingNeed[]
  addItem: ReturnType<typeof useItems>['addItem']
  updateItem: ReturnType<typeof useItems>['updateItem']
  deleteItem: ReturnType<typeof useItems>['deleteItem']
  decrementQuantity: ReturnType<typeof useItems>['decrementQuantity']
  incrementQuantity: ReturnType<typeof useItems>['incrementQuantity']
  markPurchased: ReturnType<typeof useItems>['markPurchased']
  mutationError: ReturnType<typeof useItems>['mutationError']
  addCategory: ReturnType<typeof useCategories>['addCategory']
  renameCategory: ReturnType<typeof useCategories>['renameCategory']
  deleteCategory: ReturnType<typeof useCategories>['deleteCategory']
  updateHouseholdName: ReturnType<typeof useHousehold>['updateHouseholdName']
}

function WelcomeGate() {
  const householdId = getStoredHouseholdId()
  if (householdId) return <Navigate to="/" replace />
  return <WelcomePage />
}

function AppShell() {
  const householdId = getStoredHouseholdId()
  const { household, loading, updateHouseholdName } = useHousehold(householdId)
  const { categories, addCategory, renameCategory, deleteCategory } = useCategories(householdId)
  const {
    itemsByCategory,
    shoppingList,
    loading: itemsLoading,
    offlineNoCache,
    addItem,
    updateItem,
    deleteItem,
    decrementQuantity,
    incrementQuantity,
    markPurchased,
    mutationError,
  } = useItems(householdId, categories)

  if (!householdId) {
    return <Navigate to="/welcome" replace />
  }

  if (loading || itemsLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app">
        <p className="text-muted">Loading…</p>
      </div>
    )
  }

  if (offlineNoCache) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center bg-app px-4">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
          <h1 className="text-lg font-semibold text-amber-200">You&apos;re offline</h1>
          <p className="mt-2 text-sm text-amber-200/90">
            Connect once to load your home. Your changes will work offline after that.
          </p>
        </div>
      </div>
    )
  }

  if (!household) {
    if (householdId) clearHouseholdId()
    return <Navigate to="/welcome" replace />
  }

  const context: AppContext = {
    household,
    categories,
    itemsByCategory,
    shoppingList,
    addItem,
    updateItem,
    deleteItem,
    decrementQuantity,
    incrementQuantity,
    markPurchased,
    mutationError,
    addCategory,
    renameCategory,
    deleteCategory,
    updateHouseholdName,
  }

  return (
    <Routes>
      <Route element={<Layout context={context} />}>
        <Route index element={<InventoryPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<WelcomeGate />} />
      <Route path="/join/:code" element={<WelcomePage />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  )
}
