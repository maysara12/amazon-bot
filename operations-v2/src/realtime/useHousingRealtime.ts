import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export type HousingRealtimeStatus = 'connecting' | 'live' | 'fallback'

export function useHousingRealtime(): HousingRealtimeStatus {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<HousingRealtimeStatus>('connecting')

  useEffect(() => {
    const client = supabase
    if (!client) {
      setStatus('fallback')
      return
    }

    let mounted = true
    const invalidateHousing = () => {
      void queryClient.invalidateQueries({ queryKey: ['housing', 'snapshot'] })
    }

    const channel = client
      .channel('007-v2-housing-staging')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'housing_units' }, invalidateHousing)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'housing_stays' }, invalidateHousing)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'housing_assessments' }, invalidateHousing)
      .subscribe((channelStatus) => {
        if (!mounted) return
        if (channelStatus === 'SUBSCRIBED') setStatus('live')
        if (channelStatus === 'CHANNEL_ERROR' || channelStatus === 'TIMED_OUT' || channelStatus === 'CLOSED') {
          setStatus('fallback')
        }
      })

    return () => {
      mounted = false
      void client.removeChannel(channel)
    }
  }, [queryClient])

  return status
}
