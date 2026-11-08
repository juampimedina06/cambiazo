# AGENTS.md — GUÍA DE REGLAS, ARQUITECTURA Y DISEÑO UI/UX (CAMBIAZO)

Este archivo es la fuente única de verdad para todos los Agentes Autónomos (`AGENT_BACKEND`, `AGENT_WEB`, `AGENT_MOBILE`) que colaboren en el monorepo de **CAMBIAZO**. Todo agente debe leer y respetar estas directivas antes de generar código.

---

## 1. REGLAS DE AISLAMIENTO FÍSICO Y ESCRITURA (MONOREPO)

El proyecto vive en un único monorepo gestionado con **Turborepo + pnpm workspaces**:

```text
cambiazo/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── packages/
│   └── shared/          # Contratos Zod, DTOs, Enums y Tipos compartidos
├── apps/
│   ├── api/             # Backend NestJS + PostgreSQL + Redis/BullMQ + Vitest
│   ├── web-admin/       # Next.js App Router + Tailwind (Super Admin, Escuela, Kiosco)
│   └── mobile/          # React Native + Expo Router (Padres, Alumnos, POS Kiosco)
```

### Tabla Estricta de Permisos de Escritura (Write Scope)

| Agente | Scope de Escritura Exclusivo | Scope Solo Lectura | Scope Prohibido |
| :--- | :--- | :--- | :--- |
| `AGENT_BACKEND` | `apps/api/**`, `packages/shared/**` | Configuración raíz | `apps/web-admin/**`, `apps/mobile/**` |
| `AGENT_WEB` | `apps/web-admin/**` | `packages/shared/**` | `apps/api/**`, `apps/mobile/**`, `packages/shared/**` |
| `AGENT_MOBILE` | `apps/mobile/**` | `packages/shared/**` | `apps/api/**`, `apps/web-admin/**`, `packages/shared/**` |

- **Contract-First:** Antes de implementar pantallas o rutas, los esquemas se definen en `packages/shared` con Zod. Web y Mobile consumen tipos y mocks basados en estos esquemas sin esperar al backend.
- **Sin atribución AI:** No incluir "Co-Authored-By" ni firmas automáticas en commits.

---

## 2. GUÍA OBLIGATORIA DE DISEÑO UI/UX Y SISTEMA VISUAL (LEAD PRODUCT DESIGNER)

Todo componente o pantalla construida en `apps/mobile` (React Native + Expo) y `apps/web-admin` (Next.js + Tailwind) debe seguir estrictamente estas directivas diseñadas para niños y adolescentes (9 a 17 años) y personal escolar.

### A. Identidad de Marca y Paleta de Colores
- **Isologo:** Un lápiz flexible curvado formando la letra **"C"** en color **Amarillo Vibrante**, con punta de grafito y goma en tonos morados. Expresa escuela, creatividad, dinamismo y cercanía sin ser infantil.
- **Regla de Proporción 60-30-10:**
  - **60% Blanco y Fondos Limpios:**
    - Base de pantalla: `#F8F7FF` (Blanco lavanda ultra suave para que las superficies resalten sin recurrir a bordes duros).
    - Superficies de tarjetas/paneles: `#FFFFFF` (Blanco puro).
  - **30% Morado Principal (Brand Primary):**
    - `Primary`: `#6C3CE9` (Morado eléctrico moderno, juvenil y accesible).
    - `Primary Dark`: `#4C1D95` (Para textos destacados, títulos o cabeceras).
    - `Primary Soft`: `#EDE9FE` (Lavanda pastel para píldoras, tags activos o estados sutiles).
  - **10% Acentos (Amarillo Logo + Menta Complementario):**
    - `Accent Yellow (Logo & Puntos)`: `#FACC15` / `#F59E0B` (Amarillo lápiz: reservado para el logo, los **Puntos de Comunidad**, medallas del ranking y gamificación).
    - `Accent Mint (Complementario)`: `#10B981` / `#14B8A6` (Verde menta fresco: confirmaciones de pago QR, metas de ahorro cumplidas y saldo positivo en pesos).
