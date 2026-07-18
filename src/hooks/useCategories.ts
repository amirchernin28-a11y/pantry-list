import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  addPendingOp,
  getCachedCategories,
  hasEverSynced,
  markFetched,
  setCachedCategories,
} from '@/lib/offline/db'
import { flushPendingQueue } from '@/lib/offline/sync'
import type { Category } from '@/types'

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: string }).message).toLowerCase()
    return msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')
  }
  return false
}

export function useCategories(householdId: string | null) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const inFlightMutations = useRef(0)
  const categoriesRef = useRef(categories)
  categoriesRef.current = categories

  const fetchCategories = useCallback(async () => {
    if (!householdId) {
      setCategories([])
      return
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('household_id', householdId)
      .order('sort_order')

    if (error) throw error
    const next = data ?? []
    setCategories(next)
    await setCachedCategories(householdId, next)
    await markFetched(householdId)
  }, [householdId])

  useEffect(() => {
    if (!householdId) {
      setCategories([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)

      const cached = await getCachedCategories(householdId!)
      if (cached && !cancelled) {
        setCategories(cached)
        setLoading(false)
      }

      if (!navigator.onLine) {
        if (!cancelled) setLoading(false)
        return
      }

      try {
        await flushPendingQueue(householdId!)
        await fetchCategories()
      } catch (err) {
        console.error(err)
        if (!cached && !cancelled) {
          const synced = await hasEverSynced(householdId!)
          if (!synced) setCategories([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [householdId, fetchCategories])

  useEffect(() => {
    if (!householdId) return

    const handleOnline = async () => {
      try {
        await flushPendingQueue(householdId)
        await fetchCategories()
      } catch (err) {
        console.error(err)
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [householdId, fetchCategories])

  useEffect(() => {
    if (!householdId) return

    const mergeRealtimeChange = (payload: RealtimePostgresChangesPayload<Category>) => {
      if (!navigator.onLine) return
      if (payload.eventType === 'INSERT' && inFlightMutations.current > 0) return

      setCategories((prev) => {
        let next: Category[]
        switch (payload.eventType) {
          case 'INSERT': {
            const row = payload.new
            if (!row?.id || prev.some((category) => category.id === row.id)) return prev
            next = [...prev, row].sort((a, b) => a.sort_order - b.sort_order)
            break
          }
          case 'UPDATE': {
            const row = payload.new
            if (!row?.id) return prev
            next = prev
              .map((category) => (category.id === row.id ? row : category))
              .sort((a, b) => a.sort_order - b.sort_order)
            break
          }
          case 'DELETE': {
            const id = payload.old?.id
            if (!id) return prev
            next = prev.filter((category) => category.id !== id)
            break
          }
          default:
            return prev
        }
        void setCachedCategories(householdId, next)
        return next
      })
    }

    const channel = supabase
      .channel(`categories:${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `household_id=eq.${householdId}`,
        },
        mergeRealtimeChange,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId])

  const addCategory = async (name: string) => {
    if (!householdId) return

    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), -1)
    const tempId = crypto.randomUUID()
    const now = new Date().toISOString()
    const optimistic: Category = {
      id: tempId,
      household_id: householdId,
      name: name.trim(),
      sort_order: maxOrder + 1,
      created_at: now,
    }

    const nextWithOptimistic = [...categoriesRef.current, optimistic].sort(
      (a, b) => a.sort_order - b.sort_order,
    )
    setCategories(nextWithOptimistic)
    inFlightMutations.current++

    const cacheInsert = async () => {
      await setCachedCategories(householdId, nextWithOptimistic)
      await addPendingOp(householdId, {
        op: 'insert_category',
        payload: {
          tempId,
          household_id: householdId,
          name: name.trim(),
          sort_order: maxOrder + 1,
        },
      })
    }

    try {
      if (!navigator.onLine) {
        await cacheInsert()
        return
      }

      const { data, error } = await supabase
        .from('categories')
        .insert({
          household_id: householdId,
          name: name.trim(),
          sort_order: maxOrder + 1,
        })
        .select()
        .single()

      if (error) {
        if (isNetworkError(error)) {
          await cacheInsert()
          return
        }
        setCategories((prev) => prev.filter((category) => category.id !== tempId))
        throw error
      }

      const next = categoriesRef.current
        .map((category) => (category.id === tempId ? data : category))
        .sort((a, b) => a.sort_order - b.sort_order)
      setCategories(next)
      await setCachedCategories(householdId, next)
    } finally {
      inFlightMutations.current--
    }
  }

  const renameCategory = async (id: string, name: string) => {
    let previous: Category | undefined
    let nextCategories: Category[] = []

    setCategories((prev) => {
      previous = prev.find((category) => category.id === id)
      nextCategories = prev.map((category) =>
        category.id === id ? { ...category, name: name.trim() } : category,
      )
      return nextCategories
    })

    if (!previous) return

    inFlightMutations.current++
    try {
      if (!navigator.onLine) {
        await setCachedCategories(householdId!, nextCategories)
        await addPendingOp(householdId!, {
          op: 'update_category',
          payload: { categoryId: id, name: name.trim() },
        })
        return
      }

      const { error } = await supabase
        .from('categories')
        .update({ name: name.trim() })
        .eq('id', id)

      if (error) {
        if (isNetworkError(error)) {
          await setCachedCategories(householdId!, nextCategories)
          await addPendingOp(householdId!, {
            op: 'update_category',
            payload: { categoryId: id, name: name.trim() },
          })
          return
        }
        setCategories((prev) =>
          prev.map((category) => (category.id === id ? previous! : category)),
        )
        console.error(error)
        throw error
      }
      await setCachedCategories(householdId!, nextCategories)
    } finally {
      inFlightMutations.current--
    }
  }

  const deleteCategory = async (id: string) => {
    let previous: Category | undefined
    let nextCategories: Category[] = []

    setCategories((prev) => {
      previous = prev.find((category) => category.id === id)
      nextCategories = prev.filter((category) => category.id !== id)
      return nextCategories
    })

    if (!previous) return

    inFlightMutations.current++
    try {
      if (!navigator.onLine) {
        await setCachedCategories(householdId!, nextCategories)
        await addPendingOp(householdId!, {
          op: 'delete_category',
          payload: { categoryId: id },
        })
        return
      }

      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) {
        if (isNetworkError(error)) {
          await setCachedCategories(householdId!, nextCategories)
          await addPendingOp(householdId!, {
            op: 'delete_category',
            payload: { categoryId: id },
          })
          return
        }
        setCategories((prev) =>
          [...prev, previous!].sort((a, b) => a.sort_order - b.sort_order),
        )
        console.error(error)
        throw error
      }
      await setCachedCategories(householdId!, nextCategories)
    } finally {
      inFlightMutations.current--
    }
  }

  return {
    categories,
    loading,
    addCategory,
    renameCategory,
    deleteCategory,
  }
}
