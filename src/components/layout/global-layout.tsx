import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Settings, 
  Activity, 
  Users, 
  Package, 
  FileText, 
  FolderLock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { APP_METADATA } from '../../common/constants';

interface GlobalLayoutProps {
  children: ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  // Navigation structure mapping the frozen enterprise routing blueprints
  const routesGroupApp = [
    { name: 'Dashboard Home', path: '/', icon: Home, badge: 'Core' },
    { name: 'Multi-Tenant Nodes', path: '/tenants-stub', icon: Layers, locked: true },
    { name: 'Farmers & Herd', path: '/farmers-stub', icon: Users, locked: true },
    { name: 'Milk Inventory', path: '/milk-stub', icon: Package, locked: true },
    { name: 'Billing & Ledger', path: '/billing-stub', icon: FileText, locked: true },
  ];

  const routesGroupAdmin = [
    { name: 'Platform Settings', path: '/settings-stub', icon: Settings, locked: true },
    { name: 'Audit Telemetry', path: '/audit-stub', icon: Activity, locked: true },
    { name: 'Security Vault', path: '/security-stub', icon: FolderLock, locked: true },
  ];

  return (
    <div className="flex-grow flex max-w-7xl mx-auto w-full px-6 py-8 gap-8">
      {/* Structural Sidebar - Responsive visibility */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-6">
        {/* Core Info Panel */}
        <div className="bg-card border border-border rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">Tenant Workspace</div>
          <div className="font-semibold text-sm tracking-tight text-foreground font-sans">
            Global Dairy Operations
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">
            Enterprise database sandbox. Sub-tenant modules frozen during core platform bootstrapping.
          </p>
        </div>

        {/* Route Group A - Dairy Operations */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-mono font-semibold uppercase text-muted-foreground tracking-widest px-3 mb-2">
            Dairy Operations
          </h4>
          <nav className="space-y-1">
            {routesGroupApp.map((item) => {
              const Icon = item.icon;
              if (item.locked) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground bg-transparent border border-transparent rounded-md select-none opacity-60"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-muted-foreground/80" />
                      <span>{item.name}</span>
                    </div>
                    <span className="text-[9px] font-mono bg-accent px-1.5 py-0.5 rounded uppercase tracking-wider scale-95">
                      Stage 1.5
                    </span>
                  </div>
                );
              }
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 text-xs font-medium border rounded-md transition-all ${
                      isActive
                        ? 'bg-accent border-border text-foreground'
                        : 'bg-transparent border-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold uppercase scale-95 tracking-wider">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Route Group B - Admin Systems */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-mono font-semibold uppercase text-muted-foreground tracking-widest px-3 mb-2">
            Security & Controls
          </h4>
          <nav className="space-y-1">
            {routesGroupAdmin.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground bg-transparent border border-transparent rounded-md select-none opacity-60"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-muted-foreground/80" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-[9px] font-mono bg-accent px-1.5 py-0.5 rounded uppercase tracking-wider scale-95">
                    Stage 1.5
                  </span>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Version Banner bottom */}
        <div className="mt-auto bg-muted/40 border border-border p-4 rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-muted-foreground">ENGINE LEVEL</div>
            <div className="text-xs font-semibold text-foreground font-sans mt-0.5">NestJS Core & React</div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
        </div>
      </aside>

      {/* Primary Workspace Panel */}
      <section className="flex-grow flex flex-col min-w-0 bg-card border border-border rounded-lg p-6 lg:p-8 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-colors duration-200">
        {children}
      </section>
    </div>
  );
}
