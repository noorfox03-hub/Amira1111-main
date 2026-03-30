-- 1. تحديث وظيفة الصرف لتشمل العيادة المستهدفة
CREATE OR REPLACE FUNCTION public.dispense_item_v1(
  p_warehouse_id INTEGER,
  p_item_id BIGINT,
  p_qty NUMERIC,
  p_total_cost NUMERIC,
  p_note TEXT DEFAULT NULL,
  p_to_warehouse_id INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- الخصم من المستودع الرئيسي (أو المستودع المصدر)
  UPDATE public.inventory 
  SET quantity = quantity - p_qty
  WHERE warehouse_id = p_warehouse_id AND item_id = p_item_id;

  -- تسجيل العملية مع تحديد العيادة المستلمة في حقل to_warehouse_id
  INSERT INTO public.transactions (type, from_warehouse_id, to_warehouse_id, item_id, quantity, total_price, note)
  VALUES ('صرف', p_warehouse_id, p_to_warehouse_id, p_item_id, p_qty, p_total_cost, p_note);
END;
$$ LANGUAGE plpgsql;

-- 2. تحديث مرئية التقارير (View) لتعكس الاستهلاك بناءً على العيادة المستهدفة
CREATE OR REPLACE VIEW public.monthly_clinic_report AS
SELECT 
    w.name AS clinic_name,
    i.item_name AS item_name,
    SUM(t.quantity) AS total_qty_consumed,
    SUM(t.total_price) AS total_cost,
    TO_CHAR(t.created_at, 'YYYY-MM') AS report_month
FROM public.transactions t
JOIN public.warehouses w ON (
    CASE 
        WHEN t.type = 'صرف' AND t.to_warehouse_id IS NOT NULL THEN t.to_warehouse_id = w.id
        ELSE t.from_warehouse_id = w.id
    END
)
JOIN public.items i ON t.item_id = i.id
WHERE t.type = 'صرف'
GROUP BY clinic_name, item_name, report_month;
