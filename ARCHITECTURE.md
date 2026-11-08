ARCHITECTURE.md — Guía Oficial de Arquitectura y Reglas para Agentes IA (CAMBIAZO)

DIRECTIVA CRÍTICA PARA AGENTES DE IA: Este documento es la ley arquitectónica del proyecto CAMBIAZO. Todo código generado por AGENT_BACKEND, AGENT_WEB y AGENT_MOBILE debe cumplir estrictamente con los límites de directorios, patrones de diseño, reglas de negocio y lineamientos visuales definidos aquí. Cualquier violación a estas reglas invalidará el ticket.

1. Visión General y Principios Inquebrantables de Dominio

CAMBIAZO es una plataforma escolar multi-tenant que digitaliza los pagos en el kiosco escolar mediante saldo prepago con control parental y fomenta la economía circular mediante un módulo de intercambio/donación de útiles escolares gamificado.

1.1. Las 5 Leyes de Dominio (Prohibido Violar en Código)

Aislamiento Multi-Tenant Estricto (institution_id): Todas las entidades de negocio (usuarios, cuentas, productos del kiosco, publicaciones de intercambio, rankings) pertenecen a una institución educativa. Ningún alumno, padre o kiosquero puede consultar ni interactuar con recursos de otra institución.

Dos Economías 100% Separadas:

Economía Financiera (wallet-ledger): Saldo en Pesos Reales (ARS 1 a 1) operado mediante un proveedor de pagos regulado (Mercado Pago). Prohibido usar términos como token, coin, moneda virtual o cripto en código, base de datos o interfaz. Prohibido transferir pesos entre alumnos o permitir retiros de efectivo a alumnos.

Economía Comunitaria (community-points): Puntos de Comunidad no monetarios e intransferibles por dinero, ganados por intercambiar, donar o prestar útiles escolares en el punto de entrega moderado de la escuela.

Libro Mayor de Doble Entrada Inmutable (Immutable Double-Entry Ledger):

El saldo en pesos NUNCA se modifica con un simple UPDATE balance = balance - X sin respaldo contable.

Todo movimiento financiero genera registros en ledger_entries (débito y crédito que suman exactamente 0).

Las tablas del libro mayor son Append-Only (solo inserción). Están prohibidos los UPDATE o DELETE sobre asientos contables; cualquier reversión se ejecuta mediante un contra-asiento (asiento de ajuste/reverso).

Consentimiento Parental Auditable (Ley 25.326):

Ninguna cuenta con rol STUDENT puede activarse ni operar sin un registro activo en parental_consents firmado por un usuario PARENT verificado. El consentimiento guarda fecha/hora exacta, IP/metadatos y puede ser revocado o pausado instantáneamente.

Kiosco Libre de Comisión de Plataforma:

El modelo de ingresos se basa en el abono mensual de la institución (fijo o por alumno activo). El módulo de liquidación/retiro del kiosquero transfiere el 100% de sus ventas netas a su cuenta vinculada de Mercado Pago sin descontar comisión de plataforma.

2. Topología del Monorepo y Propiedad de Archivos (Anti-Colisión)

El proyecto utiliza Turborepo + pnpm workspaces. Para que los 3 agentes trabajen en simultáneo sin conflictos de Git (merge conflicts), rige la siguiente matriz de permisos:

cambiazo/
├── ARCHITECTURE.md               # Este documento (Lectura obligatoria para todos los agentes)
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── packages/
│   └── shared/                   # [WRITE: AGENT_BACKEND] | [READ-ONLY: AGENT_WEB, AGENT_MOBILE]
│       ├── src/
│       │   ├── schemas/          # Esquemas Zod (Contratos de entrada/salida)
│       │   ├── dto/              # Tipos inferidos de Zod (z.infer<typeof Schema>)
│       │   ├── enums/            # Roles, Estados, Categorías, Tipos de Movimiento
│       │   └── constants/        # Códigos de error y constantes de dominio
│       └── package.json
└── apps/
    ├── api/                      # [WRITE EXCLUSIVO: AGENT_BACKEND]
    ├── web-admin/                # [WRITE EXCLUSIVO: AGENT_WEB]
    └── mobile/                   # [WRITE EXCLUSIVO: AGENT_MOBILE]


Reglas de Sincronización entre Agentes

Contract-First Development: Todo endpoint o formulario nuevo requiere que su esquema Zod exista primero en @cambiazo/shared.

Autonomía con Mocks: Si AGENT_WEB o AGENT_MOBILE necesitan consumir un endpoint que AGENT_BACKEND aún está programando en la misma ola (Wave), deben importar el tipo desde @cambiazo/shared y construir un adaptador Mock local hasta la integración. Jamás deben editar archivos dentro de apps/api.

