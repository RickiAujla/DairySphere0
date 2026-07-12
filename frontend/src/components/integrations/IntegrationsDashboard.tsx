import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  Settings, 
  Database, 
  RefreshCw, 
  Lock, 
  Server, 
  FileText, 
  Globe, 
  Send, 
  Check, 
  Trash2, 
  ShieldCheck, 
  Play, 
  FileCode,
  Layers, 
  CreditCard, 
  Mail, 
  MessageSquare, 
  CloudLightning, 
  Plus, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { api } from '../../utils/api';

interface IntegrationConfig {
  id: string;
  provider: string;
  name: string;
  category: 'PAYMENTS' | 'COMMUNICATION' | 'STORAGE' | 'ACCOUNTING' | 'AUTH';
  enabled: boolean;
  credentials: Record<string, string>;
  lastTestedAt?: string;
  status: 'ACTIVE' | 'ERROR' | 'UNCONFIGURED';
}

interface WebhookSubscription {
  id: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
}

interface WebhookDeliveryLog {
  id: string;
  subscriptionId: string;
  event: string;
  payload: string;
  statusCode?: number;
  responseBody?: string;
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING';
  retryCount: number;
  nextAttemptAt?: string;
  createdAt: string;
}

interface IntegrationLog {
  id: string;
  provider: string;
  action: string;
  status: 'SUCCESS' | 'FAILED';
  message: string;
  durationMs: number;
  timestamp: string;
}

