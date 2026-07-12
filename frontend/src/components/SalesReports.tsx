import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Filter, Printer, Download, Calendar, TrendingUp, Users, 
  Tag, AlertTriangle, ShieldAlert, CheckCircle, RefreshCw, BarChart3, PieChart
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { api } from '../utils/api';
import { SessionData } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface SalesReportsProps {
  session: SessionData;
}

export function SalesReports({ session }: SalesReportsProps) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeReportTab, setActiveReportTab] = useState<'register' | 'outstanding' | 'products' | 'ledgers'>('register');

  // Filter params
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Loaded customer ledger state (for ledger explorer tab)
  const [ledgerCustId, setLedgerCustId] = useState('');
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  // Load baseline reports data
  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, custData, prodData] = await Promise.all([
        api.getSalesInvoices(),
        api.getCustomers(),
        api.getProducts()
      ]);
      setInvoices(invData);
      setCustomers(custData);
      setProducts(prodData);

      if (custData.length > 0 && !ledgerCustId) {
        setLedgerCustId(custData[0].id);
      }
    } catch (err: any) {
      showToast('Error building sales analytical reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch ledger whenever ledger explorer dropdown changes
  useEffect(() => {
    if (activeReportTab === 'ledgers' && ledgerCustId) {
      api.getCustomerLedger(ledgerCustId)
        .then(data => setLedgerEntries(data))
        .catch(() => showToast('Error pulling detailed ledger log.', 'error'));
    }
  }, [ledgerCustId, activeReportTab]);

  // Date filter logic for sales register
  const filteredInvoices = invoices.filter(inv => {
    const invDate = inv.invoiceDate;
    const matchesDates = invDate >= startDate && invDate <= endDate;
    const matchesCustomer = selectedCustomerId === 'all' || inv.customerId === selectedCustomerId;
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesDates && matchesCustomer && matchesSearch;
  });

  // KPI calculations
  const totalSalesRevenue = filteredInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalTaxCollected = filteredInvoices.reduce((acc, i) => acc + (i.gstAmount || 0), 0);
  const totalDiscountsGranted = filteredInvoices.reduce((acc, i) => acc + (i.discount || 0), 0);
  const totalOutstandingDebits = customers.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);

  // Daily Sales aggregating for Recharts
  const getDailySalesData = () => {
    const datesMap: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      const d = inv.invoiceDate;
      datesMap[d] = (datesMap[d] || 0) + (inv.totalAmount || 0);
    });

    return Object.entries(datesMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const dailySalesChartData = getDailySalesData();

  // Product level aggregated sales
  const getProductSalesBreakdown = () => {
    const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    invoices.forEach(inv => {
      if (inv.invoiceDate >= startDate && inv.invoiceDate <= endDate) {
        (inv.items || []).forEach((item: any) => {
          if (!productStats[item.productId]) {
            productStats[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
          }
          productStats[item.productId].quantity += item.quantity;
          productStats[item.productId].revenue += item.totalAmount;
        });
      }
    });

    return Object.values(productStats).sort((a, b) => b.revenue - a.revenue);
  };

  const productBreakdown = getProductSalesBreakdown();

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  // CSV Exporter for Invoices
  const exportRegisterCSV = () => {
    const headers = ['Invoice Number,Date,Customer,Subtotal (Taxable),GST Tax Collected,Discounts,Grand Total,Settlement Status'];
    const rows = filteredInvoices.map(inv => 
      `"${inv.invoiceNumber}","${inv.invoiceDate}","${inv.customerName}",${inv.subtotal},${inv.gstAmount},${inv.discount},${inv.totalAmount},"${inv.paymentStatus}"`
    );
    const content = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dairysphere_SalesRegister_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sales Register CSV exported', 'success');
  };

  const exportOutstandingCSV = () => {
    const headers = ['Customer Code,Name,Email,Category,GSTIN,Credit Limit,Outstanding Balance,Credit Utilization (%)'];
    const rows = customers.map(c => {
      const util = c.creditLimit ? Math.round((c.outstandingBalance / c.creditLimit) * 100) : 0;
      return `"${c.code}","${c.name}","${c.email}","${c.category}","${c.gstNumber}",${c.creditLimit},${c.outstandingBalance},${util}`;
    });
    const content = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dairysphere_CreditOutstandingReport_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer Outstanding balance report CSV exported', 'success');
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Commercial Audit & Sales Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Analyze product performance, monitor credit exposure limits, check daily sales registers and print audit reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report Sheet
          </button>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveReportTab('register')}
          className={`pb-3 px-4 font-bold text-xs transition border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'register'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Sales Register & Daily Sales
        </button>
        <button
          onClick={() => setActiveReportTab('outstanding')}
          className={`pb-3 px-4 font-bold text-xs transition border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'outstanding'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          Outstanding Balances & Credit Util
        </button>
        <button
          onClick={() => setActiveReportTab('products')}
          className={`pb-3 px-4 font-bold text-xs transition border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'products'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Tag className="w-4 h-4" />
          Product Performance Breakdown
        </button>
        <button
          onClick={() => setActiveReportTab('ledgers')}
          className={`pb-3 px-4 font-bold text-xs transition border-b-2 flex items-center gap-1.5 ${
            activeReportTab === 'ledgers'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          Customer Ledger Statement Explorer
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Compiling ledger values...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: SALES REGISTER */}
          {activeReportTab === 'register' && (
            <div className="space-y-6">
              {/* REGISTER DATES CONTROLLER */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm items-center">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-xs font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium"
                  >
                    <option value="all">All Buyer Accounts</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={exportRegisterCSV}
                  className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold transition hover:bg-indigo-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Register CSV
                </button>
              </div>

              {/* STATISTICAL ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Filtered Revenue</span>
                  <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">Rs. {totalSalesRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">GST Taxes Collected</span>
                  <p className="text-xl font-bold text-emerald-600 font-mono">Rs. {totalTaxCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Total Sales Discounts</span>
                  <p className="text-xl font-bold text-rose-500 font-mono">Rs. {totalDiscountsGranted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Consolidated Outstanding Debits</span>
                  <p className="text-xl font-bold text-slate-800 dark:text-white font-mono">Rs. {totalOutstandingDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* CHART VISUALS */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  Daily Gross Sales Performance Chart
                </h3>

                {dailySalesChartData.length === 0 ? (
                  <div className="py-24 text-center text-xs text-slate-400">
                    No transactions to plot. Adjust active date range to load metrics.
                  </div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailySalesChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                        <Tooltip formatter={(value) => [`Rs. ${Number(value).toFixed(2)}`, 'Revenue']} />
                        <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* REGISTER TRANS ACTIONS DETAIL LIST */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Sales Ledger audit register ({filteredInvoices.length} invoices)</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-4.5">Invoice No.</th>
                        <th className="py-2.5 px-4.5">Date</th>
                        <th className="py-2.5 px-4.5">Customer Name</th>
                        <th className="py-2.5 px-4.5 text-right">Taxable Subtotal</th>
                        <th className="py-2.5 px-4.5 text-right">Taxes (GST)</th>
                        <th className="py-2.5 px-4.5 text-right">Discounts Granted</th>
                        <th className="py-2.5 px-4.5 text-right font-bold">Grand Total Amount</th>
                        <th className="py-2.5 px-4.5 text-center">Settlement Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4.5 font-mono text-slate-900 dark:text-white font-bold">{inv.invoiceNumber}</td>
                          <td className="py-3 px-4.5 font-mono text-slate-500">{inv.invoiceDate}</td>
                          <td className="py-3 px-4.5 font-bold text-slate-800 dark:text-slate-200">{inv.customerName}</td>
                          <td className="py-3 px-4.5 text-right font-mono">Rs. {Number(inv.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4.5 text-right font-mono text-slate-500">Rs. {Number(inv.gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4.5 text-right font-mono text-rose-500">Rs. {Number(inv.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4.5 text-right font-mono font-bold text-slate-950 dark:text-white">Rs. {Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black ${
                              inv.paymentStatus === 'PAID' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' 
                                : inv.paymentStatus === 'PARTIAL'
                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
                            }`}>
                              {inv.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OUTSTANDING REPORT */}
          {activeReportTab === 'outstanding' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Commercial outstanding balances</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Summary of commercial credit limits and risk profiles.</p>
                </div>
                <button
                  onClick={exportOutstandingCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Outstanding CSV
                </button>
              </div>

              {/* TABLE LISTING */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-900">
                        <th className="py-3 px-4.5">Client Code</th>
                        <th className="py-3 px-4.5">Customer / Entity Name</th>
                        <th className="py-3 px-4.5">Buyer Class</th>
                        <th className="py-3 px-4.5 text-right">Credit Limit</th>
                        <th className="py-3 px-4.5 text-right">Outstanding Debt</th>
                        <th className="py-3 px-4.5">Credit Utilization Bar</th>
                        <th className="py-3 px-4.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {customers.map((c) => {
                        const utilPercent = c.creditLimit ? Math.round((c.outstandingBalance / c.creditLimit) * 100) : 0;
                        const isRisk = utilPercent > 80;

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50">
                            <td className="py-3.5 px-4.5 font-mono text-slate-400 font-bold">{c.code}</td>
                            <td className="py-3.5 px-4.5 font-bold text-slate-950 dark:text-white">{c.name}</td>
                            <td className="py-3.5 px-4.5">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800">
                                {c.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-4.5 text-right font-mono text-slate-700 dark:text-slate-300">Rs. {Number(c.creditLimit).toLocaleString()}</td>
                            <td className={`py-3.5 px-4.5 text-right font-mono font-bold ${c.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              Rs. {Number(c.outstandingBalance || 0).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4.5 w-64">
                              <div className="space-y-1">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                                  <div 
                                    className={`h-full rounded-full ${isRisk ? 'bg-rose-500' : 'bg-indigo-600'}`}
                                    style={{ width: `${Math.min(100, utilPercent)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                  <span className="flex items-center gap-0.5">
                                    {isRisk && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                                    {utilPercent}% Utilized
                                  </span>
                                  <span>{c.creditLimit ? 'Limit Controlled' : 'Unlimited Cash Only'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4.5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCT SALES */}
          {activeReportTab === 'products' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Quantity sold by product catalog item</h3>
                
                {productBreakdown.length === 0 ? (
                  <div className="py-24 text-center text-xs text-slate-400">
                    No transactions plotted within selected date bounds.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CHART */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={productBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: '9px' }} />
                          <YAxis stroke="#94a3b8" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                          <Tooltip formatter={(value) => [`Rs. ${Number(value).toFixed(2)}`, 'Revenue']} />
                          <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50">
                            <th className="py-2 px-3">Product Name</th>
                            <th className="py-2 px-3 text-right">Volume / Qty Sold</th>
                            <th className="py-2 px-3 text-right font-bold">Total Sales Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {productBreakdown.map((prod, index) => (
                            <tr key={index}>
                              <td className="py-2.5 px-3 font-semibold">{prod.name}</td>
                              <td className="py-2.5 px-3 text-right font-mono">{prod.quantity.toLocaleString()} units</td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">Rs. {prod.revenue.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: LEDGER STATEMENT EXPLORER */}
          {activeReportTab === 'ledgers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm items-center">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Select Customer Account</label>
                  <select
                    value={ledgerCustId}
                    onChange={(e) => setLedgerCustId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handlePrint}
                  className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold transition hover:bg-indigo-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Statement
                </button>
              </div>

              {/* OUTSTANDING STATEMENT */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Transaction Date</th>
                        <th className="py-2.5 px-3">Reference / ID</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3 text-right">Debit (+)</th>
                        <th className="py-2.5 px-3 text-right">Credit (-)</th>
                        <th className="py-2.5 px-3 text-right font-bold">Running Balance</th>
                        <th className="py-2.5 px-3">Remarks / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ledgerEntries.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-slate-400 text-xs">No account statement entries recorded for this buyer.</td>
                        </tr>
                      ) : (
                        ledgerEntries.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-mono font-medium text-slate-500">{log.date}</td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{log.referenceNumber}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black ${
                                log.type === 'INVOICE' 
                                  ? 'bg-rose-50 text-rose-600' 
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {log.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                              {log.debit > 0 ? `Rs. ${log.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                              {log.credit > 0 ? `Rs. ${log.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              Rs. {log.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3 px-3 text-slate-500 text-[10px] italic leading-tight max-w-xs truncate" title={log.remarks}>
                              {log.remarks}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
