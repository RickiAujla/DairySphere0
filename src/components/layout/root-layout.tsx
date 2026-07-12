import { ReactNode, useState, useEffect } from 'react';
import { useTheme } from '../../providers/theme-provider';
import { Sun, Moon, Laptop, AppWindow, ShieldAlert, Cpu } from 'lucide-react';
import { APP_METADATA } from '../../common/constants';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const { theme, setTheme } = useTheme();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Dynamic System Status Strip */}
      <div className="bg-[#111111] dark:bg-black text-white text-[11px] font-mono py-2 px-6 flex items-center justify-between border-b border-border shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[#888888]">SYSTEM STATE:</span>
          <span className="text-[#ffffff] font-medium tracking-wide uppercase">{APP_METADATA.stage}</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[#888888]">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3" /> VER: {APP_METADATA.version}
          </span>
          <span className="text-[#ffffff]">{time}</span>
        </div>
      </div>

      {/* Enterprise Workspace Header */}
      <header className="border-b border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold font-sans tracking-tight">
              DS
            </div>
            <div>
              <div className="font-semibold text-lg leading-none tracking-tight text-foreground font-sans">
                {APP_METADATA.title}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-widest">
                Enterprise Core Node
              </div>
            </div>
          </div>

          {/* Core Controls */}
          <div className="flex items-center gap-2">
            {/* Theme Selector (Segmented Control Vibe) */}
            <div className="bg-muted p-1 rounded-lg border border-border flex items-center gap-1">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  theme === 'light' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  theme === 'system' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="System Mode"
              >
                <Laptop className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-grow flex flex-col">
        {children}
      </main>

      {/* System Footer info */}
      <footer className="border-t border-border bg-card py-6 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground font-sans text-center sm:text-left">
            &copy; {new Date().getFullYear()} {APP_METADATA.title}. All security schemas, micro-tenant isolation protocols, and core routes locked.
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <AppWindow className="w-3.5 h-3.5" /> Frontend Core Active
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldAlert className="w-3.5 h-3.5" /> Stage 1.4 Verified
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
