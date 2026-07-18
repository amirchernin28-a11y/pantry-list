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
    addItem,
    updateItem,
    deleteItem,
    decrementQuantity,
    incrementQuantity,
    markPurchased,
  } = useItems(householdId, categories)

  if (!householdId) {
    return <Navigate to="/welcome" replace />
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-app">
        <p className="text-muted">Loading…</p>
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
