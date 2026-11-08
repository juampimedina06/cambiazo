import {
  CreateInstitutionSchema,
  CreateInvitationSchema,
  InstitutionDtoSchema,
  CreateCatalogProductSchema,
  CatalogProductSchema,
  ChargeQrRequestSchema,
  KioskWithdrawalRequestSchema,
  ModerateExchangeItemSchema,
  SchoolRewardSchema,
  LeaderboardEntryDtoSchema,
} from '@cambiazo/shared';
import {
  Institution,
  CreateInstitutionInput,
  InvitationCode,
  CreateInvitationInput,
  StudentRosterItem,
  InstitutionStatus,
  ConsentStatus,
  CatalogProduct,
  CreateCatalogProductInput,
  ChargeQrRequestInput,
  KioskWithdrawalRequestInput,
  KioskSale,
  KioskWithdrawal,
  KioskLedgerBalance,
  ProductCategory,
  ExchangeItem,
  ExchangeMode,
  ModerationStatus,
  ModerateExchangeItemDto,
  SchoolReward,
  LeaderboardEntry,
  RewardRedemption,
  SchoolReportMetrics,
  SuperAdminGlobalMetrics,
  InstitutionBillingRow,
} from './types';

export const DEFAULT_KIOSK_INSTITUTION_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const INITIAL_CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: 'b1a2c3d4-0001-4000-8000-000000000001',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    name: 'Alfajor de Arroz y Miel',
    category: 'HEALTHY_SNACK',
    priceCents: 120000, // $1.200 ARS
    stock: 45,
    isActive: true,
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'b1a2c3d4-0002-4000-8000-000000000002',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    name: 'Barra de Cereal Frutos Rojos',
    category: 'HEALTHY_SNACK',
    priceCents: 90000, // $900 ARS
    stock: 60,
    isActive: true,
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'b1a2c3d4-0003-4000-8000-000000000003',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    name: 'Agua Mineral sin Gas 500ml',
    category: 'DRINK',
    priceCents: 80000, // $800 ARS
    stock: 80,
    isActive: true,
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'b1a2c3d4-0004-4000-8000-000000000004',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    name: 'Jugo de Naranja Natural 350ml',
    category: 'DRINK',
    priceCents: 150000, // $1.500 ARS
    stock: 35,
    isActive: true,
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'b1a2c3d4-0005-4000-8000-000000000005',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    name: 'Alfajor Triple de Chocolate',
    category: 'CANDY',
    priceCents: 160000, // $1.600 ARS
    stock: 50,
    isActive: true,
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'b1a2c3d4-0006-4000-8000-000000000006',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    name: 'Gomitas Frutales Ácidas 80g',
    category: 'CANDY',
    priceCents: 95000, // $950 ARS
    stock: 40,
    isActive: true,
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'b1a2c3d4-0007-4000-8000-000000000007',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    name: 'Sándwich Tostado de Jamón y Queso',
    category: 'HOT_MEAL',
    priceCents: 280000, // $2.800 ARS
    stock: 25,
    isActive: true,
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'b1a2c3d4-0008-4000-8000-000000000008',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    name: 'Empanada Criolla al Horno',
    category: 'HOT_MEAL',
    priceCents: 140000, // $1.400 ARS
    stock: 30,
    isActive: true,
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'b1a2c3d4-0009-4000-8000-000000000009',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    name: 'Cuaderno Rayado A4 48 Hojas',
    category: 'STATIONERY',
    priceCents: 220000, // $2.200 ARS
    stock: 20,
    isActive: true,
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: 'b1a2c3d4-0010-4000-8000-000000000010',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    name: 'Lapicera de Gel Azul 0.7mm',
    category: 'STATIONERY',
    priceCents: 75000, // $750 ARS
    stock: 55,
    isActive: true,
    createdAt: '2026-02-01T08:00:00.000Z',
  },
];

const INITIAL_SALES: KioskSale[] = [
  {
    id: 'sale-001',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    studentId: 'e2b3c4d5-1111-4000-8000-000000000001',
    studentName: 'Mateo Rossi',
    paymentCode: '482910',
    items: [
      {
        productId: 'b1a2c3d4-0007-4000-8000-000000000007',
        productName: 'Sándwich Tostado de Jamón y Queso',
        category: 'HOT_MEAL',
        quantity: 1,
        unitPriceCents: 280000,
        subtotalCents: 280000,
      },
      {
        productId: 'b1a2c3d4-0004-4000-8000-000000000004',
        productName: 'Jugo de Naranja Natural 350ml',
        category: 'DRINK',
        quantity: 1,
        unitPriceCents: 150000,
        subtotalCents: 150000,
      },
    ],
    totalAmountCents: 430000, // $4.300 ARS
    platformFeeCents: 0, // 0% platform fee
    netAmountCents: 430000, // 100% net to kiosk
    idempotencyKey: 'idem-sale-init-001',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'COMPLETED',
  },
  {
    id: 'sale-002',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    studentId: 'e2b3c4d5-4444-4000-8000-000000000004',
    studentName: 'Valentina Benítez',
    paymentCode: '719304',
    items: [
      {
        productId: 'b1a2c3d4-0002-4000-8000-000000000002',
        productName: 'Barra de Cereal Frutos Rojos',
        category: 'HEALTHY_SNACK',
        quantity: 2,
        unitPriceCents: 90000,
        subtotalCents: 180000,
      },
    ],
    totalAmountCents: 180000, // $1.800 ARS
    platformFeeCents: 0,
    netAmountCents: 180000,
    idempotencyKey: 'idem-sale-init-002',
    createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    status: 'COMPLETED',
  },
  {
    id: 'sale-003',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    studentId: 'e2b3c4d5-3333-4000-8000-000000000003',
    studentName: 'Joaquín Díaz',
    paymentCode: '305912',
    items: [
      {
        productId: 'b1a2c3d4-0001-4000-8000-000000000001',
        productName: 'Alfajor de Arroz y Miel',
        category: 'HEALTHY_SNACK',
        quantity: 1,
        unitPriceCents: 120000,
        subtotalCents: 120000,
      },
      {
        productId: 'b1a2c3d4-0003-4000-8000-000000000003',
        productName: 'Agua Mineral sin Gas 500ml',
        category: 'DRINK',
        quantity: 1,
        unitPriceCents: 80000,
        subtotalCents: 80000,
      },
    ],
    totalAmountCents: 200000, // $2.000 ARS
    platformFeeCents: 0,
    netAmountCents: 200000,
    idempotencyKey: 'idem-sale-init-003',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    status: 'COMPLETED',
  },
  {
    id: 'sale-004',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    studentId: 'e2b3c4d5-2222-4000-8000-000000000002',
    studentName: 'Lucía Fernández',
    paymentCode: '859102',
    items: [
      {
        productId: 'b1a2c3d4-0009-4000-8000-000000000009',
        productName: 'Cuaderno Rayado A4 48 Hojas',
        category: 'STATIONERY',
        quantity: 1,
        unitPriceCents: 220000,
        subtotalCents: 220000,
      },
    ],
    totalAmountCents: 220000, // $2.200 ARS
    platformFeeCents: 0,
    netAmountCents: 220000,
    idempotencyKey: 'idem-sale-init-004',
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    status: 'COMPLETED',
  },
];

