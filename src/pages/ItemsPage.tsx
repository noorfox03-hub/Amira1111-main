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
import { Plus, Minus, Pencil, Trash2, Search, Barcode as BarcodeIcon, RotateCcw, PackagePlus, Boxes, LayoutGrid, List, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="relative flex-1 lg:w-80 group">
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input 
        placeholder="ابحث..." 
        className="h-10 pr-10 rounded-xl border-2 font-bold text-sm bg-white" 
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
      "group relative overflow-hidden transition-all duration-300 border-none shadow-lg hover:shadow-xl rounded-[1.5rem] bg-white",
      isCritical ? "ring-1 ring-destructive/40 bg-destructive/5" : isWarning ? "ring-1 ring-amber-400/40 bg-amber-50/20" : ""
    )}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex-1">
            <h3 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors leading-tight mb-1 truncate">{item.name}</h3>
            <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[8px] font-bold bg-slate-50 px-1.5 py-0.5 rounded-md w-fit border">
              <BarcodeIcon className="w-2.5 h-2.5" />
              {item.id}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge className={cn(
              "h-8 px-3 rounded-lg text-lg font-black shadow-md border-none",
              isCritical ? "bg-destructive text-white" : isWarning ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
            )}>
              {total}
            </Badge>
          </div>
        </div>

        <div className="space-y-1.5 bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-slate-100 mb-4 shadow-inner">
          <div className="flex justify-between items-center text-xs font-bold border-b border-dashed border-slate-200 pb-1.5">
            <span className="text-slate-400">الرئيسي:</span>
            <span className="text-primary text-sm font-black bg-primary/5 px-2 py-0.5 rounded-lg">{stock.main}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            {stock.clinics.map((c: any) => (
              <div key={c.name} className="flex flex-col p-1 rounded-lg hover:bg-white transition-all">
                <span className="text-[8px] font-black text-slate-300 uppercase truncate leading-none mb-0.5">{c.name}</span>
                <span className={cn("font-black text-xs", c.qty > 0 ? "text-slate-700" : "text-slate-200")}>{c.qty}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between no-print border-t pt-3 mt-auto">
          <div className="flex flex-col">
             <span className="text-[8px] font-black text-slate-300 uppercase leading-none">السعر</span>
             <span className="text-md font-black text-emerald-600 leading-none">{item.salePrice.toFixed(2)} <span className="text-[8px]">ر.س</span></span>
          </div>
          <div className="flex gap-1">
            <StockAdjustmentDialog itemId={item.id} itemName={item.name} />
            <Button variant="ghost" size="icon" onClick={() => onEdit(item.id)} className="rounded-lg h-8 w-8 hover:bg-blue-50 border border-transparent hover:border-blue-100">
              <Pencil className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-lg h-8 w-8 hover:bg-rose-50 border border-transparent hover:border-rose-100">
                  <Trash2 className="w-4 h-4" />
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
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-14 w-14 rounded-2xl border-2 hover:bg-rose-50 hover:text-rose-600 shadow-sm"
                onClick={() => setQuantity(prev => {
                  const val = Number(prev) || 0;
                  return String(val - 1);
                })}
              >
                <Minus className="w-6 h-6" />
              </Button>
              <Input 
                type="number" 
                placeholder="0" 
                value={quantity} 
                onChange={e => setQuantity(e.target.value)} 
                className="h-16 text-center text-3xl font-black rounded-2xl border-none shadow-inner bg-white flex-1" 
              />
              <Button 
                variant="outline" 
                size="icon" 
                className="h-14 w-14 rounded-2xl border-2 hover:bg-emerald-50 hover:text-emerald-600 shadow-sm"
                onClick={() => setQuantity(prev => {
                  const val = Number(prev) || 0;
                  return String(val + 1);
                })}
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div>
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
    return items.filter(item => matchItem(item, searchTerm))
      .sort((a, b) => Number(a.id) - Number(b.id)); // الترتيب بالكود رقمياً
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
    <div className="p-4 md:p-6 space-y-6 animate-fade-in bg-slate-50/10 min-h-screen" dir="rtl">
      
      {/* رأس الصفحة الحديث */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 no-print">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-2xl rotate-3 shadow-xl shadow-primary/30 flex items-center justify-center">
            <Boxes className="w-8 h-8 text-white -rotate-3" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">الأصناف</h1>
            <p className="text-muted-foreground font-bold text-sm">إدارة المخزون بدقة وسرعة</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
          <SearchSection onSearch={handleSearch} />
          <Button 
            onClick={() => setIsFormOpen(!isFormOpen)} 
            className={cn("h-10 px-6 rounded-xl font-black text-sm shadow-lg", isFormOpen ? "bg-slate-800" : "bg-primary")}
          >
            {isFormOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
            {isFormOpen ? "إخفاء" : "صنف جديد"}
          </Button>
        </div>
      </div>

      {/* نموذج الإدخال (قابل للطي لتوفير المساحة والسرعة) */}
      {isFormOpen && (
        <Card className="border-none shadow-xl rounded-[2rem] bg-white/80 backdrop-blur-xl overflow-hidden animate-slide-in no-print">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="space-y-1.5">
                <Label className="font-black text-slate-500 mr-1 text-xs">الباركود</Label>
                <Input placeholder="..." className="h-10 border-2 rounded-xl font-mono text-center" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} disabled={!!editId} />
              </div>
              <div className="sm:col-span-1 lg:col-span-2 space-y-1.5">
                <Label className="font-black text-slate-500 mr-1 text-xs">اسم الصنف</Label>
                <Input placeholder="..." className="h-10 border-2 rounded-xl font-black text-md" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-black text-slate-500 mr-1 text-xs">سعر الشراء</Label>
                <Input type="number" className="h-10 border-2 rounded-xl font-black text-primary text-center bg-primary/5" value={form.purchasePrice} onChange={e => setForm(f => ({ ...f, purchasePrice: e.target.value }))} />
              </div>
               <div className="space-y-1.5">
                <Label className="font-black text-slate-500 mr-1 text-xs">سعر البيع</Label>
                <Input type="number" className="h-10 border-2 rounded-xl font-black text-emerald-600 text-center bg-emerald-50/5" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} />
              </div>
               <div className="space-y-1.5">
                <Label className="font-black text-slate-500 mr-1 text-xs">الحد الأدنى</Label>
                <Input type="number" className="h-10 border-2 rounded-xl font-black text-rose-600 text-center" value={form.minLimit} onChange={e => setForm(f => ({ ...f, minLimit: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
              <Button variant="ghost" onClick={resetForm} className="h-10 px-6 rounded-xl font-bold text-slate-400">إلغاء</Button>
              <Button onClick={handleSave} disabled={submitting} className="h-10 px-10 rounded-xl font-black text-md bg-primary shadow-lg">تأكيد الحفظ</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* مؤشر التحميل أثناء البحث */}
      {isPending && <div className="text-center font-bold text-primary animate-pulse py-4 font-mono">جاري تصفية النتائج بسرعة فائقة...</div>}

      {/* شبكة الأصناف الفائقة */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
