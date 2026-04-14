import type { GuestReservationAccess } from '@/modules/reservations/api/reservationsApi'

export type StoredGuestReservationAccess = GuestReservationAccess & {
  created_at: string
}

const STORAGE_KEY = 'app-web-parcela:guest-reservations'

function isBrowser() {
  return typeof window !== 'undefined'
}

function readStore(): StoredGuestReservationAccess[] {
  if (!isBrowser()) {
    return []
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY)
  if (!rawValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(rawValue) as StoredGuestReservationAccess[]
    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

function writeStore(entries: StoredGuestReservationAccess[]) {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function saveGuestReservationAccess(access: GuestReservationAccess) {
  const nextEntry: StoredGuestReservationAccess = {
    ...access,
    created_at: new Date().toISOString(),
  }
  const currentEntries = readStore().filter(
    (entry) => entry.reservation_public_id !== access.reservation_public_id,
  )

  writeStore([nextEntry, ...currentEntries].slice(0, 8))
}

export function getLatestGuestReservationAccess() {
  return readStore()[0] ?? null
}

export function findGuestReservationAccess(publicId: string) {
  return readStore().find((entry) => entry.reservation_public_id === publicId) ?? null
}
