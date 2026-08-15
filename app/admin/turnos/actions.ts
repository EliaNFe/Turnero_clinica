'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function searchClients(query: string) {
  const q = query.trim()
  if (q.length < 2) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('clients')
    .select('id, full_name, dni, phone, email')
    .or(`full_name.ilike.%${q}%,dni.ilike.%${q}%`)
    .order('full_name')
    .limit(8)

  return data ?? []
}

const updateSchema = z.object({
  appointmentId: z.string().uuid(),
  serviceId: z.string().uuid(),
  clientId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horario inválido'),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horario inválido'),
  notes: z.string().trim().max(500).optional(),
})

type UpdateInput = z.infer<typeof updateSchema>

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Modifica un turno existente (servicio, cliente, fecha/horario, notas).
// Antes de guardar, vuelve a chequear que el horario elegido siga libre
// (excluyendo el propio turno que se está editando y respetando el
// buffer entre turnos configurado en professional_settings, igual que
// hace get_available_slots), por si alguien tomó ese lugar mientras
// ella estaba completando el formulario.
export async function updateAppointment(input: UpdateInput) {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const { appointmentId, serviceId, clientId, date, startTime, endTime, notes } = parsed.data
  const supabase = await createClient()

  const { data: settings } = await supabase.from('professional_settings').select('buffer_minutes').limit(1).single()
  const buffer = settings?.buffer_minutes ?? 0

  const { data: sameDayAppointments } = await supabase
    .from('appointments')
    .select('id, start_time, end_time')
    .eq('appointment_date', date)
    .eq('status', 'confirmed')
    .neq('id', appointmentId)

  const newStart = toMinutes(startTime)
  const newEndWithBuffer = toMinutes(endTime) + buffer

  const hasConflict = (sameDayAppointments ?? []).some((a) => {
    const otherStart = toMinutes(a.start_time)
    const otherEndWithBuffer = toMinutes(a.end_time) + buffer
    return newStart < otherEndWithBuffer && otherStart < newEndWithBuffer
  })

  if (hasConflict) {
    return { error: 'Ese horario ya no está disponible. Elegí otro.' }
  }

  const { error } = await supabase
    .from('appointments')
    .update({
      service_id: serviceId,
      client_id: clientId,
      appointment_date: date,
      start_time: startTime,
      end_time: endTime,
      notes: notes || null,
    })
    .eq('id', appointmentId)

  if (error) {
    return { error: 'No se pudo guardar el turno. Puede que el horario ya no esté disponible.' }
  }

  revalidatePath('/admin/turnos')
  redirect(`/admin/turnos?date=${date}`)
}

export async function cancelAppointment(appointmentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)

  if (error) {
    return { error: 'No se pudo cancelar el turno.' }
  }

  revalidatePath('/admin/turnos')
  return { error: null }
}
