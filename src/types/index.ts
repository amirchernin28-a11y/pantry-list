export interface Household {
  id: string
  name: string
  invite_code: string
  created_at: string
}

export interface Category {
  id: string
  household_id: string
  name: string
  sort_order: number
  created_at: string
}

export interface Item {
  id: string
  household_id: string
  category_id: string
  name: string
  target_quantity: number
  current_quantity: number
  created_at: string
  updated_at: string
}

export interface ShoppingNeed {
  item: Item
  category: Category
  needed: number
}

export function getNeededQuantity(item: Item): number {
  return Math.max(0, item.target_quantity - item.current_quantity)
}

export function isLowStock(item: Item): boolean {
  return item.current_quantity < item.target_quantity
}
