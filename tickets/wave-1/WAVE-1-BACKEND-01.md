# ID del Ticket: WAVE-1-BACKEND-01

- **Agente Asignado:** `AGENT_BACKEND`
- **Rutas Permitidas (Write Scope):** `apps/api/**`, `packages/shared/**`
- **Rutas Prohibidas:** `apps/web-admin/**`, `apps/mobile/**`
- **Referencias Obligatorias:** Leer [`AGENTS.md`](../../AGENTS.md).

---

## Contrato Zod (`packages/shared`)

Consume desde `@cambiazo/shared`:
- `UserRoleSchema`, `BillingPlanTypeSchema`, `InstitutionStatusSchema`, `ConsentStatusSchema`
- `CreateInstitutionSchema`, `InstitutionDtoSchema`
- `CreateInvitationSchema`, `ValidateInviteCodeSchema`
- `RegisterParentAndStudentSchema`, `GrantParentalConsentSchema`, `RevokeParentalConsentSchema`

---

## Requerimientos Funcionales y Técnicos

1. **Esquema de Base de Datos Multi-Tenant (PostgreSQL + Prisma/Drizzle):**
   - Crear tablas con `institution_id` obligatorio para todas las entidades de negocio:
     - `institutions`: `id`, `name`, `tax_id`, `billing_plan_type`, `monthly_fee_cents`, `status`, `created_at`.
     - `users`: `id`, `institution_id` (nullable solo para `SUPER_ADMIN`), `role`, `email`, `password_hash`, `full_name`, `is_active`.
     - `institution_invitations`: `id`, `institution_id`, `code` (único), `expires_at`, `max_uses`, `used_count`, `created_by_user_id`.
     - `parent_student_links`: `id`, `institution_id`, `parent_user_id`, `student_user_id`, `created_at`.
     - `parental_consents`: registro inmutable y auditable para cumplimiento de la **Ley 25.326** (`id`, `institution_id`, `parent_user_id`, `student_user_id`, `action` `GRANTED | REVOKED`, `terms_version`, `ip_address`, `user_agent`, `created_at`).
2. **Aislamiento Multi-Tenant Estricto (`TenantGuard` + Interceptor):**
   - Inyectar obligatoriamente `institution_id` del JWT en el contexto de base de datos.
   - Un usuario de la Escuela A jamás puede acceder ni alterar datos de la Escuela B.
3. **Endpoints de Instituciones, Onboarding y Consentimiento:**
   - `POST /api/v1/institutions` (`SUPER_ADMIN`): crea la escuela, define el modelo de abono (`FIXED_MONTHLY` o `PER_ACTIVE_STUDENT`) y aprovisiona usuarios para `SCHOOL_ADMIN` y `KIOSK`.
   - `GET /api/v1/institutions` (`SUPER_ADMIN`): lista escuelas con total de alumnos activos.
   - `POST /api/v1/invitations` (`SCHOOL_ADMIN`): genera códigos de invitación escolar para familias.
   - `GET /api/v1/invitations/validate/:code` (Público): valida el código y retorna los datos de la institución.
   - `POST /api/v1/onboarding/register-family` (Público): registra al padre y alumno dentro de la institución en estado `PENDING`.
   - `POST /api/v1/consents/grant` y `POST /api/v1/consents/revoke` (`PARENT`): otorga o revoca el consentimiento parental explícito. Si se revoca, bloquea al instante toda operación del menor.

---

## Criterios de Aceptación y Pruebas

- `pnpm --filter api test` (Vitest) pasa exitosamente.
- Test de Aislamiento Multi-Tenant: consultas entre diferentes `institution_id` arrojan `403` o `404`.
- Test Ley 25.326: un alumno sin consentimiento activo no puede operar y cada cambio genera una fila inmutable en `parental_consents`.
