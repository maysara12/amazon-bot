import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { flushOutbox, listOutbox } from './outbox'

export function useOutboxStatus() {
  const queryClient = useQueryClient()
  const [pending, setPending] = useState(0)
  const [flushing, setFlushing] = useState(false)
  const [online, setOnline] = useState(() => navigator.onLine)

  const refreshCount = useCallback(async () => {
    setPending((await listOutbox()).length)
  }, [])

  const flush = useCallback(async () => {
    if (flushing) return
    setFlushing(true)
    try {
      const result = await flushOutbox()
      setPending(result.pending)
      if (result.processed > 0) {
        await queryClient.invalidateQueries({ queryKey: ['housing'] })
      }
    } finally {
      setFlushing(false)
    }
  }, [flushing, queryClient])

  useEffect(() => {
    void refreshCount()

    const onOnline = () => {
      setOnline(true)
      void flush()
    }
    const onOffline = () => setOnline(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    const interval = window.setInterval(() => {
      if (navigator.onLine) void flush()
      else void refreshCount()
    }, 30_000)

    const { data: authListener } = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') void flush()
      if (event === 'SIGNED_OUT') void refreshCount()
    }) ?? { data: { subscription: null } }

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.clearInterval(interval)
      authListener.subscription?.unsubscribe()
    }
  }, [flush, refreshCount])

  return { pending, flushing, online, flush, refreshCount }
}
