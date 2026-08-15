import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NuevoTurnoForm from '@/components/admin/NuevoTurnoForm'

export default async function NuevoTurnoPage() {
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration_minutes, price')
    .eq('active', true)
    .order('name')

  return (
    <div className="wrap admin-wrap">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Agenda</p>
          <h1 className="admin-title">Nuevo turno</h1>
        </div>
        <Link href="/admin/turnos" className="btn-link">
          ← Volver a la agenda
        </Link>
      </div>

      <NuevoTurnoForm services={services ?? []} />
    </div>
  )
}
