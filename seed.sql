```sql
-- ============================================================================
-- Seed Data for S.R. Electronics Park Unified Treasury & POS
-- Idempotent: Safe to re-run without duplicating existing records
-- ============================================================================

INSERT INTO accounts (account_name, account_type, account_number, bank_name, deal_id, balance, added_by)
VALUES
    ('Minister / Salsabilah', 'Corporate Treasury', '5100029481', 'SAP ECC 6.0 / Minister', 'DEAL002905', 1920000.00, 'system_seed'),
    ('Butterfly Marketing', 'Corporate Treasury', '3000002272', 'Butterfly Marketing Ltd.', NULL, 10000000.00, 'system_seed'),
    ('Pubali Bank Merchant POS', 'Merchant POS', '4370901017008', 'Pubali Bank PLC', NULL, 54.91, 'system_seed'),
    ('Dutch-Bangla Bank CC', 'Settlement CC', '3107053000068', 'Dutch-Bangla Bank PLC', NULL, 0.00, 'system_seed'),
    ('BRAC Bank EMI Loan', 'EMI Loan', '150120-EMI', 'BRAC Bank PLC', NULL, 45000.00, 'system_seed'),
    ('DMCB Savings', 'Savings', '083-4001', 'DMCB', NULL, 100.00, 'system_seed'),
    ('DMCB Investment', 'Investment', '083-7168', 'DMCB', NULL, 2100.00, 'system_seed')
ON CONFLICT (account_number) DO NOTHING;
```
