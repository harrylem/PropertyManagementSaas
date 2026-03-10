'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ── Building CRUD ─────────────────────────────────────────────

export async function createBuilding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!member) throw new Error('Δεν ανήκετε σε οργανισμό')

  const { data, error } = await supabase
    .from('buildings')
    .insert({
      organization_id: member.organization_id,
      name: formData.get('name') as string,
      address: formData.get('address') as string || null,
      city: formData.get('city') as string || 'Αθήνα',
      postal_code: formData.get('postal_code') as string || null,
      floors: parseInt(formData.get('floors') as string) || null,
      year_built: parseInt(formData.get('year_built') as string) || null,
      total_millesimal: parseInt(formData.get('total_millesimal') as string) || 1000,
      has_elevator: formData.get('has_elevator') === 'on',
      has_central_heating: formData.get('has_central_heating') === 'on',
      has_parking: formData.get('has_parking') === 'on',
      notes: formData.get('notes') as string || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/app/buildings')
  revalidatePath('/app')
  redirect(`/app/buildings/${data.id}`)
}

export async function updateBuilding(buildingId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('buildings')
    .update({
      name: formData.get('name') as string,
      address: formData.get('address') as string || null,
      city: formData.get('city') as string || 'Αθήνα',
      postal_code: formData.get('postal_code') as string || null,
      floors: parseInt(formData.get('floors') as string) || null,
      year_built: parseInt(formData.get('year_built') as string) || null,
      total_millesimal: parseInt(formData.get('total_millesimal') as string) || 1000,
      has_elevator: formData.get('has_elevator') === 'on',
      has_central_heating: formData.get('has_central_heating') === 'on',
      has_parking: formData.get('has_parking') === 'on',
      notes: formData.get('notes') as string || null,
    })
    .eq('id', buildingId)

  if (error) throw new Error(error.message)

  revalidatePath('/app/buildings')
  revalidatePath(`/app/buildings/${buildingId}`)
  revalidatePath('/app')
  redirect(`/app/buildings/${buildingId}`)
}

export async function deleteBuilding(buildingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('buildings')
    .delete()
    .eq('id', buildingId)

  if (error) throw new Error(error.message)

  revalidatePath('/app/buildings')
  revalidatePath('/app')
  redirect('/app/buildings')
}

// ── Unit CRUD ─────────────────────────────────────────────────

export async function createUnit(buildingId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('units')
    .insert({
      building_id: buildingId,
      unit_label: formData.get('unit_label') as string,
      floor: parseInt(formData.get('floor') as string) ?? null,
      unit_type: formData.get('unit_type') as string || 'apartment',
      area_sqm: parseFloat(formData.get('area_sqm') as string) || null,
      millesimal: parseFloat(formData.get('millesimal') as string),
      has_parking: formData.get('has_parking') === 'on',
      has_storage: formData.get('has_storage') === 'on',
      is_occupied: formData.get('is_occupied') === 'on',
      notes: formData.get('notes') as string || null,
    })

  if (error) throw new Error(error.message)

  revalidatePath(`/app/buildings/${buildingId}`)
  revalidatePath('/app/buildings')
  revalidatePath('/app')
}

export async function updateUnit(buildingId: string, unitId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('units')
    .update({
      unit_label: formData.get('unit_label') as string,
      floor: parseInt(formData.get('floor') as string) ?? null,
      unit_type: formData.get('unit_type') as string || 'apartment',
      area_sqm: parseFloat(formData.get('area_sqm') as string) || null,
      millesimal: parseFloat(formData.get('millesimal') as string),
      has_parking: formData.get('has_parking') === 'on',
      has_storage: formData.get('has_storage') === 'on',
      is_occupied: formData.get('is_occupied') === 'on',
      notes: formData.get('notes') as string || null,
    })
    .eq('id', unitId)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/buildings/${buildingId}`)
}

export async function deleteUnit(buildingId: string, unitId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('units')
    .delete()
    .eq('id', unitId)

  if (error) throw new Error(error.message)

  revalidatePath(`/app/buildings/${buildingId}`)
  revalidatePath('/app/buildings')
  revalidatePath('/app')
}
