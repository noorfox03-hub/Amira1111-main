import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  PackageMinus,
  PackagePlus,
  Package,
  FileBarChart,
  Warehouse,
  X,
  TriangleAlert,
  ClipboardList,
} from 'lucide-react';

export const navItems = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/adjustment', label: 'تسوية كميات', icon: PackageMinus },
  { to: '/dispense', label: 'صرف صنف', icon: PackageMinus },
  { to: '/transfer', label: 'إضافة مخزون', icon: PackagePlus },
  { to: '/items', label: 'إدارة الأصناف', icon: Package },
  { to: '/clinics', label: 'إدارة العيادات', icon: Warehouse },
  { to: '/doctor-requests', label: 'طلبات شهرية', icon: ClipboardList },
  { to: '/reports', label: 'التقارير', icon: FileBarChart },
  { to: '/shortage', label: 'الأصناف الناقصة', icon: TriangleAlert },
];

export default function AppSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed inset-y-0 right-0 z-50 w-[280px] sm:w-[320px] lg:w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-500 ease-in-out lg:relative lg:translate-x-0 outline-none border-l border-sidebar-border shadow-2xl lg:shadow-none",
      "lg:bg-sidebar bg-sidebar/80 backdrop-blur-xl",
      !isOpen && "translate-x-full lg:translate-x-0"
    )}>
      <div className="p-8 border-b border-sidebar-border flex items-center justify-between bg-gradient-to-l from-sidebar-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sidebar-primary flex items-center justify-center shadow-lg shadow-sidebar-primary/20 rotate-3">
            <Warehouse className="w-6 h-6 text-sidebar-primary-foreground -rotate-3" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-sidebar-primary leading-none mb-1">نظام المخازن</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">إدارة مخازن العيادات</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="lg:hidden p-2.5 hover:bg-sidebar-accent rounded-xl transition-all active:scale-90 border border-transparent hover:border-sidebar-border shadow-sm"
          aria-label="إغلاق القائمة"
        >
          <X className="w-5 h-5 text-sidebar-foreground/60" />
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={cn(
                'flex items-center gap-4 px-5 py-4 rounded-2xl text-[15px] font-bold transition-all duration-300 group relative overflow-hidden',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/30 scale-[1.02]'
                  : 'hover:bg-sidebar-accent/70 text-sidebar-foreground/70 hover:text-sidebar-primary'
              )}
            >
              <Icon className={cn("w-6 h-6 transition-all duration-500", isActive ? "text-white rotate-0" : "text-sidebar-primary/40 group-hover:rotate-12 group-hover:scale-110")} />
              {label}
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
          <span className="text-[10px] text-green-600 font-black">اتصال مباشر (Live)</span>
        </div>
        <p className="text-[10px] opacity-40 text-center font-medium">نظام توبال v2.0 - © 2026</p>
      </div>
    </aside>
  );
}
