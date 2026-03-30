import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useInventoryStore } from "./store/inventoryStore";
import { supabase } from "@/integrations/supabase/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import WelcomePage from "./pages/WelcomePage";
import DashboardPage from "./pages/DashboardPage";
import DispensePage from "./pages/DispensePage";
import TransferPage from "./pages/TransferPage";
import ItemsPage from "./pages/ItemsPage";
import AdjustmentPage from "./pages/AdjustmentPage";
import ReportsPage from "./pages/ReportsPage";
import ClinicsPage from "./pages/ClinicsPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";



const App = () => {
  const fetchData = useInventoryStore((state) => state.fetchData);

  useEffect(() => {
    fetchData();

    // Subscribe to live changes once
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <AppLayout>
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/adjustment" element={<AdjustmentPage />} />
            <Route path="/dispense" element={<DispensePage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/clinics" element={<ClinicsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;
