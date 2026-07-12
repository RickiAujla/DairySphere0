import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Business } from '../types';
import { Save, Calendar, Globe, ClipboardList, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface BusinessProfileProps {
  business: Business;
  onRefreshBusiness: (name: string) => void;
}

export const BusinessProfile: React.FC<BusinessProfileProps> = ({ business, onRefreshBusiness }) => {
  const [name, setName] = useState(business.name);
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setName(business.name);
    // Fetch settings to check if logo is configured
    api.getSettings().then(settings => {
      if (settings.logo_url) {
        setLogoUrl(settings.logo_url);
      }
    }).catch(() => {});
  }, [business]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ text: 'Business name is required.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const updated = await api.updateProfile({ name, logoUrl });
      onRefreshBusiness(updated.name);
      setMessage({ text: 'Business profile successfully saved and audited.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 animate-fade-in">
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-teal-600" />
          Tenant Profile Details
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your enterprise identities, cooperative naming configurations, and custom assets.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Cooperative Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none text-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tenant Domain Slug (Immutable)
            </label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 select-none">
              <Globe className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <span className="font-mono text-sm text-gray-500">{business.slug}</span>
              <span className="font-mono text-xs text-gray-400 ml-auto bg-white px-2 py-0.5 border border-gray-100 rounded-md">
                .dairysphere
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Brand Logo URL (Optional)
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none text-gray-700 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Date Provisioned
            </label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 select-none">
              <Calendar className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">
                {new Date(business.createdAt).toLocaleDateString(undefined, {
                  dateStyle: 'long',
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all disabled:opacity-50 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                Save Profile <Save className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
