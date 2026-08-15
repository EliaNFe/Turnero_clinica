'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const serviceSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es muy corto').max(120),
  description: z.string().trim().max(300).optional(),
  durationMinutes: z.coerce.number().int().min(5, 'Mínimo 5 minutos').max(480, 'Máximo 8 horas'),
  price: z.coerce.number().nonnegative('El precio no puede ser negativo').optional(),
})

type ServiceInput = z.infer<typeof serviceSchema>

// Crea un servicio nuevo. La duración cargada acá es la única fuente
// de verdad que usa get_available_slots más adelante - no hace falta
// tocar nada más para que empiece a afectar la disponibilidad real.
export async function createService(input: ServiceInput) {
  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('services').insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    duration_minutes: parsed.data.durationMinutes,
    price: parsed.data.price ?? null,
  })

  if (error) {
    return { error: 'No se pudo crear el servicio.' }
  }

  revalidatePath('/admin/servicios')
  redirect('/admin/servicios')
}

// Edita un servicio existente (nombre, descripción, duración, precio).
// Cambiar la duración acá actualiza automáticamente los horarios que
// se van a ofrecer a los próximos clientes - no rompe los turnos ya
// reservados con la duración anterior, esos quedan como están.
export async function updateService(serviceId: string, input: ServiceInput) {
  const parsed = serviceSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('services')
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      duration_minutes: parsed.data.durationMinutes,
      price: parsed.data.price ?? null,
    })
    .eq('id', serviceId)

  if (error) {
    return { error: 'No se pudo guardar el servicio.' }
  }

  revalidatePath('/admin/servicios')
  redirect('/admin/servicios')
}

// Activa o desactiva un servicio. No lo borramos de verdad: si tiene
// turnos ya reservados, borrarlo rompería ese historial (la base de
// datos ni lo permite: appointments.service_id no deja borrar un
// servicio referenciado). Desactivarlo alcanza: deja de ofrecerse en
// la home, pero el historial de turnos pasados queda intacto.
export async function toggleServiceActive(serviceId: string, active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('services').update({ active }).eq('id', serviceId)

  if (error) {
    return { error: 'No se pudo actualizar el servicio.' }
  }

  revalidatePath('/admin/servicios')
  return { error: null }
}