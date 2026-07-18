import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Category, Item } from '@/types'

export type PendingOpType =
  | 'update_quantity'
  | 'insert_item'
  | 'update_item'
  | 'delete_item'
  | 'mark_purchased'
  | 'insert_category'
  | 'update_category'
  | 'delete_category'

export interface PendingOp {
  id: string
  op: PendingOpType
  payload: Record<string, unknown>
  createdAt: string
}

interface HouseholdRecord {
  householdId: string
  items: Item[]
  categories: Category[]
  pendingOps: PendingOp[]
  fetchedAt?: string
}

interface PantryDB extends DBSchema {
  households: {
    key: string
    value: HouseholdRecord
  }
}

const DB_NAME = 'pantry-offline'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<PantryDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<PantryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('households')) {
          db.createObjectStore('households', { keyPath: 'householdId' })
        }
      },
    })
  }
  return dbPromise
}

async function getRecord(householdId: string): Promise<HouseholdRecord | undefined> {
  const db = await getDb()
  return db.get('households', householdId)
}

async function putRecord(record: HouseholdRecord): Promise<void> {
  const db = await getDb()
  await db.put('households', record)
}

async function ensureRecord(householdId: string): Promise<HouseholdRecord> {
  const existing = await getRecord(householdId)
  if (existing) return existing
  return { householdId, items: [], categories: [], pendingOps: [] }
}

export async function hasEverSynced(householdId: string): Promise<boolean> {
  const record = await getRecord(householdId)
  return Boolean(record?.fetchedAt)
}

export async function getCachedItems(householdId: string): Promise<Item[] | null> {
  const record = await getRecord(householdId)
  if (!record?.fetchedAt) return null
  return record.items
}

export async function getCachedCategories(householdId: string): Promise<Category[] | null> {
  const record = await getRecord(householdId)
  if (!record?.fetchedAt) return null
  return record.categories
}

export async function markFetched(householdId: string): Promise<void> {
  const record = await ensureRecord(householdId)
  record.fetchedAt = new Date().toISOString()
  await putRecord(record)
}

export async function setCachedItems(householdId: string, items: Item[]): Promise<void> {
  const record = await ensureRecord(householdId)
  record.items = items
  await putRecord(record)
}

export async function setCachedCategories(householdId: string, categories: Category[]): Promise<void> {
  const record = await ensureRecord(householdId)
  record.categories = categories
  await putRecord(record)
}

export async function addPendingOp(
  householdId: string,
  op: Pick<PendingOp, 'op' | 'payload'> & { id?: string; createdAt?: string },
): Promise<PendingOp> {
  const record = await ensureRecord(householdId)
  const pendingOp: PendingOp = {
    id: op.id ?? crypto.randomUUID(),
    op: op.op,
    payload: op.payload,
    createdAt: op.createdAt ?? new Date().toISOString(),
  }
  record.pendingOps.push(pendingOp)
  await putRecord(record)
  window.dispatchEvent(new CustomEvent('offline-queue-changed'))
  return pendingOp
}

export async function getPendingOps(householdId: string): Promise<PendingOp[]> {
  const record = await getRecord(householdId)
  return record?.pendingOps ?? []
}

export async function getPendingOpsCount(householdId: string): Promise<number> {
  const ops = await getPendingOps(householdId)
  return ops.length
}

export async function removePendingOp(householdId: string, opId: string): Promise<void> {
  const record = await getRecord(householdId)
  if (!record) return
  record.pendingOps = record.pendingOps.filter((op) => op.id !== opId)
  await putRecord(record)
  window.dispatchEvent(new CustomEvent('offline-queue-changed'))
}

export async function clearHouseholdCache(householdId: string): Promise<void> {
  const db = await getDb()
  await db.delete('households', householdId)
}
