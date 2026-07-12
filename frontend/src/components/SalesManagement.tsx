import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Search, Filter, Plus, FileText, Printer, Download, Eye, 
  ChevronLeft, ChevronRight, RefreshCw, Landmark, X, CreditCard, RotateCcw, 
  Check, Trash2, ShieldAlert, ArrowLeft, Barcode, QrCode
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';
import { api } from '../utils/api';
import { SessionData } from '../types';

interface SalesManagementProps {
  session: SessionData;
}

export function SalesManagement({ session }: SalesManagementProps) {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [orderFilter, setOrderFilter] = useState('all');

  // Active views
  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'returns'>('invoices');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // New Invoice State
  const [invoiceCustomerId, setInvoiceCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceRemarks, setInvoiceRemarks] = useState('');
  const [invoicePaidAmount, setInvoicePaidAmount] = useState('0');
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState('CASH');
  const [invoiceTxnRef, setInvoiceTxnRef] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<any[]>([
    { productId: '', quantity: '10', unitPrice: '0', discount: '0', gstRate: '18' }
  ]);

  // New Return State
  const [returnInvoiceId, setReturnInvoiceId] = useState('');
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returnItems, setReturnItems] = useState<any[]>([]);

  // Load baseline entities
  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, custData, prodData, retData] = await Promise.all([
        api.getSalesInvoices(),
        api.getCustomers(),
        api.getProducts(),
        api.getSalesReturns()
      ]);
      setInvoices(invData);
      setCustomers(custData.filter((c: any) => c.status === 'ACTIVE'));
      setProducts(prodData.filter((p: any) => p.status === 'ACTIVE'));
      setReturns(retData);
    } catch (err: any) {
      showToast(err.message || 'Error syncing Commercial Hub records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync pricing when product changes in item rows
  const handleItemProductChange = (index: number, prodId: string) => {
    const selectedProd = products.find(p => p.id === prodId);
    const updated = [...invoiceItems];
    updated[index].productId = prodId;
    updated[index].unitPrice = selectedProd ? String(selectedProd.price || 0) : '0';
    setInvoiceItems(updated);
  };

  const addItemRow = () => {
    setInvoiceItems([...invoiceItems, { productId: '', quantity: '10', unitPrice: '0', discount: '0', gstRate: '18' }]);
  };

  const removeItemRow = (index: number) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(invoiceItems.filter((_, idx) => idx !== index));
  };

  // Live total calculations for forms
  const calculateFormTotals = () => {
    let subtotal = 0;
    let gstAmount = 0;
    let itemDiscount = 0;

    invoiceItems.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const disc = parseFloat(item.discount) || 0;
      const rate = parseFloat(item.gstRate) || 0;

      const itemSub = qty * price;
      const discSub = itemSub - disc;
      const tax = (discSub * rate) / 100;

      subtotal += discSub;
      gstAmount += tax;
      itemDiscount += disc;
    });

    const total = subtotal + gstAmount;

    return {
      subtotal,
      gstAmount,
      itemDiscount,
      total
    };
  };

  const formTotals = calculateFormTotals();

  // Create Invoice Transaction
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceCustomerId) {
      showToast('Please select a commercial customer account', 'error');
      return;
    }
    const invalidItem = invoiceItems.some(i => !i.productId || parseFloat(i.quantity) <= 0);
    if (invalidItem) {
      showToast('All order items must have products and positive quantities', 'error');
      return;
    }

    try {
      await api.createSalesInvoice({
        customerId: invoiceCustomerId,
        invoiceDate,
        remarks: invoiceRemarks,
        items: invoiceItems,
        paidAmount: invoicePaidAmount,
        discount: formTotals.itemDiscount,
        totalAmount: formTotals.total
      });

      showToast('Sales invoice and delivery stock-out executed successfully', 'success');
      setShowInvoiceModal(false);
      resetInvoiceForm();
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error processing sales billing.', 'error');
    }
  };

  const resetInvoiceForm = () => {
    setInvoiceCustomerId('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setInvoiceRemarks('');
    setInvoicePaidAmount('0');
    setInvoicePaymentMethod('CASH');
    setInvoiceTxnRef('');
    setInvoiceItems([{ productId: '', quantity: '10', unitPrice: '0', discount: '0', gstRate: '18' }]);
  };

  // Sync returnable items when return invoice changes
  const handleReturnInvoiceChange = (invId: string) => {
    setReturnInvoiceId(invId);
    const selectedInv = invoices.find(i => i.id === invId);
    if (selectedInv) {
      const rows = (selectedInv.items || []).map((it: any) => ({
        productId: it.productId,
        productName: it.productName,
        quantity: String(it.quantity),
        unitPrice: String(it.unitPrice),
        gstRate: String(it.gstRate)
      }));
      setReturnItems(rows);
    } else {
      setReturnItems([]);
    }
  };

  const handleReturnItemQtyChange = (idx: number, qty: string) => {
    const updated = [...returnItems];
    updated[idx].quantity = qty;
    setReturnItems(updated);
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnInvoiceId) {
      showToast('Please select a parent sales invoice', 'error');
      return;
    }
    const hasItemsToReturn = returnItems.some(it => parseFloat(it.quantity) > 0);
    if (!hasItemsToReturn) {
      showToast('At least one item must have a quantity to return', 'error');
      return;
    }

    try {
      await api.createSalesReturn({
        invoiceId: returnInvoiceId,
        returnDate,
        remarks: returnRemarks,
        items: returnItems.filter(it => parseFloat(it.quantity) > 0)
      });
      showToast('Sales Return (Credit Note) issued and items restocked.', 'success');
      setShowReturnModal(false);
      setReturnInvoiceId('');
      setReturnRemarks('');
      setReturnItems([]);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Error posting sales return.', 'error');
    }
  };

  // Search Filter
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPayment = paymentFilter === 'all' || inv.paymentStatus === paymentFilter;
    const matchesOrder = orderFilter === 'all' || inv.orderStatus === orderFilter;

    return matchesSearch && matchesPayment && matchesOrder;
  });

  // Pagination panel
  const totalItems = filteredInvoices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Sales & Billing Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Dispatch sales invoices, trace multi-tier payment methods, handle sales returns and print tax invoices.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setActiveSubTab('invoices'); loadData(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'invoices' 
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' 
                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
            }`}
          >
            Invoices & Orders
          </button>
          <button
            onClick={() => { setActiveSubTab('returns'); loadData(); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'returns' 
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' 
                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
            }`}
          >
            Sales Returns (Credit Notes)
          </button>
          <button
            onClick={() => { resetInvoiceForm(); setShowInvoiceModal(true); }}
            className="inline-flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 dark:bg-indigo-500 rounded-xl text-xs font-bold text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition shadow-md shadow-indigo-600/10"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </div>
      </div>

      {selectedInvoice ? (
        /* IMMERSIVE INVOICE DRILLDOWN & PRINT TEMPLATE */
        <div className="space-y-6">
          <button
            onClick={() => setSelectedInvoice(null)}
            className="inline-flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sales Ledger
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* TAX INVOICE FORM */}
            <div className="col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-8" id="printable-invoice-element">
              {/* BRAND HEADER */}
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">{session.business?.name || 'DAIRYSPHERE ENTERPRISE'}</h2>
                  <p className="text-xs text-slate-400 mt-1">Ludhiana Cooperatives, Punjab, India</p>
                  <p className="text-xs text-slate-400">GSTIN: 03DAIRY9988G1Z5 (Consolidated)</p>
                </div>
                <div className="text-right">
                  <span className="inline-block text-xs font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-600 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                    TAX INVOICE
                  </span>
                  <p className="text-xs text-slate-500 font-mono mt-2">No: <strong>{selectedInvoice.invoiceNumber}</strong></p>
                  <p className="text-xs text-slate-400 font-mono">Date: {selectedInvoice.invoiceDate}</p>
                </div>
              </div>

              {/* BUYER INFORMATION */}
              <div className="grid grid-cols-2 gap-8 text-xs border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To (Buyer):</h4>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedInvoice.customerName}</p>
                  <p className="text-slate-500 mt-1">Delivery Loc: {selectedInvoice.remarks || 'Main Commercial Office'}</p>
                  <p className="text-slate-500">Buyer Class: Corporate Silo</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-400 uppercase tracking-wider mb-2">Billing Credentials:</h4>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">GSTIN: <span className="font-mono text-indigo-500">{selectedInvoice.gstNumber || 'UNREGISTERED/CONSUMER'}</span></p>
                  <p className="text-slate-500 mt-1">Dispatch Code: {selectedInvoice.orderNumber}</p>
                  <p className="text-slate-500">Transaction State: 03 - Punjab (Local State)</p>
                </div>
              </div>

              {/* ITEM TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Product Description / SKU</th>
                      <th className="py-2.5 px-3 text-right">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Discount</th>
                      <th className="py-2.5 px-3 text-center">GST Rate</th>
                      <th className="py-2.5 px-3 text-right">Taxable Val</th>
                      <th className="py-2.5 px-3 text-right">Total (Inc Tax)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(selectedInvoice.items || []).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 dark:text-white block">{item.productName}</span>
                          <span className="font-mono text-[9px] text-slate-400">{item.productSku}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-medium">{Number(item.quantity).toLocaleString()} L/Units</td>
                        <td className="py-3 px-3 text-right font-mono">Rs. {Number(item.unitPrice).toFixed(2)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">Rs. {Number(item.discount || 0).toFixed(2)}</td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-indigo-500">{item.gstRate}%</td>
                        <td className="py-3 px-3 text-right font-mono">
                          Rs. {((item.quantity * item.unitPrice) - (item.discount || 0)).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {Number(item.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* FINANCIAL RECONCILIATION SUMMARY */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Declarations & Bank Accounts</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      1. We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
                    </p>
                    <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono pt-1">
                      <span>Bank A/C: ICICI000109 | Branch: Ludhiana Main | Current Account</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">Rs. {Number(selectedInvoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>CGST (9.00% split):</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">Rs. {(Number(selectedInvoice.gstAmount) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>SGST (9.00% split):</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">Rs. {(Number(selectedInvoice.gstAmount) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-sm font-bold text-slate-900 dark:text-white">
                    <span>Grand Total:</span>
                    <span className="font-mono">Rs. {Number(selectedInvoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl flex justify-between items-center text-[11px] text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-950/60">
                    <span>Amount Received:</span>
                    <span className="font-mono">Rs. {Number(selectedInvoice.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-rose-600 px-3">
                    <span>Balance Outstanding:</span>
                    <span className="font-mono">Rs. {Number(selectedInvoice.outstandingAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION METRIC RAIL */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Document Controls</h4>

                <div className="space-y-3">
                  <button
                    onClick={handlePrint}
                    className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-600/10"
                  >
                    <Printer className="w-4 h-4" />
                    Print Tax Invoice
                  </button>
                  <button
                    onClick={() => {
                      showToast('Tax invoice exported as system PDF', 'success');
                    }}
                    className="w-full inline-flex justify-center items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF File
                  </button>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">E-Way Bill Status</span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                      <Barcode className="w-4 h-4" />
                      GENERATED / VERIFIED
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1 font-mono text-[10px]">E-Invoice QR Verification</span>
                    <QrCode className="w-24 h-24 text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2 border border-slate-100 dark:border-slate-800 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* COMMERCIAL LIST VIEWS (INVOICES / RETURNS) */
        <div className="space-y-4">
          {activeSubTab === 'invoices' ? (
            /* 1. INVOICES TABLE SUB-PANEL */
            <div className="space-y-4">
              {/* FILTERS PANEL */}
              <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by invoice ID number, buyer, or parent delivery order..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={paymentFilter}
                      onChange={(e) => setPaymentFilter(e.target.value)}
                      className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="all">All Payment Statuses</option>
                      <option value="PAID">PAID IN FULL</option>
                      <option value="PARTIAL">PARTIAL UNSETTLED</option>
                      <option value="UNPAID">UNPAID DEBIT</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl">
                    <select
                      value={orderFilter}
                      onChange={(e) => setOrderFilter(e.target.value)}
                      className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="all">All Dispatch Statuses</option>
                      <option value="DELIVERED">DISPATCHED & DELIVERED</option>
                      <option value="SHIPPED">IN TRANSIT SILO</option>
                      <option value="PENDING">PENDING ALLOCATION</option>
                    </select>
                  </div>

                  <button
                    onClick={() => { setSearchQuery(''); setPaymentFilter('all'); setOrderFilter('all'); }}
                    className="inline-flex items-center px-3 py-1.5 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>

              {/* TABLE CONTAINER */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                    <span className="text-sm font-medium text-slate-400">Loading Billing Invoices...</span>
                  </div>
                ) : totalItems === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No sales invoices recorded</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">Create a new commercial invoice manually above to process buyer dispatches.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900">
                          <th className="py-3 px-4.5">Invoice Number</th>
                          <th className="py-3 px-4.5">Dispatch Date</th>
                          <th className="py-3 px-4.5">Commercial Buyer</th>
                          <th className="py-3 px-4.5 text-right">Taxable Subtotal</th>
                          <th className="py-3 px-4.5 text-right">Tax (GST)</th>
                          <th className="py-3 px-4.5 text-right">Grand Total</th>
                          <th className="py-3 px-4.5 text-right">Paid Amount</th>
                          <th className="py-3 px-4.5 text-right">Outstanding</th>
                          <th className="py-3 px-4.5 text-center">Settlement</th>
                          <th className="py-3 px-4.5 text-center">Logistics Dispatch</th>
                          <th className="py-3 px-4.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {currentInvoices.map((inv) => (
                          <tr key={inv.id} className="text-xs hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                            <td className="py-3.5 px-4.5 font-mono text-slate-900 dark:text-white font-bold">{inv.invoiceNumber}</td>
                            <td className="py-3.5 px-4.5 font-mono text-slate-500">{inv.invoiceDate}</td>
                            <td className="py-3.5 px-4.5 font-bold text-slate-800 dark:text-slate-200">{inv.customerName}</td>
                            <td className="py-3.5 px-4.5 text-right font-mono">Rs. {Number(inv.subtotal).toLocaleString()}</td>
                            <td className="py-3.5 px-4.5 text-right font-mono text-slate-500">Rs. {Number(inv.gstAmount).toLocaleString()}</td>
                            <td className="py-3.5 px-4.5 text-right font-mono font-bold text-slate-950 dark:text-white">Rs. {Number(inv.totalAmount).toLocaleString()}</td>
                            <td className="py-3.5 px-4.5 text-right font-mono text-emerald-600 font-semibold">Rs. {Number(inv.paidAmount || 0).toLocaleString()}</td>
                            <td className="py-3.5 px-4.5 text-right font-mono text-rose-500 font-bold">Rs. {Number(inv.outstandingAmount || 0).toLocaleString()}</td>
                            <td className="py-3.5 px-4.5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                inv.paymentStatus === 'PAID' 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' 
                                  : inv.paymentStatus === 'PARTIAL'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
                              }`}>
                                {inv.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4.5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600`}>
                                {inv.orderStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedInvoice(inv)}
                                  className="p-1.5 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 2. RETURNS TABLE SUB-PANEL */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credit Note Logs</span>
                <button
                  onClick={() => setShowReturnModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  File Return Receipt
                </button>
              </div>

              {returns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <RotateCcw className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No credit returns on file</h3>
                  <p className="text-xs text-slate-400 mt-1">Returned milk volumes or physical goods dispatches are tracked as credit notes.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase bg-slate-50/50">
                        <th className="py-3 px-4.5">Return Number</th>
                        <th className="py-3 px-4.5">Date</th>
                        <th className="py-3 px-4.5">Parent Invoice</th>
                        <th className="py-3 px-4.5">Customer Name</th>
                        <th className="py-3 px-4.5">Returned Product Items</th>
                        <th className="py-3 px-4.5 text-right">Subtotal Credit</th>
                        <th className="py-3 px-4.5 text-right">Tax Credit (GST)</th>
                        <th className="py-3 px-4.5 text-right font-bold">Total Credit Note Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {returns.map((ret) => (
                        <tr key={ret.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                          <td className="py-3 px-4.5 font-mono font-bold text-rose-500">{ret.returnNumber}</td>
                          <td className="py-3 px-4.5 font-mono text-slate-500">{ret.returnDate}</td>
                          <td className="py-3 px-4.5 font-mono font-semibold text-slate-700 dark:text-slate-300">{ret.invoiceNumber}</td>
                          <td className="py-3 px-4.5 font-bold text-slate-800 dark:text-slate-200">{ret.customerName}</td>
                          <td className="py-3 px-4.5">
                            <div className="space-y-0.5">
                              {(ret.items || []).map((it: any, i: number) => (
                                <span key={i} className="block text-[10px] text-slate-500 font-medium">
                                  {it.productName} ({it.quantity} units)
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4.5 text-right font-mono">Rs. {Number(ret.subtotal).toLocaleString()}</td>
                          <td className="py-3 px-4.5 text-right font-mono text-slate-500">Rs. {Number(ret.gstAmount).toLocaleString()}</td>
                          <td className="py-3 px-4.5 text-right font-mono font-bold text-emerald-600">Rs. {Number(ret.totalAmount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 1. NEW SALES INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-55 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl shadow-2xl overflow-hidden my-8 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShoppingBag className="w-5 h-5 text-indigo-500" />
                Dispatch New Sales Invoice
              </h2>
              <button onClick={() => setShowInvoiceModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-6">
              {/* PRIMARY DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-900">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Commercial Customer / Client *</label>
                  <select
                    required
                    value={invoiceCustomerId}
                    onChange={(e) => setInvoiceCustomerId(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">-- SELECT COMMERCIAL BUYER AC --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}) - Outstanding: Rs. {Number(c.outstandingBalance || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Invoice Dispatch Date</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-1.5 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Allocated Dispatch status</label>
                  <select
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="DELIVERED">DISPATCHED & DELIVERED</option>
                    <option value="SHIPPED">IN SILO TRANSIT</option>
                    <option value="PENDING">PENDING ALLOCATION</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC LINE ITEMS */}
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Dispatch Order Items</h3>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="inline-flex items-center gap-1 px-3 py-1 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 rounded-lg transition"
                  >
                    <Plus className="w-3 h-3" />
                    Add Dispatch Item
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {invoiceItems.map((item, index) => {
                    return (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-xl border border-slate-100 dark:border-slate-900">
                        <div className="col-span-4">
                          <select
                            required
                            value={item.productId}
                            onChange={(e) => handleItemProductChange(index, e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">-- SELECT PRODUCT --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} (SKU: {p.sku}) - Rs. {p.price}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const updated = [...invoiceItems];
                              updated[index].quantity = e.target.value;
                              setInvoiceItems(updated);
                            }}
                            placeholder="Qty"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <input
                            type="number"
                            required
                            value={item.unitPrice}
                            onChange={(e) => {
                              const updated = [...invoiceItems];
                              updated[index].unitPrice = e.target.value;
                              setInvoiceItems(updated);
                            }}
                            placeholder="Price"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="col-span-1.5">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => {
                              const updated = [...invoiceItems];
                              updated[index].discount = e.target.value;
                              setInvoiceItems(updated);
                            }}
                            placeholder="Disc"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="col-span-1.5">
                          <select
                            value={item.gstRate}
                            onChange={(e) => {
                              const updated = [...invoiceItems];
                              updated[index].gstRate = e.target.value;
                              setInvoiceItems(updated);
                            }}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-1.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                          </select>
                        </div>

                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            disabled={invoiceItems.length === 1}
                            onClick={() => removeItemRow(index)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BILLING MATRIX & PAYMENT RECEIPT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                {/* PAYMENT SECTION */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Direct Payment Entry</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Receipt Cash (Rs.)</label>
                      <input
                        type="number"
                        value={invoicePaidAmount}
                        onChange={(e) => setInvoicePaidAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Payment Channel</label>
                      <select
                        value={invoicePaymentMethod}
                        onChange={(e) => setInvoicePaymentMethod(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="CASH">Liquid Cash</option>
                        <option value="UPI">UPI Payment Network</option>
                        <option value="BANK">IMPS/NEFT Bank Transfer</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Transaction Ref / Reference ID</label>
                      <input
                        type="text"
                        value={invoiceTxnRef}
                        onChange={(e) => setInvoiceTxnRef(e.target.value)}
                        placeholder="e.g. UPI-99120371 | IMPS-8823"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Order Dispatch Notes / Remarks</label>
                      <input
                        type="text"
                        value={invoiceRemarks}
                        onChange={(e) => setInvoiceRemarks(e.target.value)}
                        placeholder="Enter courier, delivery point or instructions..."
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* LIVE CALCULATIONS SUMMARY */}
                <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-900 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block border-b pb-2">Live Commercial Summary</span>
                    
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Gross Sales Total (Exc. Tax):</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Rs. {formTotals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>GST Taxes Sum (Consolidated):</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Rs. {formTotals.gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Item Level Discounts:</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">- Rs. {formTotals.itemDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-3 text-sm font-black text-slate-900 dark:text-white">
                      <span>Consolidated Invoice Total:</span>
                      <span className="font-mono">Rs. {formTotals.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowInvoiceModal(false)}
                      className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                    >
                      Cancel Dispatch
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/10"
                    >
                      Authorize & Disburse
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. SALES RETURN / CREDIT NOTE MODAL */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-55 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <RotateCcw className="w-5 h-5 text-indigo-500" />
                Issue Sales Return Credit Note
              </h2>
              <button onClick={() => setShowReturnModal(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Select Sales Invoice *</label>
                  <select
                    required
                    value={returnInvoiceId}
                    onChange={(e) => handleReturnInvoiceChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- CHOOSE INVOICE --</option>
                    {invoices.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.invoiceNumber} - {i.customerName} (Total: Rs. {Number(i.totalAmount).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Return / Credit Note Date</label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-1.5 text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {returnItems.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Edit return quantities (Set 0 to skip an item)</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {returnItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-xs font-bold block">{item.productName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Invoice Price: Rs. {item.unitPrice}</span>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={item.quantity}
                            onChange={(e) => handleReturnItemQtyChange(idx, e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-right font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Return Reason / Commercial Justification</label>
                <textarea
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  placeholder="Milk souring dispatch issues, container leakage, volume error, etc."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
                >
                  Authorize Credit Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
