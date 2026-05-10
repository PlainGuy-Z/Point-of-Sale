    -- Migration Sprint 6: Cart Refactor dengan Item Descriptions
    -- Purpose:
    --   1. Add 'notes' field untuk transaction (order_description)
    --   2. Add 'description' field untuk transaction_items (per-item notes)

    BEGIN;

    -- 1. Add 'notes' column to transactions (for order_description)
    ALTER TABLE coffeepos.transactions 
    ADD COLUMN IF NOT EXISTS notes TEXT;

    -- 2. Add 'description' column to transaction_items (for per-item customization notes)
    ALTER TABLE coffeepos.transaction_items 
    ADD COLUMN IF NOT EXISTS description TEXT;

    COMMIT;
