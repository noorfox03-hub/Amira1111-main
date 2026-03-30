import { useMemo } from "react";
import { useInventoryStore } from "@/store/inventoryStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, PackageSearch, Download, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ShortagePage() {
  const { items, warehouses, getItemStock } = useInventoryStore();

  // حساب كافة النواقص للمخزن الرئيسي فقط
  const shortageItems = useMemo(() => {
    const list: any[] = [];
    const mainWarehouse = warehouses.find(w => w.type === 'main');
    
    if (mainWarehouse) {
      items.forEach(item => {
        const currentStock = getItemStock(mainWarehouse.id, item.id);
        if (currentStock <= item.minLimit) {
          list.push({
            warehouse: mainWarehouse,
            item: item,
            currentStock,
            minLimit: item.minLimit,
            deficit: Math.max(0, (item.minLimit * 1.5) - currentStock), // كمية مقترحة للطلب
            severity: currentStock === 0 ? 'critical' : 'warning'
          });
        }
      });
    }
    
    return list.sort((a, b) => a.currentStock - b.currentStock);
  }, [items, warehouses, getItemStock]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-4 sm:p-8 animate-fade-in print:p-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
        <div className="animate-slide-in">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-destructive animate-pulse" />
            نواقص المخزن الرئيسي
          </h1>
          <p className="text-muted-foreground font-medium mt-1">متابعة الأصناف الحرجة في المستودع العام</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95">
            <Download className="w-5 h-5 ml-2" />
            تصدير قائمة النواقص (PDF)
          </Button>
        </div>
      </div>

      {/* تقرير الطباعة الرسمي */}
      <div className="hidden print:block text-center border-b-4 border-double border-primary pb-8 mb-10">
        <h1 className="text-3xl font-black text-primary">نظام إدارة مخازن العيادات</h1>
        <h2 className="text-xl font-bold mt-2">تقرير نواقص المخزن الرئيسي</h2>
        <p className="text-sm opacity-60 mt-2">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print mb-8">
        <Card className="bg-destructive/5 border-destructive/20 shadow-none rounded-[1.5rem]">
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase text-destructive/60 mb-1">إجمالي الحالات الحرجة</p>
            <p className="text-3xl font-black text-destructive">{shortageItems.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20 shadow-none rounded-[1.5rem]">
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase text-primary/60 mb-1">أصناف نفدت تماماً</p>
            <p className="text-3xl font-black text-primary">{shortageItems.filter(i => i.currentStock === 0).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b p-8">
          <CardTitle className="text-xl font-black flex items-center gap-3">
            <PackageSearch className="w-6 h-6 text-primary" />
            تفاصيل النواقص حسب الموقع
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-right py-6 px-8">الموقع / العيادة</TableHead>
                  <TableHead className="text-right">اسم الصنف</TableHead>
                  <TableHead className="text-center">الرصيد الحالي</TableHead>
                  <TableHead className="text-center">الحد الأدنى</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center no-print px-4">الإجراء المقترح</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shortageItems.length > 0 ? (
                  shortageItems.map((item, idx) => (
                    <TableRow key={`${item.warehouse.id}-${item.item.id}`} className="hover:bg-muted/10 transition-colors border-b last:border-0 group">
                      <TableCell className="font-bold py-5 px-8 text-primary whitespace-nowrap">الرئيسي</TableCell>
                      <TableCell className="font-black text-slate-800 text-base">{item.item.name}</TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "px-4 py-1.5 rounded-2xl font-black text-xs inline-block shadow-sm",
                          item.currentStock === 0 ? "text-white bg-destructive animate-pulse" : "text-amber-700 bg-amber-100"
                        )}>
                          {item.currentStock} {item.item.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-bold opacity-30 text-sm">{item.minLimit}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={item.severity === 'critical' ? 'destructive' : 'warning'} className="rounded-xl px-3 py-1 font-bold border-none">
                          {item.severity === 'critical' ? 'نقص حاد جداً' : 'تنبيه نقص'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center no-print px-4">
                        <div className="flex items-center justify-center gap-3">
                           <div className="flex flex-col items-center">
                              <span className="text-[9px] font-black text-primary uppercase opacity-60">الطلب المقترح</span>
                              <span className="font-black text-primary text-lg">
                                {Math.ceil(item.deficit)}
                              </span>
                           </div>
                           <Button size="sm" variant="outline" className="rounded-2xl border-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-bold px-4 h-10 shadow-sm active:scale-90">
                              + إضافة للقائمة
                           </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                          <PackageSearch className="w-10 h-10 text-green-500 opacity-40" />
                        </div>
                        <div>
                          <p className="text-2xl font-black text-slate-800">المخزن بحالة مثالية!</p>
                          <p className="text-muted-foreground font-medium mt-1">لا توجد أي أصناف وصلت للحد الأدنى حالياً.</p>
                        </div>
                        <Button variant="outline" className="rounded-2xl" onClick={() => window.location.reload()}>
                          <RotateCcw className="w-4 h-4 ml-2" /> تحديث البيانات
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <footer className="mt-20 hidden print:block border-t-2 border-dashed pt-12 text-center">
         <div className="grid grid-cols-3 gap-12 mb-16 px-10">
            <div className="space-y-12">
              <p className="font-black text-slate-800 underline decoration-primary/30 decoration-4 underline-offset-8">توقيع مسؤول المخزون</p>
              <div className="border-t-2 border-slate-200 w-40 mx-auto"></div>
            </div>
            <div className="space-y-12">
              <p className="font-black text-slate-800 underline decoration-primary/30 decoration-4 underline-offset-8">قسم التدقيق والمتابعة</p>
              <div className="border-t-2 border-slate-200 w-40 mx-auto"></div>
            </div>
            <div className="space-y-12">
              <p className="font-black text-primary underline decoration-primary/50 decoration-4 underline-offset-8">الأستاذة أميرة / اعتماد الإدارة</p>
              <div className="border-t-4 border-double border-primary w-48 mx-auto"></div>
            </div>
         </div>
         <p className="text-[10px] font-bold text-muted-foreground/40 mt-10">تم استخراج هذا التقرير آلياً عبر نظام إدارة المخازن المتكامل v2.0 - © 2026</p>
      </footer>
    </div>
  );
}
