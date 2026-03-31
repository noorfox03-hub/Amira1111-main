import { useEffect, useState, useMemo } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PackagePlus, Boxes } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ItemSearchField } from '@/components/ItemSearchField';

export default function TransferPage() {
  const { warehouses, items, getItemStock, addStock, isLoading } = useInventoryStore();
  const { toast } = useToast();

  const [addWh, setAddWh] = useState(() => warehouses.find(w => w.type === 'main')?.id || '');
  const [addItemId, setAddItemId] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addUnit, setAddUnit] = useState<'piece' | 'box'>('piece');
  const [submitting, setSubmitting] = useState(false);

  // تحديث القيم الافتراضية عند تحميل المخازن
  useEffect(() => {
    if (warehouses.length > 0) {
      const mainWh = warehouses.find(w => w.type === 'main');
      if (mainWh && !addWh) setAddWh(mainWh.id);
    }
  }, [warehouses, addWh]);

  const addItemData = items.find(i => i.id === addItemId);

  const handleAdd = async () => {
    if (!addWh || !addItemId || !addQty) {
      toast({ title: 'بيانات ناقصة', description: 'يرجى اختيار الصنف وتحديد الكمية الموردة', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await addStock(addWh, addItemId, Number(addQty), addUnit);
      toast({ title: 'تم التوريد بنجاح', description: `تم إضافة ${result.finalQty} قطعة إلى المخزن الرئيسي` });
      setAddItemId(''); setAddQty('');
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 space-y-4 opacity-30"><Skeleton className="h-10 w-48 rounded-xl" /><Skeleton className="h-96 w-full rounded-2xl" /></div>;

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in max-w-4xl" dir="rtl">
      <div>
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tighter">
          <div className="bg-sky-600 p-2 rounded-xl shadow-lg shadow-sky-200 rotate-3">
            <PackagePlus className="w-7 h-7 text-white -rotate-3" />
          </div>
          توريد مخزن جديد
        </h1>
        <p className="text-muted-foreground mt-1 font-bold text-sm mr-12 italic">إضافة كميات جديدة للمستودع الرئيسي</p>
      </div>

      <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white/70 backdrop-blur-md">
        <CardHeader className="p-6 border-b bg-slate-50/30">
          <CardTitle className="text-lg font-black text-sky-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-sky-600" /> تفاصيل التوريد
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label className="font-black text-slate-500 mr-1 uppercase text-[10px] tracking-tight">الموقع المستهدف</Label>
               <div className="h-10 flex items-center px-4 rounded-xl bg-slate-100 border border-slate-200 font-black text-slate-400 text-sm">
                {warehouses.find(w => w.type === 'main')?.name || 'المستودع الرئيسي'}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="font-black text-slate-500 mr-1 uppercase text-[10px] tracking-tight">ابحث عن الصنف</Label>
              <ItemSearchField
                items={items}
                selectedItemId={addItemId}
                onSelect={setAddItemId}
                warehouseId={addWh}
                getItemStock={getItemStock}
                className="h-10 font-black shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-black text-slate-500 mr-1 uppercase text-[10px] tracking-tight">الكمية الموردة</Label>
              <Input 
                type="number" 
                value={addQty} 
                onChange={e => setAddQty(e.target.value)} 
                className="h-10 rounded-xl text-center text-xl font-black border-2" 
                placeholder="0.00"
              />
            </div>
            
             <div className="space-y-2">
              <Label className="font-black text-slate-500 mr-1 uppercase text-[10px] tracking-tight">الوحدة</Label>
              <Select value={addUnit} onValueChange={v => setAddUnit(v as any)}>
                <SelectTrigger className="h-10 rounded-xl font-black border-2 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="piece" className="font-black">قطعة</SelectItem>
                  {addItemData && addItemData.conversionFactor > 1 && (
                    <SelectItem value="box" className="font-black">علبة ({addItemData.conversionFactor} قطعة)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
                onClick={handleAdd} 
                disabled={submitting} 
                className="w-full h-12 rounded-xl text-lg font-black bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-200 transition-all active:scale-95"
            >
              {submitting ? 'جاري تسجيل التوريد...' : 'تأكيد إضافة للمركز'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <p className="text-[10px] font-black text-slate-200 text-center pb-20 uppercase tracking-[1rem]">Logistics Master v3.0</p>
    </div>
  );
}