3. Arquitectura del Backend (apps/api) — Monolito Modular + Hexagonal

El backend está construido en NestJS (TypeScript) sobre PostgreSQL (con políticas RLS de refuerzo), Redis + BullMQ para procesos asíncronos y Vitest para testing.

3.1. División en Módulos de Dominio Desacoplados

Cada módulo de negocio vive en apps/api/src/modules/<module-name> y es dueño exclusivo de sus tablas de base de datos. Está prohibido hacer JOIN o importar repositorios de un módulo dentro de otro. La comunicación entre módulos se realiza mediante Puertos de Aplicación (Facades/Interfaces) o Eventos de Dominio.

tenants (Instituciones y Suscripciones):

Gestión de colegios (institutions), planes de abono mensual (fijo o por alumno activo), códigos de invitación institucional y puntos de entrega escolar.

identity-parental (Identidad, Roles y Control Parental):

Usuarios (SUPER_ADMIN, SCHOOL_ADMIN, KIOSK, PARENT, STUDENT), vínculos familiares, registro inmutable de consentimiento parental (Ley 25.326), límites de gasto diario/semanal, bloqueo de categorías y pausa de cuenta.

wallet-ledger (Billetera en Pesos y Pagos Regulado):

Cuentas contables (accounts), asientos de doble entrada (ledger_entries), órdenes de pago QR/código, webhooks idempotentes de Mercado Pago (payment_webhooks) y retiros del kiosco.

kiosk-catalog (Catálogo y Punto de Venta Escolar):

Productos del kiosco, categorías (ej. GOLOSINAS, BEBIDAS, SALUDABLE, LIBRERIA), stock simple y validación de ítems frente a las categorías bloqueadas por el padre.

community-exchange (Trueque, Donación, Puntos y Ranking):

Publicaciones de útiles (exchange_listings), solicitudes de intercambio/préstamo/donación, moderación escolar, libro de puntos de comunidad (community_point_entries), insignias y ranking por escuela.

analytics-notifications (Auditoría, Resúmenes y Alertas):

Envío de notificaciones push instantáneas al padre en cada compra, generación de resúmenes semanales y sugerencias educativas de metas de ahorro para el alumno.

3.2. Estructura Hexagonal Interna por Módulo (Ports & Adapters)

Cada módulo dentro de apps/api/src/modules/<module-name>/ debe respetar estrictamente estas 3 capas:

apps/api/src/modules/wallet-ledger/
├── domain/                       # CAPA 1: NÚCLEO PURO (Cero dependencias de NestJS, ORM o HTTP)
│   ├── entities/                 # Entidades ricas (ej. LedgerTransaction, WalletAccount)
│   ├── value-objects/            # Objetos de valor (ej. MoneyArs, QrPaymentToken)
│   ├── errors/                   # Errores de dominio (ej. DailyLimitExceededError, BlockedCategoryError)
│   └── ports/                    # Interfaces puras TypeScript (Inbound & Outbound Ports)
│       ├── ledger.repository.port.ts
│       └── payment-gateway.port.ts
├── application/                  # CAPA 2: CASOS DE USO (Orquestación de reglas de negocio)
│   ├── use-cases/
│   │   ├── process-kiosk-qr-payment.use-case.ts
│   │   ├── handle-mp-topup-webhook.use-case.ts
│   │   └── request-kiosk-payout.use-case.ts
│   └── events/                   # Eventos emitidos (ej. KioskPurchaseCompletedEvent)
├── infrastructure/               # CAPA 3: ADAPTADORES EXTERNOS (NestJS, DB, Mercado Pago, BullMQ)
│   ├── http/                     # Controladores REST, Guards de Rol y Tenant, Pipes con Zod
│   ├── persistence/              # Implementación de repositorios (Prisma/Drizzle) con transacciones ACID
│   ├── gateways/                 # Adaptador real de Mercado Pago y Mock para tests
│   └── jobs/                     # Consumidores de colas BullMQ
└── wallet-ledger.module.ts       # Inyección de dependencias (conecta Ports con Adapters)


3.3. Reglas Críticas de Ingeniería en Backend

Dirección de Dependencias: infrastructure $\rightarrow$ application $\rightarrow$ domain. La capa domain nunca importa decoradores de NestJS, clientes de base de datos ni SDKs de terceros.

Transacciones Financieras y Concurrencia: Todo cobro en el kiosco (process-kiosk-qr-payment) debe ejecutarse dentro de una transacción de base de datos con bloqueo pesimista (SELECT ... FOR UPDATE sobre la cuenta del alumno) para evitar condiciones de carrera (double spending) en el recreo.

