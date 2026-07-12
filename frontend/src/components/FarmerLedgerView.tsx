import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { Farmer, FarmerLedger, FarmerBalance, SessionData } from '../types';
import { 
  BookOpen, Plus, Landmark, ArrowUpRight, ArrowDownLeft, AlertCircle, 
  Search, Filter, RefreshCw, Calendar, FileText, CheckCircle2, ChevronRight, X 
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';

interface FarmerLedgerViewProps {
  session: SessionData | null;
}

export const FarmerLedgerView: React.FC<FarmerLedgerViewProps> = ({ session }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [ledgers, setLedgers] = useState<FarmerLedger[]>([]);
  const [balances, setBalances] = useState<FarmerBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // Filters State
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Manual Adjustment Form State
  const [formFarmerId, setFormFarmerId] = useState('');
  const [formType, setFormType] = useState<'ADVANCE' | 'ADJUSTMENT' | 'RECOVERY'>('ADVANCE');
  const [formAmount, setFormAmount] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));

  const isAdminOrManager = useMemo(() => {
    const roleName = session?.user?.role || localStorage.getItem('dairysphere_user_role') || '';
    return ['ADMIN', 'MANAGER'].includes(roleName.toUpperCase());
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const farmersData = await api.getFarmers();
      setFarmers(farmersData);

      const balancesData = await api.getFarmerBalances();
      setBalances(balancesData);

      const ledgersData = await api.getFarmerLedger({
        farmerId: selectedFarmerId,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      setLedgers(ledgersData);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch ledger details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedFarmerId, startDate, endDate]);

  const handleOpenForm = () => {
    if (farmers.length > 0) {
      setFormFarmerId(farmers[0].id);
    }
    setFormType('ADVANCE');
    setFormAmount('');
    setFormRemarks('');
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFarmerId) {
      showToast('Please select a farmer.', 'error');
      return;
    }
    if (Number(formAmount) <= 0) {
      showToast('Amount must be greater than zero.', 'error');
      return;
    }

    try {
      await api.createLedgerAdjustment({
        farmerId: formFarmerId,
        transactionType: formType,
        amount: Number(formAmount),
        remarks: formRemarks,
        date: new Date(formDate).toISOString()
      });
      showToast('Ledger transaction recorded successfully.', 'success');
      setFormOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record transaction.', 'error');
    }
  };

  // Compute stats based on ledger
  const stats = useMemo(() => {
    let totalCredit = 0;
    let totalDebit = 0;
    ledgers.forEach(l => {
      totalCredit += Number(l.credit);
      totalDebit += Number(l.debit);
    });
    return {
      totalCredit,
      totalDebit,
      netBalance: totalCredit - totalDebit
    };
  }, [ledgers]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Farmer Ledger & Balances</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
            Audit daily credits/debits, monitor advance recoveries, issue adjustments, and log farmer payments with precise balance trackability.
          </p>
        </div>

        {isAdminOrManager && (
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Issue Advance / Adj
          </button>
        )}
      </div>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Milk Earnings (Credit)</span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-md">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
            Rs. {stats.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Sum of milk deliveries credit inside scope</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Debited (Advances/Payments)</span>
            <span className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-md">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
            Rs. {stats.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Advances, deductions & payments made inside scope</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Net Balance</span>
            <span className="p-1.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-md">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <h3 className={`text-2xl font-black mt-2 ${stats.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            Rs. {stats.netBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Credit balance due to farmers for collection</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filter Member</label>
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
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm"
          />
        </div>

        <div className="w-full md:w-44">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Ledger Audit Logs</h3>
          <span className="text-xs font-bold text-slate-400">{ledgers.length} ledger transaction logs</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-slate-500 text-sm mt-2">Computing ledger audits...</p>
          </div>
        ) : ledgers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2">No Ledger Entries</h4>
            <p className="text-xs mt-1">Adjust filters or register new collections/payments for dairy members.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Farmer</th>
                  <th className="px-6 py-3">Transaction</th>
                  <th className="px-6 py-3">Credit (Rs.)</th>
                  <th className="px-6 py-3">Debit (Rs.)</th>
                  <th className="px-6 py-3">Running Balance (Rs.)</th>
                  <th className="px-6 py-3">Remarks / References</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {ledgers.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-500 dark:text-slate-400">
                      {new Date(l.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{l.farmerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{l.farmerCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        l.transactionType === 'COLLECTION' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
                        l.transactionType === 'PAYMENT' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' :
                        l.transactionType === 'ADVANCE' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                        'bg-slate-50 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {l.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-600">
                      {l.credit > 0 ? `+${l.credit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-rose-600">
                      {l.debit > 0 ? `-${l.debit.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-slate-800 dark:text-slate-100">
                      Rs. {l.balance.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {l.remarks || 'Standard Transaction'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Form for Manual Advances or Adjustments */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Issue Advance or Adjustment</h2>
              <button 
                onClick={() => setFormOpen(false)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Select Cooperative Farmer</label>
                <select
                  value={formFarmerId}
                  onChange={(e) => setFormFarmerId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden"
                >
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Transaction Type</label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden"
                  >
                    <option value="ADVANCE">Advance (Debit)</option>
                    <option value="ADJUSTMENT">Adjustment Credit</option>
                    <option value="RECOVERY">Recovery Deduction</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Transaction Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Amount (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Adjustment Remarks</label>
                <textarea
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Provide precise details for this financial override..."
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden text-slate-800 dark:text-slate-100 resize-none"
                />
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
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
