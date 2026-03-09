import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// Format EUR currency Greek-style
const fmt = (n: number) =>
  new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(n)

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  const orgId = member?.organization_id

  if (!orgId) {
    return (
      <div>
        <h1 className="text-[22px] font-bold tracking-tight mb-1">Πίνακας Ελέγχου</h1>
        <p className="text-[13px] text-ksec mb-6">Δεν ανήκετε σε κανένα οργανισμό ακόμα.</p>
        <div className="bg-kcard border border-kborder rounded-xl p-8 text-center">
          <div className="text-[48px] mb-4">🏠</div>
          <h2 className="text-[18px] font-bold mb-2">Καλώς ήρθατε στο Shared Expenses</h2>
          <p className="text-[14px] text-ksec mb-6 max-w-md mx-auto">
            Δημιουργήστε τον πρώτο σας οργανισμό για να ξεκινήσετε τη διαχείριση κοινοχρήστων.
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-kaccent to-kpurple text-white font-semibold text-[14px] rounded-xl hover:opacity-90 transition">
            Δημιουργία Οργανισμού
          </button>
        </div>
      </div>
    )
  }

  // ── Fetch all data in parallel ──
  const [buildingsRes, tenantsRes, billsRes, recentPaymentsRes] = await Promise.all([
    // Buildings with unit counts
    supabase
      .from('buildings')
      .select('id, name, address, floors, has_elevator, has_central_heating, total_millesimal, units(id, occupied)')
      .eq('organization_id', orgId),

    // Active tenants count
    supabase
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),

    // Current bills (pending + overdue)
    supabase
      .from('bills')
      .select('id, total_amount, amount_paid, status')
      .in('status', ['pending', 'overdue', 'partially_paid']),

    // Recent payments
    supabase
      .from('payments')
      .select('id, amount, created_at, tenants(first_name, last_name), bills(units(label))')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const buildings = buildingsRes.data ?? []
  const tenantCount = tenantsRes.count ?? 0
  const bills = billsRes.data ?? []

  const totalUnits = buildings.reduce((s, b) => s + (b.units?.length ?? 0), 0)
  const occupiedUnits = buildings.reduce((s, b) => s + (b.units?.filter((u: any) => u.occupied).length ?? 0), 0)
  const pendingAmount = bills.reduce((s, bi) => s + (bi.total_amount - bi.amount_paid), 0)
  const overdueAmount = bills.filter(bi => bi.status === 'overdue').reduce((s, bi) => s + (bi.total_amount - bi.amount_paid), 0)
  const overdueCount = bills.filter(bi => bi.status === 'overdue').length

  return (
    <div>
      <h1 className="text-[20px] lg:text-[22px] font-bold tracking-tight mb-1">Πίνακας Ελέγχου</h1>
      <p className="text-[13px] text-ksec mb-5 lg:mb-6">
        Επισκόπηση διαχειριζόμενων ακινήτων — {new Date().toLocaleDateString('el-GR', { month: 'long', year: 'numeric' })}
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3 mb-5 lg:mb-7">
        <StatCard label="Κτίρια" value={String(buildings.length)} sub={`${totalUnits} μονάδες`} />
        <StatCard label="Ένοικοι" value={String(tenantCount)} sub={`${occupiedUnits}/${totalUnits} κατοικημένα`} color="text-kaccent" />
        <StatCard label="Εκκρεμή" value={fmt(pendingAmount)} sub="τρέχουσα περίοδος" color="text-kyellow" />
        <StatCard label="Ληξιπρόθεσμα" value={fmt(overdueAmount)} sub={`${overdueCount} λογαριασμοί`} color="text-kred" />
      </div>

      {/* Buildings table */}
      <div className="bg-kcard border border-kborder rounded-xl overflow-hidden mb-4">
        <div className="flex justify-between items-center px-4 lg:px-5 py-3 lg:py-3.5 border-b border-kborder">
          <span className="text-[14px] font-semibold">Τα Κτίριά μου</span>
          <button className="flex items-center gap-1.5 bg-kaccent text-white px-3 lg:px-3.5 py-1.5 rounded-lg text-[12px] lg:text-[12.5px] font-semibold hover:opacity-90 transition">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="hidden sm:inline">Νέο Κτίριο</span><span className="sm:hidden">Νέο</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead>
              <tr className="border-b border-kborder">
                <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Κτίριο</th>
                <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Μονάδες</th>
                <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Κατοικημένα</th>
                <th className="px-4 lg:px-5 py-2.5 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {buildings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-ksec text-[14px]">
                    Δεν υπάρχουν κτίρια ακόμα. Προσθέστε το πρώτο σας κτίριο.
                  </td>
                </tr>
              ) : (
                buildings.map((b) => {
                  const unitCount = b.units?.length ?? 0
                  const occupied = b.units?.filter((u: any) => u.occupied).length ?? 0
                  return (
                    <tr key={b.id} className="border-b border-kborder last:border-0 hover:bg-white/[0.02] cursor-pointer">
                      <td className="px-4 lg:px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-kaccent/10 flex items-center justify-center text-kaccent flex-shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/></svg>
                          </div>
                          <div>
                            <div className="text-[13px] font-medium">{b.name}</div>
                            <div className="text-[11px] text-kmut hidden sm:block">{b.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-5 py-3 text-[13px] text-ksec">{unitCount}</td>
                      <td className="px-4 lg:px-5 py-3 text-[13px] text-ksec">{occupied}/{unitCount}</td>
                      <td className="px-4 lg:px-5 py-3 text-ksec">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state helper for new users */}
      {buildings.length === 0 && (
        <div className="bg-kcard border border-dashed border-kborder rounded-xl p-8 text-center">
          <p className="text-[14px] text-ksec mb-4">
            Ξεκινήστε προσθέτοντας το πρώτο σας κτίριο, μετά τις μονάδες και τους ενοίκους.
          </p>
          <div className="flex justify-center gap-2 text-[12px] text-kmut">
            <span className="px-3 py-1 bg-kaccent/10 text-kaccent rounded-full font-semibold">1. Κτίριο</span>
            <span>→</span>
            <span className="px-3 py-1 bg-kbg border border-kborder rounded-full">2. Μονάδες</span>
            <span>→</span>
            <span className="px-3 py-1 bg-kbg border border-kborder rounded-full">3. Ένοικοι</span>
            <span>→</span>
            <span className="px-3 py-1 bg-kbg border border-kborder rounded-full">4. Έξοδα</span>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color?: string
}) {
  return (
    <div className="bg-kcard border border-kborder rounded-xl p-3.5 lg:p-4">
      <div className="text-[10px] lg:text-[10.5px] text-kmut font-medium uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-[20px] lg:text-[24px] font-bold tracking-tight ${color ?? ''}`}>{value}</div>
      <div className="text-[11px] lg:text-[12px] text-ksec mt-0.5">{sub}</div>
    </div>
  )
}
