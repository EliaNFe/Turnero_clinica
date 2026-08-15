'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveClientNotes(clientId: string, notes: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('clients')
    .update({ internal_notes: notes.trim() || null })
    .eq('id', clientId)

  if (error) {
    return { error: 'No se pudo guardar la nota.' }
  }

  revalidatePath(`/admin/clientes/${clientId}`)
  return { error: null }
}
