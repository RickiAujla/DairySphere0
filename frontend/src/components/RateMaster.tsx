import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { RateChart, SessionData } from '../types';
import { 
  TrendingUp, Plus, Edit, Trash2, Calendar, Clock, AlertCircle, 
  CheckCircle2, Search, Filter, RefreshCw, Layers, ShieldAlert, Check, X, ShieldCheck
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';

interface RateMasterProps {
  session: SessionData | null;
}

export const RateMaster: React.FC<RateMasterProps> = ({ session }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [charts, setCharts] = useState<RateChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<RateChart | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [milkFilter, setMilkFilter] = useState<'all' | 'COW' | 'BUFFALO' | 'MIXED'>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'FAT_ONLY' | 'SNF_ONLY' | 'FAT_SNF_SOLIDS'>('all');

  // Form states
  const [formName, setFormName] = useState('');
  const [formMilkType, setFormMilkType] = useState<'COW' | 'BUFFALO' | 'MIXED'>('COW');
  const [formPricingMethod, setFormPricingMethod] = useState<'FAT_ONLY' | 'SNF_ONLY' | 'FAT_SNF_SOLIDS' | 'MATRIX_LOOKUP'>('FAT_SNF_SOLIDS');
  const [formBaseRate, setFormBaseRate] = useState('45.00');
  const [formFatStandard, setFormFatStandard] = useState('4.0');
  const [formSnfStandard, setFormSnfStandard] = useState('8.5');
  const [formFatPremium, setFormFatPremium] = useState('0.50');
  const [formSnfPremium, setFormSnfPremium] = useState('0.40');
  const [formEffectiveFrom, setFormEffectiveFrom] = useState(new Date().toISOString().substring(0, 10));
  const [formShift, setFormShift] = useState<'MORNING' | 'EVENING' | 'BOTH'>('BOTH');
  const [formIsActive, setFormIsActive] = useState(true);

  // RBAC permissions check
  const isAdminOrManager = useMemo(() => {
    const roleName = session?.user?.role || localStorage.getItem('dairysphere_user_role') || '';
    return ['ADMIN', 'MANAGER'].includes(roleName.toUpperCase());
  }, [session]);

  const fetchCharts = async () => {
    setLoading(true);
    try {
      const data = await api.getRateCharts();
      setCharts(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch rate charts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharts();
  }, []);

  const handleOpenCreate = () => {
    setEditingChart(null);
    setFormName('');
    setFormMilkType('COW');
    setFormPricingMethod('FAT_SNF_SOLIDS');
    setFormBaseRate('45.00');
    setFormFatStandard('4.0');
    setFormSnfStandard('8.5');
    setFormFatPremium('0.50');
    setFormSnfPremium('0.40');
    setFormEffectiveFrom(new Date().toISOString().substring(0, 10));
    setFormShift('BOTH');
    setFormIsActive(true);
    setFormOpen(true);
  };

  const handleOpenEdit = (chart: RateChart) => {
    setEditingChart(chart);
    setFormName(chart.name);
    setFormMilkType(chart.milkType);
    setFormPricingMethod(chart.pricingMethod);
    setFormBaseRate(String(chart.baseRate));
    setFormFatStandard(String(chart.fatStandard));
    setFormSnfStandard(String(chart.snfStandard));
    setFormFatPremium(String(chart.fatPremium));
    setFormSnfPremium(String(chart.snfPremium));
    setFormEffectiveFrom(new Date(chart.effectiveFrom).toISOString().substring(0, 10));
    setFormShift(chart.shift || 'BOTH');
    setFormIsActive(chart.isActive);
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrManager) {
      showToast('Action Forbidden: Managerial credentials required to alter rate charts.', 'error');
      return;
    }

    if (!formName.trim()) {
      showToast('Rate chart name is required.', 'error');
      return;
    }

    const payload = {
      name: formName,
      milkType: formMilkType,
      pricingMethod: formPricingMethod,
      baseRate: Number(formBaseRate),
      fatStandard: Number(formFatStandard),
      snfStandard: Number(formSnfStandard),
      fatPremium: Number(formFatPremium),
      snfPremium: Number(formSnfPremium),
      effectiveFrom: new Date(formEffectiveFrom).toISOString(),
      shift: formShift,
      isActive: formIsActive
    };

    try {
      if (editingChart) {
        await api.updateRateChart(editingChart.id, payload);
        showToast('Rate chart updated successfully.', 'success');
      } else {
        await api.createRateChart(payload);
        showToast('Rate chart created successfully.', 'success');
      }
      setFormOpen(false);
      fetchCharts();
    } catch (err: any) {
      showToast(err.message || 'Failed to save rate chart.', 'error');
    }
  };

  const handleDelete = async (chart: RateChart) => {
    if (!isAdminOrManager) {
      showToast('Action Forbidden: Managerial credentials required.', 'error');
      return;
    }

    const approved = await confirm({
      title: 'Delete Rate Chart',
      message: `Are you absolutely sure you want to delete "${chart.name}"? This action is irreversible.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel'
    });

    if (approved) {
      try {
        await api.deleteRateChart(chart.id);
        showToast('Rate chart deleted successfully.', 'success');
        fetchCharts();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete rate chart.', 'error');
      }
    }
  };

  const filteredCharts = useMemo(() => {
    return charts.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchMilk = milkFilter === 'all' || c.milkType === milkFilter;
      const matchMethod = methodFilter === 'all' || c.pricingMethod === methodFilter;
      return matchSearch && matchMilk && matchMethod;
    });
  }, [charts, search, milkFilter, methodFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Milk Rate Management</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
            Configure dynamic Fat/SNF rate matrices, adjust base rates, and manage effective dates with full RBAC audit logs.
          </p>
        </div>

        {isAdminOrManager && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all duration-150 shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Rate Chart
          </button>
        )}
      </div>

      {/* Control Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search rate charts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl text-sm focus:outline-hidden focus:border-teal-500 dark:focus:border-teal-500 text-slate-700 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={milkFilter}
            onChange={(e: any) => setMilkFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Milk Types</option>
            <option value="COW">Cow Milk Only</option>
            <option value="BUFFALO">Buffalo Milk Only</option>
            <option value="MIXED">Mixed Milk Only</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e: any) => setMethodFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Pricing Methods</option>
            <option value="FAT_ONLY">Fat Only</option>
            <option value="SNF_ONLY">SNF Only</option>
            <option value="FAT_SNF_SOLIDS">Fat + SNF (Solids)</option>
          </select>
        </div>
      </div>

      {/* Main Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
          <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
          <p className="text-slate-500 text-sm mt-2 font-medium">Fetching active charts...</p>
        </div>
      ) : filteredCharts.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-700" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mt-2">No Rate Charts Found</h3>
          <p className="text-slate-400 text-sm max-w-sm mt-1">
            Create standard pricing templates to automate dairy procurement and farmers milk intake calculations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCharts.map((chart) => (
            <div 
              key={chart.id} 
              className={`p-6 bg-white dark:bg-slate-900 rounded-2xl border ${chart.isActive ? 'border-teal-500/20' : 'border-slate-100 dark:border-slate-800'} shadow-xs hover:shadow-md transition-all duration-200`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{chart.name}</h3>
                    {chart.isActive ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full border border-emerald-200/50 dark:border-emerald-800/30">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-semibold rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> {chart.milkType} Milk
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Shift: {chart.shift || 'BOTH'}
                    </span>
                  </div>
                </div>

                {isAdminOrManager && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(chart)}
                      className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg transition-colors"
                      title="Edit Rate Chart"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(chart)}
                      className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                      title="Delete Rate Chart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Chart details bento layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/50">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Pricing Method</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    {chart.pricingMethod === 'FAT_SNF_SOLIDS' ? 'Fat + SNF Solids' : chart.pricingMethod}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Base Rate (per L)</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">Rs. {chart.baseRate.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Effective From</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> {new Date(chart.effectiveFrom).toLocaleDateString()}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 col-span-2 sm:col-span-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Quality Standards & Premium Slopes</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400">Fat Standard:</span>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{chart.fatStandard}%</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">SNF Standard:</span>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{chart.snfStandard}%</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Fat Slope (per +0.1%):</span>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Rs. {chart.fatPremium.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">SNF Slope (per +0.1%):</span>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Rs. {chart.snfPremium.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over or Modal form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingChart ? 'Edit Rate Chart' : 'Create New Rate Chart'}
              </h2>
              <button 
                onClick={() => setFormOpen(false)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Chart Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Standard Cow Premium Matrix"
                  className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-teal-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Milk Type</label>
                  <select
                    value={formMilkType}
                    onChange={(e: any) => setFormMilkType(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-teal-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="COW">Cow Milk</option>
                    <option value="BUFFALO">Buffalo Milk</option>
                    <option value="MIXED">Mixed Milk</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Pricing Engine Method</label>
                  <select
                    value={formPricingMethod}
                    onChange={(e: any) => setFormPricingMethod(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-teal-500 text-slate-800 dark:text-slate-100"
                  >
                    <option value="FAT_SNF_SOLIDS">Fat + SNF (Solids Calculator)</option>
                    <option value="FAT_ONLY">Fat Only Pricing</option>
                    <option value="SNF_ONLY">SNF Only Pricing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Base Rate (per Liter)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formBaseRate}
                    onChange={(e) => setFormBaseRate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-teal-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={formEffectiveFrom}
                    onChange={(e) => setFormEffectiveFrom(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:border-teal-500 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="col-span-4 mb-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Calibration Targets & Premiums</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">Fat Std (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formFatStandard}
                    onChange={(e) => setFormFatStandard(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">SNF Std (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formSnfStandard}
                    onChange={(e) => setFormSnfStandard(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">Fat Slope (Rs)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formFatPremium}
                    onChange={(e) => setFormFatPremium(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500">SNF Slope (Rs)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formSnfPremium}
                    onChange={(e) => setFormSnfPremium(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Shift Target</label>
                  <select
                    value={formShift}
                    onChange={(e: any) => setFormShift(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="BOTH">Both (Morning + Evening)</option>
                    <option value="MORNING">Morning Shift Only</option>
                    <option value="EVENING">Evening Shift Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded-sm"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mark as Active Chart
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
