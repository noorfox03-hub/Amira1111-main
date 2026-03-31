-- --- Clean Slate Reset (Drop old tables) ---
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;

-- 1. Warehouses (Main and Clinics)
CREATE TABLE public.warehouses (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'clinic' -- 'main' or 'clinic'
);

-- 2. Items (Medicines and Tools)
CREATE TABLE public.items (
    id BIGINT PRIMARY KEY,              -- Item Code
    item_name TEXT NOT NULL,
    item_group TEXT,                    -- (Dental, Dermatology, Lab, etc.)
    unit_type TEXT,                     -- (PK, BOX, PCS)
    sale_price NUMERIC(10, 2) DEFAULT 0, -- Unit Cost
    cost_price NUMERIC(10, 2) DEFAULT 0, -- Cost Price for profit calculation
    vat NUMERIC(5, 2) DEFAULT 0,        -- VAT Percentage
    min_limit INTEGER DEFAULT 5,          -- Stock alert threshold
    conversion_factor INTEGER DEFAULT 1 -- Pieces per box
);

-- 3. Inventory (Current Stock)
CREATE TABLE public.inventory (
    warehouse_id INTEGER REFERENCES public.warehouses(id),
    item_id BIGINT REFERENCES public.items(id),
    quantity NUMERIC(10, 2) DEFAULT 0,
    PRIMARY KEY (warehouse_id, item_id)
);

-- 4. Transactions (History Log)
CREATE TABLE public.transactions (
    id SERIAL PRIMARY KEY,
    type TEXT CHECK (type IN ('إضافة', 'صرف', 'تحويل')), 
    from_warehouse_id INTEGER REFERENCES public.warehouses(id),
    to_warehouse_id INTEGER REFERENCES public.warehouses(id),
    item_id BIGINT REFERENCES public.items(id),
    quantity NUMERIC(10, 2),
    total_price NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    note TEXT
);

-- --- Enable RLS ---
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for warehouses" ON public.warehouses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for items" ON public.items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

-- --- Seed Data ---

-- 1. Warehouses
INSERT INTO public.warehouses (name, type) VALUES 
('المخزن الرئيسي', 'main'),
('عيادة 1', 'clinic'),
('عيادة 2', 'clinic'),
('عيادة 3', 'clinic'),
('عيادة 4', 'clinic'),
('عيادة 5', 'clinic');

-- 2. Items
INSERT INTO public.items (id, item_name, item_group, unit_type, sale_price) VALUES
(262, 'ENDO FILL', 'مجموعة االسنان', 'PK', 195.00),
(264, 'TETRIC N- CERAM REFILL A1', 'مجموعة االسنان', 'PK', 85.00),
(267, 'DYCAL', 'مجموعة االسنان', 'PK', 78.00),
(307, 'ROOTT', 'مجموعة االسنان', 'PK', 400.00),
(309, 'مزيب فلر', 'مجموعة الجلدية', 'PK', 260.00),
(435, 'LIDOCAINE 2%', 'مجموعة االسنان', 'BOX', 91.00),
(439, 'COMPOSIT A3.5', 'مجموعة االسنان', 'PCE', 110.00),
(406, 'Hand soap', 'مجموعة مستهلكات', 'PK', 6.74),
(319, 'ORTHODONTIC WAX PK/50', 'مجموعة االسنان', 'PK', 100.00),
(389, 'قناع وجهه', 'مجموعة الجلدية', 'PK', 2.55),
(670, 'K FILE 20 L 21', 'مجموعة االسنان', 'BOX', 7.50),
(466, 'K FILE 6 L25', 'مجموعة االسنان', 'BOX', 15.75),
(467, 'K FILE 30 L25', 'مجموعة االسنان', 'PCK', 7.50),
(476, 'H FILE 8 L 25', 'مجموعة االسنان', 'PCK', 15.75),
(641, 'H FILE 40', 'مجموعة االسنان', 'BOX', 15.75),
(427, 'GATES DRILIS', 'مجموعة االسنان', 'PK', 32.00),
(126, 'K FILES STAINLESS STEEL #8', 'مجموعة االسنان', 'PS', 7.50),
(120, 'GATES DRILLS 32MM #3', 'مجموعة االسنان', 'PS', 26.25),
(7, 'SODIUM HYPOCHLORITE', 'مجموعة االسنان', 'ML 500', 8.00),
(8, 'FACE SHIELD', 'مجموعة االسنان', 'ML 500', 19.00),
(70, 'DANTAL BIB', 'مجموعة االسنان', 'PK', 8.00),
(20, 'ALCOHOL PREP PAD', 'مجموعة االسنان', 'BOX', 3.50),
(183, 'ISOLATION GOWN', 'مجموعة االسنان', 'PK', 8.50),
(241, 'HANDY GAL BIG 1 L', 'مجموعة االسنان', 'PK', 15.00),
(76, 'NON STERILE GAUZE 4*4', 'مجموعة االسنان', 'PK', 4.50),
(452, 'ENDO FROST', 'مجموعة االسنان', 'PCS', 70.00),
(537, 'wire niti 19.25 UPPER', 'مجموعة االسنان', 'PCK', 38.00),
(624, 'TEOSYAL TEOXANE RHA4', 'مجموعة الجلدية', 'PCS', 800.00),
(611, 'nabota boox', 'مجموعة الجلدية', 'VIAL', 391.00),
(352, 'BONDING TUBE MBT', 'مجموعة االسنان', 'PK', 215.00),
(501, 'DAMOND BRACKIT', 'مجموعة االسنان', 'PCK', 750.00),
(495, 'زرعه HIOSSEN امريكي', 'مجموعة االسنان', 'BOX', 450.00);

