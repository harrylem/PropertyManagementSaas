'use client'

import { useState, useRef } from 'react'
import { createUnit, updateUnit, deleteUnit } from '../../actions'

const UNIT_TYPES = [
  { value: 'apartment', label: 'Διαμέρισμα' },
  { value: 'studio', label: 'Στούντιο' },
  { value: 'office', label: 'Γραφείο' },
  { value: 'shop', label: 'Κατάστημα' },
  { value: 'parking', label: 'Πάρκινγκ' },
  { value: 'storage', label: 'Αποθήκη' },
  { value: 'other', label: 'Άλλο' },
]

export function UnitFormModal({
  buildingId,
  unit,
  onClose,
}: {
  buildingId: string
  unit: any | null
  onClose: () => void
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const isEditing = unit != null

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    try {
      if (isEditing) {
        await updateUnit(buildingId, unit.id, formData)
      } else {
        await createUnit(buildingId, formData)
      }
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Κάτι πήγε στραβά')
      setPending(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setPending(true)
    try {
      await deleteUnit(buildingId, unit.id)
      onClose()
    } catch (e: any) {
      setError(e.message ?? 'Δεν ήταν δυνατή η διαγραφή')
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-ksurface border border-kborder rounded-xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-kborder">
          <h2 className="text-[16px] font-bold">
            {isEditing ? `Επεξεργασία: ${unit.unit_label}` : 'Νέα Μονάδα'}
          </h2>
          <button onClick={onClose} className="text-ksec hover:text-ktext transition p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} action={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-kred/10 border border-kred/30 rounded-lg px-4 py-3 text-[13px] text-kred">
              {error}
            </div>
          )}

          {/* Label + Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-ksec mb-1.5">
                Ετικέτα <span className="text-kred">*</span>
              </label>
              <input
                name="unit_label"
                required
                defaultValue={unit?.unit_label ?? ''}
                placeholder="π.χ. 3Α, Ισόγειο"
                className="w-full bg-kbg border border-kborder rounded-lg px-3 py-2 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ksec mb-1.5">Τύπος</label>
              <select
                name="unit_type"
                defaultValue={unit?.unit_type ?? 'apartment'}
                className="w-full bg-kbg border border-kborder rounded-lg px-3 py-2 text-[13px] text-ktext focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition"
              >
                {UNIT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Floor + Area + Millesimal */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-ksec mb-1.5">Όροφος</label>
              <input
                name="floor"
                type="number"
                min="-2"
                max="50"
                defaultValue={unit?.floor ?? ''}
                placeholder="0"
                className="w-full bg-kbg border border-kborder rounded-lg px-3 py-2 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition font-mono"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ksec mb-1.5">τ.μ.</label>
              <input
                name="area_sqm"
                type="number"
                step="0.01"
                min="0"
                defaultValue={unit?.area_sqm ?? ''}
                placeholder="72.50"
                className="w-full bg-kbg border border-kborder rounded-lg px-3 py-2 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition font-mono"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-ksec mb-1.5">
                Χιλιοστά <span className="text-kred">*</span>
              </label>
              <input
                name="millesimal"
                type="number"
                step="0.001"
                min="0"
                required
                defaultValue={unit?.millesimal ? Number(unit.millesimal) : ''}
                placeholder="85.000"
                className="w-full bg-kbg border border-kborder rounded-lg px-3 py-2 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition font-mono"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="is_occupied"
                defaultChecked={unit?.is_occupied ?? true}
                className="w-4 h-4 rounded border-kborder bg-kbg text-kaccent focus:ring-kaccent/30"
              />
              <span className="text-[13px] text-ksec group-hover:text-ktext transition">Κατοικημένο</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="has_parking"
                defaultChecked={unit?.has_parking ?? false}
                className="w-4 h-4 rounded border-kborder bg-kbg text-kaccent focus:ring-kaccent/30"
              />
              <span className="text-[13px] text-ksec group-hover:text-ktext transition">Πάρκινγκ</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="has_storage"
                defaultChecked={unit?.has_storage ?? false}
                className="w-4 h-4 rounded border-kborder bg-kbg text-kaccent focus:ring-kaccent/30"
              />
              <span className="text-[13px] text-ksec group-hover:text-ktext transition">Αποθήκη</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] font-semibold text-ksec mb-1.5">Σημειώσεις</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={unit?.notes ?? ''}
              placeholder="Πρόσθετες πληροφορίες..."
              className="w-full bg-kbg border border-kborder rounded-lg px-3 py-2 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 bg-kaccent text-white px-4 py-2 rounded-lg text-[13px] font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
                    Αποθήκευση...
                  </>
                ) : isEditing ? 'Αποθήκευση' : 'Δημιουργία'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-lg text-[13px] text-ksec hover:text-ktext transition"
              >
                Ακύρωση
              </button>
            </div>

            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className={`px-3 py-2 rounded-lg text-[12px] font-medium transition ${
                  confirmDelete
                    ? 'bg-kred text-white hover:opacity-90'
                    : 'text-kred hover:bg-kred/10'
                }`}
              >
                {confirmDelete ? 'Επιβεβαίωση διαγραφής' : 'Διαγραφή'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
