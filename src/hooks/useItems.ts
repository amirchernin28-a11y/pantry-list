import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category, Item, ShoppingNeed } from '@/types'
import { getNeededQuantity, isLowStock } from '@/types'

export function useItems(householdId: string | null, categories: Category[]) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const fetchItems = useCallback(async () => {
    if (!householdId) {
      setItems([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('household_id', householdId)
      .order('name')

    if (error) throw error
    setItems(data ?? [])
  }, [householdId])

  useEffect(() => {
    setLoading(true)
    fetchItems()
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [fetchItems])

  useEffect(() => {
    if (!householdId) return

    const channel = supabase
      .channel(`items:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          fetchItems().catch(console.error)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, fetchItems])

  const shoppingList: ShoppingNeed[] = useMemo(() => {
    return items
      .filter(isLowStock)
      .map((item) => ({
        item,
        category: categoryMap.get(item.category_id)!,
        needed: getNeededQuantity(item),
      }))
      .filter((entry) => entry.category && entry.needed > 0)
      .sort((a, b) => a.category.sort_order - b.category.sort_order || a.item.name.localeCompare(b.item.name))
  }, [items, categoryMap])

  const addItem = async (
    name: string,
    categoryId: string,
    targetQuantity: number,
    currentQuantity = 0,
  ) => {
    if (!householdId) return

    const { error } = await supabase.from('items').insert({
      household_id: householdId,
      category_id: categoryId,
      name: name.trim(),
      target_quantity: targetQuantity,
      current_quantity: currentQuantity,
    })

    if (error) throw error
    await fetchItems()
  }

  const updateItem = async (
    id: string,
    updates: Partial<Pick<Item, 'name' | 'category_id' | 'target_quantity' | 'current_quantity'>>,
  ) => {
    const { error } = await supabase.from('items').update(updates).eq('id', id)
    if (error) throw error
    await fetchItems()
  }

  const decrementQuantity = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item || item.current_quantity <= 0) return

    await updateItem(id, { current_quantity: item.current_quantity - 1 })
  }

  const incrementQuantity = async (id: string) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    await updateItem(id, { current_quantity: item.current_quantity + 1 })
  }

  const markPurchased = async (id: string, amount: number) => {
    const item = items.find((i) => i.id === id)
    if (!item) return

    await updateItem(id, {
      current_quantity: Math.min(item.current_quantity + amount, item.target_quantity),
    })
  }

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) throw error
    await fetchItems()
  }

  const itemsByCategory = useMemo(() => {
    const grouped = new Map<string, Item[]>()
    for (const category of categories) {
      grouped.set(category.id, [])
    }
    for (const item of items) {
      const list = grouped.get(item.category_id)
      if (list) list.push(item)
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return grouped
  }, [items, categories])

  return {
    items,
    itemsByCategory,
    shoppingList,
    loading,
    addItem,
    updateItem,
    decrementQuantity,
    incrementQuantity,
    markPurchased,
    deleteItem,
  }
}
