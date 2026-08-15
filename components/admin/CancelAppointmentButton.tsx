'use client'

import { useState, useTransition } from 'react'
import { cancelAppointment } from '@/app/admin/turnos/actions'

export default function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()

  if (confirming) {
    return (
      <span className="confirm-inline">
        <span>¿Cancelar este turno?</span>
        <button
          type="button"
          className="btn-danger-text"
          disabled={pending}
          onClick={() => startTransition(() => { cancelAppointment(appointmentId) })}
        >
          Sí, cancelar
        </button>
        <button type="button" className="btn-link" onClick={() => setConfirming(false)}>
          No
        </button>
      </span>
    )
  }

  return (
    <button type="button" className="btn-link" onClick={() => setConfirming(true)}>
      Cancelar turno
    </button>
  )
}