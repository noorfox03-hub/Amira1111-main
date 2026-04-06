import { useState, useMemo } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, Search, PlusCircle, History, Undo2, ArrowUpRight, Boxes, Package2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemSearchField } from '@/components/ItemSearchField';
import { format, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DispensePage() {
  const { warehouses, items, transactions, getItemStock, getWarehouseItems, dispenseItem, reverseTransaction, deleteTransaction, isLoading, error } = useInventoryStore();
  const { toast } = useToast();
  
  const clinics = warehouses.filter(w => w.type === 'clinic');
  const mainWarehouse = warehouses.find(w => w.type === 'main');

  const [selectedClinic, setSelectedClinic] = useState(() => localStorage.getItem('dispense_clinic') || '');
  const [selectedItem, setSelectedItem] = useState(() => localStorage.getItem('dispense_item') || '');
  const [quantity, setQuantity] = useState(() => localStorage.getItem('dispense_qty') || '');
  const [unit, setUnit] = useState<'piece' | 'box'>(() => (localStorage.getItem('dispense_unit') as any) || 'piece');
  const [submitting, setSubmitting] = useState(false);
  const [returnTxId, setReturnTxId] = useState<string | null>(null);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);

  // Iron Memory: Save state to localStorage as it changes
  useEffect(() => {
    localStorage.setItem('dispense_clinic', selectedClinic);
    localStorage.setItem('dispense_item', selectedItem);
    localStorage.setItem('dispense_qty', quantity);
    localStorage.setItem('dispense_unit', unit);
  }, [selectedClinic, selectedItem, quantity, unit]);

  const selectedItemData = items.find(i => i.id === selectedItem);
  const currentStock = selectedItem && mainWarehouse ? getItemStock(mainWarehouse.id, selectedItem) : 0;
  
  const isLowStock = selectedItemData ? currentStock <= selectedItemData.minLimit : false;
  const finalQty = selectedItemData && quantity
    ? unit === 'box' ? Number(quantity) * selectedItemData.conversionFactor : Number(quantity)
    : 0;
  const totalCost = selectedItemData ? finalQty * selectedItemData.salePrice : 0;
  const insufficientStock = finalQty > currentStock;

  // حركات الصرف لليوم فقط
  const todaysDispenses = useMemo(() => {
    const today = new Date();
    return transactions.filter(tx => 
      tx.type === 'dispense' && 
      isSameDay(tx.timestamp, today)
    );
  }, [transactions]);

  const handleDispense = async () => {
    if (!selectedClinic || !selectedItem || !quantity || Number(quantity) <= 0) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }
    
    if (!mainWarehouse) return;

    setSubmitting(true);
    const result = await dispenseItem(mainWarehouse.id, selectedItem, Number(quantity), unit, selectedClinic);
    setSubmitting(false);
    
    if (result.success) {
      toast({ title: 'تم الصرف بنجاح', description: result.message });
      setSelectedItem('');
      setQuantity('');
      // Clear persistence on success
      localStorage.removeItem('dispense_item');
      localStorage.removeItem('dispense_qty');
    } else {
      toast({ title: 'خطأ', description: result.message, variant: 'destructive' });
    }
  };

  const handleReturn = async (txId: string) => {
    try {
      const res = await reverseTransaction(txId);
      if (res.success) {
        toast({ title: 'تم الإرجاع', description: 'تم إعادة الكمية للمخزن الرئيسي بنجاح' });
      } else {
        toast({ title: 'خطأ', description: res.message, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setReturnTxId(null);
    }
  };

  const handleDelete = async (txId: string) => {
    try {
      const res = await deleteTransaction(txId);
      if (res.success) {
        toast({ title: 'تم المسح', description: 'تم مسح السجل بنجاح دون تغيير المخزون' });
      } else {
        toast({ title: 'خطأ', description: res.message, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setDeleteTxId(null);
    }
  };

  if (isLoading) return <div className="p-8 space-y-4 opacity-30"><Skeleton className="h-10 w-48 rounded-xl" /><Skeleton className="h-96 w-full rounded-2xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in bg-slate-50/10 min-h-screen" dir="rtl">
      
      {/* الرأس */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600 p-2.5 rounded-2xl rotate-3 shadow-xl shadow-emerald-200">
            <ArrowUpRight className="w-8 h-8 text-white -rotate-3" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">صرف عهدة يومية</h1>
            <p className="text-muted-foreground font-bold text-sm italic">توزيع المواد والتعامل مع المرتجعات</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* نموذج الصرف - الجهة اليمنى */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white/90 backdrop-blur-2xl transition-all border border-white/50">
            <CardHeader className="p-8 border-b bg-emerald-50/40">
              <CardTitle className="text-2xl font-black text-emerald-950 flex items-center gap-3 tracking-tighter">
                <div className="bg-emerald-100 p-2 rounded-xl">
                   <PlusCircle className="w-6 h-6 text-emerald-600" />
                </div>
                بدء عملية صرف جديدة
              </CardTitle>
              <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mr-11 -mt-1">قم بتعبئة البيانات لوصف حركة العهدة</p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-black text-slate-500 mr-1 uppercase text-[10px] tracking-tight">العيادة المستلمة</Label>
                  <Select value={selectedClinic} onValueChange={setSelectedClinic}>
                    <SelectTrigger className="h-10 rounded-xl font-black text-sm border-2">
                      <SelectValue placeholder="اختر العيادة..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {clinics.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-black text-slate-400 mr-1 uppercase text-[10px] tracking-[0.2em]">2. ابحث عن الصنف المطلوب</Label>
                    {selectedItem && <Badge variant="outline" className="text-[9px] font-black border-slate-200 text-slate-400 rounded-full py-0">تم التحديد</Badge>}
                  </div>
                  <ItemSearchField
                    items={items}
                    selectedItemId={selectedItem}
                    onSelect={setSelectedItem}
                    warehouseId={mainWarehouse?.id || ''}
                    getItemStock={getItemStock}
                    className="h-12 font-black shadow-sm"
                  />
                </div>
              </div>

              {selectedItemData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-slide-in">
                  <div className="md:col-span-1 space-y-2">
                    <Label className="font-black text-slate-500 mr-1 uppercase text-[10px]">الكمية</Label>
                    <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="h-10 rounded-xl text-center text-xl font-black border-2" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black text-slate-500 mr-1 uppercase text-[10px]">الوحدة</Label>
                    <Select value={unit} onValueChange={v => setUnit(v as any)}>
                      <SelectTrigger className="h-10 rounded-xl font-black border-2"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="piece" className="font-bold">قطعة</SelectItem>
                        {selectedItemData.conversionFactor > 1 && (
                          <SelectItem value="box" className="font-bold">علبة ({selectedItemData.conversionFactor} قطعة)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleDispense} 
                    disabled={submitting || insufficientStock} 
                    className="h-10 rounded-xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-95"
                  >
                    {submitting ? 'جاري الصرف' : 'تأكيد الصرف'}
                  </Button>
                </div>
              )}

              {selectedItem && (
                <div className={cn(
                  "p-4 rounded-3xl border-2 transition-all flex flex-col md:flex-row justify-between items-center gap-4",
                  insufficientStock ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100"
                )}>
                  <div className="text-center md:text-right">
                    <p className="text-[10px] font-bold text-slate-400">الرصيد المتاح</p>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-2xl font-black", insufficientStock ? "text-rose-600" : "text-emerald-600")}>{currentStock}</span>
                      <span className="text-[10px] font-bold opacity-40">قطعة</span>
                    </div>
                  </div>
                  <div className="h-px md:h-8 w-full md:w-px bg-slate-200" />
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-bold text-slate-400">إجمالي التكلفة</p>
                    <div className="flex items-center gap-2">
                       <span className="text-2xl font-black text-slate-800">{totalCost.toLocaleString()}</span>
                       <span className="text-[10px] font-bold opacity-40">ر.س</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* سجل حركات اليوم للصرف - المرتجعات */}
          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white/50 border border-white">
            <CardHeader className="p-8 border-b bg-slate-50/50">
              <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                <History className="w-6 h-6 text-slate-400" /> حركات الصرف لليوم (المرتجع اليومي)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-slate-100/50 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    <tr>
                      <th className="p-6">الصنف المستلم</th>
                      <th className="p-6">العيادة</th>
                      <th className="p-6 text-center">الكمية</th>
                      <th className="p-6 text-center">التوقيت</th>
                      <th className="p-6 text-left">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todaysDispenses.map(tx => {
                      const item = items.find(i => i.id === tx.itemId);
                      const clinic = warehouses.find(w => w.id === tx.toWarehouseId);
                      return (
                        <tr key={tx.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="p-3 px-6 flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg border flex items-center justify-center font-mono text-[9px] font-black text-slate-400">{item?.id}</div>
                            <span className="font-bold text-slate-700 text-sm">{item?.name}</span>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary" className="rounded-md font-bold bg-slate-100 text-slate-600 border-none text-[10px]">{clinic?.name}</Badge>
                          </td>
                          <td className="p-3 text-center font-black text-slate-800 text-md">
                            {tx.quantity} <span className="text-[8px] opacity-30 italic">{item?.unitType}</span>
                          </td>
                          <td className="p-3 text-center text-[10px] font-black text-slate-500 tabular-nums">
                            {format(tx.timestamp, 'dd/MM - HH:mm')}
                          </td>
                          <td className="p-3 text-left flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              onClick={() => setReturnTxId(tx.id)} 
                              className="rounded-lg h-9 px-3 font-black text-rose-500 hover:bg-rose-50 gap-1.5 transition-all text-xs"
                            >
                              <Undo2 className="w-4 h-4" /> إرجاع
                            </Button>
                            <Button 
                              variant="ghost" 
                              onClick={() => setDeleteTxId(tx.id)} 
                              className="rounded-lg h-9 w-9 p-0 font-black text-rose-600 hover:bg-rose-100 transition-all shadow-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {todaysDispenses.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-20 text-center text-slate-300 font-bold italic">لا توجد حركات صرف مسجلة اليوم حتى الآن</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ملخص العهود - الجهة اليسرى */}
        <div className="space-y-6">
           <Card className="border-none shadow-xl rounded-[2.5rem] bg-emerald-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
            <CardHeader className="relative z-10 p-6 pb-0">
               <CardTitle className="text-sm font-black opacity-80 uppercase text-emerald-100 italic">إجمالي صرف اليوم</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 p-6">
               <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-5xl font-black tabular-nums">{todaysDispenses.reduce((acc, curr) => acc + curr.totalPrice, 0).toLocaleString()}</span>
                  <span className="text-sm font-bold opacity-60">ر.س</span>
               </div>
               <div className="flex items-center gap-2 bg-white/10 p-3 rounded-2xl border border-white/10 text-xs text-white/90">
                  <Package2 className="w-5 h-5" />
                  <span className="font-bold">{todaysDispenses.length} عمليات مسجلة</span>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-6 space-y-4 overflow-hidden relative border border-slate-100">
             <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest">توزيع العهود</h3>
             <div className="space-y-2">
                {clinics.map(c => {
                  const clinicTotal = todaysDispenses
                    .filter(tx => tx.toWarehouseId === c.id)
                    .reduce((acc, curr) => acc + curr.totalPrice, 0);
                  if (clinicTotal === 0) return null;
                  return (
                    <div key={c.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 group transition-all">
                       <span className="font-bold text-slate-600 text-sm">{c.name}</span>
                       <span className="text-md font-black text-emerald-600">{clinicTotal.toLocaleString()} <span className="text-[10px] opacity-40">ر.س</span></span>
                    </div>
                  );
                })}
                {todaysDispenses.length === 0 && <p className="text-center font-bold text-slate-200 italic py-6 text-sm">لا توجد عهود</p>}
             </div>
          </Card>
        </div>
      </div>

      {/* حوار تأكيد الإرجاع */}
      <AlertDialog open={!!returnTxId} onOpenChange={(open) => !open && setReturnTxId(null)}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
              <div className="bg-rose-100 p-2 rounded-xl">
                 <Undo2 className="w-6 h-6 text-rose-600" />
              </div>
              تأكيد إرجاع للمخزن
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-bold text-slate-500 pt-4 leading-relaxed">
              هل أنتِ متأكدة من رغبتكِ في إرجاع هذا الصنف للمستودع الرئيسي؟ 
              <br />
              <span className="text-rose-500">سيتم حذف عملية الصرف تماماً وتصحيح المخزون.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-6">
            <AlertDialogCancel className="h-14 rounded-2xl font-black border-2 text-slate-400">إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => returnTxId && handleReturn(returnTxId)}
              className="h-14 rounded-2xl font-black bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-200"
            >
              نعم، إرجاع الآن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* حوار تأكيد المسح النهائي */}
      <AlertDialog open={!!deleteTxId} onOpenChange={(open) => !open && setDeleteTxId(null)}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-slate-800 tracking-tighter flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-xl">
                 <Trash2 className="w-6 h-6 text-slate-600" />
              </div>
              تأكيد المسح النهائي
            </AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-bold text-slate-500 pt-4 leading-relaxed">
              هل أنتِ متأكدة من مسح هذا السجل؟ 
              <br />
              <span className="text-rose-500 font-black">تحذير: لن يتم استرجاع الكمية للمخزن، سيتم فقط مسح العملية من السجل.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 pt-6">
            <AlertDialogCancel className="h-14 rounded-2xl font-black border-2 text-slate-400">تراجع</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteTxId && handleDelete(deleteTxId)}
              className="h-14 rounded-2xl font-black bg-slate-900 hover:bg-black shadow-xl"
            >
              تأكيد المسح
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <p className="text-[10px] font-black text-slate-200 text-center pb-10 uppercase tracking-[1rem]">Clinic Ops v3.0 - Premium Edition</p>
    </div>
  );
}
