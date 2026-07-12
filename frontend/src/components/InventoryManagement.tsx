import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { Product, Warehouse, ProductStock, StockEntry, StockTransfer, SessionData } from '../types';
import { 
  Database, Plus, Search, Filter, RefreshCw, AlertCircle, TrendingUp, CheckCircle2, 
  ArrowLeftRight, FileText, ChevronLeft, ChevronRight, SlidersHorizontal, Info, ShieldAlert,
  MapPin, ClipboardCheck, ArrowUpRight, ArrowDownLeft, Trash2, PieChart as PieIcon, Layers, X
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, 
  PieChart, Pie, Legend
} from 'recharts';

interface InventoryManagementProps {
  session: SessionData | null;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ session }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  // Sub-tabs
  const [subTab, setSubTab] = useState<'dashboard' | 'stock' | 'warehouses' | 'entries' | 'transfers' | 'reconciliation'>('dashboard');

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<ProductStock[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');

  // Modals state
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  // Form Fields - Warehouse
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whAddress, setWhAddress] = useState('');

  // Form Fields - Stock Entry
  const [entryProductId, setEntryProductId] = useState('');
  const [entryWarehouseId, setEntryWarehouseId] = useState('');
  const [entryQuantity, setEntryQuantity] = useState('');
  const [entryType, setEntryType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'VERIFICATION'>('STOCK_IN');
  const [entryReason, setEntryReason] = useState('');
  const [entryBatchNumber, setEntryBatchNumber] = useState('');
  const [entryExpiryDate, setEntryExpiryDate] = useState('');
  const [entryMfgDate, setEntryMfgDate] = useState('');

  // Form Fields - Stock Transfer
  const [trfProductId, setTrfProductId] = useState('');
  const [trfFromWarehouseId, setTrfFromWarehouseId] = useState('');
  const [trfToWarehouseId, setTrfToWarehouseId] = useState('');
  const [trfQuantity, setTrfQuantity] = useState('');
  const [trfRemarks, setTrfRemarks] = useState('');

  // Physical stock verification
  const [verifyProductId, setVerifyProductId] = useState('');
  const [verifyWarehouseId, setVerifyWarehouseId] = useState('');
  const [verifyPhysicalQty, setVerifyPhysicalQty] = useState('');
  const [verifyDifference, setVerifyDifference] = useState<number | null>(null);

  // Role Permissions Check
  const canWrite = useMemo(() => {
    const role = session?.user?.role || localStorage.getItem('dairysphere_user_role') || 'ADMIN';
    return ['ADMIN', 'MANAGER', 'OPERATOR'].includes(role.toUpperCase());
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const prods = await api.getProducts();
      setProducts(prods);

      const whs = await api.getWarehouses();
      setWarehouses(whs);

      const stk = await api.getInventoryStock({
        warehouseId: warehouseFilter,
        search: searchQuery
      });
      setStocks(stk);

      const ent = await api.getStockEntries();
      setStockEntries(ent);

      // Fetch transfers from local storage to keep simulated sync
      const trfs = JSON.parse(localStorage.getItem('ds_stock_transfers') || '[]');
      setStockTransfers(trfs);

    } catch (err: any) {
      showToast(err.message || 'Error loading inventory modules.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab, warehouseFilter, searchQuery]);

  // Handle Dynamic Difference Calculation during stock physical verification
  useEffect(() => {
    if (verifyProductId && verifyWarehouseId && verifyPhysicalQty) {
      const record = stocks.find(s => s.productId === verifyProductId && s.warehouseId === verifyWarehouseId);
      const currentVal = record ? Number(record.quantity) : 0;
      const physicalVal = Number(verifyPhysicalQty) || 0;
      setVerifyDifference(physicalVal - currentVal);
    } else {
      setVerifyDifference(null);
    }
  }, [verifyProductId, verifyWarehouseId, verifyPhysicalQty, stocks]);

  // Alert metrics
  const lowStockAlerts = useMemo(() => {
    return stocks.filter(s => s.quantity <= s.minStock);
  }, [stocks]);

  const totalInventoryValuation = useMemo(() => {
    return stocks.reduce((acc, current) => {
      const matchingProd = products.find(p => p.id === current.productId);
      const cost = matchingProd?.costPrice || matchingProd?.price || 0;
      return acc + (current.quantity * cost);
    }, 0);
  }, [stocks, products]);

  // Warehouse charts data structure
  const chartDataValuation = useMemo(() => {
    return warehouses.map(w => {
      const wStocks = stocks.filter(s => s.warehouseId === w.id);
      const val = wStocks.reduce((total, s) => {
        const prod = products.find(p => p.id === s.productId);
        const cost = prod?.costPrice || prod?.price || 0;
        return total + (s.quantity * cost);
      }, 0);
      return {
        name: w.name,
        value: Math.round(val)
      };
    }).filter(item => item.value > 0);
  }, [warehouses, stocks, products]);

  const chartDataQuantity = useMemo(() => {
    return products.slice(0, 8).map(p => {
      const qtySum = stocks.filter(s => s.productId === p.id).reduce((sum, s) => sum + s.quantity, 0);
      return {
        name: p.name.substring(0, 15) + '...',
        Quantity: qtySum
      };
    });
  }, [products, stocks]);

  // Handle Save Warehouse
  const handleSaveWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName || !whCode) {
      showToast('Name and Warehouse Code are required.', 'error');
      return;
    }
    try {
      await api.createWarehouse({
        name: whName,
        code: whCode,
        address: whAddress
      });
      showToast('Warehouse registered successfully.', 'success');
      setWarehouseModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create warehouse.', 'error');
    }
  };

  // Handle Create Stock Entry
  const handleSaveStockEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryProductId || !entryWarehouseId || !entryQuantity) {
      showToast('Product, Warehouse and Quantity are required.', 'error');
      return;
    }

    try {
      await api.createStockEntry({
        productId: entryProductId,
        warehouseId: entryWarehouseId,
        quantity: parseFloat(entryQuantity),
        type: entryType,
        reason: entryReason,
        batchNumber: entryBatchNumber,
        expiryDate: entryExpiryDate,
        manufacturingDate: entryMfgDate
      });
      showToast('Stock ledger updated successfully.', 'success');
      setEntryModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Stock entry transaction rejected.', 'error');
    }
  };

  // Handle Save Stock Transfer
  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trfProductId || !trfFromWarehouseId || !trfToWarehouseId || !trfQuantity) {
      showToast('All fields are required.', 'error');
      return;
    }

    try {
      await api.createStockTransfer({
        productId: trfProductId,
        fromWarehouseId: trfFromWarehouseId,
        toWarehouseId: trfToWarehouseId,
        quantity: parseFloat(trfQuantity),
        remarks: trfRemarks
      });
      showToast('Inter-warehouse stock transfer completed.', 'success');
      setTransferModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Transfer failed.', 'error');
    }
  };

  // Handle Save Physical Reconciliation Verification
  const handleSaveVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyProductId || !verifyWarehouseId || !verifyPhysicalQty) {
      showToast('Please specify product, warehouse and verified quantity.', 'error');
      return;
    }

    try {
      const targetQty = parseFloat(verifyPhysicalQty);
      const record = stocks.find(s => s.productId === verifyProductId && s.warehouseId === verifyWarehouseId);
      const currentVal = record ? Number(record.quantity) : 0;
      const difference = targetQty - currentVal;

      if (difference === 0) {
        showToast('Physical stock matches current ledger values exactly.', 'info');
        return;
      }

      await api.createStockEntry({
        productId: verifyProductId,
        warehouseId: verifyWarehouseId,
        quantity: targetQty,
        type: 'VERIFICATION',
        reason: `Physical reconciliation audit adjustment. Discrepancy: ${difference > 0 ? '+' : ''}${difference} units`,
        batchNumber: record?.batchNumber || 'AUDIT-ADJ'
      });

      showToast('Physical verification audited and stock ledger adjusted.', 'success');
      setVerifyProductId('');
      setVerifyPhysicalQty('');
      setVerifyDifference(null);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Audit adjustment failed.', 'error');
    }
  };

  const COLORS = ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4'];

  return (
    <div id="inventory-management-wrapper" className="space-y-6">
      
      {/* 1. Header Control Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/50 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Inventory & Logistics Engine</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Track current stock levels, low-stock alerts, and perform warehouse reconciliations.</p>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-850 p-1 rounded-xl gap-0.5">
          {['dashboard', 'stock', 'entries', 'transfers', 'reconciliation', 'warehouses'].map((t) => (
            <button
              key={t}
              onClick={() => setSubTab(t as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                subTab === t
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'dashboard' && (
        <>
          {/* ANALYTICS HIGHLIGHT METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Valuation</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹{totalInventoryValuation.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
              <span className="text-[10px] text-teal-600 font-bold block mt-0.5">Total cost valuation in hand</span>
            </div>

            {/* Metric 2 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Registered Warehouses</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{warehouses.length}</div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Physical storage hubs</span>
            </div>

            {/* Metric 3 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Low Stock Triggers</span>
              <div className="text-2xl font-black text-rose-600 mt-1">{lowStockAlerts.length}</div>
              <span className="text-[10px] text-rose-500 font-bold block mt-0.5">Require immediate reorder</span>
            </div>

            {/* Metric 4 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Stock movements logs</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stockEntries.length}</div>
              <span className="text-[10px] text-teal-600 font-bold block mt-0.5">Total logged adjustments</span>
            </div>
          </div>

          {/* LOW STOCK & BULK WARNING PANELS */}
          {lowStockAlerts.length > 0 && (
            <div className="bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-3">
                <ShieldAlert className="w-10 h-10 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-wider">Critical Low Stock Threshold Alerts ({lowStockAlerts.length})</h3>
                  <p className="text-[11px] text-slate-500">The following product stocks have fallen below the configured minimum safety levels. Procurement orders should be initialized immediately.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 max-w-lg">
                {lowStockAlerts.slice(0, 3).map(al => (
                  <span key={al.id} className="px-2 py-1 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-lg text-[10px] font-bold text-red-700">
                    {al.productName}: {al.quantity} {al.minStock ? `/ Min: ${al.minStock}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CHARTS CONTAINER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Valuation Share */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Storage Hubs Valuation Share (₹)</h3>
              <div className="h-64 flex justify-center items-center">
                {chartDataValuation.length === 0 ? (
                  <p className="text-xs text-slate-500 font-bold">No stock data available to map valuation.</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartDataValuation}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartDataValuation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Legend formatter={(value) => <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Product Volume Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs transition-colors">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Registered Products Volume Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataQuantity}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b' }} />
                    <Tooltip />
                    <Bar dataKey="Quantity" fill="#0d9488" radius={[4, 4, 0, 0]}>
                      {chartDataQuantity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {subTab === 'stock' && (
        <>
          {/* SEARCH & WAREHOUSE FILTERS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between transition-colors shadow-xs">
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search product SKU, name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Storage Hubs</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {canWrite && (
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => setEntryModalOpen(true)}
                  className="flex-1 md:flex-none bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Manual Stock Adjustment
                </button>
              </div>
            )}
          </div>

          {/* CURRENT STOCK TABLE */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-855 bg-slate-50/50 dark:bg-slate-900/60">
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">SKU & Product</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Storage Hub</th>
                    <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Current Qty</th>
                    <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Thresholds (Min / Max)</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Batch & Expiry</th>
                    <th className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Safety Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
                  {stocks.map(stk => {
                    const isLow = stk.quantity <= stk.minStock;
                    const isOver = stk.quantity >= stk.maxStock;
                    return (
                      <tr key={stk.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-mono text-[9px] font-bold text-teal-600 uppercase block mb-0.5">{stk.productSku}</span>
                          <span className="text-xs font-black text-slate-900 dark:text-white block">{stk.productName}</span>
                        </td>
                        <td className="px-5 py-3 text-xs font-bold text-slate-600 dark:text-slate-350">
                          {stk.warehouseName}
                        </td>
                        <td className="px-5 py-3 text-right text-xs font-extrabold text-slate-800 dark:text-white">
                          {stk.quantity.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right text-xs text-slate-500 font-mono">
                          {stk.minStock} / {stk.maxStock}
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            Batch: <span className="font-mono text-teal-600">{stk.batchNumber || 'N/A'}</span>
                          </div>
                          {stk.expiryDate && (
                            <div className="text-[10px] text-slate-400">Exp: {new Date(stk.expiryDate).toLocaleDateString()}</div>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${
                            isLow 
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse' 
                              : isOver 
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40' 
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          }`}>
                            {isLow ? 'CRITICAL LOW' : isOver ? 'OVERSTOCK' : 'OPTIMAL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {subTab === 'entries' && (
        <>
          {/* STOCK LOGS LEDGER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-855 flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Immutable Stock Ledger History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-855 bg-slate-50/50 dark:bg-slate-900/60">
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Entry Ref</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Date</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Product Specification</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Warehouse Location</th>
                    <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Delta Qty</th>
                    <th className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Transaction Type</th>
                    <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Performed By & Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
                  {stockEntries.map(ent => (
                    <tr key={ent.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {ent.entryNumber}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(ent.createdAt).toLocaleDateString()} {new Date(ent.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-mono text-[9px] font-bold text-teal-600 uppercase block mb-0.5">{ent.productSku}</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">{ent.productName}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-350 font-bold">
                        {ent.warehouseName}
                      </td>
                      <td className="px-5 py-3 text-right text-xs font-black">
                        {ent.type === 'STOCK_OUT' ? '-' : '+'}{ent.quantity.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${
                          ent.type === 'STOCK_IN' 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40' 
                            : ent.type === 'STOCK_OUT' 
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40'
                        }`}>
                          {ent.type === 'STOCK_IN' && <ArrowDownLeft className="w-3 h-3 text-emerald-600" />}
                          {ent.type === 'STOCK_OUT' && <ArrowUpRight className="w-3 h-3 text-rose-600" />}
                          {ent.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{ent.performedBy}</div>
                        <div className="text-[10px] leading-tight text-slate-450 dark:text-slate-500 italic mt-0.5">{ent.reason || 'General inventory adjustment.'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {subTab === 'transfers' && (
        <>
          {/* SEARCH & TRANSFER ACTION BAR */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-center shadow-xs">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Inter-Warehouse Relocations</h3>
            {canWrite && (
              <button
                onClick={() => setTransferModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Initialize Stock Transfer
              </button>
            )}
          </div>

          {/* STOCK TRANSFERS REGISTER */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
            {stockTransfers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold">No inter-warehouse transfers recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-855 bg-slate-50/50 dark:bg-slate-900/60">
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Transfer No</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Product Name</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Source Location</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Destination Location</th>
                      <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Quantity</th>
                      <th className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Audit details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
                    {stockTransfers.map(trf => (
                      <tr key={trf.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{trf.transferNumber}</td>
                        <td className="px-5 py-3 text-xs font-black text-slate-900 dark:text-white">{trf.productName}</td>
                        <td className="px-5 py-3 text-xs text-slate-500 font-bold">{trf.fromWarehouseName}</td>
                        <td className="px-5 py-3 text-xs text-slate-500 font-bold">{trf.toWarehouseName}</td>
                        <td className="px-5 py-3 text-right text-xs font-black">{trf.quantity.toLocaleString()}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black tracking-widest rounded-full uppercase">
                            {trf.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-400">
                          <div>By: {trf.performedBy}</div>
                          <div className="text-[10px] italic mt-0.5">{trf.remarks}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {subTab === 'reconciliation' && (
        <>
          {/* PHYSICAL STOCK RECONCILIATION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left side Verification form */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs h-fit">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Physical Verification</h3>
              </div>

              <form onSubmit={handleSaveVerification} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Product Item *</label>
                  <select
                    required
                    value={verifyProductId}
                    onChange={(e) => setVerifyProductId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="">Select product to audit...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Storage Hub Location *</label>
                  <select
                    required
                    value={verifyWarehouseId}
                    onChange={(e) => setVerifyWarehouseId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="">Select storage warehouse...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Physical Verified Quantity *</label>
                  <input
                    type="number"
                    required
                    placeholder="Enter absolute physical count..."
                    value={verifyPhysicalQty}
                    onChange={(e) => setVerifyPhysicalQty(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                {verifyDifference !== null && (
                  <div className={`p-4 rounded-xl border text-xs font-bold ${
                    verifyDifference === 0 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <div className="flex justify-between">
                      <span>Current System Qty:</span>
                      <span>
                        {(Number(verifyPhysicalQty) - verifyDifference).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Physical Audit Variance:</span>
                      <span>
                        {verifyDifference > 0 ? `+${verifyDifference}` : verifyDifference} units
                      </span>
                    </div>
                    <div className="text-[10px] leading-normal font-medium mt-2 italic text-slate-500">
                      {verifyDifference === 0 
                        ? 'No discrepancies detected. Ready to commit verification audit.'
                        : 'Saving will write a corrective VERIFICATION stock entry adjustment automatically.'}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canWrite}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  Commit Audit Verification
                </button>
              </form>
            </div>

            {/* Right side physical discrepancy alerts logs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Reconciliation Audit Trail</h3>
              
              <div className="space-y-2">
                {stockEntries.filter(e => e.type === 'VERIFICATION').length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No physical audits committed. Run reconciliation on the left.
                  </div>
                ) : (
                  stockEntries.filter(e => e.type === 'VERIFICATION').map(e => (
                    <div key={e.id} className="p-3 border border-slate-100 dark:border-slate-855 rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-mono text-[9px] font-bold text-teal-600 uppercase block">{e.productSku}</span>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white">{e.productName} ({e.warehouseName})</h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{e.reason}</span>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black rounded-full block uppercase">{e.type}</span>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white block mt-1">{e.quantity} units</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </>
      )}

      {subTab === 'warehouses' && (
        <>
          {/* WAREHOUSE LISTINGS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-center shadow-xs">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Cooperative Storage Facilities</h3>
            {canWrite && (
              <button
                onClick={() => {
                  setWhName('');
                  setWhCode('');
                  setWhAddress('');
                  setWarehouseModalOpen(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Storage Facility
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map(wh => (
              <div key={wh.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-teal-500/40 transition">
                <div className="space-y-3">
                  <div className="inline-flex p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{wh.name}</h3>
                    <span className="font-mono text-[9px] text-teal-600 font-bold block mt-0.5">FACILITY CODE: {wh.code}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {wh.address || 'No physical address added for this facility.'}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-855 flex justify-between text-[10px] text-slate-400">
                  <span>Registered: {new Date(wh.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 4. ADJUSTMENT / STOCK ENTRY DIALOG MODAL */}
      {entryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="h-14 border-b border-slate-100 dark:border-slate-800 px-6 flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Manual Inventory Stock Entry</h2>
              <button onClick={() => setEntryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStockEntry} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Select Product *</label>
                <select
                  required
                  value={entryProductId}
                  onChange={(e) => setEntryProductId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Select Storage Location *</label>
                <select
                  required
                  value={entryWarehouseId}
                  onChange={(e) => setEntryWarehouseId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="">Select storage location...</option>
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Delta Quantity *</label>
                  <input
                    type="number"
                    required
                    placeholder="Quantity..."
                    value={entryQuantity}
                    onChange={(e) => setEntryQuantity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Transaction Type *</label>
                  <select
                    required
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="STOCK_IN">STOCK IN (Add)</option>
                    <option value="STOCK_OUT">STOCK OUT (Subtract)</option>
                    <option value="ADJUSTMENT">DIRECT ADJUSTMENT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Batch Code Number</label>
                <input
                  type="text"
                  placeholder="e.g. B-CG0630"
                  value={entryBatchNumber}
                  onChange={(e) => setEntryBatchNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Manufacturing Date</label>
                  <input
                    type="date"
                    value={entryMfgDate}
                    onChange={(e) => setEntryMfgDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Expiry Date</label>
                  <input
                    type="date"
                    value={entryExpiryDate}
                    onChange={(e) => setEntryExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Adjustment Reason *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summarize the core reason for stock modifications..."
                  value={entryReason}
                  onChange={(e) => setEntryReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEntryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700"
                >
                  Commit Stock Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. TRANSFER STOCK DIALOG MODAL */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="h-14 border-b border-slate-100 dark:border-slate-800 px-6 flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Initialize Warehouse Transfer</h2>
              <button onClick={() => setTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransfer} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Product to Transfer *</label>
                <select
                  required
                  value={trfProductId}
                  onChange={(e) => setTrfProductId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Source Location *</label>
                  <select
                    required
                    value={trfFromWarehouseId}
                    onChange={(e) => setTrfFromWarehouseId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="">From facility...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Destination Location *</label>
                  <select
                    required
                    value={trfToWarehouseId}
                    onChange={(e) => setTrfToWarehouseId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="">To facility...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Transfer Quantity *</label>
                <input
                  type="number"
                  required
                  placeholder="Units to transfer..."
                  value={trfQuantity}
                  onChange={(e) => setTrfQuantity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Audit Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Replenish retail supply stocks"
                  value={trfRemarks}
                  onChange={(e) => setTrfRemarks(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700"
                >
                  Execute Relocation Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CREATE WAREHOUSE DIALOG MODAL */}
      {warehouseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="h-14 border-b border-slate-100 dark:border-slate-800 px-6 flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Add Storage Facility</h2>
              <button onClick={() => setWarehouseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWarehouse} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Warehouse Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Northern Cold Storage"
                    value={whName}
                    onChange={(e) => setWhName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Code Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="WH-NCS01"
                    value={whCode}
                    onChange={(e) => setWhCode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Physical Address</label>
                <textarea
                  rows={3}
                  placeholder="Detailed geographic delivery address..."
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setWarehouseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 animate-pulse-slow"
                >
                  Register Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
