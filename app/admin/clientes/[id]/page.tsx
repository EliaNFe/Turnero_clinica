import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ClientInternalNotes from '@/components/admin/ClientInternalNotes'

const PAGE_SIZE = 10

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function ClienteDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { id } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const [{ data: client }, { data: appointments, count }, { count: confirmedCount }, { count: cancelledCount }] =
    await Promise.all([
      supabase.from('clients').select('id, full_name, dni, phone, email, internal_notes').eq('id', id).single(),
      supabase
        .from('appointments')
        .select('id, appointment_date, start_time, end_time, status, notes, services ( name )', {
          count: 'exact',
        })
        .eq('client_id', id)
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: false })
        .range(from, to),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', id)
        .eq('status', 'confirmed'),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('client_id', id)
        .eq('status', 'cancelled'),
    ])

  if (!client) {
    notFound()
  }

  const history = appointments ?? []
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="wrap admin-wrap">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1 className="admin-title">{client.full_name}</h1>
        </div>
        <Link href="/admin/clientes" className="btn-link">
          ← Volver a clientes
        </Link>
      </div>

      <div className="client-detail-card">
        <div>
          <span className="field-label-light">DNI</span>
          <p>{client.dni}</p>
        </div>
        <div>
          <span className="field-label-light">Teléfono</span>
          <p>{client.phone}</p>
        </div>
        {client.email && (
          <div>
            <span className="field-label-light">Email</span>
            <p>{client.email}</p>
          </div>
        )}
      </div>

      <div className="client-history-summary">
        <p className="admin-form-step" style={{ marginBottom: 4 }}>
          Historial de turnos
        </p>
        <p className="hint-text">
          {confirmedCount ?? 0} confirmado{confirmedCount === 1 ? '' : 's'}
          {(cancelledCount ?? 0) > 0 ? ` · ${cancelledCount} cancelado${cancelledCount === 1 ? '' : 's'}` : ''}
        </p>
      </div>

      <ClientInternalNotes clientId={client.id} initialNotes={client.internal_notes ?? ''} />

      {history.length === 0 && <p className="hint-text">Este cliente todavía no tiene turnos.</p>}

      <div className="appointment-list">
        {history.map((a) => {
          const service = Array.isArray(a.services) ? a.services[0] : a.services
          return (
            <div key={a.id} className="appointment-row">
              <div className="appointment-time">
                {formatDate(a.appointment_date)}
                <span className="appointment-time-end" style={{ display: 'block' }}>
                  {a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)}
                </span>
              </div>
              <div className="appointment-info">
                <p className="appointment-client">{service?.name ?? 'Servicio eliminado'}</p>
                {a.notes && <p className="appointment-notes">&quot;{a.notes}&quot;</p>}
              </div>
              <div className="appointment-actions">
                <span className={`status-badge status-${a.status}`}>
                  {a.status === 'confirmed' ? 'Confirmado' : 'Cancelado'}
                </span>
                {a.status === 'confirmed' && (
                  <Link href={`/admin/turnos/${a.id}/editar`} className="btn-link">
                    Editar
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="date-nav">
          {page > 1 ? (
            <Link href={`/admin/clientes/${id}?page=${page - 1}`} className="btn-ghost btn-small">
              ← Turnos más recientes
            </Link>
          ) : (
            <span />
          )}
          <span className="hint-text-sm" style={{ margin: 0 }}>
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/admin/clientes/${id}?page=${page + 1}`} className="btn-ghost btn-small">
              Turnos más antiguos →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  )
}