# ID del Ticket: WAVE-3-MOBILE-03

- **Agente Asignado:** `AGENT_MOBILE`
- **Rutas Permitidas (Write Scope):** `apps/mobile/**`
- **Rutas Prohibidas:** `apps/api/**`, `apps/web-admin/**`, `packages/shared/**`

---

## Contrato Zod (`packages/shared`)

Consume en modo **solo lectura** desde `@cambiazo/shared`:
- `ExchangeModeSchema`, `ModerationStatusSchema`
- `CreateExchangeItemSchema`, `SchoolRewardSchema`, `RedeemRewardSchema`
- `LeaderboardEntryDtoSchema`, `WeeklyParentSummaryDtoSchema`

---

## Requerimientos Funcionales y Técnicos

1. **Vista Padre/Tutor — Resumen Semanal y Hábitos (`app/(parent)/reports/weekly-summary.tsx`):**
   - Pantalla visual consumiendo `WeeklyParentSummaryDtoSchema`:
     - Gráfico de barras/torta con el desglose de compras de la semana por categoría (`HEALTHY_SNACK`, `HOT_MEAL`, `DRINK`, `CANDY`, `STATIONERY`).
     - Listado detallado de cada compra en el kiosco y alertas si hubo intentos de compra frenados por límites parentales.
     - Tarjeta de impacto comunitario del hijo (útiles donados/intercambiados, puntos ganados e insignias obtenidas en la escuela).
2. **Vista Alumno — Metas de Ahorro Educativas (`app/(student)/wallet/savings-goals.tsx`):**
   - Permite al alumno separar parte de su saldo prepago en "alcancías/metas educativas" (ej. ahorrar para un libro o almuerzo especial en el kiosco) visualizando el progreso sin alterar la regla de que el saldo solo se gasta dentro del kiosco escolar.
3. **Vista Alumno — Comunidad de Intercambio, Puntos y Ranking (`app/(student)/community/`):**
   - **Explorar Útiles de Mi Escuela (`index.tsx`):** feed de útiles escolares aprobados exclusivamente de su propia institución, con filtros por `BARTER` (trueque), `DONATION` (donación) y `LOAN` (préstamo).
   - **Publicar Útil (`create.tsx`):** formulario validado con `CreateExchangeItemSchema` con selección de fotos, modo de intercambio e aviso de que la entrega se realiza siempre en el **Punto de Entrega Escolar Moderado** del colegio.
   - **Mis Puntos, Insignias y Ranking (`leaderboard.tsx` y `rewards.tsx`):**
     - Muestra el saldo de **Puntos de Comunidad** (dejando explícito que son puntos solidarios no monetarios ni canjeables por dinero), medallas desbloqueadas, posición en el ranking de su escuela (`LeaderboardEntryDtoSchema`) y catálogo de canjes escolares (`RedeemRewardSchema`).

---

## Criterios de Aceptación y Pruebas

- `pnpm --filter mobile typecheck` finaliza con código `0`.
- Ningún archivo fuera de `apps/mobile/**` fue modificado.
- El formulario de publicación de útiles valida con `CreateExchangeItemSchema` e informa que la publicación quedará visible tras la aprobación del directivo/moderador escolar.
- En toda la UI queda explícitamente diferenciada la **Billetera en Pesos ($ ARS)** para el kiosco de los **Puntos de Comunidad** para el intercambio escolar.
