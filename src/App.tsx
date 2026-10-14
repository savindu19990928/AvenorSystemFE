import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Loader2Icon } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrandProvider } from './contexts/BrandContext';
import { AppShell } from './components/layout/AppShell';
import { RequireRole } from './components/layout/RequireRole';
import { UpdateNotifier } from './components/layout/UpdateNotifier';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Notifications } from './pages/Notifications';
import { Customers } from './pages/sales/Customers';
import { CustomerDetailPage } from './pages/sales/CustomerDetail';
import { Quotations } from './pages/sales/Quotations';
import { Orders } from './pages/sales/Orders';
import { OrderDetailPage } from './pages/sales/OrderDetail';
import { ArtworkPage } from './pages/operations/Artwork';
import { ProductionPage } from './pages/operations/Production';
import { InventoryPage } from './pages/operations/Inventory';
import { CatalogPage } from './pages/operations/Catalog';
import { MaterialsPage } from './pages/operations/Materials';
import { DeliveriesPage } from './pages/operations/Deliveries';
import { InvoicesPage } from './pages/finance/Invoices';
import { PaymentsPage } from './pages/finance/Payments';
import { ProfitPage } from './pages/finance/Profit';
import { ReportsPage } from './pages/finance/Reports';
import { UsersPage } from './pages/admin/Users';
import { AuditLogPage } from './pages/admin/AuditLog';

function ProtectedApp() {
  const { status } = useAuth();
  if (status === 'loading') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-canvas text-sm text-muted">
        <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> Restoring your session…
      </div>);

  }
  if (status === 'anonymous') return <Navigate to="/login" replace />;
  return (
    <BrandProvider>
      <AppShell />
    </BrandProvider>);

}

function LoginRoute() {
  const { status } = useAuth();
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return <Login />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route element={<ProtectedApp />}>
            <Route index element={<Dashboard />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="customers" element={<RequireRole roles={['ADMIN', 'SALES', 'ACCOUNTS', 'DELIVERY', 'PRODUCTION']}><Customers /></RequireRole>} />
            <Route path="customers/:id" element={<RequireRole roles={['ADMIN', 'SALES', 'ACCOUNTS', 'DELIVERY', 'PRODUCTION']}><CustomerDetailPage /></RequireRole>} />
            <Route path="quotations" element={<RequireRole roles={['ADMIN', 'SALES', 'ACCOUNTS']}><Quotations /></RequireRole>} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="artwork" element={<RequireRole roles={['ADMIN', 'SALES', 'PRODUCTION']}><ArtworkPage /></RequireRole>} />
            <Route path="production" element={<RequireRole roles={['ADMIN', 'SALES', 'PRODUCTION']}><ProductionPage /></RequireRole>} />
            <Route path="inventory" element={<RequireRole roles={['ADMIN', 'STORE_KEEPER', 'SALES', 'PRODUCTION']}><InventoryPage /></RequireRole>} />
            <Route path="materials" element={<RequireRole roles={['ADMIN', 'STORE_KEEPER', 'ACCOUNTS', 'SALES', 'PRODUCTION']}><MaterialsPage /></RequireRole>} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="delivery" element={<RequireRole roles={['ADMIN', 'DELIVERY', 'SALES']}><DeliveriesPage /></RequireRole>} />
            <Route path="invoices" element={<RequireRole roles={['ADMIN', 'ACCOUNTS']}><InvoicesPage /></RequireRole>} />
            <Route path="payments" element={<RequireRole roles={['ADMIN', 'ACCOUNTS']}><PaymentsPage /></RequireRole>} />
            <Route path="profit" element={<RequireRole roles={['ADMIN', 'ACCOUNTS']}><ProfitPage /></RequireRole>} />
            <Route path="reports" element={<RequireRole roles={['ADMIN', 'SALES', 'ACCOUNTS']}><ReportsPage /></RequireRole>} />
            <Route path="users" element={<RequireRole roles={['ADMIN']}><UsersPage /></RequireRole>} />
            <Route path="audit-log" element={<RequireRole roles={['ADMIN']}><AuditLogPage /></RequireRole>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <UpdateNotifier />
    </AuthProvider>);

}