import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from '@/design-system'
import {
  approveAdminReservation,
  clearAdminSession,
  createAdminBlockedDate,
  createAdminSpecialPrice,
  deleteAdminBlockedDate,
  deleteAdminSpecialPrice,
  getAdminCurrentUser,
  getAdminPropertySettings,
  hasAdminSession,
  listAdminBlockedDates,
  listAdminReservations,
  listAdminSpecialPrices,
  rejectAdminReservation,
  type AdminBlockedDate,
  type AdminPropertySettings,
  type AdminReservation,
  type AdminReservationDetail,
  type AdminReservationStatus,
  type AdminSpecialDatePrice,
  type AdminUser,
  updateAdminBlockedDate,
  updateAdminPropertySettings,
  updateAdminSpecialPrice,
  uploadAdminPaymentReceipt,
} from '@/modules/admin/api/adminApi'
import {
  defaultExperienceCards,
  featureIconOptions,
  FeatureIcon,
  type ExperienceCard,
} from '@/modules/public-site/content/experienceCards'
import {
  propertyGalleryImages,
  propertyHeroImageIds,
  type PropertyGalleryImage,
} from '@/modules/public-site/content/propertyMedia'
import type { LocationMapConfig, LocationMapPoint } from '@/modules/public-site/api/publicSiteApi'
import { publicPricingRules, type PublicPricingRules } from '@/modules/public-site/pricing/pricingRules'
import { getApiErrorMessage } from '@/shared/api/http'
import { useAsyncData } from '@/shared/hooks/useAsyncData'
import { cn } from '@/shared/lib/cn'
import { formatCurrency } from '@/shared/lib/format'
import { FeedbackPanel } from '@/shared/ui/FeedbackPanel'
import { LoadingPanel } from '@/shared/ui/LoadingPanel'

type DashboardData = {
  blockedDates: AdminBlockedDate[]
  propertySettings: AdminPropertySettings
  reservations: AdminReservation[]
  specialPrices: AdminSpecialDatePrice[]
  user: AdminUser
}

type PanelFeedback = {
  tone: 'danger' | 'success'
  message: string
} | null

type BlockedDateDraft = {
  title: string
  start_date: string
  end_date: string
  block_type: string
  reason: string
}

type SpecialPriceDraft = {
  name: string
  start_date: string
  end_date: string
  daily_price: string
  description: string
}

type PaymentReceiptDraft = {
  amount: string
  file: File | null
  notes: string
  payment_date: string
  reference_number: string
}

type ReservationActionDraft = {
  approveComment: string
  rejectComment: string
  rejectReason: string
}

const adminSections = [
  { id: 'panel-resumen', label: 'Resumen' },
  { id: 'panel-solicitudes', label: 'Solicitudes' },
  { id: 'panel-propiedad', label: 'Propiedad' },
  { id: 'panel-precios', label: 'Precios' },
  { id: 'panel-experiencias', label: 'Servicios' },
  { id: 'panel-galeria', label: 'Galeria' },
  { id: 'panel-mapa', label: 'Mapa' },
  { id: 'panel-disponibilidad', label: 'Disponibilidad' },
  { id: 'panel-especiales', label: 'Fechas especiales' },
] as const

const reservationStatusTone: Record<
  AdminReservationStatus,
  'accent' | 'danger' | 'neutral' | 'success' | 'warning'
> = {
  awaiting_payment: 'warning',
  cancelled: 'neutral',
  confirmed: 'success',
  expired: 'neutral',
  observed: 'warning',
  payment_submitted: 'accent',
  pending: 'warning',
  rejected: 'danger',
}

const activeReservationStatuses: AdminReservationStatus[] = [
  'pending',
  'observed',
  'awaiting_payment',
  'payment_submitted',
]

const terminalReservationStatuses: AdminReservationStatus[] = ['rejected', 'cancelled', 'expired']

const blockTypeOptions = [
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'owner_use', label: 'Uso interno' },
  { value: 'event', label: 'Evento privado' },
  { value: 'other', label: 'Otro' },
] as const

const mapPointCategoryOptions = [
  { value: 'landmark', label: 'Referencia interna' },
  { value: 'drinks', label: 'Botilleria' },
  { value: 'groceries', label: 'Minimarket' },
  { value: 'butcher', label: 'Carniceria' },
  { value: 'pharmacy', label: 'Farmacia' },
  { value: 'station', label: 'Estacion / tren' },
] as const

function createEmptyBlockedDateDraft(): BlockedDateDraft {
  return {
    title: '',
    start_date: '',
    end_date: '',
    block_type: 'maintenance',
    reason: '',
  }
}

function createEmptySpecialPriceDraft(): SpecialPriceDraft {
  return {
    name: '',
    start_date: '',
    end_date: '',
    daily_price: '',
    description: '',
  }
}

function createEmptyPaymentReceiptDraft(): PaymentReceiptDraft {
  return {
    amount: '',
    file: null,
    notes: '',
    payment_date: '',
    reference_number: '',
  }
}

function createEmptyReservationActionDraft(): ReservationActionDraft {
  return {
    approveComment: '',
    rejectComment: '',
    rejectReason: '',
  }
}

function createDefaultLocationMap(): LocationMapConfig {
  return {
    venue: {
      name: 'Parcela recreativa',
      address: '',
      latitude: null,
      longitude: null,
      mapImageUrl: '',
      mapNotes: '',
    },
    points: [],
  }
}

function createMapPoint(index: number): LocationMapPoint {
  return {
    id: `punto-${index + 1}`,
    label: 'Nuevo punto',
    category: 'landmark',
    description: '',
    address: '',
    latitude: null,
    longitude: null,
    x: 50,
    y: 50,
    url: '',
    isActive: true,
  }
}

function parseAmenities(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function moveListItem<T>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items
  }

  const nextItems = [...items]
  const [currentItem] = nextItems.splice(index, 1)
  nextItems.splice(nextIndex, 0, currentItem)
  return nextItems
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatDateLabel(value: string) {
  if (!value) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

function getReservationCustomerName(reservation: AdminReservation | AdminReservationDetail) {
  const fullName = `${reservation.customer.first_name || ''} ${
    reservation.customer.last_name || ''
  }`.trim()
  return fullName || reservation.customer.email
}

function isReservationFinished(reservation: AdminReservation) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return reservation.status === 'confirmed' && new Date(`${reservation.end_date}T12:00:00`) < today
}

