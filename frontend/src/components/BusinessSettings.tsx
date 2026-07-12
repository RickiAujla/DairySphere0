import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Settings, CheckCircle2, AlertCircle, Loader2, Save, HelpCircle, Shield, Globe } from 'lucide-react';

export const BusinessSettings: React.FC = () => {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    currency: 'INR',
    language: 'en',
    timezone: 'Asia/Kolkata',
  });

  const [taxRate, setTaxRate] = useState('0.00');
  const [subscriptionPlan, setSubscriptionPlan] = useState('ENTERPRISE_GROWTH');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await api.getSettings();
        setPreferences({
          theme: settings.theme || 'light',
          currency: settings.currency || 'INR',
          language: settings.language || 'en',
          timezone: settings.timezone || 'Asia/Kolkata',
        });
        setTaxRate(settings.tax_rate_percent || '0.00');
        setSubscriptionPlan(settings.subscription_plan || 'ENTERPRISE_GROWTH');
      } catch (err: any) {
        setMessage({ text: 'Failed to load configurations.', type: 'error' });
      } finally {
        setFetching(false);
      }
    }
    loadSettings();
  }, []);

  const handlePreferenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 1. Save UI preferences
      await api.updatePreferences(preferences);

      // 2. Save Custom settings
      await api.updateSettings({
        tax_rate_percent: taxRate,
        subscription_plan: subscriptionPlan,
      });

      setMessage({ text: 'System settings & tenant configurations updated successfully.', type: 'success' });
      
      // Dynamically apply visual theme to root body if changed
      if (preferences.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update system settings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
        <span className="text-sm text-gray-500 mt-4 font-semibold">Loading Tenant Settings Database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Settings Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="border-b border-gray-100 pb-5">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            Cooperative Settings & Preferences
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure default settings, UI themes, tax configurations, and system-wide default preferences.
          </p>
        </div>

        {message && (
          <div
            className={`mt-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-100 text-emerald-800'
                : 'bg-rose-50 border border-rose-100 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8 mt-6">
          {/* Section 1: Regional preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-l-2 border-teal-600 pl-2">
              Regional & UI Configurations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Visual Theme
                </label>
                <select
                  name="theme"
                  value={preferences.theme}
                  onChange={handlePreferenceChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none bg-white text-sm"
                >
                  <option value="light">Light Theme (Default Slate)</option>
                  <option value="dark">Dark Theme (Cosmic Slate)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Currency Symbol
                </label>
                <select
                  name="currency"
                  value={preferences.currency}
                  onChange={handlePreferenceChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none bg-white text-sm"
                >
                  <option value="INR">Indian Rupee (INR - ₹)</option>
                  <option value="USD">US Dollar (USD - $)</option>
                  <option value="EUR">Euro (EUR - €)</option>
                  <option value="GBP">British Pound (GBP - £)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Default Language
                </label>
                <select
                  name="language"
                  value={preferences.language}
                  onChange={handlePreferenceChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none bg-white text-sm"
                >
                  <option value="en">English (US/UK)</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="pb">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="gu">Gujarati (ગુજરાતી)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={preferences.timezone}
                  onChange={handlePreferenceChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none bg-white text-sm"
                >
                  <option value="Asia/Kolkata">Kolkata (IST - UTC+05:30)</option>
                  <option value="America/New_York">New York (EST - UTC-05:00)</option>
                  <option value="Europe/London">London (GMT - UTC+00:00)</option>
                  <option value="Asia/Singapore">Singapore (SGT - UTC+08:00)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Business & System Parameters */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 border-l-2 border-teal-600 pl-2">
              Billing & Cooperative Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Local Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none text-gray-700"
                />
                <span className="text-xs text-gray-500 block mt-1">
                  Applicable GST/VAT percentage for walk-in transactions and automatic billing.
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Subscription Tier level
                </label>
                <select
                  value={subscriptionPlan}
                  onChange={(e) => setSubscriptionPlan(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none bg-white text-sm font-mono text-xs"
                >
                  <option value="COMMUNITY_FREE">COMMUNITY_FREE (Limit: 5 farmers)</option>
                  <option value="COOPERATIVE_STANDARD">COOPERATIVE_STANDARD (Limit: 100 farmers)</option>
                  <option value="ENTERPRISE_GROWTH">ENTERPRISE_GROWTH (Unlimited farmers, full SLA)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving System Settings...
                </>
              ) : (
                <>
                  Save Configuration <Save className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Card: Subscription and Multi-tenant Limits */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 flex gap-4">
          <Shield className="w-10 h-10 text-teal-600 shrink-0" />
          <div className="space-y-2">
            <h4 className="text-base font-bold text-slate-900">Tenant Sandbox Protection</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every data entity created under this session utilizes high-efficiency database-level indexes on <code>businessId</code>. No raw queries can leak or view other tenant spaces, guaranteeing enterprise-grade secure isolation boundaries.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-100 p-6 flex gap-4">
          <Globe className="w-10 h-10 text-teal-600 shrink-0" />
          <div className="space-y-2">
            <h4 className="text-base font-bold text-slate-900">Subscription SLA Structure</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your tenant is currently bound to the <strong>{subscriptionPlan.replace('_', ' ')}</strong> subscription. This allocates real-time backup clusters, high-frequency geocoding processing limits, and isolated analytical indexing instances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
