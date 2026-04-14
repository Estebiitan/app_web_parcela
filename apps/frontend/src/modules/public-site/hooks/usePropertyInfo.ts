import { getPublicPropertyInfo } from '@/modules/public-site/api/publicSiteApi'
import { useAsyncData } from '@/shared/hooks/useAsyncData'

export function usePropertyInfo() {
  return useAsyncData(() => getPublicPropertyInfo())
}
