'use client'

import { useState } from 'react'
import { saveClientNotes } from '@/app/admin/clientes/actions'

export default function ClientInternalNotes({
  clientId,
  initialNotes,
}: {
  clientId: string
  initialNotes: string
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  async function handleBlur() {
    if (notes === initialNotes && savedAt === null) return
    setSaving(true)
    const result = await saveClientNotes(clientId, notes)
    setSaving(false)
    if (!result.error) {
      setSavedAt(Date.now())
    }
  }

  return (
    <div className="admin-form-section" style={{ marginBottom: 28 }}>
      <p className="admin-form-step">Notas privadas (solo vos las ves)</p>
      <textarea
        className="admin-input"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        rows={3}
        maxLength={1000}
        placeholder="Ej: alérgica a X producto, prefiere horarios de mañana…"
      />
      <p className="hint-text-sm">{saving ? 'Guardando…' : savedAt ? 'Guardado ✓' : 'Se guarda al salir del campo.'}</p>
    </div>
  )
}
