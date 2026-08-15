import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CancelAppointmentButton from '@/components/admin/CancelAppointmentButton'

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDateLong(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default async function TurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: dateParam } = await searchParams
  const date = dateParam ?? new Date().toISOString().split('T')[0]

  const supabase = await createClient()
  const { data: appointments } = await supabase
    .from('appointments')
    .select(
      `id, start_time, end_time, status, notes,
       clients ( id, full_name, phone, dni ),
       services ( name )`
    )
    .eq('appointment_date', date)
    .order('start_time')

  const activeAppointments = (appointments ?? []).filter((a) => a.status === 'confirmed')

  return (
    <div className="wrap admin-wrap">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Agenda</p>
          <h1 className="admin-title">{formatDateLong(date)}</h1>
        </div>
        <Link href="/admin/turnos/nuevo" className="btn btn-primary">
          + Nuevo turno
        </Link>
      </div>

      <div className="date-nav">
        <Link href={`/admin/turnos?date=${addDays(date, -1)}`} className="btn-ghost btn-small">
          ← Día anterior
        </Link>
        <Link href={`/admin/turnos?date=${new Date().toISOString().split('T')[0]}`} className="btn-link">
          Hoy
        </Link>
        <Link href={`/admin/turnos?date=${addDays(date, 1)}`} className="btn-ghost btn-small">
          Día siguiente →
        </Link>
      </div>

      {activeAppointments.length === 0 && (
        <p className="hint-text" style={{ marginTop: 32 }}>
          No hay turnos agendados para este día.
        </p>
      )}

      <div className="appointment-list">
        {activeAppointments.map((a) => {
          const client = Array.isArray(a.clients) ? a.clients[0] : a.clients
          const service = Array.isArray(a.services) ? a.services[0] : a.services
          return (
            <div key={a.id} className="appointment-row">
              <div className="appointment-time">
                {a.start_time.slice(0, 5)}
                <span className="appointment-time-end"> – {a.end_time.slice(0, 5)}</span>
              </div>
              <div className="appointment-info">
                <p className="appointment-client">{client?.full_name ?? 'Cliente eliminado'}</p>
                <p className="appointment-meta">
                  {service?.name} · DNI {client?.dni} · {client?.phone}
                </p>
                {a.notes && <p className="appointment-notes">&quot;{a.notes}&quot;</p>}
              </div>
              <div className="appointment-actions">
                <Link href={`/admin/turnos/${a.id}/editar`} className="btn-link">
                  Editar
                </Link>
                <CancelAppointmentButton appointmentId={a.id} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}