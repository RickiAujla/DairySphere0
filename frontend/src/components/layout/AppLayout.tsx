import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, Users, Shield, Settings, Database, Sparkles, LogOut, ChevronLeft, 
  ChevronRight, Menu, X, Search, Moon, Sun, Bell, HelpCircle, Compass, Award, 
  Terminal, ShieldCheck, Landmark, RefreshCw, Activity, ClipboardList,
  TrendingUp, BookOpen, FileText, CreditCard, Tag, Boxes, ShoppingBag, Truck, Cpu
} from 'lucide-react';
import { SessionData } from '../../types';
import { useTheme } from '../../context/ThemeProvider';
import { useToast } from '../../context/ToastProvider';
import { useDialog } from '../../context/DialogProvider';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { NotificationCenter } from './NotificationCenter';
import { CommandPalette } from './CommandPalette';

type TabType = 'dashboard' | 'profile' | 'settings' | 'users' | 'rbac' | 'logs' | 'design' | 'presentation' | 'master' | 'farmers' | 'collections' | 'rateMaster' | 'ledger' | 'billing' | 'payments' | 'products' | 'inventory' | 'purchases' | 'customers' | 'sales' | 'salesReports' | 'biAnalytics' | 'distribution' | 'finance' | 'adminOperations' | 'automation' | 'integrations';


