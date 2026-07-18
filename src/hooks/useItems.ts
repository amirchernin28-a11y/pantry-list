import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  addPendingOp,
  getCachedItems,
  hasEverSynced,
  markFetched,
  setCachedItems,
} from '@/lib/offline/db'
import { flushPendingQueue } from '@/lib/offline/sync'
import type { Category, Item, ShoppingNeed } from '@/types'
import { getNeededQuantity, isLowStock } from '@/types'

type ItemUpdatePayload = Partial<
  Pick<Item, 'name' | 'category_id' | 'target_quantity' | 'current_quantity'>
>

function patchItem(items: Item[], id: string, updates: Partial<Item>): Item[] {
  return items.map((item) => (item.id === id ? { ...item, ...updates } : item))
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: string }).message).toLowerCase()
    return msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')
  }
  return false
}

export function useItems(householdId: string | null, categories: Category[]) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [offlineNoCache, setOfflineNoCache] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const inFlightMutations = useRef(0)
  const pendingQuantities = useRef(new Map<string, number>())
  const writeQueues = useRef(new Map<string, Promise<void>>())
  const itemsRef = useRef(items)
  itemsRef.current = items

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  )

  const fetchItems = useCallback(async () => {
    if (!householdId) {
      setItems([])
      return
    }

    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('household_id', householdId)
      .order('name')

    if (error) throw error
    const next = data ?? []
    setItems(next)
    await setCachedItems(householdId, next)
    await markFetched(householdId)
  }, [householdId])

  useEffect(() => {
    if (!householdId) {
      setItems([])
      setLoading(false)
      setOfflineNoCache(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setOfflineNoCache(false)

      const cached = await getCachedItems(householdId!)
      if (cached && !cancelled) {
        setItems(cached)
        setLoading(false)
      }

      if (!navigator.onLine) {
        const synced = await hasEverSynced(householdId!)
        if (!synced && !cancelled) setOfflineNoCache(true)
        if (!cancelled) setLoading(false)
        return
      }

      try {
        await flushPendingQueue(householdId!)
        await fetchItems()
      } catch (err) {
        console.error(err)
        if (!cached && !cancelled) {
          const synced = await hasEverSynced(householdId!)
          if (!synced) setOfflineNoCache(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [householdId, fetchItems])

  useEffect(() => {
    if (!householdId) return

    const handleOnline = async () => {
      try {
        await flushPendingQueue(householdId)
        await fetchItems()
      } catch (err) {
        console.error(err)
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [householdId, fetchItems])

  useEffect(() => {
    if (!householdId) return

    const mergeRealtimeChange = (payload: RealtimePostgresChangesPayload<Item>) => {
      if (!navigator.onLine) return
      if (inFlightMutations.current > 0) {
        if (payload.eventType === 'INSERT') return
        if (payload.eventType === 'UPDATE') {
          const row = payload.new
          if (row?.id && pendingQuantities.current.has(row.id)) return
        }
      }

      setItems((prev) => {
        let next: Item[]
        switch (payload.eventType) {
          case 'INSERT': {
            const row = payload.new
            if (!row?.id || prev.some((item) => item.id === row.id)) return prev
            next = [...prev, row]
            break
          }
          case 'UPDATE': {
            const row = payload.new
            if (!row?.id) return prev
            if (pendingQuantities.current.has(row.id)) return prev
            next = !prev.some((item) => item.id === row.id)
              ? [...prev, row]
              : prev.map((item) => (item.id === row.id ? row : item))
            break
          }
          case 'DELETE': {
            const id = payload.old?.id
            if (!id) return prev
            next = prev.filter((item) => item.id !== id)
            break
          }
          default:
            return prev
        }
        void setCachedItems(householdId, next)
        return next
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

  const reportMutationError = (message: string, error: unknown) => {
    console.error(message, error)
    setMutationError(message)
  }

  const enqueueItemWrite = (id: string, write: () => Promise<void>): Promise<void> => {
    const previous = writeQueues.current.get(id) ?? Promise.resolve()
    const next = previous.then(write)
    writeQueues.current.set(id, next)
    void next.finally(() => {
      if (writeQueues.current.get(id) === next) {
        writeQueues.current.delete(id)
      }
    })
    return next
  }

  const queueOfflineQuantity = async (id: string, quantity: number) => {
    if (!householdId) return
    pendingQuantities.current.delete(id)
    const next = itemsRef.current.map((item) =>
      item.id === id ? { ...item, current_quantity: quantity } : item,
    )
    await setCachedItems(householdId, next)
    await addPendingOp(householdId, {
      op: 'update_quantity',
      payload: { itemId: id, current_quantity: quantity },
    })
    setMutationError(null)
  }

  const flushPendingQuantity = async (id: string) => {
    inFlightMutations.current++
    try {
      while (pendingQuantities.current.has(id)) {
        const quantity = pendingQuantities.current.get(id)!

        if (!navigator.onLine) {
          await queueOfflineQuantity(id, quantity)
          return
        }

        const { data, error } = await supabase
          .from('items')
          .update({ current_quantity: quantity })
          .eq('id', id)
          .select()
          .single()

        if (error || !data) {
          if (isNetworkError(error)) {
            await queueOfflineQuantity(id, quantity)
            return
          }
          pendingQuantities.current.delete(id)
          reportMutationError('Could not save quantity change.', error ?? 'No row updated')
          await fetchItems().catch(console.error)
          throw error ?? new Error('No row updated')
        }

        const stillPending = pendingQuantities.current.get(id)
        if (stillPending === quantity) {
          pendingQuantities.current.delete(id)
          const next = itemsRef.current.map((item) => (item.id === id ? data : item))
          setItems(next)
          await setCachedItems(householdId!, next)
          setMutationError(null)
          return
        }
      }
    } finally {
      inFlightMutations.current--
    }
  }

  const getEffectiveQuantity = (id: string) => {
    const pending = pendingQuantities.current.get(id)
    if (pending !== undefined) return pending
    return itemsRef.current.find((item) => item.id === id)?.current_quantity
  }

  const persistQuantityChange = (id: string, nextQuantity: number) => {
    pendingQuantities.current.set(id, nextQuantity)
    return enqueueItemWrite(id, () => flushPendingQuantity(id))
  }

  const persistItemUpdate = async (
    id: string,
    updates: ItemUpdatePayload,
    previous: Item,
  ) => {
    return enqueueItemWrite(id, async () => {
      inFlightMutations.current++
      try {
        if (!navigator.onLine) {
          const next = patchItem(itemsRef.current, id, updates)
          await setCachedItems(householdId!, next)
          await addPendingOp(householdId!, {
            op: 'update_item',
            payload: { itemId: id, updates },
          })
          setMutationError(null)
          return
        }

        const { data, error } = await supabase
          .from('items')
          .update(updates)
          .eq('id', id)
          .select()
          .single()

        if (error || !data) {
          if (isNetworkError(error)) {
            const next = patchItem(itemsRef.current, id, updates)
            await setCachedItems(householdId!, next)
            await addPendingOp(householdId!, {
              op: 'update_item',
              payload: { itemId: id, updates },
            })
            setMutationError(null)
            return
          }
          setItems((prev) => prev.map((item) => (item.id === id ? previous : item)))
          reportMutationError('Could not save item changes.', error ?? 'No row updated')
          throw error ?? new Error('No row updated')
        }

        const next = itemsRef.current.map((item) => (item.id === id ? data : item))
        setItems(next)
        await setCachedItems(householdId!, next)
        setMutationError(null)
      } finally {
        inFlightMutations.current--
      }
    })
  }

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

    const nextWithOptimistic = [...itemsRef.current, optimistic]
    setItems(nextWithOptimistic)
    inFlightMutations.current++

    const cacheInsert = async () => {
      await setCachedItems(householdId, nextWithOptimistic)
      await addPendingOp(householdId, {
        op: 'insert_item',
        payload: {
          tempId,
          household_id: householdId,
          category_id: categoryId,
          name: name.trim(),
          target_quantity: targetQuantity,
          current_quantity: currentQuantity,
        },
      })
      setMutationError(null)
    }

    try {
      if (!navigator.onLine) {
        await cacheInsert()
        return
      }

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

      if (error || !data) {
        if (isNetworkError(error)) {
          await cacheInsert()
          return
        }
        setItems((prev) => prev.filter((item) => item.id !== tempId))
        reportMutationError('Could not add item.', error ?? 'No row returned')
        throw error ?? new Error('No row returned')
      }

      const next = itemsRef.current.map((item) => (item.id === tempId ? data : item))
      setItems(next)
      await setCachedItems(householdId, next)
      setMutationError(null)
    } finally {
      inFlightMutations.current--
    }
  }

  const updateItem = async (id: string, updates: ItemUpdatePayload) => {
    let previous: Item | undefined

    setItems((prev) => {
      previous = prev.find((item) => item.id === id)
      return previous ? patchItem(prev, id, updates) : prev
    })

    if (!previous) return
    await persistItemUpdate(id, updates, previous)
  }

  const decrementQuantity = async (id: string) => {
    const current = getEffectiveQuantity(id)
    if (current === undefined || current <= 0) return

    const nextQuantity = current - 1
    setItems((prev) => patchItem(prev, id, { current_quantity: nextQuantity }))
    await persistQuantityChange(id, nextQuantity)
  }

  const incrementQuantity = async (id: string) => {
    const current = getEffectiveQuantity(id)
    if (current === undefined) return

    const nextQuantity = current + 1
    setItems((prev) => patchItem(prev, id, { current_quantity: nextQuantity }))
    await persistQuantityChange(id, nextQuantity)
  }

  const markPurchased = async (id: string, amount: number) => {
    const item = itemsRef.current.find((i) => i.id === id)
    const current = getEffectiveQuantity(id)
    if (!item || current === undefined) return

    const nextQuantity = Math.min(current + amount, item.target_quantity)
    setItems((prev) => patchItem(prev, id, { current_quantity: nextQuantity }))
    await persistQuantityChange(id, nextQuantity)
  }

  const deleteItem = async (id: string) => {
    let previous: Item | undefined
    let nextItems: Item[] = []

    setItems((prev) => {
      previous = prev.find((item) => item.id === id)
      nextItems = prev.filter((item) => item.id !== id)
      return nextItems
    })

    if (!previous) return

    inFlightMutations.current++
    try {
      if (!navigator.onLine) {
        await setCachedItems(householdId!, nextItems)
        await addPendingOp(householdId!, {
          op: 'delete_item',
          payload: { itemId: id },
        })
        setMutationError(null)
        return
      }

      const { error } = await supabase.from('items').delete().eq('id', id)
      if (error) {
        if (isNetworkError(error)) {
          await setCachedItems(householdId!, nextItems)
          await addPendingOp(householdId!, {
            op: 'delete_item',
            payload: { itemId: id },
          })
          setMutationError(null)
          return
        }
        setItems((prev) => [...prev, previous!])
        reportMutationError('Could not delete item.', error)
        throw error
      }
      await setCachedItems(householdId!, nextItems)
      setMutationError(null)
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
    offlineNoCache,
    mutationError,
    addItem,
    updateItem,
    decrementQuantity,
    incrementQuantity,
    markPurchased,
    deleteItem,
  }
}
