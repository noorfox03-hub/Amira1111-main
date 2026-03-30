import { useState, useMemo, useEffect, memo, useCallback, useTransition } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Search, Barcode as BarcodeIcon, RotateCcw, PackagePlus, Boxes, LayoutGrid, List, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Item } from '@/types/inventory';
import { matchItem } from '@/lib/searchUtils';
import { cn } from '@/lib/utils';

// --- المكونات الصغيرة المستقلة (لتسريع الواجهة) ---

// 1. مكون البحث المستقل (لتفادي إعادة رسم الصفحة مع كل حرف)
const SearchSection = memo(({ onSearch }: { onSearch: (val: string) => void }) => {
  const [localSearch, setLocalSearch] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    onSearch(val); // سيتم التعامل معه بـ useTransition في المكون الأب
  };

  return (
    <div className="relative flex-1 lg:w-96 group">
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input 
        placeholder="ابحث بسرعة البرق..." 
        className="h-14 pr-12 rounded-2xl border-2 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-lg shadow-sm bg-white" 
        value={localSearch} 
        onChange={handleChange} 
      />
    </div>
  );
});

// 2. بطاقة الصنف الفائقة (Memoized)
const ItemCard = memo(({ 
  item, 
  total, 
  stock, 
  onEdit, 
  onDelete 
}: { 
  item: Item, 
  total: number, 
  stock: any, 
  onEdit: (id: string) => void, 
  onDelete: (id: string) => void 
}) => {
  const isCritical = total === 0;
  const isWarning = total <= item.minLimit && total > 0;

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 border-none shadow-xl hover:shadow-2xl rounded-[2.5rem] bg-white",
      isCritical ? "ring-2 ring-destructive/40 bg-destructive/5" : isWarning ? "ring-2 ring-amber-400/40 bg-amber-50/20" : ""
    )}>
      <CardContent className="p-7">
        <div className="flex justify-between items-start gap-4 mb-5">
          <div className="flex-1">
            <h3 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight mb-2">{item.name}</h3>
            <span className="flex items-center gap-2 text-slate-400 font-mono text-[10px] font-bold bg-slate-50 px-2.5 py-1 rounded-lg w-fit border">
              <BarcodeIcon className="w-3 h-3" />
              {item.id}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn(
              "h-12 px-5 rounded-2xl text-2xl font-black shadow-lg border-none",
              isCritical ? "bg-destructive text-white" : isWarning ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
            )}>
              {total}
            </Badge>
            <span className="text-[9px] font-black opacity-30 uppercase tracking-tighter">إجمالي الرصيد</span>
          </div>
        </div>

        <div className="space-y-3 bg-white/60 backdrop-blur-sm p-5 rounded-3xl border border-slate-100 mb-6 shadow-inner">
          <div className="flex justify-between items-center text-sm font-bold border-b border-dashed border-slate-200 pb-2">
            <span className="text-slate-400">المخزن الرئيسي:</span>
            <span className="text-primary text-base font-black bg-primary/5 px-3 py-1 rounded-xl">{stock.main}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {stock.clinics.map((c: any) => (
              <div key={c.name} className="flex flex-col p-1.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-white transition-all">
                <span className="text-[9px] font-black text-slate-300 uppercase truncate">{c.name}</span>
                <span className={cn("font-black text-sm", c.qty > 0 ? "text-slate-700" : "text-slate-200")}>{c.qty}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between no-print mt-auto">
          <div className="flex flex-col">
             <span className="text-[9px] font-black text-slate-300 uppercase">سعر الحبة</span>
             <span className="text-lg font-black text-emerald-600 leading-none">{item.salePrice.toFixed(2)} <span className="text-[10px]">ر.س</span></span>
          </div>
          <div className="flex gap-1.5">
            <StockAdjustmentDialog itemId={item.id} itemName={item.name} />
            <Button variant="ghost" size="icon" onClick={() => onEdit(item.id)} className="rounded-xl h-10 w-10 hover:bg-blue-50 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100">
              <Pencil className="w-5 h-5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl" className="rounded-[2.5rem] border-none shadow-2xl">
                 <AlertDialogHeader><AlertDialogTitle className="text-2xl font-black">تأكيد الحذف</AlertDialogTitle></AlertDialogHeader>
                 <AlertDialogDescription className="font-bold text-base">هل أنتِ متأكدة من حذف صنف "{item.name}"؟</AlertDialogDescription>
                 <AlertDialogFooter className="mt-6 gap-2">
                    <AlertDialogCancel className="rounded-2xl h-12 flex-1">إلغاء</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(item.id)} className="bg-destructive hover:bg-destructive/90 h-12 flex-1 rounded-2xl font-black">نعم، حذف</AlertDialogAction>
                 </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// مكون تعديل المخزون الفوري
const StockAdjustmentDialog = memo(({ itemId, itemName }: { itemId: string, itemName: string }) => {
  const { warehouses, getStockMap, addStock, dispenseItem } = useInventoryStore();
  const { toast } = useToast();
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

  const stockMap = getStockMap();
  const currentStock = warehouseId ? (stockMap[`${warehouseId}-${itemId}`] || 0) : 0;

  const handleAdjust = async () => {
    if (!warehouseId || !quantity) return;
    setLoading(true);
    try {
      const numQty = Number(quantity);
      if (numQty > 0) await addStock(warehouseId, itemId, numQty, 'piece');
      else await dispenseItem(warehouseId, itemId, Math.abs(numQty), 'piece');
      toast({ title: 'تم التحديث الفوري' });
      setQuantity('');
    } catch (e: any) { toast({ title: 'خطأ', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-green-50 hover:text-green-600 transition-all border border-transparent hover:border-green-100">
          <PackagePlus className="w-5 h-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl" className="max-w-sm rounded-[2.5rem] border-none shadow-2xl">
        <AlertDialogHeader><AlertDialogTitle className="text-xl font-black">تعديل سريع: {itemName}</AlertDialogTitle></AlertDialogHeader>
        <div className="space-y-4 py-4">
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger className="rounded-xl h-12 border-2"><SelectValue placeholder="اختر المستودع" /></SelectTrigger>
            <SelectContent className="rounded-xl">{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
          </Select>
          <div className="text-center bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200">
            <p className="text-[10px] font-black opacity-30 mb-2 uppercase">الرصيد الحالي: {currentStock}</p>
            <Input type="number" placeholder="مثال: 5 أو -5" value={quantity} onChange={e => setQuantity(e.target.value)} className="h-16 text-center text-3xl font-black rounded-2xl border-none shadow-inner bg-white" />
          </div>
        </div>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-2xl h-12 flex-1" onClick={() => { setWarehouseId(''); setQuantity(''); }}>إلغاء</AlertDialogCancel>
          <Button onClick={handleAdjust} disabled={loading || !warehouseId || !quantity} className="rounded-2xl h-12 flex-1 font-black">{loading ? 'جاري...' : 'تأكيد'}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

// --- الصفحة الرئيسية بـ High Performance ---

export default function ItemsPage() {
  const { items, addItem, updateItem, deleteItem, inventory, warehouses, isLoading, getStockMap } = useInventoryStore();
  const { toast } = useToast();

  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({ id: '', name: '', unitType: 'قطعة', conversionFactor: '1', purchasePrice: '', salePrice: '', vat: '0', minLimit: '5' });

  const handleSearch = useCallback((val: string) => {
    startTransition(() => {
      setSearchTerm(val);
    });
  }, []);

  const resetForm = useCallback(() => {
    setForm({ id: '', name: '', unitType: 'قطعة', conversionFactor: '1', purchasePrice: '', salePrice: '', vat: '0', minLimit: '5' });
    setEditId(null);
    setIsFormOpen(false);
  }, []);

  const openEdit = useCallback((id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setEditId(id);
    setForm({ id: item.id, name: item.name, unitType: item.unitType, conversionFactor: String(item.conversionFactor), purchasePrice: String(item.purchasePrice), salePrice: String(item.salePrice), vat: String(item.vat), minLimit: String(item.minLimit) });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [items]);

  const handleDelete = useCallback(async (id: string | number) => {
    try { await deleteItem(String(id)); toast({ title: 'تم الحذف بنجاح' }); } 
    catch (e: any) { toast({ title: 'خطأ', description: e.message, variant: 'destructive' }); }
  }, [deleteItem, toast]);

  const filteredItems = useMemo(() => {
    return items.filter(item => matchItem(item, searchTerm)).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [items, searchTerm]);

  const stockMap = useMemo(() => getStockMap(), [inventory, getStockMap]);

  const handleSave = async () => {
    if (!form.id || !form.name || !form.purchasePrice || !form.salePrice) return;
    const data: Item = { id: form.id, name: form.name, unitType: form.unitType, conversionFactor: Number(form.conversionFactor) || 1, purchasePrice: Number(form.purchasePrice), salePrice: Number(form.salePrice), vat: Number(form.vat) || 0, minLimit: Number(form.minLimit) || 0 };
    setSubmitting(true);
    try {
      if (editId) await updateItem(editId, data);
      else await addItem(data);
      resetForm();
      toast({ title: 'تم حفظ البيانات بنجاح' });
    } catch (e: any) { toast({ title: 'خطأ', description: e.message, variant: 'destructive' }); } 
    finally { setSubmitting(false); }
  };

  if (isLoading) return <div className="p-8 space-y-4 opacity-30"><Skeleton className="h-10 w-48 rounded-2xl" /><Skeleton className="h-[500px] w-full rounded-[3rem]" /></div>;

  return (
    <div className="p-4 md:p-10 space-y-10 animate-fade-in bg-slate-50/10 min-h-screen" dir="rtl">
      
      {/* رأس الصفحة الحديث */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 no-print">
        <div className="flex items-center gap-5">
          <div className="bg-primary p-3.5 rounded-[1.5rem] rotate-3 shadow-2xl shadow-primary/30 flex items-center justify-center">
            <Boxes className="w-10 h-10 text-white -rotate-3" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-1">الأصناف</h1>
            <p className="text-muted-foreground font-bold text-lg">إدارة المخزون بدقة متناهية وسرعة خارقة</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <SearchSection onSearch={handleSearch} />
          <Button 
            onClick={() => setIsFormOpen(!isFormOpen)} 
            className={cn("h-14 px-8 rounded-2xl font-black text-lg shadow-xl shadow-primary/20", isFormOpen ? "bg-slate-800" : "bg-primary")}
          >
            {isFormOpen ? <ChevronUp className="w-6 h-6 ml-2" /> : <Plus className="w-6 h-6 ml-2" />}
            {isFormOpen ? "إخفاء النموذج" : "صنف جديد"}
          </Button>
        </div>
      </div>

      {/* نموذج الإدخال (قابل للطي لتوفير المساحة والسرعة) */}
      {isFormOpen && (
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white/80 backdrop-blur-xl overflow-hidden animate-slide-in no-print">
          <CardContent className="p-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               <div className="space-y-3">
                <Label className="font-black text-slate-500 mr-2">الباركود</Label>
                <Input placeholder="امسح الباركود..." className="h-12 border-2 rounded-2xl font-mono text-center" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} disabled={!!editId} />
              </div>
              <div className="sm:col-span-1 lg:col-span-2 space-y-3">
                <Label className="font-black text-slate-500 mr-2">اسم الصنف</Label>
                <Input placeholder="اسم الصنف بالكامل..." className="h-12 border-2 rounded-2xl font-black text-lg focus:ring-4 focus:ring-primary/5" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-3">
                <Label className="font-black text-slate-500 mr-2">سعر الشراء</Label>
                <Input type="number" className="h-12 border-2 rounded-2xl font-black text-primary text-center bg-primary/5" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} />
              </div>
               <div className="space-y-3">
                <Label className="font-black text-slate-500 mr-2">سعر البيع</Label>
                <Input type="number" className="h-12 border-2 rounded-2xl font-black text-emerald-600 text-center bg-emerald-50/5" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} />
              </div>
               <div className="space-y-3">
                <Label className="font-black text-slate-500 mr-2">الحد الأدنى</Label>
                <Input type="number" className="h-12 border-2 rounded-2xl font-black text-rose-600 text-center" value={form.minLimit} onChange={e => setForm(f => ({ ...f, minLimit: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-10 pt-8 border-t">
              <Button variant="ghost" onClick={resetForm} className="h-14 px-8 rounded-2xl font-bold text-slate-400">إلغاء</Button>
              <Button onClick={handleSave} disabled={submitting} className="h-14 px-14 rounded-2xl font-black text-lg bg-primary shadow-2xl shadow-primary/20">تأكيد الحفظ</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* مؤشر التحميل أثناء البحث */}
      {isPending && <div className="text-center font-bold text-primary animate-pulse py-4 font-mono">جاري تصفية النتائج بسرعة فائقة...</div>}

      {/* شبكة الأصناف الفائقة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredItems.map((item) => {
          const totalQty = warehouses.reduce((sum, wh) => sum + (stockMap[`${wh.id}-${item.id}`] || 0), 0);
          const clinics = warehouses.filter(w => w.type === 'clinic');
          const stockDetails = {
            main: stockMap[`${warehouses.find(w => w.type === 'main')?.id}-${item.id}`] || 0,
            clinics: clinics.map(c => ({ name: c.name, qty: stockMap[`${c.id}-${item.id}`] || 0 }))
          };

          return (
            <ItemCard 
              key={item.id} 
              item={item} 
              total={totalQty} 
              stock={stockDetails} 
              onEdit={openEdit} 
              onDelete={handleDelete} 
            />
          );
        })}
      </div>

      {filteredItems.length === 0 && !isPending && (
        <div className="flex flex-col items-center justify-center py-40 opacity-10 grayscale">
          <BarcodeIcon className="w-40 h-40 mb-6" />
          <p className="text-4xl font-black">لا توجد نتائج</p>
        </div>
      )}
      
      <p className="text-[10px] font-black text-slate-200 text-center pb-20 uppercase tracking-[1rem]">Topal Dynamic v3.0</p>
    </div>
  );
}
