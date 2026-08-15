'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { bookAppointment } from '@/app/actions/book'
import ClientPicker, { ClientData } from './ClientPicker'

type Service = {
  id: string
  name: string
  duration_minutes: number
  price: number | null
}

type Slot = { slot_start: string; slot_end: string }

const emptyClient: ClientData = { id: null, fullName: '', dni: '', phone: '', email: '' }

function formatPrice(price: number | null) {
  if (price == null) return null
  return price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

export default function NuevoTurnoForm({ services }: { services: Service[] }) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [client, setClient] = useState<ClientData>(emptyClient)
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const clientReady = Boolean(client.fullName && client.dni && client.phone)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!serviceId || !date) return
    let cancelled = false
    setLoadingSlots(true)
    setSelectedSlot(null)

    const supabase = createClient()
    supabase
      .rpc('get_available_slots', { p_service_id: serviceId, p_date: date })
      .then(({ data, error }) => {
        if (cancelled) return
        setSlots(error ? [] : data ?? [])
        setLoadingSlots(false)
      })

    return () => {
      cancelled = true
    }
  }, [serviceId, date])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientReady || !selectedSlot || !serviceId || !date) return

    setSubmitting(true)
    setErrorMessage('')

    const result = await bookAppointment({
      serviceId,
      date,
      startTime: selectedSlot.slot_start,
      fullName: client.fullName,
      dni: client.dni,
      phone: client.phone,
      email: client.email || undefined,
      notes: notes || undefined,
    })

    setSubmitting(false)

    if (result.success) {
      router.push(`/admin/turnos?date=${date}`)
    } else {
      setErrorMessage(result.error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form-section">
        <p className="admin-form-step">1. Cliente</p>
        <ClientPicker value={client} onChange={setClient} />
      </div>

      {clientReady && (
        <div className="admin-form-section reveal">
          <p className="admin-form-step">2. Servicio</p>
          <div className="service-list service-list-light">
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                className="service-row service-row-light"
                data-active={s.id === serviceId}
                onClick={() => setServiceId(s.id)}
              >
                <span className="service-name">{s.name}</span>
                <span className="service-meta">
                  {s.duration_minutes} min{formatPrice(s.price) ? ` · ${formatPrice(s.price)}` : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {clientReady && serviceId && (
        <div className="admin-form-section reveal">
          <p className="admin-form-step">3. Fecha y horario</p>
          <input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="admin-input date-input-light"
          />

          {loadingSlots && <p className="hint-text-sm">Buscando horarios disponibles…</p>}
          {!loadingSlots && date && slots.length === 0 && (
            <p className="hint-text-sm">No hay horarios disponibles ese día. Probá con otra fecha.</p>
          )}
          {slots.length > 0 && (
            <div className="slot-grid slot-grid-light">
              {slots.map((slot, i) => (
                <button
                  key={slot.slot_start}
                  type="button"
                  className="slot-chip slot-chip-light"
                  data-active={selectedSlot?.slot_start === slot.slot_start}
                  style={{ animationDelay: `${i * 35}ms` }}
                  onClick={() => setSelectedSlot(slot)}
                >
                  {slot.slot_start.slice(0, 5)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedSlot && (
        <div className="admin-form-section reveal">
          <p className="admin-form-step">4. Notas (opcional)</p>
          <textarea
            className="admin-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Algo que quieras recordar sobre este turno…"
          />
        </div>
      )}

      {errorMessage && (
        <p className="error-text" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="admin-form-actions">
        <button type="button" className="btn-link" onClick={() => router.back()}>
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!clientReady || !selectedSlot || submitting}
        >
          {submitting ? 'Guardando…' : 'Confirmar turno'}
        </button>
      </div>
    </form>
  )
}
