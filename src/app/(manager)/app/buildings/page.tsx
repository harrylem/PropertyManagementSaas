import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const fmt = (n: number) =>
  new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(n)

export default async function BuildingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/app')

  // Fetch buildings with units and pending bills
  const { data: buildings } = await supabase
    .from('buildings')
    .select(`
      id, name, address, city, floors, total_millesimal,
      has_elevator, has_central_heating, has_parking,
      units(id, unit_label, millesimal, is_occupied)
    `)
    .eq('organization_id', member.organization_id)
    .order('name')

  const allBuildings = buildings ?? []

  // Get outstanding amounts per building via bills
  const buildingIds = allBuildings.map(b => b.id)
  let outstandingMap: Record<string, number> = {}

  if (buildingIds.length > 0) {
    const { data: bills } = await supabase
      .from('bills')
      .select('total_amount, amount_paid, units!inner(building_id)')
      .in('status', ['pending', 'overdue', 'partially_paid'])

    if (bills) {
      for (const bill of bills) {
        const bid = (bill.units as any)?.building_id
        if (bid) {
          outstandingMap[bid] = (outstandingMap[bid] ?? 0) + (bill.total_amount - bill.amount_paid)
        }
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5 lg:mb-6">
        <div>
          <h1 className="text-[20px] lg:text-[22px] font-bold tracking-tight mb-1">Κτίρια</h1>
          <p className="text-[13px] text-ksec">Διαχείριση όλων των κτιρίων</p>
        </div>
        <Link
          href="/app/buildings/new"
          className="flex items-center gap-1.5 bg-kaccent text-white px-3 lg:px-3.5 py-2 rounded-lg text-[12px] lg:text-[12.5px] font-semibold hover:opacity-90 transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span className="hidden sm:inline">Νέο Κτίριο</span><span className="sm:hidden">Νέο</span>
        </Link>
      </div>

      {allBuildings.length === 0 ? (
        <div className="bg-kcard border border-dashed border-kborder rounded-xl p-8 text-center">
          <div className="text-[48px] mb-4">🏢</div>
          <h2 className="text-[18px] font-bold mb-2">Δεν υπάρχουν κτίρια ακόμα</h2>
          <p className="text-[14px] text-ksec mb-6 max-w-md mx-auto">
            Ξεκινήστε προσθέτοντας το πρώτο σας κτίριο, μετά τις μονάδες και τους ενοίκους.
          </p>
          <Link
            href="/app/buildings/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-kaccent to-kpurple text-white font-semibold text-[14px] rounded-xl hover:opacity-90 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Προσθήκη Κτιρίου
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
          {allBuildings.map((b) => {
            const unitCount = b.units?.length ?? 0
            const occupied = b.units?.filter((u: any) => u.is_occupied).length ?? 0
            const outstanding = outstandingMap[b.id] ?? 0
            const tags = [
              b.has_elevator ? 'Ασανσέρ' : null,
              b.has_central_heating ? 'Κεντρ. Θέρμανση' : null,
              b.has_parking ? 'Πάρκινγκ' : null,
            ].filter(Boolean)

            return (
              <Link
                key={b.id}
                href={`/app/buildings/${b.id}`}
                className="bg-kcard border border-kborder rounded-xl p-4 lg:p-5 hover:border-kborderl transition group"
              >
                <div className="flex justify-between mb-3.5">
                  <div className="flex gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-kaccent/10 flex items-center justify-center text-kaccent flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22V12h6v10"/></svg>
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold">{b.name}</div>
                      <div className="text-[11px] text-kmut">{b.address ?? b.city}</div>
                    </div>
                  </div>
                  <svg className="text-ksec group-hover:text-kaccent transition" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <div className="text-[10.5px] text-kmut">Μονάδες</div>
                    <div className="text-[17px] font-bold">{unitCount}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-kmut">Όροφοι</div>
                    <div className="text-[17px] font-bold">{b.floors ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] text-kmut">Εκκρεμή</div>
                    <div className="text-[15px] font-bold font-mono text-kyellow">
                      {outstanding > 0 ? fmt(outstanding) : '—'}
                    </div>
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-kaccent/10 text-kaccent">{t}</span>
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
