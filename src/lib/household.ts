const HOUSEHOLD_KEY = 'pantry_household_id'

export function getStoredHouseholdId(): string | null {
  return localStorage.getItem(HOUSEHOLD_KEY)
}

export function storeHouseholdId(id: string): void {
  localStorage.setItem(HOUSEHOLD_KEY, id)
}

export function clearHouseholdId(): void {
  localStorage.removeItem(HOUSEHOLD_KEY)
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function getInviteUrl(code: string): string {
  return `${window.location.origin}/join/${code}`
}
