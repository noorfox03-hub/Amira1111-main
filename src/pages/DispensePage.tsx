import { useState } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, Search, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemSearchField } from '@/components/ItemSearchField';

export default function DispensePage() {
  const { warehouses, items, getItemStock, getWarehouseItems, dispenseItem, isLoading, error } = useInventoryStore();
  const { toast } = useToast();
  
  const clinics = warehouses.filter(w => w.type === 'clinic');
  const mainWarehouse = warehouses.find(w => w.type === 'main');

  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'piece' | 'box'>('piece');
  const [submitting, setSubmitting] = useState(false);

  const selectedItemData = items.find(i => i.id === selectedItem);
  // Always check stock from Main Warehouse
  const currentStock = selectedItem && mainWarehouse ? getItemStock(mainWarehouse.id, selectedItem) : 0;
  
  const isLowStock = selectedItemData ? currentStock <= selectedItemData.minLimit : false;
  const finalQty = selectedItemData && quantity
    ? unit === 'box' ? Number(quantity) * selectedItemData.conversionFactor : Number(quantity)
    : 0;
  const totalCost = selectedItemData ? finalQty * selectedItemData.salePrice : 0;
  const insufficientStock = finalQty > currentStock;

  const handleDispense = async () => {
    if (!selectedClinic || !selectedItem || !quantity || Number(quantity) <= 0) {
      toast({ title: 'خطأ', description: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }
    
    if (!mainWarehouse) {
      toast({ title: 'خطأ', description: 'المستودع الرئيسي غير موجود', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    // Dispense from MAIN to CLINIC
    const result = await dispenseItem(mainWarehouse.id, selectedItem, Number(quantity), unit, selectedClinic);
    setSubmitting(false);
    
    if (result.success) {
      toast({ title: 'تم الصرف بنجاح', description: result.message });
      setSelectedItem('');
      setQuantity('');
    } else {
      toast({ title: 'خطأ', description: result.message, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">صرف صنف</h1>
          <p className="text-muted-foreground mt-1">جاري التحميل...</p>
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in max-w-2xl">
        <div className="p-8 bg-destructive/10 border border-destructive rounded-xl text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-destructive mb-2">حدث خطأ أثناء جلب البيانات</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">صرف صنف للموقع</h1>
        <p className="text-muted-foreground mt-1">يتم الصرف مباشرة من المستودع الرئيسي للعيادة المختارة</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الصرف المباشر</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>العيادة المستلمة</Label>
            <Select value={selectedClinic} onValueChange={setSelectedClinic}>
              <SelectTrigger><SelectValue placeholder="اختر العيادة..." /></SelectTrigger>
              <SelectContent>
                {clinics.length === 0 ? (
                  <p className="p-2 text-sm text-center text-muted-foreground">لا توجد عيادات مسجلة</p>
                ) : (
                  clinics.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ابحث عن الصنف (من المستودع الرئيسي)</Label>
            <ItemSearchField
              items={mainWarehouse ? getWarehouseItems(mainWarehouse.id).map(r => r.item) : []}
              selectedItemId={selectedItem}
              onSelect={setSelectedItem}
              warehouseId={mainWarehouse?.id || ''}
              getItemStock={getItemStock}
            />
          </div>

          {selectedItem && selectedItemData && (
            <>
              <div className={`p-4 rounded-lg border ${isLowStock ? 'border-destructive bg-destructive/5' : 'border-success bg-success/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isLowStock ? <AlertTriangle className="w-5 h-5 text-destructive" /> : <Check className="w-5 h-5 text-success" />}
                    <span className="font-medium">{selectedItemData.name}</span>
                  </div>
                  <span className="font-bold">رصيد المستودع: {currentStock} قطعة</span>
                </div>
                {isLowStock && (
                  <p className="text-sm text-destructive mt-2">⚠️ رصيد المستودع الرئيسي تحت الحد الأدنى ({selectedItemData.minLimit} قطعة).</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الكمية</Label>
                  <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="أدخل الكمية" />
                </div>
                <div className="space-y-2">
                  <Label>الوحدة</Label>
                  <Select value={unit} onValueChange={v => setUnit(v as 'piece' | 'box')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">قطعة</SelectItem>
                      {selectedItemData.conversionFactor > 1 && (
                        <SelectItem value="box">علبة ({selectedItemData.conversionFactor} قطعة)</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {quantity && Number(quantity) > 0 && (
                <div className={`p-4 rounded-lg ${insufficientStock ? 'bg-destructive/10 border border-destructive' : 'bg-muted'}`}>
                  {insufficientStock ? (
                    <div className="space-y-4">
                      <p className="text-destructive font-medium">❌ لا يوجد رصيد كافٍ في المستودع الرئيسي. المتاح {currentStock} قطعة فقط.</p>
                      <Button asChild variant="outline" className="w-full gap-2 border-destructive text-destructive hover:bg-destructive/10">
                        <Link to="/reports">
                          <PlusCircle className="w-4 h-4" /> مراجعة النواقص في التقارير
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">الكمية بالقطعة</span>
                        <span className="font-medium">{finalQty} قطعة</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">سعر القطعة</span>
                        <span className="font-medium">{selectedItemData.salePrice} ريال</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-border pt-1 mt-1">
                        <span>إجمالي التكلفة</span>
                        <span className="text-primary">{totalCost.toLocaleString()} ريال</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!selectedClinic || !quantity || Number(quantity) <= 0 || insufficientStock || submitting}
                onClick={handleDispense}
              >
                {submitting ? 'جاري الصرف...' : 'تأكيد الصرف المباشر'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
