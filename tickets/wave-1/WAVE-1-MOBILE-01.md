# ID del Ticket: WAVE-1-MOBILE-01

- **Agente Asignado:** `AGENT_MOBILE`
- **Rutas Permitidas (Write Scope):** `apps/mobile/**`
- **Rutas Prohibidas:** `apps/api/**`, `apps/web-admin/**`, `packages/shared/**`
- **Referencias Obligatorias:** Aplicar estrictamente la Guía de Diseño UI/UX y Sistema Visual de [`AGENTS.md`](../../AGENTS.md).

---

## Contrato Zod (`packages/shared`)

Consume en modo **solo lectura** desde `@cambiazo/shared`:
- `UserRoleSchema`, `ConsentStatusSchema`
- `ValidateInviteCodeSchema`
- `RegisterParentAndStudentSchema`, `GrantParentalConsentSchema`, `RevokeParentalConsentSchema`

---

## Requerimientos Funcionales y Técnicos

1. **Estructura y Tokens en `apps/mobile` (Expo Router + NativeWind/StyleSheet):**
   - Configurar tokens visuales según [`AGENTS.md`](../../AGENTS.md):
     - Fondo base `#F8F7FF`, superficies `#FFFFFF`.
     - `Primary`: `#6C3CE9`, `Accent Yellow`: `#FACC15`, `Accent Mint`: `#10B981`.
     - Textos: `#1E1B4B` (principal) y `#64748B` (secundario).
     - Botones táctiles con altura mínima de `52px` - `56px` y radio `rounded-2xl`.
     - **Regla estricta: No anidar tarjetas (No card-in-card).**
   - Implementar grupos de rutas: `app/(auth)/**`, `app/(parent)/**`, `app/(student)/**`, `app/(kiosk)/**`.
2. **Onboarding por Código de Escuela (`app/(auth)/school-code.tsx`):**
   - Entrada visual del código escolar, validación con `ValidateInviteCodeSchema` y bienvenida con el nombre de la institución.
3. **Registro Familiar y Firma de Consentimiento Parental (`app/(auth)/register-family.tsx` y `consent-modal.tsx`):**
   - Formulario de alta de Padre e Hijo validado con `RegisterParentAndStudentSchema`.
   - Pantalla legal clara y sin jerga técnica para la firma digital del Consentimiento Parental (**Ley 25.326**), enviando `GrantParentalConsentSchema`.
   - Opción para que el padre revoque el consentimiento en cualquier momento (`RevokeParentalConsentSchema`).
   - Pantalla de bloqueo amigable para el alumno si el consentimiento no está otorgado (`GRANTED`).

---

## Criterios de Aceptación y Pruebas

- `pnpm --filter mobile typecheck` finaliza con código `0`.
- Cumple todas las proporciones de color (60% blanco/lavanda, 30% morado, 10% acentos) y botones de altura mínima 52px.
- Si el alumno no tiene consentimiento `GRANTED`, no puede ingresar al home.
