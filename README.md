# CAMBIAZO — Billetera Escolar Multi-Tenant & Comunidad de Intercambio

**CAMBIAZO** es una plataforma escolar multi-tenant que integra una billetera prepaga 1 a 1 en pesos argentinos reales (`$ ARS`) para consumos en el kiosco escolar y un sistema de intercambio comunitario no monetario entre alumnos (trueque, donación y préstamo de útiles escolares).

---

## Arquitectura y Estructura del Monorepo

Construido con **Turborepo + pnpm workspaces** bajo un diseño **Contract-First**:

```text
cambiazo/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── ARCHITECTURE.md               # Especificación de Arquitectura Hexagonal, Dominio y FSD
├── AGENTS.md                     # Reglas de Agentes, Alcances de Escritura y Guía UI/UX
├── tickets/                      # Backlog de Ejecución por Olas (Olas 0, 1, 2, 3)
├── packages/
│   └── shared/                   # @cambiazo/shared — Contratos Zod, DTOs, Enums y Constantes
└── apps/
    ├── api/                      # NestJS Monolito Modular + Arquitectura Hexagonal + Vitest
    ├── web-admin/                # Next.js 15 App Router + Tailwind CSS (FSD)
    └── mobile/                   # React Native + Expo Router (FSD)
```

---

## Invariantes Clave del Negocio

1. **Multi-Tenancy Estricto (`institution_id` + RLS):**
   - El **Super Administrador** da de alta instituciones y configura planes de facturación mensual (`FIXED_MONTHLY` o `PER_ACTIVE_STUDENT`).
   - Cada escuela aísla sus usuarios (**Administrador Escolar**, **Kiosco**, **Padres** y **Alumnos**) mediante `TenantGuard` y Seguridad a Nivel de Fila (`institution_id`).
2. **Dos Economías Estrictamente Separadas:**
   - **Billetera del Kiosco (`$ ARS` 1 a 1):** Recargada por los padres mediante Mercado Pago. Se consume exclusivamente en el kiosco de la escuela mediante códigos QR efímeros de 120 segundos o tokens numéricos de 6 dígitos. Están terminantemente prohibidas las transferencias P2P entre alumnos y el retiro de efectivo por parte de menores.
   - **Puntos de Comunidad (No Monetarios):** Se obtienen y canjean mediante intercambio, donación o préstamo de útiles en el **Punto de Entrega Escolar** moderado. Cero conversión entre pesos y puntos de comunidad.
3. **Libro Mayor Inmutable por Partida Doble (Ledger):**
   - Todos los movimientos financieros se registran en un ledger append-only (`accounts`, `ledger_transactions`, `ledger_entries`) en centavos enteros (`BIGINT > 0`), asegurando `SUM(DÉBITO) === SUM(CRÉDITO)` y bloqueando operaciones de `UPDATE` o `DELETE`.
   - **0% Comisión al Kiosco:** Los kiosqueros liquidan el 100% de sus ventas hacia su cuenta de Mercado Pago.
4. **Consentimiento Parental y Controles (Ley 25.326):**
   - Ningún menor puede operar sin el consentimiento parental explícito, fechado y revocable (`parental_consents` registro inmutable de auditoría).
   - Los padres configuran topes de gasto diarios/semanales, bloquean categorías de productos (ej. `Golosinas`), aplican pausas instantáneas con 1 toque y reciben alertas de consumo en tiempo real más un resumen semanal nutricional y comunitario.

---

## Sistema de Diseño (UI/UX Juvenil 60-30-10)

- **60% Superficies Limpias:** `#F8F7FF` (Base Lavanda Ultra Suave) y `#FFFFFF` (Superficie Blanca Pura)
- **30% Morado de Marca:** `#6C3CE9` (Principal), `#4C1D95` (Morado Oscuro), `#EDE9FE` (Lavanda Pastel)
- **10% Acentos Semánticos:**
  - `#FACC15` (Amarillo Lápiz — Puntos de Comunidad, Insignias y Ranking)
  - `#10B981` (Verde Menta — Pesos Reales `$`, Confirmación de Pago QR y Metas de Ahorro)
- **Reglas de Oro Visuales:** Prohibido anidar tarjetas (*No Card-inside-Card*), máximo 3 datos por fila para escaneo rápido de 2 segundos en el recreo, y botones táctiles con altura mínima `>= 52px`.

---

## Inicio Rápido

### 1. Instalación de Dependencias

```bash
pnpm install
```

### 2. Variables de Entorno e Infraestructura

Copiar `.env.example` a `.env` en cada espacio de trabajo al conectar servicios en vivo:

- `apps/api/.env.example`
- `apps/web-admin/.env.example`
- `apps/mobile/.env.example`

Por defecto, Web Admin y Mobile incluyen adaptadores tipados con datos mock (`NEXT_PUBLIC_USE_MOCKS=true` / `EXPO_PUBLIC_USE_MOCKS=true`) basados en los contratos de `@cambiazo/shared`, con fallback automático si el backend no está disponible.

#### Servicios Locales (Docker Compose)
Para levantar PostgreSQL y Redis locales para `apps/api`:

```bash
# Desde la carpeta apps/api
cd apps/api
docker compose up -d
```

Servicios expuestos:
- **PostgreSQL 16**: `localhost:5432` (base de datos: `cambiazo_dev`, usuario/contraseña: `postgres`/`postgres`)
- **Redis 7**: `localhost:6379`

### 3. Ejecución de Aplicaciones en Desarrollo

```bash
# Backend NestJS API (corre en http://localhost:3000)
pnpm --filter @cambiazo/api dev

# Web Admin Next.js (corre en http://localhost:3001)
pnpm --filter @cambiazo/web-admin dev

# Mobile Expo App (Metro Bundler)
pnpm --filter @cambiazo/mobile start -c
```

> **Nota sobre Mobile (Expo Router + Metro):**
> Metro está configurado mediante `apps/mobile/metro.config.js` para observar la raíz del monorepo y resolver `@cambiazo/shared` directamente desde el código fuente TypeScript sin extensiones forzadas `.js`. Al probar con Expo Go en un dispositivo móvil, asegúrate de tener la app actualizada a la versión correspondiente a Expo SDK 58.

### 4. Compilación, Chequeo de Tipos y Tests

```bash
# Compilar todos los paquetes y aplicaciones
pnpm turbo build

# Ejecutar chequeo de tipos TypeScript en todo el monorepo
pnpm turbo typecheck

# Ejecutar la suite completa de Vitest (305 pruebas en shared, api, web-admin y mobile)
pnpm turbo test
```

---

## Resumen de Verificación

| Paquete / Aplicación | Arquitectura | Suite Vitest | Chequeo de Tipos |
| :--- | :--- | :--- | :--- |
| `@cambiazo/shared` | Esquemas Zod, DTOs y Enums de Dominio | 70 / 70 aprobados | 0 errores |
| `@cambiazo/api` | NestJS Monolito Modular + Hexagonal | 99 / 99 aprobados | 0 errores |
| `@cambiazo/web-admin` | Next.js App Router + Tailwind (FSD) | 55 / 55 aprobados | 0 errores |
| `@cambiazo/mobile` | React Native + Expo Router (FSD) | 81 / 81 aprobados | 0 errores |
| **Total del Monorepo** | **Turborepo + pnpm** | **305 / 305 aprobados** | **0 errores** |
