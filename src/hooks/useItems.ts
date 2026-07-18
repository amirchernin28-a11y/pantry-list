import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Category, Item, ShoppingNeed } from '@/types'
import { getNeededQuantity, isLowStock } from '@/types'

function patchItem(items: Item[], id: string, updates: Partial<Item>): Item[] {
  return items.map((item) => (item.id === id ? { ...item, ...updates } : item))
}

export function useItems(householdId: string | null, categories: Category[]) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const inFlightMutations = useRef(0)

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

    const mergeRealtimeChange = (payload: RealtimePostgresChangesPayload<Item>) => {
      if (payload.eventType === 'INSERT' && inFlightMutations.current > 0) return

      setItems((prev) => {
        switch (payload.eventType) {
          case 'INSERT': {
            const row = payload.new
            if (!row?.id || prev.some((item) => item.id === row.id)) return prev
            return [...prev, row]
          }
          case 'UPDATE': {
            const row = payload.new
            if (!row?.id) return prev
            if (!prev.some((item) => item.id === row.id)) return [...prev, row]
            return prev.map((item) => (item.id === row.id ? row : item))
          }
          case 'DELETE': {
            const id = payload.old?.id
            if (!id) return prev
            return prev.filter((item) => item.id !== id)
          }
          default:
            return prev
        }
      })
    }

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
        mergeRealtimeChange,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId])

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

    const tempId = crypto.randomUUID()
    const now = new Date().toISOString()
    const optimistic: Item = {
      id: tempId,
      household_id: householdId,
      category_id: categoryId,
      name: name.trim(),
      target_quantity: targetQuantity,
      current_quantity: currentQuantity,
      created_at: now,
      updated_at: now,
    }

    setItems((prev) => [...prev, optimistic])
    inFlightMutations.current++

    try {
      const { data, error } = await supabase
        .from('items')
        .insert({
          household_id: householdId,
          category_id: categoryId,
          name: name.trim(),
          target_quantity: targetQuantity,
          current_quantity: currentQuantity,
        })
        .select()
        .single()

      if (error) {
        setItems((prev) => prev.filter((item) => item.id !== tempId))
        throw error
      }

      setItems((prev) => prev.map((item) => (item.id === tempId ? data : item)))
    } finally {
      inFlightMutations.current--
    }
  }

  const persistItemUpdate = async (
    id: string,
    updates: Partial<Pick<Item, 'name' | 'category_id' | 'target_quantity' | 'current_quantity'>>,
    previous: Item,
  ) => {
    inFlightMutations.current++
    try {
      const { error } = await supabase.from('items').update(updates).eq('id', id)
      if (error) {
        setItems((prev) => prev.map((item) => (item.id === id ? previous : item)))
        console.error(error)
        throw error
      }
    } finally {
      inFlightMutations.current--
    }
  }

  const updateItem = async (
    id: string,
    updates: Partial<Pick<Item, 'name' | 'category_id' | 'target_quantity' | 'current_quantity'>>,
  ) => {
    let previous: Item | undefined

    setItems((prev) => {
      previous = prev.find((item) => item.id === id)
      return previous ? patchItem(prev, id, updates) : prev
    })

    if (!previous) return
    await persistItemUpdate(id, updates, previous)
  }

  const decrementQuantity = async (id: string) => {
    let previous: Item | undefined
    let nextQuantity: number | undefined

    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (!item || item.current_quantity <= 0) return prev
      previous = item
      nextQuantity = item.current_quantity - 1
      return patchItem(prev, id, { current_quantity: nextQuantity })
    })

    if (!previous || nextQuantity === undefined) return
    await persistItemUpdate(id, { current_quantity: nextQuantity }, previous)
  }

  const incrementQuantity = async (id: string) => {
    let previous: Item | undefined
    let nextQuantity: number | undefined

    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (!item) return prev
      previous = item
      nextQuantity = item.current_quantity + 1
      return patchItem(prev, id, { current_quantity: nextQuantity })
    })

    if (!previous || nextQuantity === undefined) return
    await persistItemUpdate(id, { current_quantity: nextQuantity }, previous)
  }

  const markPurchased = async (id: string, amount: number) => {
    let previous: Item | undefined
    let nextQuantity: number | undefined

    setItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (!item) return prev
      previous = item
      nextQuantity = Math.min(item.current_quantity + amount, item.target_quantity)
      return patchItem(prev, id, { current_quantity: nextQuantity })
    })

    if (!previous || nextQuantity === undefined) return
    await persistItemUpdate(id, { current_quantity: nextQuantity }, previous)
  }

  const deleteItem = async (id: string) => {
    let previous: Item | undefined

    setItems((prev) => {
      previous = prev.find((item) => item.id === id)
      return prev.filter((item) => item.id !== id)
    })

    if (!previous) return

    inFlightMutations.current++
    try {
      const { error } = await supabase.from('items').delete().eq('id', id)
      if (error) {
        setItems((prev) => [...prev, previous!])
        console.error(error)
        throw error
      }
    } finally {
      inFlightMutations.current--
    }
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
