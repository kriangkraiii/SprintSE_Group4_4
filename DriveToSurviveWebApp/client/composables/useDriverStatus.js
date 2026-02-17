import { useState } from '#app'

export function useDriverStatus() {
  const { $api } = useNuxtApp()
  const isDriverVerified = useState('driverVerified', () => false)
  const driverStatusLoaded = useState('driverStatusLoaded', () => false)

  const fetchDriverStatus = async () => {
    try {
      const dv = await $api('/driver-verifications/me')
      const record = (dv && typeof dv === 'object' && 'data' in dv) ? dv.data : dv
      isDriverVerified.value = !!(record?.status === 'APPROVED' || record?.verifiedByOcr)
    } catch {
      isDriverVerified.value = false
    }
    driverStatusLoaded.value = true
  }

  return { isDriverVerified, driverStatusLoaded, fetchDriverStatus }
}