Idempotencia Obligatoria: Tanto los webhooks de Mercado Pago como el cobro por QR en el kiosco deben exigir una idempotency_key única validada en base de datos/Redis. Si el kiosquero toca "Cobrar" dos veces por mala señal en el patio, el sistema procesa el cobro una sola vez y devuelve el mismo recibo.

Validación con Zod: Todo @Body(), @Query() y @Param() en los controladores se valida mediante un ZodValidationPipe utilizando los esquemas de @cambiazo/shared.

Testing con Vitest: Todo caso de uso de wallet-ledger e identity-parental debe incluir tests unitarios en Vitest inyectando repositorios en memoria (In-Memory Adapters) que verifiquen:

Que la suma de débitos y créditos siempre sea $\sum = 0$.

Que se rechacen compras si la cuenta está pausada, sin consentimiento parental, supera el límite diario/semanal o incluye una categoría bloqueada.

Que un webhook duplicado de Mercado Pago no acredite saldo dos veces.

4. Arquitectura de Frontend (apps/mobile y apps/web-admin) — Feature-Sliced Design (FSD)

Tanto la aplicación móvil en React Native + Expo (apps/mobile) como los paneles administrativos en Next.js App Router (apps/web-admin) implementan una arquitectura Feature-Sliced Design (FSD) pragmática, diseñada para escalar sin mezclar vistas ni lógica de distintos roles.

4.1. Estructura de Directorios en apps/mobile y apps/web-admin

src/
├── app/                          # CAPA 1: RUTEADOR Y GRUPOS POR ROL (Expo Router / Next App Router)
│   ├── (auth)/                   # Login, ingreso de código de colegio, registro parental
│   ├── (student)/                # Rutas exclusivas del Alumno (Billetera QR, Ahorro, Trueque)
│   ├── (parent)/                 # Rutas exclusivas del Padre (Carga MP, Límites, Alertas)
│   ├── (kiosk)/                  # Modo POS Kiosquero (Lector QR ultrarrápido, Catálogo)
│   └── _layout.tsx               # Providers globales (TanStack Query, Auth, Theme)
├── features/                     # CAPA 2: MÓDULOS DE PRODUCTO AISLADOS (Lógica + UI específica)
│   ├── onboarding-institution/   # Unión a escuela por código y firma de consentimiento parental
│   ├── student-wallet-qr/        # Saldo en pesos, barra de límite diario y generador QR/Código
│   ├── kiosk-pos-scanner/        # Cobro en <5 seg, selección rápida de productos y retiro MP
│   ├── parental-controls/        # Topes diarios/semanales, bloqueo de categorías, botón de pausa
│   ├── school-exchange/          # Publicación de útiles, filtro por trueque/donación, punto escolar
│   ├── community-ranking/        # Puntos amarillos, insignias y recompensas del colegio
│   └── savings-education/        # Metas de ahorro y resúmenes semanales amigables
├── entities/                     # CAPA 3: MODELOS DE NEGOCIO VISUALES REUTILIZABLES
│   ├── transaction/              # Ítem plano de movimiento financiero
│   ├── exchange-item/            # Celda de útil escolar para la grilla de 2 columnas
│   └── student-profile/          # Avatar, badge de escuela y píldora de puntos
└── shared/                       # CAPA 4: DESIGN SYSTEM PURO, CLIENTE API Y UTILIDADES
    ├── ui/                       # Componentes base (Button, Surface, Pill, LogoPencilC, Typography)
    ├── api/                      # Cliente HTTP tipado + Hooks base de TanStack Query + Mocks
    ├── store/                    # Estado global mínimo con Zustand (sesión, tenant activo)
    └── theme/                    # Tokens de color, tipografía y espaciado


4.2. Regla de Importación Unidireccional en FSD

Un módulo solo puede importar de capas estrictamente inferiores:
app $\rightarrow$ features $\rightarrow$ entities $\rightarrow$ shared.

Prohibido: Que un archivo dentro de features/student-wallet-qr importe algo de features/school-exchange. Si necesitan compartir algo, ese elemento debe bajar a entities o shared.

4.3. Gestión de Estado y Resiliencia en el Recreo

Estado del Servidor (TanStack Query): Todo dato proveniente de apps/api (saldos, movimientos, catálogo, publicaciones de trueque) se maneja con React Query. Prohibido copiar respuestas de la API dentro de Zustand o useState globales.

Estado Local (Zustand): Exclusivo para sesión autenticada, institution_id activa, preferencias de interfaz y el carrito temporal del kiosquero mientras arma un cobro en el recreo.

