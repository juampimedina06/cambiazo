# ID del Ticket: WAVE-3-BACKEND-03

- **Agente Asignado:** `AGENT_BACKEND`
- **Rutas Permitidas (Write Scope):** `apps/api/**`, `packages/shared/**`
- **Rutas Prohibidas:** `apps/web-admin/**`, `apps/mobile/**`

---

## Contrato Zod (`packages/shared`)

Consume desde `@cambiazo/shared`:
- `ExchangeModeSchema`, `ModerationStatusSchema`
- `CreateExchangeItemSchema`, `ModerateExchangeItemSchema`
- `SchoolRewardSchema`, `RedeemRewardSchema`
- `LeaderboardEntryDtoSchema`, `WeeklyParentSummaryDtoSchema`

---

## Requerimientos Funcionales y Técnicos

1. **Economía Separada de Puntos de Comunidad (No Monetaria):**
   - Crear tablas con aislamiento `institution_id`:
     - `exchange_items`: `id`, `institution_id`, `student_user_id`, `title`, `description`, `category`, `mode` (`BARTER`, `DONATION`, `LOAN`), `moderation_status` (`PENDING`, `APPROVED`, `REJECTED`, `DELIVERED`), `pickup_point_notes`, `created_at`.
     - `community_points_ledger`: registro inmutable de puntos ganados o canjeados (`id`, `institution_id`, `student_user_id`, `points_delta` entero, `reason`, `reference_id`, `created_at`).
     - `school_rewards` y `reward_redemptions`: insignias y canjes definidos por la escuela (útiles, reconocimientos, beneficios escolares) entregados en el punto de entrega escolar moderado.
     - `student_savings_goals`: metas educativas de ahorro dentro de la billetera del alumno (`id`, `institution_id`, `student_user_id`, `title`, `target_amount_cents`, `reserved_amount_cents`).
   - **Separación Estricta de Economías:** prohibir por diseño y código cualquier conversión entre `community_points_ledger` y el Libro Mayor en pesos (`ledger_entries`). Los puntos de comunidad jamás compran saldo de kiosco ni el dinero compra puntos.
2. **Flujo de Moderación Escolar y Punto de Entrega (`CommunityService`):**
   - `POST /api/v1/community/items` (`STUDENT`): publica un útil escolar para trueque, donación o préstamo; nace siempre en estado `PENDING` dentro de su `institution_id`.
   - `PATCH /api/v1/community/items/:id/moderate` (`SCHOOL_ADMIN`): aprueba o rechaza la publicación, y al confirmar la entrega física en el **Punto de Entrega Escolar Moderado** (`DELIVERED`), acredita automáticamente los Puntos de Comunidad al alumno e insignias asociadas.
   - `GET /api/v1/community/leaderboard` (`STUDENT`, `SCHOOL_ADMIN`): devuelve el ranking de solidaridad y participación de la propia escuela (`LeaderboardEntryDtoSchema`).
   - `POST /api/v1/community/rewards/redeem` (`STUDENT`): solicita canje de puntos por recompensas escolares retirables en el punto de entrega del colegio.
3. **Worker de Resumen Semanal para Padres (`WeeklySummaryWorker` con BullMQ):**
   - Cronjob semanal + endpoint `GET /api/v1/parents/children/:studentId/weekly-summary` (`PARENT`) que consolida:
     - Total gastado en el kiosco durante la semana en centavos.
     - Desglose porcentual y en pesos por categoría (`HEALTHY_SNACK`, `DRINK`, `CANDY`, `HOT_MEAL`, `STATIONERY`).
     - Cantidad de compras rechazadas por límites o categorías bloqueadas.
     - Actividad positiva del alumno en la comunidad (útiles donados/prestados/intercambiados y puntos ganados).

---

## Criterios de Aceptación y Pruebas

- `pnpm --filter api test` (Vitest) verifica:
  - Un alumno de la Escuela A no puede ver ni solicitar artículos de intercambio publicados en la Escuela B.
  - Una publicación en estado `PENDING` o `REJECTED` no es visible para otros alumnos hasta que el `SCHOOL_ADMIN` la pase a `APPROVED`.
  - Los puntos de comunidad solo se acreditan cuando el directivo/moderador confirma la recepción en el punto de entrega escolar (`DELIVERED`).
  - El cálculo de `WeeklyParentSummaryDto` coincide exactamente con la suma de asientos contables (`KIOSK_PURCHASE`) de los últimos 7 días.