const INITIAL_WITHDRAWALS: KioskWithdrawal[] = [
  {
    id: 'with-001',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    amountCents: 1500000, // $15.000 ARS
    mercadoPagoAliasOrCvu: 'kiosco.belgrano.mp',
    idempotencyKey: 'idem-with-init-001',
    status: 'PROCESSED',
    createdAt: '2026-03-05T17:30:00.000Z',
    processedAt: '2026-03-05T17:31:12.000Z',
  },
  {
    id: 'with-002',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    amountCents: 2000000, // $20.000 ARS
    mercadoPagoAliasOrCvu: '0000003100084920194821',
    idempotencyKey: 'idem-with-init-002',
    status: 'PROCESSED',
    createdAt: '2026-03-02T11:00:00.000Z',
    processedAt: '2026-03-02T11:01:45.000Z',
  },
];

const HISTORICAL_BASE_SALES_CENTS = 14500000; // $145.000 ARS ledger historical sales

let mockCatalogProducts: CatalogProduct[] = [...INITIAL_CATALOG_PRODUCTS];
let mockSales: KioskSale[] = [...INITIAL_SALES];
let mockWithdrawals: KioskWithdrawal[] = [...INITIAL_WITHDRAWALS];

// Seeded Institutions (Super Admin view)
let mockInstitutions: Institution[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Colegio Belgrano Day School',
    cuit: '30-11223344-5',
    address: 'Av. Cramer 1850, CABA',
    billingPlanType: 'FIXED_MONTHLY',
    monthlyFeeCents: 4500000, // $45.000 ARS
    status: 'ACTIVE',
    activeStudentsCount: 420,
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
    name: 'Instituto San Martín de Tours',
    cuit: '30-22334455-6',
    address: 'San Martín 450, San Isidro, Buenos Aires',
    billingPlanType: 'PER_ACTIVE_STUDENT',
    monthlyFeeCents: 25000, // $250 ARS por alumno activo
    status: 'ACTIVE',
    activeStudentsCount: 310,
    createdAt: '2026-01-15T09:30:00.000Z',
  },
  {
    id: 'c9a646d3-9c61-4cd9-bc15-35871b7691af',
    name: 'Escuela Técnica N° 1 Ing. Otto Krause',
    cuit: '30-33445566-7',
    address: 'Av. Paseo Colón 650, CABA',
    billingPlanType: 'FIXED_MONTHLY',
    monthlyFeeCents: 3500000, // $35.000 ARS
    status: 'SUSPENDED',
    activeStudentsCount: 180,
    createdAt: '2026-02-01T11:00:00.000Z',
  },
];

// Seeded Invitation Codes (School Admin view)
let mockInvitations: InvitationCode[] = [
  {
    id: 'inv-001',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    code: 'BELGRANO-2026',
    maxUses: 500,
    currentUses: 342,
    expiresAt: '2026-12-31T23:59:59.000Z',
    createdAt: '2026-02-01T10:00:00.000Z',
    isActive: true,
  },
  {
    id: 'inv-002',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    code: 'BELGRANO-SECUNDARIA',
    maxUses: 200,
    currentUses: 78,
    expiresAt: '2026-07-31T23:59:59.000Z',
    createdAt: '2026-02-15T14:30:00.000Z',
    isActive: true,
  },
  {
    id: 'inv-003',
    institutionId: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
    code: 'SAN-MARTIN-INICIAL',
    maxUses: 150,
    currentUses: 150,
    expiresAt: '2026-03-31T23:59:59.000Z',
    createdAt: '2026-02-10T09:00:00.000Z',
    isActive: false,
  },
];

