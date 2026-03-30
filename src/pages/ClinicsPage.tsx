import { useState } from 'react';
import { useInventoryStore } from '@/store/inventoryStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Warehouse as WarehouseIcon, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ClinicsPage() {
    const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse, isLoading } = useInventoryStore();
    const { toast } = useToast();

    const [newClinicName, setNewClinicName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdd = async () => {
        if (!newClinicName.trim()) {
            toast({ title: 'خطأ', description: 'يرجى إدخال اسم العيادة', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            await addWarehouse(newClinicName);
            setNewClinicName('');
            toast({ title: 'تمت الإضافة', description: `تم إضافة عيادة "${newClinicName}" بنجاح` });
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editingName.trim()) {
            toast({ title: 'خطأ', description: 'يرجى إدخال اسم العيادة', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            await updateWarehouse(id, editingName);
            setEditingId(null);
            toast({ title: 'تم التحديث', description: 'تم تغيير اسم العيادة بنجاح' });
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        try {
            await deleteWarehouse(id);
            toast({ title: 'تم الحذف', description: `تم حذف عيادة "${name}" بنجاح` });
        } catch (e: any) {
            toast({ title: 'خطأ', description: e.message, variant: 'destructive' });
        }
    };

    const startEditing = (id: string, name: string) => {
        setEditingId(id);
        setEditingName(name);
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-4">
                <Skeleton className="h-10 w-1/4" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 animate-fade-in" dir="rtl">
            {/* العنوان */}
            <div className="flex items-center gap-3 border-b pb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                    <WarehouseIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">إدارة العيادات</h1>
                    <p className="text-sm text-muted-foreground">إضافة، تعديل، أو حذف العيادات والمخازن</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* نموذج الإضافة */}
                <Card className="lg:col-span-1 border-2 border-primary/10 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" />
                            إضافة عيادة جديدة
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>اسم العيادة / المخزن</Label>
                            <Input
                                placeholder="مثلاً: عيادة تجميل 1"
                                value={newClinicName}
                                onChange={e => setNewClinicName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            />
                        </div>
                        <Button className="w-full gap-2" onClick={handleAdd} disabled={isSubmitting}>
                            {isSubmitting ? 'جاري الحفظ...' : 'إضافة عيادة'}
                            {!isSubmitting && <Plus className="w-4 h-4" />}
                        </Button>
                    </CardContent>
                </Card>

                {/* قائمة العيادات */}
                <Card className="lg:col-span-2">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="text-right font-bold">اسم العيادة</TableHead>
                                    <TableHead className="text-center font-bold">النوع</TableHead>
                                    <TableHead className="text-left font-bold">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {warehouses.map((wh) => (
                                    <TableRow key={wh.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            {editingId === wh.id ? (
                                                <Input
                                                    value={editingName}
                                                    onChange={e => setEditingName(e.target.value)}
                                                    className="max-w-[200px]"
                                                    onKeyDown={e => e.key === 'Enter' && handleUpdate(wh.id)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-bold">{wh.name}</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`text-xs px-2 py-1 rounded-full ${wh.type === 'main' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {wh.type === 'main' ? 'مخزن رئيسي' : 'عيادة فرعية'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-start gap-1">
                                                {editingId === wh.id ? (
                                                    <>
                                                        <Button variant="ghost" size="icon" onClick={() => handleUpdate(wh.id)} disabled={isSubmitting}>
                                                            <Save className="w-4 h-4 text-green-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}>
                                                            <X className="w-4 h-4 text-muted-foreground" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button variant="ghost" size="icon" onClick={() => startEditing(wh.id, wh.name)}>
                                                            <Pencil className="w-4 h-4 text-blue-600" />
                                                        </Button>

                                                        {wh.type !== 'main' && (
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon">
                                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent dir="rtl">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>حذف العيادة؟</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            سيتم حذف عيادة "{wh.name}" وكافة أرصدة المخزون المرتبطة بها. لا يمكن التراجع عن هذا الإجراء.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter className="gap-2">
                                                                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(wh.id, wh.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                            تأكيد الحذف
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
