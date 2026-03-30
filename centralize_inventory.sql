-- 1. نقل كافة أرصدة المستودعات الأخرى إلى المستودع الرئيسي
-- نفترض أن المستودع الرئيسي يحمل المعرف (id) رقم 1 بناءً على بيانات التأسيس
DO $$
DECLARE
    main_id INTEGER := (SELECT id FROM warehouses WHERE type = 'main' LIMIT 1);
    rec RECORD;
BEGIN
    FOR rec IN SELECT warehouse_id, item_id, quantity FROM inventory WHERE warehouse_id != main_id LOOP
        -- إضافة الكمية للمستودع الرئيسي
        INSERT INTO inventory (warehouse_id, item_id, quantity)
        VALUES (main_id, rec.item_id, rec.quantity)
        ON CONFLICT (warehouse_id, item_id)
        DO UPDATE SET quantity = inventory.quantity + rec.quantity;
    END LOOP;

    -- 2. إزالة سجلات المخزون للعيادات لتصفيرها تماماً
    DELETE FROM inventory WHERE warehouse_id != main_id;
    
    -- 3. (اختياري) تسجيل حركة تصحيحية شاملة
    INSERT INTO transactions (type, to_warehouse_id, item_id, quantity, note)
    VALUES ('إضافة', main_id, null, 0, 'تم تجميع كافة مخزون العيادات في المستودع الرئيسي');
END $$;
