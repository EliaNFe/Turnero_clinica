'use client'

import { useTransition } from 'react'
import { toggleServiceActive } from '@/app/admin/servicios/actions'

export default function ToggleServiceButton({ serviceId, active }: { serviceId: string; active: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      className="btn-link"
      disabled={pending}
      onClick={() => startTransition(() => { toggleServiceActive(serviceId, !active) })}
    >
      {active ? 'Desactivar' : 'Activar'}
    </button>
  )
}