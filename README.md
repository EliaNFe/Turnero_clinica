# Sistema de turnos online

Sistema de reservas de turnos para una clínica de estética. Los clientes finales reservan sin necesidad de cuenta (solo completan un formulario), y la profesional gestiona todo desde un panel privado.

## Stack

- **Next.js** (App Router) + TypeScript
- **Supabase** (Postgres + Auth + RLS) como backend
- **Zod** para validación server-side
- Sin librerías de UI ni de fetching externas — CSS propio y `fetch`/`rpc` directos, a propósito, para mantener mínima la superficie de dependencias.

## Estructura general

```
app/
  page.tsx                  → Landing pública (hero, nosotros, servicios, reserva, contacto)
  actions/book.ts           → Server Action: valida con Zod y llama a book_appointment()
  login/                    → Login del panel privado
  admin/
    layout.tsx              → Nav + protección de sesión
    turnos/                 → Agenda: ver, crear, editar, cancelar turnos
    clientes/                → Listado de clientes + historial por cliente

components/
  BookingWidget.tsx         → Flujo de reserva público (servicio → fecha → horario → form)
  admin/                    → Componentes del panel privado

lib/supabase/
  client.ts / server.ts     → Clientes de Supabase (browser / server, con manejo de cookies)
  middleware.ts             → Refresco de sesión

middleware.ts                → Protege las rutas /admin (raíz del proyecto)

schema.sql                   → Schema completo de la base de datos (tablas, RLS, funciones)
```

## Arquitectura de la base de datos

- `professional_settings` — configuración general (nombre del negocio, buffer entre turnos, timezone).
- `services` — servicios ofrecidos, con duración editable. La duración es la única fuente de verdad: cambiarla actualiza automáticamente los cálculos de disponibilidad, sin tocar código.
- `weekly_availability` — horario semanal recurrente.
- `availability_exceptions` — excepciones puntuales (feriados, días especiales).
- `clients` — identidad única del cliente final, con **DNI** como clave de negocio (no el teléfono, que puede repetirse en una familia). Permite historial por persona sin necesidad de cuenta.
- `appointments` — turnos, vinculados a `clients` y `services`.

### Funciones clave (Postgres)

- **`get_available_slots(service_id, fecha)`** — calcula los huecos disponibles reales, cruzando horario semanal, excepciones, turnos ya ocupados (sin importar el servicio) y el buffer configurado. Genera candidatos cada 15 minutos (no cada "duración del servicio") para no desperdiciar disponibilidad real. Filtra automáticamente horarios ya pasados si la fecha consultada es hoy.
- **`book_appointment(...)`** — único camino de escritura para el público. Es `security definer`: busca o crea el cliente por DNI y crea el turno en una sola transacción atómica. El público no tiene ningún grant directo sobre `clients` ni `appointments`.
- **Trigger `check_appointment_overlap`** — rechaza a nivel de base de datos cualquier turno que se superponga con otro, sin importar que tengan duraciones distintas. Es la protección real contra doble reserva (no depende de que el frontend valide bien).

### Seguridad (RLS)

- El público solo puede: leer servicios activos, horarios y disponibilidad, y ejecutar `book_appointment()`.
- El público **no tiene** acceso directo de lectura ni escritura a `clients` ni `appointments`.
- El panel (`auth.role() = 'authenticated'`) tiene control total sobre todas las tablas.
- Sin registro público habilitado en Supabase Auth — el único usuario es el de la profesional, creado a mano desde el dashboard.

## Estado del proyecto

- ✅ Landing pública + flujo de reserva sin cuenta.
- ✅ Base de datos con RLS, anti-solapamiento y cálculo de disponibilidad.
- ✅ Panel privado (login, agenda, gestión de turnos y clientes) — completado en otra sesión de trabajo.