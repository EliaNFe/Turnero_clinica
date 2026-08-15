import { createBrowserClient } from '@supabase/ssr'

// Este cliente se usa en componentes que corren en el navegador
// (ej: la página pública de reserva, el calendario de horarios).
// Usa la anon key, que es SEGURA de exponer porque las RLS policies
// de la base de datos son las que realmente controlan qué se puede
// leer o escribir - la anon key sola no da acceso a nada sensible.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