function SelectField({
  id,
  label,
  onChange,
  options,
  value,
}: {
  id: string
  label: string
  onChange: (value: string) => void
  options: readonly { label: string; value: string }[]
  value: string
}) {
  return (
    <label className="flex w-full flex-col gap-3">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <select
        className="h-[var(--component-input-height)] w-full rounded-[var(--component-input-radius)] border border-border-soft bg-panel px-[var(--component-input-padding-inline)] text-sm text-text-primary shadow-soft outline-none transition-[border-color,box-shadow,background-color] duration-swift ease-standard focus:border-accent focus:shadow-[0_0_0_var(--focus-ring-size)_rgb(var(--color-focus-ring)/0.28)]"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function SectionCard({
  id,
  title,
  description,
  badge,
  children,
  action,
  isOpen,
  onToggle,
}: {
  action?: ReactNode
  badge?: string
  children: ReactNode
  description: string
  id: string
  isOpen: boolean
  onToggle: () => void
  title: string
}) {
  return (
    <Card
      className="scroll-mt-6 rounded-[1.8rem] border-border-soft/80 bg-[linear-gradient(145deg,rgb(var(--color-panel)),rgb(var(--color-panel-muted)/0.96)_72%,rgb(var(--color-accent-soft)/0.18))] shadow-soft"
      id={id}
    >
      <CardHeader className="gap-4 border-b border-border-soft/70 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            {badge ? <Badge tone="accent">{badge}</Badge> : null}
            <div className="space-y-2">
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            {isOpen ? action : null}
            <button
              aria-expanded={isOpen}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-border-soft bg-panel px-4 text-sm font-medium text-text-primary transition-[transform,border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:border-accent/38 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]"
              onClick={onToggle}
              type="button"
            >
              <span>{isOpen ? 'Cerrar' : 'Abrir'}</span>
              <span
                aria-hidden="true"
                className={cn(
                  'inline-block text-base transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  isOpen ? 'rotate-0' : '-rotate-180',
                )}
              >
                ↑
              </span>
            </button>
          </div>
        </div>
      </CardHeader>
      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <CardContent className="pt-6">{children}</CardContent>
        </div>
      </div>
    </Card>
  )
}

function CollapsibleEditorCard({
  actions,
  children,
  defaultOpen = false,
  leading,
  subtitle,
  title,
}: {
  actions?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  leading?: ReactNode
  subtitle?: string
  title: string
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="grid gap-4 rounded-[1.4rem] border border-border-soft bg-panel px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {leading}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{title}</p>
            {subtitle ? <p className="mt-1 text-sm text-text-secondary">{subtitle}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <button
            aria-expanded={isOpen}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-border-soft bg-panel-muted/72 px-4 text-sm font-medium text-text-primary transition-[transform,border-color,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:border-accent/38 hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgb(var(--color-focus-ring)/0.42)]"
            onClick={() => setIsOpen((current) => !current)}
            type="button"
          >
            <span>{isOpen ? 'Contraer' : 'Expandir'}</span>
            <span
              aria-hidden="true"
              className={cn(
                'inline-block text-base transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                isOpen ? 'rotate-0' : '-rotate-180',
              )}
            >
              ↓
            </span>
          </button>
        </div>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border-soft/80 pt-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

function ReservationRequestCard({
  actionDraft,
  isSaving,
  item,
  onApprove,
  onReject,
  onUpdateActionDraft,
  onUpdateReceiptDraft,
  onUploadReceipt,
  receiptDraft,
}: {
  actionDraft: ReservationActionDraft
  isSaving: boolean
  item: AdminReservation
  onApprove: (item: AdminReservation) => void
  onReject: (item: AdminReservation) => void
  onUpdateActionDraft: (
    publicId: string,
    updater: (current: ReservationActionDraft) => ReservationActionDraft,
  ) => void
  onUpdateReceiptDraft: (
    publicId: string,
    updater: (current: PaymentReceiptDraft) => PaymentReceiptDraft,
  ) => void
  onUploadReceipt: (item: AdminReservation) => void
  receiptDraft: PaymentReceiptDraft
}) {
  const [isOpen, setIsOpen] = useState(false)
  const canApprove = item.status === 'pending' || item.status === 'observed' || item.status === 'payment_submitted'
  const canReject = item.status === 'pending' || item.status === 'observed' || item.status === 'payment_submitted'
  const canUploadReceipt = item.status === 'awaiting_payment' || item.status === 'payment_submitted'
  const approveLabel = item.status === 'payment_submitted' ? 'Confirmar reserva' : 'Aprobar solicitud'

  return (
    <div className="rounded-[1.5rem] border border-border-soft bg-panel px-5 py-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={reservationStatusTone[item.status]}>{item.status_label || item.status}</Badge>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">
              {formatDateLabel(item.start_date)} - {formatDateLabel(item.end_date)}
            </span>
          </div>
          <div>
            <p className="font-display text-2xl leading-tight text-text-primary">
              {getReservationCustomerName(item)}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {item.customer.email} - {item.guest_count} personas -{' '}
              {item.quoted_total_amount ? formatCurrency(Number(item.quoted_total_amount)) : 'Sin valor'}
            </p>
          </div>
        </div>
        <div className="text-right text-xs uppercase tracking-[0.16em] text-text-tertiary">
          <p>Solicitud</p>
          <p className="mt-1 font-semibold text-text-secondary">
            {item.public_id.slice(0, 8)}
          </p>
          <button
            aria-expanded={isOpen}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-border-soft bg-panel-muted px-4 text-sm font-semibold normal-case tracking-normal text-text-primary transition-[transform,border-color,background-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-px hover:border-accent/38 hover:bg-accent-soft"
            onClick={() => setIsOpen((current) => !current)}
            type="button"
          >
            <span>{isOpen ? 'Contraer' : 'Expandir'}</span>
            <span
              aria-hidden="true"
              className={cn(
                'inline-block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                isOpen ? 'rotate-180' : 'rotate-0',
              )}
            >
              v
            </span>
          </button>
        </div>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows,opacity,margin-top] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          isOpen ? 'mt-5 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="grid gap-5 border-t border-border-soft/80 pt-5">
            {item.customer_message ? (
              <div className="rounded-[1.1rem] border border-border-soft bg-panel-muted/70 px-4 py-3 text-sm leading-7 text-text-secondary">
                {item.customer_message}
              </div>
            ) : null}

            <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
              <div className="grid gap-3 rounded-[1.25rem] border border-border-soft bg-panel-muted/60 px-4 py-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  Procesar solicitud
                </p>
                {canApprove ? (
                  <Textarea
                    id={`approve-comment-${item.public_id}`}
                    label="Nota de aprobacion"
                    onChange={(event) =>
                      onUpdateActionDraft(item.public_id, (current) => ({
                        ...current,
                        approveComment: event.target.value,
                      }))
                    }
                    rows={2}
                    value={actionDraft.approveComment}
                  />
                ) : null}
                {canReject ? (
                  <div className="grid gap-3">
                    <Input
                      id={`reject-reason-${item.public_id}`}
                      label="Motivo de rechazo"
                      onChange={(event) =>
                        onUpdateActionDraft(item.public_id, (current) => ({
                          ...current,
                          rejectReason: event.target.value,
                        }))
                      }
                      value={actionDraft.rejectReason}
                    />
                    <Textarea
                      id={`reject-comment-${item.public_id}`}
                      label="Comentario interno"
                      onChange={(event) =>
                        onUpdateActionDraft(item.public_id, (current) => ({
                          ...current,
                          rejectComment: event.target.value,
                        }))
                      }
                      rows={2}
                      value={actionDraft.rejectComment}
                    />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {canApprove ? (
                    <Button disabled={isSaving} onClick={() => onApprove(item)}>
                      {isSaving ? 'Procesando...' : approveLabel}
                    </Button>
                  ) : null}
                  {canReject ? (
                    <Button disabled={isSaving} onClick={() => onReject(item)} variant="danger">
                      Rechazar
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 rounded-[1.25rem] border border-border-soft bg-panel-muted/60 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Comprobante
                  </p>
                  <Badge tone={item.payment_receipts_count > 0 ? 'accent' : 'neutral'}>
                    {item.payment_receipts_count} carga{item.payment_receipts_count === 1 ? '' : 's'}
                  </Badge>
                </div>
                {item.latest_payment_receipt ? (
                  <div className="rounded-[1rem] border border-border-soft bg-panel px-4 py-3 text-sm leading-7 text-text-secondary">
                    <p className="font-semibold text-text-primary">Ultimo comprobante</p>
                    <p>
                      {item.latest_payment_receipt.amount
                        ? formatCurrency(Number(item.latest_payment_receipt.amount))
                        : 'Monto sin registrar'}
                      {item.latest_payment_receipt.reference_number
                        ? ` - ${item.latest_payment_receipt.reference_number}`
                        : ''}
                    </p>
                    {item.latest_payment_receipt.file_url ? (
                      <a
                        className="font-semibold text-accent-emphasis underline-offset-4 hover:underline"
                        href={item.latest_payment_receipt.file_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Abrir archivo
                      </a>
                    ) : null}
                  </div>
                ) : null}
                {canUploadReceipt ? (
                  <>
                    <label className="grid gap-2 text-sm font-medium text-text-secondary">
                      Archivo recibido
                      <input
                        className="w-full rounded-[1rem] border border-border-soft bg-panel px-4 py-3 text-sm text-text-secondary"
                        onChange={(event) =>
                          onUpdateReceiptDraft(item.public_id, (current) => ({
                            ...current,
                            file: event.target.files?.[0] || null,
                          }))
                        }
                        type="file"
                      />
                    </label>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input
                        id={`receipt-amount-${item.public_id}`}
                        label="Monto"
                        onChange={(event) =>
                          onUpdateReceiptDraft(item.public_id, (current) => ({
                            ...current,
                            amount: event.target.value,
                          }))
                        }
                        type="number"
                        value={receiptDraft.amount}
                      />
                      <Input
                        id={`receipt-date-${item.public_id}`}
                        label="Fecha pago"
                        onChange={(event) =>
                          onUpdateReceiptDraft(item.public_id, (current) => ({
                            ...current,
                            payment_date: event.target.value,
                          }))
                        }
                        type="date"
                        value={receiptDraft.payment_date}
                      />
                      <Input
                        id={`receipt-reference-${item.public_id}`}
                        label="Referencia"
                        onChange={(event) =>
                          onUpdateReceiptDraft(item.public_id, (current) => ({
                            ...current,
                            reference_number: event.target.value,
                          }))
                        }
                        value={receiptDraft.reference_number}
                      />
                    </div>
                    <Textarea
                      id={`receipt-notes-${item.public_id}`}
                      label="Notas"
                      onChange={(event) =>
                        onUpdateReceiptDraft(item.public_id, (current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      rows={2}
                      value={receiptDraft.notes}
                    />
                    <Button disabled={isSaving} onClick={() => onUploadReceipt(item)} variant="secondary">
                      {isSaving ? 'Cargando...' : 'Agregar comprobante manual'}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm leading-7 text-text-secondary">
                    La carga manual queda disponible cuando la solicitud ya fue aprobada y espera pago.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function createFallbackPropertySettings(): AdminPropertySettings {
  return {
    public_id: '',
    name: 'Parcela recreativa',
    short_description: '',
    location_name: '',
    address: '',
    max_guest_count: null,
    base_daily_price: null,
    currency: 'CLP',
    check_in_time: null,
    check_out_time: null,
    contact_email: '',
    contact_phone: '',
    amenities: [],
    pricing_rules: publicPricingRules,
    experience_cards: defaultExperienceCards,
    gallery_images: propertyGalleryImages,
    hero_gallery_image_ids: [...propertyHeroImageIds],
    location_map: createDefaultLocationMap(),
    is_active: true,
  }
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const { data, error, isLoading, reload } = useAsyncData<DashboardData>(async () => {
    const [user, propertySettings, blockedDates, specialPrices, reservations] = await Promise.all([
      getAdminCurrentUser(),
      getAdminPropertySettings(),
      listAdminBlockedDates(),
      listAdminSpecialPrices(),
      listAdminReservations(),
    ])

    return {
      user,
      propertySettings,
      blockedDates,
      reservations,
      specialPrices,
    }
  })
  const [propertyDraft, setPropertyDraft] = useState<AdminPropertySettings | null>(null)
  const [blockedDates, setBlockedDates] = useState<AdminBlockedDate[]>([])
  const [reservations, setReservations] = useState<AdminReservation[]>([])
  const [specialPrices, setSpecialPrices] = useState<AdminSpecialDatePrice[]>([])
  const [reservationActionDrafts, setReservationActionDrafts] = useState<
    Record<string, ReservationActionDraft>
  >({})
  const [receiptDrafts, setReceiptDrafts] = useState<Record<string, PaymentReceiptDraft>>({})
  const [blockedDateDraft, setBlockedDateDraft] = useState<BlockedDateDraft>(() =>
    createEmptyBlockedDateDraft(),
  )
  const [specialPriceDraft, setSpecialPriceDraft] = useState<SpecialPriceDraft>(() =>
    createEmptySpecialPriceDraft(),
  )
  const [propertyFeedback, setPropertyFeedback] = useState<PanelFeedback>(null)
  const [availabilityFeedback, setAvailabilityFeedback] = useState<PanelFeedback>(null)
  const [reservationFeedback, setReservationFeedback] = useState<PanelFeedback>(null)
  const [specialPriceFeedback, setSpecialPriceFeedback] = useState<PanelFeedback>(null)
  const [isSavingProperty, setIsSavingProperty] = useState(false)
  const [isCreatingBlockedDate, setIsCreatingBlockedDate] = useState(false)
  const [isCreatingSpecialPrice, setIsCreatingSpecialPrice] = useState(false)
  const [savingReservationIds, setSavingReservationIds] = useState<string[]>([])
  const [savingBlockedIds, setSavingBlockedIds] = useState<string[]>([])
  const [savingSpecialPriceIds, setSavingSpecialPriceIds] = useState<string[]>([])

  useEffect(() => {
    if (!data) {
      return
    }

    setPropertyDraft(data.propertySettings || createFallbackPropertySettings())
    setBlockedDates(data.blockedDates)
    setReservations(data.reservations)
    setSpecialPrices(data.specialPrices)
  }, [data])

  useEffect(() => {
    if (!activeSectionId) {
      return
    }

    function scrollSectionIntoView(sectionId: string, behavior: ScrollBehavior = 'smooth') {
      const sectionElement = document.getElementById(sectionId)
      if (!sectionElement) {
        return
      }

      const topOffset = 24
      const sectionTop = sectionElement.getBoundingClientRect().top + window.scrollY - topOffset

      window.scrollTo({
        top: Math.max(sectionTop, 0),
        behavior,
      })
    }

    let frameId = 0
    let syncTimeoutId = 0
    let settleTimeoutId = 0

    frameId = window.requestAnimationFrame(() => {
      syncTimeoutId = window.setTimeout(() => {
        scrollSectionIntoView(activeSectionId)
      }, 60)

      // Corrige la posicion cuando termina la transicion del acordeon y el layout ya se estabilizo.
      settleTimeoutId = window.setTimeout(() => {
        scrollSectionIntoView(activeSectionId)
      }, 560)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(syncTimeoutId)
      window.clearTimeout(settleTimeoutId)
    }
  }, [activeSectionId])

  if (!hasAdminSession()) {
    return <Navigate replace to="/panel-admin/login" />
  }

  async function handleLogout() {
    clearAdminSession()
    navigate('/panel-admin/login', { replace: true })
  }

  function openSection(sectionId: string) {
    function scrollSectionIntoView(behavior: ScrollBehavior = 'smooth') {
      const sectionElement = document.getElementById(sectionId)
      if (!sectionElement) {
        return
      }

      const topOffset = 24
      const sectionTop = sectionElement.getBoundingClientRect().top + window.scrollY - topOffset

      window.scrollTo({
        top: Math.max(sectionTop, 0),
        behavior,
      })
    }

    setActiveSectionId((current) => {
      if (current === sectionId) {
        window.requestAnimationFrame(() => {
          scrollSectionIntoView()
        })
        return current
      }

      return sectionId
    })
  }

  function toggleSection(sectionId: string) {
    setActiveSectionId((current) => (current === sectionId ? null : sectionId))
  }

  function updatePropertyDraft(
    updater: (current: AdminPropertySettings) => AdminPropertySettings,
  ) {
    setPropertyDraft((current) => (current ? updater(current) : current))
  }

  function updatePricingRules(updater: (current: PublicPricingRules) => PublicPricingRules) {
    updatePropertyDraft((current) => ({
      ...current,
      pricing_rules: updater(current.pricing_rules),
    }))
  }

  function updateExperienceCards(updater: (current: ExperienceCard[]) => ExperienceCard[]) {
    updatePropertyDraft((current) => ({
      ...current,
      experience_cards: updater(current.experience_cards),
    }))
  }

  function updateGallery(
    updater: (currentImages: PropertyGalleryImage[], heroIds: string[]) => {
      gallery_images: PropertyGalleryImage[]
      hero_gallery_image_ids: string[]
    },
  ) {
    updatePropertyDraft((current) => ({
      ...current,
      ...updater(current.gallery_images, current.hero_gallery_image_ids),
    }))
  }

  function updateLocationMap(updater: (current: LocationMapConfig) => LocationMapConfig) {
    updatePropertyDraft((current) => ({
      ...current,
      location_map: updater(current.location_map || createDefaultLocationMap()),
    }))
  }

  async function savePropertySettings() {
    if (!propertyDraft) {
      return
    }

    try {
      setIsSavingProperty(true)
      setPropertyFeedback(null)
      const updatedProperty = await updateAdminPropertySettings(propertyDraft)
      setPropertyDraft(updatedProperty)
      setPropertyFeedback({
        tone: 'success',
        message: 'La configuracion publica se guardo correctamente y ya queda disponible para la web.',
      })
    } catch (saveError) {
      setPropertyFeedback({
        tone: 'danger',
        message: getApiErrorMessage(saveError),
      })
    } finally {
      setIsSavingProperty(false)
    }
  }

  function updateReservationActionDraft(
    publicId: string,
    updater: (current: ReservationActionDraft) => ReservationActionDraft,
  ) {
    setReservationActionDrafts((current) => ({
      ...current,
      [publicId]: updater(current[publicId] || createEmptyReservationActionDraft()),
    }))
  }

  function updateReceiptDraft(
    publicId: string,
    updater: (current: PaymentReceiptDraft) => PaymentReceiptDraft,
  ) {
    setReceiptDrafts((current) => ({
      ...current,
      [publicId]: updater(current[publicId] || createEmptyPaymentReceiptDraft()),
    }))
  }

  async function refreshReservations() {
    const nextReservations = await listAdminReservations()
    setReservations(nextReservations)
    return nextReservations
  }

  async function handleApproveReservation(item: AdminReservation) {
    const draft = reservationActionDrafts[item.public_id] || createEmptyReservationActionDraft()

    try {
      setSavingReservationIds((current) => [...current, item.public_id])
      setReservationFeedback(null)
      await approveAdminReservation(item.public_id, draft.approveComment)
      await refreshReservations()
      setReservationActionDrafts((current) => ({
        ...current,
        [item.public_id]: {
          ...(current[item.public_id] || createEmptyReservationActionDraft()),
          approveComment: '',
        },
      }))
      setReservationFeedback({
        tone: 'success',
        message:
          item.status === 'payment_submitted'
            ? 'La reserva quedo confirmada y el comprobante fue aprobado.'
            : 'La solicitud fue aprobada y quedo esperando comprobante.',
      })
    } catch (approveError) {
      setReservationFeedback({
        tone: 'danger',
        message: getApiErrorMessage(approveError),
      })
    } finally {
      setSavingReservationIds((current) => current.filter((id) => id !== item.public_id))
    }
  }

  async function handleRejectReservation(item: AdminReservation) {
    const draft = reservationActionDrafts[item.public_id] || createEmptyReservationActionDraft()

    if (!draft.rejectReason.trim()) {
      setReservationFeedback({
        tone: 'danger',
        message: 'Agrega un motivo antes de rechazar la solicitud.',
      })
      return
    }

    try {
      setSavingReservationIds((current) => [...current, item.public_id])
      setReservationFeedback(null)
      await rejectAdminReservation(item.public_id, draft.rejectReason, draft.rejectComment)
      await refreshReservations()
      setReservationActionDrafts((current) => ({
        ...current,
        [item.public_id]: createEmptyReservationActionDraft(),
      }))
      setReservationFeedback({
        tone: 'success',
        message: 'La solicitud fue rechazada y quedo registrada en el historial.',
      })
    } catch (rejectError) {
      setReservationFeedback({
        tone: 'danger',
        message: getApiErrorMessage(rejectError),
      })
    } finally {
      setSavingReservationIds((current) => current.filter((id) => id !== item.public_id))
    }
  }

  async function handleUploadManualReceipt(item: AdminReservation) {
    const draft = receiptDrafts[item.public_id] || createEmptyPaymentReceiptDraft()

    if (!draft.file) {
      setReservationFeedback({
        tone: 'danger',
        message: 'Selecciona el archivo del comprobante antes de cargarlo.',
      })
      return
    }

    const formData = new FormData()
    formData.append('file', draft.file)
    if (draft.amount) {
      formData.append('amount', draft.amount)
    }
    if (draft.payment_date) {
      formData.append('payment_date', draft.payment_date)
    }
    if (draft.reference_number) {
      formData.append('reference_number', draft.reference_number)
    }
    if (draft.notes) {
      formData.append('notes', draft.notes)
    }

    try {
      setSavingReservationIds((current) => [...current, item.public_id])
      setReservationFeedback(null)
      await uploadAdminPaymentReceipt(item.public_id, formData)
      await refreshReservations()
      setReceiptDrafts((current) => ({
        ...current,
        [item.public_id]: createEmptyPaymentReceiptDraft(),
      }))
      setReservationFeedback({
        tone: 'success',
        message: 'El comprobante manual quedo cargado y la reserva paso a revision de pago.',
      })
    } catch (uploadError) {
      setReservationFeedback({
        tone: 'danger',
        message: getApiErrorMessage(uploadError),
      })
    } finally {
      setSavingReservationIds((current) => current.filter((id) => id !== item.public_id))
    }
  }

  async function handleCreateBlockedDate() {
    try {
      setIsCreatingBlockedDate(true)
      setAvailabilityFeedback(null)
      const createdItem = await createAdminBlockedDate({
        ...blockedDateDraft,
        is_active: true,
        metadata: {},
      })
      setBlockedDates((current) => [...current, createdItem])
      setBlockedDateDraft(createEmptyBlockedDateDraft())
      setAvailabilityFeedback({
        tone: 'success',
        message: 'El bloqueo se agrego y ya impacta la disponibilidad publica.',
      })
    } catch (createError) {
      setAvailabilityFeedback({
        tone: 'danger',
        message: getApiErrorMessage(createError),
      })
    } finally {
      setIsCreatingBlockedDate(false)
    }
  }

  async function handleSaveBlockedDate(item: AdminBlockedDate) {
    try {
      setSavingBlockedIds((current) => [...current, item.public_id])
      setAvailabilityFeedback(null)
      const updatedItem = await updateAdminBlockedDate(item.public_id, {
        title: item.title,
        start_date: item.start_date,
        end_date: item.end_date,
        block_type: item.block_type,
        reason: item.reason,
        is_active: item.is_active,
        metadata: item.metadata,
      })
      setBlockedDates((current) =>
        current.map((blockedDate) =>
          blockedDate.public_id === item.public_id ? updatedItem : blockedDate,
        ),
      )
      setAvailabilityFeedback({
        tone: 'success',
        message: `Se actualizo el bloqueo "${updatedItem.title}".`,
      })
    } catch (saveError) {
      setAvailabilityFeedback({
        tone: 'danger',
        message: getApiErrorMessage(saveError),
      })
    } finally {
      setSavingBlockedIds((current) => current.filter((id) => id !== item.public_id))
    }
  }

  async function handleDeleteBlockedDate(publicId: string) {
    try {
      setSavingBlockedIds((current) => [...current, publicId])
      await deleteAdminBlockedDate(publicId)
      setBlockedDates((current) => current.filter((item) => item.public_id !== publicId))
      setAvailabilityFeedback({
        tone: 'success',
        message: 'El bloqueo se elimino correctamente.',
      })
    } catch (deleteError) {
      setAvailabilityFeedback({
        tone: 'danger',
        message: getApiErrorMessage(deleteError),
      })
    } finally {
      setSavingBlockedIds((current) => current.filter((id) => id !== publicId))
    }
  }

  async function handleCreateSpecialPrice() {
    try {
      setIsCreatingSpecialPrice(true)
      setSpecialPriceFeedback(null)
      const createdItem = await createAdminSpecialPrice({
        name: specialPriceDraft.name,
        start_date: specialPriceDraft.start_date,
        end_date: specialPriceDraft.end_date,
        daily_price: Number(specialPriceDraft.daily_price),
        currency: propertyDraft?.currency || 'CLP',
        description: specialPriceDraft.description,
        is_active: true,
        metadata: {},
      })
      setSpecialPrices((current) => [...current, createdItem])
      setSpecialPriceDraft(createEmptySpecialPriceDraft())
      setSpecialPriceFeedback({
        tone: 'success',
        message: 'La tarifa especial ya quedo registrada para esas fechas.',
      })
    } catch (createError) {
      setSpecialPriceFeedback({
        tone: 'danger',
        message: getApiErrorMessage(createError),
      })
    } finally {
      setIsCreatingSpecialPrice(false)
    }
  }

  async function handleSaveSpecialPrice(item: AdminSpecialDatePrice) {
    try {
      setSavingSpecialPriceIds((current) => [...current, item.public_id])
      setSpecialPriceFeedback(null)
      const updatedItem = await updateAdminSpecialPrice(item.public_id, {
        name: item.name,
        start_date: item.start_date,
        end_date: item.end_date,
        daily_price: Number(item.daily_price),
        currency: item.currency,
        description: item.description,
        is_active: item.is_active,
        metadata: item.metadata,
      })
      setSpecialPrices((current) =>
        current.map((price) => (price.public_id === item.public_id ? updatedItem : price)),
      )
      setSpecialPriceFeedback({
        tone: 'success',
        message: `Se actualizo la tarifa especial "${updatedItem.name}".`,
      })
    } catch (saveError) {
      setSpecialPriceFeedback({
        tone: 'danger',
        message: getApiErrorMessage(saveError),
      })
    } finally {
      setSavingSpecialPriceIds((current) => current.filter((id) => id !== item.public_id))
    }
  }

  async function handleDeleteSpecialPrice(publicId: string) {
    try {
      setSavingSpecialPriceIds((current) => [...current, publicId])
      await deleteAdminSpecialPrice(publicId)
      setSpecialPrices((current) => current.filter((item) => item.public_id !== publicId))
      setSpecialPriceFeedback({
        tone: 'success',
        message: 'La tarifa especial se elimino correctamente.',
      })
    } catch (deleteError) {
      setSpecialPriceFeedback({
        tone: 'danger',
        message: getApiErrorMessage(deleteError),
      })
    } finally {
      setSavingSpecialPriceIds((current) => current.filter((id) => id !== publicId))
    }
  }

  const activeBlockedDatesCount = useMemo(
    () => blockedDates.filter((item) => item.is_active).length,
    [blockedDates],
  )
  const activeSpecialPricesCount = useMemo(
    () => specialPrices.filter((item) => item.is_active).length,
    [specialPrices],
  )
  const reservationStats = useMemo(() => {
    const finished = reservations.filter(isReservationFinished).length
    const ready = reservations.filter(
      (item) => item.status === 'confirmed' && !isReservationFinished(item),
    ).length
    const inProgress = reservations.filter((item) =>
      activeReservationStatuses.includes(item.status),
    ).length
    const terminal = reservations.filter((item) =>
      terminalReservationStatuses.includes(item.status),
    ).length
    const paymentReview = reservations.filter(
      (item) =>
        item.status === 'payment_submitted' ||
        item.latest_payment_receipt_status === 'pending_review',
    ).length

    return {
      finished,
      inProgress,
      paymentReview,
      ready,
      terminal,
      total: reservations.length,
    }
  }, [reservations])
  const pendingReservations = useMemo(
    () =>
      reservations.filter((item) =>
        ['pending', 'observed', 'awaiting_payment', 'payment_submitted'].includes(item.status),
      ),
    [reservations],
  )

  if (isLoading || !propertyDraft) {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-canvas))] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <LoadingPanel label="Cargando panel administrativo..." />
        </div>
      </div>
    )
  }

  if (error || data?.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[rgb(var(--color-canvas))] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <FeedbackPanel
            actionLabel="Volver al login"
            description={error || 'No fue posible validar la sesion administrativa.'}
            onAction={handleLogout}
            title="No pudimos abrir el panel"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[rgb(var(--color-canvas))] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(132,188,105,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(203,226,193,0.12),transparent_24%)]" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
        <Card className="overflow-hidden rounded-[2rem] border-border-soft/80 bg-[linear-gradient(140deg,rgba(8,17,13,0.96),rgba(17,38,27,0.92)_56%,rgba(76,112,69,0.82))] p-0 text-white shadow-[0_2rem_5rem_rgba(0,0,0,0.3)]">
          <CardContent className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-4">
              <Badge className="border-white/12 bg-white/10 text-white">Panel propietario</Badge>
              <div className="space-y-3">
                <h1 className="max-w-3xl font-display text-[clamp(2.4rem,2rem+1.4vw,4rem)] leading-[0.96]">
                  Ajusta la experiencia publica de la parcela desde un solo panel.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-white/76">
                  Todo lo que guardes aqui se publica a traves de la API y alimenta la galeria,
                  el simulador, los servicios visibles y la disponibilidad que ve el cliente.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                  Solicitudes activas
                </p>
                <p className="mt-2 font-display text-3xl">{reservationStats.inProgress}</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                  Fotos publicas
                </p>
                <p className="mt-2 font-display text-3xl">{propertyDraft.gallery_images.length}</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                  Bloqueos activos
                </p>
                <p className="mt-2 font-display text-3xl">{activeBlockedDatesCount}</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/58">
                  Tarifas especiales
                </p>
                <p className="mt-2 font-display text-3xl">{activeSpecialPricesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:items-start xl:grid-cols-[18rem_minmax(0,1fr)]">
          <Card className="min-w-0 self-start rounded-[1.75rem] border-border-soft/80 bg-panel/92 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
            <CardHeader>
              <Badge
                className="h-auto max-w-full whitespace-nowrap px-2.5 py-1.5 text-[0.58rem] leading-none tracking-[0.09em]"
                tone="neutral"
              >
                {data.user.email}
              </Badge>
              <CardTitle className="text-[1.3rem] leading-tight">Navegacion del panel</CardTitle>
            </CardHeader>
            <CardContent className="gap-5 lg:overflow-y-auto">
              <div className="grid gap-2">
                {adminSections.map((section) => (
                  <button
                    aria-expanded={activeSectionId === section.id}
                    className={cn(
                      'rounded-[1rem] border px-4 py-3 text-left text-sm font-medium transition-[transform,border-color,background-color,color,box-shadow] duration-swift ease-emphasized hover:-translate-y-px',
                      activeSectionId === section.id
                        ? 'border-accent/38 bg-accent-soft text-text-primary shadow-soft'
                        : 'border-border-soft bg-panel-muted/72 text-text-secondary hover:border-accent/36 hover:bg-accent-soft hover:text-text-primary',
                    )}
                    onClick={() => openSection(section.id)}
                    type="button"
                    key={section.id}
                  >
                    {section.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 rounded-[1.2rem] border border-border-soft bg-panel-muted/72 p-4">
                <a
                  className="inline-flex h-11 items-center justify-center rounded-full border border-accent/45 bg-accent px-5 text-sm font-semibold text-accent-contrast transition-[transform,background-color] duration-swift ease-emphasized hover:-translate-y-px hover:bg-accent-emphasis"
                  href="/"
                  rel="noreferrer"
                  target="_blank"
                >
                  Ver sitio publico
                </a>
                <Button onClick={reload} variant="secondary">
                  Recargar datos
                </Button>
                <Button onClick={handleLogout} variant="ghost">
                  Cerrar sesion
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <SectionCard
              action={
                <Button className="rounded-full px-5" onClick={savePropertySettings}>
                  {isSavingProperty ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              }
              badge="Resumen operativo"
              description="Visibilidad rapida del estado actual y punto de partida del contenido publico."
              id="panel-resumen"
              isOpen={activeSectionId === 'panel-resumen'}
              onToggle={() => toggleSection('panel-resumen')}
              title="Tablero de control"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[1.35rem] border border-accent/25 bg-accent-soft/70 px-4 py-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent-emphasis">
                    En curso
                  </p>
                  <p className="mt-2 font-display text-3xl text-text-primary">
                    {reservationStats.inProgress}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-success/20 bg-success-soft px-4 py-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-success">
                    Listas
                  </p>
                  <p className="mt-2 font-display text-3xl text-text-primary">
                    {reservationStats.ready}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-border-soft bg-panel px-4 py-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Finalizadas
                  </p>
                  <p className="mt-2 font-display text-3xl text-text-primary">
                    {reservationStats.finished}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-warning/25 bg-warning-soft px-4 py-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-warning">
                    Revisar pago
                  </p>
                  <p className="mt-2 font-display text-3xl text-text-primary">
                    {reservationStats.paymentReview}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-border-soft bg-panel px-4 py-4">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Cerradas
                  </p>
                  <p className="mt-2 font-display text-3xl text-text-primary">
                    {reservationStats.terminal}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.35rem] border border-border-soft bg-panel px-4 py-4">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Parcela activa
                  </p>
                  <p className="mt-2 font-display text-2xl text-text-primary">
                    {propertyDraft.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    {propertyDraft.location_name || 'Ubicacion referencial pendiente.'}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-border-soft bg-panel px-4 py-4">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Precio visible
                  </p>
                  <p className="mt-2 font-display text-2xl text-text-primary">
                    {formatCurrency(propertyDraft.pricing_rules.firstTierBasePrice)}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    Tramo base entre {propertyDraft.pricing_rules.minimumGuestCount} y{' '}
                    {propertyDraft.pricing_rules.firstTierMaximumGuestCount} personas.
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-border-soft bg-panel px-4 py-4">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                    Horario publico
                  </p>
                  <p className="mt-2 font-display text-2xl text-text-primary">
                    {propertyDraft.pricing_rules.baseSchedule.start} a{' '}
                    {propertyDraft.pricing_rules.baseSchedule.end}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">
                    Con hasta {propertyDraft.pricing_rules.maximumAdditionalHours} horas extra.
                  </p>
                </div>
              </div>
              {propertyFeedback ? (
                <div
                  className={cn(
                    'rounded-[1.2rem] border px-4 py-4 text-sm leading-7',
                    propertyFeedback.tone === 'success'
                      ? 'border-success/22 bg-success-soft text-success'
                      : 'border-danger/22 bg-danger-soft text-danger',
                  )}
                >
                  {propertyFeedback.message}
                </div>
              ) : null}
            </SectionCard>

            <SectionCard
              badge="Gestion comercial"
              description="Revisa nuevas solicitudes, aprueba el flujo de pago, carga comprobantes recibidos fuera de la web y confirma reservas."
              id="panel-solicitudes"
              isOpen={activeSectionId === 'panel-solicitudes'}
              onToggle={() => toggleSection('panel-solicitudes')}
              title="Solicitudes y reservas"
            >
              <div className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[1.25rem] border border-border-soft bg-panel px-4 py-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                      Total historico
                    </p>
                    <p className="mt-2 font-display text-3xl text-text-primary">
                      {reservationStats.total}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-accent/22 bg-accent-soft/70 px-4 py-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-accent-emphasis">
                      Pendientes
                    </p>
                    <p className="mt-2 font-display text-3xl text-text-primary">
                      {pendingReservations.length}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-warning/22 bg-warning-soft px-4 py-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-warning">
                      Pagos por validar
                    </p>
                    <p className="mt-2 font-display text-3xl text-text-primary">
                      {reservationStats.paymentReview}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-success/20 bg-success-soft px-4 py-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-success">
                      Reservas listas
                    </p>
                    <p className="mt-2 font-display text-3xl text-text-primary">
                      {reservationStats.ready}
                    </p>
                  </div>
                </div>

                {reservationFeedback ? (
                  <div
                    className={cn(
                      'rounded-[1.2rem] border px-4 py-4 text-sm leading-7',
                      reservationFeedback.tone === 'success'
                        ? 'border-success/22 bg-success-soft text-success'
                        : 'border-danger/22 bg-danger-soft text-danger',
                    )}
                  >
                    {reservationFeedback.message}
                  </div>
                ) : null}

                <div className="grid gap-4">
                  {reservations.length > 0 ? (
                    reservations.map((item) => (
                      <ReservationRequestCard
                        actionDraft={
                          reservationActionDrafts[item.public_id] ||
                          createEmptyReservationActionDraft()
                        }
                        isSaving={savingReservationIds.includes(item.public_id)}
                        item={item}
                        key={item.public_id}
                        onApprove={handleApproveReservation}
                        onReject={handleRejectReservation}
                        onUpdateActionDraft={updateReservationActionDraft}
                        onUpdateReceiptDraft={updateReceiptDraft}
                        onUploadReceipt={handleUploadManualReceipt}
                        receiptDraft={receiptDrafts[item.public_id] || createEmptyPaymentReceiptDraft()}
                      />
                    ))
                  ) : (
                    <div className="rounded-[1.4rem] border border-dashed border-border-soft bg-panel-muted/60 px-5 py-8 text-center">
                      <p className="font-display text-2xl text-text-primary">
                        Aun no hay solicitudes
                      </p>
                      <p className="mt-2 text-sm leading-7 text-text-secondary">
                        Cuando un cliente envie una solicitud desde la web, aparecera aqui para
                        procesarla.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              action={
                <Button className="rounded-full px-5" onClick={savePropertySettings}>
                  Guardar propiedad
                </Button>
              }
              badge="Identidad publica"
              description="Edita nombre, descripcion, contacto, capacidad y amenities visibles para el cliente."
              id="panel-propiedad"
              isOpen={activeSectionId === 'panel-propiedad'}
              onToggle={() => toggleSection('panel-propiedad')}
              title="Propiedad y contacto"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  id="admin-property-name"
                  label="Nombre publico"
                  onChange={(event) =>
                    updatePropertyDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  value={propertyDraft.name}
                />
                <Input
                  id="admin-property-location"
                  label="Ubicacion referencial"
                  onChange={(event) =>
                    updatePropertyDraft((current) => ({
                      ...current,
                      location_name: event.target.value,
                    }))
                  }
                  value={propertyDraft.location_name}
                />
              </div>

              <Textarea
                id="admin-property-description"
                label="Descripcion principal"
                onChange={(event) =>
                  updatePropertyDraft((current) => ({
                    ...current,
                    short_description: event.target.value,
                  }))
                }
                rows={4}
                value={propertyDraft.short_description}
              />

              <Textarea
                id="admin-property-address"
                label="Direccion"
                onChange={(event) =>
                  updatePropertyDraft((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
                rows={3}
                value={propertyDraft.address}
              />

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Input
                  id="admin-property-email"
                  label="Correo"
                  onChange={(event) =>
                    updatePropertyDraft((current) => ({
                      ...current,
                      contact_email: event.target.value,
                    }))
                  }
                  type="email"
                  value={propertyDraft.contact_email}
                />
                <Input
                  id="admin-property-phone"
                  label="Telefono"
                  onChange={(event) =>
                    updatePropertyDraft((current) => ({
                      ...current,
                      contact_phone: event.target.value,
                    }))
                  }
                  value={propertyDraft.contact_phone}
                />
                <Input
                  id="admin-property-capacity"
                  label="Capacidad maxima"
                  onChange={(event) =>
                    updatePropertyDraft((current) => ({
                      ...current,
                      max_guest_count: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                  type="number"
                  value={propertyDraft.max_guest_count ?? ''}
                />
                <Input
                  id="admin-property-base-price"
                  label="Precio base referencial"
                  onChange={(event) =>
                    updatePropertyDraft((current) => ({
                      ...current,
                      base_daily_price: event.target.value || null,
                    }))
                  }
                  type="number"
                  value={propertyDraft.base_daily_price ?? ''}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <Input
                  id="admin-property-currency"
                  label="Moneda"
                  onChange={(event) =>
                    updatePropertyDraft((current) => ({
                      ...current,
                      currency: event.target.value,
                      pricing_rules: {
                        ...current.pricing_rules,
                        currency: event.target.value,
                      },
                    }))
                  }
                  value={propertyDraft.currency}
                />
                <Input
                  id="admin-property-checkin"
                  label="Hora inicio"
                  onChange={(event) =>
                    updatePropertyDraft((current) => ({
                      ...current,
                      check_in_time: event.target.value || null,
                    }))
                  }
                  type="time"
                  value={propertyDraft.check_in_time ?? ''}
                />
                <Input
                  id="admin-property-checkout"
                  label="Hora termino"
                  onChange={(event) =>
                    updatePropertyDraft((current) => ({
                      ...current,
                      check_out_time: event.target.value || null,
                    }))
                  }
                  type="time"
                  value={propertyDraft.check_out_time ?? ''}
                />
              </div>

              <Textarea
                hint="Separa cada amenity con coma. Estos badges aparecen en la ficha publica."
                id="admin-property-amenities"
                label="Amenities publicos"
                onChange={(event) =>
                  updatePropertyDraft((current) => ({
                    ...current,
                    amenities: parseAmenities(event.target.value),
                  }))
                }
                rows={3}
                value={propertyDraft.amenities.join(', ')}
              />
            </SectionCard>

            <SectionCard
              action={
                <Button className="rounded-full px-5" onClick={savePropertySettings}>
                  Guardar precios
                </Button>
              }
              badge="Simulador"
              description="Controla minimo comercial, tramos, extras, horario y mensaje final del simulador."
              id="panel-precios"
              isOpen={activeSectionId === 'panel-precios'}
              onToggle={() => toggleSection('panel-precios')}
              title="Precios y horario"
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Input
                  id="admin-pricing-min-guests"
                  label="Minimo comercial"
                  onChange={(event) =>
                    updatePricingRules((current) => ({
                      ...current,
                      minimumGuestCount: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  value={propertyDraft.pricing_rules.minimumGuestCount}
                />
                <Input
                  id="admin-pricing-visible-max"
                  label="Maximo visible"
                  onChange={(event) =>
                    updatePricingRules((current) => ({
                      ...current,
                      visibleMaximumGuestCount: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  value={propertyDraft.pricing_rules.visibleMaximumGuestCount}
                />
                <Input
                  id="admin-pricing-first-tier-max"
                  label="Maximo tramo 1"
                  onChange={(event) =>
                    updatePricingRules((current) => ({
                      ...current,
                      firstTierMaximumGuestCount: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  value={propertyDraft.pricing_rules.firstTierMaximumGuestCount}
                />
                <Input
                  id="admin-pricing-second-tier-max"
                  label="Maximo tramo 2"
                  onChange={(event) =>
                    updatePricingRules((current) => ({
                      ...current,
                      secondTierMaximumGuestCount: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  value={propertyDraft.pricing_rules.secondTierMaximumGuestCount}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Input
                  id="admin-pricing-first-tier-price"
                  label="Precio tramo 1"
                  onChange={(event) =>
                    updatePricingRules((current) => ({
                      ...current,
                      firstTierBasePrice: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  value={propertyDraft.pricing_rules.firstTierBasePrice}
                />
                <Input
                  id="admin-pricing-second-tier-price"
                  label="Precio tramo 2"
                  onChange={(event) =>
                    updatePricingRules((current) => ({
                      ...current,
                      secondTierBasePrice: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  value={propertyDraft.pricing_rules.secondTierBasePrice}
                />
                <Input
                  id="admin-pricing-extra-guest-price"
                  label="Extra por persona"
                  onChange={(event) =>
                    updatePricingRules((current) => ({
                      ...current,
                      extraGuestPrice: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  value={propertyDraft.pricing_rules.extraGuestPrice}
                />
                <Input
                  id="admin-pricing-deposit-rate"
                  label="Tasa de abono"
                  onChange={(event) =>
                    updatePricingRules((current) => ({
                      ...current,
                      depositRate: Number(event.target.value || 0),
                    }))
                  }
                  step="0.05"
                  type="number"
                  value={propertyDraft.pricing_rules.depositRate}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Input
                  id="admin-pricing-start-time"
                  label="Hora inicio"
                  onChange={(event) =>
                    updatePricingRules((current) => ({
                      ...current,
                      baseSchedule: {
                        ...current.baseSchedule,
                        start: event.target.value,
                      },
                    }))
                  }
                  type="time"
                  value={propertyDraft.pricing_rules.baseSchedule.start}
                />
                <Input
                  id="admin-pricing-end-time"
                  label="Hora termino"
                  onChange={(event) =>
                    updatePricingRules((current) => ({
                      ...current,
                      baseSchedule: {
                        ...current.baseSchedule,
                        end: event.target.value,
                      },
                    }))
                  }
                  type="time"
                  value={propertyDraft.pricing_rules.baseSchedule.end}
                />
                <Input
                  id="admin-pricing-hour-price"
                  label="Valor hora extra"
                  onChange={(event) =>
                    updatePricingRules((current) => ({
                      ...current,
                      additionalHourPrice: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  value={propertyDraft.pricing_rules.additionalHourPrice}
                />
                <Input
                  id="admin-pricing-max-hours"
                  label="Maximo horas extra"
                  onChange={(event) =>
                    updatePricingRules((current) => ({
                      ...current,
                      maximumAdditionalHours: Number(event.target.value || 0),
                    }))
                  }
                  type="number"
                  value={propertyDraft.pricing_rules.maximumAdditionalHours}
                />
              </div>

              <Textarea
                id="admin-pricing-microcopy"
                label="Mensaje inferior del simulador"
                onChange={(event) =>
                  updatePricingRules((current) => ({
                    ...current,
                    simulatorMicrocopy: event.target.value,
                  }))
                }
                rows={4}
                value={propertyDraft.pricing_rules.simulatorMicrocopy}
              />
            </SectionCard>

            <SectionCard
              action={
                <Button className="rounded-full px-5" onClick={savePropertySettings}>
                  Guardar servicios
                </Button>
              }
              badge="Servicios y entretenimiento"
              description="Edita las cards publicas de experiencia. Puedes cambiar textos, iconos y orden visual."
              id="panel-experiencias"
              isOpen={activeSectionId === 'panel-experiencias'}
              onToggle={() => toggleSection('panel-experiencias')}
              title="Cards de servicios"
            >
              <div className="grid gap-4">
                {propertyDraft.experience_cards.map((card, index) => (
                  <CollapsibleEditorCard
                    actions={
                      <>
                        <Button
                          onClick={() =>
                            updateExperienceCards((current) => moveListItem(current, index, -1))
                          }
                          variant="ghost"
                        >
                          Subir
                        </Button>
                        <Button
                          onClick={() =>
                            updateExperienceCards((current) => moveListItem(current, index, 1))
                          }
                          variant="ghost"
                        >
                          Bajar
                        </Button>
                        <Button
                          onClick={() =>
                            updateExperienceCards((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }
                          variant="danger"
                        >
                          Quitar
                        </Button>
                      </>
                    }
                    key={`${card.title}-${index}`}
                    leading={
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent shadow-soft">
                        <FeatureIcon name={card.icon} />
                      </div>
                    }
                    subtitle={card.title || 'Sin titulo'}
                    title={`Card ${index + 1}`}
                  >
                    <div className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
                        <Input
                          id={`experience-title-${index}`}
                          label="Titulo"
                          onChange={(event) =>
                            updateExperienceCards((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, title: event.target.value } : item,
                              ),
                            )
                          }
                          value={card.title}
                        />
                        <SelectField
                          id={`experience-icon-${index}`}
                          label="Icono"
                          onChange={(value) =>
                            updateExperienceCards((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, icon: value as ExperienceCard['icon'] }
                                  : item,
                              ),
                            )
                          }
                          options={featureIconOptions.map((icon) => ({
                            value: icon,
                            label: icon,
                          }))}
                          value={card.icon}
                        />
                      </div>

                      <Textarea
                        id={`experience-description-${index}`}
                        label="Descripcion"
                        onChange={(event) =>
                          updateExperienceCards((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, description: event.target.value }
                                : item,
                            ),
                          )
                        }
                        rows={3}
                        value={card.description}
                      />
                    </div>
                  </CollapsibleEditorCard>
                ))}
              </div>

              <div className="flex justify-start">
                <Button
                  onClick={() =>
                    updateExperienceCards((current) => [
                      ...current,
                      {
                        title: 'Nueva card',
                        description: 'Describe aqui el servicio o espacio.',
                        icon: 'support',
                      },
                    ])
                  }
                  variant="secondary"
                >
                  Agregar card
                </Button>
              </div>
            </SectionCard>

            <SectionCard
              action={
                <Button className="rounded-full px-5" onClick={savePropertySettings}>
                  Guardar galeria
                </Button>
              }
              badge="Fotos y escenas"
              description="Administra las imagenes publicas, su metadata visual y cuales se usan como heroes del carrusel."
              id="panel-galeria"
              isOpen={activeSectionId === 'panel-galeria'}
              onToggle={() => toggleSection('panel-galeria')}
              title="Galeria visual"
            >
              <div className="grid gap-4">
                {propertyDraft.gallery_images.map((image, index) => {
                  const isHeroImage = propertyDraft.hero_gallery_image_ids.includes(image.id)

                  return (
                    <CollapsibleEditorCard
                      actions={
                        <>
                          <Button
                            onClick={() =>
                              updateGallery((currentImages, heroIds) => ({
                                gallery_images: moveListItem(currentImages, index, -1),
                                hero_gallery_image_ids: heroIds,
                              }))
                            }
                            variant="ghost"
                          >
                            Subir
                          </Button>
                          <Button
                            onClick={() =>
                              updateGallery((currentImages, heroIds) => ({
                                gallery_images: moveListItem(currentImages, index, 1),
                                hero_gallery_image_ids: heroIds,
                              }))
                            }
                            variant="ghost"
                          >
                            Bajar
                          </Button>
                          <Button
                            onClick={() =>
                              updateGallery((currentImages, heroIds) => {
                                const nextImages = currentImages.filter(
                                  (_, itemIndex) => itemIndex !== index,
                                )
                                return {
                                  gallery_images: nextImages,
                                  hero_gallery_image_ids: heroIds.filter((heroId) => heroId !== image.id),
                                }
                              })
                            }
                            variant="danger"
                          >
                            Quitar
                          </Button>
                        </>
                      }
                      key={`${image.id}-${index}`}
                      leading={
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-[1.1rem] border border-border-soft bg-panel-muted">
                          <img
                            alt={image.alt}
                            className="h-full w-full object-cover"
                            src={image.src}
                          />
                        </div>
                      }
                      subtitle={image.label || image.id}
                      title={`Imagen ${index + 1}`}
                    >
                      <div className="grid gap-4">
                        <div className="flex flex-wrap gap-2">
                          {isHeroImage ? <Badge tone="success">Destacada</Badge> : null}
                          <Badge tone="neutral">{image.orientation}</Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <Input
                            id={`gallery-id-${index}`}
                            label="ID"
                            onChange={(event) =>
                              updateGallery((currentImages, heroIds) => {
                                const previousId = currentImages[index].id
                                const nextId = slugify(event.target.value) || `imagen-${index + 1}`
                                return {
                                  gallery_images: currentImages.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, id: nextId } : item,
                                  ),
                                  hero_gallery_image_ids: heroIds.map((heroId) =>
                                    heroId === previousId ? nextId : heroId,
                                  ),
                                }
                              })
                            }
                            value={image.id}
                          />
                          <Input
                            id={`gallery-label-${index}`}
                            label="Titulo"
                            onChange={(event) =>
                              updateGallery((currentImages, heroIds) => ({
                                gallery_images: currentImages.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, label: event.target.value } : item,
                                ),
                                hero_gallery_image_ids: heroIds,
                              }))
                            }
                            value={image.label}
                          />
                          <Input
                            id={`gallery-area-${index}`}
                            label="Area"
                            onChange={(event) =>
                              updateGallery((currentImages, heroIds) => ({
                                gallery_images: currentImages.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, area: event.target.value } : item,
                                ),
                                hero_gallery_image_ids: heroIds,
                              }))
                            }
                            value={image.area}
                          />
                          <SelectField
                            id={`gallery-orientation-${index}`}
                            label="Orientacion"
                            onChange={(value) =>
                              updateGallery((currentImages, heroIds) => ({
                                gallery_images: currentImages.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        orientation: value as PropertyGalleryImage['orientation'],
                                      }
                                    : item,
                                ),
                                hero_gallery_image_ids: heroIds,
                              }))
                            }
                            options={[
                              { value: 'landscape', label: 'landscape' },
                              { value: 'square', label: 'square' },
                            ]}
                            value={image.orientation}
                          />
                        </div>

                        <Input
                          id={`gallery-src-${index}`}
                          label="Ruta o URL de imagen"
                          onChange={(event) =>
                            updateGallery((currentImages, heroIds) => ({
                              gallery_images: currentImages.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, src: event.target.value } : item,
                              ),
                              hero_gallery_image_ids: heroIds,
                            }))
                          }
                          value={image.src}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                          <Input
                            id={`gallery-object-position-${index}`}
                            label="Object position"
                            onChange={(event) =>
                              updateGallery((currentImages, heroIds) => ({
                                gallery_images: currentImages.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, objectPosition: event.target.value }
                                    : item,
                                ),
                                hero_gallery_image_ids: heroIds,
                              }))
                            }
                            value={image.objectPosition || ''}
                          />
                          <label className="flex items-center gap-3 self-end rounded-[1rem] border border-border-soft bg-panel-muted/65 px-4 py-3">
                            <input
                              checked={isHeroImage}
                              className="h-4 w-4 accent-[rgb(var(--color-accent))]"
                              onChange={() =>
                                updateGallery((currentImages, heroIds) => ({
                                  gallery_images: currentImages,
                                  hero_gallery_image_ids: heroIds.includes(image.id)
                                    ? heroIds.filter((heroId) => heroId !== image.id)
                                    : [...heroIds, image.id],
                                }))
                              }
                              type="checkbox"
                            />
                            <span className="text-sm text-text-secondary">
                              Incluir en el carrusel hero
                            </span>
                          </label>
                        </div>

                        <Textarea
                          id={`gallery-alt-${index}`}
                          label="Texto alternativo"
                          onChange={(event) =>
                            updateGallery((currentImages, heroIds) => ({
                              gallery_images: currentImages.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, alt: event.target.value } : item,
                              ),
                              hero_gallery_image_ids: heroIds,
                            }))
                          }
                          rows={2}
                          value={image.alt}
                        />

                        <Textarea
                          id={`gallery-caption-${index}`}
                          label="Descripcion visible"
                          onChange={(event) =>
                            updateGallery((currentImages, heroIds) => ({
                              gallery_images: currentImages.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, caption: event.target.value } : item,
                              ),
                              hero_gallery_image_ids: heroIds,
                            }))
                          }
                          rows={3}
                          value={image.caption}
                        />
                      </div>
                    </CollapsibleEditorCard>
                  )
                })}
              </div>

              <div className="flex justify-start">
                <Button
                  onClick={() =>
                    updateGallery((currentImages, heroIds) => {
                      const nextIndex = currentImages.length + 1
                      return {
                        gallery_images: [
                          ...currentImages,
                          {
                            id: `imagen-${nextIndex}`,
                            src: '/images/parcela/nueva-imagen.jpg',
                            alt: 'Nueva imagen de la parcela.',
                            label: `Nueva imagen ${nextIndex}`,
                            caption: 'Describe aqui lo que se muestra en esta foto.',
                            area: 'Nueva escena',
                            objectPosition: 'center center',
                            orientation: 'landscape',
                          },
                        ],
                        hero_gallery_image_ids: heroIds,
                      }
                    })
                  }
                  variant="secondary"
                >
                  Agregar imagen
                </Button>
              </div>
            </SectionCard>

            <SectionCard
              action={
                <Button className="rounded-full px-5" onClick={savePropertySettings}>
                  Guardar mapa
                </Button>
              }
              badge="Mapa y entorno"
              description="Configura el recinto, el plano visual y puntos de interes cercanos como minimarkets, botillerias o carnicerias."
              id="panel-mapa"
              isOpen={activeSectionId === 'panel-mapa'}
              onToggle={() => toggleSection('panel-mapa')}
              title="Mapa interactivo"
            >
              <div className="grid gap-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    id="map-venue-name"
                    label="Nombre del recinto"
                    onChange={(event) =>
                      updateLocationMap((current) => ({
                        ...current,
                        venue: { ...current.venue, name: event.target.value },
                      }))
                    }
                    value={propertyDraft.location_map.venue.name}
                  />
                  <Input
                    id="map-venue-address"
                    label="Direccion para rutas"
                    onChange={(event) =>
                      updateLocationMap((current) => ({
                        ...current,
                        venue: { ...current.venue, address: event.target.value },
                      }))
                    }
                    value={propertyDraft.location_map.venue.address}
                  />
                  <Input
                    id="map-venue-lat"
                    label="Latitud"
                    onChange={(event) =>
                      updateLocationMap((current) => ({
                        ...current,
                        venue: {
                          ...current.venue,
                          latitude: event.target.value ? Number(event.target.value) : null,
                        },
                      }))
                    }
                    type="number"
                    value={propertyDraft.location_map.venue.latitude ?? ''}
                  />
                  <Input
                    id="map-venue-lng"
                    label="Longitud"
                    onChange={(event) =>
                      updateLocationMap((current) => ({
                        ...current,
                        venue: {
                          ...current.venue,
                          longitude: event.target.value ? Number(event.target.value) : null,
                        },
                      }))
                    }
                    type="number"
                    value={propertyDraft.location_map.venue.longitude ?? ''}
                  />
                </div>

                <Input
                  id="map-image-url"
                  label="Imagen o plano del recinto"
                  onChange={(event) =>
                    updateLocationMap((current) => ({
                      ...current,
                      venue: { ...current.venue, mapImageUrl: event.target.value },
                    }))
                  }
                  value={propertyDraft.location_map.venue.mapImageUrl}
                />

                <Textarea
                  id="map-notes"
                  label="Notas de acceso"
                  onChange={(event) =>
                    updateLocationMap((current) => ({
                      ...current,
                      venue: { ...current.venue, mapNotes: event.target.value },
                    }))
                  }
                  rows={3}
                  value={propertyDraft.location_map.venue.mapNotes}
                />

                <div className="grid gap-4">
                  {propertyDraft.location_map.points.map((point, index) => (
                    <CollapsibleEditorCard
                      actions={
                        <Button
                          onClick={() =>
                            updateLocationMap((current) => ({
                              ...current,
                              points: current.points.filter((_, pointIndex) => pointIndex !== index),
                            }))
                          }
                          variant="danger"
                        >
                          Quitar
                        </Button>
                      }
                      key={`${point.id}-${index}`}
                      subtitle={`${point.label} - ${point.category}`}
                      title={`Punto ${index + 1}`}
                    >
                      <div className="grid gap-4">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <Input
                            id={`map-point-id-${index}`}
                            label="ID"
                            onChange={(event) =>
                              updateLocationMap((current) => ({
                                ...current,
                                points: current.points.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        id: slugify(event.target.value) || `punto-${index + 1}`,
                                      }
                                    : item,
                                ),
                              }))
                            }
                            value={point.id}
                          />
                          <Input
                            id={`map-point-label-${index}`}
                            label="Nombre"
                            onChange={(event) =>
                              updateLocationMap((current) => ({
                                ...current,
                                points: current.points.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, label: event.target.value }
                                    : item,
                                ),
                              }))
                            }
                            value={point.label}
                          />
                          <SelectField
                            id={`map-point-category-${index}`}
                            label="Categoria"
                            onChange={(value) =>
                              updateLocationMap((current) => ({
                                ...current,
                                points: current.points.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, category: value } : item,
                                ),
                              }))
                            }
                            options={mapPointCategoryOptions}
                            value={point.category}
                          />
                          <label className="flex items-center gap-3 self-end rounded-[1rem] border border-border-soft bg-panel-muted/65 px-4 py-3">
                            <input
                              checked={point.isActive}
                              className="h-4 w-4 accent-[rgb(var(--color-accent))]"
                              onChange={(event) =>
                                updateLocationMap((current) => ({
                                  ...current,
                                  points: current.points.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, isActive: event.target.checked }
                                      : item,
                                  ),
                                }))
                              }
                              type="checkbox"
                            />
                            <span className="text-sm text-text-secondary">Visible</span>
                          </label>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <Input
                            id={`map-point-x-${index}`}
                            label="Posicion X"
                            onChange={(event) =>
                              updateLocationMap((current) => ({
                                ...current,
                                points: current.points.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, x: Number(event.target.value || 0) }
                                    : item,
                                ),
                              }))
                            }
                            type="number"
                            value={point.x}
                          />
                          <Input
                            id={`map-point-y-${index}`}
                            label="Posicion Y"
                            onChange={(event) =>
                              updateLocationMap((current) => ({
                                ...current,
                                points: current.points.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, y: Number(event.target.value || 0) }
                                    : item,
                                ),
                              }))
                            }
                            type="number"
                            value={point.y}
                          />
                          <Input
                            id={`map-point-lat-${index}`}
                            label="Latitud"
                            onChange={(event) =>
                              updateLocationMap((current) => ({
                                ...current,
                                points: current.points.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        latitude: event.target.value
                                          ? Number(event.target.value)
                                          : null,
                                      }
                                    : item,
                                ),
                              }))
                            }
                            type="number"
                            value={point.latitude ?? ''}
                          />
                          <Input
                            id={`map-point-lng-${index}`}
                            label="Longitud"
                            onChange={(event) =>
                              updateLocationMap((current) => ({
                                ...current,
                                points: current.points.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? {
                                        ...item,
                                        longitude: event.target.value
                                          ? Number(event.target.value)
                                          : null,
                                      }
                                    : item,
                                ),
                              }))
                            }
                            type="number"
                            value={point.longitude ?? ''}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <Input
                            id={`map-point-address-${index}`}
                            label="Direccion"
                            onChange={(event) =>
                              updateLocationMap((current) => ({
                                ...current,
                                points: current.points.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, address: event.target.value }
                                    : item,
                                ),
                              }))
                            }
                            value={point.address}
                          />
                          <Input
                            id={`map-point-url-${index}`}
                            label="URL externa"
                            onChange={(event) =>
                              updateLocationMap((current) => ({
                                ...current,
                                points: current.points.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, url: event.target.value }
                                    : item,
                                ),
                              }))
                            }
                            value={point.url}
                          />
                        </div>

                        <Textarea
                          id={`map-point-description-${index}`}
                          label="Descripcion"
                          onChange={(event) =>
                            updateLocationMap((current) => ({
                              ...current,
                              points: current.points.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, description: event.target.value }
                                  : item,
                              ),
                            }))
                          }
                          rows={3}
                          value={point.description}
                        />
                      </div>
                    </CollapsibleEditorCard>
                  ))}
                </div>

                <div className="flex justify-start">
                  <Button
                    onClick={() =>
                      updateLocationMap((current) => ({
                        ...current,
                        points: [...current.points, createMapPoint(current.points.length)],
                      }))
                    }
                    variant="secondary"
                  >
                    Agregar punto de interes
                  </Button>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              badge="Bloqueos publicos"
              description="Crea, edita y elimina periodos bloqueados. El calendario del sitio los reflejara de inmediato."
              id="panel-disponibilidad"
              isOpen={activeSectionId === 'panel-disponibilidad'}
              onToggle={() => toggleSection('panel-disponibilidad')}
              title="Disponibilidad"
            >
              <div className="grid gap-6">
                <div className="rounded-[1.5rem] border border-accent/18 bg-[linear-gradient(135deg,rgb(var(--color-accent-soft)/0.4),rgb(var(--color-panel)/0.96))] px-5 py-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Nuevo bloqueo</p>
                      <p className="text-sm leading-7 text-text-secondary">
                        Usa esto para mantenciones, uso interno o eventos privados.
                      </p>
                    </div>
                    <Button onClick={handleCreateBlockedDate}>
                      {isCreatingBlockedDate ? 'Creando...' : 'Agregar bloqueo'}
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <Input
                      id="blocked-draft-title"
                      label="Titulo"
                      onChange={(event) =>
                        setBlockedDateDraft((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      value={blockedDateDraft.title}
                    />
                    <Input
                      id="blocked-draft-start"
                      label="Inicio"
                      onChange={(event) =>
                        setBlockedDateDraft((current) => ({
                          ...current,
                          start_date: event.target.value,
                        }))
                      }
                      type="date"
                      value={blockedDateDraft.start_date}
                    />
                    <Input
                      id="blocked-draft-end"
                      label="Termino"
                      onChange={(event) =>
                        setBlockedDateDraft((current) => ({
                          ...current,
                          end_date: event.target.value,
                        }))
                      }
                      type="date"
                      value={blockedDateDraft.end_date}
                    />
                    <SelectField
                      id="blocked-draft-type"
                      label="Tipo"
                      onChange={(value) =>
                        setBlockedDateDraft((current) => ({
                          ...current,
                          block_type: value,
                        }))
                      }
                      options={blockTypeOptions}
                      value={blockedDateDraft.block_type}
                    />
                    <Input
                      id="blocked-draft-reason"
                      label="Motivo corto"
                      onChange={(event) =>
                        setBlockedDateDraft((current) => ({
                          ...current,
                          reason: event.target.value,
                        }))
                      }
                      value={blockedDateDraft.reason}
                    />
                  </div>
                </div>

                {availabilityFeedback ? (
                  <div
                    className={cn(
                      'rounded-[1.2rem] border px-4 py-4 text-sm leading-7',
                      availabilityFeedback.tone === 'success'
                        ? 'border-success/22 bg-success-soft text-success'
                        : 'border-danger/22 bg-danger-soft text-danger',
                    )}
                  >
                    {availabilityFeedback.message}
                  </div>
                ) : null}

                <div className="grid gap-4">
                  {blockedDates.map((item) => {
                    const isSaving = savingBlockedIds.includes(item.public_id)

                    return (
                      <div
                        className="grid gap-4 rounded-[1.4rem] border border-border-soft bg-panel px-4 py-4"
                        key={item.public_id}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Badge tone={item.is_active ? 'warning' : 'neutral'}>
                              {item.is_active ? 'Activo' : 'Pausado'}
                            </Badge>
                            <p className="text-sm font-semibold text-text-primary">
                              {item.title}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button onClick={() => handleSaveBlockedDate(item)} variant="secondary">
                              {isSaving ? 'Guardando...' : 'Guardar'}
                            </Button>
                            <Button
                              onClick={() => handleDeleteBlockedDate(item.public_id)}
                              variant="danger"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                          <Input
                            id={`blocked-title-${item.public_id}`}
                            label="Titulo"
                            onChange={(event) =>
                              setBlockedDates((current) =>
                                current.map((blockedDate) =>
                                  blockedDate.public_id === item.public_id
                                    ? { ...blockedDate, title: event.target.value }
                                    : blockedDate,
                                ),
                              )
                            }
                            value={item.title}
                          />
                          <Input
                            id={`blocked-start-${item.public_id}`}
                            label="Inicio"
                            onChange={(event) =>
                              setBlockedDates((current) =>
                                current.map((blockedDate) =>
                                  blockedDate.public_id === item.public_id
                                    ? { ...blockedDate, start_date: event.target.value }
                                    : blockedDate,
                                ),
                              )
                            }
                            type="date"
                            value={item.start_date}
                          />
                          <Input
                            id={`blocked-end-${item.public_id}`}
                            label="Termino"
                            onChange={(event) =>
                              setBlockedDates((current) =>
                                current.map((blockedDate) =>
                                  blockedDate.public_id === item.public_id
                                    ? { ...blockedDate, end_date: event.target.value }
                                    : blockedDate,
                                ),
                              )
                            }
                            type="date"
                            value={item.end_date}
                          />
                          <SelectField
                            id={`blocked-type-${item.public_id}`}
                            label="Tipo"
                            onChange={(value) =>
                              setBlockedDates((current) =>
                                current.map((blockedDate) =>
                                  blockedDate.public_id === item.public_id
                                    ? { ...blockedDate, block_type: value }
                                    : blockedDate,
                                ),
                              )
                            }
                            options={blockTypeOptions}
                            value={item.block_type}
                          />
                          <label className="flex items-center gap-3 self-end rounded-[1rem] border border-border-soft bg-panel-muted/65 px-4 py-3">
                            <input
                              checked={item.is_active}
                              className="h-4 w-4 accent-[rgb(var(--color-accent))]"
                              onChange={(event) =>
                                setBlockedDates((current) =>
                                  current.map((blockedDate) =>
                                    blockedDate.public_id === item.public_id
                                      ? { ...blockedDate, is_active: event.target.checked }
                                      : blockedDate,
                                  ),
                                )
                              }
                              type="checkbox"
                            />
                            <span className="text-sm text-text-secondary">Bloqueo activo</span>
                          </label>
                        </div>

                        <Textarea
                          id={`blocked-reason-${item.public_id}`}
                          label="Motivo detallado"
                          onChange={(event) =>
                            setBlockedDates((current) =>
                              current.map((blockedDate) =>
                                blockedDate.public_id === item.public_id
                                  ? { ...blockedDate, reason: event.target.value }
                                  : blockedDate,
                              ),
                            )
                          }
                          rows={3}
                          value={item.reason}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              badge="Tarifas por fecha"
              description="Ajusta valores especiales para periodos concretos sin tocar el precio base del simulador."
              id="panel-especiales"
              isOpen={activeSectionId === 'panel-especiales'}
              onToggle={() => toggleSection('panel-especiales')}
              title="Fechas y precios especiales"
            >
              <div className="grid gap-6">
                <div className="rounded-[1.5rem] border border-accent/18 bg-[linear-gradient(135deg,rgb(var(--color-accent-soft)/0.4),rgb(var(--color-panel)/0.96))] px-5 py-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Nueva tarifa especial</p>
                      <p className="text-sm leading-7 text-text-secondary">
                        Ideal para fines de semana intensos, festivos o fechas premium.
                      </p>
                    </div>
                    <Button onClick={handleCreateSpecialPrice}>
                      {isCreatingSpecialPrice ? 'Creando...' : 'Agregar tarifa'}
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <Input
                      id="special-price-name"
                      label="Nombre"
                      onChange={(event) =>
                        setSpecialPriceDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      value={specialPriceDraft.name}
                    />
                    <Input
                      id="special-price-start"
                      label="Inicio"
                      onChange={(event) =>
                        setSpecialPriceDraft((current) => ({
                          ...current,
                          start_date: event.target.value,
                        }))
                      }
                      type="date"
                      value={specialPriceDraft.start_date}
                    />
                    <Input
                      id="special-price-end"
                      label="Termino"
                      onChange={(event) =>
                        setSpecialPriceDraft((current) => ({
                          ...current,
                          end_date: event.target.value,
                        }))
                      }
                      type="date"
                      value={specialPriceDraft.end_date}
                    />
                    <Input
                      id="special-price-value"
                      label="Valor diario"
                      onChange={(event) =>
                        setSpecialPriceDraft((current) => ({
                          ...current,
                          daily_price: event.target.value,
                        }))
                      }
                      type="number"
                      value={specialPriceDraft.daily_price}
                    />
                    <Input
                      id="special-price-description"
                      label="Detalle corto"
                      onChange={(event) =>
                        setSpecialPriceDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      value={specialPriceDraft.description}
                    />
                  </div>
                </div>

                {specialPriceFeedback ? (
                  <div
                    className={cn(
                      'rounded-[1.2rem] border px-4 py-4 text-sm leading-7',
                      specialPriceFeedback.tone === 'success'
                        ? 'border-success/22 bg-success-soft text-success'
                        : 'border-danger/22 bg-danger-soft text-danger',
                    )}
                  >
                    {specialPriceFeedback.message}
                  </div>
                ) : null}

                <div className="grid gap-4">
                  {specialPrices.map((item) => {
                    const isSaving = savingSpecialPriceIds.includes(item.public_id)

                    return (
                      <div
                        className="grid gap-4 rounded-[1.4rem] border border-border-soft bg-panel px-4 py-4"
                        key={item.public_id}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Badge tone={item.is_active ? 'accent' : 'neutral'}>
                              {item.is_active ? 'Activa' : 'Pausada'}
                            </Badge>
                            <p className="text-sm font-semibold text-text-primary">
                              {item.name}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button onClick={() => handleSaveSpecialPrice(item)} variant="secondary">
                              {isSaving ? 'Guardando...' : 'Guardar'}
                            </Button>
                            <Button
                              onClick={() => handleDeleteSpecialPrice(item.public_id)}
                              variant="danger"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                          <Input
                            id={`special-name-${item.public_id}`}
                            label="Nombre"
                            onChange={(event) =>
                              setSpecialPrices((current) =>
                                current.map((price) =>
                                  price.public_id === item.public_id
                                    ? { ...price, name: event.target.value }
                                    : price,
                                ),
                              )
                            }
                            value={item.name}
                          />
                          <Input
                            id={`special-start-${item.public_id}`}
                            label="Inicio"
                            onChange={(event) =>
                              setSpecialPrices((current) =>
                                current.map((price) =>
                                  price.public_id === item.public_id
                                    ? { ...price, start_date: event.target.value }
                                    : price,
                                ),
                              )
                            }
                            type="date"
                            value={item.start_date}
                          />
                          <Input
                            id={`special-end-${item.public_id}`}
                            label="Termino"
                            onChange={(event) =>
                              setSpecialPrices((current) =>
                                current.map((price) =>
                                  price.public_id === item.public_id
                                    ? { ...price, end_date: event.target.value }
                                    : price,
                                ),
                              )
                            }
                            type="date"
                            value={item.end_date}
                          />
                          <Input
                            id={`special-price-${item.public_id}`}
                            label="Valor diario"
                            onChange={(event) =>
                              setSpecialPrices((current) =>
                                current.map((price) =>
                                  price.public_id === item.public_id
                                    ? { ...price, daily_price: event.target.value }
                                    : price,
                                ),
                              )
                            }
                            type="number"
                            value={item.daily_price}
                          />
                          <label className="flex items-center gap-3 self-end rounded-[1rem] border border-border-soft bg-panel-muted/65 px-4 py-3">
                            <input
                              checked={item.is_active}
                              className="h-4 w-4 accent-[rgb(var(--color-accent))]"
                              onChange={(event) =>
                                setSpecialPrices((current) =>
                                  current.map((price) =>
                                    price.public_id === item.public_id
                                      ? { ...price, is_active: event.target.checked }
                                      : price,
                                  ),
                                )
                              }
                              type="checkbox"
                            />
                            <span className="text-sm text-text-secondary">Tarifa activa</span>
                          </label>
                        </div>

                        <Textarea
                          id={`special-description-${item.public_id}`}
                          label="Descripcion"
                          onChange={(event) =>
                            setSpecialPrices((current) =>
                              current.map((price) =>
                                price.public_id === item.public_id
                                  ? { ...price, description: event.target.value }
                                  : price,
                              ),
                            )
                          }
                          rows={3}
                          value={item.description}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  )
}