5. Sistema de Diseño Obligatorio (UI/UX Minimalista para Niños y Adolescentes)

Los agentes AGENT_MOBILE y AGENT_WEB tienen prohibido improvisar estilos. Toda pantalla debe respetar la psicología visual de un usuario de 9 a 17 años: lectura en menos de 2 segundos, cero ruido visual y separación cromática clara entre dinero real y puntos de comunidad.

5.1. Tokens Oficiales de Color y Marca (shared/theme/colors.ts)

Isologo Oficial (<LogoPencilC />): Lápiz flexible curvado formando una letra "C" en amarillo vibrante (#FACC15) con punta y detalles en morado (#6C3CE9).

Proporción 60-30-10:

60% Fondos Limpios:

background.canvas: #F8F7FF (Blanco lavanda suave para el fondo general de pantalla).

background.surface: #FFFFFF (Blanco puro para superficies principales, resaltando por contraste suave sin necesidad de bordes grises ni sombras oscuras).

30% Identidad Morada (Economía en Pesos y Navegación):

brand.primary: #6C3CE9 (Morado eléctrico principal).

brand.primaryDark: #4C1D95 (Énfasis y cabeceras puntuales).

brand.primarySoft: #EDE9FE (Fondos de píldoras y chips activos).

10% Acentos Semánticos (Separación de Economías):

economy.pointsYellow: #FACC15 / Texto #B45309 (Exclusivo para Puntos de Comunidad, trueque de útiles, ranking e insignias).

economy.moneyMint: #10B981 / #14B8A6 (Exclusivo para saldo positivo en Pesos $, confirmaciones de pago QR y metas de ahorro cumplidas).

Textos y Alertas:

text.primary: #1E1B4B (Azul-morado profundo; prohibido usar negro puro #000000).

text.secondary: #64748B (Gris pizarra para etiquetas breves).

status.warning: #F97316 (Aviso de cercanía al límite diario/semanal).

status.danger: #EF4444 (Categoría bloqueada o cuenta pausada por el padre).

5.2. Las 4 Reglas Anti-Saturación en Componentes UI

PROHIBIDO ANIDAR TARJETAS (No Card-inside-Card):

Jamás renderices un contenedor con borde, sombra o color de tarjeta dentro de otra tarjeta.

Las listas (como "Últimos consumos en el kiosco" o "Controles del Padre") se renderizan como filas limpias directamente sobre la superficie o el lienzo con espaciado generoso (gap: 16px) o divisores sutiles (#F1F5F9).

Regla de Máximo 3 Datos por Ítem:

En las vistas del alumno, cada fila de movimiento o tarjeta de útil escolar puede mostrar como máximo 3 elementos:

Ícono grande de categoría o foto clara del útil.

Título conciso de 1 línea (ej. "Alfajor + Agua" o "Compás Metálico").

Valor destacado a la derecha ("$1.800" en morado/menta o "+40 Pts" en amarillo).

Queda prohibido mostrar IDs técnicos, timestamps con segundos o textos legales extensos al alumno.

Ergonomía para la Fila del Recreo:

Todos los botones interactivos en apps/mobile deben tener una altura mínima de 54px, bordes redondeados (borderRadius: 16px a 24px) y tipografía geométrica clara (Plus Jakarta Sans o Nunito).

En el Home del Alumno, el saldo en pesos (38px-44px, font-extrabold) y el botón "Pagar con QR" deben estar siempre visibles sin hacer scroll (above the fold).

Tono Educativo, Nunca Punitivo:

Cuando un alumno intenta comprar algo que supera su límite diario o pertenece a una categoría bloqueada por sus padres, o cuando recibe sugerencias de ahorro, la interfaz debe usar micro-copy amigable y educativo, nunca mensajes de error crudos.

6. Checklist de Validación Pre-Commit para los 3 Agentes

Antes de dar por finalizado cualquier ticket, cada agente debe verificar:

[ ] ¿Escribí archivos únicamente dentro de mi Write Scope asignado?

[ ] ¿Todos los payloads de entrada/salida están validados contra esquemas Zod en @cambiazo/shared?

[ ] ¿Se filtró correctamente por institution_id para garantizar el aislamiento entre escuelas?

[ ] ¿Se mantuvo la separación total entre Pesos (wallet-ledger) y Puntos de Comunidad (community-exchange), sin usar las palabras token o coin?

[ ] (Si es Frontend) ¿Cumplí la regla de cero tarjetas anidadas y máximo 3 datos por fila usando la paleta Blanco/Morado/Amarillo/Menta?

[ ] ¿Pasan todos los chequeos de tipos (pnpm turbo typecheck) y pruebas (pnpm turbo test)?