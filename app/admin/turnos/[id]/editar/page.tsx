import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EditarTurnoForm, { ExistingAppointment } from '@/components/admin/EditarTurnoForm'

export default async function EditarTurnoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: appointment }, { data: services }] = await Promise.all([
    supabase
      .from('appointments')
      .select(
        `id, appointment_date, start_time, end_time, notes, service_id,
         clients ( id, full_name, dni, phone, email )`
      )
      .eq('id', id)
      .single(),
    supabase.from('services').select('id, name, duration_minutes, price').eq('active', true).order('name'),
  ])

  if (!appointment) {
    notFound()
  }

  const client = Array.isArray(appointment.clients) ? appointment.clients[0] : appointment.clients

  const existing: ExistingAppointment = {
    id: appointment.id,
    appointment_date: appointment.appointment_date,
    start_time: appointment.start_time,
    end_time: appointment.end_time,
    notes: appointment.notes,
    serviceId: appointment.service_id,
    client: {
      id: client?.id ?? null,
      fullName: client?.full_name ?? '',
      dni: client?.dni ?? '',
      phone: client?.phone ?? '',
      email: client?.email ?? '',
    },
  }

  return (
    <div className="wrap admin-wrap">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Agenda</p>
          <h1 className="admin-title">Editar turno</h1>
        </div>
        <Link href="/admin/turnos" className="btn-link">
          ← Volver a la agenda
        </Link>
      </div>

      <EditarTurnoForm appointment={existing} services={services ?? []} />
    </div>
  )
}
