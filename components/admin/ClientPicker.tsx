'use client'

import { useState, useEffect, useRef } from 'react'
import { searchClients } from '@/app/admin/turnos/actions'

export type ClientData = {
  id: string | null
  fullName: string
  dni: string
  phone: string
  email: string
}

type ClientRow = { id: string; full_name: string; dni: string; phone: string; email: string | null }

const emptyClient: ClientData = { id: null, fullName: '', dni: '', phone: '', email: '' }

export default function ClientPicker({
  value,
  onChange,
  initialMode = 'existing',
}: {
  value: ClientData
  onChange: (client: ClientData) => void
  initialMode?: 'existing' | 'new'
}) {
  const [mode, setMode] = useState<'existing' | 'new'>(initialMode)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClientRow[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selected = value.id !== null

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const data = await searchClients(query)
      setResults(data as ClientRow[])
      setSearching(false)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])
  /* eslint-enable react-hooks/set-state-in-effect */

  function pickExisting(row: ClientRow) {
    onChange({ id: row.id, fullName: row.full_name, dni: row.dni, phone: row.phone, email: row.email ?? '' })
    setQuery('')
    setResults([])
  }

  function clearSelection() {
    onChange({ ...emptyClient })
    setQuery('')
  }

  function switchMode(next: 'existing' | 'new') {
    setMode(next)
    onChange({ ...emptyClient })
    setQuery('')
    setResults([])
  }

  return (
    <div className="client-picker">
      <div className="picker-tabs">
        <button
          type="button"
          className="picker-tab"
          data-active={mode === 'existing'}
          onClick={() => switchMode('existing')}
        >
          Cliente existente
        </button>
        <button
          type="button"
          className="picker-tab"
          data-active={mode === 'new'}
          onClick={() => switchMode('new')}
        >
          Cliente nuevo
        </button>
      </div>

      {mode === 'existing' && !selected && (
        <div className="picker-search reveal">
          <input
            type="text"
            placeholder="Buscar por nombre o DNI…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="admin-input"
            autoComplete="off"
          />
          {searching && <p className="hint-text-sm">Buscando…</p>}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <p className="hint-text-sm">No se encontró ningún cliente con ese dato.</p>
          )}
          {results.length > 0 && (
            <div className="picker-results">
              {results.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  className="picker-result-row"
                  onClick={() => pickExisting(r)}
                >
                  <span className="picker-result-name">{r.full_name}</span>
                  <span className="picker-result-meta">
                    DNI {r.dni} · {r.phone}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'existing' && selected && (
        <div className="picker-selected reveal">
          <div>
            <p className="picker-selected-name">{value.fullName}</p>
            <p className="picker-selected-meta">
              DNI {value.dni} · {value.phone}
            </p>
          </div>
          <button type="button" className="btn-link" onClick={clearSelection}>
            Cambiar
          </button>
        </div>
      )}

      {mode === 'new' && (
        <div className="form-grid reveal" style={{ marginTop: 20 }}>
          <div className="admin-field">
            <label htmlFor="newFullName">Nombre completo</label>
            <input
              id="newFullName"
              className="admin-input"
              value={value.fullName}
              onChange={(e) => onChange({ ...value, fullName: e.target.value })}
              required
              minLength={3}
            />
          </div>
          <div className="admin-field">
            <label htmlFor="newDni">DNI</label>
            <input
              id="newDni"
              className="admin-input"
              value={value.dni}
              onChange={(e) => onChange({ ...value, dni: e.target.value })}
              required
              inputMode="numeric"
              pattern="[0-9]{7,8}"
              title="DNI sin puntos, entre 7 y 8 dígitos"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="newPhone">Teléfono</label>
            <input
              id="newPhone"
              className="admin-input"
              value={value.phone}
              onChange={(e) => onChange({ ...value, phone: e.target.value })}
              required
              type="tel"
            />
          </div>
          <div className="admin-field">
            <label htmlFor="newEmail">Email (opcional)</label>
            <input
              id="newEmail"
              className="admin-input"
              value={value.email}
              onChange={(e) => onChange({ ...value, email: e.target.value })}
              type="email"
            />
          </div>
        </div>
      )}
    </div>
  )
}