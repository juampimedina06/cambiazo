# ID del Ticket: WAVE-2-MOBILE-02

- **Agente Asignado:** `AGENT_MOBILE`
- **Rutas Permitidas (Write Scope):** `apps/mobile/**`
- **Rutas Prohibidas:** `apps/api/**`, `apps/web-admin/**`, `packages/shared/**`
- **Referencias Obligatorias:** Aplicar estrictamente la Guía de Diseño UI/UX y Sistema Visual de [`AGENTS.md`](../../AGENTS.md).

---

## Contrato Zod (`packages/shared`)

Consume en modo **solo lectura** desde `@cambiazo/shared`:
- `ProductCategorySchema`
- `SpendingLimitsSchema`
- `TopUpPreferenceRequestSchema`
- `QrPaymentTokenSchema`, `ChargeQrRequestSchema`, `CatalogProductSchema`

---

## Requerimientos Funcionales y Técnicos

1. **Panel Padre/Tutor — Carga de Saldo y Control Parental (`app/(parent)/`):**
   - **Carga de Saldo 1 a 1 (`wallet/top-up.tsx`):** selector de monto en Pesos ARS, validación con `TopUpPreferenceRequestSchema` y checkout de Mercado Pago. Señalización clara de que $1 cargado = $1 en el kiosco (sin tokens ni cripto).
   - **Reglas y Límites Parentales (`controls/spending-limits.tsx`):**
     - Inputs para tope diario y tope semanal.
     - Chips táctiles con emojis para bloquear categorías (ej. 🍬 Golosinas).
     - Botón destacado de **Pausar Cuenta** (`isPaused`).
   - **Alertas de Compra (`notifications.tsx`):** lista limpia de compras en el kiosco con monto, hora y detalle de productos.
2. **Home y Billetera del Alumno (`app/(student)/index.tsx` y `pay-qr.tsx`):**
   - **Regla de 3 datos y sin anidar tarjetas:**
     - Header: Saludo + Badge de Escuela + Puntos de Comunidad (en amarillo lápiz `#FACC15`).
     - Saldo en pesos gigante (`36px - 44px`, `font-extrabold`) en morado y verde menta (`#10B981`).
     - Botón protagónico morado (`#6C3CE9`) de altura `56px`: **"Pagar en Kiosco (QR)"**.
     - Generador de QR efímero con código de 6 dígitos grande y timer regresivo de 120s.
     - Lista plana (máximo 3 consumos recientes, ícono, nombre corto y monto). Prohibido transferir saldo o retirar efectivo.
3. **Modo Kiosquero Mobile — Cobro en Recreo < 5s (`app/(kiosk)/pos.tsx`):**
   - Botones gigantes para seleccionar productos del catálogo escolar.
   - Escáner QR de cámara instantáneo + teclado numérico para código de 6 dígitos.
   - Envío de `ChargeQrRequestSchema` con `idempotencyKey` y pantalla de confirmación verde en menos de 3 toques.

---

## Criterios de Aceptación y Pruebas

- `pnpm --filter mobile typecheck` finaliza sin errores.
- El cobro en Modo Kiosquero se ejecuta en menos de 5 segundos.
- La billetera del alumno respeta la separación visual de las dos economías (morado/verde para pesos, amarillo para puntos de comunidad).
