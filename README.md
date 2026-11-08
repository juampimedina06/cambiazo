# CAMBIAZO — Multi-Tenant School Kiosk Wallet & Community Exchange

**CAMBIAZO** is a multi-tenant school platform with a 1-to-1 prepaid kiosk wallet in real Argentine Pesos (`$ ARS`) and a non-monetary student community item exchange (barter, donation, and loan).

---

## Architecture & Monorepo Structure

Built with **Turborepo + pnpm workspaces** following a **Contract-First** design:

```text
cambiazo/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── ARCHITECTURE.md               # Domain, Hexagonal & FSD Architecture Blueprint
├── AGENTS.md                     # Multi-Agent Write Scopes & Youth UI/UX Design Guide
├── tickets/                      # Parallel Wave Execution Backlog (Waves 0, 1, 2, 3)
├── packages/
│   └── shared/                   # @cambiazo/shared — Zod Contracts, DTOs, Enums & Constants
└── apps/
    ├── api/                      # NestJS Modular Monolith + Hexagonal Architecture + Vitest
    ├── web-admin/                # Next.js 15 App Router + Tailwind CSS (FSD)
    └── mobile/                   # React Native + Expo Router (FSD)
```

---

## Core Business Invariants

1. **Strict Multi-Tenancy (`institution_id` + RLS):**
   - **Super Admin** provisions schools and configures monthly billing plans (`FIXED_MONTHLY` or `PER_ACTIVE_STUDENT`).
   - Every school isolates its **School Admin**, **Kiosk**, **Parents**, and **Students** via `TenantGuard` and Row-Level Security (`institution_id`).
2. **Two Strictly Separated Economies:**
   - **Kiosk Wallet (`$ ARS` 1-to-1):** Funded by parents via Mercado Pago. Spent exclusively at the student's school kiosk via ephemeral 120-second QR codes or 6-digit tokens. Student-to-student P2P transfers and cash withdrawals by students are strictly prohibited.
   - **Community Points (Non-Monetary):** Earned and redeemed through school supply barter, donation, or loan at the moderated **School Pickup Point**. Zero conversion between pesos and community points.
3. **Immutable Double-Entry Ledger:**
   - All financial movements are recorded in an append-only double-entry ledger (`accounts`, `ledger_transactions`, `ledger_entries`) in integer cents (`BIGINT > 0`), enforcing `SUM(DEBIT) === SUM(CREDIT)` and forbidding `UPDATE`/`DELETE`.
   - **0% Kiosk Commission:** Kiosk operators liquidate 100% of their sales balance to Mercado Pago.
4. **Parental Consent & Controls (Law 25.326):**
   - No minor can operate without explicit, timestamped, and revocable parental consent (`parental_consents` immutable audit log).
   - Parents configure daily/weekly spending limits, block product categories (e.g., `CANDY`), trigger instant 1-tap account pauses, and receive real-time purchase alerts plus a weekly nutritional & community digest.

---

## Design System (60-30-10 Youth UI/UX)

- **60% Clean Surfaces:** `#F8F7FF` (Soft Lavender Base) & `#FFFFFF` (Pure White Surface)
- **30% Brand Purple:** `#6C3CE9` (Primary), `#4C1D95` (Primary Dark), `#EDE9FE` (Primary Soft)
- **10% Semantic Accents:**
  - `#FACC15` (Pencil Yellow — Community Points, Badges & Ranking)
  - `#10B981` (Mint Green — Real Pesos `$`, QR Payment Success & Savings Goals)
- **Golden Visual Rules:** Zero card nesting (*No Card-inside-Card*), maximum 3 data points per row for 2-second recess scanning, and `>= 52px` ergonomic touch targets.

---

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` in each application when connecting live services (PostgreSQL/Supabase, Redis, Mercado Pago):

- `apps/api/.env.example`
- `apps/web-admin/.env.example`
- `apps/mobile/.env.example`

By default, Web Admin and Mobile include typed mock adapters (`NEXT_PUBLIC_USE_MOCKS=true` / `EXPO_PUBLIC_USE_MOCKS=true`) backed by `@cambiazo/shared` contracts.

### 3. Build, Typecheck & Run Tests

```bash
# Build all packages and apps
pnpm turbo build

# Run TypeScript typechecking across the entire monorepo
pnpm turbo typecheck

# Run the full Vitest suite (305 tests across shared, api, web-admin, and mobile)
pnpm turbo test
```

---

## Verification Summary

| Workspace Package | Architecture | Vitest Suite | Typecheck |
| :--- | :--- | :--- | :--- |
| `@cambiazo/shared` | Zod Schemas, DTOs & Domain Enums | 70 / 70 passing | 0 errors |
| `@cambiazo/api` | NestJS Modular Monolith + Hexagonal | 99 / 99 passing | 0 errors |
| `@cambiazo/web-admin` | Next.js App Router + Tailwind (FSD) | 55 / 55 passing | 0 errors |
| `@cambiazo/mobile` | React Native + Expo Router (FSD) | 81 / 81 passing | 0 errors |
| **Total Monorepo** | **Turborepo + pnpm** | **305 / 305 passing** | **0 errors** |
