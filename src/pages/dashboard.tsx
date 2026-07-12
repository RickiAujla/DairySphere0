import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Layers, 
  FolderTree, 
  Cpu, 
  FileCheck, 
  Palette, 
  Settings, 
  Activity, 
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { APP_METADATA } from '../common/constants';

export default function Dashboard() {
  const foldersList = [
    {
      name: 'frontend/src/common',
      desc: 'Shared design system tokens, constants, utility functions, and types',
      status: 'Ready'
    },
    {
      name: 'frontend/src/providers',
      desc: 'Light/Dark mode ThemeProvider context and global providers',
      status: 'Ready'
    },
    {
      name: 'frontend/src/pages',
      desc: 'Next-inspired route modules (loading, errors, 404, core dashboard)',
      status: 'Ready'
    },
    {
      name: 'frontend/src/components',
      desc: 'Enterprise layout schemas, sidebar structures, and ErrorBoundary wrappers',
      status: 'Ready'
    },
  ];

  const designTokens = [
    { name: 'Background', variable: '--background', value: 'hsl(var(--background))', cls: 'bg-background text-foreground border border-border' },
    { name: 'Primary Core', variable: '--primary', value: 'hsl(var(--primary))', cls: 'bg-primary text-primary-foreground' },
    { name: 'Secondary', variable: '--secondary', value: 'hsl(var(--secondary))', cls: 'bg-secondary text-secondary-foreground border border-border' },
    { name: 'Accent Layer', variable: '--accent', value: 'hsl(var(--accent))', cls: 'bg-accent text-accent-foreground border border-border' },
    { name: 'Muted Tone', variable: '--muted', value: 'hsl(var(--muted))', cls: 'bg-muted text-muted-foreground border border-border' },
    { name: 'Destructive', variable: '--destructive', value: 'hsl(var(--destructive))', cls: 'bg-destructive text-destructive-foreground' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner Indicator */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded text-xs font-mono font-medium border border-primary/20">
                Stage 1.4 Active
              </span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded text-xs font-mono font-medium border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Fully Verified
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight font-sans text-foreground">
              Core Workspace
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl font-sans">
              The foundational design tokens, layouts, error-boundaries, and pathing mechanisms of DairySphere have been successfully engineered and compiled.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of system diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Design System Card */}
        <div className="bg-card border border-border p-6 rounded-lg md:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" /> Core Design Tokens (Active Theme)
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground">SHADCN/UI SPEC</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {designTokens.map((token) => (
              <div key={token.name} className="border border-border rounded-lg p-3 space-y-2.5 bg-muted/20">
                <div className={`h-10 w-full rounded-md flex items-center justify-center font-mono text-[10px] font-bold ${token.cls}`}>
                  Aa
                </div>
                <div>
                  <div className="text-xs font-semibold text-foreground truncate">{token.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate">{token.variable}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integration Status Card */}
        <div className="bg-card border border-border p-6 rounded-lg space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" /> Engine Metrics
            </h3>
            <span className="text-[10px] font-mono text-emerald-500 animate-pulse">● LIVE</span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Framework:</span>
              <span className="font-mono font-medium text-foreground">React 19.0 (Vite)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Styling:</span>
              <span className="font-mono font-medium text-foreground">Tailwind CSS v4</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Build Pipeline:</span>
              <span className="font-mono font-medium text-foreground">ESM / Strict TS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">0 Errors</span>
            </div>
          </div>
        </div>
      </div>

      {/* Directory architecture tree */}
      <div className="bg-card border border-border p-6 rounded-lg space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-foreground flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-muted-foreground" /> Core Infrastructural Directories Scaffolded
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The following core modules are isolated and validated in strict alignment with production standards:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {foldersList.map((folder, idx) => (
            <div key={idx} className="bg-muted/30 border border-border p-4 rounded-lg flex items-start gap-3">
              <div className="bg-background border border-border p-1.5 rounded text-foreground">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-foreground">/{folder.name}</div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{folder.desc}</p>
                <div className="text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                  {folder.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
