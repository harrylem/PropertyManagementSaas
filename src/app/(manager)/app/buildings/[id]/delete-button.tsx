'use client'

import { useState } from 'react'
import { deleteBuilding } from '../../actions'

export function DeleteBuildingButton({ buildingId, buildingName }: { buildingId: string; buildingName: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    try {
      await deleteBuilding(buildingId)
    } catch {
      setPending(false)
      setShowConfirm(false)
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-1.5 border border-kborder text-kred px-3 py-1.5 rounded-lg text-[12.5px] font-semibold hover:border-kred/50 hover:bg-kred/5 transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        Διαγραφή
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
      <div className="bg-ksurface border border-kborder rounded-xl w-full max-w-[400px] p-6" onClick={e => e.stopPropagation()}>
        <div className="text-[16px] font-bold mb-2">Διαγραφή Κτιρίου</div>
        <p className="text-[13px] text-ksec mb-1">
          Θέλετε σίγουρα να διαγράψετε το κτίριο <strong className="text-ktext">{buildingName}</strong>;
        </p>
        <p className="text-[12px] text-kred/80 mb-5">
          Αυτή η ενέργεια θα διαγράψει και όλες τις μονάδες, τα έξοδα και τους λογαριασμούς του κτιρίου.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            className="px-4 py-2 rounded-lg text-[13px] text-ksec border border-kborder hover:border-kborderl transition"
          >
            Ακύρωση
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-kred text-white hover:opacity-90 transition disabled:opacity-50"
          >
            {pending ? 'Διαγραφή...' : 'Ναι, Διαγραφή'}
          </button>
        </div>
      </div>
    </div>
  )
}
