import { z } from 'zod';
export declare const CUIT_REGEX: RegExp;
export declare const CreateInstitutionSchema: z.ZodObject<{
    name: z.ZodString;
    cuit: z.ZodString;
    address: z.ZodString;
    billingPlanType: z.ZodEnum<["FIXED_MONTHLY", "PER_ACTIVE_STUDENT"]>;
    monthlyFeeCents: z.ZodNumber;
    schoolAdminEmail: z.ZodString;
    kioskEmail: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    cuit: string;
    address: string;
    billingPlanType: "FIXED_MONTHLY" | "PER_ACTIVE_STUDENT";
    monthlyFeeCents: number;
    schoolAdminEmail: string;
    kioskEmail: string;
}, {
    name: string;
    cuit: string;
    address: string;
    billingPlanType: "FIXED_MONTHLY" | "PER_ACTIVE_STUDENT";
    monthlyFeeCents: number;
    schoolAdminEmail: string;
    kioskEmail: string;
}>;
export declare const InstitutionDtoSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    cuit: z.ZodString;
    address: z.ZodString;
    billingPlanType: z.ZodEnum<["FIXED_MONTHLY", "PER_ACTIVE_STUDENT"]>;
    monthlyFeeCents: z.ZodNumber;
    status: z.ZodEnum<["ACTIVE", "SUSPENDED"]>;
    activeStudentsCount: z.ZodNumber;
    createdAt: z.ZodUnion<[z.ZodString, z.ZodDate]>;
}, "strip", z.ZodTypeAny, {
    status: "ACTIVE" | "SUSPENDED";
    name: string;
    cuit: string;
    address: string;
    billingPlanType: "FIXED_MONTHLY" | "PER_ACTIVE_STUDENT";
    monthlyFeeCents: number;
    id: string;
    activeStudentsCount: number;
    createdAt: string | Date;
}, {
    status: "ACTIVE" | "SUSPENDED";
    name: string;
    cuit: string;
    address: string;
    billingPlanType: "FIXED_MONTHLY" | "PER_ACTIVE_STUDENT";
    monthlyFeeCents: number;
    id: string;
    activeStudentsCount: number;
    createdAt: string | Date;
}>;
export declare const CreateInvitationSchema: z.ZodObject<{
    institutionId: z.ZodString;
    code: z.ZodOptional<z.ZodString>;
    maxUses: z.ZodOptional<z.ZodNumber>;
    expiresAt: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
}, "strip", z.ZodTypeAny, {
    institutionId: string;
    code?: string | undefined;
    maxUses?: number | undefined;
    expiresAt?: string | Date | undefined;
}, {
    institutionId: string;
    code?: string | undefined;
    maxUses?: number | undefined;
    expiresAt?: string | Date | undefined;
}>;
export declare const ValidateInviteCodeSchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
//# sourceMappingURL=institution.schema.d.ts.map