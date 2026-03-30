import { useState, useMemo } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PackageMinus, Search, History, AlertCircle, RotateCcw, Warehouse, Calendar, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ItemSearchField } from '@/components/ItemSearchField';

export default function AdjustmentPage() {
    const { items, warehouses, inventory, transactions, dispenseItem, addStock, isLoading, getItemStock } = useInventoryStore();
    const { toast } = useToast();

    const [selectedWarehouse, setSelectedWarehouse] = useState('1'); // Default to main warehouse if id is 1
    const [selectedItem, setSelectedItem] = useState('');
    const [adjustmentType, setAdjustmentType] = useState('clinic');
    const [quantity, setQuantity] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const selectedItemData = items.find(i => i.id === selectedItem);
    const currentStock = selectedItem ? getItemStock(selectedWarehouse, selectedItem) : 0;

    const handleAdjust = async () => {
        if (!selectedItem || !quantity) {
            toast({ title: 'خطأ', description: 'يرجى اختيار الصنف وتحديد الكمية', variant: 'destructive' });
            return;
        }

        const qty = Number(quantity);
        setSubmitting(true);

        try {
            if (qty > 0) {
                // Positive value -> Dispense (Decrease stock)
                await dispenseItem(selectedWarehouse, selectedItem, qty, 'piece');
            } else if (qty < 0) {
                // Negative value -> Add (Increase stock)
                await addStock(selectedWarehouse, selectedItem, Math.abs(qty), 'piece');
            }

            toast({ title: 'تمت العملية', description: 'تمت تسوية الكمية بنجاح' });
            setQuantity('');
            setNotes('');
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const history = useMemo(() => {
        return transactions
            .filter(tx => tx.itemId === selectedItem && tx.fromWarehouseId === selectedWarehouse)
            .slice(0, 10);
    }, [transactions, selectedItem, selectedWarehouse]);

    if (isLoading) return <div className="p-8"><Badge>جاري التحميل...</Badge></div>;

    return (
        <div className="p-4 md:p-8 space-y-6 animate-fade-in" dir="rtl">
            <div className="flex items-center gap-3 border-b pb-4">
                <div className="bg-sky-100 p-2 rounded-lg">
                    <PackageMinus className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-sky-900">تسوية كميات</h1>
                    <p className="text-sm text-muted-foreground">صرف أو إضافة كميات يدوياً للمخزن</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* نموذج التسوية */}
                <Card className="shadow-md border-sky-200/50">
                    <CardHeader className="bg-sky-50/50 border-b">
                        <CardTitle className="text-lg">تفاصيل التسوية</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sky-800 font-bold">
                                <AlertCircle className="w-5 h-5 text-sky-600" />
                                <Label className="text-base">نوع الاستهلاك / السحب:</Label>
                            </div>
                            <RadioGroup value={adjustmentType} onValueChange={setAdjustmentType} className="grid grid-cols-2 gap-4 max-w-md">
                                <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-transparent bg-muted/30 hover:bg-sky-50 transition-all cursor-pointer has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
                                    <RadioGroupItem value="clinic" id="clinic" />
                                    <Label htmlFor="clinic" className="cursor-pointer font-bold text-sm">استهلاك العيادة</Label>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-xl border-2 border-transparent bg-muted/30 hover:bg-sky-50 transition-all cursor-pointer has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
                                    <RadioGroupItem value="patient" id="patient" />
                                    <Label htmlFor="patient" className="cursor-pointer font-bold text-sm">استهلاك المرضى</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-end">
                            <div className="space-y-3">
                                <Label className="font-bold flex items-center gap-2">
                                    <Warehouse className="w-4 h-4 text-sky-600" /> الموقع المستهدف
                                </Label>
                                <div className="h-12 flex items-center px-4 rounded-xl bg-sky-50 border border-sky-100 font-bold text-sky-900">
                                    المستودع الرئيسي
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="font-bold flex items-center gap-2">
                                    <Search className="w-4 h-4 text-sky-600" /> ابحث عن الصنف
                                </Label>
                                <ItemSearchField
                                    items={items}
                                    selectedItemId={selectedItem}
                                    onSelect={setSelectedItem}
                                    warehouseId={selectedWarehouse}
                                    getItemStock={getItemStock}
                                    className="h-12"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="font-bold flex items-center gap-2">
                                    <PackageMinus className="w-4 h-4 text-sky-600" /> القيمة (الكمية)
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={quantity}
                                        onChange={e => setQuantity(e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 rounded-xl shadow-sm border-sky-100 text-lg font-bold"
                                    />
                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                                        <AlertCircle className="w-3 h-3 text-amber-600" />
                                        <span>لإضافة رصيد (زيادة) ضع علامة (-) قبل الرقم</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="font-bold flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-sky-600" /> التاريخ
                                </Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="h-12 rounded-xl shadow-sm border-sky-100"
                                />
                            </div>

                            <div className="space-y-3 md:col-span-2 xl:col-span-1">
                                <Label className="font-bold flex items-center gap-2">
                                    <Edit3 className="w-4 h-4 text-sky-600" /> ملاحظات إضافية
                                </Label>
                                <Textarea
                                    placeholder="اكتب أي تفاصيل هنا..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="h-12 min-h-[48px] rounded-xl shadow-sm border-sky-100 resize-none py-3"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t mt-4">
                            <Button
                                onClick={handleAdjust}
                                disabled={submitting}
                                className="flex-1 h-12 text-lg font-bold bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-200"
                            >
                                {submitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                            </Button>
                            <Button
                                variant="outline"
                                className="sm:w-32 h-12 border-sky-200 text-sky-700 hover:bg-sky-50"
                                onClick={() => window.history.back()}
                            >
                                <RotateCcw className="w-4 h-4 ml-2" /> إلغاء
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* معلومات الرصيد والسجل */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="bg-sky-50 border-sky-200">
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                الرصيد الحالي
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-center pb-4">
                            <div className="text-3xl font-black text-sky-700">
                                {currentStock}
                                <span className="text-xs font-medium mr-2 text-muted-foreground">قطعة</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">{selectedItemData?.name || 'لم يتم اختيار صنف'}</p>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-3 shadow-sm">
                        <CardHeader className="border-b py-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <History className="w-4 h-4 text-sky-600" /> آخر الحركات
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow>
                                        <TableHead className="text-right text-xs w-12">م</TableHead>
                                        <TableHead className="text-right text-xs">الصنف</TableHead>
                                        <TableHead className="text-center text-xs">الكمية</TableHead>
                                        <TableHead className="text-center text-xs">التاريخ</TableHead>
                                        <TableHead className="text-left text-xs">ملاحظات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((tx, idx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="text-xs">{idx + 1}</TableCell>
                                            <TableCell className="text-xs font-medium">{items.find(i => i.id === tx.itemId)?.name}</TableCell>
                                            <TableCell className="text-center font-bold text-xs">{tx.quantity}</TableCell>
                                            <TableCell className="text-center text-[10px]">{format(tx.timestamp, 'yyyy-MM-dd')}</TableCell>
                                            <TableCell className="text-left text-xs">{tx.note || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                    {history.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-6 text-xs text-muted-foreground">
                                                لا توجد حركات سابقة
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
