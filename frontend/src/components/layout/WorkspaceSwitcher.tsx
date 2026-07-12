import React, { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, Check, Plus, Landmark, Award, ShieldAlert } from 'lucide-react';
import { SessionData } from '../../types';

interface WorkspaceSwitcherProps {
  session: SessionData;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ session }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sisterCooperatives = [
    { name: session.business.name, slug: session.business.slug, active: true },
    { name: 'Valley Creamery Association', slug: 'valley-creamery', active: false },
    { name: 'Apex Dairy Cooperatives', slug: 'apex-dairy', active: false },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-800 text-left transition select-none w-full max-w-[220px]"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm shadow-teal-500/20">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-extrabold text-gray-900 dark:text-slate-100 uppercase tracking-tight truncate block">
              {session.business.name}
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold text-teal-600 dark:text-teal-400 block truncate uppercase tracking-widest leading-none mt-0.5">
            {session.business.slug}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in-50 slide-in-from-top-1">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1.5">
            <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block">Active Tenant Context</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Landmark className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-[10px] font-bold text-teal-800 dark:text-teal-400">Schema-Isolated Environment</span>
            </div>
          </div>

          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {sisterCooperatives.map((coop) => (
              <button
                key={coop.slug}
                disabled={!coop.active}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                  coop.active
                    ? 'bg-teal-50/50 dark:bg-teal-950/20 text-slate-850 dark:text-slate-200'
                    : 'opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-500 cursor-not-allowed'
                }`}
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-bold block truncate">{coop.name}</span>
                  <span className="text-[8px] font-mono text-slate-400 block truncate uppercase">{coop.slug}.dairysphere.com</span>
                </div>
                {coop.active ? (
                  <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" title="Cross-Tenant Lock" />
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 mt-1.5 pt-1.5">
            <button
              onClick={() => {
                alert('In DairySphere, adding external schemas is disabled. Contact your cluster administrator.');
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-[10px] font-bold text-teal-600 hover:bg-teal-50/40 dark:text-teal-400 dark:hover:bg-teal-950/20 transition uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" />
              Onboard Sibling Tenant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
