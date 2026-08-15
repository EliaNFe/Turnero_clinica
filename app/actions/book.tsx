'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Esta validación corre en el servidor, así que no importa qué haya
// pasado (o no) la validación del navegador: acá es donde de verdad
// se decide si los datos son válidos antes de tocar la base de datos.
const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horario inválido'),
  fullName: z.string().trim().min(3, 'Nombre muy corto').max(120),
  dni: z.string().trim().regex(/^\d{7,8}$/, 'DNI inválido (debe tener 7 u 8 dígitos)'),
  phone: z.string().trim().min(6, 'Teléfono inválido').max(20),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional(),
  captchaToken: z.string().min(1, 'Falta la verificación de seguridad'),
})

type BookingInput = z.infer<typeof bookingSchema>

type BookingResult = { success: true } | { success: false; error: string }

// Confirma contra los servidores de Cloudflare que el token del widget
// es real y no vencido. Esto es lo que realmente frena a los bots -
// el widget del navegador solo, sin este chequeo, es puramente
// decorativo (cualquiera podría llamar a esta Server Action directo,
// sin pasar por el formulario, y saltearse el widget).
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    console.error('Falta TURNSTILE_SECRET_KEY en las variables de entorno del servidor.')
    return false
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    })
    const data = await res.json()
    return data.success === true
  } catch {
    return false
  }
}

export async function bookAppointment(input: BookingInput): Promise<BookingResult> {
  const parsed = bookingSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  }

  const { serviceId, date, startTime, fullName, dni, phone, email, notes, captchaToken } = parsed.data

  const captchaValid = await verifyTurnstileToken(captchaToken)
  if (!captchaValid) {
    return {
      success: false,
      error: 'No pudimos verificar que sos una persona. Recargá la página e intentá de nuevo.',
    }
  }

  // No se puede reservar en el pasado, doble chequeo también acá
  // (get_available_slots ya lo filtra, pero nunca confiamos en un
  // solo punto de validación).
  const todayStr = new Date().toISOString().split('T')[0]
  if (date < todayStr) {
    return { success: false, error: 'No se puede reservar una fecha pasada.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.rpc('book_appointment', {
    p_service_id: serviceId,
    p_appointment_date: date,
    p_start_time: startTime,
    p_full_name: fullName,
    p_dni: dni,
    p_phone: phone,
    p_email: email || null,
    p_notes: notes || null,
  })

  if (error) {
    // El trigger anti-solapamiento de la base de datos puede rechazar
    // el turno si justo lo tomó otra persona un segundo antes.
    return { success: false, error: error.message || 'No se pudo confirmar el turno.' }
  }

  return { success: true }
}