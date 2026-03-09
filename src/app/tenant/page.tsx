import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const fmt = (n: number) =>
  new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('el-GR', { day: 'numeric', month: 'short', year: 'numeric' })

export default async function TenantHomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get current bill for this tenant
  const { data: currentBill } = await supabase
    .from('bills')
    .select(`
      id, total_amount, amount_paid, status, due_date, issued_at,
      bill_line_items(amount, expenses(description, expense_categories(name))),
      units(label, millesimal),
      billing_periods(name, start_date, end_date)
    `)
    .eq('tenant_id', user.id)
    .in('status', ['pending', 'overdue', 'partially_paid'])
    .order('issued_at', { ascending: false })
    .limit(1)
    .single()

  // Get recent payments
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('id, amount, payment_method, created_at, bills(billing_periods(name))')
    .eq('tenant_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(3)

  // Get recent announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, priority, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  const bill = currentBill
  const lineItems = (bill?.bill_line_items as any[]) ?? []
  const unitLabel = (bill?.units as any)?.label ?? ''
  const millesimal = (bill?.units as any)?.millesimal ?? 0
  const periodName = (bill?.billing_periods as any)?.name ?? 'Τρέχουσα περίοδος'
  const balance = bill ? bill.total_amount - bill.amount_paid : 0

  const statusLabel: Record<string, { text: string; color: string }> = {
    pending: { text: 'Εκκρεμεί', color: 'bg-[#dba010]/12 text-[#dba010]' },
    overdue: { text: 'Ληξιπρόθεσμο', color: 'bg-[#d93548]/12 text-[#d93548]' },
    partially_paid: { text: 'Μερική πληρωμή', color: 'bg-[#d96a20]/12 text-[#d96a20]' },
    paid: { text: 'Πληρώθηκε', color: 'bg-[#1faa64]/12 text-[#1faa64]' },
  }

  return (
    <div>
      {/* Current Bill Card */}
      {bill ? (
        <div className="bg-[#181b28] border border-[#222640] rounded-2xl overflow-hidden mb-4 relative">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-kaccent to-kpurple rounded-t-2xl" />
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[11px] text-[#4e536e] font-semibold uppercase tracking-wider">{periodName}</div>
                <div className="font-display text-[36px] font-extrabold mt-1">{fmt(balance)}</div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusLabel[bill.status]?.color}`}>
                {statusLabel[bill.status]?.text}
              </span>
            </div>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-[#08090d] rounded-lg p-2.5">
                <div className="text-[10px] text-[#4e536e]">Χιλιοστά</div>
                <div className="font-mono text-[15px] font-semibold text-kaccent">{millesimal}</div>
              </div>
              <div className="flex-1 bg-[#08090d] rounded-lg p-2.5">
                <div className="text-[10px] text-[#4e536e]">Μονάδα</div>
                <div className="font-mono text-[15px] font-semibold">{unitLabel}</div>
              </div>
              <div className="flex-1 bg-[#08090d] rounded-lg p-2.5">
                <div className="text-[10px] text-[#4e536e]">Λήξη</div>
                <div className="font-mono text-[15px] font-semibold text-[#dba010]">
                  {bill.due_date ? fmtDate(bill.due_date) : '—'}
                </div>
              </div>
            </div>
            <Link
              href="/tenant/payments"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-kaccent to-kpurple text-white font-semibold text-[14px] rounded-xl hover:opacity-90 transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              Πληρωμή τώρα
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#181b28] border border-[#222640] rounded-2xl p-8 text-center mb-4">
          <div className="text-[36px] mb-3">✅</div>
          <div className="font-display text-[18px] font-bold mb-1">Είστε ενήμεροι!</div>
          <p className="text-[14px] text-[#8a8ea6]">Δεν υπάρχει εκκρεμής λογαριασμός.</p>
        </div>
      )}

      {/* Bill breakdown */}
      {lineItems.length > 0 && (
        <div className="bg-[#181b28] border border-[#222640] rounded-2xl overflow-hidden mb-4">
          <div className="px-4 py-3.5 border-b border-[#222640] flex justify-between items-center">
            <span className="text-[14px] font-semibold">Ανάλυση Λογαριασμού</span>
          </div>
          {lineItems.map((li: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#222640] last:border-0">
              <div className="flex-1">
                <div className="text-[13px]">{li.expenses?.expense_categories?.name ?? 'Έξοδο'}</div>
                <div className="text-[11px] text-[#4e536e]">{li.expenses?.description}</div>
              </div>
              <div className="font-mono text-[13px] font-semibold">{fmt(li.amount)}</div>
            </div>
          ))}
          <div className="flex justify-between px-4 py-3 bg-[#08090d]">
            <span className="text-[14px] font-bold">Σύνολο</span>
            <span className="font-mono text-[14px] font-bold text-kaccent">{fmt(bill?.total_amount ?? 0)}</span>
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Link href="/tenant/maintenance" className="bg-[#181b28] border border-[#222640] rounded-xl p-4 flex flex-col items-center gap-2 hover:border-kaccent transition">
          <div className="w-9 h-9 rounded-lg bg-[#d96a20]/10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d96a20" strokeWidth="1.8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <span className="text-[11px] font-semibold text-[#8a8ea6]">Βλάβη</span>
        </Link>
        <Link href="/tenant/announcements" className="bg-[#181b28] border border-[#222640] rounded-xl p-4 flex flex-col items-center gap-2 hover:border-kaccent transition">
          <div className="w-9 h-9 rounded-lg bg-kaccent/10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a8df8" strokeWidth="1.8"><path d="m3 11 18-5v12L3 13v-2z"/></svg>
          </div>
          <span className="text-[11px] font-semibold text-[#8a8ea6]">Ανακοινώσεις</span>
        </Link>
        <Link href="/tenant/profile" className="bg-[#181b28] border border-[#222640] rounded-xl p-4 flex flex-col items-center gap-2 hover:border-kaccent transition">
          <div className="w-9 h-9 rounded-lg bg-kpurple/10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a050f0" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <span className="text-[11px] font-semibold text-[#8a8ea6]">Προφίλ</span>
        </Link>
      </div>

      {/* Recent activity */}
      <div className="bg-[#181b28] border border-[#222640] rounded-2xl overflow-hidden">
        <div className="px-4 py-3.5 border-b border-[#222640]">
          <span className="text-[14px] font-semibold">Πρόσφατα</span>
        </div>
        {(recentPayments ?? []).map((p: any) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#222640]">
            <div className="w-8 h-8 rounded-lg bg-[#1faa64]/10 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1faa64" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium">Πληρωμή {p.bills?.billing_periods?.name}</div>
              <div className="text-[11px] text-[#4e536e]">{fmtDate(p.created_at)}</div>
            </div>
            <div className="font-mono text-[13px] font-semibold text-[#1faa64]">{fmt(p.amount)}</div>
          </div>
        ))}
        {(announcements ?? []).map((a: any) => {
          const pColor: Record<string, string> = { urgent: '#d93548', high: '#d96a20', normal: '#4a8df8', low: '#4e536e' }
          return (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#222640] last:border-0">
              <div className="w-8 h-8 rounded-lg bg-kaccent/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a8df8" strokeWidth="2"><path d="m3 11 18-5v12L3 13v-2z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium truncate">{a.title}</div>
                <div className="text-[11px] text-[#4e536e]">{fmtDate(a.created_at)}</div>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${pColor[a.priority]}18`, color: pColor[a.priority] }}>
                {a.priority === 'urgent' ? 'Επείγον' : a.priority === 'high' ? 'Υψηλή' : ''}
              </span>
            </div>
          )
        })}
        {(recentPayments ?? []).length === 0 && (announcements ?? []).length === 0 && (
          <div className="px-4 py-8 text-center text-[14px] text-[#4e536e]">Δεν υπάρχει πρόσφατη δραστηριότητα.</div>
        )}
      </div>
    </div>
  )
}
