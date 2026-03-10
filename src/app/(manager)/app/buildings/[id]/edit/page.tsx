import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { BuildingForm } from '../../building-form'
import { updateBuilding } from '../../actions'

export default async function EditBuildingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: building } = await supabase
    .from('buildings')
    .select('*')
    .eq('id', id)
    .single()

  if (!building) notFound()

  const updateWithId = updateBuilding.bind(null, id)

  return (
    <div>
      <Link
        href={`/app/buildings/${id}`}
        className="flex items-center gap-1 text-[13px] text-ksec mb-4 hover:text-kaccent transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Πίσω στο κτίριο
      </Link>

      <h1 className="text-[20px] lg:text-[22px] font-bold tracking-tight mb-1">Επεξεργασία Κτιρίου</h1>
      <p className="text-[13px] text-ksec mb-6">{building.name}</p>

      <BuildingForm
        action={updateWithId}
        defaultValues={{
          name: building.name,
          address: building.address,
          city: building.city,
          postal_code: building.postal_code,
          floors: building.floors,
          year_built: building.year_built,
          total_millesimal: building.total_millesimal,
          has_elevator: building.has_elevator,
          has_central_heating: building.has_central_heating,
          has_parking: building.has_parking,
          notes: building.notes,
        }}
        submitLabel="Αποθήκευση Αλλαγών"
      />
    </div>
  )
}
