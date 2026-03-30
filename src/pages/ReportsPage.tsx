import React, { useMemo, useState } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Plus, Minus, Printer, TrendingUp, DollarSign, Calendar, RotateCcw, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


// مكون فرعي لعرض تقرير مخزن/عيادة محددة
function WarehouseReportSection({
  warehouse,
  items,
  transactions,
  selectedDate,
  getItemStock,
  warehouses
}: {
  warehouse: any,
  items: any[],
  transactions: any[],
  selectedDate: string,
  getItemStock: (wId: string, iId: string) => number,
  warehouses: any[]
}) {
  const warehouseId = warehouse.id;
  const isMainWarehouse = warehouseId === 'main';

  const itemReport = useMemo(() => {
    return items.map(item => {
      const itemTransactions = transactions.filter(t => {
        const txDate = new Date(t.timestamp);
        const [selYear, selMonth] = selectedDate.split('-').map(Number);
        const isMatch = (t.fromWarehouseId === warehouseId || t.toWarehouseId === warehouseId) &&
          t.itemId === item.id &&
          txDate.getFullYear() === selYear &&
          (txDate.getMonth() + 1) === selMonth;
        return isMatch;
      });

      const added = itemTransactions
        .filter(t => (t.type === 'add' || t.type === 'transfer') && t.toWarehouseId === warehouseId)
        .reduce((sum, t) => sum + t.quantity, 0);

      // للمخزن الرئيسي: الاستهلاك هو (المنصرف + المحول للعيادات)
      // للعيادات: الاستهلاك هو (المنصرف فقط)
      const dispensed = itemTransactions
        .filter(t =>
          (t.type === 'dispense' && t.fromWarehouseId === warehouseId) ||
          (isMainWarehouse && t.type === 'transfer' && t.fromWarehouseId === 'main')
        )
        .reduce((sum, t) => sum + t.quantity, 0);

      // تفاصيل الاستهلاك حسب الموقع (العيادات)
      const consumptionByClinic = isMainWarehouse ? warehouses
        .filter(w => w.id !== 'main')
        .map(w => ({
          name: w.name,
          amount: itemTransactions
            .filter(t => t.type === 'transfer' && t.fromWarehouseId === 'main' && t.toWarehouseId === w.id)
            .reduce((sum, t) => sum + t.quantity, 0)
        })).filter(c => c.amount > 0) : [];

      const currentStock = getItemStock(warehouseId, item.id);

      return {
        item,
        added,
        dispensed,
        currentStock,
        consumptionByClinic,
        totalCost: dispensed * (item.salePrice || 0)
      };
    });
  }, [warehouseId, selectedDate, transactions, items, getItemStock, isMainWarehouse, warehouses]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        const txDate = new Date(tx.timestamp);
        const [selYear, selMonth] = selectedDate.split('-').map(Number);
        return (tx.fromWarehouseId === warehouseId || tx.toWarehouseId === warehouseId) &&
          txDate.getFullYear() === selYear &&
          (txDate.getMonth() + 1) === selMonth;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [warehouseId, selectedDate, transactions]);

  const totalMonthlySpend = itemReport.reduce((sum, r) => sum + r.totalCost, 0);

  return (
    <div className="space-y-8 py-8 break-after-page print:pt-0">
      {/* Official Print Header */}
      <div className="hidden print:block text-center border-b-2 border-primary pb-6 mb-8">
        <h1 className="text-3xl font-extrabold text-primary mb-1">نظام إدارة المخازن</h1>
        <p className="text-lg font-medium italic">تقرير متابعة المخزون والاستهلاك</p>
        <div className="flex justify-center gap-6 mt-3 text-[12px] font-bold">
          <p>المخزن: {warehouse.name}</p>
          <p>الفترة: {selectedDate}</p>
          <p>تاريخ الطبع: {format(new Date(), 'yyyy/MM/dd HH:mm')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2 print:hidden">
        <div className="bg-primary/10 p-2 rounded-full"><TrendingUp className="w-5 h-5 text-primary" /></div>
        <h2 className="text-2xl font-bold">تقرير: {warehouse.name}</h2>
      </div>

      {/* Stats Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-grid-cols-3">
        <Card className="bg-primary/5 border-primary/20 shadow-none print:border-none">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-bold">إجمالي تكلفة الاستهلاك</p>
            <p className="text-xl font-black text-primary">{totalMonthlySpend.toLocaleString()} ريال</p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20 shadow-none print:border-none">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-bold">أصناف تم سحبها</p>
            <p className="text-xl font-black text-success">{itemReport.filter(r => r.dispensed > 0).length} صنف</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20 shadow-none print:border-none">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-bold">تنبيهات المخزون</p>
            <p className="text-xl font-black text-accent">{itemReport.filter(r => r.currentStock <= r.item.minLimit).length} صنف منخفض</p>
          </CardContent>
        </Card>
      </div>

      {/* Consumption Table */}
      <Card className="overflow-hidden shadow-sm border-2 print:border-none">
        <CardHeader className="bg-muted/50 p-4 border-b">
          <CardTitle className="text-lg">ملخص الاستهلاك والأسعار</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="text-center font-bold py-2">الصنف</TableHead>
                <TableHead className="text-center font-bold">الرصيد</TableHead>
                <TableHead className="text-center font-bold">المصروف</TableHead>
                <TableHead className="text-center font-bold">المضاف</TableHead>
                <TableHead className="text-center font-bold text-sky-600">تكلفة الاستهلاك</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemReport.map((report) => (
                <React.Fragment key={report.item.id}>
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="font-bold text-center">{report.item.name}</TableCell>
                    <TableCell className="text-center">{report.currentStock} {report.item.unitType === 'box' ? 'علبة' : 'قطعة'}</TableCell>
                    <TableCell className="text-center text-destructive font-bold">{report.dispensed}</TableCell>
                    <TableCell className="text-center text-success font-bold">{report.added}</TableCell>
                    <TableCell className="text-center text-primary font-bold">{(report.totalCost).toLocaleString()} ريال</TableCell>
                  </TableRow>
                  {report.consumptionByClinic.length > 0 && (
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={5} className="py-2 px-4">
                        <div className="flex flex-wrap gap-4 text-xs">
                          <span className="font-bold text-muted-foreground italic">تفاصيل السحب:</span>
                          {report.consumptionByClinic.map(c => (
                            <span key={c.name} className="bg-white border rounded-full px-3 py-1 shadow-sm">
                              {c.name}: <span className="text-primary font-bold">{c.amount}</span>
                            </span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              <TableRow className="bg-slate-50 font-black border-t-2">
                <TableCell colSpan={4} className="py-4 text-md text-center">إجمالي تكلفة استهلاك {warehouse.name}:</TableCell>
                <TableCell className="text-center text-lg text-sky-600">{totalMonthlySpend.toLocaleString()} ريال</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detailed Transaction Log */}
      <Card className="shadow-none border-t-2 print:mt-4">
        <CardHeader className="p-4"><CardTitle className="text-md flex items-center gap-2">تتبع الحركة اليومية</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="text-[11px]">
                <TableHead className="text-center py-1">التاريخ</TableHead>
                <TableHead className="text-center">العملية</TableHead>
                <TableHead className="text-center">الصنف</TableHead>
                <TableHead className="text-center">الكمية</TableHead>
                <TableHead className="text-center">التكلفة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions
                .map((t) => {
                  const item = items.find(i => i.id === t.itemId);
                  return (
                    <TableRow key={t.id} className="text-[11px]">
                      <TableCell className="text-center">{new Date(t.timestamp).toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={t.type === 'dispense' ? 'destructive' : 'outline'} className="text-[10px] px-1 py-0 h-4 mx-auto">
                          {t.type === 'dispense' ? 'صرف' : t.type === 'add' ? 'إضافة' : 'تحويل'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-center">{item?.name}</TableCell>
                      <TableCell className="text-center">{t.quantity}</TableCell>
                      <TableCell className="text-center font-bold">{t.totalPrice > 0 ? t.totalPrice : '--'}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Institutional Stamp Section for Print */}
      <div className="hidden print:flex flex-row justify-between mt-12 px-6">
        <div className="text-center">
          <p className="font-bold text-xs mb-8">توقيع مسؤول {warehouse.name}</p>
          <div className="border-t border-black w-32 mx-auto"></div>
        </div>
        <div className="text-center">
          <p className="font-bold text-sm mb-2 text-primary">الأستاذة أميرة / Ms. Amira</p>
          <p className="font-bold text-xs mb-8">اعتماد الإدارة</p>
          <div className="border-t-2 border-primary w-40 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { warehouses, items, transactions, getItemStock, fetchData, isLoading } = useInventoryStore();
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM'));
  const [isComprehensive, setIsComprehensive] = useState(false);

  const handleResetTransactions = async () => {
    try {
      const { resetTransactions } = useInventoryStore.getState();
      await resetTransactions();
      toast.success('تم تصفير كافة السجلات بنجاح');
      fetchData(); // Refresh data after reset
    } catch (error) {
      toast.error('فشل تصفير السجلات');
    }
  };

  const handlePrintComprehensive = () => {
    // خدعة المبرمجين: تغيير الـ Viewport مؤقتاً لخدعة متصفح الموبايل
    const viewport = document.querySelector('meta[name="viewport"]');
    const originalContent = viewport?.getAttribute('content');

    // إجبار الموبايل على رؤية الصفحة كـ Desktop
    viewport?.setAttribute('content', 'width=1024');

    document.body.classList.add('is-printing-comprehensive');
    setIsComprehensive(true);

    setTimeout(() => {
      window.print();

      const cleanup = () => {
        document.body.classList.remove('is-printing-comprehensive');
        setIsComprehensive(false);
        // إعادة الـ Viewport لوضعه الطبيعي بعد الطباعة
        if (originalContent) {
          viewport?.setAttribute('content', originalContent);
        }
      };

      // تنظيف الكلاس بعد الطباعة أو الإلغاء
      window.addEventListener('afterprint', cleanup, { once: true });

      // أمان إضافي للموبايل
      setTimeout(cleanup, 5000);
    }, 1500);
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto pb-12" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="text-primary" /> التقارير والتحليلات
          </h1>
          <p className="text-muted-foreground mt-1">المتابعة المالية وحركة الأصناف لجميع المواقع</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchData()}>تحديث</Button>
          <Button variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700" onClick={handlePrintComprehensive}>
            <Printer className="w-4 h-4" /> طباعة التقرير الشامل
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()} disabled={!selectedWarehouse}>
            <Printer className="w-4 h-4" /> طباعة الحالي
          </Button>
        </div>
      </div>

      {/* Filters Case-only */}
      <Card className="no-print">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" /> خيارات التقرير
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-bold">العيادة المستهدفة</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="h-12 border-2"><SelectValue placeholder="اختر العيادة..." /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-bold">الشهر</Label>
              <Input type="month" className="h-12 border-2" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mt-6 justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="ml-2 h-4 w-4" />
                  تصفير السجلات
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>هل أنت متأكد من تصفير السجلات؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم مسح كافة حركات الإضافة والصرف والتحويل نهائياً من النظام للبدء بشهر جديد. لا يمكن التراجع عن هذا الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetTransactions} className="bg-destructive hover:bg-destructive/90 text-white">
                    تأكيد المسح
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="outline" onClick={handlePrintComprehensive}>
              <Printer className="ml-2 h-4 w-4" />
              طباعة التقرير الشامل
            </Button>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="ml-2 h-4 w-4" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main View Logic */}
      <div className="normal-report-view">
        {!selectedWarehouse ? (
          <div className="py-20 text-center border-2 border-dashed rounded-xl">
            <TrendingUp className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">التفاصيل المالية لعيادة محددة تظهر هنا</p>
          </div>
        ) : (
          <WarehouseReportSection
            warehouse={warehouses.find(w => w.id === selectedWarehouse)}
            items={items}
            transactions={transactions}
            selectedDate={selectedDate}
            getItemStock={getItemStock}
            warehouses={warehouses}
          />
        )}
      </div>

      {/* Comprehensive View Logic (Shown only during printing) */}
      <div className="comprehensive-report-container">
        <div className="text-center py-10 no-print">
          <p className="animate-pulse text-lg font-bold text-primary">جاري تجهيز التقرير الشامل لجميع العيادات...</p>
        </div>
        {warehouses.map(wh => (
          <WarehouseReportSection
            key={wh.id}
            warehouse={wh}
            items={items}
            transactions={transactions}
            selectedDate={selectedDate}
            getItemStock={getItemStock}
            warehouses={warehouses}
          />
        ))}
      </div>
    </div>
  );
}