// Seeded Student and Family Roster with Parental Consent Audit Status
let mockStudentsRoster: StudentRosterItem[] = [
  {
    id: 'rost-001',
    studentId: 'e2b3c4d5-1111-4000-8000-000000000001',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    studentName: 'Mateo Rossi',
    studentDni: '54.123.456',
    grade: '5to Grado B',
    parentName: 'Carlos Rossi',
    parentEmail: 'carlos.rossi@example.com',
    parentPhone: '+54 11 4567-8901',
    consentStatus: 'GRANTED',
    consentAudit: {
      acceptedTermsVersion: 'v1.2-2026',
      signedAt: '2026-02-20T14:22:10.000Z',
      signatureIp: '181.44.12.98',
    },
    walletBalanceCents: 450000, // $4.500 ARS
    communityPoints: 120,
    createdAt: '2026-02-20T14:22:10.000Z',
  },
  {
    id: 'rost-002',
    studentId: 'e2b3c4d5-2222-4000-8000-000000000002',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    studentName: 'Lucía Fernández',
    studentDni: '56.789.012',
    grade: '3er Grado A',
    parentName: 'Valeria Gómez',
    parentEmail: 'valeria.gomez@example.com',
    parentPhone: '+54 11 6789-0123',
    consentStatus: 'PENDING',
    consentAudit: {},
    walletBalanceCents: 0,
    communityPoints: 0,
    createdAt: '2026-03-01T10:15:00.000Z',
  },
  {
    id: 'rost-003',
    studentId: 'e2b3c4d5-3333-4000-8000-000000000003',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    studentName: 'Joaquín Díaz',
    studentDni: '52.345.678',
    grade: '7mo Grado C',
    parentName: 'Martín Díaz',
    parentEmail: 'martin.diaz@example.com',
    parentPhone: '+54 11 3456-7890',
    consentStatus: 'REVOKED',
    consentAudit: {
      acceptedTermsVersion: 'v1.1-2026',
      signedAt: '2026-02-15T09:12:00.000Z',
      signatureIp: '190.18.23.45',
      revocationReason: 'Solicitud expresa del tutor legal por cambio de escuela.',
      revokedAt: '2026-03-05T16:45:00.000Z',
    },
    walletBalanceCents: 120000, // $1.200 ARS
    communityPoints: 45,
    createdAt: '2026-02-15T09:12:00.000Z',
  },
  {
    id: 'rost-004',
    studentId: 'e2b3c4d5-4444-4000-8000-000000000004',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    studentName: 'Valentina Benítez',
    studentDni: '53.987.654',
    grade: '4to Grado B',
    parentName: 'Andrea Soler',
    parentEmail: 'andrea.soler@example.com',
    parentPhone: '+54 11 9876-5432',
    consentStatus: 'GRANTED',
    consentAudit: {
      acceptedTermsVersion: 'v1.2-2026',
      signedAt: '2026-02-22T18:05:32.000Z',
      signatureIp: '190.220.34.12',
    },
    walletBalanceCents: 680000, // $6.800 ARS
    communityPoints: 85,
    createdAt: '2026-02-22T18:05:32.000Z',
  },
  {
    id: 'rost-005',
    studentId: 'e2b3c4d5-5555-4000-8000-000000000005',
    institutionId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    studentName: 'Bautista Gómez',
    studentDni: '55.432.109',
    grade: '6to Grado A',
    parentName: 'Mariana Gómez',
    parentEmail: 'mariana.gomez@example.com',
    parentPhone: '+54 11 2345-6789',
    consentStatus: 'GRANTED',
    consentAudit: {
      acceptedTermsVersion: 'v1.2-2026',
      signedAt: '2026-02-24T11:10:00.000Z',
      signatureIp: '181.44.12.98',
    },
    walletBalanceCents: 320000,
    communityPoints: 90,
    createdAt: '2026-02-24T11:10:00.000Z',
  },
];

const INITIAL_EXCHANGE_ITEMS: ExchangeItem[] = [
  {
    id: 'c1a2b3c4-0001-4000-8000-000000000001',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    studentId: 'e2b3c4d5-1111-4000-8000-000000000001',
    studentName: 'Mateo Rossi',
    studentGrade: '5to Grado B',
    title: 'Set de Reglas y Compás Maped',
    description: 'Kit de geometría completo con regla de 30cm, escuadra y transportador en excelente estado.',
    category: 'STATIONERY',
    mode: 'BARTER',
    status: 'PENDING',
    photoUrls: ['https://images.unsplash.com/photo-1588072432836-e10032774350?w=400'],
    awardedPoints: 0,
    createdAt: '2026-03-05T09:30:00.000Z',
    updatedAt: '2026-03-05T09:30:00.000Z',
  },
  {
    id: 'c1a2b3c4-0002-4000-8000-000000000002',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    studentId: 'e2b3c4d5-4444-4000-8000-000000000004',
    studentName: 'Valentina Benítez',
    studentGrade: '4to Grado B',
    title: 'Manual de Ciencias Sociales Bonaerense 6to',
    description: 'Libro de texto escolar Santillana en muy buen estado, sin páginas rotas ni rayones.',
    category: 'STATIONERY',
    mode: 'DONATION',
    status: 'PENDING',
    photoUrls: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'],
    awardedPoints: 0,
    createdAt: '2026-03-05T11:15:00.000Z',
    updatedAt: '2026-03-05T11:15:00.000Z',
  },
  {
    id: 'c1a2b3c4-0003-4000-8000-000000000003',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    studentId: 'e2b3c4d5-2222-4000-8000-000000000002',
    studentName: 'Lucía Fernández',
    studentGrade: '3er Grado A',
    title: 'Diccionario Ilustrado de la Lengua Española',
    description: 'Diccionario escolar con definiciones claras y ejemplos, ideal para 3er a 5to grado.',
    category: 'STATIONERY',
    mode: 'DONATION',
    status: 'APPROVED',
    photoUrls: ['https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=400'],
    moderatorNotes: 'Publicación revisada y habilitada para intercambio en la comunidad.',
    awardedPoints: 0,
    createdAt: '2026-03-04T14:20:00.000Z',
    updatedAt: '2026-03-04T16:00:00.000Z',
  },
  {
    id: 'c1a2b3c4-0004-4000-8000-000000000004',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    studentId: 'e2b3c4d5-3333-4000-8000-000000000003',
    studentName: 'Joaquín Díaz',
    studentGrade: '7mo Grado C',
    title: 'Calculadora Científica Casio fx-82MS',
    description: 'Calculadora para préstamo durante el trimestre de física y matemática.',
    category: 'STATIONERY',
    mode: 'LOAN',
    status: 'APPROVED',
    photoUrls: ['https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400'],
    moderatorNotes: 'Aprobado para préstamo escolar rotativo.',
    awardedPoints: 0,
    createdAt: '2026-03-03T10:00:00.000Z',
    updatedAt: '2026-03-03T11:30:00.000Z',
  },
  {
    id: 'c1a2b3c4-0005-4000-8000-000000000005',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    studentId: 'e2b3c4d5-4444-4000-8000-000000000004',
    studentName: 'Valentina Benítez',
    studentGrade: '4to Grado B',
    title: 'Compás Metálico de Precisión con Minas',
    description: 'Compás profesional con estuche protector rígido.',
    category: 'STATIONERY',
    mode: 'BARTER',
    status: 'DELIVERED',
    photoUrls: ['https://images.unsplash.com/photo-1588072432836-e10032774350?w=400'],
    moderatorNotes: 'Entregado físicamente en la preceptoría escolar. Puntos acreditados al alumno.',
    awardedPoints: 50,
    createdAt: '2026-03-01T08:30:00.000Z',
    updatedAt: '2026-03-02T15:45:00.000Z',
  },
  {
    id: 'c1a2b3c4-0006-4000-8000-000000000006',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    studentId: 'e2b3c4d5-1111-4000-8000-000000000001',
    studentName: 'Mateo Rossi',
    studentGrade: '5to Grado B',
    title: 'Caja de 12 Acuarelas Escolares y 2 Pinceles',
    description: 'Set de acuarelas lavables donadas a la sala de arte del colegio.',
    category: 'STATIONERY',
    mode: 'DONATION',
    status: 'DELIVERED',
    photoUrls: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400'],
    moderatorNotes: 'Recepción confirmada en el punto escolar de entrega.',
    awardedPoints: 50,
    createdAt: '2026-02-28T12:00:00.000Z',
    updatedAt: '2026-03-01T10:20:00.000Z',
  },
  {
    id: 'c1a2b3c4-0007-4000-8000-000000000007',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    studentId: 'e2b3c4d5-3333-4000-8000-000000000003',
    studentName: 'Joaquín Díaz',
    studentGrade: '7mo Grado C',
    title: 'Cartuchera Canopla Doble Cierre Azul',
    description: 'Cartuchera de tela con compartimentos para útiles.',
    category: 'STATIONERY',
    mode: 'DONATION',
    status: 'REJECTED',
    photoUrls: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400'],
    moderatorNotes: 'El cierre principal se encuentra roto y no cumple los estándares para reutilización solidaria. Sugerimos reparar antes de volver a publicar.',
    awardedPoints: 0,
    createdAt: '2026-03-02T16:00:00.000Z',
    updatedAt: '2026-03-03T09:10:00.000Z',
  },
  {
    id: 'c1a2b3c4-0008-4000-8000-000000000008',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    studentId: 'e2b3c4d5-5555-4000-8000-000000000005',
    studentName: 'Bautista Gómez',
    studentGrade: '6to Grado A',
    title: 'Flauta Dulce Yamaha Soprano con Funda',
    description: 'Flauta dulce marfil higienizada, lista para préstamo en clases de música.',
    category: 'STATIONERY',
    mode: 'LOAN',
    status: 'PENDING',
    photoUrls: ['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'],
    awardedPoints: 0,
    createdAt: '2026-03-06T08:10:00.000Z',
    updatedAt: '2026-03-06T08:10:00.000Z',
  },
];

