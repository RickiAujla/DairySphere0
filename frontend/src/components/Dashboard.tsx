import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, Users, ShoppingBag, 
  Layers, Bell, CheckSquare, Package, RefreshCw, AlertCircle, Calendar, 
  ArrowUpRight, Percent, Truck, FileText, Plus, Award, Sparkles, Clock, 
  ArrowRight, ShieldCheck, CreditCard, ChevronRight, CheckCircle2, UserCheck, Inbox, Play,
  Shield, Lock
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useTheme } from '../context/ThemeProvider';
import { SessionData } from '../types';

// Recharts Imports
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, Legend, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';

// Define Interface for query params
interface DashboardParams {
  startDate?: string;
  endDate?: string;
  range: 'today' | '7days' | '30days' | '12months';
}

// Helper to construct headers
const getHeaders = () => {
  const token = localStorage.getItem('dairysphere_token');
  const tenantId = localStorage.getItem('dairysphere_business_id');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }
  return headers;
};

interface DashboardProps {
  session: SessionData;
}

export const Dashboard: React.FC<DashboardProps> = ({ session }) => {
  const { showToast } = useToast();
  const { theme } = useTheme();
  const [range, setRange] = useState<'today' | '7days' | '30days' | '12months'>('30days');
  const [apiStatus, setApiStatus] = useState<'connecting' | 'live' | 'fallback'>('connecting');

  // Custom Fetch helper with robust staging fallback
  const fetchWithFallback = async (endpoint: string, fallbackData: any) => {
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: getHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success) {
          setTimeout(() => setApiStatus('live'), 0);
          return json.data;
        }
      }
    } catch (err) {
      // Fall back to mock on network/auth error during local staging development
    }
    setTimeout(() => {
      setApiStatus(prev => prev === 'live' ? 'live' : 'fallback');
    }, 0);
    // Simulate network delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 300));
    return fallbackData;
  };

  // Compute dates based on range
  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    if (range === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (range === '7days') {
      start.setDate(end.getDate() - 7);
    } else if (range === '30days') {
      start.setDate(end.getDate() - 30);
    } else if (range === '12months') {
      start.setDate(end.getDate() - 365);
    }
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const { startDate, endDate } = getDateRange();

  // ==========================================
  // FALLBACK STAGING DATA DEFINITIONS
  // ==========================================
  const fallbackKpi = {
    revenue: { current: 1542300, previous: 1320000, growth: 16.84 },
    milkCollected: { current: 48500, previous: 44200, growth: 9.72 },
    activeCustomers: { current: 524, previous: 480, growth: 9.16 },
    lowStockCount: 3,
    pendingDeliveries: 12,
    orderCount: { current: 1240, previous: 1080, growth: 14.81 }
  };

  const fallbackRevenueChart = [
    { date: '07-06', productRevenue: 12000, milkRevenue: 28000, totalRevenue: 40000 },
    { date: '07-07', productRevenue: 14000, milkRevenue: 31000, totalRevenue: 45000 },
    { date: '07-08', productRevenue: 11000, milkRevenue: 29000, totalRevenue: 40000 },
    { date: '07-09', productRevenue: 18000, milkRevenue: 34000, totalRevenue: 52000 },
    { date: '07-10', productRevenue: 15000, milkRevenue: 32000, totalRevenue: 47000 },
    { date: '07-11', productRevenue: 19000, milkRevenue: 36000, totalRevenue: 55000 },
    { date: '07-12', productRevenue: 22000, milkRevenue: 38000, totalRevenue: 60000 },
  ];

  const fallbackSalesTrend = [
    { date: '07-06', milkLiters: 1200 },
    { date: '07-07', milkLiters: 1250 },
    { date: '07-08', milkLiters: 1180 },
    { date: '07-09', milkLiters: 1310 },
    { date: '07-10', milkLiters: 1290 },
    { date: '07-11', milkLiters: 1350 },
    { date: '07-12', milkLiters: 1400 },
  ];

  const fallbackCustomerGrowth = [
    { date: '07-06', newCustomers: 3, cumulativeCustomers: 502 },
    { date: '07-07', newCustomers: 4, cumulativeCustomers: 506 },
    { date: '07-08', newCustomers: 2, cumulativeCustomers: 508 },
    { date: '07-09', newCustomers: 6, cumulativeCustomers: 514 },
    { date: '07-10', newCustomers: 3, cumulativeCustomers: 517 },
    { date: '07-11', newCustomers: 5, cumulativeCustomers: 522 },
    { date: '07-12', newCustomers: 2, cumulativeCustomers: 524 },
  ];

  const fallbackProductDistribution = [
    { category: 'Raw Buffalo Milk', quantity: 2400, revenue: 144000 },
    { category: 'Pasteurized Pouches', quantity: 1800, revenue: 99000 },
    { category: 'Organic Butter', quantity: 350, revenue: 87500 },
    { category: 'Artisanal Cheese', quantity: 180, revenue: 72000 },
    { category: 'Probiotic Curd', quantity: 950, revenue: 38000 },
  ];

  const fallbackOrderTrend = [
    { date: '07-06', totalOrders: 42, completedOrders: 38, cancelledOrders: 2 },
    { date: '07-07', totalOrders: 48, completedOrders: 45, cancelledOrders: 1 },
    { date: '07-08', totalOrders: 39, completedOrders: 36, cancelledOrders: 0 },
    { date: '07-09', totalOrders: 55, completedOrders: 50, cancelledOrders: 3 },
    { date: '07-10', totalOrders: 46, completedOrders: 42, cancelledOrders: 1 },
    { date: '07-11', totalOrders: 52, completedOrders: 48, cancelledOrders: 2 },
    { date: '07-12', totalOrders: 60, completedOrders: 55, cancelledOrders: 1 },
  ];

  const fallbackPaymentTrend = [
    { method: 'UPI / NetBanking', amount: 985000, transactionCount: 840 },
    { method: 'Bank Transfer (NEFT)', amount: 380000, transactionCount: 45 },
    { method: 'Credit Card', amount: 125000, transactionCount: 110 },
    { method: 'Cash on Delivery', amount: 52300, transactionCount: 245 },
  ];

  const fallbackPendingTasks = {
    pendingOrders: [
      { id: 'o-1', description: 'Order from Greenfield Cooperative', amount: 12500, createdAt: new Date().toISOString() },
      { id: 'o-2', description: 'Bulk Milk Supply - Mother Dairy', amount: 84000, createdAt: new Date().toISOString() },
      { id: 'o-3', description: 'Cheese assortments for FoodCorp', amount: 7200, createdAt: new Date().toISOString() },
    ],
    lowStockAlerts: [
      { id: 's-1', productName: 'TetraPack Pasteurized Milk 1L', sku: 'TP-MILK-1L', currentStock: 45, minAlert: 200 },
      { id: 's-2', productName: 'Table Butter salted 500g', sku: 'BUTTER-500G', currentStock: 12, minAlert: 50 },
    ],
    overdueInvoices: [
      { id: 'inv-1', invoiceNumber: 'INV-2026-0045', customerName: 'Apex Dairy Distributors', amountDue: 45000, dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'inv-2', invoiceNumber: 'INV-2026-0051', customerName: 'Metro Farms Corp', amountDue: 18500, dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    ]
  };

  const fallbackNotifications = {
    unreadCount: 3,
    recent: [
      { id: 'n-1', title: 'Critical Temperature Alert', message: 'Cold Storage Unit #2 temp reached 6.2°C (Limit: 4°C)', createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), type: 'alert' },
      { id: 'n-2', title: 'Subscription Renewed', message: 'Greenfield Cooperative subscription plan renewed successfully', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'info' },
      { id: 'n-3', title: 'API Integration Fault', message: 'ERP Connector failed 3 validation handshakes', createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), type: 'warning' },
    ]
  };

  const fallbackRecentActivity = {
    items: [
      { id: 'act-1', type: 'MILK_LOGGED', description: 'Shift Operator logged 1,200 liters Cow Milk', createdAt: new Date().toISOString() },
      { id: 'act-2', type: 'INVOICE_ISSUED', description: 'Invoice INV-2026-0082 issued to Apex Dairy Distributors', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
      { id: 'act-3', type: 'PAYMENT_RECEIVED', description: 'Received ₹45,000 from Mother Dairy via RTGS', createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
      { id: 'act-4', type: 'MEMBER_REGISTERED', description: 'New Cooperative Dairy Farmer registered: Rajesh Kumar', createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString() },
    ]
  };

  const fallbackTodaySummary = {
    milkCollection: { volumeLiters: 1250, cost: 45000 },
    milkSales: { volumeLiters: 980, revenue: 58800 },
    productOrders: { count: 18, revenue: 24500 },
    deliveries: [
      { status: 'PENDING', count: 4 },
      { status: 'DELIVERED', count: 12 }
    ],
    newCustomersToday: 3
  };

  // ==========================================
  // TANSTACK QUERY HOOKS FOR REAL ENDPOINTS
  // ==========================================
  const kpiQuery = useQuery({
    queryKey: ['dashboardKpi', range, startDate, endDate],
    queryFn: () => fetchWithFallback(`/api/dashboard/stats/kpi?startDate=${startDate}&endDate=${endDate}`, fallbackKpi),
    staleTime: 30000,
    placeholderData: fallbackKpi,
  });

  const revChartQuery = useQuery({
    queryKey: ['dashboardRevChart', range, startDate, endDate],
    queryFn: () => fetchWithFallback(`/api/dashboard/charts/revenue?startDate=${startDate}&endDate=${endDate}`, fallbackRevenueChart),
    staleTime: 30000,
    placeholderData: fallbackRevenueChart,
  });

  const salesTrendQuery = useQuery({
    queryKey: ['dashboardSalesTrend', range, startDate, endDate],
    queryFn: () => fetchWithFallback(`/api/dashboard/charts/sales-trend?startDate=${startDate}&endDate=${endDate}`, fallbackSalesTrend),
    staleTime: 30000,
    placeholderData: fallbackSalesTrend,
  });

  const custGrowthQuery = useQuery({
    queryKey: ['dashboardCustGrowth', range, startDate, endDate],
    queryFn: () => fetchWithFallback(`/api/dashboard/charts/customer-growth?startDate=${startDate}&endDate=${endDate}`, fallbackCustomerGrowth),
    staleTime: 30000,
    placeholderData: fallbackCustomerGrowth,
  });

  const prodDistQuery = useQuery({
    queryKey: ['dashboardProdDist', range, startDate, endDate],
    queryFn: () => fetchWithFallback(`/api/dashboard/charts/product-distribution?startDate=${startDate}&endDate=${endDate}`, fallbackProductDistribution),
    staleTime: 30000,
    placeholderData: fallbackProductDistribution,
  });

  const orderTrendQuery = useQuery({
    queryKey: ['dashboardOrderTrend', range, startDate, endDate],
    queryFn: () => fetchWithFallback(`/api/dashboard/charts/order-trend?startDate=${startDate}&endDate=${endDate}`, fallbackOrderTrend),
    staleTime: 30000,
    placeholderData: fallbackOrderTrend,
  });

  const payTrendQuery = useQuery({
    queryKey: ['dashboardPayTrend', range, startDate, endDate],
    queryFn: () => fetchWithFallback(`/api/dashboard/charts/payment-trend?startDate=${startDate}&endDate=${endDate}`, fallbackPaymentTrend),
    staleTime: 30000,
    placeholderData: fallbackPaymentTrend,
  });

  const pendingTasksQuery = useQuery({
    queryKey: ['dashboardPendingTasks'],
    queryFn: () => fetchWithFallback('/api/dashboard/widgets/pending-tasks', fallbackPendingTasks),
    staleTime: 30000,
    placeholderData: fallbackPendingTasks,
  });

  const notificationsQuery = useQuery({
    queryKey: ['dashboardNotifications'],
    queryFn: () => fetchWithFallback('/api/dashboard/widgets/notifications-summary', fallbackNotifications),
    staleTime: 30000,
    placeholderData: fallbackNotifications,
  });

  const recentActivityQuery = useQuery({
    queryKey: ['dashboardRecentActivity'],
    queryFn: () => fetchWithFallback('/api/dashboard/widgets/recent-activity', fallbackRecentActivity),
    staleTime: 30000,
    placeholderData: fallbackRecentActivity,
  });

  const todaySummaryQuery = useQuery({
    queryKey: ['dashboardTodaySummary'],
    queryFn: () => fetchWithFallback('/api/dashboard/widgets/today-summary', fallbackTodaySummary),
    staleTime: 30000,
    placeholderData: fallbackTodaySummary,
  });

  const handleManualRefresh = () => {
    kpiQuery.refetch();
    revChartQuery.refetch();
    salesTrendQuery.refetch();
    custGrowthQuery.refetch();
    prodDistQuery.refetch();
    orderTrendQuery.refetch();
    payTrendQuery.refetch();
    pendingTasksQuery.refetch();
    notificationsQuery.refetch();
    recentActivityQuery.refetch();
    todaySummaryQuery.refetch();
    showToast('Refreshed operations metrics database cache.', 'success');
  };

  const isLoading = kpiQuery.isFetching || revChartQuery.isFetching || salesTrendQuery.isFetching;
  const canViewFinance = session?.user?.role !== 'OPERATOR';

  // Pie Chart Colors
  const COLORS = ['#0d9488', '#0ea5e9', '#f59e0b', '#f43f5e', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. OPERATIONS HEADBOARD PANEL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 rounded-full text-[10px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cooperative Operations Core
            </div>

            {apiStatus === 'connecting' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                Connecting API...
              </div>
            )}
            {apiStatus === 'live' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 rounded-full text-[9px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Cloud Sync
              </div>
            )}
            {apiStatus === 'fallback' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 rounded-full text-[9px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest" title="Operating with client-side persistent storage fallbacks.">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Sandbox Staging Telemetry
              </div>
            )}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Operations Command Center</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Real-time telemetry, transaction metrics, and milk supply logistics monitoring.</p>
        </div>

        {/* Filters and Control Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center border border-slate-200 dark:border-slate-750">
            {(['today', '7days', '30days', '12months'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition ${
                  range === r
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {r === 'today' ? 'Today' : r === '7days' ? '7D' : r === '30days' ? '30D' : '1Y'}
              </button>
            ))}
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl text-slate-600 dark:text-slate-350 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="Force Metrics Sync"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Sync Metrics</span>
          </button>
        </div>
      </div>

      {/* 2. CORE KPI METRICS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: Total Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-750 transition-all duration-200">
          <div className={`${!canViewFinance ? 'filter blur-xs select-none pointer-events-none opacity-40' : ''}`}>
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Revenue</span>
                <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  ₹{(kpiQuery.data?.revenue?.current ?? 0).toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-2xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                (kpiQuery.data?.revenue?.growth ?? 0) >= 0 
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
              }`}>
                {(kpiQuery.data?.revenue?.growth ?? 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(kpiQuery.data?.revenue?.growth ?? 0)}%
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">vs previous period</span>
            </div>
          </div>
          {!canViewFinance && (
            <div className="absolute inset-0 bg-white/45 dark:bg-slate-900/45 flex flex-col items-center justify-center p-4 text-center z-10 animate-fade-in">
              <Lock className="w-4.5 h-4.5 text-slate-500 dark:text-slate-400 mb-1" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Restricted</span>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
        </div>

        {/* KPI: Milk Collected */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-750 transition-all duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Milk Collection</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {(kpiQuery.data?.milkCollected?.current ?? 0).toLocaleString()} L
              </h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              (kpiQuery.data?.milkCollected?.growth ?? 0) >= 0 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
            }`}>
              {(kpiQuery.data?.milkCollected?.growth ?? 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(kpiQuery.data?.milkCollected?.growth ?? 0)}%
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">vs previous period</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>

        {/* KPI: Active Customers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-750 transition-all duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Customers</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {kpiQuery.data?.activeCustomers?.current ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-2xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
              <Plus className="w-3 h-3" />
              {kpiQuery.data?.activeCustomers?.growth ?? 0}%
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Growth Trend</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
        </div>

        {/* KPI: Order Count */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-750 transition-all duration-200">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Orders Fulfilled</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {kpiQuery.data?.orderCount?.current ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              {kpiQuery.data?.orderCount?.growth ?? 0}%
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Period Increase</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        </div>
      </div>

      {/* Secondary KPI Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* KPI: Low Stock Items */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Low-Stock SKUs</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 block">
                {kpiQuery.data?.lowStockCount ?? 0} Alerts
              </span>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg ${
            (kpiQuery.data?.lowStockCount ?? 0) > 0 
              ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 animate-pulse'
              : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
          }`}>
            {(kpiQuery.data?.lowStockCount ?? 0) > 0 ? 'Action Required' : 'Optimal'}
          </span>
        </div>

        {/* KPI: Pending Deliveries */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 rounded-2xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Logistics Queue</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 block">
                {kpiQuery.data?.pendingDeliveries ?? 0} Shipments
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 text-[8px] font-black uppercase tracking-wider rounded-lg">
            Active
          </span>
        </div>

        {/* KPI: Payment Status Overview */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex items-center justify-between shadow-xs relative overflow-hidden">
          <div className={`flex items-center justify-between w-full ${!canViewFinance ? 'filter blur-xs select-none pointer-events-none opacity-40' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-2xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pending Collections</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 block">
                  ₹{(pendingTasksQuery.data?.overdueInvoices?.reduce((sum: number, x: any) => sum + x.amountDue, 0) ?? 63500).toLocaleString()}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 text-[8px] font-black uppercase tracking-wider rounded-lg">
              2 Invoices
            </span>
          </div>
          {!canViewFinance && (
            <div className="absolute inset-0 bg-white/45 dark:bg-slate-900/45 flex flex-col items-center justify-center p-4 text-center z-10 animate-fade-in">
              <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400 mb-0.5" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Restricted</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. CORE CHARTS & SYSTEM VISUALIZATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Revenue Line/Area Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className={`flex flex-col h-full justify-between space-y-4 ${!canViewFinance ? 'filter blur-xs select-none pointer-events-none opacity-40' : ''}`}>
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Financial Streams</span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Revenue Breakdown</h3>
              </div>
              <div className="flex items-center gap-2 font-mono text-[9px] font-bold">
                <span className="flex items-center gap-1 text-teal-600"><span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />Milk Sales</span>
                <span className="flex items-center gap-1 text-sky-600"><span className="w-1.5 h-1.5 bg-sky-500 rounded-full" />Products</span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revChartQuery.data || fallbackRevenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMilk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontStyle="bold" tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" tickLine={false} />
                  <Tooltip contentStyle={{ background: theme === 'dark' ? '#0f172a' : '#ffffff', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="milkRevenue" name="Milk Revenue" stroke="#0d9488" strokeWidth={2} fillOpacity={1} fill="url(#colorMilk)" />
                  <Area type="monotone" dataKey="productRevenue" name="Product Sales" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorProd)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          {!canViewFinance && (
            <div className="absolute inset-0 bg-white/45 dark:bg-slate-900/45 flex flex-col items-center justify-center p-4 text-center z-10 animate-fade-in">
              <Lock className="w-5 h-5 text-slate-500 dark:text-slate-400 mb-2" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Restricted Stream</span>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 max-w-xs leading-normal">
                Your role does not possess the requisite <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">finance:read</span> permission level.
              </p>
            </div>
          )}
        </div>

        {/* Chart 2: Milk Sales & Collection Volume (Liters) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Volume Dynamics</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Milk Collection Trend</h3>
            </div>
            <span className="text-[9px] font-mono font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md">Liters</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={salesTrendQuery.data || fallbackSalesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontStyle="bold" tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" tickLine={false} />
                <Tooltip contentStyle={{ background: theme === 'dark' ? '#0f172a' : '#ffffff', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                <Bar dataKey="milkLiters" name="Milk Collected (L)" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Customer Growth */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cooperative Membership</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Customer Growth & Onboarding</h3>
            </div>
            <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">Total Registrations</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={custGrowthQuery.data || fallbackCustomerGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCust" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontStyle="bold" tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" tickLine={false} />
                <Tooltip contentStyle={{ background: theme === 'dark' ? '#0f172a' : '#ffffff', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="cumulativeCustomers" name="Active Members" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorCust)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Product distribution pie */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className={`flex flex-col h-full justify-between space-y-4 ${!canViewFinance ? 'filter blur-xs select-none pointer-events-none opacity-40' : ''}`}>
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Portfolio Distribution</span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Product Distribution</h3>
              </div>
              <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">Category Share</span>
            </div>
            <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="w-1/2 h-full min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={prodDistQuery.data || fallbackProductDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="revenue"
                      nameKey="category"
                    >
                      {(prodDistQuery.data || fallbackProductDistribution).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2">
                {(prodDistQuery.data || fallbackProductDistribution).map((item: any, idx: number) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{item.category}</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-900 dark:text-slate-100">
                      ₹{item.revenue.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {!canViewFinance && (
            <div className="absolute inset-0 bg-white/45 dark:bg-slate-900/45 flex flex-col items-center justify-center p-4 text-center z-10 animate-fade-in">
              <Lock className="w-5 h-5 text-slate-500 dark:text-slate-400 mb-2" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Restricted Share</span>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 max-w-xs leading-normal">
                Your role does not possess the requisite <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">finance:read</span> permission level.
              </p>
            </div>
          )}
        </div>

        {/* Chart 5: Order trend stack bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Dispatch Telemetry</span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Sales Trend & Dispatches</h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px] font-bold">
              <span className="flex items-center gap-1 text-teal-600"><span className="w-1.5 h-1.5 bg-teal-500 rounded-full" />Completed</span>
              <span className="flex items-center gap-1 text-rose-600"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />Cancelled</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={orderTrendQuery.data || fallbackOrderTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} fontStyle="bold" tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} fontStyle="bold" tickLine={false} />
                <Tooltip contentStyle={{ background: theme === 'dark' ? '#0f172a' : '#ffffff', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }} />
                <Bar dataKey="completedOrders" name="Completed" stackId="a" fill="#0d9488" />
                <Bar dataKey="cancelledOrders" name="Cancelled" stackId="a" fill="#f43f5e" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Payment Methods donut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className={`flex flex-col h-full justify-between space-y-4 ${!canViewFinance ? 'filter blur-xs select-none pointer-events-none opacity-40' : ''}`}>
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Invoicing Channels</span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Payment Channel Share</h3>
              </div>
              <span className="text-[9px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">Settlements</span>
            </div>
            <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="w-1/2 h-full min-h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={payTrendQuery.data || fallbackPaymentTrend}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="amount"
                      nameKey="method"
                    >
                      {(payTrendQuery.data || fallbackPaymentTrend).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => `₹${val.toLocaleString()}`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2">
                {(payTrendQuery.data || fallbackPaymentTrend).map((item: any, idx: number) => (
                  <div key={item.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-350 truncate max-w-[120px]">{item.method}</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-slate-900 dark:text-slate-100">
                      ₹{item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {!canViewFinance && (
            <div className="absolute inset-0 bg-white/45 dark:bg-slate-900/45 flex flex-col items-center justify-center p-4 text-center z-10 animate-fade-in">
              <Lock className="w-5 h-5 text-slate-500 dark:text-slate-400 mb-2" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Restricted Share</span>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 max-w-xs leading-normal">
                Your role does not possess the requisite <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">finance:read</span> permission level.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. OPERATIONAL WIDGETS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Widget 1: Today's Operations Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Daily Run Rate</span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Today's Summary</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">Milk Volume Logged</span>
                  <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200 block">
                    {(todaySummaryQuery.data?.milkCollection?.volumeLiters ?? 0).toLocaleString()} L
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 font-mono">₹{(todaySummaryQuery.data?.milkCollection?.cost ?? 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">Direct Milk Sales</span>
                  <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200 block">
                    {(todaySummaryQuery.data?.milkSales?.volumeLiters ?? 0).toLocaleString()} L
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-teal-600 font-mono">₹{(todaySummaryQuery.data?.milkSales?.revenue ?? 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">E-Commerce Orders</span>
                  <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200 block">
                    {todaySummaryQuery.data?.productOrders?.count ?? 0} Orders Placed
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold text-teal-600 font-mono">₹{(todaySummaryQuery.data?.productOrders?.revenue ?? 0).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">Farmer Signups</span>
                  <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200 block">
                    {todaySummaryQuery.data?.newCustomersToday ?? 0} Onboarded
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[8px] font-black rounded-sm uppercase tracking-wider">Active</span>
            </div>
          </div>
        </div>

        {/* Widget 2: Pending Tasks & Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Actionable Items</span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Pending Tasks</h3>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {/* Low stock indicators */}
            {(pendingTasksQuery.data?.lowStockAlerts ?? []).map((stock: any) => (
              <div key={stock.id} className="p-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100/60 dark:border-rose-900/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block truncate max-w-[150px]">{stock.productName}</span>
                    <span className="text-[8px] font-mono text-slate-400 font-bold block">{stock.sku}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-black text-rose-600 block">{stock.currentStock} left</span>
                  <span className="text-[8px] text-slate-400 block font-semibold">Min: {stock.minAlert}</span>
                </div>
              </div>
            ))}

            {/* Overdue Invoices */}
            {(pendingTasksQuery.data?.overdueInvoices ?? []).map((inv: any) => (
              <div key={inv.id} className="p-3 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-100/60 dark:border-amber-900/30 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block truncate max-w-[150px]">{inv.customerName}</span>
                    <span className="text-[8px] font-mono text-slate-400 font-bold block">{inv.invoiceNumber}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-black text-amber-600 block">₹{inv.amountDue.toLocaleString()}</span>
                  <span className="text-[8px] text-rose-500 block font-bold uppercase tracking-wider">Overdue</span>
                </div>
              </div>
            ))}

            {/* Empty State tasks */}
            {(!pendingTasksQuery.data?.lowStockAlerts?.length && !pendingTasksQuery.data?.overdueInvoices?.length) && (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-teal-500 mx-auto opacity-70 mb-2" />
                <p className="text-[11px] font-bold text-slate-400">All tasks completed! Operations optimal.</p>
              </div>
            )}
          </div>
        </div>

        {/* Widget 3: Real-Time Activity & Quick Actions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-5">
          <div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Audit Logs</span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Recent Activity</h3>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {(recentActivityQuery.data?.items ?? []).map((act: any) => (
              <div key={act.id} className="flex gap-3 relative before:absolute before:left-[17px] before:top-8 before:bottom-0 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800 last:before:hidden">
                <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {act.description}
                  </p>
                  <span className="text-[8px] text-slate-400 font-bold block">{new Date(act.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            
            {(!recentActivityQuery.data?.items?.length) && (
              <div className="text-center py-8">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-[11px] font-bold text-slate-400">No recent operational activities.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Panel */}
      <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Operations Playbook</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button 
            onClick={() => showToast('Command logged. Cooperative member profile opened.', 'info')}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-teal-500/50 rounded-2xl text-left shadow-xs transition hover:shadow-md cursor-pointer space-y-2 group"
          >
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 rounded-xl w-fit group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider block text-slate-800 dark:text-slate-200">Register Farmer</span>
          </button>

          <button 
            onClick={() => showToast('Telemetry active. Launching Milk Intake Form...', 'info')}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-teal-500/50 rounded-2xl text-left shadow-xs transition hover:shadow-md cursor-pointer space-y-2 group"
          >
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl w-fit group-hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider block text-slate-800 dark:text-slate-200">Log Milk Intake</span>
          </button>

          <button 
            onClick={() => showToast('Direct billing gateway initialized.', 'info')}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-teal-500/50 rounded-2xl text-left shadow-xs transition hover:shadow-md cursor-pointer space-y-2 group"
          >
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl w-fit group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider block text-slate-800 dark:text-slate-200">Issue Invoice</span>
          </button>

          <button 
            onClick={handleManualRefresh}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-teal-500/50 rounded-2xl text-left shadow-xs transition hover:shadow-md cursor-pointer space-y-2 group"
          >
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit group-hover:scale-105 transition-transform">
              <RefreshCw className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider block text-slate-800 dark:text-slate-200">Export Telemetry</span>
          </button>
        </div>
      </div>
    </div>
  );
};
