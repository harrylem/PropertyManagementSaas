'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/tenant', label: 'Αρχική', icon: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { href: '/tenant/payments', label: 'Πληρωμές', icon: 'M1 4h22v16H1zM1 10h22' },
  { href: '/tenant/announcements', label: 'Νέα', icon: 'm3 11 18-5v12L3 13v-2z' },
  { href: '/tenant/maintenance', label: 'Βλάβες', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' },
  { href: '/tenant/profile', label: 'Προφίλ', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
]

export function TenantNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:top-0 lg:bottom-0 lg:right-auto z-50 bg-[#0e1017]/92 backdrop-blur-xl border-t lg:border-t-0 lg:border-r border-[#222640] flex lg:flex-col lg:w-[260px] lg:pt-8 lg:px-4 lg:justify-start" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {TABS.map((tab) => {
        const isActive = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 lg:flex-none flex flex-col lg:flex-row items-center lg:justify-start gap-1 lg:gap-3.5 py-2.5 lg:py-3.5 lg:px-5 lg:rounded-xl lg:mb-1 text-[10px] lg:text-[15px] font-medium relative transition ${
              isActive
                ? 'text-kaccent lg:bg-kaccent/[0.08]'
                : 'text-[#4e536e] hover:text-ksec'
            }`}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-kaccent rounded-b lg:hidden" />
            )}
            {isActive && (
              <span className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-kaccent rounded-r-full" />
            )}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={tab.icon} />
            </svg>
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
