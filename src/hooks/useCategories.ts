import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

export function useCategories(householdId: string | null) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

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
        () => {
          fetchCategories().catch(console.error)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [householdId, fetchCategories])

  const addCategory = async (name: string) => {
    if (!householdId) return

    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), -1)

    const { error } = await supabase.from('categories').insert({
      household_id: householdId,
      name: name.trim(),
      sort_order: maxOrder + 1,
    })

    if (error) throw error
    await fetchCategories()
  }

  const renameCategory = async (id: string, name: string) => {
    const { error } = await supabase
      .from('categories')
      .update({ name: name.trim() })
      .eq('id', id)

    if (error) throw error
    await fetchCategories()
  }

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
    await fetchCategories()
  }

  return {
    categories,
    loading,
    addCategory,
    renameCategory,
    deleteCategory,
  }
}
