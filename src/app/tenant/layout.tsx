import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TenantNav } from './nav'

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get tenant info + their unit + building
  const { data: unitTenant } = await supabase
    .from('unit_tenants')
    .select('units(label, buildings(name)), tenants(first_name, last_name)')
    .eq('tenant_id', user.id)
    .eq('is_active', true)
    .single()

  const building = (unitTenant?.units as any)?.buildings?.name ?? 'Κτίριο'
  const unit = (unitTenant?.units as any)?.label ?? ''
  const tenant = unitTenant?.tenants as any
  const name = tenant ? `${tenant.first_name} ${tenant.last_name}` : user.email?.split('@')[0] ?? 'Χρήστης'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#08090d] text-[#e6e7ed] font-sans pb-[68px] lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#08090d]/90 backdrop-blur-xl border-b border-[#222640] px-4 py-3.5 lg:ml-[260px]">
        <div className="flex items-center justify-between max-w-[1600px]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-kaccent to-kpurple flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <div className="font-display text-[14px] font-bold">{building}</div>
              <div className="text-[11px] text-[#4e536e]">Διαμέρισμα {unit} — {name}</div>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-kgreen to-emerald-800 flex items-center justify-center">
            <span className="font-display text-[12px] font-bold text-white">{initials}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="lg:ml-[260px] p-4 lg:p-8 max-w-[1600px]">
        {children}
      </div>

      <TenantNav />
    </div>
  )
}