const INITIAL_SCHOOL_REWARDS: SchoolReward[] = [
  {
    id: 'd3b07384-d113-469b-8f5b-111111111111',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    title: 'Insignia Guardián del Reciclaje',
    description: 'Insignia digital escolar en reconocimiento al compromiso solidario y la reutilización de útiles.',
    pointsCost: 100,
    stock: 50,
    badgeImageUrl: 'https://storage.cambiazo.ar/badges/guardian-reciclaje.png',
    isActive: true,
  },
  {
    id: 'd3b07384-d113-469b-8f5b-222222222222',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    title: 'Pase Prioritario de Biblioteca',
    description: 'Acceso preferencial para préstamo de novelas y uso de computadoras en la biblioteca escolar.',
    pointsCost: 150,
    stock: 25,
    badgeImageUrl: 'https://storage.cambiazo.ar/badges/biblioteca-plus.png',
    isActive: true,
  },
  {
    id: 'd3b07384-d113-469b-8f5b-333333333333',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    title: 'Mención de Honor al Mérito Solidario',
    description: 'Diploma oficial entregado en el acto escolar institucional por aporte comunitario destacado.',
    pointsCost: 250,
    stock: 15,
    badgeImageUrl: 'https://storage.cambiazo.ar/badges/mencion-honor.png',
    isActive: true,
  },
  {
    id: 'd3b07384-d113-469b-8f5b-444444444444',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    title: 'Tiempo Libre en Laboratorio de Computación',
    description: '1 hora de navegación tecnológica supervisada para proyectos educativos y programación.',
    pointsCost: 200,
    stock: 20,
    badgeImageUrl: 'https://storage.cambiazo.ar/badges/laboratorio-libre.png',
    isActive: true,
  },
];

const INITIAL_LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  {
    rank: 1,
    studentId: 'e2b3c4d5-1111-4000-8000-000000000001',
    studentAlias: 'Mateo R. (5to B)',
    accumulatedPoints: 340,
    badges: ['GUARDIAN_RECICLAJE', 'EMBAJADOR_ORO'],
  },
  {
    rank: 2,
    studentId: 'e2b3c4d5-4444-4000-8000-000000000004',
    studentAlias: 'Valentina B. (4to B)',
    accumulatedPoints: 280,
    badges: ['GUARDIAN_RECICLAJE', 'BIBLIOTECA_PLUS'],
  },
  {
    rank: 3,
    studentId: 'e2b3c4d5-3333-4000-8000-000000000003',
    studentAlias: 'Joaquín D. (7mo C)',
    accumulatedPoints: 190,
    badges: ['SOLIDARIO_BRONCE'],
  },
  {
    rank: 4,
    studentId: 'e2b3c4d5-2222-4000-8000-000000000002',
    studentAlias: 'Lucía F. (3er A)',
    accumulatedPoints: 140,
    badges: ['DONANTE_ACTIVO'],
  },
  {
    rank: 5,
    studentId: 'e2b3c4d5-5555-4000-8000-000000000005',
    studentAlias: 'Bautista G. (6to A)',
    accumulatedPoints: 90,
    badges: ['INICIADO_SOLIDARIO'],
  },
];