interface AppLayoutProps {
  session: SessionData;
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  session,
  activeTab,
  onChangeTab,
  onLogout,
  children,
}) => {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to keyboard shortcuts (Cmd+K / Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommandPaletteNavigate = (tab: 'dashboard' | 'profile' | 'settings' | 'users' | 'rbac' | 'logs' | 'design' | 'presentation' | 'master') => {
    onChangeTab(tab);
    setMobileMenuOpen(false);
    showToast(`Navigated to ${tab.toUpperCase()} workspace.`, 'info');
  };

  // Define sidebar items & groups
  const navGroups = [
    {
      title: 'Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Operations Command',
          icon: <Activity className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Real-time telemetry & metrics',
        },
        {
          id: 'farmers',
          label: 'Farmer Directory',
          icon: <Users className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Cooperative member registries',
        },
        {
          id: 'collections',
          label: 'Milk Collection',
          icon: <ClipboardList className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Manage milk intake logs',
        },
      ],
    },
    {
      title: 'Procurement & Finance',
      items: [
        {
          id: 'rateMaster',
          label: 'Rate Master Chart',
          icon: <TrendingUp className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Fat/SNF price configuration',
        },
        {
          id: 'ledger',
          label: 'Farmer Ledger',
          icon: <BookOpen className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Credit, debit, and adjustments',
        },
        {
          id: 'billing',
          label: 'Procurement Billing',
          icon: <FileText className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Calculate milk payments',
        },
        {
          id: 'payments',
          label: 'Payment Entry',
          icon: <CreditCard className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Payout vouchers & settlements',
        },
        {
          id: 'finance',
          label: 'Finance & Accounts',
          icon: <Landmark className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Chart of accounts, cash/bank books & ledger',
        },
      ],
    },
    {
      title: 'Logistics & Distribution',
      items: [
        {
          id: 'products',
          label: 'Product Catalog',
          icon: <Tag className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Manage catalog items & brands',
        },
        {
          id: 'inventory',
          label: 'Inventory Engine',
          icon: <Boxes className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Track physical stock levels',
        },
        {
          id: 'distribution',
          label: 'Delivery & Fleet',
          icon: <Truck className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Manage routes & subscriptions',
        },
        {
          id: 'purchases',
          label: 'Procurement Purchases',
          icon: <ShoppingBag className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Supplier Purchase Invoices',
        },
      ],
    },
    {
      title: 'Customer & Sales Hub',
      items: [
        {
          id: 'customers',
          label: 'Customer Profiles',
          icon: <Users className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Manage customer registry, categories & GST',
        },
        {
          id: 'sales',
          label: 'Sales & Invoicing',
          icon: <ShoppingBag className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Invoices, sales orders, and returns',
        },
        {
          id: 'salesReports',
          label: 'Reports & Analytics',
          icon: <TrendingUp className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Comprehensive auditing & business intelligence',
        },
        {
          id: 'biAnalytics',
          label: 'Advanced BI & Analytics',
          icon: <Sparkles className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Forecasting engine & strategic KPIs',
        },
      ],
    },
    {
      title: 'Governance & Identity',
      items: [
        {
          id: 'users',
          label: 'User Directory',
          icon: <Users className="w-4 h-4" />,
          requiresAdmin: true,
          desc: 'Manage members & roles',
        },
        {
          id: 'rbac',
          label: 'RBAC Permission Matrix',
          icon: <Shield className="w-4 h-4" />,
          requiresAdmin: true,
          desc: 'Audit system authorizations',
        },
        {
          id: 'adminOperations',
          label: 'Operations & Admin',
          icon: <ShieldCheck className="w-4 h-4" />,
          requiresAdmin: true,
          desc: 'Employees, Attendance & Payroll',
        },
      ],
    },
    {
      title: 'Administrative',
      items: [
        {
          id: 'profile',
          label: 'Business Profile',
          icon: <Building2 className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Tenant information',
        },
        {
          id: 'settings',
          label: 'Cooperative Preferences',
          icon: <Settings className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Custom configuration settings',
        },
        {
          id: 'master',
          label: 'Master Registries',
          icon: <Database className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Milk, standards, and routes master data',
        },
        {
          id: 'automation',
          label: 'Automation Engine',
          icon: <Cpu className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Orchestrate background workers & closings',
        },
        {
          id: 'integrations',
          label: 'API Integrations',
          icon: <Cpu className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Manage webhooks, gateways, and storage',
        },
        {
          id: 'logs',
          label: 'Governance Audit Trails',
          icon: <Database className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'Immutable security ledger',
        },
      ],
    },
    {
      title: 'Developer Utilities',
      items: [
        {
          id: 'presentation',
          label: 'Forms & Data Tables',
          icon: <Database className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'TanStack & HookForm validation sandbox',
        },
        {
          id: 'design',
          label: 'Design Showcase',
          icon: <Sparkles className="w-4 h-4" />,
          requiresAdmin: false,
          desc: 'DairySphere component sandbox',
        },
      ],
    },
  ];

  // Get current path breadcrumbs
  const getBreadcrumbs = () => {
    const crumbMap: Record<string, { parent: string; current: string }> = {
      dashboard: { parent: 'Operations', current: 'Command Center' },
      profile: { parent: 'Administrative', current: 'Business Profile' },
      settings: { parent: 'Administrative', current: 'Cooperative Preferences' },
      master: { parent: 'Administrative', current: 'Master Registries' },
      farmers: { parent: 'Operations', current: 'Farmer Registries' },
      collections: { parent: 'Operations', current: 'Milk Collection Log' },
      rateMaster: { parent: 'Procurement', current: 'Milk Rate Configuration' },
      ledger: { parent: 'Finance', current: 'Farmer Ledger Statement' },
      billing: { parent: 'Finance', current: 'Procurement Billing Runs' },
      payments: { parent: 'Finance', current: 'Payout Vouchers & Settlements' },
      finance: { parent: 'Finance', current: 'General Ledger & Accounts' },
      products: { parent: 'Logistics', current: 'Product Catalog' },
      inventory: { parent: 'Logistics', current: 'Inventory Hub' },
      distribution: { parent: 'Logistics', current: 'Delivery & Fleet' },
      purchases: { parent: 'Logistics', current: 'Purchase Bills' },
      customers: { parent: 'Commercials', current: 'Customer Management' },
      sales: { parent: 'Commercials', current: 'Sales Orders & Invoices' },
      salesReports: { parent: 'Commercials', current: 'Reports & Analytics' },
      automation: { parent: 'Administrative', current: 'Automation & Jobs' },
      integrations: { parent: 'Administrative', current: 'Third-Party Integrations' },
      logs: { parent: 'Administrative', current: 'Audit Trails' },
      users: { parent: 'Governance', current: 'User Directory' },
      rbac: { parent: 'Governance', current: 'RBAC Matrix' },
      adminOperations: { parent: 'Governance', current: 'Operations & Admin' },
      design: { parent: 'Developer', current: 'Design System' },
      presentation: { parent: 'Developer', current: 'Forms & Presentation' },
    };

    return crumbMap[activeTab] || { parent: 'Portal', current: 'Workspace' };
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/80 text-slate-800 dark:text-slate-100 flex transition-colors duration-250 select-none">
      
      {/* 1. SIDEBAR: Desktop / Tablet persistent collapsible menu */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-all duration-300 relative z-40 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Collapse Trigger button on edge */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute top-8 -right-3.5 w-7 h-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:shadow-sm dark:hover:text-slate-200 transition-colors cursor-pointer"
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Sidebar Header branding */}
        <div className="h-16 px-5 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 dark:bg-teal-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in truncate">
              <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight block">
                DairySphere <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold">V2</span>
              </span>
              <span className="text-[9px] text-slate-400 font-mono font-semibold block uppercase leading-none">
                Enterprise Multi-tenant
              </span>
            </div>
          )}
        </div>

        {/* Workspace Switcher */}
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800/60">
          {sidebarCollapsed ? (
            <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold mx-auto cursor-pointer" title={session.business.name}>
              {session.business.name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <WorkspaceSwitcher session={session} />
          )}
        </div>

        {/* Sidebar content scrolling navigation groups */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group) => {
            // Filter admin specific items
            const visibleItems = group.items.filter(
              (item) => !item.requiresAdmin || session.user.role === 'ADMIN'
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                {!sidebarCollapsed && (
                  <h5 className="px-3 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    {group.title}
                  </h5>
                )}

                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onChangeTab(item.id as any)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer relative group ${
                          isActive
                            ? 'bg-teal-550 text-white shadow-xs shadow-teal-600/10 dark:bg-teal-600/90'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <div className="shrink-0">{item.icon}</div>
                        {!sidebarCollapsed && (
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold block truncate">{item.label}</span>
                            <span className={`text-[8px] block truncate leading-none mt-0.5 ${
                              isActive ? 'text-teal-100' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {item.desc}
                            </span>
                          </div>
                        )}

                        {/* Tooltip on hover if collapsed */}
                        {sidebarCollapsed && (
                          <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-slate-950 text-white text-[9px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            {item.label}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer User Section */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold text-xs select-none shrink-0 border border-teal-200 dark:border-teal-900">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight">
                  {session.user.name}
                </span>
                <span className="text-[9px] font-mono font-bold text-teal-600 dark:text-teal-400 block truncate uppercase tracking-widest leading-none mt-0.5">
                  {session.user.role || 'ADMIN'}
                </span>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={onLogout}
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                title="Log Out Session"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN SCREEN WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* HEADER: Top bar */}
        <header className="h-16 px-6 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 sticky top-0 z-30 flex items-center justify-between transition-colors">
          
          {/* Header left: Mobile hamburger & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl md:hidden transition"
              aria-label="Open mobile navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb section */}
            <nav className="hidden sm:flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              <span>{breadcrumbs.parent}</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-slate-800 dark:text-slate-355">{breadcrumbs.current}</span>
            </nav>
          </div>

          {/* Header center/right: Search trigger, Theme, Notifications, User menu */}
          <div className="flex items-center gap-3">
            
            {/* Global Search button trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-750 bg-slate-50/50 dark:bg-slate-950/30 rounded-xl text-left text-gray-400 dark:text-slate-500 transition-colors w-40 sm:w-56 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[10px] font-bold flex-1 truncate uppercase tracking-wider">Search controls...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-[8px] font-mono font-bold">
                ⌘K
              </kbd>
            </button>

            {/* Dark/Light Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/85 rounded-xl transition"
              title={theme === 'dark' ? "Toggle Light Theme" : "Toggle Dark Theme"}
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Notification drop */}
            <NotificationCenter />

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

            {/* User Dropdown Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <div className="w-7 h-7 rounded-full bg-teal-650 text-white flex items-center justify-center font-bold text-[11px]">
                  {session.user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in-50 slide-in-from-top-1">
                  <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1.5">
                    <span className="text-[10px] font-black text-gray-950 dark:text-slate-100 uppercase tracking-tight block">
                      {session.user.name}
                    </span>
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium block leading-none mt-0.5 truncate">
                      {session.user.email}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        onChangeTab('profile');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-left transition uppercase tracking-wider"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Tenant Profile
                    </button>
                    <button
                      onClick={() => {
                        onChangeTab('settings');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-left transition uppercase tracking-wider"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Preferences
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-left transition uppercase tracking-wider border-t border-slate-50 dark:border-slate-800 mt-1 pt-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Terminate Session
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* PAGE CONTENT CONTAINER (Scroll Area) */}
        <main className="flex-1 overflow-y-auto px-6 py-8 relative">
          
          {/* SENSOR BARS: Warn operators about staging variables */}
          <div className="max-w-4xl mx-auto space-y-8">
            {children}
          </div>

        </main>

        {/* FOOTER */}
        <footer className="h-12 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 px-6 flex items-center justify-between text-[9px] font-bold font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span>Tenant SLA: 99.99% Guaranteed</span>
          </div>
          <div>
            <span>DairySphere Staging Cluster © 2026</span>
          </div>
        </footer>

      </div>

      {/* 3. MOBILE MENU SIDEBAR (Drawer panel) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer panel with slide effect */}
          <div className="relative w-72 bg-white dark:bg-slate-900 h-full flex flex-col p-5 border-r border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-left">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-650 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black tracking-tight block">DairySphere</span>
                  <span className="text-[8px] font-mono text-slate-400 block leading-none uppercase">Mobile Console</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg text-slate-400 hover:text-slate-700 transition"
                aria-label="Close mobile navigation drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Workspace details inside mobile drawer */}
            <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Active Cooperative Schema</span>
              <span className="text-[10px] font-bold text-teal-750 dark:text-teal-400 block">{session.business.name}</span>
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">{session.business.slug}.dairysphere.com</span>
            </div>

            {/* Scrollable menu links */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1">
              {navGroups.map((group) => {
                const visibleItems = group.items.filter(
                  (item) => !item.requiresAdmin || session.user.role === 'ADMIN'
                );

                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.title} className="space-y-1">
                    <h5 className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-805 pb-1">
                      {group.title}
                    </h5>
                    <div className="space-y-0.5">
                      {visibleItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleCommandPaletteNavigate(item.id as any)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition ${
                              isActive
                                ? 'bg-teal-550 text-white dark:bg-teal-650'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-250'
                            }`}
                          >
                            {item.icon}
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold block truncate">{item.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile drawer footer */}
            <div className="border-t border-slate-100 dark:border-slate-800/85 pt-4 mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold text-xs select-none">
                  {session.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-bold block truncate max-w-[120px] leading-tight text-slate-805 dark:text-slate-205">{session.user.name}</span>
                  <span className="text-[8px] font-mono font-bold text-teal-600 uppercase tracking-wider">{session.user.role || 'ADMIN'}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-rose-600 transition"
                title="Log Out Session"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. KEYBOARD COMMAND PALETTE COMPONENT */}
      <CommandPalette
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleCommandPaletteNavigate}
        onToggleTheme={toggleTheme}
        role={session.user.role || 'ADMIN'}
      />

    </div>
  );
};
