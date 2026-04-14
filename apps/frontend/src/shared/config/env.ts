const fallbackApiBaseUrl = 'http://localhost:8000/api/v1'

export const env = {
  appName: import.meta.env.VITE_APP_NAME || 'app_web_parcela',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl,
} as const
