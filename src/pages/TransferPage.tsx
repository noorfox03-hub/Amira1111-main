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
          <h1 className="text-3xl font-bold">إضافة / تحويل مخزون</h1>
          <p className="text-muted-foreground mt-1">جاري التحميل...</p>
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">إضافة / تحويل مخزون</h1>
        <p className="text-muted-foreground mt-1">تحويل أصناف بين المخازن أو إضافة مخزون جديد</p>
      </div>

      <Tabs defaultValue="transfer" dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transfer">تحويل بين المخازن</TabsTrigger>
          <TabsTrigger value="add">إضافة مخزون</TabsTrigger>
        </TabsList>

        <TabsContent value="transfer">
          <Card>
            <CardHeader><CardTitle>تحويل مخزني</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>من مخزن (المركز الأم)</Label>
                  <Select
                    value={fromWh}
                    onValueChange={setFromWh}
                    disabled={true}
                  >
                    <SelectTrigger className="bg-muted font-bold"><SelectValue placeholder="المخزن الرئيسي" /></SelectTrigger>
                    <SelectContent>
                      {warehouses.filter(w => w.type === 'main').map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>إلى مخزن (العيادة الاستلام)</Label>
                  <Select value={toWh} onValueChange={setToWh}>
                    <SelectTrigger><SelectValue placeholder="الوجهة..." /></SelectTrigger>
                    <SelectContent>
                      {warehouses.filter(w => w.type !== 'main').map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>ابحث عن الصنف</Label>
                <ItemSearchField
                  items={items}
                  selectedItemId={selectedItem}
                  onSelect={setSelectedItem}
                  warehouseId={fromWh}
                  getItemStock={getItemStock}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الكمية</Label>
                  <Input type="number" min="1" value={transferQty} onChange={e => setTransferQty(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>الوحدة</Label>
                  <Select value={transferUnit} onValueChange={v => setTransferUnit(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">قطعة</SelectItem>
                      {transferItemData && transferItemData.conversionFactor > 1 && (
                        <SelectItem value="box">علبة ({transferItemData.conversionFactor} قطعة)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {transferItemData && transferQty && Number(transferQty) > 0 && (
                <div className="p-3 rounded-lg bg-muted text-sm">
                  <span className="text-muted-foreground">التكلفة: </span>
                  <span className="font-bold text-primary">
                    {((transferUnit === 'box' ? Number(transferQty) * transferItemData.conversionFactor : Number(transferQty)) * transferItemData.purchasePrice).toLocaleString()} ريال
                  </span>
                </div>
              )}
              <Button className="w-full" size="lg" onClick={handleTransfer} disabled={submitting}>
                {submitting ? 'جاري التحويل...' : 'تأكيد التحويل'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader><CardTitle>إضافة مخزون جديد</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>المخزن</Label>
                <Select value={addWh} onValueChange={setAddWh} disabled={true}>
                  <SelectTrigger className="bg-muted font-bold"><SelectValue placeholder="اختر المخزن..." /></SelectTrigger>
                  <SelectContent>
                    {warehouses.filter(w => w.type === 'main').map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الصنف</Label>
                <ItemSearchField
                  items={items}
                  selectedItemId={addItemId}
                  onSelect={setAddItemId}
                  warehouseId={addWh}
                  getItemStock={getItemStock}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الكمية</Label>
                  <Input type="number" min="1" value={addQty} onChange={e => setAddQty(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>الوحدة</Label>
                  <Select value={addUnit} onValueChange={v => setAddUnit(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">قطعة</SelectItem>
                      {addItemData && addItemData.conversionFactor > 1 && (
                        <SelectItem value="box">علبة ({addItemData.conversionFactor} قطعة)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" size="lg" onClick={handleAdd} disabled={submitting}>
                {submitting ? 'جاري الإضافة...' : 'تأكيد الإضافة'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