export function IntegrationsDashboard() {
  const [activeTab, setActiveTab] = useState<'providers' | 'webhooks' | 'logs' | 'playground'>('providers');
  const [configs, setConfigs] = useState<IntegrationConfig[]>([]);
  const [subs, setSubs] = useState<WebhookSubscription[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryLog[]>([]);
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal/Configuration State
  const [selectedConfig, setSelectedConfig] = useState<IntegrationConfig | null>(null);
  const [configCredentials, setConfigCredentials] = useState<Record<string, string>>({});
  const [configEnabled, setConfigEnabled] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // New Subscription Modal
  const [isNewSubModalOpen, setIsNewSubModalOpen] = useState(false);
  const [newSubUrl, setNewSubUrl] = useState('');
  const [newSubEvents, setNewSubEvents] = useState<string[]>(['milk.collected']);

  // Playground State
  const [paymentProvider, setPaymentProvider] = useState<'STRIPE' | 'RAZORPAY' | 'CASHFREE'>('STRIPE');
  const [paymentAmount, setPaymentAmount] = useState(1500);
  const [paymentCustomerId, setPaymentCustomerId] = useState('farmer-901');
  const [paymentStatus, setPaymentStatus] = useState<any>(null);

  const [notifProvider, setNotifProvider] = useState<'SMTP' | 'TWILIO' | 'FIREBASE_PUSH' | 'WHATSAPP'>('SMTP');
  const [notifRecipient, setNotifRecipient] = useState('olvskolclips@gmail.com');
  const [notifSubject, setNotifSubject] = useState('Milk Delivery Notification');
  const [notifMessage, setNotifMessage] = useState('Your milk collection invoice has been dispatched successfully.');
  const [notifStatus, setNotifStatus] = useState<any>(null);

  const [storageProvider, setStorageProvider] = useState<'S3' | 'GCS' | 'AZURE_BLOB'>('S3');
  const [storageFileName, setStorageFileName] = useState('invoice_export_2026.pdf');
  const [storageContent, setStorageContent] = useState('DairySphere Cooperative System Invoice Exports Raw Hex Log');
  const [storageStatus, setStorageStatus] = useState<any>(null);

  // Test Verification Log
  const [testLog, setTestLog] = useState<{ provider: string; loading: boolean; response?: string } | null>(null);

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedConfigs, fetchedSubs, fetchedDeliveries, fetchedLogs] = await Promise.all([
        api.getIntegrationsConfigs(),
        api.getWebhookSubscriptions(),
        api.getWebhookDeliveries(),
        api.getIntegrationLogs(),
      ]);
      setConfigs(fetchedConfigs);
      setSubs(fetchedSubs);
      setDeliveries(fetchedDeliveries);
      setIntegrationLogs(fetchedLogs);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch integrations data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTestPing = async (provider: string) => {
    setTestLog({ provider, loading: true });
    try {
      const res = await api.testIntegration(provider);
      setTestLog({ provider, loading: false, response: res.response || 'Success.' });
      showToast(`Handshake with ${provider} returned status code 200.`);
      loadData();
    } catch (err: any) {
      setTestLog({ provider, loading: false, response: `HANDSHAKE_CRASH: ${err.message}` });
      showToast(`Connection to ${provider} failed.`, 'error');
    }
  };

  const handleConfigureClick = (cfg: IntegrationConfig) => {
    setSelectedConfig(cfg);
    // Prepare blank keys to protect current passwords
    const blankCreds: Record<string, string> = {};
    for (const k of Object.keys(cfg.credentials)) {
      blankCreds[k] = '';
    }
    setConfigCredentials(blankCreds);
    setConfigEnabled(cfg.enabled);
  };

  const handleSaveConfig = async () => {
    if (!selectedConfig) return;
    setIsSavingConfig(true);
    try {
      // Filter out unchanged empty fields
      const credsToSend: Record<string, string> = {};
      for (const k of Object.keys(configCredentials)) {
        if (configCredentials[k] !== '') {
          credsToSend[k] = configCredentials[k];
        }
      }
      await api.configureIntegration(selectedConfig.provider, credsToSend, configEnabled);
      showToast(`${selectedConfig.provider} credentials securely encrypted and saved.`);
      setSelectedConfig(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update credentials', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCreateWebhook = async () => {
    if (!newSubUrl) return;
    try {
      await api.createWebhookSubscription({ url: newSubUrl, events: newSubEvents });
      showToast('New webhook subscription established.');
      setIsNewSubModalOpen(false);
      setNewSubUrl('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to register webhook endpoint', 'error');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      try {
        await api.deleteWebhookSubscription(id);
        showToast('Webhook listener removed.');
        loadData();
      } catch (err: any) {
        showToast(err.message || 'Delete operation failed', 'error');
      }
    }
  };

  const handleToggleWebhook = async (sub: WebhookSubscription) => {
    try {
      await api.updateWebhookSubscription(sub.id, { enabled: !sub.enabled });
      showToast(`Webhook endpoint ${sub.enabled ? 'paused' : 'activated'}.`);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Toggle failed', 'error');
    }
  };

  // PLAYGROUND RUNNERS

  const runPaymentDemo = async () => {
    setPaymentStatus({ loading: true });
    try {
      const res = await api.triggerPayment({
        provider: paymentProvider,
        amount: paymentAmount,
        currency: 'INR',
        customerId: paymentCustomerId,
      });
      setPaymentStatus({ success: true, ...res });
      showToast('Transaction settled via direct clearing network.');
      loadData();
    } catch (err: any) {
      setPaymentStatus({ success: false, error: err.message });
      showToast('Transaction routing rejected.', 'error');
    }
  };

  const runNotificationDemo = async () => {
    setNotifStatus({ loading: true });
    try {
      const res = await api.sendNotification({
        provider: notifProvider,
        recipient: notifRecipient,
        subject: notifSubject,
        message: notifMessage,
      });
      setNotifStatus({ success: true, ...res });
      showToast('Message dispatched safely.');
      loadData();
    } catch (err: any) {
      setNotifStatus({ success: false, error: err.message });
      showToast('Message delivery failed.', 'error');
    }
  };

  const runStorageDemo = async () => {
    setStorageStatus({ loading: true });
    try {
      const res = await api.uploadFile({
        provider: storageProvider,
        fileName: storageFileName,
        content: storageContent,
      });
      setStorageStatus({ success: true, ...res });
      showToast('Document securely synchronized.');
      loadData();
    } catch (err: any) {
      setStorageStatus({ success: false, error: err.message });
      showToast('Cloud upload failed.', 'error');
    }
  };

  const toggleEventSelection = (ev: string) => {
    if (newSubEvents.includes(ev)) {
      setNewSubEvents(newSubEvents.filter(x => x !== ev));
    } else {
      setNewSubEvents([...newSubEvents, ev]);
    }
  };

  return (
    <div id="third-party-integrations-root" className="space-y-6">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm max-w-md ${
              toast.type === 'error' 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            {toast.type === 'error' ? <XCircle className="w-4 h-4 shrink-0 text-red-600" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-600" />}
            <span className="font-semibold">{toast.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Third-Party Integrations</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Register secret API credentials, subscribe client systems to outgoing Webhook events, and execute test transactions on payment gateways, cloud backup buckets, and email gateways.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
          Synchronize Integrations
        </button>
      </div>

      {/* Dashboard Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${
            activeTab === 'providers' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Server className="w-4 h-4" />
          API Provider Registry ({configs.length})
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${
            activeTab === 'webhooks' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Globe className="w-4 h-4" />
          Webhooks Engine ({subs.length})
        </button>
        <button
          onClick={() => setActiveTab('playground')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${
            activeTab === 'playground' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Play className="w-4 h-4" />
          Integration Playground
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${
            activeTab === 'logs' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Trace &amp; Delivery Logs
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4 font-medium">Assembling integration configs and webhook delivery traces...</p>
        </div>
      ) : (
        <div>
          {/* TAB 1: PROVIDERS REGISTRY */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              
              {testLog && (
                <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between text-gray-400 border-b border-slate-800 pb-1.5">
                    <span>GATEWAY HANDSHAKE TEST CONSOLE: {testLog.provider}</span>
                    <button onClick={() => setTestLog(null)} className="text-gray-400 hover:text-white">✕ Close</button>
                  </div>
                  {testLog.loading ? (
                    <div className="flex items-center gap-2 py-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending secure ping payload to API gateway endpoints...</span>
                    </div>
                  ) : (
                    <div className="py-2 whitespace-pre-wrap leading-relaxed">
                      {testLog.response}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {configs.map((cfg) => (
                  <div key={cfg.id} className="bg-white rounded-xl border border-gray-100 shadow-xs p-5 flex flex-col justify-between hover:border-indigo-100 transition">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 block">{cfg.category}</span>
                          <h4 className="font-bold text-gray-950 tracking-tight text-base mt-0.5">{cfg.name}</h4>
                        </div>
                        <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full ${
                          cfg.status === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : cfg.status === 'ERROR'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          {cfg.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Configuration Status:</span>
                          <span className="font-semibold text-gray-800">{cfg.enabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono">
                          {Object.keys(cfg.credentials).map(k => (
                            <div key={k} className="flex justify-between">
                              <span className="text-gray-400">{k}:</span>
                              <span className="text-gray-700 font-medium">{cfg.credentials[k] || 'NOT_SET'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-50 pt-3.5 mt-5">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {cfg.lastTestedAt ? `Tested: ${new Date(cfg.lastTestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Never tested'}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleConfigureClick(cfg)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-lg transition"
                          title="Configure Credentials"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTestPing(cfg.provider)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition"
                        >
                          <Play className="w-3 h-3 fill-indigo-700" />
                          Ping Test
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: WEBHOOKS ENGINE */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Secure Webhook Signatures Activated
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    All outgoing events carry an HMAC SHA256 signature in the <code className="bg-white px-1 py-0.5 rounded border">X-DairySphere-Signature</code> header.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewSubModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-sm transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Register Endpoint
                </button>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-xs divide-y divide-gray-100">
                {subs.length === 0 ? (
                  <div className="p-12 text-center">
                    <Globe className="w-8 h-8 text-gray-300 mx-auto" />
                    <p className="text-sm font-semibold text-gray-500 mt-4">No Webhook subscriptions registered</p>
                    <p className="text-xs text-gray-400 mt-1">Register external APIs or iPaaS links (like Zapier/Make) to trigger real-time syncs.</p>
                  </div>
                ) : (
                  subs.map((sub) => (
                    <div key={sub.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs font-bold font-mono text-gray-400">[{sub.id}]</code>
                          <span className="font-bold text-gray-950 text-sm truncate max-w-md">{sub.url}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            sub.enabled 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                              : 'bg-gray-50 text-gray-400 border-gray-200'
                          }`}>
                            {sub.enabled ? 'ACTIVE' : 'PAUSED'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs flex-wrap">
                          <span className="text-gray-400">Events:</span>
                          <div className="flex gap-1 flex-wrap">
                            {sub.events.map(ev => (
                              <span key={ev} className="bg-gray-50 text-gray-600 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border border-gray-100">
                                {ev}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-gray-400">
                          Secret Token: <code className="bg-gray-50 px-1 py-0.5 rounded border font-semibold">{sub.secret}</code>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleWebhook(sub)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                            sub.enabled 
                              ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200' 
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100'
                          }`}
                        >
                          {sub.enabled ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteWebhook(sub.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition"
                          title="Delete Webhook"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PLAYGROUND */}
          {activeTab === 'playground' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Box 1: Payments Clearing */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                    <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <CreditCard className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-gray-950 text-sm">Payments Gateway Emulator</h3>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Select Gateway</label>
                      <select
                        value={paymentProvider}
                        onChange={(e) => setPaymentProvider(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-xs focus:outline-none"
                      >
                        <option value="STRIPE">Stripe International</option>
                        <option value="RAZORPAY">Razorpay India</option>
                        <option value="CASHFREE">Cashfree Payouts</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Transaction Amount (INR)</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-700 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Associated Client ID</label>
                      <input
                        type="text"
                        value={paymentCustomerId}
                        onChange={(e) => setPaymentCustomerId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-700 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 space-y-3">
                  {paymentStatus && (
                    <div className={`p-3 rounded-lg text-xs font-mono border ${
                      paymentStatus.loading 
                        ? 'bg-amber-50 text-amber-800 border-amber-100' 
                        : paymentStatus.success 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                        : 'bg-red-50 text-red-800 border-red-100'
                    }`}>
                      {paymentStatus.loading ? (
                        <span>Settling payout with standard gateway authorization flow...</span>
                      ) : paymentStatus.success ? (
                        <div className="space-y-1">
                          <span className="font-bold">STATUS: CHARGED_SETTLED</span>
                          <div className="text-[10px]">TXID: {paymentStatus.transactionId}</div>
                          <div className="text-[10px]">Webhook &apos;invoice.paid&apos; fired.</div>
                        </div>
                      ) : (
                        <span>REJECTED: {paymentStatus.error}</span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={runPaymentDemo}
                    disabled={paymentStatus?.loading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Process Gateway Charge
                  </button>
                </div>
              </div>

              {/* Box 2: Messages & Reminders */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <Mail className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-gray-950 text-sm">Unified Communication Dispatcher</h3>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Message Channel</label>
                      <select
                        value={notifProvider}
                        onChange={(e) => setNotifProvider(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-xs focus:outline-none"
                      >
                        <option value="SMTP">SMTP Email</option>
                        <option value="TWILIO">Twilio SMS</option>
                        <option value="FIREBASE_PUSH">Firebase Push Alerts</option>
                        <option value="WHATSAPP">WhatsApp Business API</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Recipient Reference</label>
                      <input
                        type="text"
                        value={notifRecipient}
                        onChange={(e) => setNotifRecipient(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-700 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Alert Title / Subject</label>
                      <input
                        type="text"
                        value={notifSubject}
                        onChange={(e) => setNotifSubject(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-700 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Raw Message Payload</label>
                      <textarea
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                        className="w-full h-16 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-700 focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 space-y-3">
                  {notifStatus && (
                    <div className={`p-3 rounded-lg text-xs font-mono border ${
                      notifStatus.loading 
                        ? 'bg-amber-50 text-amber-800 border-amber-100' 
                        : notifStatus.success 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                        : 'bg-red-50 text-red-800 border-red-100'
                    }`}>
                      {notifStatus.loading ? (
                        <span>Dispatching physical message envelope across carrier grids...</span>
                      ) : notifStatus.success ? (
                        <div className="space-y-1">
                          <span className="font-bold">STATUS: DISPATCH_SUCCESS</span>
                          <div className="text-[10px]">Ref: ya29.oauth_status_ok</div>
                        </div>
                      ) : (
                        <span>DISPATCH_ERROR: {notifStatus.error}</span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={runNotificationDemo}
                    disabled={notifStatus?.loading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Transmit Notification
                  </button>
                </div>
              </div>

              {/* Box 3: Cloud Vault */}
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                    <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                      <Database className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-gray-950 text-sm">Cloud Vault Sync (Cold Backups)</h3>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Cloud Storage API</label>
                      <select
                        value={storageProvider}
                        onChange={(e) => setStorageProvider(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-xs focus:outline-none"
                      >
                        <option value="S3">Amazon S3 Storage</option>
                        <option value="GCS">Google Cloud Storage</option>
                        <option value="AZURE_BLOB">Azure Blob Containers</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Target Path filename</label>
                      <input
                        type="text"
                        value={storageFileName}
                        onChange={(e) => setStorageFileName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-700 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500">Data Stream content</label>
                      <textarea
                        value={storageContent}
                        onChange={(e) => setStorageContent(e.target.value)}
                        className="w-full h-24 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs text-gray-700 focus:outline-none resize-none font-mono text-[10px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 space-y-3">
                  {storageStatus && (
                    <div className={`p-3 rounded-lg text-xs font-mono border ${
                      storageStatus.loading 
                        ? 'bg-amber-50 text-amber-800 border-amber-100' 
                        : storageStatus.success 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                        : 'bg-red-50 text-red-800 border-red-100'
                    }`}>
                      {storageStatus.loading ? (
                        <span>Packaging payload for cloud multipart PUT upload...</span>
                      ) : storageStatus.success ? (
                        <div className="space-y-1">
                          <span className="font-bold">STATUS: STORAGE_UPLOADED</span>
                          <div className="text-[10px] break-all">URL: {storageStatus.remoteUrl}</div>
                        </div>
                      ) : (
                        <span>UPLOAD_FAILED: {storageStatus.error}</span>
                      )}
                    </div>
                  )}

                  <button
                    onClick={runStorageDemo}
                    disabled={storageStatus?.loading}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Synchronize Cloud Asset
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: TRACE & DELIVERY LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Outgoing Webhook Delivery Retry Queue</h4>
                </div>
                <div className="divide-y divide-gray-100">
                  {deliveries.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      No webhook event deliveries tracked yet.
                    </div>
                  ) : (
                    deliveries.map(item => (
                      <div key={item.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/40 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-gray-400">[{item.id}]</span>
                            <span className="font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[10px]">{item.event}</span>
                            <span className="text-gray-500 truncate max-w-xs">to sub ID: {item.subscriptionId}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 flex items-center gap-3">
                            <span>Dispatched: {new Date(item.createdAt).toLocaleTimeString()}</span>
                            <span>Retries: {item.retryCount}/3</span>
                            {item.nextAttemptAt && <span className="text-amber-600 font-semibold">Next Retry: {new Date(item.nextAttemptAt).toLocaleTimeString()}</span>}
                          </div>
                          <div className="bg-gray-50 p-2 rounded border border-gray-100 font-mono text-[10px] text-gray-600 max-w-xl truncate">
                            Payload: {item.payload}
                          </div>
                        </div>

                        <div className="text-right space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                            item.status === 'SUCCESS' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-red-50 text-red-700'
                          }`}>
                            {item.status === 'SUCCESS' ? 'DELIVERED_200' : 'DELIVERY_FAILED'}
                          </span>
                          <div className="text-[10px] text-gray-400 font-mono">
                            Remote Response: {item.responseBody || 'None'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">External API Handshake Audits</h4>
                </div>
                <div className="divide-y divide-gray-100 text-xs">
                  {integrationLogs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      No external API handshake audits tracked yet.
                    </div>
                  ) : (
                    integrationLogs.map(log => (
                      <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/40">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 font-mono text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded">{log.provider}</span>
                            <span className="font-semibold text-gray-900">{log.action}</span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{log.message}</p>
                          <span className="text-[10px] text-gray-400 block">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-mono text-gray-700 text-xs">{log.durationMs}ms</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CONFIGURE CREDENTIALS */}
      <AnimatePresence>
        {selectedConfig && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-950">Credential Safe Lock</h3>
                <p className="text-xs text-gray-400 mt-1">Configure credentials for provider: &quot;{selectedConfig.name}&quot;</p>
              </div>

              <div className="p-6 space-y-4 text-sm">
                
                <div className="space-y-1 bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-100 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Existing secret credentials are hidden to ensure strict SOC2/GDPR tenant isolation compliance. Leave fields empty if you do not want to alter them.</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-gray-50">
                  <span className="font-semibold text-gray-700">Enable Provider State</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configEnabled}
                      onChange={(e) => setConfigEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {Object.keys(configCredentials).map(key => (
                  <div key={key} className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">{key}</label>
                    <input
                      type="text"
                      value={configCredentials[key]}
                      onChange={(e) => setConfigCredentials({ ...configCredentials, [key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none"
                      placeholder={`Enter secret ${key}`}
                    />
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedConfig(null)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={isSavingConfig}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white font-semibold rounded-lg text-xs transition shadow-xs"
                >
                  {isSavingConfig ? 'Enrolling...' : 'Register Securely'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: REGISTER WEBHOOK ENDPOINT */}
      <AnimatePresence>
        {isNewSubModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-md w-full overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-950">Add Webhook Receiver URL</h3>
                <p className="text-xs text-gray-400 mt-1">DairySphere event dispatcher will push notifications immediately.</p>
              </div>

              <div className="p-6 space-y-4 text-sm">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-500">Destination Endpoint URL</label>
                  <input
                    type="url"
                    value={newSubUrl}
                    onChange={(e) => setNewSubUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none font-mono"
                    placeholder="https://your-api.com/webhooks"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-500">Subscribed Operations Events</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['milk.collected', 'invoice.paid', 'payment.failed', 'user.registered'].map(ev => (
                      <label key={ev} className="flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 cursor-pointer text-xs font-mono font-medium">
                        <input
                          type="checkbox"
                          checked={newSubEvents.includes(ev)}
                          onChange={() => toggleEventSelection(ev)}
                          className="rounded text-indigo-600 border-gray-300"
                        />
                        <span>{ev}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsNewSubModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 font-semibold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateWebhook}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs transition shadow-xs"
                >
                  Verify &amp; Activate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