const INITIAL_REWARD_REDEMPTIONS: RewardRedemption[] = [
  {
    id: 'red-001',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    rewardId: 'd3b07384-d113-469b-8f5b-111111111111',
    rewardTitle: 'Insignia Guardián del Reciclaje',
    pointsCost: 100,
    studentId: 'e2b3c4d5-1111-4000-8000-000000000001',
    studentName: 'Mateo Rossi',
    studentGrade: '5to Grado B',
    status: 'PENDING',
    requestedAt: '2026-03-06T10:30:00.000Z',
  },
  {
    id: 'red-002',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    rewardId: 'd3b07384-d113-469b-8f5b-222222222222',
    rewardTitle: 'Pase Prioritario de Biblioteca',
    pointsCost: 150,
    studentId: 'e2b3c4d5-4444-4000-8000-000000000004',
    studentName: 'Valentina Benítez',
    studentGrade: '4to Grado B',
    status: 'PENDING',
    requestedAt: '2026-03-05T14:15:00.000Z',
  },
  {
    id: 'red-003',
    institutionId: DEFAULT_KIOSK_INSTITUTION_ID,
    rewardId: 'd3b07384-d113-469b-8f5b-333333333333',
    rewardTitle: 'Mención de Honor al Mérito Solidario',
    pointsCost: 250,
    studentId: 'e2b3c4d5-3333-4000-8000-000000000003',
    studentName: 'Joaquín Díaz',
    studentGrade: '7mo Grado C',
    status: 'FULFILLED',
    requestedAt: '2026-03-02T09:00:00.000Z',
    fulfilledAt: '2026-03-03T11:20:00.000Z',
  },
];

let mockExchangeItems: ExchangeItem[] = INITIAL_EXCHANGE_ITEMS.map((item) => ({ ...item }));
let mockSchoolRewards: SchoolReward[] = INITIAL_SCHOOL_REWARDS.map((rew) => ({ ...rew }));
let mockLeaderboard: LeaderboardEntry[] = INITIAL_LEADERBOARD_ENTRIES.map((entry) => ({
  ...entry,
  badges: [...entry.badges],
}));
let mockRedemptions: RewardRedemption[] = INITIAL_REWARD_REDEMPTIONS.map((red) => ({ ...red }));


