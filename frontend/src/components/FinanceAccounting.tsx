import React, { useState, useEffect } from 'react';
import { 
  Activity, Landmark, CreditCard, BookOpen, FileText, Plus, Check, X, Search, 
  Filter, HelpCircle, ShieldAlert, Calendar, RefreshCw, Layers, ArrowUpRight, 
  ArrowDownLeft, Lock, Unlock, ClipboardList, Info, FileUp, ListFilter, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';
import { api } from '../utils/api';
import { SessionData, ChartAccount, Expense, Voucher, DailyClosing, FinancialAuditLog } from '../types';

interface FinanceAccountingProps {
  session: SessionData | null;
}

export function FinanceAccounting({ session }: FinanceAccountingProps) {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const userRole = session?.user?.role || 'STAFF';
  const userName = session?.user?.name || 'Anonymous';
  const isAdminOrManager = userRole === 'ADMIN' || userRole === 'MANAGER';

  // Component views
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'chart' | 'expenses' | 'books' | 'vouchers' | 'closing' | 'audit'>('dashboard');

  // Loading States
  const [loading, setLoading] = useState(false);

  // Core accounting states
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [closings, setClosings] = useState<DailyClosing[]>([]);
  const [auditLogs, setAuditLogs] = useState<FinancialAuditLog[]>([]);

  // Selected details states
  const [selectedAccount, setSelectedAccount] = useState<ChartAccount | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  // Modals state
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddVoucher, setShowAddVoucher] = useState(false);

  // --- FORM STATES ---
  // Account Form
  const [newAccCode, setNewAccCode] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE'>('EXPENSE');
  const [newAccOpening, setNewAccOpening] = useState('0');

  // Expense Form
  const [expAmount, setExpAmount] = useState('');
  const [expCategoryId, setExpCategoryId] = useState('');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expPaidFromId, setExpPaidFromId] = useState('acc-cash');
  const [expMode, setExpMode] = useState<'CASH' | 'BANK' | 'UPI'>('CASH');
  const [expIsRecurring, setExpIsRecurring] = useState(false);
  const [expRecInterval, setExpRecInterval] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('MONTHLY');
  const [expNotes, setExpNotes] = useState('');
  const [expVendorRef, setExpVendorRef] = useState('');
  const [expAttachments, setExpAttachments] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Voucher Form
  const [vouType, setVouType] = useState<'PAYMENT' | 'RECEIPT' | 'JOURNAL'>('JOURNAL');
  const [vouMode, setVouMode] = useState<'CASH' | 'BANK' | 'UPI'>('CASH');
  const [vouNotes, setVouNotes] = useState('');
  const [vouDate, setVouDate] = useState(new Date().toISOString().split('T')[0]);
  const [vouLines, setVouLines] = useState<Array<{ accountId: string; type: 'DEBIT' | 'CREDIT'; amount: string }>>([
    { accountId: '', type: 'DEBIT', amount: '' },
    { accountId: '', type: 'CREDIT', amount: '' }
  ]);

  // Reconciliation / Closing Form
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);

  // Search/Filters
  const [accountSearch, setAccountSearch] = useState('');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseFilterStatus, setExpenseFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [voucherSearch, setVoucherSearch] = useState('');

  // Load baseline accounting datasets
  const loadFinanceData = async () => {
    setLoading(true);
    try {
      const [accs, exps, vous, closes, logs] = await Promise.all([
        api.getAccounts(),
        api.getExpenses(),
        api.getVouchers(),
        api.getDailyClosings(),
        api.getFinancialAuditLogs()
      ]);
      setAccounts(accs);
      setExpenses(exps);
      setVouchers(vous);
      setClosings(closes);
      setAuditLogs(logs);

      // Refresh currently selected account ledger statement if selected
      if (selectedAccount) {
        const refreshedAcc = accs.find(a => a.id === selectedAccount.id);
        if (refreshedAcc) {
          setSelectedAccount(refreshedAcc);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Error compiling financial datasets.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  // Compute Ledger statement lines for the selected account based on past vouchers (Double Entry matching)
  useEffect(() => {
    if (!selectedAccount) {
      setLedgerEntries([]);
      return;
    }

    // Filter voucher lines that match this account
    const entries: any[] = [];
    let runningBalance = selectedAccount.openingBalance;

    // We sort vouchers chronologically to calculate running balance correctly
    const sortedVouchers = [...vouchers].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedVouchers.forEach(v => {
      v.lines.forEach(l => {
        if (l.accountId === selectedAccount.id) {
          const isDebitIncrease = selectedAccount.type === 'ASSET' || selectedAccount.type === 'EXPENSE';
          if (l.type === 'DEBIT') {
            runningBalance = isDebitIncrease ? (runningBalance + l.amount) : (runningBalance - l.amount);
          } else {
            runningBalance = isDebitIncrease ? (runningBalance - l.amount) : (runningBalance + l.amount);
          }

          entries.push({
            id: `${v.id}-${l.id}`,
            date: v.date,
            voucherNo: v.voucherNo,
            type: v.type,
            notes: v.notes,
            debitAmount: l.type === 'DEBIT' ? l.amount : 0,
            creditAmount: l.type === 'CREDIT' ? l.amount : 0,
            balance: Number(runningBalance.toFixed(2))
          });
        }
      });
    });

    // reverse for chronological newest-first display but keep correct balance
    setLedgerEntries(entries.reverse());
  }, [selectedAccount, vouchers]);

  // --- FORM HANDLERS ---
  
  // Create New Account Handler
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccCode.trim() || !newAccName.trim()) {
      showToast('Account code and name are required.', 'error');
      return;
    }
    try {
      await api.createAccount({
        code: newAccCode,
        name: newAccName,
        type: newAccType,
        openingBalance: Number(newAccOpening)
      });
      showToast(`Account "${newAccName}" registered successfully!`, 'success');
      setShowAddAccount(false);
      setNewAccCode('');
      setNewAccName('');
      setNewAccOpening('0');
      loadFinanceData();
    } catch (err: any) {
      showToast(err.message || 'Error registering chart account.', 'error');
    }
  };

  // Log New Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || !expCategoryId || !expPaidFromId) {
      showToast('Expense amount, category, and source account are required.', 'error');
      return;
    }
    try {
      await api.createExpense({
        categoryId: expCategoryId,
        amount: Number(expAmount),
        paidTo: expPaidTo,
        paidFromAccountId: expPaidFromId,
        paymentMode: expMode,
        isRecurring: expIsRecurring,
        recurrenceInterval: expIsRecurring ? expRecInterval : 'NONE',
        notes: expNotes,
        vendorRef: expVendorRef,
        attachments: expAttachments
      });
      showToast('Expense request logged and queued for approval.', 'success');
      setShowAddExpense(false);
      // Reset
      setExpAmount('');
      setExpCategoryId('');
      setExpPaidTo('');
      setExpNotes('');
      setExpVendorRef('');
      setExpAttachments([]);
      setExpIsRecurring(false);
      loadFinanceData();
    } catch (err: any) {
      showToast(err.message || 'Error logging expense.', 'error');
    }
  };

  // Approve Pending Expense (Role Protected)
  const handleApproveExpense = async (id: string) => {
    if (!isAdminOrManager) {
      showToast('RBAC Error: Only system administrators or managers can approve financial outlays.', 'error');
      return;
    }

    confirm({
      title: 'Approve Outlay Request',
      message: 'This will finalize the expense, generate double-entry voucher journals, and adjust account balances. Proceed?',
      onConfirm: async () => {
        try {
          await api.approveExpense(id, userName);
          showToast('Expense approved. Ledgers updated successfully!', 'success');
          loadFinanceData();
        } catch (err: any) {
          showToast(err.message || 'Error processing approval.', 'error');
        }
      }
    });
  };

  // Add Voucher line
  const addVoucherLine = () => {
    setVouLines([...vouLines, { accountId: '', type: 'DEBIT', amount: '' }]);
  };

  // Remove Voucher line
  const removeVoucherLine = (index: number) => {
    if (vouLines.length <= 2) {
      showToast('A voucher must contain at least 2 balanced debit/credit lines.', 'info');
      return;
    }
    setVouLines(vouLines.filter((_, idx) => idx !== index));
  };

  // Update line field
  const updateVouLine = (index: number, field: string, value: any) => {
    const updated = [...vouLines];
    updated[index] = { ...updated[index], [field]: value };
    setVouLines(updated);
  };

  // Double entry matching calculation for instant UI verification
  const calculateVouMatchStats = () => {
    let debits = 0;
    let credits = 0;
    vouLines.forEach(l => {
      const val = Number(l.amount) || 0;
      if (l.type === 'DEBIT') debits = Number((debits + val).toFixed(2));
      else credits = Number((credits + val).toFixed(2));
    });
    const difference = Number((debits - credits).toFixed(2));
    const isBalanced = debits === credits && debits > 0;
    return { debits, credits, difference, isBalanced };
  };

  const { debits, credits, difference, isBalanced } = calculateVouMatchStats();

  // Handle Create Manual Voucher
  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      showToast('Cannot post an out-of-balance journal voucher.', 'error');
      return;
    }

    const incomplete = vouLines.some(l => !l.accountId || !l.amount);
    if (incomplete) {
      showToast('All transaction lines must have an account and valid positive amount.', 'error');
      return;
    }

    try {
      await api.createVoucher({
        type: vouType,
        paymentMode: vouMode,
        date: vouDate,
        notes: vouNotes,
        lines: vouLines.map(l => {
          const accObj = accounts.find(a => a.id === l.accountId);
          return {
            accountId: l.accountId,
            accountName: accObj?.name || 'Unassigned',
            type: l.type,
            amount: Number(l.amount)
          };
        })
      });

      showToast('Manual voucher posted and applied to ledger balances!', 'success');
      setShowAddVoucher(false);
      // Reset
      setVouNotes('');
      setVouLines([
        { accountId: '', type: 'DEBIT', amount: '' },
        { accountId: '', type: 'CREDIT', amount: '' }
      ]);
      loadFinanceData();
    } catch (err: any) {
      showToast(err.message || 'Error posting journal voucher.', 'error');
    }
  };

  // Daily Close & Day Lock execution
  const handleCloseDay = async () => {
    confirm({
      title: `Finalize Reconciliation Day: ${closingDate}`,
      message: `Are you sure you want to lock all transactions and calculate opening/closing balances for Petty Cash and Bank books for ${closingDate}? This action is irreversible.`,
      onConfirm: async () => {
        try {
          await api.closeDay(closingDate, userName);
          showToast(`Reconciliation day locked & finalized for ${closingDate}!`, 'success');
          loadFinanceData();
        } catch (err: any) {
          showToast(err.message || 'Error finalizing operational closing day.', 'error');
        }
      }
    });
  };

  // File drag & drop simulator
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const filesArr: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        filesArr.push(e.dataTransfer.files[i].name);
      }
      setExpAttachments([...expAttachments, ...filesArr]);
      showToast(`Simulated receipt upload of: ${filesArr.join(', ')}`, 'info');
    }
  };

  // Calculated high level metrics
  const cashAcc = accounts.find(a => a.id === 'acc-cash');
  const bankAcc = accounts.find(a => a.id === 'acc-bank');
  const totalPettyCash = cashAcc?.currentBalance || 0;
  const totalBank = bankAcc?.currentBalance || 0;

  // Revenue vs Expense sums
  const approvedExpensesSum = expenses
    .filter(e => e.status === 'APPROVED')
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingExpensesSum = expenses
    .filter(e => e.status === 'PENDING')
    .reduce((sum, e) => sum + e.amount, 0);

  const revenueSum = accounts
    .filter(a => a.type === 'INCOME')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  // Cash Book registers & Bank Book registers
  // We can filter voucher lines which affect Cash or Bank accounts
  const getRegisterEntries = (accId: string) => {
    const list: any[] = [];
    vouchers.forEach(v => {
      v.lines.forEach(l => {
        if (l.accountId === accId) {
          list.push({
            id: `${v.id}-${l.id}`,
            date: v.date,
            voucherNo: v.voucherNo,
            notes: v.notes,
            amount: l.amount,
            type: l.type, // DEBIT or CREDIT
            createdBy: v.createdBy
          });
        }
      });
    });
    // Sort newest first
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const cashRegister = getRegisterEntries('acc-cash');
  const bankRegister = getRegisterEntries('acc-bank');

  // Filtered lists
  const filteredAccounts = accounts.filter(a => 
    a.code.includes(accountSearch) || 
    a.name.toLowerCase().includes(accountSearch.toLowerCase()) ||
    a.type.toLowerCase().includes(accountSearch.toLowerCase())
  );

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.categoryName.toLowerCase().includes(expenseSearch.toLowerCase()) || 
      e.paidTo.toLowerCase().includes(expenseSearch.toLowerCase()) || 
      (e.notes && e.notes.toLowerCase().includes(expenseSearch.toLowerCase())) ||
      (e.vendorRef && e.vendorRef.toLowerCase().includes(expenseSearch.toLowerCase()));
    
    const matchesStatus = expenseFilterStatus === 'ALL' || e.status === expenseFilterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredVouchers = vouchers.filter(v => 
    v.voucherNo.toLowerCase().includes(voucherSearch.toLowerCase()) ||
    (v.notes && v.notes.toLowerCase().includes(voucherSearch.toLowerCase())) ||
    v.createdBy.toLowerCase().includes(voucherSearch.toLowerCase())
  );

  // Chart dataset
  const chartData = [
    { name: 'Revenue', Amount: revenueSum, color: '#0f766e' },
    { name: 'Approved Exp', Amount: approvedExpensesSum, color: '#be123c' },
    { name: 'Pending Exp', Amount: pendingExpensesSum, color: '#f59e0b' },
    { name: 'Available Cash', Amount: totalPettyCash, color: '#0284c7' },
    { name: 'Bank Balance', Amount: totalBank, color: '#6366f1' }
  ];

  return (
    <div id="finance-accounting-root" className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] tracking-wider font-semibold rounded bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
              STAGE 5.8
            </span>
            <span className="text-xs text-slate-500 font-mono">500 Businesses Tenant Scale</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            General Ledger, Treasury & Accounting
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile daily cash sheets, process recurring multi-level business expenses, audit accounts, and post balanced journal vouchers.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddExpense(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" /> Log Expense
          </button>
          <button
            onClick={() => setShowAddVoucher(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <BookOpen className="w-4 h-4" /> Post Journal Voucher
          </button>
          <button
            onClick={() => loadFinanceData()}
            className="p-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh Ledger Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center overflow-x-auto gap-1 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 rounded-xl">
        <button
          onClick={() => { setActiveSubTab('dashboard'); setSelectedAccount(null); }}
          className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
            activeSubTab === 'dashboard' 
              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-3.5 h-3.5 inline mr-1.5" />
          Financial Dashboard
        </button>
        <button
          onClick={() => setActiveSubTab('chart')}
          className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
            activeSubTab === 'chart' 
              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 inline mr-1.5" />
          Chart of Accounts & Ledger
        </button>
        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
            activeSubTab === 'expenses' 
              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 inline mr-1.5" />
          Expenses Register
        </button>
        <button
          onClick={() => setActiveSubTab('books')}
          className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
            activeSubTab === 'books' 
              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
          Cash & Bank Books
        </button>
        <button
          onClick={() => setActiveSubTab('vouchers')}
          className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
            activeSubTab === 'vouchers' 
              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 inline mr-1.5" />
          Vouchers Registry
        </button>
        <button
          onClick={() => setActiveSubTab('closing')}
          className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
            activeSubTab === 'closing' 
              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5 inline mr-1.5" />
          Daily Closing & Lock
        </button>
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
            activeSubTab === 'audit' 
              ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 font-semibold shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 inline mr-1.5" />
          Audit Trail
        </button>
      </div>

      {/* --- SUB-TAB CONTENTS --- */}

      {/* 1. FINANCIAL DASHBOARD */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Petty Cash Balance */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Petty Cash Treasury</span>
                <h3 className="text-xl font-bold font-mono text-slate-800 dark:text-white">
                  ₹{totalPettyCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Double Entry Reconciled
                </span>
              </div>
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-600">
                <Landmark className="w-6 h-6" />
              </div>
            </div>

            {/* HDFC Bank Balance */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">HDFC Bank Ledger</span>
                <h3 className="text-xl font-bold font-mono text-slate-800 dark:text-white">
                  ₹{totalBank.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> Core Bank Verified
                </span>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600">
                <Landmark className="w-6 h-6" />
              </div>
            </div>

            {/* Approved Outlays */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Approved Outlays</span>
                <h3 className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                  ₹{approvedExpensesSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-slate-500">
                  From {expenses.filter(e => e.status === 'APPROVED').length} vouchers
                </span>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-150 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 font-medium">Pending Approvals</span>
                <h3 className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                  ₹{pendingExpensesSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h3>
                <span className="text-[10px] text-amber-600 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3" /> Requires Action
                </span>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600">
                <Info className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Graphical Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 lg:col-span-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Financial Resource Allocations (Rs.)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip 
                      formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']}
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px' }}
                    />
                    <Bar dataKey="Amount" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue / Net Margin */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Operating Income Statement
              </h3>
              <div className="space-y-3.5">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500">Gross Income Realized</span>
                  <span className="text-xs font-mono font-bold text-teal-600">
                    ₹{revenueSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500">Approved Expense Outlays</span>
                  <span className="text-xs font-mono font-bold text-rose-600">
                    -₹{approvedExpensesSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500">Unapproved Expense Queue</span>
                  <span className="text-xs font-mono font-bold text-amber-600">
                    -₹{pendingExpensesSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                {/* Net Income Formula */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Net Operating Surplus</span>
                    <span className={`text-sm font-mono font-bold ${
                      (revenueSum - approvedExpensesSum) >= 0 ? 'text-teal-600' : 'text-rose-600'
                    }`}>
                      ₹{(revenueSum - approvedExpensesSum).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Calculated as Gross Income minus finalized expense outlays (excluding pending approval requests).
                  </p>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed bg-teal-50/50 dark:bg-teal-950/10 p-3 rounded-lg border border-teal-100/30">
                  💡 <strong>Stage 5.8 Compliance Alert:</strong> Account structures are fully isolated at the tenant/business layer. All journal line additions require matching offset balancing debits/credits.
                </div>
              </div>
            </div>

          </div>

          {/* Quick Approvals Queue for Quick Review */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldAlert className="w-4.5 h-4.5 text-amber-500" /> Pending Approval Requests ({expenses.filter(e => e.status === 'PENDING').length})
              </h3>
              <button 
                onClick={() => setActiveSubTab('expenses')}
                className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
              >
                Go to Expense Register &rarr;
              </button>
            </div>

            {expenses.filter(e => e.status === 'PENDING').length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-950/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-850">
                🎉 No pending expense approvals found in the treasury workflow.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-medium">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Paid To</th>
                      <th className="py-2.5">Amount</th>
                      <th className="py-2.5">Source Account</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.filter(e => e.status === 'PENDING').map(e => (
                      <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800/50 text-slate-700 dark:text-slate-300">
                        <td className="py-3 font-mono">{e.date}</td>
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{e.categoryName}</td>
                        <td className="py-3">{e.paidTo}</td>
                        <td className="py-3 font-mono font-semibold">₹{e.amount.toFixed(2)}</td>
                        <td className="py-3 text-slate-500 text-[11px]">{e.paidFromAccountName} ({e.paymentMode})</td>
                        <td className="py-3 text-right">
                          {isAdminOrManager ? (
                            <button
                              onClick={() => handleApproveExpense(e.id)}
                              className="px-2.5 py-1 text-[10px] font-bold rounded bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-xs"
                            >
                              Approve & Post Journal
                            </button>
                          ) : (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-1 rounded">
                              Manager approval req.
                            </span>
                          )}
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

      {/* 2. CHART OF ACCOUNTS & LEDGERS EXPLORER */}
      {activeSubTab === 'chart' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          
          {/* Chart of Accounts Column */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 lg:col-span-5 space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Chart of Accounts (COA)
                </h3>
                <p className="text-[11px] text-slate-500">General ledger accounts matrix.</p>
              </div>
              <button
                onClick={() => setShowAddAccount(true)}
                className="px-2.5 py-1.5 text-[11px] font-bold rounded bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> New Account
              </button>
            </div>

            {/* Search COA */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={accountSearch}
                onChange={e => setAccountSearch(e.target.value)}
                placeholder="Search code, name or type..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredAccounts.map(a => (
                <div
                  key={a.id}
                  onClick={() => setSelectedAccount(a)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    selectedAccount?.id === a.id
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
                      : 'border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-600 dark:text-slate-400">
                        {a.code}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        a.type === 'ASSET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                        a.type === 'LIABILITY' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' :
                        a.type === 'EQUITY' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' :
                        a.type === 'INCOME' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                      }`}>
                        {a.type}
                      </span>
                      <span className="text-[10px] text-slate-400">Created: {new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100 block">
                      ₹{a.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      Opening: ₹{a.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 1 })}
                    </span>
                  </div>
                </div>
              ))}

              {filteredAccounts.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No accounts match search query.
                </div>
              )}
            </div>

          </div>

          {/* Interactive Ledger Statement Statement Column */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 lg:col-span-7 space-y-4">
            
            {selectedAccount ? (
              <div className="space-y-4 animate-fade-in">
                
                {/* Selected account summary bar */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-teal-600" />
                      Account Ledger Statement
                    </h4>
                    <p className="text-xs text-slate-500">
                      Statement for <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAccount.code} - {selectedAccount.name}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Reconciled Balance</span>
                    <span className="text-base font-mono font-bold text-teal-600">
                      ₹{selectedAccount.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Ledger entries list */}
                {ledgerEntries.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                    <Info className="w-6 h-6 text-slate-400 mx-auto" />
                    <p>No transactions posted against this ledger account yet.</p>
                    <p className="text-[10px] text-slate-400">Opening balance is configured at ₹{selectedAccount.openingBalance.toLocaleString()}.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                          <th className="py-2">Date</th>
                          <th className="py-2">Voucher No</th>
                          <th className="py-2">Narration</th>
                          <th className="py-2 text-right">Debit (Dr)</th>
                          <th className="py-2 text-right">Credit (Cr)</th>
                          <th className="py-2 text-right">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Show opening balance line at bottom/start */}
                        <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 font-mono text-[11px]">
                          <td className="py-2">--</td>
                          <td className="py-2">--</td>
                          <td className="py-2 italic">Opening Balance Carried Forward</td>
                          <td className="py-2 text-right">--</td>
                          <td className="py-2 text-right">--</td>
                          <td className="py-2 text-right font-semibold">₹{selectedAccount.openingBalance.toFixed(2)}</td>
                        </tr>

                        {ledgerEntries.map(e => (
                          <tr key={e.id} className="border-b border-slate-100 dark:border-slate-850 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                            <td className="py-2">{e.date}</td>
                            <td className="py-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-100">{e.voucherNo}</span>
                            </td>
                            <td className="py-2 max-w-[180px] truncate text-slate-500" title={e.notes}>
                              {e.notes || 'No description'}
                            </td>
                            <td className="py-2 text-right text-rose-600">
                              {e.debitAmount > 0 ? `₹${e.debitAmount.toFixed(2)}` : '--'}
                            </td>
                            <td className="py-2 text-right text-teal-600">
                              {e.creditAmount > 0 ? `₹${e.creditAmount.toFixed(2)}` : '--'}
                            </td>
                            <td className="py-2 text-right font-bold text-slate-800 dark:text-slate-100">
                              ₹{e.balance.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-850 space-y-2">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">No Account Selected</h4>
                <p className="max-w-xs mx-auto">Click any account on the left Chart of Accounts matrix to view its live double-entry ledger statement and running audit balances.</p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* 3. EXPENSES REGISTER & WORKFLOWS */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-4 animate-fade-in">
          
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Business Outlay Expenses Register
                </h3>
                <p className="text-xs text-slate-500">Track vendor reference keys, attachments, and recurring intervals.</p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 self-start md:self-auto">
                <button
                  onClick={() => setExpenseFilterStatus('ALL')}
                  className={`px-2.5 py-1 text-xs rounded-md ${
                    expenseFilterStatus === 'ALL' ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-semibold' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setExpenseFilterStatus('PENDING')}
                  className={`px-2.5 py-1 text-xs rounded-md ${
                    expenseFilterStatus === 'PENDING' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-semibold' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setExpenseFilterStatus('APPROVED')}
                  className={`px-2.5 py-1 text-xs rounded-md ${
                    expenseFilterStatus === 'APPROVED' ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-semibold' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  Approved
                </button>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                value={expenseSearch}
                onChange={e => setExpenseSearch(e.target.value)}
                placeholder="Search vendor references, notes, categories..."
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Register Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Category (Account)</th>
                    <th className="py-2.5">Vendor / Payee</th>
                    <th className="py-2.5">Amount</th>
                    <th className="py-2.5">Recurrence</th>
                    <th className="py-2.5">Source (Mode)</th>
                    <th className="py-2.5">Reference</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(e => (
                    <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800/55 text-slate-700 dark:text-slate-300 hover:bg-slate-50/50">
                      <td className="py-3 font-mono text-[11px]">{e.date}</td>
                      <td className="py-3">
                        <span className="font-semibold text-slate-900 dark:text-white block">{e.categoryName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {e.categoryId}</span>
                      </td>
                      <td className="py-3">{e.paidTo}</td>
                      <td className="py-3 font-mono font-bold text-slate-950 dark:text-white">
                        ₹{e.amount.toFixed(2)}
                      </td>
                      <td className="py-3">
                        {e.isRecurring ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold">
                            🔄 {e.recurrenceInterval}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">One-Time</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="block text-slate-800 dark:text-slate-200">{e.paidFromAccountName}</span>
                        <span className="text-[10px] text-slate-400">{e.paymentMode}</span>
                      </td>
                      <td className="py-3 font-mono text-slate-500">{e.vendorRef || '--'}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.status === 'APPROVED' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' :
                          e.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {e.status === 'PENDING' ? (
                          isAdminOrManager ? (
                            <button
                              onClick={() => handleApproveExpense(e.id)}
                              className="px-2 py-1 text-[10px] font-bold rounded bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-xs"
                            >
                              Approve
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Needs Admin</span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Approved by {e.approvedBy || 'System'}</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-slate-400 italic">
                        No expense outlay entries match current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* 4. CASH & BANK BOOKS REGISTERS */}
      {activeSubTab === 'books' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Petty Cash Book */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-teal-600" /> Petty Cash Book Register
                </h3>
                <p className="text-[11px] text-slate-400">Chronological list of physical cash operations.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Available Cash</span>
                <span className="text-sm font-mono font-bold text-teal-600">₹{totalPettyCash.toFixed(2)}</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 font-medium pb-2">
                    <th className="py-2">Date</th>
                    <th className="py-2">Voucher No</th>
                    <th className="py-2">Narration</th>
                    <th className="py-2 text-right">In / Out (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {cashRegister.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 dark:border-slate-850 py-2 font-mono text-[11px]">
                      <td className="py-2 text-slate-400">{r.date}</td>
                      <td className="py-2 text-slate-700 dark:text-slate-300 font-semibold">{r.voucherNo}</td>
                      <td className="py-2 text-slate-500 max-w-[150px] truncate" title={r.notes}>{r.notes}</td>
                      <td className={`py-2 text-right font-bold ${
                        r.type === 'DEBIT' ? 'text-teal-600' : 'text-rose-600'
                      }`}>
                        {r.type === 'DEBIT' ? '+' : '-'}₹{r.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {cashRegister.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs text-slate-400 italic">
                        No transactions registered in Cash Book.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bank Book */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-indigo-600" /> Bank Book Register
                </h3>
                <p className="text-[11px] text-slate-400">Corporate savings and digital bank statements.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Bank Balance</span>
                <span className="text-sm font-mono font-bold text-indigo-600 font-semibold">₹{totalBank.toFixed(2)}</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850 text-slate-400 font-medium pb-2">
                    <th className="py-2">Date</th>
                    <th className="py-2">Voucher No</th>
                    <th className="py-2">Narration</th>
                    <th className="py-2 text-right">In / Out (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {bankRegister.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 dark:border-slate-850 py-2 font-mono text-[11px]">
                      <td className="py-2 text-slate-400">{r.date}</td>
                      <td className="py-2 text-slate-700 dark:text-slate-300 font-semibold">{r.voucherNo}</td>
                      <td className="py-2 text-slate-500 max-w-[150px] truncate" title={r.notes}>{r.notes}</td>
                      <td className={`py-2 text-right font-bold ${
                        r.type === 'DEBIT' ? 'text-teal-600' : 'text-rose-600'
                      }`}>
                        {r.type === 'DEBIT' ? '+' : '-'}₹{r.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {bankRegister.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs text-slate-400 italic">
                        No transactions registered in Bank Book.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 5. VOUCHER MANAGEMENT */}
      {activeSubTab === 'vouchers' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
          
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Business Double-Entry Voucher Journal Log
              </h3>
              <p className="text-xs text-slate-500">Search manual payment vouchers, receipt vouchers, and adjustments.</p>
            </div>
            <button
              onClick={() => setShowAddVoucher(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Post Manual Voucher
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              value={voucherSearch}
              onChange={e => setVoucherSearch(e.target.value)}
              placeholder="Search voucher number, operator, notes..."
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* List of Vouchers with Nested lines */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {filteredVouchers.map(v => (
              <div key={v.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded">
                      {v.voucherNo}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      v.type === 'PAYMENT' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30' :
                      v.type === 'RECEIPT' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30' :
                      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30'
                    }`}>
                      {v.type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{v.date}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Posted by <span className="font-semibold text-slate-700 dark:text-slate-300">{v.createdBy}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Narration */}
                  <div className="md:col-span-5 text-xs text-slate-500 leading-relaxed">
                    <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Narration Notes</span>
                    {v.notes || 'No description provided.'}
                  </div>

                  {/* Offset Lines */}
                  <div className="md:col-span-7">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="text-slate-400 border-b border-slate-200 dark:border-slate-800">
                          <th className="py-1 text-left">General Ledger Account</th>
                          <th className="py-1 text-center">Type</th>
                          <th className="py-1 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {v.lines.map((l, lIdx) => (
                          <tr key={l.id || lIdx} className="border-b border-slate-100 dark:border-slate-850/50 py-1 font-mono">
                            <td className="py-1.5 text-slate-800 dark:text-slate-200 font-semibold">{l.accountName}</td>
                            <td className="py-1.5 text-center">
                              <span className={`px-1 py-0.2 rounded font-bold text-[9px] ${
                                l.type === 'DEBIT' ? 'bg-rose-50 text-rose-700' : 'bg-teal-50 text-teal-700'
                              }`}>
                                {l.type}
                              </span>
                            </td>
                            <td className="py-1.5 text-right font-bold text-slate-900 dark:text-slate-100">
                              ₹{l.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}

            {filteredVouchers.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400 italic">
                No vouchers match current filters.
              </div>
            )}
          </div>

        </div>
      )}

      {/* 6. DAILY CLOSING & RECONCILIATION */}
      {activeSubTab === 'closing' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Reconciliation Calculator */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Lock className="w-4.5 h-4.5 text-teal-600" /> Operational Daily Closing
                </h3>
                <p className="text-xs text-slate-500">Lock the day to prevent further double entries.</p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-500">Reconciliation Target Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={closingDate}
                    onChange={e => setClosingDate(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Executing a Day Lock will freeze all transaction sheets for {closingDate}. Opening balances for the next operational shift will carry forward automatically.
                </p>
                <button
                  onClick={handleCloseDay}
                  className="w-full py-2 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white cursor-pointer shadow-xs flex items-center justify-center gap-1"
                >
                  <Lock className="w-3.5 h-3.5" /> Reconcile & Lock Day
                </button>
              </div>
            </div>

            {/* Reconciliation logs / history */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Audited Daily Closings Log History
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                      <th className="py-2.5">Day Date</th>
                      <th className="py-2.5">Cash Open/Close (₹)</th>
                      <th className="py-2.5">Bank Open/Close (₹)</th>
                      <th className="py-2.5">Auditor</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closings.map(c => (
                      <tr key={c.id} className="border-b border-slate-100 dark:border-slate-850 py-3 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        <td className="py-3 font-semibold">{c.date}</td>
                        <td className="py-3">
                          <div className="space-y-0.5">
                            <span className="text-slate-400 block text-[9px]">Open: {c.cashOpening.toFixed(2)}</span>
                            <span className="text-teal-600 font-bold">Close: {c.cashClosing.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="space-y-0.5">
                            <span className="text-slate-400 block text-[9px]">Open: {c.bankOpening.toFixed(2)}</span>
                            <span className="text-indigo-600 font-bold">Close: {c.bankClosing.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="py-3 text-[10px] text-slate-500">
                          {c.closedBy} <br/> <span className="text-[9px] text-slate-400">{new Date(c.closedAt || '').toLocaleString()}</span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 flex items-center gap-0.5 w-fit">
                            <Lock className="w-2.5 h-2.5" /> LOCKED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 7. FINANCIAL AUDIT TRAIL */}
      {activeSubTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <ClipboardList className="w-4.5 h-4.5 text-teal-600" /> General Ledger Financial Audit Trail
            </h3>
            <p className="text-xs text-slate-500">Immutable ledger log tracking journal post operations, account setups and reconciliations.</p>
          </div>

          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                  <th className="py-2">Timestamp</th>
                  <th className="py-2">Operator / User</th>
                  <th className="py-2">Action Event</th>
                  <th className="py-2">Subsystem</th>
                  <th className="py-2">Adjustment Description Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(l => (
                  <tr key={l.id} className="border-b border-slate-100 dark:border-slate-850 py-3 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                    <td className="py-3 text-slate-400">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{l.userName}</td>
                    <td className="py-3">
                      <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 text-[10px] text-slate-500 font-bold">{l.module}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* --- FORM MODALS & FLYOUT WINDOWS --- */}
      {/* ======================================= */}

      {/* Modal 1: Register New Account */}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Register New General Ledger Account
              </h3>
              <button onClick={() => setShowAddAccount(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-500">Account Code</label>
                  <input
                    type="text"
                    required
                    value={newAccCode}
                    onChange={e => setNewAccCode(e.target.value)}
                    placeholder="e.g. 50050"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-500">Account Type</label>
                  <select
                    value={newAccType}
                    onChange={e => setNewAccType(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="EQUITY">EQUITY</option>
                    <option value="INCOME">INCOME</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-slate-500">Account Name</label>
                <input
                  type="text"
                  required
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  placeholder="e.g. Maintenance and Repairs"
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-slate-500">Opening Balance (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newAccOpening}
                  onChange={e => setNewAccOpening(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg font-mono focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccount(false)}
                  className="px-3.5 py-2 font-semibold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Register Account
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal 2: Log Expense Request */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-teal-600" /> Log Business Outlay Expense Request
              </h3>
              <button onClick={() => setShowAddExpense(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-500">Expense Outlay Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-500">Vendor Reference Code</label>
                  <input
                    type="text"
                    value={expVendorRef}
                    onChange={e => setExpVendorRef(e.target.value)}
                    placeholder="e.g. INV-2026-981"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-slate-500">Expense category Ledger Account</label>
                <select
                  required
                  value={expCategoryId}
                  onChange={e => setExpCategoryId(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                >
                  <option value="">-- Choose Category Ledger --</option>
                  {accounts.filter(a => a.type === 'EXPENSE').map(a => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name} (Balance: ₹{a.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-500">Paid / Disbursed To</label>
                  <input
                    type="text"
                    required
                    value={expPaidTo}
                    onChange={e => setExpPaidTo(e.target.value)}
                    placeholder="Vendor or staff member name"
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-500">Payment Mode</label>
                  <select
                    value={expMode}
                    onChange={e => setExpMode(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                  >
                    <option value="CASH">CASH (Disbursed from Petty Cash)</option>
                    <option value="BANK">BANK (Direct NEFT/RTGS Transfer)</option>
                    <option value="UPI">UPI (Unified Payments Interface)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-500">Source Disbursing Account</label>
                  <select
                    required
                    value={expPaidFromId}
                    onChange={e => setExpPaidFromId(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                  >
                    <option value="acc-cash">Petty Cash (Bal: ₹{totalPettyCash.toFixed(2)})</option>
                    <option value="acc-bank">HDFC Corporate Bank (Bal: ₹{totalBank.toFixed(2)})</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-500">Recurring Schedule</label>
                  <div className="flex items-center gap-3 pt-1.5">
                    <label className="flex items-center gap-1.5 font-normal">
                      <input
                        type="checkbox"
                        checked={expIsRecurring}
                        onChange={e => setExpIsRecurring(e.target.checked)}
                        className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                      />
                      Is Recurring
                    </label>
                    {expIsRecurring && (
                      <select
                        value={expRecInterval}
                        onChange={e => setExpRecInterval(e.target.value as any)}
                        className="p-1 border border-slate-200 dark:border-slate-850 rounded"
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-medium text-slate-500">Narration Notes & Descriptions</label>
                <textarea
                  value={expNotes}
                  onChange={e => setExpNotes(e.target.value)}
                  placeholder="Explain the operational purpose of this business outlay..."
                  rows={2}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                />
              </div>

              {/* Dragg-Drop Attachments Simulation */}
              <div className="space-y-1.5">
                <label className="block font-medium text-slate-500">Attach Invoices & Receipts (Optional)</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border border-dashed p-4 rounded-lg text-center cursor-pointer transition-all ${
                    dragActive ? 'border-teal-500 bg-teal-50/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40'
                  }`}
                >
                  <FileUp className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400">Drag & drop receipt PDF or click to browse files.</p>
                </div>
                {expAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {expAttachments.map((f, i) => (
                      <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-[9px] flex items-center gap-1 text-slate-500">
                        {f} <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => setExpAttachments(expAttachments.filter((_, idx) => idx !== i))} />
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-3.5 py-2 font-semibold text-slate-500 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs"
                >
                  Submit Expense for Approval
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal 3: Post Manual Voucher (Double Entry Balancing verification) */}
      {showAddVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-teal-600" /> Post Double-Entry Journal Voucher
              </h3>
              <button onClick={() => setShowAddVoucher(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-500">Voucher Type</label>
                  <select
                    value={vouType}
                    onChange={e => setVouType(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                  >
                    <option value="JOURNAL">JOURNAL (Adjustments)</option>
                    <option value="PAYMENT">PAYMENT (Outlays)</option>
                    <option value="RECEIPT">RECEIPT (Inflows)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-500">Posting Date</label>
                  <input
                    type="date"
                    required
                    value={vouDate}
                    onChange={e => setVouDate(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-medium text-slate-500">Payment Mode</label>
                  <select
                    value={vouMode}
                    onChange={e => setVouMode(e.target.value as any)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                  >
                    <option value="CASH">CASH (Physical Treasury)</option>
                    <option value="BANK">BANK (Corporate Bank Account)</option>
                    <option value="UPI">UPI (Digital Payments)</option>
                  </select>
                </div>
              </div>

              {/* Narrations */}
              <div className="space-y-1.5">
                <label className="block font-medium text-slate-500">Narration notes (Double Entry Documentation)</label>
                <input
                  type="text"
                  required
                  value={vouNotes}
                  onChange={e => setVouNotes(e.target.value)}
                  placeholder="e.g. Transferred Petty Cash replenishment to bank account, offset adjustments."
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none"
                />
              </div>

              {/* Double Entry Lines Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">Journal Adjustment Lines</h4>
                  <button
                    type="button"
                    onClick={addVoucherLine}
                    className="px-2.5 py-1 text-[11px] rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Debit/Credit Line
                  </button>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {vouLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-150 dark:border-slate-850">
                      
                      {/* Account Choice */}
                      <div className="col-span-5">
                        <select
                          required
                          value={line.accountId}
                          onChange={e => updateVouLine(idx, 'accountId', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 focus:outline-none"
                        >
                          <option value="">-- Choose Account --</option>
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.code} - {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Type Choice */}
                      <div className="col-span-3">
                        <select
                          value={line.type}
                          onChange={e => updateVouLine(idx, 'type', e.target.value)}
                          className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 focus:outline-none"
                        >
                          <option value="DEBIT">DEBIT (Dr)</option>
                          <option value="CREDIT">CREDIT (Cr)</option>
                        </select>
                      </div>

                      {/* Amount */}
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={line.amount}
                          onChange={e => updateVouLine(idx, 'amount', e.target.value)}
                          placeholder="Amount"
                          className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 font-mono focus:outline-none"
                        />
                      </div>

                      {/* Delete */}
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeVoucherLine(idx)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Verification & Balancing Bar */}
              <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 border border-slate-200 dark:border-slate-850">
                <div className="flex gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Debits</span>
                    <span className="text-xs font-mono font-bold text-rose-600">₹{debits.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Credits</span>
                    <span className="text-xs font-mono font-bold text-teal-600">₹{credits.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Out Of Balance</span>
                    <span className={`text-xs font-mono font-bold ${difference === 0 ? 'text-teal-600' : 'text-amber-500'}`}>
                      ₹{difference.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  {isBalanced ? (
                    <span className="px-2.5 py-1 rounded bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 text-[10px] font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Journal Balance Matches
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Journal Unbalanced
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddVoucher(false)}
                  className="px-3.5 py-2 font-semibold text-slate-500 hover:bg-slate-50 rounded-lg animate-pulse"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isBalanced}
                  className={`px-4 py-2 font-semibold rounded-lg text-white shadow-xs ${
                    isBalanced ? 'bg-teal-600 hover:bg-teal-700 cursor-pointer' : 'bg-slate-300 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Post Balanced Voucher
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
