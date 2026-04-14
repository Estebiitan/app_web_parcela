const chileDateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const chileDateTimeFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatCurrency(value: number | string | null | undefined, currency = 'CLP') {
  if (value === null || value === undefined || value === '') {
    return 'No informado'
  }

  const amount = typeof value === 'number' ? value : Number(value)

  if (Number.isNaN(amount)) {
    return 'No informado'
  }

  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'No informado'
  }

  return chileDateFormatter.format(new Date(`${value}T00:00:00`))
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return 'No informado'
  }

  return chileDateTimeFormatter.format(new Date(value))
}

export function formatTime(value: string | null | undefined) {
  if (!value) {
    return 'No informado'
  }

  return value.slice(0, 5)
}
