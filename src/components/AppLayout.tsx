import React, { useState, ReactNode } from 'react';
import AppSidebar, { navItems } from './AppSidebar';
import { Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useInventoryStore } from '@/store/inventoryStore';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn } = useInventoryStore();
  
  const currentNavItem = navItems.find(item => item.to === location.pathname);
  const isPublicPage = location.pathname === '/' || location.pathname === '/login';

  useEffect(() => {
    if (!isLoggedIn && !isPublicPage) {
      navigate('/login');
    }
  }, [isLoggedIn, isPublicPage, navigate]);

  return (
    <div className="flex min-h-screen bg-background font-sans print:h-auto print:overflow-visible print:block" dir="rtl">
      {/* Mobile Overlay */}
      {isSidebarOpen && !isPublicPage && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-all duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {!isPublicPage && <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:h-auto print:overflow-visible print:block">
        {/* Mobile Header */}
        {!isPublicPage && (
          <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background/80 backdrop-blur-xl px-4 sm:px-8 lg:hidden transition-all duration-300">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 -mr-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl transition-all active:scale-95 shadow-sm border border-transparent hover:border-primary/20"
              aria-label="القائمة"
            >
              <Menu className="h-7 w-7" />
            </button>
            <div className="flex-1">
              <h2 className="font-black text-xl tracking-tight text-primary">{currentNavItem?.label || 'نظام المخازن'}</h2>
            </div>
          </header>
        )}

        <main className={cn("flex-1 overflow-auto print:h-auto print:overflow-visible print:block", !isPublicPage && "p-2 sm:p-4 md:p-8")}>
          <div className={cn("max-w-7xl mx-auto space-y-4 sm:space-y-8 animate-in fade-in duration-500 print:max-w-none print:space-y-0", !isPublicPage && "space-y-4 sm:space-y-8")}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
