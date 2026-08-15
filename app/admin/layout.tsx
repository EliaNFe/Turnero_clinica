import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from './actions'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // El middleware ya protege /admin, esto es un segundo chequeo
  // por si se renderiza este layout de alguna otra forma.
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="admin-shell">
      <nav className="admin-nav">
        <div className="admin-nav-inner">
          <Link href="/admin/turnos" className="nav-brand">
            Panel
          </Link>
          <ul className="nav-links admin-nav-links">
            <li>
              <Link href="/admin/turnos">Turnos</Link>
            </li>
            <li>
              <Link href="/admin/clientes">Clientes</Link>
            </li>
          </ul>
          <form action={signOut}>
            <button type="submit" className="btn-link">
              Salir
            </button>
          </form>
        </div>
      </nav>
      <main className="admin-main">{children}</main>
    </div>
  )
}
