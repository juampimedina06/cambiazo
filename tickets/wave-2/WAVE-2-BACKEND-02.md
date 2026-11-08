# ID del Ticket: WAVE-2-BACKEND-02

- **Agente Asignado:** `AGENT_BACKEND`
- **Rutas Permitidas (Write Scope):** `apps/api/**`, `packages/shared/**`
- **Rutas Prohibidas:** `apps/web-admin/**`, `apps/mobile/**`
- **Referencias Obligatorias:** Leer [`AGENTS.md`](../../AGENTS.md).

---

## Contrato Zod (`packages/shared`)

Consume desde `@cambiazo/shared`:
- `AccountTypeSchema`, `LedgerEntryDirectionSchema`, `ProductCategorySchema`
- `SpendingLimitsSchema`
- `TopUpPreferenceRequestSchema`, `MercadoPagoWebhookPayloadSchema`
- `CatalogProductSchema`, `CreateCatalogProductSchema`
- `QrPaymentTokenSchema`, `ChargeQrRequestSchema`, `KioskWithdrawalRequestSchema`

---

## Requerimientos Funcionales y Técnicos

1. **Motor de Libro Mayor de Doble Entrada Inmutable (`LedgerService`):**
   - Tablas `accounts`, `ledger_transactions` y `ledger_entries` (monto `BIGINT > 0` en centavos).
   - Inmutabilidad estricta: trigger o regla en base de datos que bloquea cualquier `UPDATE` o `DELETE` sobre asientos contables.
   - En cada transacción, verificar que `SUM(DEBIT) === SUM(CREDIT)`.
   - **Regla inquebrantable:** prohibido transferir saldo entre alumnos (`STUDENT_ALLOCATION -> STUDENT_ALLOCATION`) o retirar efectivo por parte de alumnos/padres.
2. **Carga de Saldo 1 a 1 vía Mercado Pago (`PaymentsService`):**
   - `POST /api/v1/wallet/top-up-preference` (`PARENT`): crea preferencia de cobro en Mercado Pago para cargar saldo real en pesos (1 a 1).
   - `POST /api/v1/webhooks/mercadopago`: procesa el webhook de pago de forma **idempotente** (asiento `DEBIT PLATFORM_CLEARING` / `CREDIT STUDENT_ALLOCATION`).
3. **Límites Parentales y Bloqueo de Categorías (`ParentalControlsService`):**
   - `PUT /api/v1/students/:id/limits` (`PARENT`): configura topes diarios/semanales en centavos, categorías bloqueadas (ej. `CANDY`) y pausa instantánea de cuenta.
4. **Catálogo de Kiosco, Cobro QR y Retiros (`KioskService`):**
   - `POST /api/v1/kiosk/products`: ABM de productos con categoría y precio en centavos.
   - `POST /api/v1/student/payment-token` (`STUDENT`): genera token y código QR efímero con TTL de 120s en Redis.
   - `POST /api/v1/kiosk/charge` (`KIOSK`): valida en una sola transacción atómica:
     1. Mismo `institution_id` para alumno y kiosco.
     2. Consentimiento parental activo (`GRANTED`).
     3. Cuenta no pausada (`is_paused === false`).
     4. Ningún producto en `blocked_categories`.
     5. Gasto acumulado dentro del tope diario y semanal.
     6. Saldo contable suficiente.
     7. Asiento `DEBIT STUDENT_ALLOCATION` / `CREDIT KIOSK_BALANCE` (0% comisión).
   - `POST /api/v1/kiosk/withdrawals` (`KIOSK`): solicitud de retiro de fondos a la cuenta de Mercado Pago del kiosquero.

---

## Criterios de Aceptación y Pruebas

- `pnpm --filter api test` (Vitest) incluye tests de:
  - Idempotencia del webhook de Mercado Pago y cobro QR.
  - Concurrencia y fondos insuficientes.
  - Bloqueo de categorías y superación de límites diarios/semanales.
  - Rechazo de mutaciones en `ledger_entries`.
