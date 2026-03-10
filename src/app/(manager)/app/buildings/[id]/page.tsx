import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { BuildingTabs } from './tabs'
import { DeleteBuildingButton } from './delete-button'

const fmt = (n: number) =>
  new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(n)

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch building with units and their tenant links
  const { data: building } = await supabase
    .from('buildings')
    .select(`
      *,
      units(
        id, unit_label, floor, unit_type, area_sqm, millesimal,
        has_parking, has_storage, is_occupied, notes,
        unit_tenants(
          role,
          tenants(id, first_name, last_name, email, phone)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!building) notFound()

  // Fetch expenses for this building's current/latest period
  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, description, amount, split_method, expense_categories(name)')
    .eq('building_id', id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch bills for this building
  const { data: bills } = await supabase
    .from('bills')
    .select(`
      id, total_amount, amount_paid, status, due_date,
      units(unit_label, millesimal),
      bill_line_items(description, amount),
      billing_periods(label, start_date, end_date)
    `)
    .in('unit_id', (building.units ?? []).map((u: any) => u.id))
    .order('created_at', { ascending: false })
    .limit(100)

  const units = (building.units ?? []).sort((a: any, b: any) => (a.floor ?? 0) - (b.floor ?? 0))
  const totalMillUsed = units.reduce((s: number, u: any) => s + Number(u.millesimal), 0)

  // Compute summary stats
  const totalExpenses = (expenses ?? []).reduce((s: number, e: any) => s + Number(e.amount), 0)
  const collected = (bills ?? []).filter((b: any) => b.status === 'paid')
    .reduce((s: number, b: any) => s + Number(b.total_amount), 0)
  const outstanding = (bills ?? []).filter((b: any) => b.status !== 'paid')
    .reduce((s: number, b: any) => s + (Number(b.total_amount) - Number(b.amount_paid)), 0)

  return (
    <div>
      {/* Back link */}
      <Link
        href="/app/buildings"
        className="flex items-center gap-1 text-[13px] text-ksec mb-4 hover:text-kaccent transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Πίσω
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-5">
        <div>
          <h1 className="text-[20px] lg:text-[22px] font-bold tracking-tight mb-1">{building.name}</h1>
          <p className="text-[13px] text-ksec">{building.address}{building.city ? `, ${building.city}` : ''}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            href={`/app/buildings/${id}/edit`}
            className="flex items-center gap-1.5 border border-kborder text-ksec px-3 py-1.5 rounded-lg text-[12.5px] font-semibold hover:border-kaccent hover:text-kaccent transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Επεξεργασία
          </Link>
          <DeleteBuildingButton buildingId={id} buildingName={building.name} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3 mb-5 lg:mb-6">
        <div className="bg-kcard border border-kborder rounded-xl p-3.5 lg:p-4">
          <div className="text-[10px] lg:text-[10.5px] text-kmut font-medium uppercase tracking-wider mb-1">Μονάδες</div>
          <div className="text-[20px] lg:text-[24px] font-bold">{units.length}</div>
          <div className="text-[11px] lg:text-[12px] text-ksec mt-0.5">{building.floors ?? '—'} όροφοι</div>
        </div>
        <div className="bg-kcard border border-kborder rounded-xl p-3.5 lg:p-4">
          <div className="text-[10px] lg:text-[10.5px] text-kmut font-medium uppercase tracking-wider mb-1">Χιλιοστά</div>
          <div className={`text-[20px] lg:text-[24px] font-bold font-mono ${totalMillUsed === building.total_millesimal ? 'text-kgreen' : 'text-kyellow'}`}>
            {totalMillUsed}
          </div>
          <div className="text-[11px] lg:text-[12px] text-ksec mt-0.5">/ {building.total_millesimal}</div>
        </div>
        <div className="bg-kcard border border-kborder rounded-xl p-3.5 lg:p-4">
          <div className="text-[10px] lg:text-[10.5px] text-kmut font-medium uppercase tracking-wider mb-1">Έξοδα</div>
          <div className="text-[20px] lg:text-[24px] font-bold text-kaccent">{fmt(totalExpenses)}</div>
          <div className="text-[11px] lg:text-[12px] text-ksec mt-0.5">{(expenses ?? []).length} εγγραφές</div>
        </div>
        <div className="bg-kcard border border-kborder rounded-xl p-3.5 lg:p-4">
          <div className="text-[10px] lg:text-[10.5px] text-kmut font-medium uppercase tracking-wider mb-1">Εκκρεμή</div>
          <div className="text-[20px] lg:text-[24px] font-bold text-kyellow">{fmt(outstanding)}</div>
          <div className="text-[11px] lg:text-[12px] text-ksec mt-0.5">Εισπράχθηκαν: {fmt(collected)}</div>
        </div>
      </div>

      {/* Tabs */}
      <BuildingTabs
        buildingId={id}
        units={units}
        expenses={expenses ?? []}
        bills={bills ?? []}
        totalMillesimal={building.total_millesimal}
      />
    </div>
  )
}
