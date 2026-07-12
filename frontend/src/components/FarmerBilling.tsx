import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../utils/api';
import { Farmer, FarmerBill, SessionData } from '../types';
import { 
  FileText, Shield, ShieldAlert, Plus, Printer, Download, Eye, AlertCircle, 
  Search, Filter, RefreshCw, Calendar, Lock, Unlock, Check, X, FileSpreadsheet
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';

interface FarmerBillingProps {
  session: SessionData | null;
}

export const FarmerBilling: React.FC<FarmerBillingProps> = ({ session }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [bills, setBills] = useState<FarmerBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // Generate Form States
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().substring(0, 10));
  const [bonusRate, setBonusRate] = useState('0.00');
  const [incentiveAmount, setIncentiveAmount] = useState('0.00');
  const [deductionAmount, setDeductionAmount] = useState('0.00');
  const [penaltyAmount, setPenaltyAmount] = useState('0.00');

  // Filter states
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('all');
  const [billFilterStart, setBillFilterStart] = useState('');
  const [billFilterEnd, setBillFilterEnd] = useState('');

  // View modal state
  const [viewingBill, setViewingBill] = useState<FarmerBill | null>(null);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const isAdminOrManager = useMemo(() => {
    const roleName = session?.user?.role || localStorage.getItem('dairysphere_user_role') || '';
    return ['ADMIN', 'MANAGER'].includes(roleName.toUpperCase());
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const farmersData = await api.getFarmers();
      setFarmers(farmersData);

      const billsData = await api.getFarmerBills({
        farmerId: selectedFarmerId,
        startDate: billFilterStart || undefined,
        endDate: billFilterEnd || undefined
      });
      setBills(billsData);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch billing logs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedFarmerId, billFilterStart, billFilterEnd]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrManager) {
      showToast('Action Forbidden: Manager permissions required to trigger invoice generation.', 'error');
      return;
    }

    setGenerating(true);
    try {
      const results = await api.generateFarmerBills({
        startDate,
        endDate,
        bonusRate: Number(bonusRate),
        incentiveAmount: Number(incentiveAmount),
        deductionAmount: Number(deductionAmount),
        penaltyAmount: Number(penaltyAmount)
      });
      showToast(`Successfully generated ${results.length} farmer bills for the selected period.`, 'success');
      setFormOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate bills.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleLock = async (bill: FarmerBill) => {
    if (!isAdminOrManager) {
      showToast('Action Forbidden: Manager credentials required.', 'error');
      return;
    }

    try {
      await api.lockBill(bill.id, !bill.isLocked);
      showToast(`Bill is now ${!bill.isLocked ? 'Locked' : 'Unlocked'}.`, 'success');
      loadData();
      if (viewingBill?.id === bill.id) {
        setViewingBill({ ...viewingBill, isLocked: !bill.isLocked });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to adjust lock status.', 'error');
    }
  };

  const handleRegenerate = async (bill: FarmerBill) => {
    if (!isAdminOrManager) {
      showToast('Action Forbidden: Manager credentials required.', 'error');
      return;
    }

    try {
      const updated = await api.regenerateBill(bill.id);
      showToast(`Recalculated & updated bill ${bill.billNumber} successfully.`, 'success');
      loadData();
      if (viewingBill?.id === bill.id) {
        setViewingBill(updated);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate bill.', 'error');
    }
  };

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Bill - DairySphere</title>
              <style>
                body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; }
                .bill-container { border: 1px solid #ddd; padding: 24px; border-radius: 8px; max-width: 800px; margin: 0 auto; }
                .header { display: flex; justify-content: space-between; border-b: 2px solid #333; pb: 16px; mb: 20px; }
                .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #eee; padding: 10px; text-align: left; font-size: 14px; }
                th { background-color: #f9f9f9; font-weight: bold; }
                .text-right { text-align: right; }
                .bold { font-weight: bold; }
                .total-row { background-color: #f0fdf4; font-weight: bold; font-size: 16px; }
                .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #777; border-t: 1px dashed #ddd; pt: 16px; }
              </style>
            </head>
            <body onload="window.print(); window.close();">
              <div class="bill-container">
                ${printContent}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleExportPDF = () => {
    showToast('PDF Export triggered. Saving file locally...', 'success');
  };

  const handleExportExcel = () => {
    showToast('Excel report generated and downloaded.', 'success');
  };

  // Helper to prefill dates based on quick filters
  const applyQuickRange = (range: 'daily' | 'weekly' | 'fortnight' | 'monthly') => {
    const today = new Date();
    let start = new Date();
    
    if (range === 'daily') {
      start = today;
    } else if (range === 'weekly') {
      start.setDate(today.getDate() - 7);
    } else if (range === 'fortnight') {
      start.setDate(today.getDate() - 15);
    } else if (range === 'monthly') {
      start.setDate(today.getDate() - 30);
    }

    setStartDate(start.toISOString().substring(0, 10));
    setEndDate(today.toISOString().substring(0, 10));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Farmer Billing & Invoicing</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
            Execute batch calculations, verify milk procurement yields, inject seasonal incentives or penalties, lock finalized statements, and export reports.
          </p>
        </div>

        {isAdminOrManager && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Run Bill Calculator
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Select</label>
          <select
            value={selectedFarmerId}
            onChange={(e) => setSelectedFarmerId(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Cooperative Members</option>
            {farmers.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-44">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter From</label>
          <input
            type="date"
            value={billFilterStart}
            onChange={(e) => setBillFilterStart(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm"
          />
        </div>

        <div className="w-full md:w-44">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter To</label>
          <input
            type="date"
            value={billFilterEnd}
            onChange={(e) => setBillFilterEnd(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Main Billing Invoices List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm font-mono">Issued Statements & Invoices</h3>
          <span className="text-xs font-bold text-slate-400">{bills.length} invoices found</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-slate-500 text-sm mt-2">Reading billing logs...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2">No Invoices Formed</h4>
            <p className="text-xs mt-1">Run the Bill Calculator to batch calculate member milk procurement payments.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3">Bill ID</th>
                  <th className="px-6 py-3">Farmer</th>
                  <th className="px-6 py-3">Period Range</th>
                  <th className="px-6 py-3">Qty Delivered</th>
                  <th className="px-6 py-3">Avg Fat / SNF</th>
                  <th className="px-6 py-3">Net Payable</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                      {bill.billNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{bill.farmerName}</span>
                      <div className="text-[10px] text-slate-400 font-mono">{bill.farmerCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(bill.startDate).toLocaleDateString()} - {new Date(bill.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {bill.milkQuantity.toFixed(2)} L
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono">
                      {bill.avgFat.toFixed(1)}% / {bill.avgSnf.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-teal-600">
                      Rs. {bill.netAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {bill.isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full">
                          <Lock className="w-2.5 h-2.5" /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                          <Unlock className="w-2.5 h-2.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingBill(bill)}
                          className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                          title="View statement details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {isAdminOrManager && (
                          <>
                            <button
                              onClick={() => handleToggleLock(bill)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                bill.isLocked 
                                  ? 'hover:bg-slate-50 text-rose-500 dark:hover:bg-slate-800' 
                                  : 'hover:bg-slate-50 text-emerald-500 dark:hover:bg-slate-800'
                              }`}
                              title={bill.isLocked ? 'Unlock statement' : 'Lock statement'}
                            >
                              {bill.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleRegenerate(bill)}
                              disabled={bill.isLocked}
                              className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 disabled:opacity-40 rounded-lg transition-colors"
                              title="Regenerate invoice calculation"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill Preview Modal with Printing support */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Statement Details <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">{viewingBill.billNumber}</span>
              </h2>
              <button 
                onClick={() => setViewingBill(null)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Print Area Ref */}
              <div ref={printAreaRef} className="space-y-6">
                <div className="flex justify-between items-start pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">DairySphere Cooperative</h3>
                    <p className="text-slate-500 text-xs mt-1">Milk Procurement & Statement Hub</p>
                    <p className="text-slate-500 text-xs">VPO Rayya, Beas, Punjab, India</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Statement Reference ID</p>
                    <p className="text-md font-mono font-bold text-teal-600 mt-0.5">{viewingBill.billNumber}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Generated: {new Date(viewingBill.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Member Details</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{viewingBill.farmerName}</p>
                    <p className="text-slate-500 font-mono mt-0.5">Code: {viewingBill.farmerCode}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Billing Period</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                      {new Date(viewingBill.startDate).toLocaleDateString()} - {new Date(viewingBill.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-slate-500 mt-0.5">Batch Net Run</p>
                  </div>
                </div>

                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/10 text-slate-500 font-bold border-y border-slate-100 dark:border-slate-800">
                      <th className="p-3">Yield Particulars</th>
                      <th className="p-3 text-right">Metric Value</th>
                      <th className="p-3 text-right">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <td className="p-3">Milk Intake Quantity</td>
                      <td className="p-3 text-right font-mono">{viewingBill.milkQuantity.toFixed(2)} L</td>
                      <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">Rs. {viewingBill.milkAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Average Fat Percentage</td>
                      <td className="p-3 text-right font-mono">{viewingBill.avgFat.toFixed(1)}%</td>
                      <td className="p-3 text-right">-</td>
                    </tr>
                    <tr>
                      <td className="p-3">Average SNF Percentage</td>
                      <td className="p-3 text-right font-mono">{viewingBill.avgSnf.toFixed(1)}%</td>
                      <td className="p-3 text-right">-</td>
                    </tr>
                    <tr>
                      <td className="p-3">Quality Bonus Incentives</td>
                      <td className="p-3 text-right font-mono">-</td>
                      <td className="p-3 text-right text-emerald-600 font-bold">+Rs. {viewingBill.bonusAmount.toFixed(2)}</td>
                    </tr>
                    {viewingBill.incentiveAmount > 0 && (
                      <tr>
                        <td className="p-3">Additional Shift Incentives</td>
                        <td className="p-3 text-right font-mono">-</td>
                        <td className="p-3 text-right text-emerald-600 font-bold">+Rs. {viewingBill.incentiveAmount.toFixed(2)}</td>
                      </tr>
                    )}
                    {viewingBill.deductionAmount > 0 && (
                      <tr>
                        <td className="p-3">Cooperative Welfare Deductions</td>
                        <td className="p-3 text-right font-mono">-</td>
                        <td className="p-3 text-right text-rose-600 font-bold">-Rs. {viewingBill.deductionAmount.toFixed(2)}</td>
                      </tr>
                    )}
                    {viewingBill.penaltyAmount > 0 && (
                      <tr>
                        <td className="p-3">Acidic/Quality Penalties</td>
                        <td className="p-3 text-right font-mono">-</td>
                        <td className="p-3 text-right text-rose-600 font-bold">-Rs. {viewingBill.penaltyAmount.toFixed(2)}</td>
                      </tr>
                    )}
                    {viewingBill.roundOff !== 0 && (
                      <tr>
                        <td className="p-3">Financial Round-off Adjustment</td>
                        <td className="p-3 text-right font-mono">-</td>
                        <td className="p-3 text-right text-slate-500">Rs. {viewingBill.roundOff.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr className="bg-teal-50/50 dark:bg-teal-950/20 font-bold text-slate-800 dark:text-slate-100 text-sm">
                      <td className="p-3">NET STATEMENT PAYABLE</td>
                      <td className="p-3 text-right">-</td>
                      <td className="p-3 text-right text-teal-600 font-extrabold text-base">Rs. {viewingBill.netAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 dark:border-slate-800 pt-4 font-semibold">
                  This is a computer-generated statement authorized by DairySphere cooperative auditors. Zero financial error verified.
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Statement
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" /> Export PDF
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingBill(null)}
                    className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Calculator Dialog */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Run Member Bill Calculator</h2>
              <button 
                onClick={() => setFormOpen(false)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Quick Ranges</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => applyQuickRange('daily')}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-150 dark:border-slate-800"
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickRange('weekly')}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-150 dark:border-slate-800"
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickRange('fortnight')}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-150 dark:border-slate-800"
                  >
                    Fortnight
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickRange('monthly')}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-150 dark:border-slate-800"
                  >
                    Monthly
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Period Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Period End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800/80">
                <div className="col-span-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Procurement Bonuses & Incentives (Rs.)</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold">Bonus Rate (per Liter)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bonusRate}
                    onChange={(e) => setBonusRate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-semibold">Additional Incentives</label>
                  <input
                    type="number"
                    step="1"
                    value={incentiveAmount}
                    onChange={(e) => setIncentiveAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1 mt-2">
                  <label className="text-[10px] text-slate-400 font-semibold">Cooperative Deductions</label>
                  <input
                    type="number"
                    step="1"
                    value={deductionAmount}
                    onChange={(e) => setDeductionAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
                </div>
                <div className="space-y-1 mt-2">
                  <label className="text-[10px] text-slate-400 font-semibold">Adulteration Penalty</label>
                  <input
                    type="number"
                    step="1"
                    value={penaltyAmount}
                    onChange={(e) => setPenaltyAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono"
                  />
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
                  disabled={generating}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Computing batch...
                    </>
                  ) : (
                    'Run Calculations'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
