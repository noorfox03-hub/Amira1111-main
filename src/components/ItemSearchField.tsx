import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, AlertTriangle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Item } from '@/types/inventory';
import { matchItem } from '@/lib/searchUtils';

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
        if (!searchTerm || (selectedItemId && searchTerm === selectedItem?.name)) return [];
        return items.filter(i => matchItem(i, searchTerm)).slice(0, 10);
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

            {isOpen && searchTerm && filteredItems.length > 0 && (
                <div className="absolute z-50 w-full mt-1 border border-border rounded-lg max-h-64 overflow-y-auto bg-card shadow-xl">
                    {filteredItems.map(item => {
                        const stock = warehouseId && getItemStock ? getItemStock(warehouseId, item.id) : null;
                        const isLow = stock !== null && stock <= item.minLimit;

                        return (
                            <button
                                key={item.id}
                                className="w-full text-right px-4 py-3 hover:bg-muted flex items-center justify-between transition-colors border-b last:border-0"
                                onClick={() => {
                                    onSelect(item.id);
                                    setSearchTerm(item.name);
                                    setIsOpen(false);
                                }}
                            >
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">{item.name}</span>
                                    <span className="text-[10px] text-muted-foreground">كود: {item.id}</span>
                                </div>
                                {stock !== null && (
                                    <span className="flex items-center gap-2">
                                        {isLow && <AlertTriangle className="w-3 h-3 text-destructive" />}
                                        <Badge variant={isLow ? 'destructive' : 'secondary'} className="text-[10px]">
                                            {stock} {item.unitType === 'box' ? 'علبة' : 'قطعة'}
                                        </Badge>
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {isOpen && searchTerm && filteredItems.length === 0 && searchTerm !== selectedItem?.name && (
                <div className="absolute z-50 w-full mt-1 p-4 border border-border rounded-lg bg-card shadow-xl text-center text-muted-foreground text-sm">
                    لا توجد نتائج مطابقة
                </div>
            )}
        </div>
    );
}
