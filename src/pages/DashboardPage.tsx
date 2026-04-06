import React, { useMemo, ReactNode } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Package,
  Warehouse,
  AlertTriangle,
  TrendingDown,
  ArrowLeftRight,
  Printer,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';


export default function DashboardPage() {
  const { items, warehouses, inventory, transactions, getLowStockItems, isLoading } = useInventoryStore();

  // Optimized Calculations
  const stats = useMemo(() => {
    if (isLoading) return null;

    const mainWh = warehouses.find(w => w.type === 'main');
    const mainValue = inventory
      .filter(r => r.warehouseId === mainWh?.id)
      .reduce((sum, r) => {
        const item = items.find(i => i.id === r.itemId);
        return sum + (item ? r.quantity * item.purchasePrice : 0);
      }, 0);

    const consumptionByClinic = warehouses
      .filter(w => w.type === 'clinic')
      .map(wh => {
        const totalSpent = transactions
          .filter(t => t.fromWarehouseId === wh.id && t.type === 'dispense')
          .reduce((sum, t) => sum + t.totalPrice, 0);
        return {
          name: wh.name,
          spent: totalSpent,
          color: totalSpent > 10000 ? '#ef4444' : '#0ea5e9'
        };
      });

    const itemConsumption = items.map(item => {
      const totalQty = transactions
        .filter(t => t.itemId === item.id && t.type === 'dispense')
        .reduce((sum, t) => sum + t.quantity, 0);
      return { id: item.id, name: item.name, qty: totalQty };
    }).sort((a, b) => b.qty - a.qty).slice(0, 5);

    return { mainValue, consumptionByClinic, itemConsumption };
  }, [items, warehouses, inventory, transactions, isLoading]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-2xl" />
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-sky-600 border-sky-100 bg-sky-50/50">نظام إدارة توبال v2.0</Badge>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold animate-pulse">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              تزامن مباشر
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1 font-medium">نظرة استراتيجية على استهلاك المركز والعيادات</p>
        </div>
        <Button onClick={() => window.print()} variant="outline" className="gap-2 no-print h-11 px-6 rounded-xl border-slate-200 shadow-sm hover:bg-slate-50 transition-all">
          <Printer className="w-4 h-4 text-slate-500" />
          <span className="font-bold">طباعة التقرير الفوري</span>
        </Button>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block text-center border-b-[3px] border-sky-600 pb-8 mb-10">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="h-28 w-auto object-contain" />
        </div>
        <h1 className="text-5xl font-black text-slate-900 mb-2">مجمع توبال لطب الأسنان</h1>
        <p className="text-2xl text-slate-500 font-bold uppercase tracking-widest">Topal Dental Center - Inventory Report</p>
        <div className="mt-6 flex justify-center gap-12 text-lg font-medium">
          <p>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
          <p>الحالة: تقرير إداري معتمد</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Package} label="الأصناف النشطة" value={items.length} color="sky" description="إجمالي الأصناف المسجلة" />
        <StatCard icon={Warehouse} label="المواقع والعيادات" value={warehouses.length} color="emerald" description="تغطية شاملة للمجمع" />
        <StatCard icon={Activity} label="العمليات المنفذة" value={transactions.length} color="amber" description="خلال الفترة الحالية" />
        <StatCard icon={TrendingUp} label="سيولة المخزون" value={`${stats?.mainValue.toLocaleString()} ر.س`} color="rose" description="قيمة المخزن الرئيسي" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white/50 backdrop-blur-sm">
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-sky-500" />
              تحليل استهلاك العيادات (ريال)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.consumptionByClinic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="spent" radius={[8, 8, 0, 0]} barSize={45}>
                  {stats?.consumptionByClinic.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl bg-white/50 backdrop-blur-sm">
          <CardHeader className="p-6">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              الأعلى استهلاكاً (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[400px]">
             {stats?.itemConsumption.length && stats.itemConsumption.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart 
                    layout="vertical" 
                    data={stats.itemConsumption} 
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                 >
                   <XAxis type="number" hide />
                   <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      axisLine={false}
                      tickLine={false}
                      fontSize={11}
                      fontWeight="bold"
                    />
                   <Tooltip cursor={{ fill: 'transparent' }} />
                   <Bar dataKey="qty" radius={[0, 10, 10, 0]} barSize={20}>
                      {stats.itemConsumption.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#0ea5e9" : index === 1 ? "#10b981" : "#94a3b8"} />
                      ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             ) : (
               <div className="flex flex-col items-center justify-center h-full opacity-30 text-slate-400">
                  <Activity className="w-12 h-12 mb-2" />
                  <p className="font-bold">لا توجد حركات استهلاك</p>
               </div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* قسم التنبيهات الذكية - يظهر فقط في حال وجود نواقص */}
      {getLowStockItems('1').length > 0 && (
        <Card className="border-none shadow-xl shadow-orange-100/50 rounded-3xl overflow-hidden bg-gradient-to-br from-orange-50 to-white border-r-4 border-r-orange-500 animate-in fade-in zoom-in duration-500">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-orange-700">
              <AlertTriangle className="w-5 h-5" /> تنبيه: أصناف تحت الحد الأدنى
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {getLowStockItems('1').map(({ item, quantity }) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-orange-100 shadow-sm transition-all hover:border-orange-300">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground italic">الحد الأدنى: {item.minLimit}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-orange-600">{quantity}</span>
                    <span className="text-[9px] font-bold text-orange-400 capitalize">{item.unitType === 'box' ? 'علبة' : 'قطعة'}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-orange-400 font-bold italic flex items-center gap-1">
              * سيختفي التنبيه تلقائياً عند إضافة مخزون جديد لهذه الأصناف
            </p>
          </CardContent>
        </Card>
      )}

      {/* تم إزالة بطاقة العيادات الفردية بناءً على طلب المركزية */}
      <div className="bg-sky-50/50 p-8 rounded-[2.5rem] border border-sky-100/50 text-center space-y-4">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-sky-200/50 transition-transform hover:rotate-12 duration-500">
           <Warehouse className="w-8 h-8 text-sky-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-sky-900">نظام المخازن المركزي</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">يتم الآن إدارة كافة الأرصدة من خلال المستودع الرئيسي، وتظهر الرسوم البيانية أعلاه تفاصيل الاستهلاك لكل عيادة.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, description }: { icon: any; label: string; value: string | number; color: 'sky' | 'emerald' | 'amber' | 'rose'; description: string }) {
  const themes = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 border", themes[color])}>
            <Icon className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-black text-slate-900 truncate tracking-tight">{value}</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
