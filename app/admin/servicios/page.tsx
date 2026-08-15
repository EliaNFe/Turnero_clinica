import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ToggleServiceButton from '@/components/admin/ToggleServiceButton'

function formatPrice(price: number | null) {
  if (price == null) return 'Sin precio cargado'
  return price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

export default async function ServiciosPage() {
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes, price, active')
    .order('name')

  return (
    <div className="wrap admin-wrap">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Servicios</p>
          <h1 className="admin-title">Tus servicios</h1>
        </div>
        <Link href="/admin/servicios/nuevo" className="btn btn-primary">
          + Nuevo servicio
        </Link>
      </div>

      {(!services || services.length === 0) && (
        <p className="hint-text" style={{ marginTop: 32 }}>
          Todavía no cargaste ningún servicio.
        </p>
      )}

      <div>
        {(services ?? []).map((s) => (
          <div key={s.id} className="service-admin-row">
            <div>
              <span className="service-admin-name">
                {s.name}
                <span className={`status-badge ${s.active ? 'status-badge--active' : 'status-badge--inactive'}`}>
                  {s.active ? 'Activo' : 'Inactivo'}
                </span>
              </span>
              <p className="service-admin-meta">
                {s.duration_minutes} min · {formatPrice(s.price)}
                {s.description ? ` · ${s.description}` : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
              <Link href={`/admin/servicios/${s.id}/editar`} className="btn-link">
                Editar
              </Link>
              <ToggleServiceButton serviceId={s.id} active={s.active} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}