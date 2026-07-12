import React, { useState } from 'react';
import { Lock, Mail, Loader2, LogIn, Sparkles, Building2 } from 'lucide-react';
import { api } from '../utils/api';
import { SessionData } from '../types';

interface LoginScreenProps {
  onSuccess: (session: SessionData) => void;
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onNavigateToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await api.login({ email, password });
      
      // Store session details in LocalStorage
      localStorage.setItem('dairysphere_token', session.token);
      localStorage.setItem('dairysphere_business_id', session.business.id);

      onSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
          <Building2 className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-teal-100 font-mono text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            DairySphere Platform
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Cooperative Login</h1>
          <p className="text-teal-500 font-medium text-sm mt-1 text-slate-100">
            Sign in to access your isolated multi-tenant dairy workspace.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Administrator Email
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-5 h-5" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="e.g., rajesh@dairysphere.com"
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none text-gray-700"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-5 h-5" />
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="••••••••••••"
              className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none text-gray-700"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-extrabold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all disabled:opacity-60 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Verifying Credentials...
            </>
          ) : (
            <>
              Log In to Tenant <LogIn className="w-5 h-5" />
            </>
          )}
        </button>

        <div className="text-center pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Don't have a workspace?{' '}
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="text-teal-600 font-bold hover:text-teal-700 transition-colors"
            >
              Register here
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
