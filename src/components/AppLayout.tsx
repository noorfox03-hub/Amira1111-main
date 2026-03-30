import React, { useState, ReactNode } from 'react';
import AppSidebar, { navItems } from './AppSidebar';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const currentNavItem = navItems.find(item => item.to === location.pathname);
  const isPublicPage = location.pathname === '/' || location.pathname === '/login';

  return (
    <div className="flex min-h-screen bg-background font-sans print:h-auto print:overflow-visible print:block" dir="rtl">
      {/* Mobile Overlay */}
      {isSidebarOpen && !isPublicPage && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {!isPublicPage && <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:h-auto print:overflow-visible print:block">
        {/* Mobile Header */}
        {!isPublicPage && (
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-6 lg:hidden">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <h2 className="font-bold text-lg">{currentNavItem?.label || 'نظام المخازن'}</h2>
            </div>
          </header>
        )}

        <main className={cn("flex-1 overflow-auto print:h-auto print:overflow-visible print:block", !isPublicPage && "p-4 md:p-8")}>
          <div className={cn("max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 print:max-w-none print:space-y-0", !isPublicPage && "space-y-8")}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
