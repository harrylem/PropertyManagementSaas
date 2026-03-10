'use client'

import { useState } from 'react'
import { UnitFormModal } from './unit-form-modal'

const fmt = (n: number) =>
  new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(n)

const UNIT_TYPE_LABELS: Record<string, string> = {
  apartment: 'Διαμέρισμα',
  studio: 'Στούντιο',
  office: 'Γραφείο',
  shop: 'Κατάστημα',
  parking: 'Πάρκινγκ',
  storage: 'Αποθήκη',
  other: 'Άλλο',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Εκκρεμεί', color: 'kyellow' },
  overdue: { label: 'Ληξιπρόθεσμο', color: 'kred' },
  paid: { label: 'Πληρώθηκε', color: 'kgreen' },
  partially_paid: { label: 'Μερική πληρωμή', color: 'korange' },
  cancelled: { label: 'Ακυρωμένο', color: 'kmut' },
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold text-${color} bg-${color}/10`}>
      {text}
    </span>
  )
}

type TabId = 'units' | 'expenses' | 'bills'

export function BuildingTabs({
  buildingId,
  units,
  expenses,
  bills,
  totalMillesimal,
}: {
  buildingId: string
  units: any[]
  expenses: any[]
  bills: any[]
  totalMillesimal: number
}) {
  const [activeTab, setActiveTab] = useState<TabId>('units')
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<any>(null)

  const tabs: { id: TabId; label: string }[] = [
    { id: 'units', label: 'Μονάδες & Ένοικοι' },
    { id: 'expenses', label: 'Έξοδα' },
    { id: 'bills', label: 'Κοινόχρηστα' },
  ]

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-kborder mb-5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-[13px] font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-kaccent border-kaccent'
                : 'text-ksec border-transparent hover:text-ktext'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'units' && (
        <UnitsTab
          units={units}
          totalMillesimal={totalMillesimal}
          onAdd={() => { setEditingUnit(null); setShowUnitModal(true) }}
          onEdit={(unit: any) => { setEditingUnit(unit); setShowUnitModal(true) }}
        />
      )}
      {activeTab === 'expenses' && <ExpensesTab expenses={expenses} />}
      {activeTab === 'bills' && <BillsTab bills={bills} />}

      {/* Unit modal */}
      {showUnitModal && (
        <UnitFormModal
          buildingId={buildingId}
          unit={editingUnit}
          onClose={() => { setShowUnitModal(false); setEditingUnit(null) }}
        />
      )}
    </>
  )
}

// ── Units Tab ─────────────────────────────────────────────────

function UnitsTab({
  units,
  totalMillesimal,
  onAdd,
  onEdit,
}: {
  units: any[]
  totalMillesimal: number
  onAdd: () => void
  onEdit: (unit: any) => void
}) {
  const assignedMill = units.reduce((s, u) => s + Number(u.millesimal), 0)

  return (
    <div>
      {/* Add unit button + millesimal summary */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-[12px] text-ksec">
          Χιλιοστά: <span className={`font-mono font-semibold ${assignedMill === totalMillesimal ? 'text-kgreen' : 'text-kyellow'}`}>{assignedMill}</span>
          <span className="text-kmut"> / {totalMillesimal}</span>
          {assignedMill !== totalMillesimal && (
            <span className="text-kyellow ml-1">
              ({assignedMill > totalMillesimal ? '+' : ''}{assignedMill - totalMillesimal})
            </span>
          )}
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 bg-kaccent text-white px-3 py-1.5 rounded-lg text-[12px] font-semibold hover:opacity-90 transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Νέα Μονάδα
        </button>
      </div>

      {units.length === 0 ? (
        <div className="bg-kcard border border-dashed border-kborder rounded-xl p-8 text-center">
          <p className="text-[14px] text-ksec mb-3">Δεν υπάρχουν μονάδες σε αυτό το κτίριο.</p>
          <button onClick={onAdd} className="text-[13px] text-kaccent font-semibold hover:underline">
            + Προσθέστε την πρώτη μονάδα
          </button>
        </div>
      ) : (
        <div className="bg-kcard border border-kborder rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-kborder">
                  <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Μονάδα</th>
                  <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Όροφος</th>
                  <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">τ.μ.</th>
                  <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Χιλιοστά</th>
                  <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Ένοικος</th>
                  <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Κατάσταση</th>
                  <th className="px-4 lg:px-5 py-2.5 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {units.map(u => {
                  const tenant = u.unit_tenants?.[0]?.tenants
                  const tenantRole = u.unit_tenants?.[0]?.role
                  const tenantName = tenant ? `${tenant.first_name} ${tenant.last_name}` : null
                  const floorLabel = u.floor === 0 ? 'Ισόγειο' : u.floor != null ? `${u.floor}ος` : '—'

                  return (
                    <tr key={u.id} className="border-b border-kborder last:border-0 hover:bg-white/[0.02]">
                      <td className="px-4 lg:px-5 py-2.5">
                        <div className="text-[13px] font-medium">{u.unit_label}</div>
                        <div className="text-[11px] text-kmut">{UNIT_TYPE_LABELS[u.unit_type] ?? u.unit_type}</div>
                      </td>
                      <td className="px-4 lg:px-5 py-2.5 text-[13px] text-ksec">{floorLabel}</td>
                      <td className="px-4 lg:px-5 py-2.5 text-[13px] text-ksec font-mono">{u.area_sqm ?? '—'}</td>
                      <td className="px-4 lg:px-5 py-2.5 text-[13px] text-kaccent font-mono font-semibold">{Number(u.millesimal)}</td>
                      <td className="px-4 lg:px-5 py-2.5 text-[13px] text-ksec">
                        {tenantName ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-kaccent to-kaccentd flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {tenantName[0]}
                            </div>
                            <div>
                              <div className="text-[12px]">{tenantName}</div>
                              {tenantRole && (
                                <div className="text-[10px] text-kmut">
                                  {tenantRole === 'owner' ? 'Ιδιοκτήτης' : tenantRole === 'renter' ? 'Ενοικιαστής' : tenantRole}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-kmut italic">Κενό</span>
                        )}
                      </td>
                      <td className="px-4 lg:px-5 py-2.5">
                        <Badge
                          text={u.is_occupied ? 'Κατοικημένο' : 'Κενό'}
                          color={u.is_occupied ? 'kgreen' : 'kmut'}
                        />
                      </td>
                      <td className="px-4 lg:px-5 py-2.5">
                        <button
                          onClick={() => onEdit(u)}
                          className="text-ksec hover:text-kaccent transition p-1"
                          title="Επεξεργασία"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Expenses Tab ──────────────────────────────────────────────

function ExpensesTab({ expenses }: { expenses: any[] }) {
  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

  if (expenses.length === 0) {
    return (
      <div className="bg-kcard border border-dashed border-kborder rounded-xl p-8 text-center">
        <p className="text-[14px] text-ksec">Δεν υπάρχουν καταγεγραμμένα έξοδα.</p>
      </div>
    )
  }

  return (
    <div className="bg-kcard border border-kborder rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-kborder">
              <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Κατηγορία</th>
              <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Περιγραφή</th>
              <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Κατανομή</th>
              <th className="text-right px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Ποσό</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e.id} className="border-b border-kborder last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 lg:px-5 py-2.5 text-[13px] font-medium">
                  {(e.expense_categories as any)?.name ?? '—'}
                </td>
                <td className="px-4 lg:px-5 py-2.5 text-[13px] text-ksec">{e.description ?? '—'}</td>
                <td className="px-4 lg:px-5 py-2.5">
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-kaccent/10 text-kaccent">
                    {e.split_method === 'millesimal' ? 'Χιλιοστά' : e.split_method === 'equal' ? 'Ίσα' : e.split_method}
                  </span>
                </td>
                <td className="px-4 lg:px-5 py-2.5 text-right text-[13px] font-semibold font-mono">{fmt(Number(e.amount))}</td>
              </tr>
            ))}
            <tr className="bg-kbg/50">
              <td colSpan={3} className="px-4 lg:px-5 py-3 text-[14px] font-bold">Σύνολο</td>
              <td className="px-4 lg:px-5 py-3 text-right text-[15px] font-bold font-mono text-kaccent">{fmt(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Bills Tab ─────────────────────────────────────────────────

function BillsTab({ bills }: { bills: any[] }) {
  if (bills.length === 0) {
    return (
      <div className="bg-kcard border border-dashed border-kborder rounded-xl p-8 text-center">
        <p className="text-[14px] text-ksec">Δεν υπάρχουν κοινόχρηστα. Δημιουργήστε τα από τη σελίδα Κοινόχρηστα.</p>
      </div>
    )
  }

  return (
    <div className="bg-kcard border border-kborder rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-kborder">
              <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Μονάδα</th>
              <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Χιλιοστά</th>
              <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Περίοδος</th>
              <th className="text-right px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Ποσό</th>
              <th className="text-right px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Πληρωμένο</th>
              <th className="text-left px-4 lg:px-5 py-2.5 text-[10.5px] font-semibold text-kmut uppercase tracking-wider">Κατάσταση</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(b => {
              const s = STATUS_LABELS[b.status] ?? { label: b.status, color: 'kmut' }
              const period = (b.billing_periods as any)?.label ?? '—'
              return (
                <tr key={b.id} className="border-b border-kborder last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 lg:px-5 py-2.5 text-[13px] font-medium">{(b.units as any)?.unit_label ?? '—'}</td>
                  <td className="px-4 lg:px-5 py-2.5 text-[13px] text-kaccent font-mono">{(b.units as any)?.millesimal ?? '—'}</td>
                  <td className="px-4 lg:px-5 py-2.5 text-[13px] text-ksec">{period}</td>
                  <td className="px-4 lg:px-5 py-2.5 text-right text-[13px] font-semibold font-mono">{fmt(Number(b.total_amount))}</td>
                  <td className="px-4 lg:px-5 py-2.5 text-right text-[13px] font-mono text-ksec">{fmt(Number(b.amount_paid))}</td>
                  <td className="px-4 lg:px-5 py-2.5"><Badge text={s.label} color={s.color} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
