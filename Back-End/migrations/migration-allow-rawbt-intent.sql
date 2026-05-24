-- Migration: Allow rawbt_intent in shop_settings print_method
-- This migration updates the existing CHECK constraint so rawbt_intent is accepted.

ALTER TABLE coffeepos.shop_settings
DROP CONSTRAINT IF EXISTS shop_settings_print_method_check;

ALTER TABLE coffeepos.shop_settings
ADD CONSTRAINT shop_settings_print_method_check
CHECK (print_method IN ('browser', 'rawbt', 'network', 'rawbt_intent'));
