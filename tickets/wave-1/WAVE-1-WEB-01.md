# ID del Ticket: WAVE-1-WEB-01

- **Agente Asignado:** `AGENT_WEB`
- **Rutas Permitidas (Write Scope):** `apps/web-admin/**`
- **Rutas Prohibidas:** `apps/api/**`, `apps/mobile/**`, `packages/shared/**`
- **Referencias Obligatorias:** Aplicar estrictamente la Guía de Diseño UI/UX y Sistema Visual de [`AGENTS.md`](../../AGENTS.md).

---

## Contrato Zod (`packages/shared`)

Consume en modo **solo lectura** desde `@cambiazo/shared`:
- `UserRoleSchema`, `BillingPlanTypeSchema`, `InstitutionStatusSchema`, `ConsentStatusSchema`
- `CreateInstitutionSchema`, `InstitutionDtoSchema`
- `CreateInvitationSchema`, `ValidateInviteCodeSchema`

---

## Requerimientos Funcionales y Técnicos

1. **Configuración de `apps/web-admin` (Next.js App Router + Tailwind CSS):**
   - Configurar paleta de colores y tokens en `tailwind.config.ts` según [`AGENTS.md`](../../AGENTS.md):
     - Fondo base `#F8F7FF`, superficies `#FFFFFF`.
     - `primary`: `#6C3CE9`, `primary-dark`: `#4C1D95`, `primary-soft`: `#EDE9FE`.
     - `accent-yellow`: `#FACC15`, `accent-mint`: `#10B981`.
     - Textos: `#1E1B4B` (principal) y `#64748B` (secundario).
   - Respetar la regla **"Cero anidación de tarjetas (No Card-inside-Card)"** y bordes suaves `rounded-2xl`.
   - Implementar capa de servicios HTTP (`src/lib/api-client.ts`) con mock adapter (`NEXT_PUBLIC_USE_MOCKS=true`) basado en los esquemas Zod compartidos.
2. **Consola Super Admin (`/super-admin/institutions`):**
   - Listado de colegios con estado (`ACTIVE` / `SUSPENDED`), tipo de abono (`FIXED_MONTHLY` vs `PER_ACTIVE_STUDENT`), total de alumnos y facturación estimada.
   - Formulario modal validado con `CreateInstitutionSchema` para crear colegios y configurar los accesos iniciales de `SCHOOL_ADMIN` y `KIOSK`.
3. **Panel Escuela - Directivo (`/school/invitations` y `/school/students`):**
   - Generador y administrador de códigos de invitación con fecha de expiración y límites de uso.
   - Listado de alumnos y familias con el estado auditable del consentimiento parental (`PENDING`, `GRANTED`, `REVOKED`).

---

## Criterios de Aceptación y Pruebas

- `pnpm --filter web-admin typecheck` y `pnpm --filter web-admin build` finalizan sin errores.
- Ningún archivo fuera de `apps/web-admin/**` fue modificado.
- La interfaz implementa fielmente los colores y principios visuales de [`AGENTS.md`](../../AGENTS.md).
