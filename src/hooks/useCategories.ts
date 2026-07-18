import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

export function useCategories(householdId: string | null) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const inFlightMutations = useRef(0)

  const fetchCategories = useCallback(async () => {
    if (!householdId) {
      setCategories([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('household_id', householdId)
      .order('sort_order')

    if (error) throw error
    setCategories(data ?? [])
  }, [householdId])

  useEffect(() => {
    setLoading(true)
    fetchCategories()
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [fetchCategories])

  useEffect(() => {
    if (!householdId) return

    const mergeRealtimeChange = (payload: RealtimePostgresChangesPayload<Category>) => {
      if (payload.eventType === 'INSERT' && inFlightMutations.current > 0) return

      setCategories((prev) => {
        switch (payload.eventType) {
          case 'INSERT': {
            const row = payload.new
            if (!row?.id || prev.some((category) => category.id === row.id)) return prev
            return [...prev, row].sort((a, b) => a.sort_order - b.sort_order)
          }
          case 'UPDATE': {
            const row = payload.new
            if (!row?.id) return prev
            return prev
              .map((category) => (category.id === row.id ? row : category))
              .sort((a, b) => a.sort_order - b.sort_order)
          }
          case 'DELETE': {
            const id = payload.old?.id
            if (!id) return prev
            return prev.filter((category) => category.id !== id)
          }
          default:
            return prev
        }
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

    setCategories((prev) => [...prev, optimistic].sort((a, b) => a.sort_order - b.sort_order))
    inFlightMutations.current++

    try {
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
        setCategories((prev) => prev.filter((category) => category.id !== tempId))
        throw error
      }

      setCategories((prev) =>
        prev
          .map((category) => (category.id === tempId ? data : category))
          .sort((a, b) => a.sort_order - b.sort_order),
      )
    } finally {
      inFlightMutations.current--
    }
  }

  const renameCategory = async (id: string, name: string) => {
    let previous: Category | undefined

    setCategories((prev) => {
      previous = prev.find((category) => category.id === id)
      return prev.map((category) =>
        category.id === id ? { ...category, name: name.trim() } : category,
      )
    })

    if (!previous) return

    inFlightMutations.current++
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: name.trim() })
        .eq('id', id)

      if (error) {
        setCategories((prev) =>
          prev.map((category) => (category.id === id ? previous! : category)),
        )
        console.error(error)
        throw error
      }
    } finally {
      inFlightMutations.current--
    }
  }

  const deleteCategory = async (id: string) => {
    let previous: Category | undefined

    setCategories((prev) => {
      previous = prev.find((category) => category.id === id)
      return prev.filter((category) => category.id !== id)
    })

    if (!previous) return

    inFlightMutations.current++
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) {
        setCategories((prev) =>
          [...prev, previous!].sort((a, b) => a.sort_order - b.sort_order),
        )
        console.error(error)
        throw error
      }
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
