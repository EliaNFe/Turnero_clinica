'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createService, updateService } from '@/app/admin/servicios/actions'

type ServiceFormData = {
  id?: string
  name: string
  description: string
  durationMinutes: number | ''
  price: number | ''
}

export default function ServiceForm({ initial }: { initial?: ServiceFormData }) {
  const isEditing = Boolean(initial?.id)

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(initial?.durationMinutes ?? 30)
  const [price, setPrice] = useState<number | ''>(initial?.price ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMessage('')

    const payload = {
      name,
      description: description || undefined,
      durationMinutes: durationMinutes === '' ? 0 : durationMinutes,
      price: price === '' ? undefined : price,
    }

    const result = isEditing
      ? await updateService(initial!.id!, payload)
      : await createService(payload)

    setSubmitting(false)

    if (result?.error) {
      setErrorMessage(result.error)
    }
    // Si no hay error, la Server Action ya redirige sola a /admin/servicios
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="name">Nombre del servicio</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </div>

        <div className="form-field">
          <label htmlFor="description">Descripción (opcional)</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={2}
          />
        </div>

        <div className="form-field">
          <label htmlFor="duration">Duración (minutos)</label>
          <input
            id="duration"
            type="number"
            min={5}
            max={480}
            step={5}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="price">Precio en pesos (opcional)</label>
          <input
            id="price"
            type="number"
            min={0}
            step={100}
            value={price}
            onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
      </div>

      {errorMessage && <p className="error-text" role="alert">{errorMessage}</p>}

      <div className="form-actions">
        <Link href="/admin/servicios" className="btn-link">
          ← Volver
        </Link>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear servicio'}
        </button>
      </div>
    </form>
  )
}