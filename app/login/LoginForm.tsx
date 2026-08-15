'use client'

import { useActionState } from 'react'
import { signIn } from './actions'

const initialState = { error: '' }

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <form action={formAction} className="login-card">
      <p className="eyebrow">Panel privado</p>
      <h1>Iniciar sesión</h1>

      <div className="form-field field-block">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" autoFocus />
      </div>

      <div className="form-field field-block">
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>

      {state?.error && (
        <p className="error-text" role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending} style={{ marginTop: 28, width: '100%' }}>
        {pending ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  )
}
