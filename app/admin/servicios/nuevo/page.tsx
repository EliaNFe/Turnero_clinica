import ServiceForm from '@/components/admin/ServiceForm'

export default function NuevoServicioPage() {
  return (
    <div className="wrap admin-wrap">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Servicios</p>
          <h1 className="admin-title">Nuevo servicio</h1>
        </div>
      </div>
      <ServiceForm />
    </div>
  )
}