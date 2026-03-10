import Link from 'next/link'
import { BuildingForm } from '../building-form'
import { createBuilding } from '../actions'

export default function NewBuildingPage() {
  return (
    <div>
      <Link
        href="/app/buildings"
        className="flex items-center gap-1 text-[13px] text-ksec mb-4 hover:text-kaccent transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Πίσω στα Κτίρια
      </Link>

      <h1 className="text-[20px] lg:text-[22px] font-bold tracking-tight mb-1">Νέο Κτίριο</h1>
      <p className="text-[13px] text-ksec mb-6">Συμπληρώστε τα στοιχεία του κτιρίου</p>

      <BuildingForm action={createBuilding} submitLabel="Δημιουργία Κτιρίου" />
    </div>
  )
}
