import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { Product, Warehouse, Supplier, PurchaseEntry, SessionData } from '../types';
import { 
  Building2, Plus, Search, Filter, RefreshCw, AlertCircle, CheckCircle2, 
  FileText, X, Eye, Truck, UserCheck, ShieldCheck, Mail, Phone, Calendar, 
  Coins, SlidersHorizontal, Info, ShoppingBag, Receipt, CreditCard
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';

interface PurchaseManagementProps {
  session: SessionData | null;
}

interface OrderItemInput {
  productId: string;
  quantity: string;
  unitCost: string;
}

export const PurchaseManagement: React.FC<PurchaseManagementProps> = ({ session }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [subTab, setSubTab] = useState<'orders' | 'suppliers'>('orders');

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseEntry | null>(null);

  // Form Fields - Supplier
  const [supName, setSupName] = useState('');
  const [supContactName, setSupContactName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Form Fields - Purchase Entry / Order
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poWarehouseId, setPoWarehouseId] = useState('');
  const [poReferenceNumber, setPoReferenceNumber] = useState('');
  const [poTaxRate, setPoTaxRate] = useState('5'); // Default 5% tax
  const [poDiscount, setPoDiscount] = useState('0');
  const [poShippingCharges, setPoShippingCharges] = useState('0');
  const [poPaymentStatus, setPoPaymentStatus] = useState<'PENDING' | 'PARTIAL' | 'PAID'>('PENDING');
  const [poStatus, setPoStatus] = useState<'ORDERED' | 'RECEIVED' | 'CANCELLED'>('ORDERED');
  const [poRemarks, setPoRemarks] = useState('');

  // Dynamic multiple order line-items input
  const [poItems, setPoItems] = useState<OrderItemInput[]>([
    { productId: '', quantity: '', unitCost: '' }
  ]);

  // Role Permissions Checks
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

      const sups = await api.getSuppliers();
      setSuppliers(sups);

      const pur = await api.getPurchases();
      let filtered = pur;
      if (statusFilter !== 'all') {
        filtered = filtered.filter((p: any) => p.paymentStatus === statusFilter);
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((p: any) => 
          (p.purchaseNumber && p.purchaseNumber.toLowerCase().includes(q)) || 
          (p.supplierName && p.supplierName.toLowerCase().includes(q))
        );
      }
      setPurchases(filtered);

    } catch (err: any) {
      showToast(err.message || 'Error loading purchase ledger.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [subTab, statusFilter, searchQuery]);

  // Handle PO Item dynamic input row additions
  const handleAddPoItemRow = () => {
    setPoItems([...poItems, { productId: '', quantity: '', unitCost: '' }]);
  };

  const handleRemovePoItemRow = (index: number) => {
    if (poItems.length === 1) return;
    setPoItems(poItems.filter((_, idx) => idx !== index));
  };

  const handleUpdatePoItemField = (index: number, field: keyof OrderItemInput, val: string) => {
    const updated = [...poItems];
    updated[index][field] = val;

    // Auto cost price loading when product selection updates
    if (field === 'productId') {
      const prod = products.find(p => p.id === val);
      if (prod) {
        updated[index]['unitCost'] = String(prod.costPrice || prod.price);
      }
    }
    setPoItems(updated);
  };

  // Real-time calculation of Purchase Order summary
  const livePurchaseSummary = useMemo(() => {
    let subtotal = 0;
    poItems.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.unitCost) || 0;
      subtotal += qty * cost;
    });

    const disc = parseFloat(poDiscount) || 0;
    const taxRate = parseFloat(poTaxRate) || 0;
    const shipping = parseFloat(poShippingCharges) || 0;

    const baseTaxable = Math.max(0, subtotal - disc);
    const taxAmount = (baseTaxable * taxRate) / 100;
    const grandTotal = baseTaxable + taxAmount + shipping;

    return {
      subtotal,
      taxable: baseTaxable,
      taxAmount,
      grandTotal
    };
  }, [poItems, poDiscount, poTaxRate, poShippingCharges]);

  // Save Supplier
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName) {
      showToast('Supplier Name is required.', 'error');
      return;
    }

    try {
      await api.createSupplier({
        name: supName,
        contactName: supContactName,
        email: supEmail,
        phone: supPhone,
        address: supAddress
      });
      showToast('Supplier registered successfully.', 'success');
      setSupplierModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save supplier.', 'error');
    }
  };

  // Save Purchase Entry / Order
  const handleSavePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || !poWarehouseId || !poReferenceNumber) {
      showToast('Supplier, Target Warehouse and Ref Invoice Number are required.', 'error');
      return;
    }

    // Verify at least one item filled
    const validItems = poItems.filter(item => item.productId && parseFloat(item.quantity) > 0 && parseFloat(item.unitCost) >= 0);
    if (validItems.length === 0) {
      showToast('Please add at least one product with a valid quantity.', 'error');
      return;
    }

    try {
      const mappedItems = validItems.map(item => ({
        productId: item.productId,
        quantity: parseFloat(item.quantity),
        costPrice: parseFloat(item.unitCost)
      }));

      await api.createPurchase({
        supplierId: poSupplierId,
        items: mappedItems,
        remarks: poRemarks,
        paymentStatus: poPaymentStatus,
        purchaseDate: new Date().toISOString().split('T')[0]
      });

      showToast('Purchase Order saved successfully. Stocks replenished dynamically if status RECEIVED.', 'success');
      setPurchaseModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save purchase entry.', 'error');
    }
  };

  return (
    <div id="purchase-management-wrapper" className="space-y-6">
      
      {/* 1. Header Navigation Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/50 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Procurement & Purchases</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage supplier directories, initialize purchase entries, and replenish physical storage hubs.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'orders'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Invoices & Inward Receipts ({purchases.length})
          </button>
          <button
            onClick={() => setSubTab('suppliers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              subTab === 'suppliers'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Suppliers Ledger ({suppliers.length})
          </button>
        </div>
      </div>

      {subTab === 'orders' ? (
        <>
          {/* ORDERS FILTERS PANEL */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search invoice number, supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none text-slate-700 dark:text-slate-200"
              >
                <option value="all">All Delivery Status</option>
                <option value="ORDERED">Ordered</option>
                <option value="RECEIVED">Received</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {canWrite && (
              <button
                onClick={() => {
                  setPoSupplierId('');
                  setPoWarehouseId(warehouses[0]?.id || '');
                  setPoReferenceNumber(`PO-${Math.floor(100000 + Math.random() * 900000)}`);
                  setPoItems([{ productId: '', quantity: '', unitCost: '' }]);
                  setPoRemarks('');
                  setPurchaseModalOpen(true);
                }}
                className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                New Purchase Entry
              </button>
            )}
          </div>

          {/* PURCHASES LIST */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-10 h-10 text-teal-500 animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500">Retrieving purchase invoices...</p>
              </div>
            ) : purchases.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold">No purchase records registered yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-855 bg-slate-50/50 dark:bg-slate-900/60">
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Invoice Ref</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Date</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Supplier Name</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Target Warehouse</th>
                      <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Total Bill Amount</th>
                      <th className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Delivery Status</th>
                      <th className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Payment</th>
                      <th className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
                    {purchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{p.referenceNumber}</td>
                        <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-xs font-black text-slate-900 dark:text-white">{p.supplierName}</td>
                        <td className="px-5 py-3 text-xs text-slate-500 font-bold">{p.warehouseName}</td>
                        <td className="px-5 py-3 text-right text-xs font-black text-slate-800 dark:text-slate-100">
                          ₹{p.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${
                            p.status === 'RECEIVED' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                              : p.status === 'CANCELLED' 
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40' 
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${
                            p.paymentStatus === 'PAID' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                              : p.paymentStatus === 'PARTIAL' 
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40' 
                              : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40'
                          }`}>
                            {p.paymentStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            onClick={() => setSelectedPurchase(p)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                            title="View PO Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* SUPPLIERS DIRECTORY */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-center shadow-xs">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Supplier Ledgers</h3>
            {canWrite && (
              <button
                onClick={() => {
                  setSupName('');
                  setSupContactName('');
                  setSupEmail('');
                  setSupPhone('');
                  setSupAddress('');
                  setSupplierModalOpen(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add Supplier
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map(sup => (
              <div key={sup.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-teal-500/40 transition">
                <div className="space-y-3">
                  <div className="inline-flex p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{sup.name}</h3>
                    <span className="font-mono text-[9px] text-slate-400 block mt-0.5">Contact: {sup.contactName || '-'}</span>
                  </div>
                  
                  <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-855 text-[11px] text-slate-550">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.email || 'No email registered'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{sup.phone || 'No phone registered'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-855 flex justify-between text-[10px] text-slate-400">
                  <span>Registered: {new Date(sup.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 4. PURCHASE ORDER DIALOG MODAL */}
      {purchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-14 border-b border-slate-100 dark:border-slate-800 px-6 flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Initialize Purchase Entry Inward</h2>
              <button onClick={() => setPurchaseModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchaseOrder} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Core Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Select Supplier *</label>
                  <select
                    required
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="">Choose Supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Target Warehouse *</label>
                  <select
                    required
                    value={poWarehouseId}
                    onChange={(e) => setPoWarehouseId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="">Choose Warehouse...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Invoice Reference No *</label>
                  <input
                    type="text"
                    required
                    placeholder="INV-XX-YY"
                    value={poReferenceNumber}
                    onChange={(e) => setPoReferenceNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* DYNAMIC LINE ITEMS TABLE */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inward Line Items</h3>
                  <button
                    type="button"
                    onClick={handleAddPoItemRow}
                    className="text-xs text-teal-600 font-bold hover:underline cursor-pointer"
                  >
                    + Add Product Row
                  </button>
                </div>

                <div className="space-y-2">
                  {poItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-855 relative">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Product</label>
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => handleUpdatePoItemField(index, 'productId', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                        >
                          <option value="">Choose...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Quantity</label>
                        <input
                          type="number"
                          required
                          placeholder="0"
                          value={item.quantity}
                          onChange={(e) => handleUpdatePoItemField(index, 'quantity', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Unit Purchase Cost (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={item.unitCost}
                          onChange={(e) => handleUpdatePoItemField(index, 'unitCost', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold font-mono"
                        />
                      </div>

                      <div className="flex justify-between items-center gap-2">
                        <div className="text-right flex-1 pr-2">
                          <span className="text-[10px] text-slate-400 block">Subtotal</span>
                          <span className="text-xs font-black">
                            ₹{((parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0)).toFixed(2)}
                          </span>
                        </div>
                        {poItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePoItemRow(index)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-rose-500 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Modifiers */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Tax Rate (%)</label>
                  <select
                    value={poTaxRate}
                    onChange={(e) => setPoTaxRate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="0">0% GST</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Flat Discount (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={poDiscount}
                    onChange={(e) => setPoDiscount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Shipping & Cool-chain (₹)</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={poShippingCharges}
                    onChange={(e) => setPoShippingCharges(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Payment Settlement</label>
                  <select
                    value={poPaymentStatus}
                    onChange={(e) => setPoPaymentStatus(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="PAID">SETTLED / PAID</option>
                  </select>
                </div>
              </div>

              {/* Status and summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Inward Delivery Status</label>
                    <select
                      value={poStatus}
                      onChange={(e) => setPoStatus(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                    >
                      <option value="ORDERED">ORDERED (Pending Delivery)</option>
                      <option value="RECEIVED">RECEIVED (Replenishes Stocks Immediately)</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Procurement Remarks</label>
                    <textarea
                      rows={2}
                      placeholder="Thermal verification comments or bill references..."
                      value={poRemarks}
                      onChange={(e) => setPoRemarks(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Live Purchase Bill calculations */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-855 flex flex-col justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800/80 pb-2 mb-2">Purchase Valuation Summary</h4>
                  
                  <div className="space-y-1.5 text-xs font-bold text-slate-650 dark:text-slate-300">
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span>₹{livePurchaseSummary.subtotal.toFixed(2)}</span>
                    </div>
                    {parseFloat(poDiscount) > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Discount Offset:</span>
                        <span>-₹{parseFloat(poDiscount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST Tax ({poTaxRate}%):</span>
                      <span>₹{livePurchaseSummary.taxAmount.toFixed(2)}</span>
                    </div>
                    {parseFloat(poShippingCharges) > 0 && (
                      <div className="flex justify-between">
                        <span>Cooling Shipping:</span>
                        <span>₹{parseFloat(poShippingCharges).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800/80 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-slate-900 dark:text-white">Grand total bill:</span>
                    <span className="text-base font-black text-teal-600">
                      ₹{livePurchaseSummary.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setPurchaseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700"
                >
                  Confirm Purchase Bill
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. SUPPLIER DIALOG MODAL */}
      {supplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="h-14 border-b border-slate-100 dark:border-slate-800 px-6 flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Register Supplier</h2>
              <button onClick={() => setSupplierModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Supplier / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. United Packaging Corp"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Contact Representative</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={supContactName}
                  onChange={(e) => setSupContactName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. billing@supplier.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98765 43210"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Corporate Address</label>
                <textarea
                  rows={2}
                  placeholder="Enter corporate delivery address details..."
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 text-xs focus:outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. PURCHASE ORDER NESTED INWARD RECEIPT VIEW DETAIL MODAL */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="h-14 border-b border-slate-100 dark:border-slate-800 px-6 flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Inward purchase receipt</h2>
              <button onClick={() => setSelectedPurchase(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-[10px] font-bold text-teal-600 block">INVOICE: {selectedPurchase.referenceNumber}</span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{selectedPurchase.supplierName}</h3>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Delivered to: {selectedPurchase.warehouseName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Billing Date</span>
                  <span className="text-xs font-bold block">{new Date(selectedPurchase.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Status matrix */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-855 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Delivery Status</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{selectedPurchase.status}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-bold">Settlement</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{selectedPurchase.paymentStatus}</span>
                </div>
              </div>

              {/* Line items table list */}
              <div className="space-y-2 border-t border-slate-150 dark:border-slate-800/80 pt-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inward Goods Details</h4>
                <div className="space-y-1">
                  {selectedPurchase.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50/50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-855">
                      <div>
                        <span className="text-xs font-black text-slate-800 dark:text-white block">{item.productName || 'Catalog Product'}</span>
                        <span className="text-[10px] text-slate-450 block">Qty: {item.quantity.toLocaleString()} x ₹{item.unitCost.toFixed(2)}</span>
                      </div>
                      <div className="text-right font-bold text-xs">
                        ₹{(item.quantity * item.unitCost).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="border-t border-slate-150 dark:border-slate-800/80 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Goods Taxable Amount:</span>
                  <span>₹{(selectedPurchase.totalAmount - selectedPurchase.shippingCharges + selectedPurchase.discount).toFixed(2)}</span>
                </div>
                {selectedPurchase.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount Deduction:</span>
                    <span>-₹{selectedPurchase.discount.toFixed(2)}</span>
                  </div>
                )}
                {selectedPurchase.shippingCharges > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Shipping charges:</span>
                    <span>₹{selectedPurchase.shippingCharges.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-855">
                  <span>Invoice Grand Total:</span>
                  <span className="text-teal-600">₹{selectedPurchase.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {selectedPurchase.remarks && (
                <div className="p-3 bg-yellow-50/50 dark:bg-yellow-950/10 rounded-xl border border-yellow-100/40 text-[10px] leading-relaxed italic text-slate-500">
                  Remarks: {selectedPurchase.remarks}
                </div>
              )}

              <button
                onClick={() => setSelectedPurchase(null)}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs py-2 rounded-xl hover:bg-slate-200 transition"
              >
                Close View
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
