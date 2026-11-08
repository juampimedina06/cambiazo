# ID del Ticket: WAVE-3-WEB-03

- **Agente Asignado:** `AGENT_WEB`
- **Rutas Permitidas (Write Scope):** `apps/web-admin/**`
- **Rutas Prohibidas:** `apps/api/**`, `apps/mobile/**`, `packages/shared/**`

---

## Contrato Zod (`packages/shared`)

Consume en modo **solo lectura** desde `@cambiazo/shared`:
- `ExchangeModeSchema`, `ModerationStatusSchema`
- `ModerateExchangeItemSchema`, `SchoolRewardSchema`
- `LeaderboardEntryDtoSchema`, `InstitutionDtoSchema`

---

## Requerimientos Funcionales y Técnicos

1. **Panel Escuela — Moderación y Punto de Entrega Escolar (`apps/web-admin/src/app/school/moderation/page.tsx`):**
   - Bandeja de publicaciones de útiles escolares creadas por los alumnos del colegio filtradas por estado (`PENDING`, `APPROVED`, `REJECTED`, `DELIVERED`) y modalidad (`BARTER`, `DONATION`, `LOAN`).
   - Acciones rápidas validadas con `ModerateExchangeItemSchema`:
     - **Aprobar publicación:** habilita que otros alumnos de la misma escuela la vean.
     - **Rechazar con motivo educativo:** envía feedback al alumno.
     - **Confirmar Entrega en Punto Escolar (`DELIVERED`):** registra que el útil fue entregado físicamente en la preceptoría/punto moderado de la escuela y dispara la acreditación de Puntos de Comunidad.
2. **Panel Escuela — Configuración de Recompensas, Insignias y Ranking (`apps/web-admin/src/app/school/rewards/page.tsx`):**
   - ABM de recompensas no monetarias e insignias escolares (`SchoolRewardSchema`) y puntos otorgados por cada acción solidaria (donar, prestar o intercambiar útiles).
   - Vista del Ranking Escolar (`LeaderboardEntryDtoSchema`) y gestión de entregas de canjes solicitados por los alumnos en el punto de entrega.
   - Dashboard de reportes agregados de uso del colegio (`apps/web-admin/src/app/school/reports/page.tsx`): proporción de consumo saludable vs. golosinas en el kiosco y volumen de útiles reutilizados por la comunidad.
3. **Consola Super Admin — Métricas Globales y Liquidación de Abonos (`apps/web-admin/src/app/super-admin/metrics/page.tsx`):**
   - Tablero global cross-tenant con volumen transaccionado en kioscos, total de alumnos activos por colegio y cálculo automático del abono mensual a facturar a cada institución según su plan (`FIXED_MONTHLY` vs `PER_ACTIVE_STUDENT`).

---

## Criterios de Aceptación y Pruebas

- `pnpm --filter web-admin typecheck` y `pnpm --filter web-admin build` finalizan con código `0`.
- Ningún archivo fuera de `apps/web-admin/**` fue modificado.
- El flujo de moderación en el panel escolar permite pasar un artículo de `PENDING` -> `APPROVED` -> `DELIVERED` validando el payload con `ModerateExchangeItemSchema`.
