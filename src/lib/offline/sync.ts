import { supabase } from '@/lib/supabase'
import {
  getPendingOps,
  removePendingOp,
  type PendingOp,
} from '@/lib/offline/db'

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) return true
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message: string }).message).toLowerCase()
    return msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')
  }
  return false
}

function resolveItemId(id: string, idMap: Map<string, string>): string {
  return idMap.get(id) ?? id
}

function resolveCategoryId(id: string, idMap: Map<string, string>): string {
  return idMap.get(id) ?? id
}

async function cancelPendingInsert(
  householdId: string,
  tempId: string,
  ops: PendingOp[],
): Promise<boolean> {
  const insertOp = ops.find(
    (o) => o.op === 'insert_item' && o.payload.tempId === tempId,
  )
  if (!insertOp) return false
  await removePendingOp(householdId, insertOp.id)
  return true
}

async function applyOp(
  householdId: string,
  op: PendingOp,
  idMap: Map<string, string>,
  allOps: PendingOp[],
): Promise<void> {
  switch (op.op) {
    case 'update_quantity':
    case 'mark_purchased': {
      const itemId = resolveItemId(op.payload.itemId as string, idMap)
      const { error } = await supabase
        .from('items')
        .update({ current_quantity: op.payload.current_quantity as number })
        .eq('id', itemId)
      if (error) throw error
      break
    }
    case 'insert_item': {
      const { tempId, ...fields } = op.payload as {
        tempId: string
        household_id: string
        category_id: string
        name: string
        target_quantity: number
        current_quantity: number
      }
      const categoryId = resolveCategoryId(fields.category_id, idMap)
      const { data, error } = await supabase
        .from('items')
        .insert({ ...fields, category_id: categoryId })
        .select()
        .single()
      if (error) throw error
      if (data) idMap.set(tempId, data.id)
      break
    }
    case 'update_item': {
      const itemId = resolveItemId(op.payload.itemId as string, idMap)
      const updates = op.payload.updates as Record<string, unknown>
      if (updates.category_id) {
        updates.category_id = resolveCategoryId(updates.category_id as string, idMap)
      }
      const { error } = await supabase.from('items').update(updates).eq('id', itemId)
      if (error) throw error
      break
    }
    case 'delete_item': {
      const rawId = op.payload.itemId as string
      if (!idMap.has(rawId)) {
        const cancelled = await cancelPendingInsert(householdId, rawId, allOps)
        if (cancelled) return
      }
      const itemId = resolveItemId(rawId, idMap)
      const { error } = await supabase.from('items').delete().eq('id', itemId)
      if (error) throw error
      break
    }
    case 'insert_category': {
      const { tempId, household_id, name, sort_order } = op.payload as {
        tempId: string
        household_id: string
        name: string
        sort_order: number
      }
      const { data, error } = await supabase
        .from('categories')
        .insert({ household_id, name, sort_order })
        .select()
        .single()
      if (error) throw error
      if (data) idMap.set(tempId, data.id)
      break
    }
    case 'update_category': {
      const categoryId = resolveCategoryId(op.payload.categoryId as string, idMap)
      const { error } = await supabase
        .from('categories')
        .update({ name: op.payload.name as string })
        .eq('id', categoryId)
      if (error) throw error
      break
    }
    case 'delete_category': {
      const rawId = op.payload.categoryId as string
      if (!idMap.has(rawId)) {
        const insertOp = allOps.find(
          (o) => o.op === 'insert_category' && o.payload.tempId === rawId,
        )
        if (insertOp) {
          await removePendingOp(householdId, insertOp.id)
          return
        }
      }
      const categoryId = resolveCategoryId(rawId, idMap)
      const { error } = await supabase.from('categories').delete().eq('id', categoryId)
      if (error) throw error
      break
    }
    default:
      throw new Error(`Unknown op: ${op.op}`)
  }
}

export async function flushPendingQueue(householdId: string): Promise<{ remaining: number }> {
  if (!navigator.onLine) return { remaining: await getPendingOps(householdId).then((o) => o.length) }

  const idMap = new Map<string, string>()

  while (true) {
    const ops = await getPendingOps(householdId)
    if (ops.length === 0) break

    const op = ops[0]
    try {
      await applyOp(householdId, op, idMap, ops)
      await removePendingOp(householdId, op.id)
    } catch (error) {
      console.error('Sync op failed:', op.op, error)
      if (isNetworkError(error)) break
      break
    }
  }

  const remaining = (await getPendingOps(householdId)).length
  window.dispatchEvent(new CustomEvent('offline-sync-complete', { detail: { remaining } }))
  return { remaining }
}
