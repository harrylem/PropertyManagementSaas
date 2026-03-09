import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If already logged in, redirect to their dashboard
  if (user) {
    // Check user role to redirect appropriately
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (member?.role === 'owner' || member?.role === 'admin') {
      redirect('/app')
    }
    redirect('/tenant')
  }

  return (
    <div className="min-h-screen bg-kbg">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-kbg/85 backdrop-blur-xl border-b border-kborder">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-kaccent to-kpurple flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span className="font-display text-[17px] font-bold tracking-tight">Shared Expenses</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-[13px] font-semibold text-ksec border border-kborder rounded-lg hover:border-kaccent hover:text-kaccent transition">
              Σύνδεση
            </Link>
            <Link href="/login?tab=signup" className="px-4 py-2 text-[13px] font-semibold text-white bg-gradient-to-r from-kaccent to-kpurple rounded-lg hover:opacity-90 transition">
              Δοκιμή Δωρεάν
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-20 px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-kaccent/10 text-kaccent text-[12px] font-semibold mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Νέα πλατφόρμα — Δοκιμή 14 ημερών δωρεάν
          </div>
          <h1 className="font-display text-[48px] md:text-[56px] font-extrabold tracking-tight leading-[1.05] mb-5">
            Τα κοινόχρηστα,<br />
            <span className="bg-gradient-to-r from-kaccent to-kpurple bg-clip-text text-transparent">επιτέλους ψηφιακά.</span>
          </h1>
          <p className="text-[17px] text-ksec leading-relaxed max-w-[520px] mx-auto mb-8">
            Αυτοματοποιήστε τον υπολογισμό, τη διανομή και την είσπραξη κοινοχρήστων. Τέλος στα Excel, τα χαρτιά και τις καθυστερήσεις.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/login?tab=signup" className="px-7 py-3 text-[14px] font-semibold text-white bg-gradient-to-r from-kaccent to-kpurple rounded-xl hover:opacity-90 transition">
              Ξεκινήστε Δωρεάν →
            </Link>
            <Link href="/prototype/landing" className="px-7 py-3 text-[14px] font-semibold text-ksec border border-kborder rounded-xl hover:border-kaccent hover:text-kaccent transition">
              Δείτε Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
