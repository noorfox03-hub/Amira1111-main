-- ====================================================================
-- SQL Archive Search: Last 4 Operations per Item (1001-1285)
-- Prepared for: Ms. Amira
-- This query helps identify "the version before the modification"
-- ====================================================================

WITH RankedTransactions AS (
    SELECT 
        t.id AS transaction_id,
        t.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Riyadh' AS "تاريخ_العملية",
        t.type AS "العملية",
        t.item_id AS "كود_الصنف",
        i.item_name AS "اسم_الصنف",
        t.quantity AS "الكمية",
        w_from.name AS "من_مستودع",
        w_to.name AS "إلى_مستودع",
        t.note AS "ملاحظات",
        -- Window function to pick the last 4 records per item
        ROW_NUMBER() OVER (PARTITION BY t.item_id ORDER BY t.created_at DESC) as rank
    FROM public.transactions t
    JOIN public.items i ON t.item_id = i.id
    LEFT JOIN public.warehouses w_from ON t.from_warehouse_id = w_from.id
    LEFT JOIN public.warehouses w_to ON t.to_warehouse_id = w_to.id
    WHERE t.item_id >= 1001
)
SELECT 
    "كود_الصنف",
    "اسم_الصنف",
    "العملية",
    "الكمية",
    "تاريخ_العملية",
    "من_مستودع",
    "إلى_مستودع",
    "ملاحظات"
FROM RankedTransactions
WHERE rank <= 4
ORDER BY "كود_الصنف" ASC, "تاريخ_العملية" DESC;

-- ====================================================================
-- Instructions:
-- 1. Copy this entire script.
-- 2. Go to your Supabase Dashboard -> SQL Editor.
-- 3. Paste and click "Run".
-- 4. Review the "العملية" and "تاريخ_العملية" to find the data you need.
-- ====================================================================
