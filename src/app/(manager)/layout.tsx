import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ManagerSidebar } from './sidebar'

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get user's organization
  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organizations(id, name)')
    .eq('user_id', user.id)
    .single()

  const orgName = (member?.organizations as any)?.name ?? 'Shared Expenses'
  const userName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'User'
  const initials = userName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-kbg text-ktext flex">
      <ManagerSidebar orgName={orgName} userName={userName} initials={initials} />
      <main className="flex-1 overflow-y-auto p-4 pt-[72px] lg:pt-7 lg:p-7 lg:ml-[220px] max-w-[1100px]">
        {children}
      </main>
    </div>
  )
}
