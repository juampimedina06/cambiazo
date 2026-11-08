export declare const CURRENCY: "ARS";
export declare const QR_PAYMENT_TOKEN_TTL_SECONDS = 120;
export declare const BRAND_COLORS: {
    readonly canvas: "#F8F7FF";
    readonly surface: "#FFFFFF";
    readonly primary: "#6C3CE9";
    readonly primaryDark: "#4C1D95";
    readonly primarySoft: "#EDE9FE";
    readonly accentYellow: "#FACC15";
    readonly accentMint: "#10B981";
    readonly textPrimary: "#1E1B4B";
    readonly textSecondary: "#64748B";
    readonly statusWarning: "#F97316";
    readonly statusDanger: "#EF4444";
};
export declare const DOMAIN_ERROR_CODES: {
    readonly TENANT_MISMATCH: "TENANT_MISMATCH";
    readonly PARENTAL_CONSENT_REQUIRED: "PARENTAL_CONSENT_REQUIRED";
    readonly PARENTAL_CONSENT_REVOKED: "PARENTAL_CONSENT_REVOKED";
    readonly ACCOUNT_PAUSED: "ACCOUNT_PAUSED";
    readonly DAILY_LIMIT_EXCEEDED: "DAILY_LIMIT_EXCEEDED";
    readonly WEEKLY_LIMIT_EXCEEDED: "WEEKLY_LIMIT_EXCEEDED";
    readonly CATEGORY_BLOCKED: "CATEGORY_BLOCKED";
    readonly INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS";
    readonly IDEMPOTENCY_KEY_DUPLICATED: "IDEMPOTENCY_KEY_DUPLICATED";
    readonly QR_TOKEN_EXPIRED: "QR_TOKEN_EXPIRED";
    readonly INVALID_INVITATION_CODE: "INVALID_INVITATION_CODE";
    readonly UNAUTHORIZED_ROLE: "UNAUTHORIZED_ROLE";
    readonly IMMUTABLE_RECORD_VIOLATION: "IMMUTABLE_RECORD_VIOLATION";
    readonly INVALID_COMMUNITY_CONVERSION: "INVALID_COMMUNITY_CONVERSION";
};
export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[keyof typeof DOMAIN_ERROR_CODES];
//# sourceMappingURL=index.d.ts.map