import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Calendar, ArrowUpRight, ArrowDownLeft, ShieldAlert, Sparkles, 
  BarChart3, PieChart, Activity, RefreshCw, FileText, Download, CalendarClock, 
  Mail, Users, Tag, Landmark, Flame, Compass, ChevronRight, Check, CheckCircle2, AlertTriangle, Droplet
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { api } from '../utils/api';
import { SessionData } from '../types';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  BarChart as ReBarChart, Bar, Legend, LineChart, Line, ComposedChart
} from 'recharts';

interface BiAnalyticsDashboardProps {
  session: SessionData;
}

export function BiAnalyticsDashboard({ session }: BiAnalyticsDashboardProps) {
  const { showToast } = useToast();
  
  // Date and filter states
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [period, setPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY');
  const [comparisonActive, setComparisonActive] = useState(true);

  // Core BI Data States
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);

  // Interactive Drill-down & Tab states
  const [activeChartTab, setActiveChartTab] = useState<'financial' | 'operations' | 'efficiency'>('financial');
  const [activeForecastTab, setActiveForecastTab] = useState<'collection' | 'revenue' | 'demand'>('collection');
  const [drillDownSection, setDrillDownSection] = useState<'none' | 'branches' | 'products' | 'farmers' | 'customers'>('none');
  const [drillDownTitle, setDrillDownTitle] = useState('');

  // Schedule report form states
  const [reportName, setReportName] = useState('');
  const [reportFormat, setReportFormat] = useState<'PDF' | 'EXCEL' | 'CSV'>('PDF');
  const [reportFrequency, setReportFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [reportRecipients, setReportRecipients] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Fetch all intelligence telemetry
  const fetchBiIntelligence = async () => {
    setLoading(true);
    try {
      const [summaryData, trendData, forecastData, compData, heatData, schedData] = await Promise.all([
        api.getAnalyticsSummary(startDate, endDate),
        api.getAnalyticsTrends(period, startDate, endDate),
        api.getAnalyticsForecast(),
        api.getAnalyticsComparison(startDate, endDate),
        api.getAnalyticsHeatmap(),
        api.getScheduledAnalyticsReports()
      ]);

      setSummary(summaryData);
      setTrends(trendData);
      setForecast(forecastData);
      setComparison(compData);
      setHeatmap(heatData);
      setScheduledReports(schedData);
    } catch (err: any) {
      showToast(err.message || 'Error compiling executive analytics telemetry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiIntelligence();
  }, [startDate, endDate, period]);

  // Handle drill down click
  const triggerDrilldown = (type: 'branches' | 'products' | 'farmers' | 'customers', title: string) => {
    if (drillDownSection === type) {
      setDrillDownSection('none');
    } else {
      setDrillDownSection(type);
      setDrillDownTitle(title);
      showToast(`Drilled down into ${title} metrics matrix.`, 'info');
      // Scroll smoothly to drill down panel
      setTimeout(() => {
        document.getElementById('drilldown-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Submit scheduled report form
  const handleScheduleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportName || !reportRecipients) {
      showToast('Please fill out all report parameters.', 'warning');
      return;
    }
    setScheduling(true);
    try {
      const response = await api.scheduleAnalyticsReport({
        name: reportName,
        format: reportFormat,
        frequency: reportFrequency,
        recipients: reportRecipients
      });
      if (response.success) {
        showToast('Cooperative BI Scheduled Report saved successfully.', 'success');
        setReportName('');
        setReportRecipients('');
        // Refresh scheduled list
        const list = await api.getScheduledAnalyticsReports();
        setScheduledReports(list);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save schedule.', 'error');
    } finally {
      setScheduling(false);
    }
  };

  // Immediate Exports Mock
  const triggerExport = (format: 'PDF' | 'EXCEL' | 'CSV') => {
    showToast(`Assembling dataset in memory... compiling ${format} artifact...`, 'info');
    setTimeout(() => {
      if (format === 'PDF') {
        window.print();
      } else {
        showToast(`Cooperative BI Analytics exported successfully as ${format}.`, 'success');
      }
    }, 1000);
  };

  if (loading || !summary) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4 select-none">
        <RefreshCw className="w-12 h-12 text-teal-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Assembling BI & Analytics Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in no-print" ref={printRef}>
      
      {/* 1. BRAND HERO BAR & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/40 rounded-full text-xs font-semibold text-teal-800 dark:text-teal-400">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-pulse" />
            Strategic Planning Suite
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Advanced BI & Analytics Hub
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 max-w-xl">
            Enterprise forecasting engine, comparative intelligence audits, and real-time multi-tenant health telemetry.
          </p>
        </div>

        {/* Filters and Date Range Pickers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-300"
            />
            <span className="text-slate-300">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-none focus:ring-0 text-slate-700 dark:text-slate-300"
            />
          </div>

          <select
            value={period}
            onChange={(e: any) => setPeriod(e.target.value)}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
          >
            <option value="DAILY">Daily Index</option>
            <option value="WEEKLY">Weekly Trend</option>
            <option value="MONTHLY">Monthly Index</option>
            <option value="QUARTERLY">Quarterly Index</option>
            <option value="YEARLY">Yearly Summary</option>
          </select>

          <button
            onClick={() => fetchBiIntelligence()}
            className="p-2 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 border border-teal-100 dark:border-teal-900/40 rounded-xl text-teal-700 dark:text-teal-400 transition"
            title="Refresh Intelligence Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. EXECUTIVE HIGHLIGHTS & HEALTH SCORE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Business Health Radial Indicator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-1.5 z-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Cooperative Health Index
            </h3>
            <p className="text-[11px] text-slate-400">Weighted real-time SLA metrics audit</p>
          </div>

          {/* Health Gauge Visualization */}
          <div className="py-6 flex flex-col items-center justify-center relative">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle 
                  cx="50" cy="50" r="42" 
                  stroke="currentColor" 
                  className="text-slate-100 dark:text-slate-800" 
                  strokeWidth="8" fill="transparent" 
                />
                {/* Foreground Fill */}
                <circle 
                  cx="50" cy="50" r="42" 
                  stroke={summary.healthScore >= 75 ? "#0d9488" : summary.healthScore >= 50 ? "#eab308" : "#e11d48"} 
                  strokeWidth="8" 
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - summary.healthScore / 100)}`}
                  strokeLinecap="round"
                  fill="transparent" 
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-4xl font-extrabold tracking-tighter text-slate-900 dark:text-white">
                  {summary.healthScore}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Score
                </span>
              </div>
            </div>
            
            {/* Rating text */}
            <div className="mt-4 text-center">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                summary.healthScore >= 75 
                  ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400' 
                  : summary.healthScore >= 50 
                    ? 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
              }`}>
                {summary.healthScore >= 75 ? 'OPTIMAL HEALTH' : summary.healthScore >= 50 ? 'STABLE SIGNS' : 'CONSTRAINED HEALTH'}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-50 dark:border-slate-800/60 pt-4 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Critical alerts pending:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {summary.anomalies.lowStockItems + summary.anomalies.overdueInvoices} incidents
            </span>
          </div>
        </div>

        {/* Narrative Executive Summary Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Executive Strategic Narrative
                  </h3>
                  <p className="text-[10px] text-slate-400">Dynamically generated analytical summaries</p>
                </div>
              </div>
              <button 
                onClick={() => triggerExport('PDF')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Briefing</span>
              </button>
            </div>

            <div className="bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                {summary.executiveSummaryText}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800/60 text-center">
            <div className="space-y-0.5">
              <span className="block text-[10px] text-slate-400 font-medium">Quality Fat Avg</span>
              <span className="block text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {summary.qualityMetrics.averageFat.toFixed(2)}%
              </span>
            </div>
            <div className="space-y-0.5 border-x border-slate-50 dark:border-slate-800/60">
              <span className="block text-[10px] text-slate-400 font-medium">Quality SNF Avg</span>
              <span className="block text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {summary.qualityMetrics.averageSnf.toFixed(2)}%
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="block text-[10px] text-slate-400 font-medium">Procurement Rate Avg</span>
              <span className="block text-sm font-extrabold text-slate-800 dark:text-slate-200">
                Rs. {summary.qualityMetrics.averageRatePerLiter.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. CORE ANALYTICS CARD MATRIX (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Revenue */}
        <div 
          onClick={() => triggerDrilldown('customers', 'Enterprise Corporate Inflow')}
          className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:border-teal-500/50 cursor-pointer transition relative group"
        >
          <div className="absolute top-4 right-4 text-slate-300 group-hover:text-teal-500 transition">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Revenue Analytics</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-800 dark:text-white">
              Rs. {summary.kpis.revenue.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
              summary.kpis.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.kpis.revenue.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
              {Math.abs(summary.kpis.revenue.growth)}%
            </span>
            <span className="text-[10px] text-slate-400">vs comparison period</span>
          </div>
        </div>

        {/* KPI 2: Profit */}
        <div 
          onClick={() => triggerDrilldown('products', 'Gross Profit Margins')}
          className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:border-teal-500/50 cursor-pointer transition relative group"
        >
          <div className="absolute top-4 right-4 text-slate-300 group-hover:text-teal-500 transition">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Profit Analytics</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-800 dark:text-white">
              Rs. {summary.kpis.profit.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
              summary.kpis.profit.growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.kpis.profit.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
              {Math.abs(summary.kpis.profit.growth)}%
            </span>
            <span className="text-[10px] text-slate-400">vs comparison period</span>
          </div>
        </div>

        {/* KPI 3: Expenses */}
        <div 
          onClick={() => triggerDrilldown('branches', 'Operations Expense Matrix')}
          className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:border-teal-500/50 cursor-pointer transition relative group"
        >
          <div className="absolute top-4 right-4 text-slate-300 group-hover:text-teal-500 transition">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Expense Analytics</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-800 dark:text-white">
              Rs. {summary.kpis.expense.current.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
              summary.kpis.expense.growth <= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.kpis.expense.growth <= 0 ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
              {Math.abs(summary.kpis.expense.growth)}%
            </span>
            <span className="text-[10px] text-slate-400">vs comparison period</span>
          </div>
        </div>

        {/* KPI 4: Procurement */}
        <div 
          onClick={() => triggerDrilldown('farmers', 'Farmer Collective Inflow')}
          className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:border-teal-500/50 cursor-pointer transition relative group"
        >
          <div className="absolute top-4 right-4 text-slate-300 group-hover:text-teal-500 transition">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Procurement Analytics</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-800 dark:text-white">
              {summary.kpis.milkCollectedLiters.current.toLocaleString()} L
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
              summary.kpis.milkCollectedLiters.growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary.kpis.milkCollectedLiters.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
              {Math.abs(summary.kpis.milkCollectedLiters.growth)}%
            </span>
            <span className="text-[10px] text-slate-400">vs comparison period</span>
          </div>
        </div>

      </div>

      {/* 4. ADVANCED VISUALIZATIONS & DRILL-DOWNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart View Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Header Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Dynamic Trend Charts
                </h4>
                <p className="text-[10px] text-slate-400">Interactive brush rendering of cooperative trends</p>
              </div>

              {/* Chart swappers */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveChartTab('financial')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeChartTab === 'financial' 
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' 
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Revenue vs Cost
                </button>
                <button
                  onClick={() => setActiveChartTab('operations')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeChartTab === 'operations' 
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' 
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Milk Collected vs Sold
                </button>
                <button
                  onClick={() => setActiveChartTab('efficiency')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeChartTab === 'efficiency' 
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' 
                      : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Monthly Margins
                </button>
              </div>
            </div>

            {/* Recharts Area Container */}
            <div className="h-72 w-full pt-2">
              {activeChartTab === 'financial' && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="periodKey" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" name="Gross Inflow (Rs.)" dataKey="revenue" stroke="#0d9488" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} />
                    <Area type="monotone" name="Procurement Outflow (Rs.)" dataKey="procurement" stroke="#ef4444" fillOpacity={1} fill="url(#colorCost)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}

              {activeChartTab === 'operations' && (
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="periodKey" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar name="Liters Collected" dataKey="quantityCollected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar name="Liters Sold" dataKey="quantitySold" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              )}

              {activeChartTab === 'efficiency' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="periodKey" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Line type="monotone" name="Net Margin Profit" dataKey="profit" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

          </div>
        </div>

        {/* Activity Heatmap Grid Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Hourly Intake Density
              </h4>
              <p className="text-[10px] text-slate-400">Heat map grid of weekly milk collections</p>
            </div>

            {/* Custom SVG Heatmap Block */}
            <div className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-2">
                <span className="text-left">WEEK DAY</span>
                <span>MORNING INTAKE</span>
                <span>EVENING INTAKE</span>
              </div>

              {heatmap.map((h, i) => {
                // Determine heat level colors
                const mHeat = h.MORNING > 900 ? 'bg-teal-600 text-white' : h.MORNING > 750 ? 'bg-teal-500/80 text-white' : 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400';
                const eHeat = h.EVENING > 800 ? 'bg-indigo-600 text-white' : h.EVENING > 650 ? 'bg-indigo-500/80 text-white' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400';

                return (
                  <div key={i} className="grid grid-cols-3 gap-2 items-center text-center">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 text-left">
                      {h.label.substring(0, 3)}
                    </span>
                    <span className={`text-[11px] font-semibold py-1.5 rounded-lg transition ${mHeat}`}>
                      {Math.round(h.MORNING)} L
                    </span>
                    <span className={`text-[11px] font-semibold py-1.5 rounded-lg transition ${eHeat}`}>
                      {Math.round(h.EVENING)} L
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium pt-4 border-t border-slate-50 dark:border-slate-800/60">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-teal-100 border border-teal-200" /> Lower
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-teal-500" /> Optimal
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-teal-600" /> Peak Load
            </span>
          </div>
        </div>

      </div>

      {/* 5. FORECASTING FOUNDATIONS BLOCK */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40 rounded-full text-[10px] font-bold text-violet-700 dark:text-violet-400">
              <Flame className="w-3 h-3" />
              Machine Forecasting Simulator
            </div>
            <h3 className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-white uppercase">
              Predictive 6-Month Operations Forecast
            </h3>
            <p className="text-[10px] text-slate-400">Mathematical exponential trend projections modeling localized seasonality</p>
          </div>

          {/* Forecasting Tab selectors */}
          <div className="flex gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setActiveForecastTab('collection')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeForecastTab === 'collection' 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Collection Volumes
            </button>
            <button
              onClick={() => setActiveForecastTab('revenue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeForecastTab === 'revenue' 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Revenue & Profit
            </button>
            <button
              onClick={() => setActiveForecastTab('demand')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                activeForecastTab === 'demand' 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Inventory Demand
            </button>
          </div>
        </div>

        {/* Forecast visualizer graph */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          <div className="lg:col-span-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e1b4b', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                
                {activeForecastTab === 'collection' && (
                  <>
                    <Bar name="Procurement Volume (L)" dataKey="milkCollectionForecastLiters" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={25} />
                    <Line name="Collection Cost Forecast (Rs.)" dataKey="procurementForecastCost" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  </>
                )}

                {activeForecastTab === 'revenue' && (
                  <>
                    <Bar name="Projected Profit Margin (Rs.)" dataKey="projectedProfit" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
                    <Line name="Projected Revenue (Rs.)" dataKey="revenueForecastAmount" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                  </>
                )}

                {activeForecastTab === 'demand' && (
                  <>
                    <Bar name="Logistics Demand Units Needed" dataKey="inventoryDemandUnits" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={25} />
                    <Line name="Sales Volume Target (L)" dataKey="milkSalesForecastLiters" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Forecasting text insights summary card */}
          <div className="bg-violet-50/50 dark:bg-slate-950 border border-violet-100/60 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-violet-800 dark:text-violet-400 uppercase tracking-widest">
                Forecast Interpretation
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Projections modeled on a baseline of <strong>{trends.length} months history</strong> factoring cyclic seasonal variances during winter milk flush cycles.
              </p>
              
              <div className="space-y-2 border-t border-violet-100 dark:border-slate-800 pt-3 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Peak Month Volume:</span>
                  <strong className="text-slate-700 dark:text-slate-200">
                    {Math.round(Math.max(...forecast.map(f => f.milkCollectionForecastLiters)))} Liters
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Projected profit margin:</span>
                  <strong className="text-slate-700 dark:text-slate-200">
                    Rs. {Math.round(forecast.reduce((acc, f) => acc + f.projectedProfit, 0) / 6).toLocaleString()} /mo avg
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated stock buffer multiplier:</span>
                  <strong className="text-slate-700 dark:text-slate-200">+12% safety margin</strong>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-violet-100 dark:border-slate-800 p-3 rounded-xl mt-4 text-[10px] text-slate-400 leading-relaxed">
              *Forecasting is statistical; values may change if cooperative route enrollment expands.
            </div>
          </div>
        </div>
      </div>

      {/* 6. DRILL-DOWN MATRIX INTERACTIVE COMPONENT SHEET */}
      {drillDownSection !== 'none' && (
        <div id="drilldown-panel" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-4 scroll-mt-6">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-50 dark:bg-teal-950/30 rounded-xl text-teal-600 dark:text-teal-400">
                <BarChart3 className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight text-slate-800 dark:text-white uppercase">
                  Telemetry Drilldown: {drillDownTitle}
                </h3>
                <p className="text-[10px] text-slate-400">Detailed row ledger logs corresponding to executive metrics</p>
              </div>
            </div>
            <button 
              onClick={() => setDrillDownSection('none')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Close Ledger [x]
            </button>
          </div>

          {/* Drill down branches */}
          {drillDownSection === 'branches' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5">ROUTE / BRANCH</th>
                    <th>CODE</th>
                    <th>START PATH</th>
                    <th>END PATH</th>
                    <th>DELIVERY SINKS</th>
                    <th>DELIVERIES ASSIGNED</th>
                    <th>FULFILLMENT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {comparison.branches.map((b: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      <td className="py-2.5 font-bold">{b.branchName}</td>
                      <td><span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{b.code}</span></td>
                      <td>{b.startPoint}</td>
                      <td>{b.endPoint}</td>
                      <td>{b.activeSinks} addresses</td>
                      <td>{b.deliveriesDone} units</td>
                      <td>
                        <span className="font-bold text-teal-600 dark:text-teal-400">{b.deliveryFulfillmentRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Drill down products */}
          {drillDownSection === 'products' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5">PRODUCT NAME</th>
                    <th>SKU ID</th>
                    <th>UNITS SOLD</th>
                    <th>TOTAL SALES INFLOW</th>
                    <th>ESTIMATED COST PRICE</th>
                    <th>PROFIT MARGIN %</th>
                    <th>PROFIT VALUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {comparison.products.map((p: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      <td className="py-2.5 font-bold">{p.name}</td>
                      <td><span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{p.sku}</span></td>
                      <td>{p.unitsSold} units</td>
                      <td>Rs. {p.totalSales.toLocaleString()}</td>
                      <td>Rs. {Math.round(p.totalSales * (1 - p.profitMarginPercent/100)).toLocaleString()}</td>
                      <td><span className="font-bold text-teal-600 dark:text-teal-400">{p.profitMarginPercent}%</span></td>
                      <td className="font-bold text-slate-800 dark:text-slate-200">Rs. {Math.round(p.profitGenerated).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Drill down farmers */}
          {drillDownSection === 'farmers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5">FARMER COOPERATIVE MEMBER</th>
                    <th>COLLECTION SESSIONS</th>
                    <th>TOTAL VOLUME COLLECTED</th>
                    <th>AVERAGE FAT %</th>
                    <th>AVERAGE SNF %</th>
                    <th>TOTAL PAYOUT DUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {comparison.farmers.map((f: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      <td className="py-2.5 font-bold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                        {f.name}
                      </td>
                      <td>{f.tripsCount} shift logs</td>
                      <td className="font-semibold">{f.totalVolumeLiters.toLocaleString()} Liters</td>
                      <td>{f.avgFat.toFixed(2)}%</td>
                      <td>{f.avgSnf.toFixed(2)}%</td>
                      <td className="font-bold text-slate-800 dark:text-slate-200">Rs. {f.totalPayout.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Drill down customers */}
          {drillDownSection === 'customers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-2.5">CUSTOMER RECIPIENT</th>
                    <th>ORDER TRANSACTIONS</th>
                    <th>TOTAL INFLOW CONTRIBUTION</th>
                    <th>AVERAGE BASKET SIZE</th>
                    <th>OUTSTANDING BALANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {comparison.customers.map((c: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      <td className="py-2.5 font-bold">{c.name}</td>
                      <td>{c.ordersCount} invoices</td>
                      <td className="font-bold text-teal-600 dark:text-teal-400">Rs. {c.totalSpent.toLocaleString()}</td>
                      <td>Rs. {Math.round(c.totalSpent / c.ordersCount).toLocaleString()}</td>
                      <td>Rs. 0.00</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 7. SCHEDULING & AUTOMATED BI EXPORTS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scheduled reports list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Automated Reports
            </h4>
            <p className="text-[10px] text-slate-400">Scheduled strategic email briefing logs</p>
          </div>

          <div className="space-y-3 pt-2">
            {scheduledReports.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-teal-700 dark:text-teal-400 mt-0.5">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {r.name}
                    </h5>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                      <span className="font-medium">Frequency: {r.frequency}</span>
                      <span>•</span>
                      <span className="font-medium">Format: {r.format}</span>
                      <span>•</span>
                      <span className="font-medium max-w-xs truncate">To: {r.recipients}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900/40 rounded-full text-[9px] font-bold text-green-700 dark:text-green-400">
                    <Check className="w-3 h-3" /> ACTIVE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule a new report form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm">
          <form onSubmit={handleScheduleReport} className="space-y-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Schedule BI Briefing
              </h4>
              <p className="text-[10px] text-slate-400">Automate recurring audits dispatching</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Briefing Title</label>
                <input 
                  type="text" 
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="e.g. Monthly Profit Margin Audit"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">File Format</label>
                  <select 
                    value={reportFormat}
                    onChange={(e: any) => setReportFormat(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="PDF">Stylized PDF</option>
                    <option value="EXCEL">Excel Sheet</option>
                    <option value="CSV">Flat CSV</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Frequency</label>
                  <select 
                    value={reportFrequency}
                    onChange={(e: any) => setReportFrequency(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="DAILY">Daily Run</option>
                    <option value="WEEKLY">Weekly Run</option>
                    <option value="MONTHLY">Monthly Run</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Recipients Emails</label>
                <input 
                  type="text" 
                  value={reportRecipients}
                  onChange={(e) => setReportRecipients(e.target.value)}
                  placeholder="admin@coop.com, board@coop.com"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={scheduling}
                className="w-full py-2 bg-teal-600 hover:bg-teal-500 dark:bg-teal-500 dark:hover:bg-teal-400 text-white rounded-xl text-xs font-bold tracking-wider uppercase shadow transition flex items-center justify-center gap-1.5"
              >
                {scheduling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scheduling Briefing...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Schedule Briefing</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