-- Update conversion factors for boxes (Example)
UPDATE public.items SET conversion_factor = 50 WHERE unit_type = 'BOX';

-- --- RPC Functions (Updated for Integer/BigInt IDs) ---

-- Drop existing functions to avoid "Multiple Choices" error (PostgreSQL overloading)
DROP FUNCTION IF EXISTS public.dispense_item_v1(uuid, uuid, integer, numeric, text);
DROP FUNCTION IF EXISTS public.dispense_item_v1(integer, bigint, numeric, numeric, text);

-- 1. Dispense Item
CREATE OR REPLACE FUNCTION public.dispense_item_v1(
  p_warehouse_id INTEGER,
  p_item_id BIGINT,
  p_qty NUMERIC,
  p_total_cost NUMERIC,
  p_to_warehouse_id INTEGER DEFAULT NULL,
  p_note TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE public.inventory 
  SET quantity = quantity - p_qty
  WHERE warehouse_id = p_warehouse_id AND item_id = p_item_id;

  INSERT INTO public.transactions (type, from_warehouse_id, to_warehouse_id, item_id, quantity, total_price, note)
  VALUES ('صرف', p_warehouse_id, p_to_warehouse_id, p_item_id, p_qty, p_total_cost, p_note);
END;
$$ LANGUAGE plpgsql;

-- Drop existing functions to avoid "Multiple Choices" error
DROP FUNCTION IF EXISTS public.transfer_item_v1(uuid, uuid, uuid, integer, numeric, text);
DROP FUNCTION IF EXISTS public.transfer_item_v1(integer, integer, bigint, numeric, numeric, text);

-- 2. Transfer Item
CREATE OR REPLACE FUNCTION public.transfer_item_v1(

  p_from_warehouse_id INTEGER,
  p_to_warehouse_id INTEGER,
  p_item_id BIGINT,
  p_qty NUMERIC,
  p_total_cost NUMERIC,
  p_note TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE public.inventory 
  SET quantity = quantity - p_qty
  WHERE warehouse_id = p_from_warehouse_id AND item_id = p_item_id;

  INSERT INTO public.inventory (warehouse_id, item_id, quantity)
  VALUES (p_to_warehouse_id, p_item_id, p_qty)
  ON CONFLICT (warehouse_id, item_id) 
  DO UPDATE SET quantity = public.inventory.quantity + p_qty;

  INSERT INTO public.transactions (type, from_warehouse_id, to_warehouse_id, item_id, quantity, total_price, note)
  VALUES ('تحويل', p_from_warehouse_id, p_to_warehouse_id, p_item_id, p_qty, p_total_cost, p_note);
END;
$$ LANGUAGE plpgsql;

-- Drop existing functions to avoid "Multiple Choices" error
DROP FUNCTION IF EXISTS public.add_stock_v1(uuid, uuid, integer, numeric, text);
DROP FUNCTION IF EXISTS public.add_stock_v1(integer, bigint, numeric, numeric, text);

-- 3. Add Stock
CREATE OR REPLACE FUNCTION public.add_stock_v1(

  p_warehouse_id INTEGER,
  p_item_id BIGINT,
  p_qty NUMERIC,
  p_total_cost NUMERIC,
  p_note TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.inventory (warehouse_id, item_id, quantity)
  VALUES (p_warehouse_id, p_item_id, p_qty)
  ON CONFLICT (warehouse_id, item_id) 
  DO UPDATE SET quantity = public.inventory.quantity + p_qty;

  INSERT INTO public.transactions (type, to_warehouse_id, item_id, quantity, total_price, note)
  VALUES ('إضافة', p_warehouse_id, p_item_id, p_qty, p_total_cost, p_note);
END;
$$ LANGUAGE plpgsql;

-- --- FINAL SEEDING: Populate all clinics with stock ---
-- This ensures all 25+ items appear in the "Dispense" dropdown for all 5 clinics

-- 1. Ensure inventory has records for all warehouse/item combinations
INSERT INTO public.inventory (warehouse_id, item_id, quantity)
SELECT w.id, i.id, 100 -- Starting with 100 pieces for everything
FROM public.warehouses w, public.items i
ON CONFLICT (warehouse_id, item_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- Analytics Views (Re-verified)
CREATE OR REPLACE VIEW public.monthly_clinic_report AS
SELECT 
    w.name AS clinic_name,
    i.item_name AS item_name,
    SUM(t.quantity) AS total_qty_consumed,
    SUM(t.total_price) AS total_cost,
    TO_CHAR(t.created_at, 'YYYY-MM') AS report_month
FROM public.transactions t
JOIN public.warehouses w ON t.from_warehouse_id = w.id
JOIN public.items i ON t.item_id = i.id
WHERE t.type = 'صرف'
GROUP BY clinic_name, item_name, report_month;

