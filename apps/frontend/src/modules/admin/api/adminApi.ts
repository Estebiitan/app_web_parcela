import type { PublicPropertyInfo } from '@/modules/public-site/api/publicSiteApi'
import {
  ApiError,
  deleteJson,
  getJson,
  patchJson,
  postForm,
  postJson,
} from '@/shared/api/http'

const ADMIN_AUTH_STORAGE_KEY = 'parcela.admin.auth'

type AdminTokens = {
  access: string
  refresh: string
}

type TokenRefreshResponse = {
  access: string
}

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type AdminUser = {
  id: number
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'client'
  phone: string
  is_active: boolean
}

export type AdminPropertySettings = PublicPropertyInfo & {
  is_active: boolean
}

export type AdminBlockedDate = {
  public_id: string
  title: string
  start_date: string
  end_date: string
  block_type: string
  reason: string
  is_active: boolean
  created_by: number | null
  created_by_email: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AdminSpecialDatePrice = {
  public_id: string
  name: string
  start_date: string
  end_date: string
  daily_price: string
  currency: string
  description: string
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AdminReservationStatus =
  | 'pending'
  | 'observed'
  | 'awaiting_payment'
  | 'payment_submitted'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'expired'

export type AdminPaymentReceipt = {
  public_id: string
  file_url: string
  amount: string | null
  currency: string
  payment_date: string | null
  reference_number: string
  review_status: 'pending_review' | 'approved' | 'rejected'
  uploaded_by_email: string
  created_at: string
}

export type AdminReservation = {
  public_id: string
  customer: AdminUser
  start_date: string
  end_date: string
  guest_count: number
  status: AdminReservationStatus
  status_label: string
  quoted_total_amount: string | null
  currency: string
  customer_message: string
  expires_at: string | null
  status_updated_at: string
  created_at: string
  payment_receipts_count: number
  latest_payment_receipt_status: string
  latest_payment_receipt: AdminPaymentReceipt | null
}

export type AdminReservationDetail = AdminReservation & {
  guest_contact_email: string
  guest_contact_name: string
  guest_contact_phone: string
  internal_notes: string
  status_reason: string
  updated_at: string
  status_history: Array<{
    public_id: string
    from_status: string
    to_status: string
    comment: string
    changed_by_email: string
    created_at: string
  }>
  payment_receipts: AdminPaymentReceipt[]
}

type BlockedDatePayload = {
  title: string
  start_date: string
  end_date: string
  block_type: string
  reason: string
  is_active: boolean
  metadata?: Record<string, unknown>
}

type SpecialDatePricePayload = {
  name: string
  start_date: string
  end_date: string
  daily_price: number
  currency: string
  description: string
  is_active: boolean
  metadata?: Record<string, unknown>
}

function readStoredTokens(): AdminTokens | null {
  const rawValue = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as AdminTokens
  } catch {
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
    return null
  }
}

function writeStoredTokens(tokens: AdminTokens) {
  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(tokens))
}

function buildAuthHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

async function refreshAdminAccessToken(refreshToken: string) {
  const response = await postJson<TokenRefreshResponse, { refresh: string }>('auth/token/refresh/', {
    refresh: refreshToken,
  })

  const currentTokens = readStoredTokens()
  const nextTokens: AdminTokens = {
    access: response.access,
    refresh: currentTokens?.refresh || refreshToken,
  }
  writeStoredTokens(nextTokens)
  return nextTokens
}

async function withAdminAuth<T>(factory: (headers: HeadersInit) => Promise<T>) {
  const tokens = readStoredTokens()
  if (!tokens) {
    throw new Error('No encontramos una sesion activa del panel.')
  }

  try {
    return await factory(buildAuthHeaders(tokens.access))
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error
    }

    try {
      const refreshedTokens = await refreshAdminAccessToken(tokens.refresh)
      return await factory(buildAuthHeaders(refreshedTokens.access))
    } catch (refreshError) {
      clearAdminSession()
      throw refreshError
    }
  }
}

export function hasAdminSession() {
  return Boolean(readStoredTokens())
}

export function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY)
}

