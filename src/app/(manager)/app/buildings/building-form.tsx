'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

type BuildingData = {
  name?: string
  address?: string
  city?: string
  postal_code?: string
  floors?: number | null
  year_built?: number | null
  total_millesimal?: number
  has_elevator?: boolean
  has_central_heating?: boolean
  has_parking?: boolean
  notes?: string
}

export function BuildingForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>
  defaultValues?: BuildingData
  submitLabel: string
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setError(null)
    try {
      await action(formData)
    } catch (e: any) {
      setError(e.message ?? 'Κάτι πήγε στραβά')
      setPending(false)
    }
  }

  const d = defaultValues ?? {}

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-5 max-w-[640px]">
      {error && (
        <div className="bg-kred/10 border border-kred/30 rounded-lg px-4 py-3 text-[13px] text-kred">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-[12px] font-semibold text-ksec mb-1.5">
          Όνομα κτιρίου <span className="text-kred">*</span>
        </label>
        <input
          name="name"
          required
          defaultValue={d.name ?? ''}
          placeholder="π.χ. Λεωφ. Συγγρού 42"
          className="w-full bg-kbg border border-kborder rounded-lg px-3.5 py-2.5 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition"
        />
      </div>

      {/* Address + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-semibold text-ksec mb-1.5">Διεύθυνση</label>
          <input
            name="address"
            defaultValue={d.address ?? ''}
            placeholder="Οδός & αριθμός"
            className="w-full bg-kbg border border-kborder rounded-lg px-3.5 py-2.5 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-ksec mb-1.5">Πόλη</label>
          <input
            name="city"
            defaultValue={d.city ?? 'Αθήνα'}
            className="w-full bg-kbg border border-kborder rounded-lg px-3.5 py-2.5 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition"
          />
        </div>
      </div>

      {/* Postal code + Year built */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block text-[12px] font-semibold text-ksec mb-1.5">Τ.Κ.</label>
          <input
            name="postal_code"
            defaultValue={d.postal_code ?? ''}
            placeholder="17121"
            className="w-full bg-kbg border border-kborder rounded-lg px-3.5 py-2.5 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-ksec mb-1.5">Έτος κατασκ.</label>
          <input
            name="year_built"
            type="number"
            min="1900"
            max="2030"
            defaultValue={d.year_built ?? ''}
            placeholder="1985"
            className="w-full bg-kbg border border-kborder rounded-lg px-3.5 py-2.5 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition font-mono"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-ksec mb-1.5">Όροφοι</label>
          <input
            name="floors"
            type="number"
            min="1"
            max="50"
            defaultValue={d.floors ?? ''}
            placeholder="6"
            className="w-full bg-kbg border border-kborder rounded-lg px-3.5 py-2.5 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition font-mono"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-ksec mb-1.5">Χιλιοστά</label>
          <input
            name="total_millesimal"
            type="number"
            min="100"
            max="10000"
            defaultValue={d.total_millesimal ?? 1000}
            className="w-full bg-kbg border border-kborder rounded-lg px-3.5 py-2.5 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition font-mono"
          />
        </div>
      </div>

      {/* Feature checkboxes */}
      <div>
        <label className="block text-[12px] font-semibold text-ksec mb-2.5">Εξοπλισμός</label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              name="has_elevator"
              defaultChecked={d.has_elevator ?? false}
              className="w-4 h-4 rounded border-kborder bg-kbg text-kaccent focus:ring-kaccent/30"
            />
            <span className="text-[13px] text-ksec group-hover:text-ktext transition">Ασανσέρ</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              name="has_central_heating"
              defaultChecked={d.has_central_heating ?? false}
              className="w-4 h-4 rounded border-kborder bg-kbg text-kaccent focus:ring-kaccent/30"
            />
            <span className="text-[13px] text-ksec group-hover:text-ktext transition">Κεντρική Θέρμανση</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              name="has_parking"
              defaultChecked={d.has_parking ?? false}
              className="w-4 h-4 rounded border-kborder bg-kbg text-kaccent focus:ring-kaccent/30"
            />
            <span className="text-[13px] text-ksec group-hover:text-ktext transition">Πάρκινγκ</span>
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[12px] font-semibold text-ksec mb-1.5">Σημειώσεις</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={d.notes ?? ''}
          placeholder="Πρόσθετες πληροφορίες για το κτίριο..."
          className="w-full bg-kbg border border-kborder rounded-lg px-3.5 py-2.5 text-[13px] text-ktext placeholder:text-kmut focus:border-kaccent focus:ring-1 focus:ring-kaccent/30 outline-none transition resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 bg-kaccent text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:opacity-90 transition disabled:opacity-50"
        >
          {pending ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" /></svg>
              Αποθήκευση...
            </>
          ) : (
            submitLabel
          )}
        </button>
        <Link
          href="/app/buildings"
          className="px-4 py-2.5 rounded-lg text-[13px] font-medium text-ksec border border-kborder hover:border-kborderl transition"
        >
          Ακύρωση
        </Link>
      </div>
    </form>
  )
}
