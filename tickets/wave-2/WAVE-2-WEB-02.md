# ID del Ticket: WAVE-2-WEB-02

- **Agente Asignado:** `AGENT_WEB`
- **Rutas Permitidas (Write Scope):** `apps/web-admin/**`
- **Rutas Prohibidas:** `apps/api/**`, `apps/mobile/**`, `packages/shared/**`
- **Referencias Obligatorias:** Aplicar estrictamente la Guía de Diseño UI/UX y Sistema Visual de [`AGENTS.md`](../../AGENTS.md).

---

## Contrato Zod (`packages/shared`)

Consume en modo **solo lectura** desde `@cambiazo/shared`:
- `ProductCategorySchema`
- `CatalogProductSchema`, `CreateCatalogProductSchema`
- `ChargeQrRequestSchema`, `LedgerMovementDtoSchema`, `KioskWithdrawalRequestSchema`

---

## Requerimientos Funcionales y Técnicos

1. **Panel de Catálogo del Kiosco (`/kiosk/catalog`):**
   - Tabla y grilla de productos con filtros por categoría (`HEALTHY_SNACK`, `DRINK`, `CANDY`, `HOT_MEAL`, `STATIONERY`).
   - Formulario de alta y edición con `CreateCatalogProductSchema` (conversión limpia de pesos a centavos en el cliente).
   - Indicadores visuales destacando qué categorías son bloqueables por los padres.
2. **Monitor de Ventas y Caja Web del Kiosco (`/kiosk/sales`):**
   - Monitor de ventas en tiempo real mostrando hora, producto, monto y total recaudado con 0% de comisión.
   - Terminal de cobro web auxiliar por código de 6 dígitos con generación automática de `idempotencyKey` (`crypto.randomUUID()`).
3. **Módulo de Retiros a Mercado Pago (`/kiosk/withdrawals`):**
   - Tarjeta destacada de saldo disponible para retirar (calculada desde el libro mayor).
   - Formulario de retiro a CVU/Alias de Mercado Pago con `KioskWithdrawalRequestSchema` e historial de retiros.

---

## Criterios de Aceptación y Pruebas

- `pnpm --filter web-admin typecheck` y `pnpm --filter web-admin build` finalizan sin errores.
- Respeta la paleta 60-30-10 (`#F8F7FF`, `#6C3CE9`, `#10B981`) y la regla anti-anidación de tarjetas.
- Toda operación de cobro o retiro genera un `idempotencyKey` único para evitar dobles envíos.
