import { useState, useRef } from "react";
import { useInventoryStore } from "@/store/inventoryStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Trash2, 
  Printer, 
  ImagePlus, 
  ClipboardList, 
  Search,
  Calendar,
  User,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RequestItem {
  id: string;
  itemName: string;
  quantityNeeded: string;
  quantityAvailable: string;
  image?: string;
}

export default function DoctorRequestsPage() {
  const { items, getItemStock, warehouses } = useInventoryStore();
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split('T')[0]);
  const [requestItems, setRequestItems] = useState<RequestItem[]>([
    { id: crypto.randomUUID(), itemName: "", quantityNeeded: "", quantityAvailable: "" }
  ]);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const mainWarehouse = warehouses.find(w => w.type === 'main');

  const addRow = () => {
    setRequestItems([
      ...requestItems,
      { id: crypto.randomUUID(), itemName: "", quantityNeeded: "", quantityAvailable: "" }
    ]);
  };

  const removeRow = (id: string) => {
    if (requestItems.length === 1) {
      toast.error("يجب وجود صنف واحد على الأقل في القائمة");
      return;
    }
    setRequestItems(requestItems.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof RequestItem, value: string) => {
    setRequestItems(requestItems.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        
        // إذا قام المستخدم باختيار صنف موجود، نحاول جلب الكمية المتوفرة تلقائياً
        if (field === 'itemName' && mainWarehouse) {
          const foundItem = items.find(i => i.name === value);
          if (foundItem) {
            newItem.quantityAvailable = String(getItemStock(mainWarehouse.id, foundItem.id));
          }
        }
        return newItem;
      }
      return item;
    }));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 2 ميجابايت");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRequestItems(requestItems.map(item => 
          item.id === id ? { ...item, image: reader.result as string } : item
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-4 sm:p-8 animate-fade-in print:p-0 print:m-0" dir="rtl">
      {/* Header - No Print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 no-print">
        <div className="animate-slide-in">
          <h1 className="text-3xl font-black text-primary flex items-center gap-3">
            <ClipboardList className="w-8 h-8" />
            طلبات الدكاترة مخصصة
          </h1>
          <p className="text-muted-foreground font-medium mt-1">إنشاء قائمة طلبات يدوية منظمة للطباعة</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={addRow} 
            variant="outline"
            className="rounded-2xl h-12 px-6 font-bold border-primary text-primary hover:bg-primary/5 transition-all"
          >
            <Plus className="w-5 h-5 ml-2" />
            إضافة صنف جديد
          </Button>
          <Button 
            onClick={handlePrint} 
            className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 transition-all active:scale-95"
          >
            <Printer className="w-5 h-5 ml-2" />
            طباعة الطلب (PDF)
          </Button>
        </div>
      </div>

      {/* Official Print Header */}
      <div className="hidden print:block mb-10 text-center border-b-4 border-double border-primary pb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-right">
            <p className="font-black text-2xl text-primary">نظام إدارة مخازن العيادات</p>
            <p className="text-sm font-bold opacity-70">شركة المجموعات الطبية</p>
          </div>
          <div className="bg-primary/10 p-4 rounded-3xl border border-primary/20">
            <ClipboardList className="w-10 h-10 text-primary" />
          </div>
        </div>
        <h2 className="text-3xl font-black mb-4">طلب احتياجات (طلبات دكاترة)</h2>
        <div className="flex justify-center items-center gap-10 text-lg font-bold">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            تاريخ الطلب: {requestDate}
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden print:shadow-none print:rounded-none">
        <CardHeader className="bg-slate-50/50 border-b p-8 no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <Search className="w-6 h-6 text-primary" />
              تفاصيل قائمة الطلبات
            </CardTitle>
            <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-sm font-bold text-muted-foreground mr-2">تاريخ الطلب:</span>
              <Input 
                type="date" 
                value={requestDate} 
                onChange={(e) => setRequestDate(e.target.value)}
                className="border-none bg-transparent font-bold focus-visible:ring-0 w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-right py-6 px-8 w-16">#</TableHead>
                  <TableHead className="text-right">اسم الصنف</TableHead>
                  <TableHead className="text-center w-32">الكمية المطلوبة</TableHead>
                  <TableHead className="text-center w-32">الكمية المتوفرة</TableHead>
                  <TableHead className="text-center w-40">صورة توضيحية</TableHead>
                  <TableHead className="text-center no-print w-20">حذف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requestItems.map((item, idx) => (
                  <TableRow key={item.id} className="hover:bg-muted/5 transition-colors border-b last:border-0 group">
                    <TableCell className="font-bold py-5 px-8 text-slate-400">
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <div className="relative group/input">
                        <Input 
                          list={`items-list-${item.id}`}
                          placeholder="اكتب اسم الصنف أو ابحث عنه..."
                          value={item.itemName}
                          onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                          className="font-black text-slate-800 text-lg border-transparent bg-transparent hover:border-slate-200 focus:bg-white focus:border-primary/30 transition-all rounded-xl h-12"
                        />
                        <datalist id={`items-list-${item.id}`}>
                          {items.map(i => <option key={i.id} value={i.name} />)}
                        </datalist>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Input 
                        type="text"
                        placeholder="0"
                        value={item.quantityNeeded}
                        onChange={(e) => updateItem(item.id, 'quantityNeeded', e.target.value)}
                        className="text-center font-black text-primary text-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all rounded-2xl h-12"
                      />
                    </TableCell>
                    <TableCell className="text-center font-bold opacity-30 text-sm">
                       <Input 
                        type="text"
                        placeholder="0"
                        value={item.quantityAvailable}
                        onChange={(e) => updateItem(item.id, 'quantityAvailable', e.target.value)}
                        className="text-center font-bold text-slate-500 border-none bg-transparent focus:ring-0 h-12"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {item.image ? (
                          <div className="relative group/img">
                            <img 
                              src={item.image} 
                              alt="Item Preview" 
                              className="w-16 h-16 object-cover rounded-xl border-2 border-primary/20 shadow-sm"
                            />
                            <button 
                              onClick={() => updateItem(item.id, 'image', '')}
                              className="absolute -top-2 -right-2 bg-destructive text-white p-1 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity no-print"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="no-print">
                            <input 
                              type="file" 
                              accept="image/*"
                              className="hidden"
                              ref={el => fileInputRefs.current[item.id] = el}
                              onChange={(e) => handleImageUpload(item.id, e)}
                            />
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="rounded-xl h-10 w-10 p-0 text-slate-400 hover:text-primary hover:bg-primary/5 border border-dashed border-slate-200"
                              onClick={() => fileInputRefs.current[item.id]?.click()}
                            >
                              <ImagePlus className="w-5 h-5" />
                            </Button>
                          </div>
                        )}
                        {/* Placeholder text for printing if no image is present */}
                        {!item.image && <span className="hidden print:inline text-[9px] text-slate-300">لا توجد صورة</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center no-print">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive/40 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                        onClick={() => removeRow(item.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="p-8 bg-slate-50/30 no-print">
             <Button 
              onClick={addRow} 
              variant="outline"
              className="w-full rounded-2xl h-14 border-dashed border-2 border-primary/20 text-primary/60 hover:text-primary hover:border-primary/40 hover:bg-white transition-all font-bold"
            >
              <Plus className="w-5 h-5 ml-2" />
              أضف صنفاً إضافياً للقائمة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer / Signatures - Optimized for Print */}
      <footer className="mt-20 print:mt-16">
        <div className="grid grid-cols-3 gap-8 text-center px-4">
          <div className="space-y-12">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 mb-2 no-print">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-black text-slate-800 text-lg">مسؤولة مخزن الفرع</p>
              <p className="text-xs text-muted-foreground opacity-60 no-print">الاسم والتوقيع</p>
            </div>
            <div className="border-b-2 border-slate-200 w-48 mx-auto h-4"></div>
          </div>

          <div className="space-y-12">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 mb-2 no-print">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <p className="font-black text-slate-800 text-lg">المدير العام</p>
              <p className="text-xs text-muted-foreground opacity-60 no-print">الاسم والتوقيع</p>
            </div>
            <div className="border-b-2 border-slate-200 w-48 mx-auto h-4"></div>
          </div>

          <div className="space-y-12">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 mb-2 no-print">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-black text-slate-800 text-lg">مسؤولة المستودع</p>
              <p className="text-xs text-muted-foreground opacity-60 no-print">الاسم والتوقيع</p>
            </div>
            <div className="border-b-2 border-slate-200 w-48 mx-auto h-4"></div>
          </div>
        </div>

        <div className="mt-24 text-center">
            <div className="inline-block relative">
                <p className="text-2xl font-black text-primary relative z-10 px-8 py-3 rounded-2xl bg-primary/5 border border-primary/10">اميرة ناصر</p>
                <div className="absolute -bottom-1 -right-1 w-full h-full bg-primary/10 rounded-2xl -z-0"></div>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/30 mt-12 no-print">تم إنشاء هذا التقرير عبر نظام إدارة المخازن المتكامل v2.0</p>
        </div>
      </footer>

      {/* Tailwind Print Overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .container { max-width: 100% !important; padding: 0 !important; width: 100% !important; }
          @page { margin: 15mm; size: A4; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #e2e8f0 !important; }
          input { border: none !important; background: transparent !important; }
        }
      `}} />
    </div>
  );
}

// Helper X Icon
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
