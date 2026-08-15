import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Este cliente se usa en Server Components y Route Handlers
// (ej: el panel privado de tu cliente, que necesita saber si
// hay una sesión válida antes de mostrar datos de turnos/clientes).
// El manejo de cookies acá es lo que mantiene la sesión segura:
// httpOnly, no accesible desde JavaScript del navegador.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll puede fallar si se llama desde un Server Component
            // (en vez de un Route Handler o Server Action). Es esperable
            // y se puede ignorar si ya tenés el middleware refrescando
            // la sesión (lo armamos en el próximo paso, cuando hagamos
            // el login del panel).
          }
        },
      },
    }
  )
}
