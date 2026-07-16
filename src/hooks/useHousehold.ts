import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { generateInviteCode } from '@/lib/household'
import type { Household } from '@/types'

const DEFAULT_CATEGORIES = ['Groceries', 'Hygiene', 'Cleaning']

export function useHousehold(householdId: string | null) {
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(Boolean(householdId))
  const [error, setError] = useState<string | null>(null)

  const fetchHousehold = useCallback(async (id: string) => {
    const { data, error: fetchError } = await supabase
      .from('households')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError
    setHousehold(data)
    return data
  }, [])

  useEffect(() => {
    if (!householdId) {
      setHousehold(null)
      return
    }

    setLoading(true)
    fetchHousehold(householdId)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [householdId, fetchHousehold])

  const createHousehold = async (name = 'My Home') => {
    setLoading(true)
    setError(null)

    try {
      const inviteCode = generateInviteCode()

      const { data: householdData, error: householdError } = await supabase
        .from('households')
        .insert({ name, invite_code: inviteCode })
        .select()
        .single()

      if (householdError) throw householdError

      const categories = DEFAULT_CATEGORIES.map((catName, index) => ({
        household_id: householdData.id,
        name: catName,
        sort_order: index,
      }))

      const { error: categoriesError } = await supabase
        .from('categories')
        .insert(categories)

      if (categoriesError) throw categoriesError

      setHousehold(householdData)
      return householdData
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create household'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const joinHousehold = async (inviteCode: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: joinError } = await supabase
        .from('households')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (joinError) throw new Error('Invalid invite code. Check the link and try again.')

      setHousehold(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join household'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateHouseholdName = async (name: string) => {
    if (!household) return

    const { data, error: updateError } = await supabase
      .from('households')
      .update({ name })
      .eq('id', household.id)
      .select()
      .single()

    if (updateError) throw updateError
    setHousehold(data)
  }

  return {
    household,
    loading,
    error,
    createHousehold,
    joinHousehold,
    updateHouseholdName,
    refetch: householdId ? () => fetchHousehold(householdId) : undefined,
  }
}
