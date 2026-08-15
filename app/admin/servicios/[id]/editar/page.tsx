import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ServiceForm from '@/components/admin/ServiceForm'

export default async function EditarServicioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: service } = await supabase
    .from('services')
    .select('id, name, description, duration_minutes, price')
    .eq('id', id)
    .single()

  if (!service) {
    notFound()
  }

  return (
    <div className="wrap admin-wrap">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Servicios</p>
          <h1 className="admin-title">Editar servicio</h1>
        </div>
      </div>
      <ServiceForm
        initial={{
          id: service.id,
          name: service.name,
          description: service.description ?? '',
          durationMinutes: service.duration_minutes,
          price: service.price ?? '',
        }}
      />
    </div>
  )
}
