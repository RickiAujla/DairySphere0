import React, { useState } from 'react';
import { Building2, User, Settings, ShieldCheck, ArrowRight, ArrowLeft, Loader2, Sparkles, Check } from 'lucide-react';
import { api } from '../utils/api';
import { SessionData } from '../types';

interface BusinessSetupWizardProps {
  onSuccess: (session: SessionData) => void;
  onNavigateToLogin: () => void;
}

export const BusinessSetupWizard: React.FC<BusinessSetupWizardProps> = ({ onSuccess, onNavigateToLogin }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    theme: 'light',
    currency: 'INR',
    language: 'en',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-generate slug from name if user is editing the name
    if (name === 'name') {
      const suggestedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData(prev => ({
        ...prev,
        name: value,
        slug: suggestedSlug,
      }));
    } else if (name === 'slug') {
      const sanitizedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({
        ...prev,
        slug: sanitizedSlug,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    setError(null);
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.name.trim()) return 'Business name is required';
      if (!formData.slug.trim()) return 'Business slug is required';
      if (!/^[a-z0-9-]+$/.test(formData.slug)) return 'Slug can only contain lowercase letters, numbers, and dashes';
    } else if (step === 2) {
      if (!formData.adminName.trim()) return 'Admin name is required';
      if (!formData.adminEmail.trim()) return 'Admin email is required';
      if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) return 'Invalid email address format';
      if (!formData.adminPassword) return 'Password is required';
      if (formData.adminPassword.length < 8) return 'Password must be at least 8 characters long';
    }
    return null;
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fire registration request
      const session = await api.register({
        name: formData.name,
        slug: formData.slug,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
      });

      // 2. Fire preferences customization request
      localStorage.setItem('dairysphere_token', session.token);
      localStorage.setItem('dairysphere_business_id', session.business.id);

      await api.updatePreferences({
        theme: formData.theme,
        currency: formData.currency,
        language: formData.language,
      });

      // Success Callback
      onSuccess(session);
    } catch (err: any) {
      setError(err.message || 'Failed to register business. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Identity', icon: Building2 },
    { title: 'Credentials', icon: User },
    { title: 'Preferences', icon: Settings },
  ];

  return (
    <div className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-8 py-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
          <Building2 className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 text-teal-100 font-mono text-xs tracking-wider uppercase">
            <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
            Stage 2.3 • Multi-Tenant
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Register Your Cooperative</h1>
          <p className="text-teal-500 font-medium text-sm mt-1 text-slate-100">
            Create an isolated multi-tenant environment with dedicated schemas.
          </p>
        </div>
      </div>

      {/* Interactive Step Timeline Indicator */}
      <div className="px-8 pt-6 pb-2">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
          {steps.map((s, idx) => {
            const stepNum = idx + 1;
            const StepIcon = s.icon;
            const isCompleted = step > stepNum;
            const isActive = step === stepNum;

            return (
              <div key={s.title} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isActive
                      ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <span
                  className={`text-xs font-semibold mt-2 ${
                    isActive ? 'text-teal-600 font-bold' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* STEP 1: BUSINESS IDENTITY */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Business / Dairy Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Mother Dairy Cooperative"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tenant Slug (Subdomain identifier)
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="e.g., mother-dairy"
                  className="w-full pl-4 pr-32 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none font-mono text-sm"
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs select-none bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                  .dairysphere
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1.5 font-mono">
                Isolated Tenant Realm: https://{formData.slug || 'slug'}.dairysphere.com
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: CREDENTIALS */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Sovereign Administrator Name
              </label>
              <input
                type="text"
                name="adminName"
                value={formData.adminName}
                onChange={handleInputChange}
                placeholder="e.g., Rajesh Kumar"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Administrator Email
              </label>
              <input
                type="email"
                name="adminEmail"
                value={formData.adminEmail}
                onChange={handleInputChange}
                placeholder="rajesh@dairysphere.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="adminPassword"
                value={formData.adminPassword}
                onChange={handleInputChange}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none"
                required
              />
              <span className="text-xs text-gray-500 block mt-1.5">
                Must contain at least 8 characters. Secures tenant authorization.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: PREFERENCES */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Visual Theme
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, theme: 'light' }))}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${
                    formData.theme === 'light'
                      ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-gray-200 mb-2 flex items-center justify-center text-slate-800 text-xs font-bold">A</div>
                  <span className="text-sm font-semibold text-gray-700">Light Theme</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, theme: 'dark' }))}
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${
                    formData.theme === 'dark'
                      ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-900 mb-2 flex items-center justify-center text-teal-400 text-xs font-bold">A</div>
                  <span className="text-sm font-semibold text-gray-700">Dark Theme</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Default Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none bg-white text-sm"
                >
                  <option value="INR">INR (₹) - Rupees</option>
                  <option value="USD">USD ($) - Dollars</option>
                  <option value="EUR">EUR (€) - Euros</option>
                  <option value="GBP">GBP (£) - Pounds</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Language Preference
                </label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none bg-white text-sm"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिंदी)</option>
                  <option value="pb">Punjabi (ਪੰਜਾਬੀ)</option>
                  <option value="gu">Gujarati (ગુજરાતી)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800 leading-relaxed">
                <strong>ACID Isolated Sub-schema Configuration</strong>: Provisioning completes with custom settings, localized schemas, an audit logger, and administrative credentials.
              </div>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 mt-8 pt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              Have an account? Log in
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 text-sm font-extrabold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all disabled:opacity-60 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 font-sans"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Provisioning...
                </>
              ) : (
                <>
                  Launch Workspace <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
