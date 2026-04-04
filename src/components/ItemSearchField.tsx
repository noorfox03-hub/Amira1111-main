import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, AlertTriangle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Item } from '@/types/inventory';
import { matchItem } from '@/lib/searchUtils';
import { cn } from '@/lib/utils';

interface ItemSearchFieldProps {
    items: Item[];
    onSelect: (itemId: string) => void;
    placeholder?: string;
    selectedItemId?: string;
    warehouseId?: string;
    getItemStock?: (whId: string, itemId: string) => number;
    className?: string;
}

export function ItemSearchField({
    items,
    onSelect,
    placeholder = "ابحث عن صنف...",
    selectedItemId,
    warehouseId,
    getItemStock,
    className
}: ItemSearchFieldProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedItem = useMemo(() => items.find(i => i.id === selectedItemId), [items, selectedItemId]);

    useEffect(() => {
        if (selectedItem) {
            setSearchTerm(selectedItem.name);
        } else {
            setSearchTerm('');
        }
    }, [selectedItem]);

  const filteredItems = useMemo(() => {
    // إذا كان المربع فارغاً أو النص يطابق الاسم المختار تماماً، نظهر أول 20 صنف لتمكين المستخدم من التصفح
    const isShowingSelected = selectedItemId && searchTerm === selectedItem?.name;
    const query = isShowingSelected ? "" : searchTerm;

    return items.filter(i => matchItem(i, query))
      .sort((a, b) => Number(a.id) - Number(b.id))
      .slice(0, 20);
  }, [items, searchTerm, selectedItemId, selectedItem]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    className="pr-10"
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                        if (!e.target.value) onSelect('');
                    }}
                    onFocus={() => setIsOpen(true)}
                />
            </div>

            {isOpen && filteredItems.length > 0 && (
                <div className="absolute z-[100] w-full mt-2 border border-slate-200/50 rounded-2xl max-h-[400px] overflow-y-auto bg-white/90 backdrop-blur-3xl shadow-2xl shadow-emerald-500/10 animate-in fade-in zoom-in duration-200 p-2 space-y-1">
                    {filteredItems.map(item => {
                        const stock = warehouseId && getItemStock ? getItemStock(warehouseId, item.id) : null;
                        const isLow = stock !== null && stock <= item.minLimit;

                        return (
                            <button
                                key={item.id}
                                className="w-full text-right px-4 py-3 hover:bg-emerald-50/50 rounded-xl flex items-center justify-between transition-all group active:scale-[0.98]"
                                onClick={() => {
                                    onSelect(item.id);
                                    setSearchTerm(item.name);
                                    setIsOpen(false);
                                }}
                            >
                                <div className="flex flex-col">
                                    <span className="font-black text-slate-800 text-sm group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{item.name}</span>
                                    <div className="flex items-center gap-2">
                                       <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 rounded-md">ID: {item.id}</span>
                                       <span className="text-[10px] font-bold text-slate-400 italic">السعر: {item.salePrice} ر.س</span>
                                    </div>
                                </div>
                                {stock !== null && (
                                    <div className="flex flex-col items-end gap-1">
                                        <Badge 
                                          variant="secondary" 
                                          className={cn(
                                            "text-[10px] font-black rounded-lg px-2.5 py-1",
                                            isLow ? "bg-rose-100 text-rose-600 border-rose-200" : "bg-emerald-100 text-emerald-600 border-emerald-200"
                                          )}
                                        >
                                            {stock} {item.unitType === 'box' ? 'علبة' : 'قطعة'}
                                        </Badge>
                                        {isLow && <span className="text-[8px] font-black text-rose-500 animate-pulse uppercase">نفاذ مخزون</span>}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {isOpen && searchTerm && filteredItems.length === 0 && searchTerm !== selectedItem?.name && (
                <div className="absolute z-[100] w-full mt-2 p-8 border border-slate-200/50 rounded-2xl bg-white/90 backdrop-blur-3xl shadow-2xl text-center">
                    <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                       <Search className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="font-black text-slate-400 text-sm">عذراً، لم نجد نتائج مطابقة لـ "{searchTerm}"</p>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">تأكدي من كتابة الاسم أو الكود بشكل صحيح</p>
                </div>
            )}
        </div>
    );
}
