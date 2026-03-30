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
        const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number);
        
        // التحقق من السنة والشهر
        const isSameMonth = txDate.getFullYear() === selYear && (txDate.getMonth() + 1) === selMonth;
        // التحقق من أن اليوم قبل أو يطابق اليوم المختار (للحساب التراكمي في نفس الشهر)
        const isBeforeOrOnDay = txDate.getDate() <= selDay;

        return (t.fromWarehouseId === warehouseId || t.toWarehouseId === warehouseId) &&
          t.itemId === item.id &&
          isSameMonth &&
          isBeforeOrOnDay;
      });

      const added = itemTransactions
        .filter(t => (t.type === 'add' || t.type === 'transfer') && t.toWarehouseId === warehouseId)
        .reduce((sum, t) => sum + t.quantity, 0);

      // للمستودع الرئيسي: الاستهلاك هو كل ما صُرف منه مباشرة أو حُوّل للعيادات
      // للعيادات: الاستهلاك هو ما صُرف لها من الرئيسي أو صُرف منها (المنطق القديم)
      const dispensed = itemTransactions
        .filter(t => {
          if (t.type === 'dispense') {
            // صُرف من هذا المستودع أو صُرف إليه كوجهة نهائية
            return t.fromWarehouseId === warehouseId || t.toWarehouseId === warehouseId;
          }
          if (t.type === 'transfer' && t.fromWarehouseId === warehouseId) {
            // تحويل من هذا المستودع (للمستودع الرئيسي فقط عادة)
            return true;
          }
          return false;
        })
        .reduce((sum, t) => sum + t.quantity, 0);

      // تفاصيل الاستهلاك حسب الموقع (للعيادات المخدومة من الرئيسي)
      const consumptionByClinic = isMainWarehouse ? warehouses
        .filter(w => w.type === 'clinic')
        .map(w => ({
          name: w.name,
          amount: itemTransactions
            .filter(t => 
              (t.type === 'transfer' && t.fromWarehouseId === warehouseId && t.toWarehouseId === w.id) ||
              (t.type === 'dispense' && t.fromWarehouseId === warehouseId && t.toWarehouseId === w.id)
            )
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
        const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number);
        
        const isSameMonth = txDate.getFullYear() === selYear && (txDate.getMonth() + 1) === selMonth;
        const isBeforeOrOnDay = txDate.getDate() <= selDay;

        return (tx.fromWarehouseId === warehouseId || tx.toWarehouseId === warehouseId) &&
          isSameMonth &&
          isBeforeOrOnDay;
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
        <Card className="bg-primary/5 border-primary/20 shadow-none print:border-none">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">إجمالي تكلفة الاستهلاك</p>
            <p className="text-xl font-black text-primary">{totalMonthlySpend.toLocaleString()} ريال</p>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20 shadow-none print:border-none">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">أصناف تم سحبها</p>
            <p className="text-xl font-black text-success">{itemReport.filter(r => r.dispensed > 0).length} صنف</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20 shadow-none print:border-none">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">تنبيهات المخزون</p>
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
          <div className="table-responsive">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-right font-bold py-2 px-4 min-w-[180px]">الصنف</TableHead>
                  <TableHead className="text-center font-bold px-2">الرصيد</TableHead>
                  <TableHead className="text-center font-bold px-2">المصروف</TableHead>
                  <TableHead className="text-center font-bold px-2">المضاف</TableHead>
                  <TableHead className="text-center font-bold text-sky-600 px-4">تكلفة الاستهلاك</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemReport.map((report) => (
                  <React.Fragment key={report.item.id}>
                    <TableRow className="hover:bg-transparent border-b">
                      <TableCell className="font-bold text-right py-3 px-4">{report.item.name}</TableCell>
                      <TableCell className="text-center">{report.currentStock} {report.item.unitType === 'box' ? 'علبة' : 'قطعة'}</TableCell>
                      <TableCell className="text-center text-destructive font-bold">{report.dispensed}</TableCell>
                      <TableCell className="text-center text-success font-bold">{report.added}</TableCell>
                      <TableCell className="text-center text-primary font-bold">{(report.totalCost).toLocaleString()} ريال</TableCell>
                    </TableRow>
                    {report.consumptionByClinic.length > 0 && (
                      <TableRow className="bg-muted/10 print:bg-transparent">
                        <TableCell colSpan={5} className="py-2 px-6">
                          <div className="flex flex-wrap gap-2 text-[10px] md:text-xs">
                            <span className="font-bold text-muted-foreground italic">تفاصيل السحب:</span>
                            {report.consumptionByClinic.map(c => (
                              <span key={c.name} className="bg-white border rounded-full px-2 py-0.5 shadow-sm print:shadow-none print:border-none">
                                {c.name}: <span className="text-primary font-bold">{c.amount}</span>
                              </span>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
                <TableRow className="bg-slate-50 font-black border-t-2 print:bg-slate-100">
                  <TableCell colSpan={4} className="py-4 text-md text-left px-6 border-l">إجمالي تكلفة استهلاك {warehouse.name}:</TableCell>
                  <TableCell className="text-center text-lg text-sky-600">{totalMonthlySpend.toLocaleString()} ريال</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Transaction Log */}
      <Card className="shadow-none border-t-2 print:mt-4">
        <CardHeader className="p-4"><CardTitle className="text-md flex items-center gap-2">تتبع الحركة اليومية</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="table-responsive">
            {filteredTransactions.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="text-[11px]">
                    <TableHead className="text-center py-1 px-2 whitespace-nowrap">التاريخ</TableHead>
                    <TableHead className="text-center px-1">العملية</TableHead>
                    <TableHead className="text-right px-4 min-w-[150px]">الصنف</TableHead>
                    <TableHead className="text-center px-2">الكمية</TableHead>
                    <TableHead className="text-center px-2">التكلفة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions
                    .map((t) => {
                      const item = items.find(i => i.id === t.itemId);
                      return (
                        <TableRow key={t.id} className="text-[11px] border-b hover:bg-muted/20 transition-colors">
                          <TableCell className="text-center whitespace-nowrap px-2 font-medium">{new Date(t.timestamp).toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={t.type === 'dispense' ? 'destructive' : t.type === 'add' ? 'success' : 'outline'} 
                              className={cn(
                                "text-[9px] px-2 py-0.5 h-auto mx-auto border-none shadow-sm",
                                t.type === 'add' && "bg-emerald-500 text-white hover:bg-emerald-600",
                                t.type === 'transfer' && "bg-sky-500 text-white hover:bg-sky-600",
                                t.type === 'dispense' && "bg-rose-500 text-white hover:bg-rose-600"
                              )}
                            >
                              {t.type === 'dispense' ? 'صرف' : t.type === 'add' ? 'إضافة' : 'تحويل'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-black text-right px-4 text-slate-700">{item?.name}</TableCell>
                          <TableCell className="text-center px-2 font-bold">{t.quantity}</TableCell>
                          <TableCell className="text-center font-black px-2 text-primary">{t.totalPrice > 0 ? `${t.totalPrice.toLocaleString()} ريال` : '--'}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50">
                <RotateCcw className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm font-bold">لا توجد حركات مسجلة لهذه العيادة خلال شهر {selectedDate}</p>
                <p className="text-xs opacity-60">تظهر هنا سجلات الصرف والإضافة عند تنفيذها</p>
              </div>
            )}
          </div>
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
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isComprehensive, setIsComprehensive] = useState(false);

  // حساب الإجماليات مسبقاً لتحسين الأداء (تراكمي حتى اليوم المختار)
  const grandSummary = useMemo(() => {
    const [selYear, selMonth, selDay] = selectedDate.split('-').map(Number);

    const warehouseTotals = warehouses.map(wh => {
      const whId = wh.id;
      const whTotal = items.reduce((sum, item) => {
        const itemTransactions = transactions.filter(t => {
          const txDate = new Date(t.timestamp);
          const isSameMonth = txDate.getFullYear() === selYear && (txDate.getMonth() + 1) === selMonth;
          const isBeforeOrOnDay = txDate.getDate() <= selDay;

          return (t.fromWarehouseId === whId || t.toWarehouseId === whId) &&
            t.itemId === item.id &&
            isSameMonth &&
            isBeforeOrOnDay;
        });

        const dispensed = itemTransactions
          .filter(t => {
            if (t.type === 'dispense') {
              return t.fromWarehouseId === whId || t.toWarehouseId === whId;
            }
            if (t.type === 'transfer' && t.fromWarehouseId === whId) {
              return true;
            }
            return false;
          })
          .reduce((acc, t) => acc + t.quantity, 0);

        return sum + (dispensed * (item.salePrice || 0));
      }, 0);
      return { id: whId, total: whTotal };
    });

    const totalCost = warehouseTotals.reduce((sum, w) => sum + w.total, 0);
    return { warehouseTotals, totalCost };
  }, [warehouses, items, transactions, selectedDate]);

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
    document.body.classList.add('is-printing-comprehensive');
    setIsComprehensive(true);

    // Wait for DOM to render the comprehensive view
    setTimeout(() => {
      window.print();
      
      const cleanup = () => {
        document.body.classList.remove('is-printing-comprehensive');
        setIsComprehensive(false);
      };

      window.addEventListener('afterprint', cleanup, { once: true });
      // Fallback cleanup
      setTimeout(cleanup, 500);
    }, 1000);
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
              <Label className="flex items-center gap-2 font-bold">التاريخ</Label>
              <Input type="date" className="h-12 border-2" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
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
      <div className="comprehensive-report-container space-y-12">
        <div className="text-center py-10 no-print">
          <p className="animate-pulse text-lg font-bold text-primary">جاري تجهيز التقرير الشامل لجميع العيادات...</p>
        </div>

        {/* Official Comprehensive Print Header */}
        <div className="hidden print:block text-center border-b-4 border-double border-primary pb-10 mb-12">
          <h1 className="text-4xl font-black text-primary mb-2">نظام إدارة مخازن العيادات</h1>
          <p className="text-xl font-bold italic text-muted-foreground">التقرير الشامل وتدقيق التكاليف الشهرية</p>
          <div className="flex justify-center items-center gap-10 mt-6 text-sm font-bold bg-muted/30 py-3 rounded-full border border-dashed border-primary/20 max-w-2xl mx-auto">
            <p>الفترة: {selectedDate}</p>
            <p>عدد المواقع: {warehouses.length}</p>
            <p>تاريخ الطبع: {format(new Date(), 'yyyy/MM/dd HH:mm')}</p>
          </div>
        </div>

        {warehouses.map(wh => (
          <div key={wh.id} className="print:break-after-page mb-20 print:mb-0">
            <WarehouseReportSection
              warehouse={wh}
              items={items}
              transactions={transactions}
              selectedDate={selectedDate}
              getItemStock={getItemStock}
              warehouses={warehouses}
            />
          </div>
        ))}

        {/* Global Summary Section */}
        <div className="hidden print:block pt-16 break-before-page print:mt-10">
          <div className="border-4 border-primary/20 p-8 rounded-[2rem] bg-slate-50">
            <h2 className="text-3xl font-black text-center text-primary mb-10 pb-4 border-b-2 border-dashed border-primary/30">الإجمالي العام لجميع العيادات والمخازن</h2>
            
            <div className="grid grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="bg-white p-6 rounded-2xl border-2 border-primary/10 flex flex-col items-center">
                <p className="text-sm font-bold text-muted-foreground mb-2">إجمالي عدد المواقع</p>
                <p className="text-3xl font-black text-primary">{warehouses.length}</p>
              </div>
              <div className="bg-primary text-white p-6 rounded-2xl shadow-xl shadow-primary/20 flex flex-col items-center">
                <p className="text-sm font-bold opacity-80 mb-2 text-white">إجمالي التكلفة الشاملة</p>
                <p className="text-4xl font-black tracking-tighter">
                  {grandSummary.totalCost.toLocaleString()} ريال
                </p>
              </div>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-12 text-center px-10">
              <div>
                <p className="font-bold text-sm mb-12">توقيع المسؤول</p>
                <div className="border-t-2 border-slate-300 w-32 mx-auto"></div>
              </div>
              <div>
                <p className="font-bold text-sm mb-12">التدقيق المالي</p>
                <div className="border-t-2 border-slate-300 w-32 mx-auto"></div>
              </div>
              <div>
                <p className="font-bold text-sm mb-2 text-primary">الأستاذة أميرة / Ms. Amira</p>
                <p className="font-bold text-sm mb-12 italic">اعتماد الإدارة العامة</p>
                <div className="border-t-4 border-double border-primary w-48 mx-auto"></div>
              </div>
            </div>
            
            <p className="text-center text-[10px] text-muted-foreground mt-20 opacity-40">تم استخراج هذا التقرير آلياً عبر نظام إدارة المخازن v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
