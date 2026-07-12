import React, { useState } from 'react';
import { 
  Type, Palette, AlertCircle, CheckCircle, Flame, Grid, Layout, Sparkles, 
  Layers, Bell, Shield, Info, Smartphone, Monitor, ChevronRight, HelpCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeProvider';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Skeleton, SkeletonFeed } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { SuccessState } from './ui/SuccessState';

export const DesignSystemShowcase: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [testInputValue, setTestInputValue] = useState('');
  const [testInputError, setTestInputError] = useState('');
  const [buttonLoading, setButtonLoading] = useState(false);

  // Trigger simulated operation
  const handleLoadSimulation = () => {
    setButtonLoading(true);
    setTimeout(() => {
      setButtonLoading(false);
      showToast('Loaded system components and visual layouts successfully!', 'success', 'SIMULATION REVEALED');
    }, 1500);
  };

  const handleTriggerToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    if (type === 'success') {
      showToast('Enterprise resources configured securely with zero anomalies.', 'success', 'DATABASE SYNCED');
    } else if (type === 'error') {
      showToast('Unable to synchronize telemetry assets due to missing token credentials.', 'error', 'CONNECTION DENIED');
    } else if (type === 'warning') {
      showToast('Memory footprint is exceeding normal operational margins.', 'warning', 'RESOURCE HAZARD');
    } else {
      showToast('Daily operations have been logged into the regional directory.', 'info', 'AUDIT LOGGED');
    }
  };

  const handleTriggerConfirm = () => {
    confirm({
      title: 'Initialize System Optimization?',
      message: 'This process will recalibrate local UI structures and clear development cache lines. This operation cannot be rolled back.',
      confirmLabel: 'Recalibrate Now',
      cancelLabel: 'Keep Cache',
      type: 'warning',
      onConfirm: () => {
        showToast('Local system optimization completed with high efficiency.', 'success', 'CALIBRATION COMPLETED');
      },
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-linear-to-br from-teal-500/5 via-transparent to-transparent p-8 sm:p-10">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-full text-[9px] font-black uppercase tracking-widest">
              <Sparkles className="w-3 h-3 animate-spin" /> Stage 3.1 Certified
            </div>
            <h1 className="text-3xl font-black font-display text-gray-900 dark:text-slate-100 tracking-tight uppercase leading-none">
              DairySphere UI Foundation
            </h1>
            <p className="text-[11px] text-gray-600 dark:text-slate-300 max-w-xl font-medium leading-relaxed">
              Experience the complete visual design language. Crafted to mimic Stripe and Linear levels of responsiveness, typography hierarchies, and dark theme consistency.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button variant="outline" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️ Switch Light' : '🌙 Switch Dark'}
            </Button>
            <Button variant="primary" onClick={handleTriggerConfirm}>
              Re-init Core Mode
            </Button>
          </div>
        </div>
      </div>

      {/* Grid containing design categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Color Palette section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <CardTitle>Color Palette Swatches</CardTitle>
            </div>
            <CardDescription>Tailwind v4 theme colors & variables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium leading-relaxed">
              DairySphere utilizes a robust SaaS Teal spectrum paired with cool Slate-Grays for sleek boundaries and depth mappings.
            </p>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-teal-800 dark:text-teal-400 uppercase tracking-wider block">Teal Palette (Brand)</span>
              <div className="grid grid-cols-6 gap-1">
                {[50, 100, 200, 300, 400, 500].map((level) => (
                  <div key={level} className="flex flex-col items-center">
                    <div className={`w-full h-8 rounded-lg shadow-2xs border border-black/5 bg-teal-${level}`} />
                    <span className="text-[9px] font-mono mt-1 text-slate-500 font-semibold">{level}</span>
                  </div>
                ))}
                {[600, 700, 800, 900, 950].map((level) => (
                  <div key={level} className="flex flex-col items-center">
                    <div className={`w-full h-8 rounded-lg shadow-2xs border border-black/5 bg-teal-${level}`} />
                    <span className="text-[9px] font-mono mt-1 text-slate-500 font-semibold">{level}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-black text-teal-800 dark:text-teal-400 uppercase tracking-wider block">Theme Surfaces</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest block">Primary BG</span>
                  <span className="text-[9px] font-mono text-slate-400">bg-white / bg-slate-900</span>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest block">Secondary BG</span>
                  <span className="text-[9px] font-mono text-slate-400">bg-slate-50 / bg-slate-950</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography scales */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <CardTitle>Typography System</CardTitle>
            </div>
            <CardDescription>Inter, Space Grotesk, & JetBrains Mono</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-2 border-slate-200 dark:border-slate-800 pl-4 space-y-4">
              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase">font-display (Display Titles)</span>
                <h1 className="text-xl font-black font-display tracking-tight text-slate-900 dark:text-slate-100 uppercase">
                  DairySphere Enterprise
                </h1>
              </div>

              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase">font-sans (UI Semibold Titles)</span>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Audit Activity Logs
                </h4>
              </div>

              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase">font-sans (Body Text)</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  The quick brown fox jumps over the lazy dog. Standard layout text is rendered with modern Inter variable weighting for optimal screen readability.
                </p>
              </div>

              <div>
                <span className="text-[9px] font-mono text-slate-400 uppercase">font-mono (Data & Telemetry)</span>
                <p className="font-mono text-[10px] text-teal-600 dark:text-teal-400 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg inline-block border border-slate-100 dark:border-slate-900">
                  ID: user_01JK94H78P56T
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Buttons */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <CardTitle>Interactive Buttons</CardTitle>
            </div>
            <CardDescription>Visual weights and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-teal-800 dark:text-teal-400 uppercase tracking-wider block">Button Variants</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-teal-800 dark:text-teal-400 uppercase tracking-wider block">Button Sizing Scale</span>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="xs">XS Tag</Button>
                <Button size="sm">Small Act</Button>
                <Button size="md">Medium Standard</Button>
                <Button size="lg">Large Hero</Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black text-teal-800 dark:text-teal-400 uppercase tracking-wider block">Dynamic Feedback States</span>
              <div className="flex flex-wrap gap-2">
                <Button loading variant="primary">Saving...</Button>
                <Button 
                  loading={buttonLoading} 
                  variant="primary" 
                  onClick={handleLoadSimulation}
                >
                  Run Simulation
                </Button>
                <Button disabled variant="outline">Disabled State</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inputs Demo */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Grid className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <CardTitle>Form Fields & Controls</CardTitle>
            </div>
            <CardDescription>Input validation and utility states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              label="Standard Config Input" 
              placeholder="e.g., Regional Cooperative" 
              description="A unique name corresponding to your administrative tenant."
            />

            <Input 
              label="Interactive Validation Demo" 
              placeholder="Type anything..." 
              value={testInputValue}
              onChange={(e) => {
                const val = e.target.value;
                setTestInputValue(val);
                if (val.length > 0 && val.length < 5) {
                  setTestInputError('Administrative tenant prefix must be at least 5 characters');
                } else {
                  setTestInputError('');
                }
              }}
              error={testInputError}
              description="Displays error guidelines dynamically as the operator interacts."
            />
          </CardContent>
        </Card>

        {/* Toast Triggers */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <CardTitle>Global Messaging System (Toasts)</CardTitle>
            </div>
            <CardDescription>Event notifications with dedicated visual priorities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
              Click the actions below to trigger toast warnings and confirmation streams mapped securely to the portal framework.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="border-teal-200 text-teal-700" onClick={() => handleTriggerToast('success')}>
                🟢 Success Notification
              </Button>
              <Button variant="outline" className="border-rose-200 text-rose-700" onClick={() => handleTriggerToast('error')}>
                🔴 Critical Exception
              </Button>
              <Button variant="outline" className="border-amber-200 text-amber-700" onClick={() => handleTriggerToast('warning')}>
                🟡 Operational Alert
              </Button>
              <Button variant="outline" className="border-blue-200 text-blue-700" onClick={() => handleTriggerToast('info')}>
                🔵 System Log Info
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feedback State Components */}
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest pt-2 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Layout className="w-4 h-4 text-teal-600" /> State Foundations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Skeletons */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-teal-800 dark:text-teal-400 uppercase tracking-wider block">Skeleton Shimmering System</span>
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circular" width={36} height={36} />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton variant="text" width="50%" />
                      <Skeleton variant="text" width="30%" />
                    </div>
                  </div>
                  <Skeleton variant="rectangular" height={80} />
                </CardContent>
              </Card>
            </div>

            {/* Empty State */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-teal-800 dark:text-teal-400 uppercase tracking-wider block">Empty State Foundation</span>
              <EmptyState 
                title="No Custom Configurations Loaded" 
                description="This environment is pristine. Configure administrative role mappings to populate indicators."
                actionLabel="Configure Mappings"
                onAction={handleTriggerConfirm}
              />
            </div>

            {/* Success State */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-teal-800 dark:text-teal-400 uppercase tracking-wider block">Success State Foundation</span>
              <SuccessState 
                title="Environment Validated Successfully" 
                message="All design tokens, theme states, typography files, and viewport boundaries have been automatically audited with zero WCAG contrast failures."
                actionLabel="Deploy Layouts"
                onAction={() => showToast('Approved design structures saved into production branch.', 'success', 'DEPLOYED')}
              />
            </div>

            {/* Error State */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-teal-800 dark:text-teal-400 uppercase tracking-wider block">Error State Foundation</span>
              <ErrorState 
                title="Synchronous Calibration Blocked" 
                message="A localized rendering block occurred when matching the standard responsive viewports. Verify high-dpi device rules."
                errorCode="ERR_RESP_MISMATCH_301"
                retryLabel="Retry Calibration"
                onRetry={() => showToast('Calibrating viewports...', 'info')}
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
