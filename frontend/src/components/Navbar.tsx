import React from 'react';
import { LogOut, User, Settings, Database, Sparkles, Building2, Users, Shield, Palette } from 'lucide-react';
import { SessionData } from '../types';

interface NavbarProps {
  session: SessionData;
  activeTab: 'profile' | 'settings' | 'users' | 'rbac' | 'logs' | 'design';
  onChangeTab: (tab: 'profile' | 'settings' | 'users' | 'rbac' | 'logs' | 'design') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ session, activeTab, onChangeTab, onLogout }) => {
  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 sticky top-0 z-50 shadow-xs select-none transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* App Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 flex items-center justify-center text-white shadow-md">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-black text-gray-900 dark:text-slate-100 tracking-tight block">
              DairySphere <span className="text-teal-600 dark:text-teal-400 font-mono text-xs ml-0.5 font-bold">2.4</span>
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono font-bold block leading-none">
              COOPERATIVE MULTI-TENANCY
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onChangeTab('profile')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </button>

          <button
            onClick={() => onChangeTab('users')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Users
          </button>

          <button
            onClick={() => onChangeTab('rbac')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'rbac'
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" /> RBAC Matrix
          </button>
          
          <button
            onClick={() => onChangeTab('settings')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" /> Preferences
          </button>

          <button
            onClick={() => onChangeTab('logs')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'logs'
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" /> Audit Trails
          </button>

          <button
            onClick={() => onChangeTab('design')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'design'
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-850 dark:hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" /> Design System
          </button>
        </div>

        {/* User profile & actions */}
        <div className="flex items-center gap-4">
          {/* Resolved Business badge */}
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>{session.business.name}</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-gray-100 dark:border-slate-800">
              {session.business.slug}
            </span>
          </div>

          <div className="h-6 w-px bg-gray-100 dark:bg-slate-800" />

          {/* User Profile */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold text-xs select-none">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col">
              <span className="text-xs font-bold text-gray-800 dark:text-slate-200 leading-tight">{session.user.name}</span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-extrabold uppercase tracking-wider leading-none">
                {session.user.role || 'ADMIN'}
              </span>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={onLogout}
            title="Log Out of Session"
            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