export const mockAdapter = {
  // Institutions
  async getInstitutions(): Promise<Institution[]> {
    return [...mockInstitutions];
  },

  async getInstitutionById(id: string): Promise<Institution | null> {
    const institution = mockInstitutions.find((i) => i.id === id);
    return institution ? { ...institution } : null;
  },

  async createInstitution(input: CreateInstitutionInput): Promise<Institution> {
    // Validate with Zod schema from @cambiazo/shared
    const validated = CreateInstitutionSchema.parse(input);

    const newInstitution: Institution = {
      id: crypto.randomUUID ? crypto.randomUUID() : `inst-${Date.now()}`,
      name: validated.name,
      cuit: validated.cuit,
      address: validated.address,
      billingPlanType: validated.billingPlanType,
      monthlyFeeCents: validated.monthlyFeeCents,
      status: 'ACTIVE',
      activeStudentsCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Validate output DTO schema
    InstitutionDtoSchema.parse(newInstitution);

    mockInstitutions = [newInstitution, ...mockInstitutions];
    return newInstitution;
  },

  async updateInstitutionStatus(
    id: string,
    status: InstitutionStatus
  ): Promise<Institution> {
    const inst = mockInstitutions.find((i) => i.id === id);
    if (!inst) throw new Error(`Institution with ID ${id} not found.`);
    inst.status = status;
    return { ...inst };
  },

  // Invitations
  async getInvitations(institutionId?: string): Promise<InvitationCode[]> {
    if (institutionId) {
      return mockInvitations.filter((inv) => inv.institutionId === institutionId);
    }
    return [...mockInvitations];
  },

  async createInvitation(input: CreateInvitationInput): Promise<InvitationCode> {
    // Validate with Zod schema from @cambiazo/shared
    const validated = CreateInvitationSchema.parse(input);

    const generatedCode =
      validated.code || `CAMBIAZO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newInvitation: InvitationCode = {
      id: `inv-${Date.now()}`,
      institutionId: validated.institutionId,
      code: generatedCode,
      maxUses: validated.maxUses ?? 100,
      currentUses: 0,
      expiresAt:
        validated.expiresAt instanceof Date
          ? validated.expiresAt.toISOString()
          : validated.expiresAt ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    mockInvitations = [newInvitation, ...mockInvitations];
    return newInvitation;
  },

  // Students & Families Roster
  async getStudentsRoster(institutionId?: string): Promise<StudentRosterItem[]> {
    if (institutionId) {
      return mockStudentsRoster.filter((s) => s.institutionId === institutionId);
    }
    return [...mockStudentsRoster];
  },

  async updateStudentConsent(
    studentId: string,
    status: ConsentStatus,
    reason?: string
  ): Promise<StudentRosterItem> {
    const student = mockStudentsRoster.find((s) => s.studentId === studentId);
    if (!student) throw new Error(`Student ${studentId} not found in roster.`);

    student.consentStatus = status;
    if (status === 'GRANTED') {
      student.consentAudit = {
        acceptedTermsVersion: 'v1.2-2026',
        signedAt: new Date().toISOString(),
        signatureIp: '181.44.12.98',
      };
    } else if (status === 'REVOKED') {
      student.consentAudit = {
        ...student.consentAudit,
        revocationReason: reason || 'Revocado por el administrador escolar / tutor',
        revokedAt: new Date().toISOString(),
      };
    } else {
      student.consentAudit = {};
    }

    return { ...student };
  },

  // Kiosk Catalog Management
  async getCatalogProducts(
    institutionId?: string,
    category?: ProductCategory
  ): Promise<CatalogProduct[]> {
    let products = [...mockCatalogProducts];
    if (institutionId) {
      products = products.filter((p) => p.institutionId === institutionId);
    }
    if (category) {
      products = products.filter((p) => p.category === category);
    }
    return products;
  },

  async getCatalogProductById(id: string): Promise<CatalogProduct | null> {
    const product = mockCatalogProducts.find((p) => p.id === id);
    return product ? { ...product } : null;
  },

  async createCatalogProduct(
    input: CreateCatalogProductInput
  ): Promise<CatalogProduct> {
    const validated = CreateCatalogProductSchema.parse(input);

    const newProduct: CatalogProduct = {
      id: generateUuid(),
      institutionId: validated.institutionId,
      name: validated.name,
      category: validated.category,
      priceCents: validated.priceCents,
      stock: validated.stock,
      isActive: validated.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    CatalogProductSchema.parse(newProduct);
    mockCatalogProducts = [newProduct, ...mockCatalogProducts];
    return newProduct;
  },

  async updateCatalogProduct(
    id: string,
    input: Partial<CreateCatalogProductInput>
  ): Promise<CatalogProduct> {
    const index = mockCatalogProducts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Product with ID ${id} not found.`);
    }

    const current = mockCatalogProducts[index]!;
    const updated: CatalogProduct = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    CatalogProductSchema.parse(updated);
    mockCatalogProducts[index] = updated;
    return updated;
  },

  async deleteCatalogProduct(id: string): Promise<boolean> {
    const initialLength = mockCatalogProducts.length;
    mockCatalogProducts = mockCatalogProducts.filter((p) => p.id !== id);
    return mockCatalogProducts.length < initialLength;
  },

  // Kiosk Sales Monitor & POS Web Terminal
  async getKioskSales(institutionId?: string): Promise<KioskSale[]> {
    if (institutionId) {
      return mockSales.filter((s) => s.institutionId === institutionId);
    }
    return [...mockSales];
  },

  async processKioskCharge(
    charge: ChargeQrRequestInput,
    institutionId?: string
  ): Promise<KioskSale> {
    const validated = ChargeQrRequestSchema.parse(charge);
    const targetInstitution = institutionId || DEFAULT_KIOSK_INSTITUTION_ID;

    // Idempotency guarantee: check for already processed idempotencyKey
    const existing = mockSales.find(
      (s) => s.idempotencyKey === validated.idempotencyKey
    );
    if (existing) {
      return { ...existing };
    }

    // Build items and verify stock
    const saleItems: KioskSale['items'] = [];
    for (const item of validated.items) {
      const product = mockCatalogProducts.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Producto con ID ${item.productId} no encontrado.`);
      }
      if (product.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para "${product.name}". Disponible: ${product.stock}, solicitado: ${item.quantity}.`
        );
      }

      // Deduct stock
      product.stock -= item.quantity;

      saleItems.push({
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
        subtotalCents: product.priceCents * item.quantity,
      });
    }

    const totalAmountCents = saleItems.reduce(
      (sum, i) => sum + i.subtotalCents,
      0
    );

    // Kiosk 0% platform fee rule
    const platformFeeCents = 0;
    const netAmountCents = totalAmountCents;

    // Resolve student info if code matches student roster or generic
    const matchedStudent = mockStudentsRoster.find(
      (s) => s.studentDni.replace(/\D/g, '').endsWith(validated.paymentTokenOrCode)
    );

    const newSale: KioskSale = {
      id: generateUuid(),
      institutionId: targetInstitution,
      studentId: matchedStudent?.studentId,
      studentName: matchedStudent
        ? matchedStudent.studentName
        : `Alumno Código #${validated.paymentTokenOrCode}`,
      paymentCode: validated.paymentTokenOrCode,
      items: saleItems,
      totalAmountCents,
      platformFeeCents,
      netAmountCents,
      idempotencyKey: validated.idempotencyKey,
      createdAt: new Date().toISOString(),
      status: 'COMPLETED',
    };

    mockSales = [newSale, ...mockSales];
    return newSale;
  },

  // Kiosk Ledger Balance & Mercado Pago Withdrawals
  async getKioskLedgerBalance(
    institutionId?: string
  ): Promise<KioskLedgerBalance> {
    const targetInstitution = institutionId || DEFAULT_KIOSK_INSTITUTION_ID;

    const totalSalesCents =
      HISTORICAL_BASE_SALES_CENTS +
      mockSales
        .filter(
          (s) =>
            s.institutionId === targetInstitution && s.status === 'COMPLETED'
        )
        .reduce((sum, s) => sum + s.totalAmountCents, 0);

    const totalWithdrawnCents = mockWithdrawals
      .filter(
        (w) =>
          w.institutionId === targetInstitution &&
          (w.status === 'PROCESSED' || w.status === 'PENDING')
      )
      .reduce((sum, w) => sum + w.amountCents, 0);

    const availableBalanceCents = Math.max(
      0,
      totalSalesCents - totalWithdrawnCents
    );

    return {
      institutionId: targetInstitution,
      totalSalesCents,
      totalWithdrawnCents,
      availableBalanceCents,
      currency: 'ARS',
      lastMovementAt: mockSales[0]?.createdAt || new Date().toISOString(),
    };
  },

  async getKioskWithdrawals(
    institutionId?: string
  ): Promise<KioskWithdrawal[]> {
    if (institutionId) {
      return mockWithdrawals.filter((w) => w.institutionId === institutionId);
    }
    return [...mockWithdrawals];
  },

  async requestKioskWithdrawal(
    request: KioskWithdrawalRequestInput,
    institutionId?: string
  ): Promise<KioskWithdrawal> {
    const validated = KioskWithdrawalRequestSchema.parse(request);
    const targetInstitution = institutionId || DEFAULT_KIOSK_INSTITUTION_ID;

    // Idempotency check
    const existing = mockWithdrawals.find(
      (w) => w.idempotencyKey === validated.idempotencyKey
    );
    if (existing) {
      return { ...existing };
    }

    // Verify balance from ledger
    const balance = await this.getKioskLedgerBalance(targetInstitution);
    if (validated.amountCents > balance.availableBalanceCents) {
      const availableFormatted = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(balance.availableBalanceCents / 100);

      throw new Error(
        `Saldo insuficiente para retirar. Saldo disponible en libro mayor: ${availableFormatted}.`
      );
    }

    const newWithdrawal: KioskWithdrawal = {
      id: generateUuid(),
      institutionId: targetInstitution,
      amountCents: validated.amountCents,
      mercadoPagoAliasOrCvu: validated.mercadoPagoAliasOrCvu,
      idempotencyKey: validated.idempotencyKey,
      status: 'PROCESSED',
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };

    mockWithdrawals = [newWithdrawal, ...mockWithdrawals];
    return newWithdrawal;
  },

  // School Moderation Desk & Pickup Point
  async getExchangeItems(
    institutionId?: string,
    status?: ModerationStatus,
    mode?: ExchangeMode
  ): Promise<ExchangeItem[]> {
    let items = [...mockExchangeItems];
    if (institutionId) {
      items = items.filter((i) => i.institutionId === institutionId);
    }
    if (status) {
      items = items.filter((i) => i.status === status);
    }
    if (mode) {
      items = items.filter((i) => i.mode === mode);
    }
    return items;
  },

  async getExchangeItemById(id: string): Promise<ExchangeItem | null> {
    const item = mockExchangeItems.find((i) => i.id === id);
    return item ? { ...item } : null;
  },

  async moderateExchangeItem(
    payload: ModerateExchangeItemDto
  ): Promise<ExchangeItem> {
    const validated = ModerateExchangeItemSchema.parse(payload);
    const itemIndex = mockExchangeItems.findIndex((i) => i.id === validated.itemId);
    if (itemIndex === -1) {
      throw new Error(`Artículo con ID ${validated.itemId} no encontrado.`);
    }

    const currentItem = mockExchangeItems[itemIndex]!;
    const updatedItem: ExchangeItem = {
      ...currentItem,
      status: validated.status,
      moderatorNotes:
        validated.moderatorNotes !== undefined
          ? validated.moderatorNotes
          : currentItem.moderatorNotes,
      awardedPoints:
        validated.awardedPoints !== undefined
          ? validated.awardedPoints
          : currentItem.awardedPoints,
      updatedAt: new Date().toISOString(),
    };

    mockExchangeItems[itemIndex] = updatedItem;

    // If item delivered physically, award community points to student
    if (validated.status === 'DELIVERED' && updatedItem.awardedPoints > 0) {
      const student = mockStudentsRoster.find(
        (s) => s.studentId === updatedItem.studentId
      );
      if (student) {
        student.communityPoints += updatedItem.awardedPoints;
      }

      // Also update student's points on leaderboard
      const leaderboardEntry = mockLeaderboard.find(
        (l) => l.studentId === updatedItem.studentId
      );
      if (leaderboardEntry) {
        leaderboardEntry.accumulatedPoints += updatedItem.awardedPoints;
        mockLeaderboard.sort((a, b) => b.accumulatedPoints - a.accumulatedPoints);
        mockLeaderboard.forEach((entry, idx) => {
          entry.rank = idx + 1;
        });
      }
    }

    return { ...updatedItem };
  },

  // School Rewards & Badges ABM
  async getSchoolRewards(institutionId?: string): Promise<SchoolReward[]> {
    if (institutionId) {
      return mockSchoolRewards.filter((r) => r.institutionId === institutionId);
    }
    return [...mockSchoolRewards];
  },

  async createSchoolReward(input: SchoolReward): Promise<SchoolReward> {
    const validated = SchoolRewardSchema.parse(input);
    const newReward: SchoolReward = {
      id: validated.id || generateUuid(),
      institutionId: validated.institutionId,
      title: validated.title,
      description: validated.description,
      pointsCost: validated.pointsCost,
      stock: validated.stock,
      badgeImageUrl: validated.badgeImageUrl,
      isActive: validated.isActive ?? true,
    };

    mockSchoolRewards = [newReward, ...mockSchoolRewards];
    return newReward;
  },

  async updateSchoolReward(
    id: string,
    input: Partial<SchoolReward>
  ): Promise<SchoolReward> {
    const index = mockSchoolRewards.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Recompensa con ID ${id} no encontrada.`);
    }

    const current = mockSchoolRewards[index]!;
    const updated: SchoolReward = {
      ...current,
      ...input,
    };

    SchoolRewardSchema.parse(updated);
    mockSchoolRewards[index] = updated;
    return updated;
  },

  async deleteSchoolReward(id: string): Promise<boolean> {
    const initialLength = mockSchoolRewards.length;
    mockSchoolRewards = mockSchoolRewards.filter((r) => r.id !== id);
    return mockSchoolRewards.length < initialLength;
  },

  // School Leaderboard & Gamification Ranking
  async getSchoolLeaderboard(
    institutionId?: string
  ): Promise<LeaderboardEntry[]> {
    return [...mockLeaderboard].sort((a, b) => a.rank - b.rank);
  },

  // Reward Redemptions Management
  async getRewardRedemptions(
    institutionId?: string
  ): Promise<RewardRedemption[]> {
    if (institutionId) {
      return mockRedemptions.filter((r) => r.institutionId === institutionId);
    }
    return [...mockRedemptions];
  },

  async fulfillRewardRedemption(
    redemptionId: string
  ): Promise<RewardRedemption> {
    const redemption = mockRedemptions.find((r) => r.id === redemptionId);
    if (!redemption) {
      throw new Error(`Canje con ID ${redemptionId} no encontrado.`);
    }

    redemption.status = 'FULFILLED';
    redemption.fulfilledAt = new Date().toISOString();
    return { ...redemption };
  },

  // School Aggregated Reports Dashboard
  async getSchoolReportMetrics(
    institutionId?: string
  ): Promise<SchoolReportMetrics> {
    const targetInst = institutionId || DEFAULT_KIOSK_INSTITUTION_ID;
    const sales = mockSales.filter(
      (s) => s.institutionId === targetInst && s.status === 'COMPLETED'
    );
    const items = mockExchangeItems.filter(
      (i) => i.institutionId === targetInst
    );

    let healthyCount = 0;
    let candyCount = 0;
    let totalSpentCents = 0;
    const categoryMap = new Map<
      ProductCategory,
      { count: number; cents: number }
    >();

    for (const sale of sales) {
      for (const item of sale.items) {
        totalSpentCents += item.subtotalCents;
        const current = categoryMap.get(item.category) || { count: 0, cents: 0 };
        categoryMap.set(item.category, {
          count: current.count + item.quantity,
          cents: current.cents + item.subtotalCents,
        });

        if (item.category === 'HEALTHY_SNACK' || item.category === 'DRINK') {
          healthyCount += item.quantity;
        } else if (item.category === 'CANDY') {
          candyCount += item.quantity;
        }
      }
    }

    const totalFoodCount = healthyCount + candyCount;
    const healthyPercentage =
      totalFoodCount > 0 ? Math.round((healthyCount / totalFoodCount) * 100) : 75;
    const candyPercentage = totalFoodCount > 0 ? 100 - healthyPercentage : 25;

    const categoryBreakdown = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        itemCount: data.count,
        amountCents: data.cents,
        percentage:
          totalSpentCents > 0
            ? Math.round((data.cents / totalSpentCents) * 100)
            : 0,
      })
    );

    const itemsByMode = {
      BARTER: items.filter((i) => i.mode === 'BARTER').length,
      DONATION: items.filter((i) => i.mode === 'DONATION').length,
      LOAN: items.filter((i) => i.mode === 'LOAN').length,
    };

    const itemsByStatus = {
      PENDING: items.filter((i) => i.status === 'PENDING').length,
      APPROVED: items.filter((i) => i.status === 'APPROVED').length,
      REJECTED: items.filter((i) => i.status === 'REJECTED').length,
      DELIVERED: items.filter((i) => i.status === 'DELIVERED').length,
    };

    const totalReusedItems = itemsByStatus.DELIVERED;
    const totalCommunityPointsAwarded = items
      .filter((i) => i.status === 'DELIVERED')
      .reduce((sum, i) => sum + i.awardedPoints, 0);

    const uniqueStudents = new Set(items.map((i) => i.studentId));

    return {
      healthyCount,
      candyCount,
      healthyPercentage,
      candyPercentage,
      totalSpentCents,
      categoryBreakdown,
      totalReusedItems,
      itemsByMode,
      itemsByStatus,
      totalCommunityPointsAwarded,
      activeParticipantStudentsCount: uniqueStudents.size,
    };
  },

  // Super Admin Global Metrics & Automated Billing Calculation
  async getSuperAdminMetrics(): Promise<SuperAdminGlobalMetrics> {
    const activeSchools = mockInstitutions.filter((i) => i.status === 'ACTIVE');
    const totalActiveStudents = mockInstitutions.reduce(
      (sum, i) => sum + i.activeStudentsCount,
      0
    );

    let totalMonthlyBillingCents = 0;
    const institutionsBilling: InstitutionBillingRow[] = mockInstitutions.map(
      (inst) => {
        let calculatedMonthlyFeeCents = 0;
        if (inst.status === 'ACTIVE') {
          if (inst.billingPlanType === 'FIXED_MONTHLY') {
            calculatedMonthlyFeeCents = inst.monthlyFeeCents;
          } else {
            // PER_ACTIVE_STUDENT
            calculatedMonthlyFeeCents =
              inst.monthlyFeeCents * inst.activeStudentsCount;
          }
          totalMonthlyBillingCents += calculatedMonthlyFeeCents;
        }

        const schoolSales = mockSales
          .filter((s) => s.institutionId === inst.id && s.status === 'COMPLETED')
          .reduce((sum, s) => sum + s.totalAmountCents, 0);

        const kioskVolumeCents =
          inst.id === DEFAULT_KIOSK_INSTITUTION_ID
            ? HISTORICAL_BASE_SALES_CENTS + schoolSales
            : schoolSales;

        return {
          institutionId: inst.id,
          institutionName: inst.name,
          cuit: inst.cuit,
          status: inst.status,
          billingPlanType: inst.billingPlanType,
          monthlyRateCents: inst.monthlyFeeCents,
          activeStudentsCount: inst.activeStudentsCount,
          calculatedMonthlyFeeCents,
          kioskVolumeCents,
        };
      }
    );

    const totalKioskVolumeCents = institutionsBilling.reduce(
      (sum, row) => sum + row.kioskVolumeCents,
      0
    );

    return {
      totalSchoolsCount: mockInstitutions.length,
      activeSchoolsCount: activeSchools.length,
      totalActiveStudents,
      totalKioskVolumeCents,
      totalMonthlyBillingCents,
      institutionsBilling,
    };
  },

  // Reset to initial seed (useful for unit tests)
  reset(): void {
    mockInstitutions = [
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Colegio Belgrano Day School',
        cuit: '30-11223344-5',
        address: 'Av. Cramer 1850, CABA',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeeCents: 4500000,
        status: 'ACTIVE',
        activeStudentsCount: 420,
        createdAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'a81bc81b-dead-4e5d-abff-90865d1e13b1',
        name: 'Instituto San Martín de Tours',
        cuit: '30-22334455-6',
        address: 'San Martín 450, San Isidro, Buenos Aires',
        billingPlanType: 'PER_ACTIVE_STUDENT',
        monthlyFeeCents: 25000,
        status: 'ACTIVE',
        activeStudentsCount: 310,
        createdAt: '2026-01-15T09:30:00.000Z',
      },
      {
        id: 'c9a646d3-9c61-4cd9-bc15-35871b7691af',
        name: 'Escuela Técnica N° 1 Ing. Otto Krause',
        cuit: '30-33445566-7',
        address: 'Av. Paseo Colón 650, CABA',
        billingPlanType: 'FIXED_MONTHLY',
        monthlyFeeCents: 3500000,
        status: 'SUSPENDED',
        activeStudentsCount: 180,
        createdAt: '2026-02-01T11:00:00.000Z',
      },
    ];

    mockCatalogProducts = INITIAL_CATALOG_PRODUCTS.map((p) => ({ ...p }));
    mockSales = INITIAL_SALES.map((s) => ({
      ...s,
      items: s.items.map((i) => ({ ...i })),
    }));
    mockWithdrawals = INITIAL_WITHDRAWALS.map((w) => ({ ...w }));
    mockExchangeItems = INITIAL_EXCHANGE_ITEMS.map((item) => ({ ...item }));
    mockSchoolRewards = INITIAL_SCHOOL_REWARDS.map((rew) => ({ ...rew }));
    mockLeaderboard = INITIAL_LEADERBOARD_ENTRIES.map((entry) => ({
      ...entry,
      badges: [...entry.badges],
    }));
    mockRedemptions = INITIAL_REWARD_REDEMPTIONS.map((red) => ({ ...red }));
  },
};

