import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { Farmer, PaymentVoucher, SessionData } from '../types';
import { 
  CreditCard, Plus, ArrowUpRight, CheckCircle2, AlertCircle, 
  Search, Filter, RefreshCw, Calendar, X, Landmark, User, DollarSign, Wallet
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';

interface PaymentEntryProps {
  session: SessionData | null;
}

export const PaymentEntry: React.FC<PaymentEntryProps> = ({ session }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // Filters State
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('all');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  // Form State
  const [formFarmerId, setFormFarmerId] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formMethod, setFormMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'UPI'>('CASH');
  const [formReference, setFormReference] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));

  const isAdminOrManager = useMemo(() => {
    const roleName = session?.user?.role || localStorage.getItem('dairysphere_user_role') || '';
    return ['ADMIN', 'MANAGER'].includes(roleName.toUpperCase());
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const farmersData = await api.getFarmers();
      setFarmers(farmersData);

      const balancesData = await api.getFarmerBalances();
      setBalances(balancesData);

      const vouchersData = await api.getPaymentVouchers({
        farmerId: selectedFarmerId,
        startDate: filterStart || undefined,
        endDate: filterEnd || undefined
      });
      setVouchers(vouchersData);
    } catch (err: any) {
      showToast(err.message || 'Failed to read payment registers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedFarmerId, filterStart, filterEnd]);

  const handleOpenForm = () => {
    if (farmers.length > 0) {
      setFormFarmerId(farmers[0].id);
      
      // Auto-set amount to farmer's active credit balance if available
      const fBal = balances.find(b => b.farmerId === farmers[0].id);
      if (fBal && fBal.closingBalance > 0) {
        setFormAmount(String(Math.round(fBal.closingBalance)));
      } else {
        setFormAmount('');
      }
    }
    setFormMethod('CASH');
    setFormReference('');
    setFormRemarks('');
    setFormDate(new Date().toISOString().substring(0, 10));
    setFormOpen(true);
  };

  const handleFarmerChange = (farmerId: string) => {
    setFormFarmerId(farmerId);
    const fBal = balances.find(b => b.farmerId === farmerId);
    if (fBal && fBal.closingBalance > 0) {
      setFormAmount(String(Math.round(fBal.closingBalance)));
    } else {
      setFormAmount('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFarmerId) {
      showToast('Please select a farmer.', 'error');
      return;
    }
    if (Number(formAmount) <= 0) {
      showToast('Payout amount must be greater than zero.', 'error');
      return;
    }

    try {
      await api.createPaymentVoucher({
        farmerId: formFarmerId,
        amount: Number(formAmount),
        paymentMethod: formMethod,
        transactionReference: formReference,
        remarks: formRemarks,
        paidAt: new Date(formDate).toISOString()
      });
      showToast('Payment voucher issued and posted successfully.', 'success');
      setFormOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to post payment.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Payment Entry & Payouts</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
            Settle outstanding milk credits with farmers, manage UPI/Bank/Cash payout vouchers, audit history, and trace instant double-entry debits.
          </p>
        </div>

        {isAdminOrManager && (
          <button
            onClick={handleOpenForm}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Issue Payment Voucher
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div className="flex-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Filter</label>
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
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment From</label>
          <input
            type="date"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm"
          />
        </div>

        <div className="w-full md:w-44">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment To</label>
          <input
            type="date"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
            className="w-full mt-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Main Register Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Disbursed Payout Register</h3>
          <span className="text-xs font-bold text-slate-400">{vouchers.length} vouchers logged</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-slate-500 text-sm mt-2">Loading financial statements...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mt-2">No Payout Records</h4>
            <p className="text-xs mt-1">Issue a payout voucher to settle outstanding milk yields with members.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3">Voucher No</th>
                  <th className="px-6 py-3">Disbursed To</th>
                  <th className="px-6 py-3">Paid At</th>
                  <th className="px-6 py-3">Amount Settled</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Txn reference</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700 dark:text-slate-300 font-mono">
                      {v.voucherNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{v.farmerName}</span>
                      <div className="text-[10px] text-slate-400 font-mono">{v.farmerCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono">
                      {new Date(v.paidAt).toLocaleDateString()} {new Date(v.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-extrabold text-emerald-600">
                      Rs. {v.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                        {v.paymentMethod === 'UPI' && <Wallet className="w-3.5 h-3.5 text-indigo-500" />}
                        {v.paymentMethod === 'BANK_TRANSFER' && <Landmark className="w-3.5 h-3.5 text-teal-500" />}
                        {v.paymentMethod === 'CASH' && <DollarSign className="w-3.5 h-3.5 text-amber-500" />}
                        {v.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-500 max-w-[120px] truncate">
                      {v.transactionReference || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> SUCCESS
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Voucher Form */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Issue Farmer Payout Voucher</h2>
              <button 
                onClick={() => setFormOpen(false)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Select Cooperative Member</label>
                <select
                  value={formFarmerId}
                  onChange={(e) => handleFarmerChange(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden"
                >
                  {farmers.map(f => {
                    const fBal = balances.find(b => b.farmerId === f.id);
                    const balStr = fBal ? ` (Due: Rs. ${fBal.closingBalance.toFixed(2)})` : '';
                    return (
                      <option key={f.id} value={f.id}>{f.name} ({f.code}){balStr}</option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Payment Payout Method</label>
                  <select
                    value={formMethod}
                    onChange={(e: any) => setFormMethod(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER</option>
                    <option value="UPI">UPI WIRE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Disbursal Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Payout Amount (Rs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Txn Reference ID</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI Ref / Bank UTN"
                    value={formReference}
                    onChange={(e) => setFormReference(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50/50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Remarks</label>
                <textarea
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  placeholder="Verify payment conditions..."
                  rows={2}
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
                  Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
