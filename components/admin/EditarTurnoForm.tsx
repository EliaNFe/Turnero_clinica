'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateAppointment } from '@/app/admin/turnos/actions'
import ClientPicker, { ClientData } from './ClientPicker'

type Service = {
  id: string
  name: string
  duration_minutes: number
  price: number | null
}

type Slot = { slot_start: string; slot_end: string }

export type ExistingAppointment = {
  id: string
  appointment_date: string
  start_time: string
  end_time: string
  notes: string | null
  serviceId: string
  client: ClientData
}

function formatPrice(price: number | null) {
  if (price == null) return null
  return price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

export default function EditarTurnoForm({
  appointment,
  services,
}: {
  appointment: ExistingAppointment
  services: Service[]
}) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const [changingClient, setChangingClient] = useState(false)
  const [client, setClient] = useState<ClientData>(appointment.client)
  const [serviceId, setServiceId] = useState(appointment.serviceId)
  const [date, setDate] = useState(appointment.appointment_date)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot>({
    slot_start: appointment.start_time,
    slot_end: appointment.end_time,
  })
  const [notes, setNotes] = useState(appointment.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const clientReady = Boolean(client.fullName && client.dni && client.phone)
  const isOriginalSlot = serviceId === appointment.serviceId && date === appointment.appointment_date

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!serviceId || !date) return
    let cancelled = false
    setLoadingSlots(true)

    const supabase = createClient()
    supabase
      .rpc('get_available_slots', { p_service_id: serviceId, p_date: date })
      .then(({ data, error }) => {
        if (cancelled) return
        let list: Slot[] = error ? [] : data ?? []

        // El horario actual del turno no aparece como "disponible" porque
        // ya está ocupado por este mismo turno. Si no cambiamos de
        // servicio ni de fecha, lo agregamos de vuelta a la lista.
        if (serviceId === appointment.serviceId && date === appointment.appointment_date) {
          const already = list.some((s) => s.slot_start === appointment.start_time)
          if (!already) {
            list = [...list, { slot_start: appointment.start_time, slot_end: appointment.end_time }].sort(
              (a, b) => a.slot_start.localeCompare(b.slot_start)
            )
          }
        } else {
          setSelectedSlot(list[0] ?? { slot_start: '', slot_end: '' })
        }

        setSlots(list)
        setLoadingSlots(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, date])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientReady || !client.id || !selectedSlot.slot_start) return

    setSubmitting(true)
    setErrorMessage('')

    const result = await updateAppointment({
      appointmentId: appointment.id,
      serviceId,
      clientId: client.id,
      date,
      startTime: selectedSlot.slot_start,
      endTime: selectedSlot.slot_end,
      notes: notes || undefined,
    })

    setSubmitting(false)
    if (result?.error) {
      setErrorMessage(result.error)
    }
    // Si no hay error, la propia acción redirige a la agenda.
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="admin-form-section">
        <p className="admin-form-step">Cliente</p>
        {!changingClient ? (
          <div className="picker-selected">
            <div>
              <p className="picker-selected-name">{client.fullName}</p>
              <p className="picker-selected-meta">
                DNI {client.dni} · {client.phone}
              </p>
            </div>
            <button type="button" className="btn-link" onClick={() => setChangingClient(true)}>
              Cambiar
            </button>
          </div>
        ) : (
          <ClientPicker value={client} onChange={setClient} />
        )}
      </div>

      <div className="admin-form-section">
        <p className="admin-form-step">Servicio</p>
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

      <div className="admin-form-section">
        <p className="admin-form-step">Fecha y horario</p>
        <input
          type="date"
          min={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="admin-input date-input-light"
        />

        {loadingSlots && <p className="hint-text-sm">Buscando horarios disponibles…</p>}
        {!loadingSlots && slots.length === 0 && (
          <p className="hint-text-sm">No hay horarios disponibles ese día. Probá con otra fecha.</p>
        )}
        {slots.length > 0 && (
          <div className="slot-grid slot-grid-light">
            {slots.map((slot) => (
              <button
                key={slot.slot_start}
                type="button"
                className="slot-chip slot-chip-light"
                data-active={selectedSlot.slot_start === slot.slot_start}
                onClick={() => setSelectedSlot(slot)}
              >
                {slot.slot_start.slice(0, 5)}
                {isOriginalSlot && slot.slot_start === appointment.start_time ? ' (actual)' : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="admin-form-section">
        <p className="admin-form-step">Notas (opcional)</p>
        <textarea
          className="admin-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
        />
      </div>

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
          disabled={!clientReady || !selectedSlot.slot_start || submitting}
        >
          {submitting ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
