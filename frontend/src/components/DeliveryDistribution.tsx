import React, { useState, useEffect } from 'react';
import { 
  Truck, Calendar, MapPin, Users, Settings, Plus, Edit, Trash2, CheckCircle, 
  XCircle, Play, Pause, AlertTriangle, RefreshCw, BarChart3, TrendingUp, 
  Search, ShieldAlert, FileText, ChevronRight, User, Phone, Check, Clock, Edit2
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { api } from '../utils/api';
import { useToast } from '../context/ToastProvider';
import { DeliveryRoute, DeliveryArea, CustomerSubscription, DeliveryLog } from '../types';

interface DeliveryDistributionProps {
  session: any;
}

export const DeliveryDistribution: React.FC<DeliveryDistributionProps> = ({ session }) => {
  const { showToast } = useToast();
  
  // Tabs: 'dashboard' | 'routes' | 'subscriptions' | 'operations' | 'reports'
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'routes' | 'subscriptions' | 'operations'>('dashboard');

  // Loaders
  const [loading, setLoading] = useState<boolean>(true);

  // Core States
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [areas, setAreas] = useState<DeliveryArea[]>([]);
  const [subscriptions, setSubscriptions] = useState<CustomerSubscription[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);

  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState<'MORNING' | 'EVENING'>('MORNING');
  const [selectedRouteFilter, setSelectedRouteFilter] = useState<string>('all');
  const [subscriptionSearch, setSubscriptionSearch] = useState<string>('');

  // Form Modals states
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<DeliveryRoute | null>(null);
  const [routeFormData, setRouteFormData] = useState({
    code: '', name: '', vehicleNumber: '', driverName: '', driverPhone: '', startLocation: '', endLocation: '', isActive: true
  });

  const [showAreaModal, setShowAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [areaFormData, setAreaFormData] = useState({
    routeId: '', name: '', zone: 'North Zone', pincode: ''
  });

  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState<CustomerSubscription | null>(null);
  const [subFormData, setSubFormData] = useState({
    customerId: '', productId: '', routeId: '', deliveryAreaId: '', frequency: 'DAILY' as any, quantity: 1, startDate: new Date().toISOString().split('T')[0]
  });

  const [showOneTimeModal, setShowOneTimeModal] = useState(false);
  const [oneTimeFormData, setOneTimeFormData] = useState({
    customerId: '', productId: '', routeId: '', quantity: 1, deliveryDate: new Date().toISOString().split('T')[0], shift: 'MORNING' as any, notes: ''
  });

  // Action status modals
  const [selectedLogForUpdate, setSelectedLogForUpdate] = useState<DeliveryLog | null>(null);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: 'DELIVERED' as any, deliveredQuantity: 1, returnedQuantity: 0, reason: '', notes: '', proofText: ''
  });

  // Master lists for dropdown references
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  const [optimizingRouteId, setOptimizingRouteId] = useState<string | null>(null);

  // Load entire core data
  const loadData = async () => {
    try {
      setLoading(true);
      const [rData, aData, sData, lData, custs, prods] = await Promise.all([
        api.getDeliveryRoutes(),
        api.getDeliveryAreas(),
        api.getCustomerSubscriptions(),
        api.getDeliveryLogs(selectedDate, selectedShift),
        api.getCustomers ? api.getCustomers() : Promise.resolve([]),
        api.getProducts ? api.getProducts() : Promise.resolve([])
      ]);

      setRoutes(rData);
      setAreas(aData);
      setSubscriptions(sData);
      setDeliveryLogs(lData);
      setAllCustomers(custs);
      setAllProducts(prods);
    } catch (error: any) {
      showToast(error?.message || 'Error loading logistical matrix', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedShift]);

  // Handle Route Optimization
  const handleOptimizeRoute = async (routeId: string) => {
    try {
      setOptimizingRouteId(routeId);
      const res = await api.optimizeRoute(routeId);
      showToast(res.message, 'success');
      // reload logs
      const updatedLogs = await api.getDeliveryLogs(selectedDate, selectedShift);
      setDeliveryLogs(updatedLogs);
    } catch (e: any) {
      showToast(e.message || 'Optimization routine failed', 'error');
    } finally {
      setOptimizingRouteId(null);
    }
  };

  // Create or Update Route
  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoute) {
        await api.updateDeliveryRoute(editingRoute.id, routeFormData);
        showToast(`Route ${editingRoute.code} updated successfully`, 'success');
      } else {
        await api.createDeliveryRoute(routeFormData);
        showToast(`Route ${routeFormData.code} created successfully`, 'success');
      }
      setShowRouteModal(false);
      setEditingRoute(null);
      // Reset form
      setRouteFormData({
        code: '', name: '', vehicleNumber: '', driverName: '', driverPhone: '', startLocation: '', endLocation: '', isActive: true
      });
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error saving route details', 'error');
    }
  };

  const handleEditRoute = (route: DeliveryRoute) => {
    setEditingRoute(route);
    setRouteFormData({
      code: route.code,
      name: route.name,
      vehicleNumber: route.vehicleNumber || '',
      driverName: route.driverName || '',
      driverPhone: route.driverPhone || '',
      startLocation: route.startLocation || '',
      endLocation: route.endLocation || '',
      isActive: route.isActive
    });
    setShowRouteModal(true);
  };

  // Create / Update / Delete Area
  const handleAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingArea) {
        await api.updateDeliveryArea(editingArea.id, areaFormData);
        showToast('Delivery Area routing updated', 'success');
      } else {
        await api.createDeliveryArea(areaFormData);
        showToast('Created new delivery area', 'success');
      }
      setShowAreaModal(false);
      setEditingArea(null);
      setAreaFormData({ routeId: '', name: '', zone: 'North Zone', pincode: '' });
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error routing delivery area', 'error');
    }
  };

  const handleEditArea = (area: DeliveryArea) => {
    setEditingArea(area);
    setAreaFormData({
      routeId: area.routeId,
      name: area.name,
      zone: area.zone,
      pincode: area.pincode
    });
    setShowAreaModal(true);
  };

  const handleDeleteArea = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this delivery area?')) return;
    try {
      await api.deleteDeliveryArea(id);
      showToast('Delivery area deleted', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Could not delete area', 'error');
    }
  };

  // Subscription Operations
  const handleSubscriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSub) {
        await api.updateCustomerSubscription(editingSub.id, subFormData);
        showToast('Customer subscription updated', 'success');
      } else {
        await api.createCustomerSubscription(subFormData);
        showToast('Customer subscription activated successfully!', 'success');
      }
      setShowSubModal(false);
      setEditingSub(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Subscription config failed', 'error');
    }
  };

  const handleToggleSubStatus = async (sub: CustomerSubscription, nextStatus: 'ACTIVE' | 'HOLD' | 'CANCELLED') => {
    try {
      const payload: any = { status: nextStatus };
      if (nextStatus === 'HOLD') {
        // Hold for next 3 days
        const start = new Date().toISOString().split('T')[0];
        const end = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split('T')[0];
        payload.holdStartDate = start;
        payload.holdEndDate = end;
        showToast(`Subscription paused temporarily until ${end}`, 'info');
      } else {
        payload.holdStartDate = '';
        payload.holdEndDate = '';
        showToast(`Subscription status configured to ${nextStatus}`, 'success');
      }

      await api.updateCustomerSubscription(sub.id, payload);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Status transition failed', 'error');
    }
  };

  // One Time Delivery Submit
  const handleOneTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createOneTimeDelivery(oneTimeFormData);
      showToast('One-time supplemental delivery order logged', 'success');
      setShowOneTimeModal(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error creating supplemental delivery', 'error');
    }
  };

  // Delivery status transition submit
  const handleStatusUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogForUpdate) return;
    try {
      await api.updateDeliveryLogStatus(selectedLogForUpdate.id, {
        status: statusUpdateForm.status,
        deliveredQuantity: statusUpdateForm.deliveredQuantity,
        returnedQuantity: statusUpdateForm.returnedQuantity,
        reason: statusUpdateForm.reason,
        notes: statusUpdateForm.notes,
        proofImage: statusUpdateForm.proofText ? `SignatureProof: ${statusUpdateForm.proofText}` : ''
      });
      showToast(`Log updated: ${selectedLogForUpdate.customerName} - ${statusUpdateForm.status}`, 'success');
      setSelectedLogForUpdate(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update delivery checklist', 'error');
    }
  };

  const initStatusUpdate = (log: DeliveryLog) => {
    setSelectedLogForUpdate(log);
    setStatusUpdateForm({
      status: 'DELIVERED',
      deliveredQuantity: log.quantity,
      returnedQuantity: 0,
      reason: '',
      notes: log.notes || '',
      proofText: ''
    });
  };

  // Filters for dynamic daily list
  const filteredLogs = deliveryLogs.filter(log => {
    if (selectedRouteFilter !== 'all' && log.routeId !== selectedRouteFilter) {
      return false;
    }
    return true;
  });

  // Subscription filters
  const filteredSubscriptions = subscriptions.filter(sub => {
    if (!subscriptionSearch) return true;
    const term = subscriptionSearch.toLowerCase();
    return sub.customerName.toLowerCase().includes(term) || 
           sub.productName.toLowerCase().includes(term) ||
           (sub.customerPhone && sub.customerPhone.includes(term));
  });

  // Calculate analytics summaries
  const pendingCount = deliveryLogs.filter(l => l.status === 'PENDING').length;
  const deliveredCount = deliveryLogs.filter(l => l.status === 'DELIVERED' || l.status === 'PARTIALLY_DELIVERED').length;
  const failedCount = deliveryLogs.filter(l => l.status === 'FAILED').length;

  const totalQuantityExpected = deliveryLogs.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalQuantityDelivered = deliveryLogs.reduce((acc, curr) => acc + (curr.deliveredQuantity || 0), 0);

  // Recharts Chart Data
  const routeFulfillmentData = routes.map(r => {
    const routeLogs = deliveryLogs.filter(l => l.routeId === r.id);
    const delivered = routeLogs.filter(l => l.status === 'DELIVERED' || l.status === 'PARTIALLY_DELIVERED').length;
    const failed = routeLogs.filter(l => l.status === 'FAILED').length;
    const pending = routeLogs.filter(l => l.status === 'PENDING').length;

    return {
      name: r.code,
      Delivered: delivered,
      Failed: failed,
      Pending: pending
    };
  });

  const frequencyBreakdown = [
    { name: 'Daily', value: subscriptions.filter(s => s.frequency === 'DAILY').length },
    { name: 'Alt Days', value: subscriptions.filter(s => s.frequency === 'ALTERNATE_DAYS').length },
    { name: 'Weekly', value: subscriptions.filter(s => s.frequency === 'WEEKLY').length },
    { name: 'Monthly', value: subscriptions.filter(s => s.frequency === 'MONTHLY').length }
  ].filter(item => item.value > 0);

  const COLORS = ['#0d9488', '#06b6d4', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* 1. Header Presentation panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 rounded-full text-[10px] font-black text-teal-800 dark:text-teal-400 uppercase tracking-widest">
            <Truck className="w-3.5 h-3.5 animate-pulse" />
            Distribution Logistics Core
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-155 tracking-tight uppercase leading-none">
            Delivery & Distribution Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed font-semibold">
            Route configuration, delivery optimization, and customer-automated milk subscription fulfillment algorithms.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              activeSubTab === 'dashboard' 
                ? 'bg-teal-550 text-white shadow-xs dark:bg-teal-600' 
                : 'text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveSubTab('operations')}
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              activeSubTab === 'operations' 
                ? 'bg-teal-550 text-white shadow-xs dark:bg-teal-600' 
                : 'text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Daily Runs
          </button>
          <button
            onClick={() => setActiveSubTab('subscriptions')}
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              activeSubTab === 'subscriptions' 
                ? 'bg-teal-550 text-white shadow-xs dark:bg-teal-600' 
                : 'text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Subscriptions
          </button>
          <button
            onClick={() => setActiveSubTab('routes')}
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
              activeSubTab === 'routes' 
                ? 'bg-teal-550 text-white shadow-xs dark:bg-teal-600' 
                : 'text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Routes & Zones
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80">
          <RefreshCw className="w-10 h-10 text-teal-600 animate-spin" />
          <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-4">Loading fleet matrix state...</p>
        </div>
      ) : (
        <>
          {/* =======================================================
              TAB 1: DASHBOARD & ANALYTICS
              ======================================================= */}
          {activeSubTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Telemetry metrics cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Core Fleet Routes</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-slate-155">{routes.length}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">Active lines</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Active Subscriptions</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-slate-155">{subscriptions.filter(s => s.status === 'ACTIVE').length}</span>
                    <span className="text-xs text-amber-500 font-bold">{subscriptions.filter(s => s.status === 'HOLD').length} paused</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Fulfillment Run Status</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-teal-600 dark:text-teal-400">
                      {Math.round(((deliveredCount + failedCount) / (deliveryLogs.length || 1)) * 100)}%
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{deliveredCount} of {deliveryLogs.length} done</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-2">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Delivered Volume Today</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-slate-155">{totalQuantityDelivered}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">of {totalQuantityExpected} units</span>
                  </div>
                </div>
              </div>

              {/* Graphical Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4 lg:col-span-2">
                  <h3 className="text-xs font-black text-slate-950 dark:text-slate-205 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    Route-Wise Delivery Distribution Logs
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={routeFulfillmentData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                        <Bar dataKey="Delivered" fill="#0d9488" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-black text-slate-950 dark:text-slate-205 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    Frequency Breakdown
                  </h3>
                  {frequencyBreakdown.length > 0 ? (
                    <div className="h-44 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={frequencyBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {frequencyBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-44 flex items-center justify-center text-slate-400 text-xs font-semibold">No subscriptions logged.</div>
                  )}

                  <div className="space-y-2">
                    {frequencyBreakdown.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-[10px] font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
                        </div>
                        <span className="text-slate-950 dark:text-slate-105">{item.value} Customers</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pending alerts list */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                  <h3 className="text-xs font-black text-slate-950 dark:text-slate-205 uppercase tracking-widest flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Failed or Returned Drops Today
                  </h3>
                  <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-450 rounded-full text-[9px] font-extrabold uppercase tracking-wider">{failedCount} Drops</span>
                </div>

                {deliveryLogs.filter(l => l.status === 'FAILED').length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 font-semibold uppercase tracking-wider">Excellent! Zero delivery failures logged today.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {deliveryLogs.filter(l => l.status === 'FAILED').map(log => (
                      <div key={log.id} className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/40 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-[11px] font-black text-slate-900 dark:text-slate-205">{log.customerName}</div>
                          <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{log.productName} (Qty: {log.quantity})</div>
                          <div className="text-[9px] text-rose-700 dark:text-rose-400 font-semibold italic">Reason: {log.reason || 'Not specified'}</div>
                        </div>
                        <span className="text-[8px] font-mono font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 px-2 py-0.5 rounded-lg">{log.routeName?.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =======================================================
              TAB 2: DAILY RUNS & OPERATIONS
              ======================================================= */}
          {activeSubTab === 'operations' && (
            <div className="space-y-6">
              {/* Filter and Command Strip */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Date Pick */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Delivery Date</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  {/* Shift Selection */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Fulfillment Shift</span>
                    <select
                      value={selectedShift}
                      onChange={(e: any) => setSelectedShift(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="MORNING">Morning Shift (Milk Drop)</option>
                      <option value="EVENING">Evening Shift (Dairy Products)</option>
                    </select>
                  </div>

                  {/* Route Filter */}
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Filter Route</span>
                    <select
                      value={selectedRouteFilter}
                      onChange={(e) => setSelectedRouteFilter(e.target.value)}
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="all">All Delivery Routes</option>
                      {routes.map(r => (
                        <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end">
                  {/* supplemental order */}
                  <button
                    onClick={() => setShowOneTimeModal(true)}
                    className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Supplemental Delivery
                  </button>
                </div>
              </div>

              {/* Optimize fleet trigger summary bar */}
              {selectedRouteFilter !== 'all' && (
                <div className="bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 p-4 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-600/10 text-teal-600 flex items-center justify-center">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-slate-950 dark:text-slate-205 uppercase tracking-wide leading-tight">
                        Route Optimization Algorithms Available
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Sort delivery sequencing dynamically to minimize transit routes.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOptimizeRoute(selectedRouteFilter)}
                    disabled={optimizingRouteId === selectedRouteFilter}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${optimizingRouteId === selectedRouteFilter ? 'animate-spin' : ''}`} />
                    Optimize Sequence
                  </button>
                </div>
              )}

              {/* Master daily run table layout */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-950 dark:text-slate-205 uppercase tracking-widest">
                    Daily Delivery Run Sheet ({filteredLogs.length} drops)
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full" /> {pendingCount} Pending</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-full" /> {deliveredCount} Fulfilled</span>
                  </div>
                </div>

                {filteredLogs.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <Truck className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No scheduled drops for this date & shift combination.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-850 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-5 py-3">Customer & Drop location</th>
                          <th className="px-5 py-3">Assigned Route / Driver</th>
                          <th className="px-5 py-3">Catalog Item</th>
                          <th className="px-5 py-3 text-right">Fulfillment Qty</th>
                          <th className="px-5 py-3 text-right">Total Charge</th>
                          <th className="px-5 py-3">Log Status</th>
                          <th className="px-5 py-3 text-right">Entry actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                        {filteredLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 text-[11px] font-bold">
                            <td className="px-5 py-3.5">
                              <div className="font-extrabold text-slate-900 dark:text-slate-205">{log.customerName}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{log.customerPhone || 'No contact phone'}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="text-slate-700 dark:text-slate-300">{log.routeName?.split(' - ')[1]}</div>
                              <div className="text-[9px] text-slate-400 font-semibold">Driver: {log.driverName}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="text-slate-800 dark:text-slate-205">{log.productName}</div>
                              <span className="text-[8px] font-mono uppercase bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded">
                                {log.type}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right text-slate-900 dark:text-slate-105">
                              {log.deliveredQuantity !== undefined ? log.deliveredQuantity : log.quantity} of {log.quantity}
                            </td>
                            <td className="px-5 py-3.5 text-right text-teal-600 dark:text-teal-400 font-extrabold">
                              Rs. {log.totalAmount.toFixed(2)}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                                log.status === 'PENDING' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                                log.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450' :
                                log.status === 'PARTIALLY_DELIVERED' ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400' :
                                'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450'
                              }`}>
                                {log.status}
                              </span>
                              {log.reason && (
                                <div className="text-[8px] text-rose-600 font-bold max-w-[120px] truncate">{log.reason}</div>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <button
                                onClick={() => initStatusUpdate(log)}
                                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                              >
                                Update Status
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =======================================================
              TAB 3: SUBSCRIPTION PORTAL
              ======================================================= */}
          {activeSubTab === 'subscriptions' && (
            <div className="space-y-6">
              {/* Search and configuration filters */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={subscriptionSearch}
                    onChange={(e) => setSubscriptionSearch(e.target.value)}
                    placeholder="Search by customer name, phone or product..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingSub(null);
                    setSubFormData({
                      customerId: allCustomers[0]?.id || '',
                      productId: allProducts[0]?.id || '',
                      routeId: routes[0]?.id || '',
                      deliveryAreaId: areas[0]?.id || '',
                      frequency: 'DAILY',
                      quantity: 1,
                      startDate: new Date().toISOString().split('T')[0]
                    });
                    setShowSubModal(true);
                  }}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Subscription
                </button>
              </div>

              {/* Subscriptions Grid cards */}
              {filteredSubscriptions.length === 0 ? (
                <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <Users className="w-12 h-12 text-slate-300 mx-auto animate-bounce-slow" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No matching customer subscriptions found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSubscriptions.map(sub => (
                    <div key={sub.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-5 space-y-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
                      {/* status banner */}
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                          sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          sub.status === 'HOLD' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {sub.status}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 font-extrabold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded">
                          {sub.frequency}
                        </span>
                      </div>

                      {/* Customer Details */}
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 dark:text-slate-155">{sub.customerName}</h4>
                        {sub.customerPhone && (
                          <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {sub.customerPhone}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-semibold">
                          <MapPin className="w-3 h-3 text-teal-600" />
                          {sub.routeName || 'No Route'}
                        </div>
                      </div>

                      {/* Product details */}
                      <div className="p-3 bg-slate-55/40 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-black text-slate-805 dark:text-slate-205">{sub.productName}</div>
                          <div className="text-[8px] text-slate-400 font-semibold font-mono">Rate: Rs. {sub.price}/{sub.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-slate-900 dark:text-slate-105">{sub.quantity} {sub.unit}</div>
                          <div className="text-[9px] text-teal-600 font-extrabold">Rs. {(sub.quantity * sub.price).toFixed(2)} / drop</div>
                        </div>
                      </div>

                      {sub.status === 'HOLD' && sub.holdEndDate && (
                        <div className="text-[9px] bg-amber-500/10 text-amber-700 dark:text-amber-400 p-2 rounded-xl border border-amber-500/20 text-center font-bold">
                          Paused until {sub.holdEndDate}
                        </div>
                      )}

                      {/* Sub footer controls */}
                      <div className="border-t border-slate-100 dark:border-slate-850 pt-3 flex items-center justify-between gap-2">
                        <span className="text-[8px] text-slate-400 font-semibold">Start: {sub.startDate}</span>
                        <div className="flex items-center gap-1">
                          {sub.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleToggleSubStatus(sub, 'HOLD')}
                              className="p-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                              title="Pause temporary"
                            >
                              <Pause className="w-3 h-3" /> Pause
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleSubStatus(sub, 'ACTIVE')}
                              className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-450 rounded-lg text-[9px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3 h-3" /> Resume
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingSub(sub);
                              setSubFormData({
                                customerId: sub.customerId,
                                productId: sub.productId,
                                routeId: sub.routeId,
                                deliveryAreaId: sub.deliveryAreaId,
                                frequency: sub.frequency,
                                quantity: sub.quantity,
                                startDate: sub.startDate
                              });
                              setShowSubModal(true);
                            }}
                            className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-655 dark:text-slate-205 transition cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =======================================================
              TAB 4: ROUTES & AREAS
              ======================================================= */}
          {activeSubTab === 'routes' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 columns: Routes list */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-950 dark:text-slate-205 uppercase tracking-widest">
                      Active Delivery Fleet Routes
                    </h3>
                    <button
                      onClick={() => {
                        setEditingRoute(null);
                        setRouteFormData({ code: '', name: '', vehicleNumber: '', driverName: '', driverPhone: '', startLocation: '', endLocation: '', isActive: true });
                        setShowRouteModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Create Route
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-850">
                    {routes.map(r => (
                      <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-55/20 dark:hover:bg-slate-850/20">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 dark:text-slate-105 uppercase tracking-tight">{r.code} - {r.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider ${
                              r.isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-405 dark:bg-slate-800 dark:text-slate-500'
                            }`}>{r.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <div>Driver: <span className="font-extrabold text-slate-800 dark:text-slate-205">{r.driverName || 'N/A'}</span></div>
                            <div>Vehicle: <span className="font-mono text-slate-800 dark:text-slate-205">{r.vehicleNumber || 'N/A'}</span></div>
                            <div>Phone: <span className="font-mono text-slate-800 dark:text-slate-205">{r.driverPhone || 'N/A'}</span></div>
                            <div>Areas: <span className="text-teal-600 dark:text-teal-400 font-extrabold">{areas.filter(a => a.routeId === r.id).length} zones</span></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          <button
                            onClick={() => handleEditRoute(r)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column: Zone / Area Mapping */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-950 dark:text-slate-205 uppercase tracking-widest">
                      Routing Sectors & Areas
                    </h3>
                    <button
                      onClick={() => {
                        setEditingArea(null);
                        setAreaFormData({ routeId: routes[0]?.id || '', name: '', zone: 'North Zone', pincode: '' });
                        setShowAreaModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-teal-650 hover:bg-teal-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Sector
                    </button>
                  </div>

                  {areas.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-semibold">No area routing configured.</div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-850">
                      {areas.map(a => (
                        <div key={a.id} className="p-4 flex items-center justify-between hover:bg-slate-55/20 dark:hover:bg-slate-850/20">
                          <div className="space-y-0.5">
                            <div className="text-[11px] font-black text-slate-905 dark:text-slate-155">{a.name}</div>
                            <div className="text-[9px] text-slate-400 font-bold">{a.zone} • {a.pincode}</div>
                            <div className="text-[8px] bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-400 px-1.5 py-0.5 rounded inline-block font-black">
                              Route: {a.routeName?.split(' - ')[1] || 'Unassigned'}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditArea(a)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-750 rounded transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteArea(a.id)}
                              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 rounded transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* =======================================================
          MODAL: CREATE / EDIT ROUTE
          ======================================================= */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-sm font-black text-slate-905 dark:text-slate-155 uppercase tracking-widest">
                {editingRoute ? 'Edit Delivery Route Code' : 'Configure New Fleet Route'}
              </h3>
              <button onClick={() => setShowRouteModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRouteSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Route Identifier Code</label>
                  <input
                    type="text"
                    value={routeFormData.code}
                    onChange={(e) => setRouteFormData({ ...routeFormData, code: e.target.value })}
                    required
                    placeholder="e.g. R-EAST-02"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Route Visual Name</label>
                  <input
                    type="text"
                    value={routeFormData.name}
                    onChange={(e) => setRouteFormData({ ...routeFormData, name: e.target.value })}
                    required
                    placeholder="e.g. Model Town Sector II"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Driver Name</label>
                  <input
                    type="text"
                    value={routeFormData.driverName}
                    onChange={(e) => setRouteFormData({ ...routeFormData, driverName: e.target.value })}
                    placeholder="Karan Singh"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Driver Phone Number</label>
                  <input
                    type="text"
                    value={routeFormData.driverPhone}
                    onChange={(e) => setRouteFormData({ ...routeFormData, driverPhone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Vehicle Fleet Number</label>
                  <input
                    type="text"
                    value={routeFormData.vehicleNumber}
                    onChange={(e) => setRouteFormData({ ...routeFormData, vehicleNumber: e.target.value })}
                    placeholder="PB-02-AX-8821"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Route Transit status</label>
                  <select
                    value={routeFormData.isActive ? 'true' : 'false'}
                    onChange={(e) => setRouteFormData({ ...routeFormData, isActive: e.target.value === 'true' })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="true">Active Operational Route</option>
                    <option value="false">Suspended / Inactive</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRouteModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-305 text-[10px] font-black uppercase tracking-wider rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition"
                >
                  Save Route Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: CREATE / EDIT AREA
          ======================================================= */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-sm font-black text-slate-905 dark:text-slate-155 uppercase tracking-widest">
                {editingArea ? 'Configure Sector Boundaries' : 'Add Sector Area To Route'}
              </h3>
              <button onClick={() => setShowAreaModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAreaSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Sector / Location Name</label>
                <input
                  type="text"
                  value={areaFormData.name}
                  onChange={(e) => setAreaFormData({ ...areaFormData, name: e.target.value })}
                  required
                  placeholder="e.g. Civil Lines Block A"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Geographic Zone</label>
                  <select
                    value={areaFormData.zone}
                    onChange={(e) => setAreaFormData({ ...areaFormData, zone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="North Zone">North Zone</option>
                    <option value="South Zone">South Zone</option>
                    <option value="East Zone">East Zone</option>
                    <option value="West Zone">West Zone</option>
                    <option value="Central Zone">Central Zone</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Pincode</label>
                  <input
                    type="text"
                    value={areaFormData.pincode}
                    onChange={(e) => setAreaFormData({ ...areaFormData, pincode: e.target.value })}
                    placeholder="143001"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Assign Operational Route</label>
                <select
                  value={areaFormData.routeId}
                  onChange={(e) => setAreaFormData({ ...areaFormData, routeId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select Route</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAreaModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-305 text-[10px] font-black uppercase tracking-wider rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition"
                >
                  Save Sector Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: NEW / EDIT SUBSCRIPTION
          ======================================================= */}
      {showSubModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-sm font-black text-slate-905 dark:text-slate-155 uppercase tracking-widest">
                {editingSub ? 'Modify Subscription Options' : 'Configure Auto-Subscription'}
              </h3>
              <button onClick={() => setShowSubModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubscriptionSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Choose Customer</label>
                  <select
                    value={subFormData.customerId}
                    onChange={(e) => setSubFormData({ ...subFormData, customerId: e.target.value })}
                    required
                    disabled={!!editingSub}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select customer...</option>
                    {allCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Milk Product Catalog</label>
                  <select
                    value={subFormData.productId}
                    onChange={(e) => setSubFormData({ ...subFormData, productId: e.target.value })}
                    required
                    disabled={!!editingSub}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select milk item...</option>
                    {allProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Rs. {p.price})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Transport Route</label>
                  <select
                    value={subFormData.routeId}
                    onChange={(e) => setSubFormData({ ...subFormData, routeId: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select route...</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Sector / Sector Zone</label>
                  <select
                    value={subFormData.deliveryAreaId}
                    onChange={(e) => setSubFormData({ ...subFormData, deliveryAreaId: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select drop zone...</option>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.pincode})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Fulfillment Frequency</label>
                  <select
                    value={subFormData.frequency}
                    onChange={(e) => setSubFormData({ ...subFormData, frequency: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="DAILY">Daily (Deliver morning shift daily)</option>
                    <option value="ALTERNATE_DAYS">Alternate Days (Every 48 hours)</option>
                    <option value="WEEKLY">Weekly Drops (Once a week bulk)</option>
                    <option value="MONTHLY">Monthly (Bulk drop monthly)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Drop Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={subFormData.quantity}
                    onChange={(e) => setSubFormData({ ...subFormData, quantity: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Fulfillment Commences</label>
                <input
                  type="date"
                  value={subFormData.startDate}
                  onChange={(e) => setSubFormData({ ...subFormData, startDate: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-305 text-[10px] font-black uppercase tracking-wider rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition"
                >
                  Activate Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: SUPPLEMENTAL / ONE TIME DELIVERY
          ======================================================= */}
      {showOneTimeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-sm font-black text-slate-905 dark:text-slate-155 uppercase tracking-widest">
                Supplemental Delivery Request
              </h3>
              <button onClick={() => setShowOneTimeModal(false)} className="text-slate-400 hover:text-slate-650">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOneTimeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Choose Customer</label>
                <select
                  value={oneTimeFormData.customerId}
                  onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, customerId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select customer...</option>
                  {allCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Product Catalog</label>
                  <select
                    value={oneTimeFormData.productId}
                    onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, productId: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Select item...</option>
                    {allProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (Rs. {p.price})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={oneTimeFormData.quantity}
                    onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, quantity: Number(e.target.value) })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Target Delivery Date</label>
                  <input
                    type="date"
                    value={oneTimeFormData.deliveryDate}
                    onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, deliveryDate: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Fulfillment Shift</label>
                  <select
                    value={oneTimeFormData.shift}
                    onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, shift: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="MORNING">Morning Shift</option>
                    <option value="EVENING">Evening Shift</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Assign Operational Route</label>
                <select
                  value={oneTimeFormData.routeId}
                  onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, routeId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select Route</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.code} - {r.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Special Delivery Notes</label>
                <textarea
                  value={oneTimeFormData.notes}
                  onChange={(e) => setOneTimeFormData({ ...oneTimeFormData, notes: e.target.value })}
                  placeholder="Leave at front porch inside cooler..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 h-16"
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOneTimeModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-305 text-[10px] font-black uppercase tracking-wider rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-650 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition animate-pulse-slow"
                >
                  Schedule Delivery Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL: UPDATE DELIVERY RUN STATUS & PROOF
          ======================================================= */}
      {selectedLogForUpdate && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
              <h3 className="text-sm font-black text-slate-905 dark:text-slate-155 uppercase tracking-widest">
                Fulfillment Entry: {selectedLogForUpdate.customerName}
              </h3>
              <button onClick={() => setSelectedLogForUpdate(null)} className="text-slate-400 hover:text-slate-650">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStatusUpdateSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Expected Quantity</div>
                  <div className="text-sm font-black text-slate-900 dark:text-slate-105">{selectedLogForUpdate.quantity} units of {selectedLogForUpdate.productName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Value</div>
                  <div className="text-sm font-black text-teal-600 dark:text-teal-400">Rs. {selectedLogForUpdate.totalAmount.toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Select Log Status</label>
                <select
                  value={statusUpdateForm.status}
                  onChange={(e) => {
                    const status = e.target.value as any;
                    setStatusUpdateForm({
                      ...statusUpdateForm,
                      status,
                      deliveredQuantity: status === 'FAILED' ? 0 : selectedLogForUpdate.quantity,
                      returnedQuantity: status === 'FAILED' ? selectedLogForUpdate.quantity : 0
                    });
                  }}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="DELIVERED">Delivered (Fulfillment Complete)</option>
                  <option value="PARTIALLY_DELIVERED">Partially Delivered</option>
                  <option value="FAILED">Failed / Refused Drop</option>
                </select>
              </div>

              {statusUpdateForm.status === 'PARTIALLY_DELIVERED' && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-1">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Actual Delivered Qty</label>
                    <input
                      type="number"
                      min="0"
                      max={selectedLogForUpdate.quantity}
                      value={statusUpdateForm.deliveredQuantity}
                      onChange={(e) => {
                        const del = Number(e.target.value);
                        setStatusUpdateForm({
                          ...statusUpdateForm,
                          deliveredQuantity: del,
                          returnedQuantity: Math.max(0, selectedLogForUpdate.quantity - del)
                        });
                      }}
                      required
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Returned Quantity</label>
                    <input
                      type="number"
                      readOnly
                      value={statusUpdateForm.returnedQuantity}
                      className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold font-mono text-slate-500"
                    />
                  </div>
                </div>
              )}

              {statusUpdateForm.status === 'FAILED' && (
                <div className="space-y-1 animate-in slide-in-from-top-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Failure Reason Code</label>
                  <select
                    value={statusUpdateForm.reason}
                    onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, reason: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="">Choose reason...</option>
                    <option value="Gate Locked / No Access">Gate Locked / No Access</option>
                    <option value="Customer Refused Order">Customer Refused Order</option>
                    <option value="Defective Packings / Spilled">Defective Packings / Spilled</option>
                    <option value="Vehicle Break Down">Vehicle Break Down</option>
                    <option value="Incorrect Address Route">Incorrect Address Route</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Proof of Handover (Driver Signature Initials)</label>
                <input
                  type="text"
                  value={statusUpdateForm.proofText}
                  onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, proofText: e.target.value })}
                  placeholder="Type customer or driver initials as secure foundation..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Delivery Notes / Remarks</label>
                <textarea
                  value={statusUpdateForm.notes}
                  onChange={(e) => setStatusUpdateForm({ ...statusUpdateForm, notes: e.target.value })}
                  placeholder="Drop left with guard cabin..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-500 h-16"
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-850 pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLogForUpdate(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-305 text-[10px] font-black uppercase tracking-wider rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition"
                >
                  Verify Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
