export type AppRole = 'OWNER' | 'ADMIN' | 'REVIEWER' | 'ZONE_MANAGER' | 'SUPERVISOR'

export type ZoneRow = {
  id: string
  code: string | null
  name_ar: string
  name_en: string | null
  sort_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export type HousingPolicyRow = {
  zone_id: string
  full_target_hours: number
  full_housing_fee: number
  cycle_days: number
  effective_from: string
  active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type HousingUnitRow = {
  id: string
  zone_id: string
  code: string | null
  name: string
  address: string | null
  unit_type: string
  capacity: number
  monthly_rent: number
  contract_start: string | null
  contract_end: string | null
  landlord_name: string | null
  landlord_phone: string | null
  status: string
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type HousingStayRow = {
  id: string
  zone_id: string
  unit_id: string
  rider_id: string
  rider_name: string
  phone: string | null
  check_in_date: string
  billing_start_date: string
  check_out_date: string | null
  status: string
  source: string
  source_ref: string | null
  notes: string | null
  check_in_request_id: string | null
  check_out_request_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type HousingAssessmentRow = {
  id: string
  stay_id: string
  zone_id: string
  period_start: string
  period_end: string
  cycle_days: number
  days_count: number
  full_target_hours: number
  target_hours: number
  actual_hours: number | null
  target_met: boolean | null
  full_housing_fee: number
  prorated_housing_fee: number
  deduction_amount: number
  deduction_details: string | null
  deduction_status: string
  deduction_raised_at: string | null
  deduction_ref: string | null
  hours_source: string | null
  hours_updated_at: string | null
  hours_updated_by: string | null
  admin_note: string | null
  archived_at: string | null
  archived_by: string | null
  created_at: string
  updated_at: string
}

export type HousingRequestRow = {
  id: string
  client_operation_id: string | null
  zone_id: string
  unit_id: string | null
  request_type: string
  rider_id: string
  rider_name: string
  phone: string | null
  effective_date: string
  billing_start_date: string | null
  status: string
  requested_by: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  supervisor_note: string | null
  stay_id: string | null
  checkout_assessment_id: string | null
  hours_period_start: string | null
  hours_period_end: string | null
  created_at: string
  updated_at: string
}

export type AppModuleRow = {
  slug: string
  name_ar: string
  name_en: string | null
  description_ar: string | null
  icon: string | null
  sort_order: number
  active: boolean
  allowed_roles: string[]
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      app_modules: TableShape<AppModuleRow>
      zones: TableShape<ZoneRow>
      housing_policies: TableShape<HousingPolicyRow>
      housing_units: TableShape<HousingUnitRow>
      housing_stays: TableShape<HousingStayRow>
      housing_assessments: TableShape<HousingAssessmentRow>
      housing_requests: TableShape<HousingRequestRow>
    }
    Views: Record<string, never>
    Functions: {
      housing_request_checkin_v2: {
        Args: {
          p_client_operation_id: string
          p_unit_id: string
          p_rider_id: string
          p_rider_name: string
          p_phone?: string | null
          p_effective_date?: string
          p_billing_start_date?: string | null
          p_supervisor_note?: string | null
        }
        Returns: HousingRequestRow
      }
      v2_realtime_smoke_ping: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: { app_role: AppRole }
    CompositeTypes: Record<string, never>
  }
}

type TableShape<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}
