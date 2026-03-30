import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { Item, Warehouse, InventoryRecord, Transaction } from '@/types/inventory';

interface InventoryStore {
  items: Item[];
  warehouses: Warehouse[];
  inventory: InventoryRecord[];
  transactions: Transaction[];
  monthlyReport: any[];
  isLoading: boolean;

  error: string | null;

  // Init
  fetchData: () => Promise<void>;
  fetchMonthlyReport: () => Promise<void>;


  // Getters
  getItemStock: (warehouseId: string, itemId: string) => number;
  getStockMap: () => Record<string, number>; // إضافة خريطة أرصدة سريعة
  getWarehouseItems: (warehouseId: string) => Array<InventoryRecord & { item: Item }>;
  getLowStockItems: (warehouseId: string) => Array<InventoryRecord & { item: Item }>;
  getItemById: (id: string) => Item | undefined;
  getWarehouseById: (id: string) => Warehouse | undefined;

  // Actions
  dispenseItem: (warehouseId: string, itemId: string, quantity: number, unit: 'piece' | 'box') => Promise<{ success: boolean; message: string; finalQty?: number; totalPrice?: number }>;
  transferItem: (fromWarehouseId: string, toWarehouseId: string, itemId: string, quantity: number, unit: 'piece' | 'box') => Promise<{ success: boolean; message: string }>;
  addStock: (warehouseId: string, itemId: string, quantity: number, unit: 'piece' | 'box') => Promise<{ finalQty: number }>;
  addItem: (item: Item) => Promise<void>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // Warehouse Actions
  addWarehouse: (name: string) => Promise<void>;
  updateWarehouse: (id: string, name: string) => Promise<void>;
  deleteWarehouse: (id: string) => Promise<void>;

  // System Actions
  resetTransactions: () => Promise<void>;
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  warehouses: [],
  inventory: [],
  transactions: [],
  monthlyReport: [],
  isLoading: true,

  error: null,

  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      const { items, warehouses, inventory, transactions } = get();

