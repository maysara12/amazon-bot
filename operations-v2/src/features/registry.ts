export type AppRole =
  | 'OWNER'
  | 'ADMIN'
  | 'REVIEWER'
  | 'ZONE_MANAGER'
  | 'SUPERVISOR'

export type FeatureReadiness = 'foundation' | 'migration' | 'active'

export interface FeatureModuleDefinition {
  key: string
  route: `/${string}`
  labelAr: string
  labelEn: string
  order: number
  mobile: boolean
  readiness: FeatureReadiness
  allowedRoles: readonly AppRole[]
}

const allRoles: readonly AppRole[] = [
  'OWNER',
  'ADMIN',
  'REVIEWER',
  'ZONE_MANAGER',
  'SUPERVISOR',
]

export const featureRegistry: readonly FeatureModuleDefinition[] = [
  {
    key: 'dashboard',
    route: '/dashboard',
    labelAr: 'الرئيسية',
    labelEn: 'Dashboard',
    order: 10,
    mobile: true,
    readiness: 'foundation',
    allowedRoles: allRoles,
  },
  {
    key: 'housing',
    route: '/housing',
    labelAr: 'السكن',
    labelEn: 'Housing',
    order: 20,
    mobile: true,
    readiness: 'migration',
    allowedRoles: allRoles,
  },
  {
    key: 'orders',
    route: '/orders',
    labelAr: 'الأوردرات',
    labelEn: 'Orders',
    order: 30,
    mobile: true,
    readiness: 'migration',
    allowedRoles: allRoles,
  },
  {
    key: 'operations',
    route: '/operations',
    labelAr: 'التشغيل',
    labelEn: 'Operations',
    order: 40,
    mobile: true,
    readiness: 'migration',
    allowedRoles: ['OWNER', 'ADMIN', 'REVIEWER', 'ZONE_MANAGER'],
  },
  {
    key: 'users',
    route: '/users',
    labelAr: 'المستخدمون',
    labelEn: 'Users',
    order: 50,
    mobile: false,
    readiness: 'migration',
    allowedRoles: ['OWNER', 'ADMIN'],
  },
]
