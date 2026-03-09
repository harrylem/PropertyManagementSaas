'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { group: 'Κύρια', items: [
    { href: '/app', label: 'Πίνακας Ελέγχου', icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
    { href: '/app/buildings', label: 'Κτίρια', icon: 'M4 2h16a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z' },
    { href: '/app/tenants', label: 'Ένοικοι', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' },
    { href: '/app/billing', label: 'Κοινόχρηστα', icon: 'M4 10h12M4 14h12' },
  ]},
  { group: 'Διαχείριση', items: [
    { href: '/app/announcements', label: 'Ανακοινώσεις', icon: 'm3 11 18-5v12L3 13v-2z' },
    { href: '/app/maintenance', label: 'Συντήρηση', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0' },
    { href: '/app/documents', label: 'Έγγραφα', icon: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z' },
  ]},
  { group: 'Ανάλυση', items: [
    { href: '/app/reports', label: 'Αναφορές', icon: 'M12 20V10M18 20V4M6 20v-4' },
    { href: '/app/settings', label: 'Ρυθμίσεις', icon: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0' },
  ]},
]

export function ManagerSidebar({ orgName, userName, initials }: {
  orgName: string; userName: string; initials: string
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-ksurface border-b border-kborder flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-kaccent to-kpurple flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <span className="text-[14px] font-bold tracking-tight">{orgName}</span>
        </div>
        <button onClick={() => setOpen(true)} className="w-9 h-9 rounded-lg flex items-center justify-center text-ksec hover:bg-kaccent/10 transition">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </header>

      {/* Overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <nav className={`fixed lg:sticky top-0 left-0 z-50 w-[260px] lg:w-[220px] bg-ksurface border-r border-kborder flex flex-col h-screen overflow-y-auto transition-transform duration-200 ease-out flex-shrink-0 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-kaccent to-kpurple flex items-center justify-center">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div>
              <div className="text-[15px] font-bold tracking-tight">Shared Expenses</div>
              <div className="text-[9px] font-medium text-kmut uppercase tracking-widest">Property Manager</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-ksec hover:bg-kaccent/10 transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="flex-1 px-2">
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              <div className="text-[10px] font-semibold text-kmut uppercase tracking-widest px-2 pt-4 pb-1">{group.group}</div>
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 w-full text-left px-2.5 py-2.5 lg:py-2 rounded-md text-[13px] transition ${
                      isActive ? 'bg-kaccent/10 text-kaccent font-semibold' : 'text-ksec hover:bg-kaccent/[0.06]'
                    }`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        <div className="px-4 py-3.5 border-t border-kborder">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-kgreen to-emerald-700 flex items-center justify-center text-white text-[11px] font-bold">{initials}</div>
              <div>
                <div className="text-[12.5px] font-medium">{userName}</div>
                <div className="text-[10.5px] text-kmut">Διαχειριστής</div>
              </div>
            </div>
            <button onClick={handleSignOut} className="text-kmut hover:text-kred transition" title="Αποσύνδεση">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
