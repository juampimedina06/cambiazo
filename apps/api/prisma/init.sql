-- =============================================================================
-- CAMBIAZO — INITIAL DATABASE MIGRATION & POSTGRESQL TRIGGERS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- 1. TRIGGER FUNCTION: IMMUTABLE DOUBLE-ENTRY LEDGER
-- Rejects any attempt to UPDATE or DELETE ledger entries or transactions.
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'VIOLATION OF CORE DOMAIN INVARIANT: Ledger entries and transactions are strictly immutable (append-only). UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------
-- 2. APPLY IMMUTABILITY TRIGGERS
-- -------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_prevent_ledger_entry_mutation ON ledger_entries;
CREATE TRIGGER trg_prevent_ledger_entry_mutation
BEFORE UPDATE OR DELETE ON ledger_entries
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

DROP TRIGGER IF EXISTS trg_prevent_ledger_transaction_mutation ON ledger_transactions;
CREATE TRIGGER trg_prevent_ledger_transaction_mutation
BEFORE UPDATE OR DELETE ON ledger_transactions
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

-- -------------------------------------------------------------
-- 3. ROW-LEVEL SECURITY (RLS) FOR MULTI-TENANCY (SUPABASE / POSTGRES)
-- -------------------------------------------------------------
-- Example policy enforcement using the session variable `app.current_institution_id`

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Base Tenant Policy Macro (bypassable for SUPER_ADMIN when institution_id is null):
CREATE OR REPLACE FUNCTION current_app_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_institution_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Accounts RLS Policy
DROP POLICY IF EXISTS tenant_isolation_accounts ON accounts;
CREATE POLICY tenant_isolation_accounts ON accounts
    FOR ALL
    USING (
        current_app_tenant_id() IS NULL 
        OR institution_id = current_app_tenant_id()
    );

-- Ledger Entries RLS Policy
DROP POLICY IF EXISTS tenant_isolation_ledger_entries ON ledger_entries;
CREATE POLICY tenant_isolation_ledger_entries ON ledger_entries
    FOR ALL
    USING (
        current_app_tenant_id() IS NULL 
        OR institution_id = current_app_tenant_id()
    );

-- Catalog Products RLS Policy
DROP POLICY IF EXISTS tenant_isolation_catalog_products ON catalog_products;
CREATE POLICY tenant_isolation_catalog_products ON catalog_products
    FOR ALL
    USING (
        current_app_tenant_id() IS NULL 
        OR institution_id = current_app_tenant_id()
    );
