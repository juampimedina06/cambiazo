import { z } from 'zod';
export declare const TopUpPreferenceRequestSchema: z.ZodObject<{
    studentId: z.ZodString;
    amountCents: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    studentId: string;
    amountCents: number;
}, {
    studentId: string;
    amountCents: number;
}>;
export declare const MercadoPagoWebhookPayloadSchema: z.ZodObject<{
    id: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    type: z.ZodString;
    data: z.ZodObject<{
        id: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    }, "strip", z.ZodTypeAny, {
        id: string | number;
    }, {
        id: string | number;
    }>;
    externalReference: z.ZodOptional<z.ZodString>;
    external_reference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string | number;
    data: {
        id: string | number;
    };
    externalReference?: string | undefined;
    external_reference?: string | undefined;
}, {
    type: string;
    id: string | number;
    data: {
        id: string | number;
    };
    externalReference?: string | undefined;
    external_reference?: string | undefined;
}>;
export declare const CreateCatalogProductSchema: z.ZodObject<{
    institutionId: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<["HEALTHY_SNACK", "DRINK", "CANDY", "HOT_MEAL", "STATIONERY"]>;
    priceCents: z.ZodNumber;
    stock: z.ZodNumber;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    institutionId: string;
    category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
    priceCents: number;
    stock: number;
    isActive: boolean;
}, {
    name: string;
    institutionId: string;
    category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
    priceCents: number;
    stock: number;
    isActive?: boolean | undefined;
}>;
export declare const CatalogProductSchema: z.ZodObject<{
    institutionId: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<["HEALTHY_SNACK", "DRINK", "CANDY", "HOT_MEAL", "STATIONERY"]>;
    priceCents: z.ZodNumber;
    stock: z.ZodNumber;
    isActive: z.ZodDefault<z.ZodBoolean>;
} & {
    id: z.ZodString;
    createdAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    institutionId: string;
    category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
    priceCents: number;
    stock: number;
    isActive: boolean;
    createdAt?: string | Date | undefined;
    updatedAt?: string | Date | undefined;
}, {
    name: string;
    id: string;
    institutionId: string;
    category: "HEALTHY_SNACK" | "DRINK" | "CANDY" | "HOT_MEAL" | "STATIONERY";
    priceCents: number;
    stock: number;
    createdAt?: string | Date | undefined;
    isActive?: boolean | undefined;
    updatedAt?: string | Date | undefined;
}>;
export declare const QrPaymentTokenSchema: z.ZodObject<{
    token: z.ZodString;
    studentId: z.ZodString;
    institutionId: z.ZodString;
    expiresAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    institutionId: string;
    expiresAt: string;
    studentId: string;
    token: string;
}, {
    institutionId: string;
    expiresAt: string;
    studentId: string;
    token: string;
}>;
export declare const ChargeQrItemSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
}, {
    productId: string;
    quantity: number;
}>;
export declare const ChargeQrRequestSchema: z.ZodObject<{
    paymentTokenOrCode: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
    }, {
        productId: string;
        quantity: number;
    }>, "many">;
    idempotencyKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    paymentTokenOrCode: string;
    items: {
        productId: string;
        quantity: number;
    }[];
    idempotencyKey: string;
}, {
    paymentTokenOrCode: string;
    items: {
        productId: string;
        quantity: number;
    }[];
    idempotencyKey: string;
}>;
export declare const KioskWithdrawalRequestSchema: z.ZodObject<{
    amountCents: z.ZodNumber;
    mercadoPagoAliasOrCvu: z.ZodString;
    idempotencyKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    amountCents: number;
    idempotencyKey: string;
    mercadoPagoAliasOrCvu: string;
}, {
    amountCents: number;
    idempotencyKey: string;
    mercadoPagoAliasOrCvu: string;
}>;
//# sourceMappingURL=ledger.schema.d.ts.map