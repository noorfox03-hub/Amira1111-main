import { useState, useMemo } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { PackageMinus, Warehouse, Search, Calendar, Edit3, RotateCcw, AlertCircle, History, Trash2, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ItemSearchField } from '@/components/ItemSearchField';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
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

export default function AdjustmentPage() {
    const { warehouses, items, transactions, getItemStock, addStock, dispenseItem, reverseTransaction, isLoading } = useInventoryStore();
    const { toast } = useToast();

    const [adjustmentType, setAdjustmentType] = useState('clinic');
    const [selectedItem, setSelectedItem] = useState('');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const mainWarehouse = warehouses.find(w => w.type === 'main');
    const selectedWarehouse = mainWarehouse?.id || '';

    // آخر 10 حركات تسوية
    const lastAdjustments = useMemo(() => {
        return transactions
            .filter(tx => tx.type === 'adjustment')
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
    }, [transactions]);

    const handleAdjust = async () => {
        if (!selectedWarehouse || !selectedItem || !quantity) {
            toast({ title: 'نقص في البيانات', description: 'يرجى اختيار الصنف وتحديد الكمية', variant: 'destructive' });
            return;
        }

        const numQty = Number(quantity);
        if (isNaN(numQty) || numQty === 0) {
            toast({ title: 'خطأ', description: 'الكمية يجب أن تكون رقماً غير الصفر', variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        try {
            // ملاحظة: في دالة المخزن، quantity الموجب في adjustment يعني نقص (consumption) 
            // والسالب يعني زيادة (return/correction)
            // لذا سنرسله كما هو.
            const res = await dispenseItem(selectedWarehouse, selectedItem, numQty, 'piece', undefined, 'adjustment', notes, date);
            
            if (res.success) {
                toast({ title: 'تم الحفظ', description: 'تمت تسوية المخزون بنجاح' });
                setSelectedItem('');
                setQuantity('');
                setNotes('');
            } else {
                toast({ title: 'خطأ', description: res.message, variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'فشل العملية', description: e.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleReverse = async (txId: string) => {
        try {
            const res = await reverseTransaction(txId);
            if (res.success) {
                toast({ title: 'تم التراجع', description: 'تم إلغاء الحركة وتحديث الرصيد' });
            }
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        } finally {
            setDeleteId(null);
        }
    };

    if (isLoading) return <div className="p-8 space-y-4 opacity-30"><Skeleton className="h-10 w-48 rounded-xl" /><Skeleton className="h-96 w-full rounded-2xl" /></div>;

    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in bg-slate-50/10 min-h-screen" dir="rtl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-sky-600 p-2.5 rounded-2xl rotate-3 shadow-xl shadow-sky-200">
                        <PackageMinus className="w-8 h-8 text-white -rotate-3" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">تسوية كميات</h1>
                        <p className="text-muted-foreground font-bold text-sm italic">تصحيح الأرصدة وتسجيل الاستهلاك اليدوي</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* نموذج التسوية */}
                <Card className="xl:col-span-12 2xl:col-span-5 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl h-fit">
                    <CardHeader className="p-6 border-b bg-sky-50/30">
                        <CardTitle className="text-lg font-black text-sky-900 flex items-center gap-2">
                             نوع التسوية
                        </CardTitle>
                        <RadioGroup value={adjustmentType} onValueChange={setAdjustmentType} className="grid grid-cols-2 gap-3 max-w-sm mt-3">
                            <div className="flex items-center gap-2 p-2 rounded-xl border-2 border-transparent bg-muted/30 hover:bg-sky-50 transition-all cursor-pointer has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
                                <RadioGroupItem value="clinic" id="clinic" className="w-4 h-4" />
                                <Label htmlFor="clinic" className="cursor-pointer font-bold text-xs">استهلاك العيادة</Label>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-xl border-2 border-transparent bg-muted/30 hover:bg-sky-50 transition-all cursor-pointer has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
                                <RadioGroupItem value="patient" id="patient" className="w-4 h-4" />
                                <Label htmlFor="patient" className="cursor-pointer font-bold text-xs">استهلاك المرضى</Label>
                            </div>
                        </RadioGroup>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-500">
                                    <Warehouse className="w-3 h-3 text-sky-600" /> الموقع المستهدف
                                </Label>
                                <div className="h-10 flex items-center px-4 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-600 text-xs shadow-inner">
                                    {mainWarehouse?.name || 'المستودع الرئيسي'}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-500">
                                    <Search className="w-3 h-3 text-sky-600" /> الصنف بالاسم أو الكود
                                </Label>
                                <ItemSearchField
                                    items={items}
                                    selectedItemId={selectedItem}
                                    onSelect={setSelectedItem}
                                    warehouseId={selectedWarehouse}
                                    getItemStock={getItemStock}
                                    className="h-10 text-sm font-black border-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-500">
                                    <PackageMinus className="w-3 h-3 text-sky-600" /> القيمة المطلوبة
                                </Label>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-10 w-10 rounded-xl border-2 hover:bg-rose-50 hover:text-rose-600 transition-all shadow-sm shrink-0"
                                            onClick={() => setQuantity(prev => {
                                                const val = Number(prev) || 0;
                                                return String(val - 1);
                                            })}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </Button>
                                        <Input
                                            type="number"
                                            value={quantity}
                                            onChange={e => setQuantity(e.target.value)}
                                            placeholder="0.00"
                                            className="h-10 rounded-xl shadow-sm border-sky-100 text-lg font-black text-center flex-1 bg-white"
                                        />
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-10 w-10 rounded-xl border-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm shrink-0"
                                            onClick={() => setQuantity(prev => {
                                                const val = Number(prev) || 0;
                                                return String(val + 1);
                                            })}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="text-[9px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 w-fit mx-auto shadow-sm">
                                        ضع (-) للزيادة
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-500">
                                    <Calendar className="w-3 h-3 text-sky-600" /> تاريخ التسوية
                                </Label>
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="h-10 rounded-xl shadow-sm border-2 font-bold text-xs"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label className="font-bold flex items-center gap-1.5 text-xs text-slate-500">
                                    <Edit3 className="w-3 h-3 text-sky-600" /> ملاحظات أو سبب التصحيح
                                </Label>
                                <Textarea
                                    placeholder="اكتب أي تفاصيل هنا..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="h-10 min-h-[40px] rounded-xl shadow-sm border-2 resize-none py-2 text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-2">
                            <Button
                                onClick={handleAdjust}
                                disabled={submitting}
                                className="flex-1 h-10 text-sm font-black bg-sky-600 hover:bg-sky-700 shadow-md shadow-sky-100"
                            >
                                {submitting ? 'جاري الحفظ...' : 'تأكيد وحفظ التعديلات'}
                            </Button>
                            <Button
                                variant="outline"
                                className="sm:w-28 h-10 border-sky-200 text-sky-700 hover:bg-sky-50 text-xs font-bold"
                                onClick={() => window.history.back()}
                            >
                                <RotateCcw className="w-3 h-3 ml-1" /> إلغاء
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* جدول آخر الحركات */}
                <Card className="xl:col-span-12 border-none shadow-xl rounded-[2rem] overflow-hidden bg-white/50 border border-white">
                    <CardHeader className="p-4 border-b bg-slate-50/50">
                        <CardTitle className="text-sm font-black text-slate-400 flex items-center gap-2 uppercase tracking-wide">
                            <History className="w-4 h-4 text-slate-400" /> آخر 10 حركات تسوية مسجلة
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-slate-100/50 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                    <tr>
                                        <th className="p-3 px-6">الصنف</th>
                                        <th className="p-3 text-center">الكمية</th>
                                        <th className="p-4 text-center">التاريخ</th>
                                        <th className="p-4 text-left px-8">إجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {lastAdjustments.map(tx => {
                                        const item = items.find(i => i.id === tx.itemId);
                                        return (
                                            <tr key={tx.id} className="group hover:bg-slate-50 transition-colors">
                                                <td className="p-3 px-6">
                                                   <div className="flex flex-col">
                                                     <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 bg-white rounded-md border flex items-center justify-center font-mono text-[8px] font-black text-slate-400">{item?.id}</div>
                                                        <span className="font-black text-slate-700 text-xs">{item?.name}</span>
                                                     </div>
                                                     <span className="text-[10px] text-slate-400 mr-8">{tx.note || 'تسوية يدوية'}</span>
                                                   </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <Badge variant="secondary" className={`rounded-md font-black text-xs ${tx.quantity > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                        {tx.quantity > 0 ? `-${tx.quantity}` : `+${Math.abs(tx.quantity)}`}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-center text-[10px] font-bold text-slate-400 tabular-nums">
                                                    {format(new Date(tx.timestamp), 'yyyy/MM/dd')}
                                                </td>
                                                <td className="p-3 text-left px-8">
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(tx.id)} className="h-8 w-8 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {lastAdjustments.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-10 text-center text-slate-200 font-bold italic text-sm">لا توجد حركات تسوية مسجلة</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
                <AlertDialogContent dir="rtl" className="rounded-[2rem] border-none shadow-2xl p-8 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-black">تأكيد التراجع</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-bold text-slate-500">
                            هل تودين التراجع عن هذه التسوية؟ سيتم عكس الأثر المخزني فوراً.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 pt-4">
                        <AlertDialogCancel className="h-10 rounded-xl font-bold border-2 text-xs">إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteId && handleReverse(deleteId)} className="h-10 rounded-xl font-black bg-rose-600 hover:bg-rose-700 text-xs">تأكيد</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
