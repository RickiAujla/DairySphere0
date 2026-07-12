import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { Product, ProductCategory, SessionData } from '../types';
import { 
  Database, Plus, Search, Filter, Edit, Trash2, Tag, Layers, 
  CheckCircle2, X, AlertCircle, Barcode, QrCode, SlidersHorizontal, Check, RefreshCw, Eye
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';

interface ProductManagementProps {
  session: SessionData | null;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ session }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [activeSubTab, setActiveSubTab] = useState<'products' | 'categories'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal forms states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

  // Form Fields - Product
  const [prodSku, setProdSku] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCostPrice, setProdCostPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('Liter');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodIsActive, setProdIsActive] = useState(true);
  const [prodMinStock, setProdMinStock] = useState('10');
  const [prodMaxStock, setProdMaxStock] = useState('5000');
  const [prodReorderLevel, setProdReorderLevel] = useState('20');
  const [prodOpeningStock, setProdOpeningStock] = useState('0'); // Seeding stock entries
  const [prodBatchNumber, setProdBatchNumber] = useState('');
  const [prodExpiryDate, setProdExpiryDate] = useState('');

  // Form Fields - Category
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');

  // Scanning simulation
  const [simulatedBarcode, setSimulatedBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);

  // RBAC permissions checks
  const canWrite = useMemo(() => {
    const role = session?.user?.role || localStorage.getItem('dairysphere_user_role') || 'ADMIN';
    return ['ADMIN', 'MANAGER', 'OPERATOR'].includes(role.toUpperCase());
  }, [session]);

  const canDelete = useMemo(() => {
    const role = session?.user?.role || localStorage.getItem('dairysphere_user_role') || 'ADMIN';
    return ['ADMIN', 'MANAGER'].includes(role.toUpperCase());
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    try {
      const cats = await api.getProductCategories();
      setCategories(cats);

      const prods = await api.getProducts({
        search: searchQuery,
        categoryId: categoryFilter,
        status: statusFilter
      });
      setProducts(prods);
    } catch (err: any) {
      showToast(err.message || 'Failed to load catalog data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, categoryFilter, statusFilter, activeSubTab]);

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdSku(`PRD-${Math.floor(10000 + Math.random() * 90000)}`);
    setProdName('');
    setProdCategoryId(categories[0]?.id || '');
    setProdBrand('');
    setProdDescription('');
    setProdPrice('');
    setProdCostPrice('');
    setProdUnit('Liter');
    setProdBarcode(`890${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setProdIsActive(true);
    setProdMinStock('20');
    setProdMaxStock('5000');
    setProdReorderLevel('50');
    setProdOpeningStock('0');
    setProdBatchNumber('');
    setProdExpiryDate('');
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdSku(prod.sku);
    setProdName(prod.name);
    setProdCategoryId(prod.categoryId);
    setProdBrand(prod.brand || '');
    setProdDescription(prod.description || '');
    setProdPrice(String(prod.price));
    setProdCostPrice(prod.costPrice ? String(prod.costPrice) : '');
    setProdUnit(prod.unit);
    setProdBarcode(prod.barcode || '');
    setProdIsActive(prod.isActive);
    setProdMinStock(String(prod.minStock || 0));
    setProdMaxStock(String(prod.maxStock || 10000));
    setProdReorderLevel(String(prod.reorderLevel || 0));
    setProdOpeningStock('0'); // Disabled during edit
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodSku || !prodPrice || !prodCategoryId) {
      showToast('Please fill all required catalog fields.', 'error');
      return;
    }

    try {
      const payload = {
        sku: prodSku,
        name: prodName,
        categoryId: prodCategoryId,
        brand: prodBrand,
        description: prodDescription,
        price: parseFloat(prodPrice),
        costPrice: parseFloat(prodCostPrice) || 0,
        unit: prodUnit,
        barcode: prodBarcode,
        isActive: prodIsActive,
        minStock: parseInt(prodMinStock) || 0,
        maxStock: parseInt(prodMaxStock) || 10000,
        reorderLevel: parseInt(prodReorderLevel) || 0,
        openingStock: parseInt(prodOpeningStock) || 0,
        batchNumber: prodBatchNumber,
        expiryDate: prodExpiryDate
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        showToast('Product specifications updated successfully.', 'success');
      } else {
        await api.createProduct(payload);
        showToast('New product added to catalog successfully.', 'success');
      }
      setProductModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product.', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Catalog Item',
      message: 'Are you sure you want to completely delete this product from the inventory? This operation cannot be undone.'
    });

    if (isConfirmed) {
      try {
        await api.deleteProduct(id);
        showToast('Product successfully deleted.', 'success');
        loadData();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete product.', 'error');
      }
    }
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDescription('');
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: ProductCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDescription(cat.description || '');
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) {
      showToast('Category name is required.', 'error');
      return;
    }

    try {
      const payload = { name: catName, description: catDescription };
      if (editingCategory) {
        await api.updateProductCategory(editingCategory.id, payload);
        showToast('Product category updated successfully.', 'success');
      } else {
        await api.createProductCategory(payload);
        showToast('New product category created.', 'success');
      }
      setCategoryModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product category.', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Category',
      message: 'Are you sure you want to delete this product category? Products assigned to it must be empty or transferred first.'
    });

    if (isConfirmed) {
      try {
        await api.deleteProductCategory(id);
        showToast('Category removed successfully.', 'success');
        loadData();
      } catch (err: any) {
        showToast(err.message || 'Failed to delete category.', 'error');
      }
    }
  };

  const handleSimulateBarcodeScan = () => {
    if (!simulatedBarcode) {
      showToast('Please type a valid SKU or Barcode to simulate scan.', 'info');
      return;
    }
    const found = products.find(p => 
      p.barcode === simulatedBarcode || 
      p.sku.toUpperCase() === simulatedBarcode.toUpperCase()
    );

    if (found) {
      setScannedProduct(found);
      showToast(`Scanned product successfully: ${found.name}`, 'success');
    } else {
      setScannedProduct(null);
      showToast('No matching product registered with this scan key.', 'error');
    }
  };

  return (
    <div id="product-management-wrapper" className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/50 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Product & Brand Catalog</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Register cooperative products, packaging sizes, prices, and units.</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-850 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'products'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'categories'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'products' ? (
        <>
          {/* BARCODE SCANNER SIMULATION UNIT */}
          <div className="bg-gradient-to-r from-teal-550/10 to-emerald-550/10 border border-teal-250/50 dark:border-teal-900/40 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row gap-5 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center border border-teal-200/60 dark:border-teal-850">
                <Barcode className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-xs font-black text-teal-800 dark:text-teal-400 uppercase tracking-wider">Digital Barcode / QR Simulation</h3>
                <p className="text-[11px] text-slate-500">Scan product packaging barcodes or enter custom registered codes to fetch item properties.</p>
              </div>
            </div>

            <div className="flex w-full lg:w-auto gap-2">
              <div className="relative flex-1 lg:w-64">
                <input
                  type="text"
                  placeholder="Type Barcode / SKU code..."
                  value={simulatedBarcode}
                  onChange={(e) => setSimulatedBarcode(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-3 py-1.5 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
              <button
                onClick={handleSimulateBarcodeScan}
                className="bg-teal-600 text-white font-bold text-xs px-4 py-1.5 rounded-xl hover:bg-teal-700 transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                Scan Code
              </button>
            </div>

            {scannedProduct && (
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-teal-200 dark:border-teal-900/60 flex items-center gap-4 w-full lg:w-96 animate-fade-in shrink-0 relative">
                <button 
                  onClick={() => setScannedProduct(null)}
                  className="absolute top-1 right-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="w-8 h-8 rounded bg-teal-50 flex items-center justify-center text-teal-600 font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono font-bold text-teal-600 uppercase block">{scannedProduct.sku}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white block truncate">{scannedProduct.name}</span>
                  <span className="text-[10px] text-slate-500 block">MRP: ₹{scannedProduct.price} / Cost: ₹{scannedProduct.costPrice}</span>
                </div>
              </div>
            )}
          </div>

          {/* FILTERS AND CONTROLS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between transition-colors shadow-xs">
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center">
              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search SKU, name, barcode, brand..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-teal-500 placeholder-slate-400 transition"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none text-slate-700 dark:text-slate-200 w-full md:w-auto"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>

            {canWrite && (
              <button
                onClick={handleOpenAddProduct}
                className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Product Item
              </button>
            )}
          </div>

          {/* PRODUCTS DATA GRID */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden transition-colors">
            {loading ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-10 h-10 text-teal-500 animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500">Retrieving product registry...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500">No products found matching filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/60">
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">SKU & Product</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Category</th>
                      <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Brand</th>
                      <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Sales Price</th>
                      <th className="px-5 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Cost Price</th>
                      <th className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Barcode/QR</th>
                      <th className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                      <th className="px-5 py-3 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-mono text-[10px] font-bold text-teal-600 uppercase leading-none mb-1">{prod.sku}</div>
                          <div className="text-xs font-black text-slate-900 dark:text-slate-100">{prod.name}</div>
                          <div className="text-[10px] text-slate-450 dark:text-slate-500">Unit: {prod.unit}</div>
                        </td>
                        <td className="px-5 py-3 text-xs font-bold text-slate-600 dark:text-slate-350">
                          {prod.categoryName || 'General'}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500">
                          {prod.brand || '-'}
                        </td>
                        <td className="px-5 py-3 text-right text-xs font-extrabold text-slate-800 dark:text-white">
                          ₹{prod.price.toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-right text-xs font-mono text-slate-500">
                          ₹{prod.costPrice?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="inline-flex gap-2">
                            {prod.barcode && (
                              <span className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:text-teal-600 transition" title={`Barcode: ${prod.barcode}`}>
                                <Barcode className="w-4 h-4" />
                              </span>
                            )}
                            {prod.qrCode && (
                              <span className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:text-teal-600 transition" title={`QR Code: ${prod.qrCode}`}>
                                <QrCode className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${
                            prod.isActive 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}>
                            {prod.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canWrite && (
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
                                title="Edit Specifications"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600 transition"
                                title="Delete Catalog"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </>
      ) : (
        <>
          {/* CATEGORIES GRID */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 flex justify-between items-center transition-colors shadow-xs">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Product Groupings</h3>
            {canWrite && (
              <button
                onClick={handleOpenAddCategory}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-teal-500/40 transition">
                <div className="space-y-2">
                  <div className="inline-flex p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{cat.name}</h3>
                    <span className="font-mono text-[9px] text-slate-400 block mt-0.5">SLUG: {cat.slug}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {cat.description || 'No descriptive summary added for this category.'}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-100 dark:border-slate-855">
                  <span className="text-[10px] text-slate-400">Created: {new Date(cat.createdAt).toLocaleDateString()}</span>
                  <div className="flex gap-1">
                    {canWrite && (
                      <button
                        onClick={() => handleOpenEditCategory(cat)}
                        className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 4. PRODUCT DIALOG MODAL */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="h-14 border-b border-slate-100 dark:border-slate-800 px-6 flex justify-between items-center">
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {editingProduct ? 'Modify Product Specifications' : 'Register New Product'}
              </h2>
              <button 
                onClick={() => setProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Row 1: Identification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Creamy Mozzarella Block"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Product SKU *</label>
                  <input
                    type="text"
                    required
                    placeholder="PRD-SC-XXX"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              {/* Row 2: Category & Brand */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Category Group *</label>
                  <select
                    required
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  >
                    <option value="">Select Category...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. DairySphere Premium"
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              {/* Row 3: Valuation, Cost & Units */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Sales Price (MRP) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Cost Price (Valuation)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={prodCostPrice}
                    onChange={(e) => setProdCostPrice(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Unit of Measure</label>
                  <select
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  >
                    <option value="Liter">Liter</option>
                    <option value="Kg">Kg</option>
                    <option value="Pack">Pack</option>
                    <option value="Bag">Bag</option>
                    <option value="Bottle">Bottle</option>
                    <option value="Box">Box</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Barcode, Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Barcode (EAN-13 / GTIN)</label>
                  <input
                    type="text"
                    placeholder="Scan or enter code..."
                    value={prodBarcode}
                    onChange={(e) => setProdBarcode(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Publishing Status</label>
                  <div className="flex items-center gap-4 py-2">
                    <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodIsActive}
                        onChange={(e) => setProdIsActive(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      Active for Inventory Operations
                    </label>
                  </div>
                </div>
              </div>

              {/* Row 5: Reorder, Stock thresholds */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Management Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Minimum Stock</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={prodMinStock}
                      onChange={(e) => setProdMinStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Maximum Stock</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={prodMaxStock}
                      onChange={(e) => setProdMaxStock(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Reorder Level Threshold</label>
                    <input
                      type="number"
                      placeholder="e.g. 100"
                      value={prodReorderLevel}
                      onChange={(e) => setProdReorderLevel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Opening Stock (Only on Creation) */}
              {!editingProduct && (
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/40 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Configure initial stock values below (Opening Stock)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Opening Quantity</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={prodOpeningStock}
                        onChange={(e) => setProdOpeningStock(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Batch Number</label>
                      <input
                        type="text"
                        placeholder="B-INIT-X"
                        value={prodBatchNumber}
                        onChange={(e) => setProdBatchNumber(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Expiry Date</label>
                      <input
                        type="date"
                        value={prodExpiryDate}
                        onChange={(e) => setProdExpiryDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Row 7: Narrative */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Product Narrative / Description</label>
                <textarea
                  rows={2}
                  placeholder="Enter detailed packaging specifications, preservation, or thermal instruction details..."
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-850 dark:text-slate-100 focus:outline-none focus:border-teal-500 transition resize-none"
                />
              </div>

              {/* Submit panel */}
              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition cursor-pointer"
                >
                  {editingProduct ? 'Update Product Specification' : 'Add to Catalog'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. CATEGORY DIALOG MODAL */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="h-14 border-b border-slate-100 dark:border-slate-800 px-6 flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {editingCategory ? 'Update Product Category' : 'Create New Category'}
              </h2>
              <button onClick={() => setCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fermented Products"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Category Description</label>
                <textarea
                  rows={3}
                  placeholder="Summarize the products group inside this taxonomy..."
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
