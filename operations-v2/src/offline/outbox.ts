import { supabase } from '../lib/supabase'
import type { HousingRequestRow } from '../types/database'
import { outboxAll, outboxDelete, outboxPut } from './idb'

export type HousingCheckinPayload = {
  clientOperationId: string
  unitId: string
  riderId: string
  riderName: string
  phone?: string | null
  effectiveDate: string
  billingStartDate?: string | null
  supervisorNote?: string | null
}

type HousingCheckinJob = {
  id: string
  kind: 'housing.request-checkin'
  createdAt: number
  attempts: number
  lastAttemptAt?: number
  lastError?: string
  payload: HousingCheckinPayload
}

export type OutboxJob = HousingCheckinJob

export async function enqueueHousingCheckin(
  input: Omit<HousingCheckinPayload, 'clientOperationId'> & { clientOperationId?: string },
): Promise<HousingCheckinJob> {
  const operationId = input.clientOperationId ?? crypto.randomUUID()
  const job: HousingCheckinJob = {
    id: operationId,
    kind: 'housing.request-checkin',
    createdAt: Date.now(),
    attempts: 0,
    payload: { ...input, clientOperationId: operationId },
  }

  await outboxPut(job)
  return job
}

export async function listOutbox(): Promise<OutboxJob[]> {
  const jobs = await outboxAll<OutboxJob>()
  return jobs.sort((a, b) => a.createdAt - b.createdAt)
}

export async function submitHousingCheckin(payload: HousingCheckinPayload): Promise<HousingRequestRow> {
  if (!supabase) throw new Error('STAGING_NOT_CONFIGURED')

  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) throw new Error('AUTH_REQUIRED')

  const { data, error } = await supabase.rpc('housing_request_checkin_v2', {
    p_client_operation_id: payload.clientOperationId,
    p_unit_id: payload.unitId,
    p_rider_id: payload.riderId,
    p_rider_name: payload.riderName,
    p_phone: payload.phone ?? null,
    p_effective_date: payload.effectiveDate,
    p_billing_start_date: payload.billingStartDate ?? payload.effectiveDate,
    p_supervisor_note: payload.supervisorNote ?? null,
  })

  if (error) throw new Error(error.message)
  return data
}

export async function flushOutbox(): Promise<{ processed: number; pending: number }> {
  if (!navigator.onLine || !supabase) {
    const jobs = await listOutbox()
    return { processed: 0, pending: jobs.length }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  if (!sessionData.session) {
    const jobs = await listOutbox()
    return { processed: 0, pending: jobs.length }
  }

  const jobs = await listOutbox()
  let processed = 0

  for (const job of jobs) {
    try {
      if (job.kind === 'housing.request-checkin') {
        await submitHousingCheckin(job.payload)
      }
      await outboxDelete(job.id)
      processed += 1
    } catch (error) {
      await outboxPut({
        ...job,
        attempts: job.attempts + 1,
        lastAttemptAt: Date.now(),
        lastError: error instanceof Error ? error.message : String(error),
      })

      if (!navigator.onLine) break
      if (error instanceof Error && error.message.includes('AUTH_REQUIRED')) break
    }
  }

  const pending = (await listOutbox()).length
  return { processed, pending }
}