      const [itemsRes, whRes, invRes, txRes] = await Promise.all([
        supabase.from('items').select('*'),
        supabase.from('warehouses').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('transactions').select('*').order('created_at', { ascending: false })
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (whRes.error) throw whRes.error;
      if (invRes.error) throw invRes.error;
      if (txRes.error) throw txRes.error;

      set({
        items: (itemsRes.data || []).map(r => ({
          id: String(r.id),
          name: r.item_name,
          unitType: r.unit_type,
          conversionFactor: r.conversion_factor || 1,
          purchasePrice: Number(r.cost_price),
          salePrice: Number(r.sale_price),
          vat: Number(r.vat || 0),
          minLimit: r.min_limit,
        })),
        warehouses: (whRes.data || []).map(r => ({ id: String(r.id), name: r.name, type: r.type as 'main' | 'clinic' })),
        inventory: (invRes.data || []).map(r => ({ warehouseId: String(r.warehouse_id), itemId: String(r.item_id), quantity: Number(r.quantity) })),
        transactions: (txRes.data || []).map(r => ({
          id: String(r.id),
          type: r.type === 'صرف' ? 'dispense' : r.type === 'إضافة' ? 'add' : 'transfer',
          fromWarehouseId: r.from_warehouse_id ? String(r.from_warehouse_id) : undefined,
          toWarehouseId: r.to_warehouse_id ? String(r.to_warehouse_id) : undefined,
          itemId: String(r.item_id),
          quantity: Number(r.quantity),
          totalPrice: Number(r.total_price),
          // تحويل المسافة إلى T لضمان التوافق مع متصفحات الموبايل
          timestamp: new Date(String(r.created_at).replace(' ', 'T')),
          note: r.note,
        })),

        isLoading: false
      });

      // Simple real-time subscription for live updates
      supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            console.log('Change received!', payload);
            get().fetchData(); // Simplest way to ensure "Live" state without complex local merging
          }
        )
        .subscribe();

    } catch (error: any) {
      console.error('Fetch error:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  fetchMonthlyReport: async () => {
    const { data, error } = await supabase.from('monthly_clinic_report').select('*');
    if (!error) set({ monthlyReport: data || [] });
  },


  getItemById: (id) => get().items.find(i => i.id === id),
  getWarehouseById: (id) => get().warehouses.find(w => w.id === id),

  getItemStock: (warehouseId, itemId) => {
    const rec = get().inventory.find(r => r.warehouseId === warehouseId && r.itemId === itemId);
    return rec?.quantity ?? 0;
  },

  getStockMap: () => {
    const { inventory } = get();
    const map: Record<string, number> = {};
    inventory.forEach(r => {
      map[`${r.warehouseId}-${r.itemId}`] = r.quantity;
    });
    return map;
  },

  getWarehouseItems: (warehouseId) => {
    const { inventory, items } = get();
    return inventory
      .filter(r => r.warehouseId === warehouseId)
      .map(r => ({ ...r, item: items.find(i => i.id === r.itemId)! }))
      .filter(r => r.item);
  },

  getLowStockItems: (warehouseId) => {
    return get().getWarehouseItems(warehouseId).filter(r => r.quantity <= r.item.minLimit);
  },

  dispenseItem: async (warehouseId, itemId, quantity, unit) => {
    const state = get();
    const item = state.getItemById(itemId);
    if (!item) return { success: false, message: 'الصنف غير موجود' };

    const finalQty = unit === 'box' ? quantity * item.conversionFactor : quantity;
    const currentStock = state.getItemStock(warehouseId, itemId);

    if (finalQty > currentStock) {
      return { success: false, message: `لا يوجد رصيد كافٍ. المتاح ${currentStock} قطعة فقط.` };
    }

    const totalPrice = finalQty * item.salePrice;

    // Optimistic Update
    const previousInventory = [...state.inventory];
    const previousTransactions = [...state.transactions];
    const tempTxId = crypto.randomUUID();

    const tempTx: Transaction = {
      id: tempTxId,
      type: 'dispense',
      fromWarehouseId: warehouseId,
      itemId,
      quantity: finalQty,
      totalPrice,
      timestamp: new Date(),
    };

    set({
      inventory: state.inventory.map(r =>
        r.warehouseId === warehouseId && r.itemId === itemId
          ? { ...r, quantity: r.quantity - finalQty }
          : r
      ),
      transactions: [tempTx, ...state.transactions],
    });

    try {
      // Call RPC for atomic transaction
      const { error: rpcErr } = await supabase.rpc('dispense_item_v1', {
        p_warehouse_id: Number(warehouseId),
        p_item_id: Number(itemId),
        p_qty: finalQty,
        p_total_cost: totalPrice
      });


      if (rpcErr) throw rpcErr;

      // Update local state (Optimistic sync or refresh)
      // Since we already did it optimistically, we just need to settle the temp ID if we were using it for lists
      // For simplicity, we can just re-fetch latest transactions to get the real DB ID
      get().fetchData();

      return { success: true, message: `تم صرف ${finalQty} قطعة بنجاح. التكلفة: ${totalPrice} ريال`, finalQty, totalPrice };
    } catch (err: any) {
      set({ inventory: previousInventory, transactions: previousTransactions }); // Rollback
      return { success: false, message: err.message || 'حدث خطأ أثناء الصرف' };
    }
  },

  transferItem: async (fromWarehouseId, toWarehouseId, itemId, quantity, unit) => {
    const state = get();
    const item = state.getItemById(itemId);
    if (!item) return { success: false, message: 'الصنف غير موجود' };

    const finalQty = unit === 'box' ? quantity * item.conversionFactor : quantity;
    const currentStock = state.getItemStock(fromWarehouseId, itemId);

    if (finalQty > currentStock) {
      return { success: false, message: `لا يوجد رصيد كافٍ في المصدر. المتاح ${currentStock} قطعة فقط.` };
    }

    const totalPrice = finalQty * item.salePrice;

    // Optimistic Update
    const previousInventory = [...state.inventory];
    const previousTransactions = [...state.transactions];
    const tempTxId = crypto.randomUUID();

    const tempTx: Transaction = {
      id: tempTxId,
      type: 'transfer',
      fromWarehouseId,
      toWarehouseId,
      itemId,
      quantity: finalQty,
      totalPrice,
      timestamp: new Date(),
    };

    set(s => {
      let newInv = [...s.inventory];
      const srcIdx = newInv.findIndex(r => r.warehouseId === fromWarehouseId && r.itemId === itemId);
      if (srcIdx >= 0) newInv[srcIdx] = { ...newInv[srcIdx], quantity: newInv[srcIdx].quantity - finalQty };

      const destIdx = newInv.findIndex(r => r.warehouseId === toWarehouseId && r.itemId === itemId);
      if (destIdx >= 0) {
        newInv[destIdx] = { ...newInv[destIdx], quantity: newInv[destIdx].quantity + finalQty };
      } else {
        newInv.push({ warehouseId: toWarehouseId, itemId, quantity: finalQty });
      }

      return { inventory: newInv, transactions: [tempTx, ...s.transactions] };
    });

    try {
      const { error: rpcErr } = await supabase.rpc('transfer_item_v1', {
        p_from_warehouse_id: Number(fromWarehouseId),
        p_to_warehouse_id: Number(toWarehouseId),
        p_item_id: Number(itemId),
        p_qty: finalQty,
        p_total_cost: totalPrice
      });

      if (rpcErr) throw rpcErr;

      get().fetchData();

      return { success: true, message: `تم تحويل ${finalQty} قطعة بنجاح. التكلفة: ${totalPrice} ريال` };
    } catch (err: any) {
      set({ inventory: previousInventory, transactions: previousTransactions }); // Rollback
      return { success: false, message: err.message || 'حدث خطأ أثناء التحويل' };
    }
  },

  addStock: async (warehouseId, itemId, quantity, unit) => {
    const state = get();
    const item = state.getItemById(itemId);
    if (!item) throw new Error('الصنف غير موجود');

    const finalQty = unit === 'box' ? quantity * item.conversionFactor : quantity;
    const currentStock = state.getItemStock(warehouseId, itemId);
    const totalPrice = finalQty * item.salePrice;

    const previousInventory = [...state.inventory];
    const previousTransactions = [...state.transactions];
    const tempTxId = crypto.randomUUID();

    const tempTx: Transaction = {
      id: tempTxId,
      type: 'add',
      toWarehouseId: warehouseId,
      itemId,
      quantity: finalQty,
      totalPrice,
      timestamp: new Date(),
    };

    set(s => {
      let newInv = [...s.inventory];
      const destIdx = newInv.findIndex(r => r.warehouseId === warehouseId && r.itemId === itemId);
      if (destIdx >= 0) {
        newInv[destIdx] = { ...newInv[destIdx], quantity: newInv[destIdx].quantity + finalQty };
      } else {
        newInv.push({ warehouseId, itemId, quantity: finalQty });
      }
      return { inventory: newInv, transactions: [tempTx, ...s.transactions] };
    });

    try {
      const { error: rpcErr } = await supabase.rpc('add_stock_v1', {
        p_warehouse_id: Number(warehouseId),
        p_item_id: Number(itemId),
        p_qty: finalQty,
        p_total_cost: totalPrice
      });

      if (rpcErr) throw rpcErr;

      get().fetchData();

      return { finalQty, totalPrice };
    } catch (e: any) {
      set({ inventory: previousInventory, transactions: previousTransactions }); // Rollback
      throw e;
    }
  },

  addItem: async (itemData) => {
    const { error, data } = await supabase.from('items').insert({
      id: Number(itemData.id),
      item_name: itemData.name,
      unit_type: itemData.unitType,
      conversion_factor: itemData.conversionFactor,
      cost_price: itemData.purchasePrice,
      sale_price: itemData.salePrice,
      vat: itemData.vat,
      min_limit: itemData.minLimit,
    }).select().single();

    if (error) throw error;

    get().fetchData();
  },

  updateItem: async (id, updates) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.item_name = updates.name;
    if (updates.unitType !== undefined) dbUpdates.unit_type = updates.unitType;
    if (updates.conversionFactor !== undefined) dbUpdates.conversion_factor = updates.conversionFactor;
    if (updates.purchasePrice !== undefined) dbUpdates.cost_price = updates.purchasePrice;
    if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice;
    if (updates.vat !== undefined) dbUpdates.vat = updates.vat;
    if (updates.minLimit !== undefined) dbUpdates.min_limit = updates.minLimit;


    const { error } = await supabase.from('items').update(dbUpdates).eq('id', id);
    if (error) throw error;

    get().fetchData();
  },

  deleteItem: async (id) => {
    // Delete from DB
    await supabase.from('inventory').delete().eq('item_id', id);
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;

    // Update local state
    set(s => ({
      items: s.items.filter(i => i.id !== id),
      inventory: s.inventory.filter(r => r.itemId !== id),
    }));
  },

  addWarehouse: async (name) => {
    const { error } = await supabase.from('warehouses').insert({
      name,
      type: 'clinic'
    });
    if (error) throw error;
    get().fetchData();
  },

  updateWarehouse: async (id, name) => {
    const { error } = await supabase.from('warehouses').update({ name }).eq('id', id);
    if (error) throw error;
    get().fetchData();
  },

  deleteWarehouse: async (id) => {
    // Check if it's the main warehouse (we shouldn't delete it easily)
    const wh = get().warehouses.find(w => w.id === id);
    if (wh?.type === 'main') throw new Error('لا يمكن حذف المخزن الرئيسي');

    // Delete associated inventory and the warehouse
    await supabase.from('inventory').delete().eq('warehouse_id', id);
    const { error } = await supabase.from('warehouses').delete().eq('id', id);
    if (error) throw error;

    get().fetchData();
  },

  resetTransactions: async () => {
    set({ isLoading: true });
    try {
      // حذف كافة الحركات من جدول transactions في Supabase
      // نستخدم شرطاً دائماً لمسح كافة البيانات (neq id to a random uuid)
      const { error } = await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;

      await get().fetchData();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  }
}));
