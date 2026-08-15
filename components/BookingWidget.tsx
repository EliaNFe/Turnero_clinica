'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { bookAppointment } from '@/app/actions/book'
import TurnstileWidget from '@/components/TurnstileWidget'

type Service = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  price: number | null
}

type Slot = {
  slot_start: string
  slot_end: string
}

function formatPrice(price: number | null) {
  if (price == null) return null
  return price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

export default function BookingWidget({ services }: { services: Service[] }) {
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [step, setStep] = useState<'select' | 'form' | 'success' | 'error'>('select')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [dni, setDni] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  const selectedService = services.find((s) => s.id === serviceId) ?? null

  /* Patrón estándar de "fetch en efecto ante cambio de dependencias" (mismo
     que usa la documentación oficial de React). El linter sugiere una
     librería de fetching (SWR/TanStack Query) para este caso, pero
     mantenemos el proyecto sin dependencias extra a propósito. */
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

  const hasSelection = Boolean(serviceId && date)
  const visibleSlots = hasSelection ? slots : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot || !serviceId || !date) return

    if (!captchaToken) {
      setErrorMessage('Esperá un instante a que termine la verificación de seguridad.')
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    const result = await bookAppointment({
      serviceId,
      date,
      startTime: selectedSlot.slot_start,
      fullName,
      dni,
      phone,
      email: email || undefined,
      notes: notes || undefined,
      captchaToken,
    })

    setSubmitting(false)

    if (result.success) {
      setStep('success')
    } else {
      setErrorMessage(result.error)
      setStep('error')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  if (step === 'success') {
    return (
      <div className="reveal success-box" role="status">
        <svg width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden="true">
          <circle className="success-check" cx="23" cy="23" r="20" stroke="#6e2a3b" strokeWidth="1.5" />
          <path
            className="success-check"
            d="M14 23.5 L20 29.5 L32.5 16"
            stroke="#6e2a3b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <p className="success-title">Turno confirmado</p>
          <p className="success-sub">
            {selectedService?.name} · {date} a las {selectedSlot?.slot_start.slice(0, 5)}
          </p>
        </div>
      </div>
    )
  }

  if (step === 'form' && selectedSlot) {
    return (
      <form onSubmit={handleSubmit} className="reveal booking-form">
        <div className="form-summary">
          {selectedService?.name} · {date} · {selectedSlot.slot_start.slice(0, 5)} a{' '}
          {selectedSlot.slot_end.slice(0, 5)}
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="fullName">Nombre completo</label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              minLength={3}
              autoComplete="name"
            />
          </div>

          <div className="form-field">
            <label htmlFor="dni">DNI</label>
            <input
              id="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              required
              inputMode="numeric"
              pattern="[0-9]{7,8}"
              title="DNI sin puntos, entre 7 y 8 dígitos"
            />
          </div>

          <div className="form-field">
            <label htmlFor="phone">Teléfono</label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              type="tel"
              autoComplete="tel"
            />
          </div>

          <div className="form-field">
            <label htmlFor="email">Email (opcional)</label>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
            />
          </div>

          <div className="form-field">
            <label htmlFor="notes">Comentario (opcional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
            />
          </div>
        </div>

        <div className="field-block">
          <TurnstileWidget onVerify={setCaptchaToken} />
        </div>

        {errorMessage && <p className="error-text" role="alert">{errorMessage}</p>}

        <div className="form-actions">
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setStep('select')
              setCaptchaToken(null)
            }}
          >
            ← Volver
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting || !captchaToken}>
            {submitting ? 'Confirmando…' : 'Confirmar turno'}
          </button>
        </div>
      </form>
    )
  }

  return (
    <div>
      <div className="service-list">
        {services.map((s) => (
          <button
            key={s.id}
            type="button"
            className="service-row"
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

      {serviceId && (
        <div className="field-block reveal">
          <label className="field-label" htmlFor="date">
            Elegí una fecha
          </label>
          <input
            id="date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="date-input"
          />
        </div>
      )}

      {loadingSlots && <p className="hint-text">Buscando horarios disponibles…</p>}

      {!loadingSlots && hasSelection && visibleSlots.length === 0 && (
        <p className="hint-text">No hay horarios disponibles ese día. Probá con otra fecha.</p>
      )}

      {visibleSlots.length > 0 && (
        <div className="slot-grid">
          {visibleSlots.map((slot, i) => (
            <button
              key={slot.slot_start}
              type="button"
              className="slot-chip"
              style={{ animationDelay: `${i * 35}ms` }}
              onClick={() => {
                setSelectedSlot(slot)
                setStep('form')
              }}
            >
              {slot.slot_start.slice(0, 5)}
            </button>
          ))}
        </div>
      )}

      {step === 'error' && errorMessage && (
        <p className="error-text reveal" role="alert">
          {errorMessage}{' '}
          <button type="button" className="btn-link" onClick={() => setStep('select')}>
            Reintentar
          </button>
        </p>
      )}
    </div>
  )
}