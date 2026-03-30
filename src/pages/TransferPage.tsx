import { useEffect, useState } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, ArrowDownLeft, ArrowRightLeft, Check, PackagePlus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ItemSearchField } from '@/components/ItemSearchField';

export default function TransferPage() {
  const { warehouses, items, getItemStock, transferItem, addStock, isLoading } = useInventoryStore();
  const { toast } = useToast();

  const [fromWh, setFromWh] = useState(() => warehouses.find(w => w.type === 'main')?.id || '');
  const [toWh, setToWh] = useState('');
  const [selectedItem, setSelectedItem] = useState(''); // Changed from transferItemId
  const [transferQty, setTransferQty] = useState('');
  const [transferUnit, setTransferUnit] = useState<'piece' | 'box'>('piece');
  const [addWh, setAddWh] = useState(() => warehouses.find(w => w.type === 'main')?.id || '');
  const [addItemId, setAddItemId] = useState('');
  const [addQty, setAddQty] = useState('');
  const [addUnit, setAddUnit] = useState<'piece' | 'box'>('piece');
  const [submitting, setSubmitting] = useState(false);

  // Update defaults when warehouses load
  useEffect(() => {
    if (warehouses.length > 0) {
      const mainWh = warehouses.find(w => w.type === 'main');
      if (mainWh) {
        if (!fromWh) setFromWh(mainWh.id);
        if (!addWh) setAddWh(mainWh.id);
      }
    }
  }, [warehouses, fromWh, addWh]);

  const transferItemData = items.find(i => i.id === selectedItem); // Updated to selectedItem
  const addItemData = items.find(i => i.id === addItemId);

  const handleTransfer = async () => {
    if (!fromWh || !toWh || !selectedItem || !transferQty || fromWh === toWh) { // Updated to selectedItem
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول بشكل صحيح', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const result = await transferItem(fromWh, toWh, selectedItem, Number(transferQty), transferUnit); // Updated to selectedItem
    setSubmitting(false);
    if (result.success) {
      toast({ title: 'تم التحويل', description: result.message });
      setSelectedItem(''); setTransferQty(''); // Updated to setSelectedItem
    } else {
      toast({ title: 'خطأ', description: result.message, variant: 'destructive' });
    }
  };

  const handleAdd = async () => {
    if (!addWh || !addItemId || !addQty) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await addStock(addWh, addItemId, Number(addQty), addUnit);
      toast({ title: 'تمت الإضافة', description: `تم إضافة ${result.finalQty} قطعة بنجاح` });
      setAddItemId(''); setAddQty('');
    } catch (e: any) {
      toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">إضافة مخزون</h1>
          <p className="text-muted-foreground mt-1">جاري التحميل...</p>
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-sky-900 font-black">إضافة مخزون</h1>
        <p className="text-muted-foreground mt-1 font-medium">إضافة كميات جديدة للمستودع الرئيسي المركز</p>
      </div>

      <div className="bg-sky-50 p-6 rounded-[2rem] border border-sky-100 flex items-center gap-4 shadow-sm">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md shadow-sky-100">
          <PackagePlus className="w-7 h-7 text-sky-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-sky-900">توريد مخزون جديد</h2>
          <p className="text-sm text-muted-foreground">سيتم إضافة الأصناف المختارة مباشرة إلى رصيد المركز</p>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b p-8">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            تفاصيل التوريد
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-3">
            <Label className="font-bold text-sky-800">الموقع المستهدف</Label>
            <div className="h-14 flex items-center px-5 rounded-2xl bg-muted/20 border border-slate-100 font-black text-slate-500 italic">
              {warehouses.find(w => w.type === 'main')?.name || 'المستودع الرئيسي'}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-bold text-sky-800 text-base">ابحث عن الصنف بـ الاسم أو الباركود</Label>
            <ItemSearchField
              items={items}
              selectedItemId={addItemId}
              onSelect={setAddItemId}
              warehouseId={addWh}
              getItemStock={getItemStock}
              className="h-14"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="font-bold text-sky-800">الكمية الموردة</Label>
              <Input 
                type="number" 
                min="1" 
                value={addQty} 
                onChange={e => setAddQty(e.target.value)} 
                className="h-14 rounded-2xl text-lg font-bold shadow-sm"
              />
            </div>
            <div className="space-y-3">
              <Label className="font-bold text-sky-800">الوحدة</Label>
              <Select value={addUnit} onValueChange={v => setAddUnit(v as any)}>
                <SelectTrigger className="h-14 rounded-2xl font-bold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="piece" className="font-bold">قطعة</SelectItem>
                  {addItemData && addItemData.conversionFactor > 1 && (
                    <SelectItem value="box" className="font-bold">علبة ({addItemData.conversionFactor} قطعة)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-6 border-t">
            <Button size="lg" onClick={handleAdd} disabled={submitting} className="w-full h-14 rounded-2xl text-lg font-black bg-sky-600 hover:bg-sky-700 shadow-xl shadow-sky-200 transition-all active:scale-95">
              {submitting ? 'جاري تسجيل التوريد...' : 'تأكيد إضافة المخزون'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
