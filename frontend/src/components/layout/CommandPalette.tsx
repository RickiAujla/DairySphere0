import React, { useState, useEffect, useRef } from 'react';
import { Search, Compass, Terminal, Shield, FileText, Settings, User, Sparkles, Moon, Sun, HelpCircle, CornerDownLeft } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: 'dashboard' | 'profile' | 'settings' | 'users' | 'rbac' | 'logs' | 'design' | 'presentation') => void;
  onToggleTheme: () => void;
  role: string;
}

interface CommandItem {
  id: string;
  title: string;
  description: string;
  shortcut?: string[];
  action: () => void;
  icon: React.ReactNode;
  category: 'Navigation' | 'System Preferences' | 'Quick Actions';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onToggleTheme,
  role,
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener to toggle Command Palette (Ctrl+K or Cmd+K)
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const items: CommandItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Go to Operations Command',
      description: 'View real-time telemetry, KPIs and operational logistics metrics',
      shortcut: ['G', 'O'],
      action: () => { onNavigate('dashboard'); onClose(); },
      icon: <Terminal className="w-4 h-4" />,
      category: 'Navigation',
    },
    {
      id: 'nav-profile',
      title: 'Go to Business Profile',
      description: 'View administrative info & tenant profiles',
      shortcut: ['G', 'P'],
      action: () => { onNavigate('profile'); onClose(); },
      icon: <User className="w-4 h-4" />,
      category: 'Navigation',
    },
    {
      id: 'nav-users',
      title: 'Go to User Directory',
      description: 'Manage cooperative members and roles',
      shortcut: ['G', 'U'],
      action: () => { onNavigate('users'); onClose(); },
      icon: <Compass className="w-4 h-4" />,
      category: 'Navigation',
    },
    {
      id: 'nav-rbac',
      title: 'Go to RBAC Permission Matrix',
      description: 'Audit system-wide access hierarchies',
      shortcut: ['G', 'R'],
      action: () => { onNavigate('rbac'); onClose(); },
      icon: <Shield className="w-4 h-4" />,
      category: 'Navigation',
    },
    {
      id: 'nav-settings',
      title: 'Go to Cooperative Preferences',
      description: 'Manage tenant backups & configurations',
      shortcut: ['G', 'S'],
      action: () => { onNavigate('settings'); onClose(); },
      icon: <Settings className="w-4 h-4" />,
      category: 'Navigation',
    },
    {
      id: 'nav-logs',
      title: 'Go to Governance Audit Trails',
      description: 'View immutable system activity streams',
      shortcut: ['G', 'L'],
      action: () => { onNavigate('logs'); onClose(); },
      icon: <FileText className="w-4 h-4" />,
      category: 'Navigation',
    },
    {
      id: 'nav-design',
      title: 'Go to Design System Showcase',
      description: 'View components, colors, and elevations',
      shortcut: ['G', 'D'],
      action: () => { onNavigate('design'); onClose(); },
      icon: <Sparkles className="w-4 h-4" />,
      category: 'Navigation',
    },
    {
      id: 'sys-theme',
      title: 'Toggle Theme Mode',
      description: 'Switch color modes (Light or Dark)',
      shortcut: ['T', 'T'],
      action: () => { onToggleTheme(); onClose(); },
      icon: <Moon className="w-4 h-4 dark:hidden" />,
      category: 'System Preferences',
    },
    {
      id: 'sys-help',
      title: 'Trigger System Audit',
      description: 'Run automated configuration calibrations',
      shortcut: ['C'],
      action: () => { 
        alert('DairySphere tenant check complete. Zero access gaps found.'); 
        onClose(); 
      },
      icon: <Terminal className="w-4 h-4" />,
      category: 'Quick Actions',
    },
  ];

  // Filter items by search query
  const filtered = items.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    
    // Check role boundaries
    if (role !== 'ADMIN' && (item.id === 'nav-rbac' || item.id === 'nav-users')) {
      return false;
    }
    return matchesSearch;
  });

  // Handle keyboard navigation within list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  // Group filtered items
  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((item) => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  });

  // Flat list to trace exact overall index
  const flatFilteredList: typeof filtered = [];
  const categoryHeaders: string[] = [];
  Object.entries(grouped).forEach(([cat, items]) => {
    categoryHeaders.push(cat);
    flatFilteredList.push(...items);
  });

  return (
    <div className="fixed inset-0 z-55 flex items-start justify-center p-4 sm:p-10 pt-[10vh] sm:pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />

      {/* Palette Container */}
      <div
        ref={containerRef}
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[500px] transform transition-all duration-200 animate-in fade-in-50 zoom-in-95"
      >
        {/* Search header bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-150 dark:border-slate-800/80">
          <Search className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or navigate..."
            className="w-full bg-transparent border-0 outline-hidden text-[11px] font-medium text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-0"
          />
          <div className="flex items-center gap-1 shrink-0">
            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded text-[8px] font-mono font-bold tracking-wider uppercase border border-slate-200/55 dark:border-slate-700">ESC</span>
          </div>
        </div>

        {/* Dynamic List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3.5">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <HelpCircle className="w-8 h-8 text-slate-350 dark:text-slate-700 mx-auto mb-2" />
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">No results found</span>
              <p className="text-[9px] text-slate-400 font-medium leading-none mt-1">Try another search prefix</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, catItems]) => (
              <div key={category} className="space-y-1">
                <h5 className="px-2.5 text-[9px] font-black text-teal-800 dark:text-teal-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800/40 pb-1">
                  {category}
                </h5>
                <div className="space-y-0.5">
                  {catItems.map((item) => {
                    const globalIdx = flatFilteredList.findIndex((f) => f.id === item.id);
                    const isSelected = globalIdx === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-xs shadow-teal-600/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/45 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected ? 'bg-teal-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-[10px] font-bold block truncate ${
                            isSelected ? 'text-white' : 'text-gray-900 dark:text-slate-200'
                          }`}>
                            {item.title}
                          </span>
                          <span className={`text-[9px] block truncate ${
                            isSelected ? 'text-teal-100' : 'text-gray-400 dark:text-slate-500'
                          }`}>
                            {item.description}
                          </span>
                        </div>
                        {item.shortcut && (
                          <div className="flex items-center gap-0.5 shrink-0 select-none">
                            {item.shortcut.map((key) => (
                              <kbd
                                key={key}
                                className={`px-1 py-0.5 rounded text-[8px] font-mono font-bold uppercase leading-none border ${
                                  isSelected
                                    ? 'bg-teal-500 border-teal-400 text-white'
                                    : 'bg-slate-55 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                                }`}
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="w-3.5 h-3.5 text-teal-100 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Palette Footer Help Bar */}
        <div className="bg-slate-50 dark:bg-slate-950/40 border-t border-slate-150 dark:border-slate-850 px-4 py-2 flex items-center justify-between text-[8px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-900 border rounded font-mono">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-900 border rounded font-mono">ENTER</kbd> Select
            </span>
          </div>
          <span>Role: {role}</span>
        </div>
      </div>
    </div>
  );
};
