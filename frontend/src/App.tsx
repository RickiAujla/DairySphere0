import React, { useState, useEffect, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionData } from './types';
import { api } from './utils/api';
import { Navbar } from './components/Navbar';
import { BusinessSetupWizard } from './components/BusinessSetupWizard';
import { LoginScreen } from './components/LoginScreen';
import { AppLayout } from './components/layout/AppLayout';
import { ThemeProvider, useTheme } from './context/ThemeProvider';
import { ToastProvider } from './context/ToastProvider';
import { DialogProvider } from './context/DialogProvider';
import { Loader2, Sparkles } from 'lucide-react';

// Dynamic Lazy Imports for optimized bundle sizes & dynamic code splitting
const BusinessProfile = React.lazy(() => import('./components/BusinessProfile').then(m => ({ default: m.BusinessProfile })));
const BusinessSettings = React.lazy(() => import('./components/BusinessSettings').then(m => ({ default: m.BusinessSettings })));
const AuditActivityLogs = React.lazy(() => import('./components/AuditActivityLogs').then(m => ({ default: m.AuditActivityLogs })));
const UserManagement = React.lazy(() => import('./components/UserManagement').then(m => ({ default: m.UserManagement })));
const RoleManagement = React.lazy(() => import('./components/RoleManagement').then(m => ({ default: m.RoleManagement })));
const DesignSystemShowcase = React.lazy(() => import('./components/DesignSystemShowcase').then(m => ({ default: m.DesignSystemShowcase })));
const FormsAndTablesShowcase = React.lazy(() => import('./components/FormsAndTablesShowcase').then(m => ({ default: m.FormsAndTablesShowcase })));
const Dashboard = React.lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const MasterDataManagement = React.lazy(() => import('./components/MasterDataManagement').then(m => ({ default: m.MasterDataManagement })));
const FarmerManagement = React.lazy(() => import('./components/FarmerManagement').then(m => ({ default: m.FarmerManagement })));
const MilkCollectionManagement = React.lazy(() => import('./components/MilkCollectionManagement').then(m => ({ default: m.MilkCollectionManagement })));
const RateMaster = React.lazy(() => import('./components/RateMaster').then(m => ({ default: m.RateMaster })));
const FarmerLedgerView = React.lazy(() => import('./components/FarmerLedgerView').then(m => ({ default: m.FarmerLedgerView })));
const FarmerBilling = React.lazy(() => import('./components/FarmerBilling').then(m => ({ default: m.FarmerBilling })));
const PaymentEntry = React.lazy(() => import('./components/PaymentEntry').then(m => ({ default: m.PaymentEntry })));
const ProductManagement = React.lazy(() => import('./components/ProductManagement').then(m => ({ default: m.ProductManagement })));
const InventoryManagement = React.lazy(() => import('./components/InventoryManagement').then(m => ({ default: m.InventoryManagement })));
const PurchaseManagement = React.lazy(() => import('./components/PurchaseManagement').then(m => ({ default: m.PurchaseManagement })));
const CustomerManagement = React.lazy(() => import('./components/CustomerManagement').then(m => ({ default: m.CustomerManagement })));
const SalesManagement = React.lazy(() => import('./components/SalesManagement').then(m => ({ default: m.SalesManagement })));
const ReportsModule = React.lazy(() => import('./components/ReportsModule').then(m => ({ default: m.ReportsModule })));
const DeliveryDistribution = React.lazy(() => import('./components/DeliveryDistribution').then(m => ({ default: m.DeliveryDistribution })));
const FinanceAccounting = React.lazy(() => import('./components/FinanceAccounting').then(m => ({ default: m.FinanceAccounting })));
const AdminOperationsHub = React.lazy(() => import('./components/AdminOperationsHub').then(m => ({ default: m.AdminOperationsHub })));
const BiAnalyticsDashboard = React.lazy(() => import('./components/BiAnalyticsDashboard').then(m => ({ default: m.BiAnalyticsDashboard })));
const AutomationPage = React.lazy(() => import('./components/automation/AutomationPage').then(m => ({ default: m.AutomationPage })));
const IntegrationsDashboard = React.lazy(() => import('./components/integrations/IntegrationsDashboard').then(m => ({ default: m.IntegrationsDashboard })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const InnerApp: React.FC = () => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [authView, setAuthView] = useState<'register' | 'login'>('register');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'settings' | 'users' | 'rbac' | 'logs' | 'design' | 'presentation' | 'master' | 'farmers' | 'collections' | 'rateMaster' | 'ledger' | 'billing' | 'payments' | 'products' | 'inventory' | 'purchases' | 'customers' | 'sales' | 'salesReports' | 'biAnalytics' | 'distribution' | 'finance' | 'adminOperations' | 'automation' | 'integrations'>('dashboard');
  const { setTheme } = useTheme();

  // Load and apply session on startup
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('dairysphere_token');
      const businessId = localStorage.getItem('dairysphere_business_id');

      if (token && businessId) {
        try {
          // Verify tenant context viability by hitting profile endpoint
          const businessProfile = await api.getProfile();
          
          let userId = 'restored-user';
          let name = 'Cooperative Admin';
          let email = 'admin@dairysphere.com';
          let role = 'ADMIN';

          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.userId || userId;
            name = payload.name || name;
            email = payload.email || email;
            role = payload.role || role;
          } catch (e) {
            // Fallback if parsing fails
          }

          setSession({
            token,
            business: businessProfile,
            user: {
              id: userId,
              name,
              email,
              role,
            },
          });

          // Fetch theme settings to apply light/dark classes dynamically
          const settings = await api.getSettings();
          if (settings.theme === 'dark') {
            setTheme('dark');
          } else {
            setTheme('light');
          }
        } catch (err) {
          // Token or connection stale, wipe cache
          localStorage.removeItem('dairysphere_token');
          localStorage.removeItem('dairysphere_business_id');
        }
      }
      setRestoring(false);
    }
    restoreSession();
  }, [setTheme]);

  const handleAuthSuccess = (newSession: SessionData) => {
    setSession(newSession);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('dairysphere_token');
    localStorage.removeItem('dairysphere_business_id');
    setSession(null);
    setAuthView('login');
    setTheme('light');
  };

  const handleRefreshBusinessName = (newName: string) => {
    if (session) {
      setSession({
        ...session,
        business: {
          ...session.business,
          name: newName,
        },
      });
    }
  };

  if (restoring) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
        <p className="text-sm font-bold text-gray-500 dark:text-slate-400 mt-4 tracking-tight">Resolving Multi-Tenant Context...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {session ? (
        // AUTHENTICATED USER WORKSPACE
        <AppLayout
          session={session}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onLogout={handleLogout}
        >
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center py-24 select-none animate-pulse-slow">
                <Loader2 className="w-10 h-10 text-teal-600 dark:text-teal-400 animate-spin" />
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 mt-3 tracking-wide">Resolving Module Bundle...</p>
              </div>
            }
          >
            {activeTab === 'dashboard' && <Dashboard session={session} />}
            {activeTab === 'profile' && (
              <BusinessProfile
                business={session.business}
                onRefreshBusiness={handleRefreshBusinessName}
              />
            )}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'rbac' && <RoleManagement />}
            {activeTab === 'settings' && <BusinessSettings />}
            {activeTab === 'master' && <MasterDataManagement />}
            {activeTab === 'farmers' && <FarmerManagement session={session} />}
            {activeTab === 'collections' && <MilkCollectionManagement session={session} />}
            {activeTab === 'rateMaster' && <RateMaster session={session} />}
            {activeTab === 'ledger' && <FarmerLedgerView session={session} />}
            {activeTab === 'billing' && <FarmerBilling session={session} />}
            {activeTab === 'payments' && <PaymentEntry session={session} />}
            {activeTab === 'products' && <ProductManagement session={session} />}
            {activeTab === 'inventory' && <InventoryManagement session={session} />}
            {activeTab === 'purchases' && <PurchaseManagement session={session} />}
            {activeTab === 'customers' && <CustomerManagement session={session} />}
            {activeTab === 'sales' && <SalesManagement session={session} />}
            {activeTab === 'salesReports' && <ReportsModule session={session} />}
            {activeTab === 'biAnalytics' && <BiAnalyticsDashboard session={session} />}
            {activeTab === 'distribution' && <DeliveryDistribution session={session} />}
            {activeTab === 'finance' && <FinanceAccounting session={session} />}
            {activeTab === 'logs' && <AuditActivityLogs />}
            {activeTab === 'adminOperations' && <AdminOperationsHub session={session} />}
            {activeTab === 'automation' && <AutomationPage />}
            {activeTab === 'integrations' && <IntegrationsDashboard />}
            {activeTab === 'design' && <DesignSystemShowcase />}
            {activeTab === 'presentation' && <FormsAndTablesShowcase />}
          </Suspense>
        </AppLayout>
      ) : (
        // ANONYMOUS PORTAL / ONBOARDING ENTRANCE
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
          {/* Subtle Abstract Background Decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none animate-pulse-slow" />
          
          <div className="relative z-10 w-full space-y-10 py-12">
            {/* Header Platform Presentation */}
            <div className="text-center space-y-3 max-w-lg mx-auto animate-fade-in">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 rounded-full text-xs font-semibold text-teal-800 dark:text-teal-400">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
                DairySphere Multi-Tenancy Core
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100 leading-tight">
                Enterprise Dairy Management
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                A highly secure, schema-isolated environment designed for high-scale multi-tenant milk cooperatives.
              </p>
            </div>

            {/* Dynamic View Swapper */}
            <div className="transition-all duration-300">
              {authView === 'register' ? (
                <BusinessSetupWizard
                  onSuccess={handleAuthSuccess}
                  onNavigateToLogin={() => setAuthView('login')}
                />
              ) : (
                <LoginScreen
                  onSuccess={handleAuthSuccess}
                  onNavigateToRegister={() => setAuthView('register')}
                />
              )}
            </div>

            {/* Bottom Platform Trust Matrix */}
            <div className="max-w-xl mx-auto grid grid-cols-3 gap-6 pt-6 border-t border-gray-100 dark:border-slate-800/60 text-center select-none">
              <div className="space-y-1">
                <span className="block text-xs font-extrabold text-teal-800 dark:text-teal-400 uppercase tracking-wider">Tenant Isolation</span>
                <span className="block text-[11px] text-gray-400 dark:text-slate-500">Strict Sub-schema Boundaries</span>
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-extrabold text-teal-800 dark:text-teal-400 uppercase tracking-wider">Full SLA audit</span>
                <span className="block text-[11px] text-gray-400 dark:text-slate-500">Governance Log Stream</span>
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-extrabold text-teal-800 dark:text-teal-400 uppercase tracking-wider">Scale Ready</span>
                <span className="block text-[11px] text-gray-400 dark:text-slate-500">Designed for 10k+ Users</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <DialogProvider>
            <InnerApp />
          </DialogProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
