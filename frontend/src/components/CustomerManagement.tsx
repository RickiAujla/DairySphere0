import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Edit2, Trash2, ArrowLeft, Download, Upload, 
  Printer, CheckCircle2, XCircle, CreditCard, FileText, ChevronLeft, ChevronRight, 
  RefreshCw, Eye, ShieldAlert, Check, Landmark, X
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';
import { api } from '../utils/api';
import { SessionData } from '../types';

interface CustomerManagementProps {
  session: SessionData;
}

export function CustomerManagement({ session }: CustomerManagementProps) {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [ledger, setLedger] = useState<any[]>([]);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCategory, setFormCategory] = useState('Retailer');
  const [formGst, setFormGst] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState('200000');
  const [formStatus, setFormStatus] = useState('ACTIVE');

  // Load Customers
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err: any) {
      showToast(err.message || 'Error loading customers.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Load customer ledger when one is selected
  useEffect(() => {
    if (selectedCustomer) {
      api.getCustomerLedger(selectedCustomer.id)
        .then(data => setLedger(data))
        .catch(() => showToast('Error loading customer ledger', 'error'));
    }
  }, [selectedCustomer]);

  // CRUD actions
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Customer name is required', 'error');
      return;
    }
    try {
      await api.createCustomer({
        name: formName,
        email: formEmail,
        phone: formPhone,
        address: formAddress,
        category: formCategory,
        gstNumber: formGst,
        creditLimit: formCreditLimit,
        status: formStatus
      });
      showToast('Customer registered successfully', 'success');
      setShowAddModal(false);
      resetForm();
      loadCustomers();
    } catch (err: any) {
      showToast(err.message || 'Error registering customer.', 'error');
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const updated = await api.updateCustomer(selectedCustomer.id, {
        name: formName,
        email: formEmail,
        phone: formPhone,
        address: formAddress,
        category: formCategory,
        gstNumber: formGst,
        creditLimit: formCreditLimit,
        status: formStatus
      });
      showToast('Customer profile updated', 'success');
      setShowEditModal(false);
      setSelectedCustomer(updated);
      resetForm();
      loadCustomers();
    } catch (err: any) {
      showToast(err.message || 'Error updating customer.', 'error');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    confirm({
      title: 'Delete Customer',
      message: 'Are you sure you want to permanently delete this customer account? This cannot be undone.',
      onConfirm: async () => {
        try {
          await api.deleteCustomer(id);
          showToast('Customer deleted successfully', 'success');
          setSelectedCustomer(null);
          loadCustomers();
        } catch (err: any) {
          showToast(err.message || 'Error deleting customer', 'error');
        }
      }
    });
  };

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormCategory('Retailer');
    setFormGst('');
    setFormCreditLimit('200000');
    setFormStatus('ACTIVE');
  };

  const openEditModal = (cust: any) => {
    setFormName(cust.name);
    setFormEmail(cust.email);
    setFormPhone(cust.phone);
    setFormAddress(cust.address);
    setFormCategory(cust.category);
    setFormGst(cust.gstNumber);
    setFormCreditLimit(String(cust.creditLimit));
    setFormStatus(cust.status);
    setShowEditModal(true);
  };

  // Filter & Search Logic
  const filteredCustomers = customers.filter(cust => {
    const matchesSearch = 
      cust.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.phone.includes(searchQuery);
    
    const matchesCategory = categoryFilter === 'all' || cust.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || cust.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination Logic
  const totalItems = filteredCustomers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentItems = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Excel Export
  const exportToCSV = () => {
    const headers = ['Customer Code,Customer Name,Email,Phone,Category,GST Number,Credit Limit,Outstanding Balance,Status'];
    const rows = filteredCustomers.map(c => 
      `"${c.code}","${c.name}","${c.email}","${c.phone}","${c.category}","${c.gstNumber}",${c.creditLimit},${c.outstandingBalance || 0},"${c.status}"`
    );
    const content = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dairysphere_Customers_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Customer data exported successfully as CSV', 'success');
  };

  // MOCK Import Parser
  const [importText, setImportText] = useState('');
  const handleCSVImport = async () => {
    if (!importText.trim()) {
      showToast('Please paste CSV contents to import', 'error');
      return;
    }
    try {
      const lines = importText.split('\n');
      let importCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const columns = line.split(',').map(s => s.replace(/"/g, ''));
        if (columns.length >= 2 && columns[1]) {
          await api.createCustomer({
            name: columns[1],
            email: columns[2] || '',
            phone: columns[3] || '',
            category: columns[4] || 'Retailer',
            gstNumber: columns[5] || '',
            creditLimit: columns[6] || '200000',
            status: 'ACTIVE'
          });
          importCount++;
        }
      }
      showToast(`Imported ${importCount} customers successfully`, 'success');
      setShowImportModal(false);
      setImportText('');
      loadCustomers();
    } catch (err: any) {
      showToast('Error parsing CSV import data.', 'error');
    }
  };

  // Print Statement Helper
  const handlePrintLedger = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="customer-mgmt-container">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Customer Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Registered commercial buyers, bulk milk distributors, retail chains and cooperative clients.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            id="import-btn"
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            id="export-btn"
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>
          <button
            id="register-cust-btn"
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 dark:bg-indigo-500 rounded-xl text-xs font-bold text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition shadow-md shadow-indigo-600/10"
          >
            <Plus className="w-4 h-4" />
            Register Customer
          </button>
        </div>
      </div>

      {selectedCustomer ? (
        /* CUSTOMER PROFILE DRILLDOWN VIEW */
        <div className="space-y-6">
          <button
            onClick={() => setSelectedCustomer(null)}
            className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory List
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* profile card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full mb-3">
                    {selectedCustomer.code}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedCustomer.name}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{selectedCustomer.category}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  selectedCustomer.status === 'ACTIVE' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {selectedCustomer.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {selectedCustomer.status}
                </span>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Primary Email</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{selectedCustomer.email || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Phone Number</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">{selectedCustomer.phone || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Physical Delivery Address</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 block leading-relaxed">{selectedCustomer.address || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">GST Identification Number</span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400 font-mono font-bold tracking-wider uppercase">
                    {selectedCustomer.gstNumber || 'UNREGISTERED / NONE'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl space-y-3 border border-slate-100 dark:border-slate-900">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Outstanding Balance:</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">Rs. {Number(selectedCustomer.outstandingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Credit Limit:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">Rs. {Number(selectedCustomer.creditLimit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {selectedCustomer.creditLimit > 0 && (
                    <div className="space-y-1 pt-1">
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            (selectedCustomer.outstandingBalance / selectedCustomer.creditLimit) > 0.8 ? 'bg-rose-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(100, (selectedCustomer.outstandingBalance / selectedCustomer.creditLimit) * 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Limit Utilized</span>
                        <span>{Math.round((selectedCustomer.outstandingBalance / selectedCustomer.creditLimit) * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => openEditModal(selectedCustomer)}
                  className="flex-1 inline-flex justify-center items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
                <button
                  onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                  className="inline-flex justify-center items-center p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900 rounded-xl transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* LEDGER STATEMENT */}
            <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-indigo-500" />
                      Customer Account Ledger Statement
                    </h3>
                    <p className="text-xs text-slate-500">Live outstanding audit ledger for settlements, invoicing, and debit runs.</p>
                  </div>
                  <button
                    onClick={handlePrintLedger}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Statement
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-3 text-right">Debit (+)</th>
                        <th className="py-2.5 px-3 text-right">Credit (-)</th>
                        <th className="py-2.5 px-3 text-right">Running Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ledger.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-sm text-slate-400">
                            No account statement logs recorded for this buyer.
                          </td>
                        </tr>
                      ) : (
                        ledger.map((log) => (
                          <tr key={log.id} className="text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="py-3 px-3 text-slate-500 font-mono">{log.date}</td>
                            <td className="py-3 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                                log.type === 'INVOICE' 
                                  ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600' 
                                  : log.type === 'PAYMENT'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                                  : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600'
                              }`}>
                                {log.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">{log.referenceNumber}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                              {log.debit > 0 ? `Rs. ${log.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                              {log.credit > 0 ? `Rs. ${log.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              Rs. {log.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Account statements are generated in real-time according to transaction ledgers.</span>
                <span className="font-mono text-indigo-500">Business Unit: {session.business?.name || 'DairySphere Enterprise'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MAIN DIRECTORY DIRECTORY LIST VIEW */
        <div className="space-y-4">
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer name, custom buyer code, or phone number..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Buyer Classes</option>
                  <option value="Retailer">Retailer Stores</option>
                  <option value="Wholesaler">Wholesaler Cooperatives</option>
                  <option value="Distributor">Silo Distributors</option>
                  <option value="Enterprise">Corporate Enterprise</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="ACTIVE">ACTIVE ONLY</option>
                  <option value="INACTIVE">INACTIVE ONLY</option>
                </select>
              </div>

              <button
                onClick={() => { setSearchQuery(''); setCategoryFilter('all'); setStatusFilter('all'); }}
                className="inline-flex items-center px-3 py-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-sm font-medium text-slate-400">Loading Customer Profiles Registry...</span>
              </div>
            ) : totalItems === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No customers matched your query</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md">Try resetting active filter values or register a new customer profile manually above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900">
                      <th className="py-3 px-4.5">Code</th>
                      <th className="py-3 px-4.5">Customer Name</th>
                      <th className="py-3 px-4.5">Contact Detail</th>
                      <th className="py-3 px-4.5">Type Class</th>
                      <th className="py-3 px-4.5">GSTIN Identification</th>
                      <th className="py-3 px-4.5 text-right">Credit Limit</th>
                      <th className="py-3 px-4.5 text-right">Outstanding Balance</th>
                      <th className="py-3 px-4.5 text-center">Status</th>
                      <th className="py-3 px-4.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentItems.map((cust) => (
                      <tr 
                        key={cust.id} 
                        className="text-xs hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition duration-150"
                      >
                        <td className="py-3.5 px-4.5 font-mono text-slate-400 font-bold">{cust.code}</td>
                        <td className="py-3.5 px-4.5">
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="font-bold text-slate-950 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline text-left block"
                          >
                            {cust.name}
                          </button>
                        </td>
                        <td className="py-3.5 px-4.5">
                          <span className="block text-slate-700 dark:text-slate-300 font-mono">{cust.phone || '—'}</span>
                          <span className="block text-[10px] text-slate-400">{cust.email || '—'}</span>
                        </td>
                        <td className="py-3.5 px-4.5">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {cust.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4.5">
                          {cust.gstNumber ? (
                            <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-wider">
                              {cust.gstNumber}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Unregistered / Cash Sales</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4.5 text-right font-mono text-slate-700 dark:text-slate-300">
                          Rs. {Number(cust.creditLimit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4.5 text-right font-mono font-bold text-rose-600">
                          Rs. {Number(cust.outstandingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            cust.status === 'ACTIVE' 
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' 
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cust.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {cust.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedCustomer(cust)}
                              className="p-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title="View Ledger Statement"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(cust)}
                              className="p-1.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                              title="Edit Customer Profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(cust.id)}
                              className="p-1.5 border border-slate-200 dark:border-slate-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/35 rounded-lg transition"
                              title="Delete Customer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PAGINATION PANEL */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500">
                  Showing <strong className="text-slate-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
                  <strong className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-white">{totalItems}</strong> customers
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono px-3">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-5 h-5 text-indigo-500" />
                Register Commercial Customer
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Customer / Entity Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Verka Outlets Amritsar Hub"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="billing@verka.coop"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98123 45678"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Buyer Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Retailer">Retailer Stores</option>
                    <option value="Wholesaler">Wholesaler Cooperative</option>
                    <option value="Distributor">Silo Distributor</option>
                    <option value="Enterprise">Corporate Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={formGst}
                    onChange={(e) => setFormGst(e.target.value.toUpperCase())}
                    placeholder="e.g. 03AABCV5678D2Z9"
                    maxLength={15}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Authorized Credit Limit (Rs.)</label>
                  <input
                    type="number"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(e.target.value)}
                    placeholder="200000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Delivery / Mailing Address</label>
                  <textarea
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Enter full billing & logistics delivery address detail..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Save Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT CUSTOMER MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-5 h-5 text-indigo-500" />
                Edit Commercial Buyer Profile
              </h2>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Customer / Entity Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Verka Outlets Amritsar Hub"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="billing@verka.coop"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98123 45678"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Buyer Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Retailer">Retailer Stores</option>
                    <option value="Wholesaler">Wholesaler Cooperative</option>
                    <option value="Distributor">Silo Distributor</option>
                    <option value="Enterprise">Corporate Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={formGst}
                    onChange={(e) => setFormGst(e.target.value.toUpperCase())}
                    placeholder="e.g. 03AABCV5678D2Z9"
                    maxLength={15}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Authorized Credit Limit (Rs.)</label>
                  <input
                    type="number"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(e.target.value)}
                    placeholder="200000"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Delivery / Mailing Address</label>
                  <textarea
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="Enter full billing & logistics delivery address detail..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. IMPORT CSV MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-55 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Upload className="w-5 h-5 text-indigo-500" />
                Batch Import Customer Accounts
              </h2>
              <button onClick={() => setShowImportModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400">
                Paste raw comma-separated CSV rows below to register customers in bulk. Ensure the format matches the headers strictly.
              </p>

              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">CSV Template Header Schema</span>
                <code className="text-[11px] font-mono block text-indigo-600 dark:text-indigo-400 select-all">
                  Code,Name,Email,Phone,Category,GstNumber,CreditLimit
                </code>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Paste CSV Contents</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={`CUST-012,Ludhiana Ice Creams,contact@ludhiana.in,+91 9988112233,Wholesaler,03AABCL9999Z,300000\nCUST-013,Doaba Dairy Agency,sodhi@doaba.co,+91 9811223344,Distributor,,500000`}
                  rows={6}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCSVImport}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Import Batch Rows
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
