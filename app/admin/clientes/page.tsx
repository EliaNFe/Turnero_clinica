import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 20

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageParam } = await searchParams
  const query = q?.trim() ?? ''
  const page = Math.max(1, Number(pageParam) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  let request = supabase
    .from('clients')
    .select('id, full_name, dni, phone', { count: 'exact' })
    .order('full_name')
    .range(from, to)
  if (query) {
    request = request.or(`full_name.ilike.%${query}%,dni.ilike.%${query}%,phone.ilike.%${query}%`)
  }
  const { data: clients, count } = await request

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const qsBase = query ? `q=${encodeURIComponent(query)}&` : ''

  return (
    <div className="wrap admin-wrap">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Clientes</p>
          <h1 className="admin-title">Clientes</h1>
        </div>
      </div>

      <form className="client-search" method="get">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Buscar por nombre, DNI o teléfono…"
          className="admin-input"
        />
      </form>

      {(!clients || clients.length === 0) && (
        <p className="hint-text">
          {query ? 'No se encontró ningún cliente con esa búsqueda.' : 'Todavía no hay clientes cargados.'}
        </p>
      )}

      <div className="appointment-list">
        {clients?.map((c) => (
          <Link key={c.id} href={`/admin/clientes/${c.id}`} className="client-row">
            <span className="client-row-name">{c.full_name}</span>
            <span className="client-row-meta">
              DNI {c.dni} · {c.phone}
            </span>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="date-nav">
          {page > 1 ? (
            <Link href={`/admin/clientes?${qsBase}page=${page - 1}`} className="btn-ghost btn-small">
              ← Anteriores
            </Link>
          ) : (
            <span />
          )}
          <span className="hint-text-sm" style={{ margin: 0 }}>
            Página {page} de {totalPages} · {total} cliente{total === 1 ? '' : 's'}
          </span>
          {page < totalPages ? (
            <Link href={`/admin/clientes?${qsBase}page=${page + 1}`} className="btn-ghost btn-small">
              Siguientes →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  )
}

