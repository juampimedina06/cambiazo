# CAMBIAZO — Execution Backlog & Wave Index

This folder contains the executable backlog for **CAMBIAZO** (Multi-tenant school platform with prepaid kiosk wallet and community item exchange).

All tickets adhere to:
1. **Contract-First (`packages/shared`)** architecture with Zod.
2. **Strict File Ownership (`Write Scope`)** to prevent Git collisions across the 3 parallel agents.
3. **Mandatory UI/UX & Visual System Guidelines** defined in [`AGENTS.md`](../AGENTS.md).

## File Ownership Rules

| Agent | Exclusive Write Scope | Read-Only Scope | Forbidden Scope |
| :--- | :--- | :--- | :--- |
| `AGENT_BACKEND` | `apps/api/**`, `packages/shared/**` | Root config | `apps/web-admin/**`, `apps/mobile/**` |
| `AGENT_WEB` | `apps/web-admin/**` | `packages/shared/**` | `apps/api/**`, `apps/mobile/**`, `packages/shared/**` (write) |
| `AGENT_MOBILE` | `apps/mobile/**` | `packages/shared/**` | `apps/api/**`, `apps/web-admin/**`, `packages/shared/**` (write) |

## Execution Order

### Phase 0 — Monorepo Foundation & Shared Contracts (Run First)
- [WAVE-0-BACKEND-00](./WAVE-0-BACKEND-00.md) — Monorepo Setup (`pnpm` + Turborepo) & Initial Zod Contracts in `packages/shared`

### Wave 1 — Multi-Tenant Institutions, Onboarding & Parental Consent (Run in Parallel)
- [WAVE-1-BACKEND-01](./wave-1/WAVE-1-BACKEND-01.md) — Multi-Tenant DB, Auth Roles, Invitations & Parental Consent Audit (`Ley 25.326`)
- [WAVE-1-WEB-01](./wave-1/WAVE-1-WEB-01.md) — Super Admin Console (Institutions & Billing) & School Admin Invitation Panel
- [WAVE-1-MOBILE-01](./wave-1/WAVE-1-MOBILE-01.md) — School Code Onboarding, Parent Registration & Digital Parental Consent Signature

### Wave 2 — Double-Entry Ledger, Parental Controls & Kiosk QR Checkout (Run in Parallel)
- [WAVE-2-BACKEND-02](./wave-2/WAVE-2-BACKEND-02.md) — Immutable Double-Entry Ledger, Mercado Pago Webhooks, Spending Limits & Kiosk QR Orders
- [WAVE-2-WEB-02](./wave-2/WAVE-2-WEB-02.md) — Kiosk Catalog Management, Recess Sales Monitor & Mercado Pago Payout Requests
- [WAVE-2-MOBILE-02](./wave-2/WAVE-2-MOBILE-02.md) — Parent Top-Up & Controls, Student QR Wallet & Sub-5s Kiosk POS Scanner

### Wave 3 — Financial Summaries, Community Exchange, Points & Ranking (Run in Parallel)
- [WAVE-3-BACKEND-03](./wave-3/WAVE-3-BACKEND-03.md) — Weekly Parent Summaries, Community Exchange Ledger, Moderation & School Leaderboard
- [WAVE-3-WEB-03](./wave-3/WAVE-3-WEB-03.md) — School Admin Moderation Queue, Pickup Point Desk, Ranking Rewards & Global Metrics
- [WAVE-3-MOBILE-03](./wave-3/WAVE-3-MOBILE-03.md) — Parent Weekly Summary View, Student Savings Goals & Community Barter/Donation/Loan Module
