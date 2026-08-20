import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type {
  HousingAssessmentRow,
  HousingPolicyRow,
  HousingStayRow,
  HousingUnitRow,
  ZoneRow,
} from '../../types/database'

export type HousingSnapshot = {
  zones: ZoneRow[]
  policies: HousingPolicyRow[]
  units: HousingUnitRow[]
  stays: HousingStayRow[]
  assessments: HousingAssessmentRow[]
  fetchedAt: number
}

const queryKey = ['housing', 'snapshot'] as const

export async function fetchHousingSnapshot(): Promise<HousingSnapshot> {
  if (!supabase) {
    throw new Error('V2 Staging is not configured yet')
  }

  const [zones, policies, units, stays, assessments] = await Promise.all([
    supabase.from('zones').select('*').eq('active', true).order('sort_order'),
    supabase.from('housing_policies').select('*').eq('active', true),
    supabase.from('housing_units').select('*').order('name'),
    supabase.from('housing_stays').select('*').order('created_at', { ascending: false }),
    supabase.from('housing_assessments').select('*').is('archived_at', null).order('period_end', { ascending: false }),
  ])

  const firstError = [zones.error, policies.error, units.error, stays.error, assessments.error].find(Boolean)
  if (firstError) {
    throw new Error(firstError.message)
  }

  return {
    zones: zones.data ?? [],
    policies: policies.data ?? [],
    units: units.data ?? [],
    stays: stays.data ?? [],
    assessments: assessments.data ?? [],
    fetchedAt: Date.now(),
  }
}

export function useHousingSnapshot() {
  return useQuery({
    queryKey,
    queryFn: fetchHousingSnapshot,
    staleTime: 15_000,
    refetchInterval: 60_000,
  })
}
