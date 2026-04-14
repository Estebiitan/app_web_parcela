import { env } from '@/shared/config/env'

type Primitive = string | number | boolean | null | undefined
type QueryValue = Primitive | Primitive[]

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function normalizeApiBaseUrl(baseUrl: string) {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const sanitizedPath = path.replace(/^\/+/, '')
  const url = new URL(sanitizedPath, normalizeApiBaseUrl(env.apiBaseUrl))

  if (query) {
    const searchParams = new URLSearchParams()

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null && item !== '') {
            searchParams.append(key, String(item))
          }
        })
        return
      }

      searchParams.set(key, String(value))
    })

    url.search = searchParams.toString()
  }

  return url.toString()
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text || null
}

function extractMessage(data: unknown): string {
  if (!data) {
    return 'No fue posible completar la solicitud.'
  }

  if (typeof data === 'string') {
    return data
  }

  if (typeof data === 'object') {
    if ('detail' in data && typeof data.detail === 'string') {
      return data.detail
    }

    const values = Object.values(data)
      .flatMap((value) => {
        if (Array.isArray(value)) {
          return value.map(String)
        }
        if (typeof value === 'string') {
          return [value]
        }
        return []
      })
      .filter(Boolean)

    if (values.length > 0) {
      return values.join(' ')
    }
  }

  return 'No fue posible completar la solicitud.'
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  query?: Record<string, QueryValue>,
) {
  const headers = new Headers(init.headers)

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const response = await fetch(buildUrl(path, query), {
    ...init,
    headers,
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError(extractMessage(data), response.status, data)
  }

  return data as T
}

export function getJson<T>(path: string, query?: Record<string, QueryValue>, headers?: HeadersInit) {
  return request<T>(path, { method: 'GET', headers }, query)
}

export function postJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
  headers?: HeadersInit,
) {
  const finalHeaders = new Headers(headers)
  finalHeaders.set('Content-Type', 'application/json')
  return request<TResponse>(path, {
    method: 'POST',
    headers: finalHeaders,
    body: JSON.stringify(payload),
  })
}

export function postForm<TResponse>(path: string, formData: FormData, headers?: HeadersInit) {
  return request<TResponse>(path, {
    method: 'POST',
    headers,
    body: formData,
  })
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Ocurrió un problema inesperado.'
}
