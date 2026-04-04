export interface Item {
  id: string; // Barcode
  name: string;
  unitType: string;
  conversionFactor: number; // how many pieces in a box
  purchasePrice: number;    // Unit Cost Price
  salePrice: number;        // Unit Selling Price
  vat: number;              // VAT percentage
  minLimit: number;         // minimum stock alert threshold (in pieces)
  cartonSize?: number;
  bagSize?: number;
  piecesPerCarton?: number;
  piecesPerBag?: number;
  unit?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  type: 'main' | 'clinic';
}

export interface InventoryRecord {
  warehouseId: string;
  itemId: string;
  quantity: number; // always stored in pieces
}

export type TransactionType = 'dispense' | 'add' | 'transfer' | 'adjustment';

export interface Transaction {
  id: string;
  type: TransactionType;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  itemId: string;
  quantity: number; // in pieces
  totalPrice: number;
  timestamp: Date;
  note?: string;
}