- **Textos y Neutros:**
  - Texto Principal: `#1E1B4B` (Azul-morado muy oscuro, cálido y de máximo contraste).
  - Texto Secundario: `#64748B` (Gris pizarra para subtítulos o metadata corta).
- **Estados Semánticos:**
  - Alerta / Límite cercano: `#F97316` (Naranja cálido).
  - Error / Categoría bloqueada / Pausa: `#EF4444` (Rojo coral suave).

### B. Reglas de Oro de Arquitectura Visual (Anti-Saturación)
1. **PROHIBIDO ANIDAR TARJETAS (No Card-inside-Card):**
   - Nunca colocar una tarjeta con borde o sombra adentro de otra tarjeta.
   - En secciones y listas, usar listas planas con espaciado amplio (`gap-4` o `gap-3`) y divisores tenues (`#F1F5F9`) directamente sobre el fondo base.
2. **Cero Información de Más (Regla de Máximo 3 Datos por Vista):**
   - El alumno escanea la pantalla en 2 segundos en el recreo.
   - Cada elemento de lista muestra máximo 3 datos:
     1. Ícono o imagen nítida.
     2. Nombre corto (ej. "Alfajor + Jugo" o "Regla Geométrica").
     3. Valor destacado a la derecha (`$1.500` o `+50 Pts`).
   - Prohibido mostrar UUIDs, timestamps con segundos o tablas financieras complejas en el perfil del alumno.
3. **Separación Visual de las Dos Economías:**
   - **Billetera del Kiosco (Pesos Reales 1 a 1):** Asociada a **Morado (`#6C3CE9`)** y **Verde Menta (`#10B981`)** con símbolo `$` gigante. Nunca llamar "tokens" ni "coins".
   - **Comunidad e Intercambio (Puntos Solidarios):** Asociada al **Amarillo Lápiz (`#FACC15`)** con ícono de estrella/lápiz. Siempre visible como puntos comunitarios no canjeables por dinero.

### C. Tipografía, Formas y Micro-Interacciones
- **Tipografía:** Redondeada y geométrica (*Plus Jakarta Sans*, *Nunito* o *Inter*).
  - Saldo en pesos: `36px - 44px`, `font-extrabold`, números tabulares (`tabular-nums`).
  - Títulos: `20px`, `font-bold`.
  - Párrafos: `16px`, máximo 2 líneas en mobile para alumnos.
- **Bordes y Superficies:**
  - Bordes redondeados amigables (`rounded-2xl` / 16px - 24px), sin sombras pesadas (usar sombras difusas suaves `shadow-sm` o elevación por color).
- **Botones Táctiles para el Recreo:**
  - Altura mínima: `52px` a `56px` para toque inmediato sin precisión milimétrica.
  - El botón **"Pagar con QR"** es el elemento protagónico en el Home del alumno.
  - Modo Kiosquero: cobrar en menos de 3 toques y menos de 5 segundos.

---

## 3. ESPECIFICACIÓN DE PANTALLAS CLAVE (MOBILE)

1. **Home Alumno (`app/(student)/index.tsx`):**
   - Header: Saludo ("Hola, Mateo") + Badge Escuela + Píldora amarilla con Puntos.
   - Superficie central limpia: Saldo gigante en pesos (`$4.500`), barra de límite diario restante y botón principal morado "Pagar en Kiosco (QR)".
   - Sección inferior: Lista plana de últimos 3 consumos y acceso a alcancía educativa.
2. **Comunidad de Intercambio (`app/(student)/community/`):**
   - Grilla de 2 columnas con fotos claras, etiqueta clara (`Intercambio` / `Donación` / `Préstamo`) y puntos otorgados. Detalle con retiro en el Punto de Entrega Escolar.
3. **Panel Padre/Tutor (`app/(parent)/`):**
   - Controles rápidos: Carga de saldo 1 a 1 (Mercado Pago), topes diarios/semanales, switches grandes para bloqueo de categorías (ej. 🍬 Golosinas) y botón destacado de Pausa Inmediata.
