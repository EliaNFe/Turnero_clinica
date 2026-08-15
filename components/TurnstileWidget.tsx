'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      remove: (widgetId: string) => void
    }
  }
}

// Widget invisible/gestionado de Cloudflare Turnstile: confirma que quien
// completa el formulario es una persona, sin pedirle que resuelva nada
// (a diferencia de un captcha tradicional). Frena bots que intenten
// mandar reservas falsas en cadena.
export default function TurnstileWidget({ onVerify }: { onVerify: (token: string | null) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [ready, setReady] = useState(false)

  // Patrón estándar de "sincronizar con un sistema externo" (el script de
  // Cloudflare, que carga de forma asíncrona). Mismo caso que el efecto de
  // fetching en BookingWidget: el linter sugiere una librería especializada,
  // pero acá alcanza con este patrón sin sumar dependencias nuevas.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (window.turnstile) {
      setReady(true)
      return
    }
    // El script se carga en el layout con next/script; puede tardar
    // un instante en estar listo, así que esperamos a que aparezca.
    const interval = setInterval(() => {
      if (window.turnstile) {
        setReady(true)
        clearInterval(interval)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready || !containerRef.current || !window.turnstile) return

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) {
      console.error('Falta NEXT_PUBLIC_TURNSTILE_SITE_KEY en .env.local')
      return
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onVerify(token),
      'expired-callback': () => onVerify(null),
      'error-callback': () => onVerify(null),
    })

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  return <div ref={containerRef} className="turnstile-box" />
}