export async function loginAdmin(email: string, password: string) {
  const tokens = await postJson<AdminTokens, { email: string; password: string }>('auth/token/', {
    email,
    password,
  })
  writeStoredTokens(tokens)
  return getAdminCurrentUser()
}

export function getAdminCurrentUser() {
  return withAdminAuth((headers) => getJson<AdminUser>('auth/me/', undefined, headers))
}

export function getAdminPropertySettings() {
  return withAdminAuth((headers) => getJson<AdminPropertySettings>('admin/property-settings/', undefined, headers))
}

export function updateAdminPropertySettings(payload: Partial<AdminPropertySettings>) {
  return withAdminAuth((headers) =>
    patchJson<AdminPropertySettings, Partial<AdminPropertySettings>>(
      'admin/property-settings/',
      payload,
      headers,
    ),
  )
}

export function listAdminBlockedDates() {
  return withAdminAuth(async (headers) => {
    const response = await getJson<PaginatedResponse<AdminBlockedDate>>(
      'admin/blocked-dates/',
      undefined,
      headers,
    )
    return response.results
  })
}

export function createAdminBlockedDate(payload: BlockedDatePayload) {
  return withAdminAuth((headers) =>
    postJson<AdminBlockedDate, BlockedDatePayload>('admin/blocked-dates/', payload, headers),
  )
}

export function updateAdminBlockedDate(publicId: string, payload: Partial<BlockedDatePayload>) {
  return withAdminAuth((headers) =>
    patchJson<AdminBlockedDate, Partial<BlockedDatePayload>>(
      `admin/blocked-dates/${publicId}/`,
      payload,
      headers,
    ),
  )
}

export function deleteAdminBlockedDate(publicId: string) {
  return withAdminAuth((headers) => deleteJson(`admin/blocked-dates/${publicId}/`, headers))
}

export function listAdminSpecialPrices() {
  return withAdminAuth(async (headers) => {
    const response = await getJson<PaginatedResponse<AdminSpecialDatePrice>>(
      'admin/special-prices/',
      undefined,
      headers,
    )
    return response.results
  })
}

export function createAdminSpecialPrice(payload: SpecialDatePricePayload) {
  return withAdminAuth((headers) =>
    postJson<AdminSpecialDatePrice, SpecialDatePricePayload>(
      'admin/special-prices/',
      payload,
      headers,
    ),
  )
}

export function updateAdminSpecialPrice(
  publicId: string,
  payload: Partial<SpecialDatePricePayload>,
) {
  return withAdminAuth((headers) =>
    patchJson<AdminSpecialDatePrice, Partial<SpecialDatePricePayload>>(
      `admin/special-prices/${publicId}/`,
      payload,
      headers,
    ),
  )
}

export function deleteAdminSpecialPrice(publicId: string) {
  return withAdminAuth((headers) => deleteJson(`admin/special-prices/${publicId}/`, headers))
}

export function listAdminReservations() {
  return withAdminAuth(async (headers) => {
    const response = await getJson<PaginatedResponse<AdminReservation>>(
      'admin/reservations/',
      undefined,
      headers,
    )
    return response.results
  })
}

export function getAdminReservation(publicId: string) {
  return withAdminAuth((headers) =>
    getJson<AdminReservationDetail>(`admin/reservations/${publicId}/`, undefined, headers),
  )
}

export function approveAdminReservation(publicId: string, comment: string) {
  return withAdminAuth((headers) =>
    postJson<AdminReservationDetail, { comment: string }>(
      `admin/reservations/${publicId}/approve/`,
      { comment },
      headers,
    ),
  )
}

export function rejectAdminReservation(publicId: string, reason: string, comment = '') {
  return withAdminAuth((headers) =>
    postJson<AdminReservationDetail, { comment: string; reason: string }>(
      `admin/reservations/${publicId}/reject/`,
      { comment, reason },
      headers,
    ),
  )
}

export function uploadAdminPaymentReceipt(publicId: string, formData: FormData) {
  return withAdminAuth((headers) =>
    postForm<AdminPaymentReceipt>(`admin/reservations/${publicId}/payment-receipts/`, formData, headers),
  )
}
