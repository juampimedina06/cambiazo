# ID del Ticket: WAVE-0-BACKEND-00

- **Agente Asignado:** `AGENT_BACKEND`
- **Rutas Permitidas (Write Scope):**
  - `package.json`
  - `pnpm-workspace.yaml`
  - `turbo.json`
  - `tsconfig.base.json`
  - `.gitignore`
  - `packages/shared/**`
  - `apps/api/**` (scaffold inicial)
  - `apps/web-admin/package.json`, `apps/web-admin/tsconfig.json` (solo manifiesto base para enlazar el workspace)
  - `apps/mobile/package.json`, `apps/mobile/tsconfig.json` (solo manifiesto base para enlazar el workspace)
- **Rutas Prohibidas:**
  - Código de negocio o componentes en `apps/web-admin/src/**` y `apps/mobile/src/**`.
- **Referencias Obligatorias:**
  - Leer y aplicar [`AGENTS.md`](../AGENTS.md) para tokens de diseño y contratos base.

---

## Contrato Zod (`packages/shared`)

Definir y exportar desde `packages/shared/src/index.ts` todos los contratos base que consumirán los 3 agentes en las Olas 1, 2 y 3:

1. **`packages/shared/src/enums.ts`:**
   - `UserRoleSchema`: `z.enum(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'KIOSK', 'PARENT', 'STUDENT'])`
   - `BillingPlanTypeSchema`: `z.enum(['FIXED_MONTHLY', 'PER_ACTIVE_STUDENT'])`
   - `InstitutionStatusSchema`: `z.enum(['ACTIVE', 'SUSPENDED'])`
   - `ConsentStatusSchema`: `z.enum(['PENDING', 'GRANTED', 'REVOKED'])`
   - `AccountTypeSchema`: `z.enum(['PARENT_WALLET', 'STUDENT_ALLOCATION', 'KIOSK_BALANCE', 'PLATFORM_CLEARING'])`
   - `LedgerEntryDirectionSchema`: `z.enum(['DEBIT', 'CREDIT'])`
   - `ProductCategorySchema`: `z.enum(['HEALTHY_SNACK', 'DRINK', 'CANDY', 'HOT_MEAL', 'STATIONERY'])`
   - `ExchangeModeSchema`: `z.enum(['BARTER', 'DONATION', 'LOAN'])`
   - `ModerationStatusSchema`: `z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DELIVERED'])`

2. **`packages/shared/src/schemas/institution.schema.ts`:**
   - `CreateInstitutionSchema`: nombre, CUIT, dirección, `billingPlanType`, `monthlyFeeCents` (entero positivo), email inicial de `SCHOOL_ADMIN` y `KIOSK`.
   - `InstitutionDtoSchema`: representación completa con `id` (UUID), `status`, `activeStudentsCount` y `createdAt`.
   - `CreateInvitationSchema` y `ValidateInviteCodeSchema`: código alfanumérico vinculado a `institutionId`.

3. **`packages/shared/src/schemas/consent.schema.ts`:**
   - `RegisterParentAndStudentSchema`: datos del padre/tutor, código de invitación escolar y datos del alumno menor.
   - `GrantParentalConsentSchema`: `studentId`, `acceptedTermsVersion`, `acceptedAt` (ISO datetime), `signatureIp`.
   - `RevokeParentalConsentSchema`: `studentId`, `reason`.
   - `SpendingLimitsSchema`: `studentId`, `dailyLimitCents` (`int().nonnegative()`), `weeklyLimitCents` (`int().nonnegative()`), `blockedCategories` (`z.array(ProductCategorySchema)`), `isPaused` (`z.boolean()`).

4. **`packages/shared/src/schemas/ledger.schema.ts`:**
   - `TopUpPreferenceRequestSchema`: `studentId`, `amountCents` (entero mayor a 0, moneda ARS 1 a 1).
   - `MercadoPagoWebhookPayloadSchema`: `id`, `type`, `data.id`, `externalReference`.
   - `CatalogProductSchema` y `CreateCatalogProductSchema`: `institutionId`, `name`, `category` (`ProductCategorySchema`), `priceCents`, `stock`, `isActive`.
   - `QrPaymentTokenSchema`: `token` efímero, `studentId`, `institutionId`, `expiresAt`.
   - `ChargeQrRequestSchema`: `paymentTokenOrCode`, `items` (`array` de `{ productId, quantity }`), `idempotencyKey`.
   - `KioskWithdrawalRequestSchema`: `amountCents`, `mercadoPagoAliasOrCvu`, `idempotencyKey`.

5. **`packages/shared/src/schemas/community.schema.ts`:**
   - `CreateExchangeItemSchema`: `title`, `description`, `category`, `mode` (`ExchangeModeSchema`), `photoUrls`.
   - `ModerateExchangeItemSchema`: `itemId`, `status` (`APPROVED | REJECTED | DELIVERED`), `moderatorNotes`, `awardedPoints`.
   - `SchoolRewardSchema` y `RedeemRewardSchema`: catálogo de insignias/canjes escolares en el punto de entrega moderado.
   - `LeaderboardEntryDtoSchema`: posición, alias/nombre del alumno, puntos acumulados e insignias.
   - `WeeklyParentSummaryDtoSchema`: total gastado en la semana en centavos, desglose por categoría, lista de compras y puntos de comunidad.

---

## Requerimientos Funcionales y Técnicos

1. **Configuración de Monorepo (`pnpm` + `Turborepo`):**
   - Configurar `pnpm-workspace.yaml` apuntando a `packages/*` y `apps/*`.
   - Configurar `turbo.json` con las tareas `build`, `dev`, `lint`, `typecheck` y `test`, asegurando que `^build` compile `packages/shared` antes que cualquier app.
   - Configurar `tsconfig.base.json` con `strict: true`, `noUncheckedIndexedAccess: true` y alias `@cambiazo/shared`.
2. **Paquete `@cambiazo/shared`:**
   - Implementar todos los esquemas Zod anteriores y exportar tanto los esquemas como sus tipos inferidos.
   - Todos los importes en pesos se expresan en centavos enteros (`Cents`).
3. **Esqueletos Iniciales de Aplicaciones:**
   - Inicializar el proyecto base de `apps/api` (NestJS + TypeScript + Vitest).
   - Dejar creados `apps/web-admin/package.json` y `apps/mobile/package.json` con la dependencia `"@cambiazo/shared": "workspace:*"`.

---

## Criterios de Aceptación y Pruebas

- Ejecutar `pnpm install` en la raíz sin errores de resolución de workspaces.
- Ejecutar `pnpm --filter @cambiazo/shared build` y verificar que genera `dist/` con declaraciones `.d.ts`.
- Ejecutar `pnpm --filter @cambiazo/shared test` (Vitest) con validación de casos válidos e inválidos.
