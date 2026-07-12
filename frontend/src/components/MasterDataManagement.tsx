import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Database, Tag, Route, Milk, Percent, Scale, 
  Plus, Edit, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, 
  Download, Upload, CheckCircle2, AlertCircle, Loader2, Save, 
  HelpCircle, Settings, MapPin, DollarSign, Clock, Hash, ShieldAlert
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';

type SubTab = 'categories' | 'routes' | 'milk-standards' | 'units-expenses' | 'shifts-payments' | 'series-tax' | 'business-info';

export const MasterDataManagement: React.FC = () => {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('categories');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [globalSettings, setGlobalSettings] = useState<any>({});

  // Product Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryPage, setCategoryPage] = useState(1);
  const categoriesPerPage = 5;
  const [catFormOpen, setCatFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '' });
  const [catFormError, setCatFormError] = useState<string | null>(null);

  // Delivery Routes State
  const [routes, setRoutes] = useState<any[]>([]);
  const [routeSearch, setRouteSearch] = useState('');
  const [routePage, setRoutePage] = useState(1);
  const routesPerPage = 5;
  const [routeFormOpen, setRouteFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any | null>(null);
  const [routeForm, setRouteForm] = useState({ name: '', description: '', startPoint: '', endPoint: '' });
  const [routeFormError, setRouteFormError] = useState<string | null>(null);

  // Drag and drop / import state
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);

  // General Settings parsing
  const [milkTypes, setMilkTypes] = useState<any[]>([]);
  const [fatSnfStandards, setFatSnfStandards] = useState<Record<string, any>>({});
  const [units, setUnits] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [taxSettings, setTaxSettings] = useState<any>({});
  const [businessSettings, setBusinessSettings] = useState<any>({});
  const [numberSeries, setNumberSeries] = useState<any>({});
  const [generalSettings, setGeneralSettings] = useState<any>({});

  // Temp states for list items
  const [newMilkType, setNewMilkType] = useState({ id: '', name: '', baseRate: '' });
  const [newUnit, setNewUnit] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');

  // Load everything
  const loadAllMasterData = async () => {
    setFetching(true);
    try {
      const catsData = await api.getCategories();
      setCategories(catsData);

      const routesData = await api.getRoutes();
      setRoutes(routesData);

      const settings = await api.getSettings();
      setGlobalSettings(settings);

      // Parse JSON variables
      setMilkTypes(settings.master_milk_types ? JSON.parse(settings.master_milk_types) : []);
      setFatSnfStandards(settings.master_fat_snf_standards ? JSON.parse(settings.master_fat_snf_standards) : {});
      setUnits(settings.master_units ? JSON.parse(settings.master_units) : []);
      setExpenseCategories(settings.master_expense_categories ? JSON.parse(settings.master_expense_categories) : []);
      setPaymentMethods(settings.master_payment_methods ? JSON.parse(settings.master_payment_methods) : []);
      setShifts(settings.master_collection_shifts ? JSON.parse(settings.master_collection_shifts) : []);
      setTaxSettings(settings.master_tax_settings ? JSON.parse(settings.master_tax_settings) : {});
      setBusinessSettings(settings.master_business_settings ? JSON.parse(settings.master_business_settings) : {});
      setNumberSeries(settings.master_number_series ? JSON.parse(settings.master_number_series) : {});
      setGeneralSettings(settings.master_general_settings ? JSON.parse(settings.master_general_settings) : {});
    } catch (err: any) {
      showToast('Error loading master registries context.', 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadAllMasterData();
  }, []);

  // Save Settings wrapper
  const saveMasterSettingsToDB = async (updatedFields: Record<string, any>) => {
    setLoading(true);
    try {
      const settingsStringMap: Record<string, string> = {};
      Object.entries(updatedFields).forEach(([key, val]) => {
        settingsStringMap[key] = typeof val === 'object' ? JSON.stringify(val) : String(val);
      });
      await api.updateSettings(settingsStringMap);
      showToast('Master registry settings synchronized successfully.', 'success');
      await loadAllMasterData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save master settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // CATEGORIES CRUD
  // ==========================================
  const handleOpenCatCreate = () => {
    setEditingCat(null);
    setCatForm({ name: '', slug: '', description: '' });
    setCatFormError(null);
    setCatFormOpen(true);
  };

  const handleOpenCatEdit = (cat: any) => {
    setEditingCat(cat);
    setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '' });
    setCatFormError(null);
    setCatFormOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatFormError(null);

    // Validation
    if (!catForm.name.trim()) {
      setCatFormError('Category Name is required.');
      return;
    }
    if (!catForm.slug.trim()) {
      setCatFormError('Category Slug is required.');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(catForm.slug)) {
      setCatFormError('Slug must contain only lowercase letters, numbers, and dashes.');
      return;
    }

    try {
      if (editingCat) {
        await api.updateCategory(editingCat.id, catForm);
        showToast(`Category '${catForm.name}' updated.`, 'success');
      } else {
        await api.createCategory(catForm);
        showToast(`Category '${catForm.name}' created.`, 'success');
      }
      setCatFormOpen(false);
      // Reload categories
      const catsData = await api.getCategories();
      setCategories(catsData);
    } catch (err: any) {
      setCatFormError(err.message || 'An error occurred while saving.');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    confirm({
      title: 'Delete Product Category?',
      message: `Are you sure you want to delete '${name}'? This action is permanent.`,
      confirmText: 'Delete Category',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteCategory(id);
          showToast(`Product category '${name}' deleted successfully.`, 'success');
          const catsData = await api.getCategories();
          setCategories(catsData);
        } catch (err: any) {
          showToast(err.message || 'Failed to delete category.', 'error');
        }
      }
    });
  };

  // Category CSV Import & Export
  const handleExportCategories = () => {
    const headers = ['name', 'slug', 'description'];
    const csvRows = [headers.join(',')];
    categories.forEach(c => {
      const row = [
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.slug.replace(/"/g, '""')}"`,
        `"${(c.description || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dairysphere_product_categories_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Categories exported to CSV.', 'success');
  };

  const handleImportCategoriesCSV = async (file: File) => {
    try {
      await api.validateFileUpload(file, ['csv']);
    } catch (err: any) {
      showToast(err.message || 'File verification failed.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length <= 1) {
          showToast('CSV file is empty or missing content rows.', 'error');
          return;
        }

        // Simple CSV parser
        const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
        const nameIdx = headers.indexOf('name');
        const slugIdx = headers.indexOf('slug');
        const descIdx = headers.indexOf('description');

        if (nameIdx === -1 || slugIdx === -1) {
          showToast('CSV must include "name" and "slug" columns.', 'error');
          return;
        }

        const items: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map(cell => cell.replace(/^["']|["']$/g, '').trim());
          if (row.length >= 2) {
            items.push({
              name: row[nameIdx] || '',
              slug: row[slugIdx] || '',
              description: descIdx !== -1 ? row[descIdx] || '' : ''
            });
          }
        }

        const result = await api.importCategories(items);
        showToast(`Import completed: ${result.successCount} categories upserted.`, 'success');
        const catsData = await api.getCategories();
        setCategories(catsData);
      } catch (err: any) {
        showToast('Failed to parse and import categories.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // ==========================================
  // DELIVERY ROUTES CRUD
  // ==========================================
  const handleOpenRouteCreate = () => {
    setEditingRoute(null);
    setRouteForm({ name: '', description: '', startPoint: '', endPoint: '' });
    setRouteFormError(null);
    setRouteFormOpen(true);
  };

  const handleOpenRouteEdit = (routeObj: any) => {
    setEditingRoute(routeObj);
    setRouteForm({ 
      name: routeObj.name, 
      description: routeObj.description || '', 
      startPoint: routeObj.startPoint || '', 
      endPoint: routeObj.endPoint || '' 
    });
    setRouteFormError(null);
    setRouteFormOpen(true);
  };

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setRouteFormError(null);

    if (!routeForm.name.trim()) {
      setRouteFormError('Route Name is required.');
      return;
    }

    try {
      if (editingRoute) {
        await api.updateRoute(editingRoute.id, routeForm);
        showToast(`Route '${routeForm.name}' updated.`, 'success');
      } else {
        await api.createRoute(routeForm);
        showToast(`Route '${routeForm.name}' created.`, 'success');
      }
      setRouteFormOpen(false);
      // Reload routes
      const routesData = await api.getRoutes();
      setRoutes(routesData);
    } catch (err: any) {
      setRouteFormError(err.message || 'An error occurred while saving route.');
    }
  };

  const handleDeleteRoute = async (id: string, name: string) => {
    confirm({
      title: 'Delete Delivery Route?',
      message: `Are you sure you want to delete route '${name}'? This action is permanent.`,
      confirmText: 'Delete Route',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteRoute(id);
          showToast(`Delivery route '${name}' deleted successfully.`, 'success');
          const routesData = await api.getRoutes();
          setRoutes(routesData);
        } catch (err: any) {
          showToast(err.message || 'Failed to delete route.', 'error');
        }
      }
    });
  };

  const handleExportRoutes = () => {
    const headers = ['name', 'description', 'startpoint', 'endpoint'];
    const csvRows = [headers.join(',')];
    routes.forEach(r => {
      const row = [
        `"${r.name.replace(/"/g, '""')}"`,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        `"${(r.startPoint || '').replace(/"/g, '""')}"`,
        `"${(r.endPoint || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dairysphere_delivery_routes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Delivery routes exported to CSV.', 'success');
  };

  const handleImportRoutesCSV = async (file: File) => {
    try {
      await api.validateFileUpload(file, ['csv']);
    } catch (err: any) {
      showToast(err.message || 'File verification failed.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length <= 1) {
          showToast('CSV file is empty.', 'error');
          return;
        }

        const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
        const nameIdx = headers.indexOf('name');
        const descIdx = headers.indexOf('description');
        const startIdx = headers.indexOf('startpoint') !== -1 ? headers.indexOf('startpoint') : headers.indexOf('start_point');
        const endIdx = headers.indexOf('endpoint') !== -1 ? headers.indexOf('endpoint') : headers.indexOf('end_point');

        if (nameIdx === -1) {
          showToast('CSV must include "name" column.', 'error');
          return;
        }

        const items: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map(cell => cell.replace(/^["']|["']$/g, '').trim());
          if (row.length >= 1) {
            items.push({
              name: row[nameIdx] || '',
              description: descIdx !== -1 ? row[descIdx] || '' : '',
              startPoint: startIdx !== -1 ? row[startIdx] || '' : '',
              endPoint: endIdx !== -1 ? row[endIdx] || '' : ''
            });
          }
        }

        const result = await api.importRoutes(items);
        showToast(`Import completed: ${result.successCount} routes imported.`, 'success');
        const routesData = await api.getRoutes();
        setRoutes(routesData);
      } catch (err: any) {
        showToast('Failed to parse routes CSV.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    setDragOverTab(type);
  };

  const handleDragLeave = () => {
    setDragOverTab(null);
  };

  const handleDrop = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    setDragOverTab(null);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      if (type === 'categories') {
        handleImportCategoriesCSV(file);
      } else if (type === 'routes') {
        handleImportRoutesCSV(file);
      }
    } else {
      showToast('Please upload a valid CSV file.', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'categories') {
        handleImportCategoriesCSV(file);
      } else if (type === 'routes') {
        handleImportRoutesCSV(file);
      }
    }
  };

  // ==========================================
  // MILK TYPES & STANDARDS CRUD
  // ==========================================
  const handleAddMilkType = () => {
    if (!newMilkType.id.trim() || !newMilkType.name.trim() || !newMilkType.baseRate.trim()) {
      showToast('Please enter all milk type fields.', 'error');
      return;
    }
    const rateVal = parseFloat(newMilkType.baseRate);
    if (isNaN(rateVal) || rateVal <= 0) {
      showToast('Base rate must be a valid positive number.', 'error');
      return;
    }

    const mId = newMilkType.id.toLowerCase().trim();
    if (milkTypes.some(m => m.id === mId)) {
      showToast('Milk type key already exists.', 'error');
      return;
    }

    const updatedTypes = [...milkTypes, { id: mId, name: newMilkType.name.trim(), baseRate: rateVal }];
    const updatedStandards = { ...fatSnfStandards, [mId]: { fat: 4.0, snf: 8.5 } };

    setMilkTypes(updatedTypes);
    setFatSnfStandards(updatedStandards);
    setNewMilkType({ id: '', name: '', baseRate: '' });

    saveMasterSettingsToDB({
      master_milk_types: updatedTypes,
      master_fat_snf_standards: updatedStandards
    });
  };

  const handleDeleteMilkType = (id: string) => {
    confirm({
      title: 'Remove Milk Type?',
      message: `Are you sure you want to remove milk type '${id.toUpperCase()}'? All linked rate standards will be deleted.`,
      confirmText: 'Remove',
      type: 'danger',
      onConfirm: () => {
        const updatedTypes = milkTypes.filter(m => m.id !== id);
        const updatedStandards = { ...fatSnfStandards };
        delete updatedStandards[id];

        setMilkTypes(updatedTypes);
        setFatSnfStandards(updatedStandards);

        saveMasterSettingsToDB({
          master_milk_types: updatedTypes,
          master_fat_snf_standards: updatedStandards
        });
      }
    });
  };

  const handleUpdateStandards = (milkTypeId: string, field: 'fat' | 'snf', value: string) => {
    const valFloat = parseFloat(value);
    if (isNaN(valFloat) || valFloat < 0 || valFloat > 15) return; // simple limit boundaries

    const updated = {
      ...fatSnfStandards,
      [milkTypeId]: {
        ...fatSnfStandards[milkTypeId],
        [field]: valFloat
      }
    };
    setFatSnfStandards(updated);
  };

  const handleSaveStandards = () => {
    saveMasterSettingsToDB({
      master_fat_snf_standards: fatSnfStandards
    });
  };

  // ==========================================
  // UNITS & EXPENSES CHIPS MANAGER
  // ==========================================
  const handleAddUnit = () => {
    const unit = newUnit.trim();
    if (!unit) return;
    if (units.includes(unit)) {
      showToast('Unit already exists.', 'error');
      return;
    }
    const updated = [...units, unit];
    setUnits(updated);
    setNewUnit('');
    saveMasterSettingsToDB({ master_units: updated });
  };

  const handleRemoveUnit = (unit: string) => {
    const updated = units.filter(u => u !== unit);
    setUnits(updated);
    saveMasterSettingsToDB({ master_units: updated });
  };

  const handleAddExpenseCat = () => {
    const expCat = newExpenseCat.trim();
    if (!expCat) return;
    if (expenseCategories.includes(expCat)) {
      showToast('Category already exists.', 'error');
      return;
    }
    const updated = [...expenseCategories, expCat];
    setExpenseCategories(updated);
    setNewExpenseCat('');
    saveMasterSettingsToDB({ master_expense_categories: updated });
  };

  const handleRemoveExpenseCat = (expCat: string) => {
    const updated = expenseCategories.filter(c => c !== expCat);
    setExpenseCategories(updated);
    saveMasterSettingsToDB({ master_expense_categories: updated });
  };

  // ==========================================
  // SHIFTS & PAYMENTS
  // ==========================================
  const handleShiftTimeChange = (shiftId: string, field: 'startTime' | 'endTime', value: string) => {
    const updated = shifts.map(s => {
      if (s.id === shiftId) {
        return { ...s, [field]: value };
      }
      return s;
    });
    setShifts(updated);
  };

  const handleSaveShiftsAndPayments = () => {
    saveMasterSettingsToDB({
      master_collection_shifts: shifts,
      master_payment_methods: paymentMethods
    });
  };

  const togglePaymentMethod = (method: string) => {
    const updated = paymentMethods.includes(method)
      ? paymentMethods.filter(m => m !== method)
      : [...paymentMethods, method];
    setPaymentMethods(updated);
  };

  // ==========================================
  // SERIES & TAX SETTINGS
  // ==========================================
  const handleSeriesChange = (field: string, value: string) => {
    setNumberSeries(prev => ({
      ...prev,
      [field]: field.endsWith('Next') ? parseInt(value) || 0 : value
    }));
  };

  const handleTaxChange = (field: string, value: string | boolean) => {
    setTaxSettings(prev => ({
      ...prev,
      [field]: field === 'taxRatePercent' ? parseFloat(value as string) || 0 : value
    }));
  };

  const handleSaveSeriesAndTax = () => {
    saveMasterSettingsToDB({
      master_number_series: numberSeries,
      master_tax_settings: taxSettings
    });
  };

  // ==========================================
  // BUSINESS DETAILS
  // ==========================================
  const handleBusinessSettingChange = (field: string, value: string) => {
    setBusinessSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleGeneralSettingChange = (field: string, value: string) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBusinessInfo = () => {
    saveMasterSettingsToDB({
      master_business_settings: businessSettings,
      master_general_settings: generalSettings
    });
  };

  // Filtering & Pagination Calculations
  const filteredCategories = categories.filter(c => {
    const query = categorySearch.toLowerCase();
    return c.name.toLowerCase().includes(query) || c.slug.toLowerCase().includes(query) || (c.description && c.description.toLowerCase().includes(query));
  });

  const catTotalPages = Math.ceil(filteredCategories.length / categoriesPerPage) || 1;
  const paginatedCategories = filteredCategories.slice(
    (categoryPage - 1) * categoriesPerPage,
    categoryPage * categoriesPerPage
  );

  const filteredRoutes = routes.filter(r => {
    const query = routeSearch.toLowerCase();
    return r.name.toLowerCase().includes(query) || (r.description && r.description.toLowerCase().includes(query)) || (r.startPoint && r.startPoint.toLowerCase().includes(query)) || (r.endPoint && r.endPoint.toLowerCase().includes(query));
  });

  const routeTotalPages = Math.ceil(filteredRoutes.length / routesPerPage) || 1;
  const paginatedRoutes = filteredRoutes.slice(
    (routePage - 1) * routesPerPage,
    routePage * routesPerPage
  );

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-24 select-none">
        <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
        <span className="text-sm font-semibold text-gray-500 dark:text-slate-400 mt-4 tracking-tight animate-pulse">Synchronizing Master registries ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12 select-none">
      {/* Module Title card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40 uppercase tracking-widest">
            Module Stage 5.1
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
            Master Data Registries
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define system parameters, collection standards, routes, and billing series across the tenant space.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-full text-slate-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Active Tenant Isolated
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation panel */}
        <div className="lg:col-span-3 space-y-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 uppercase tracking-wider mb-2">Master Registries</p>
            <nav className="space-y-1">
              {[
                { id: 'categories', label: 'Product Categories', icon: <Tag className="w-4 h-4" /> },
                { id: 'routes', label: 'Delivery Routes', icon: <Route className="w-4 h-4" /> },
                { id: 'milk-standards', label: 'Milk Types & Fat/SNF', icon: <Milk className="w-4 h-4" /> },
                { id: 'units-expenses', label: 'Units & Expenses', icon: <Scale className="w-4 h-4" /> },
                { id: 'shifts-payments', label: 'Shifts & Payments', icon: <Clock className="w-4 h-4" /> },
                { id: 'series-tax', label: 'Number Series & Tax', icon: <Hash className="w-4 h-4" /> },
                { id: 'business-info', label: 'General & Business Info', icon: <Settings className="w-4 h-4" /> }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSubTab(item.id as SubTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold tracking-tight transition-all duration-200 ${
                    activeSubTab === item.id
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          {/* ======================================================== */}
          {/* PRODUCT CATEGORIES PANEL */}
          {/* ======================================================== */}
          {activeSubTab === 'categories' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-teal-600" />
                    Product Categories
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Group and categorize dairy products and secondary items for inventories and billing.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleExportCategories}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" /> Import
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'categories')}
                    />
                  </label>
                  <button
                    onClick={handleOpenCatCreate}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Category
                  </button>
                </div>
              </div>

              {/* CSV Upload Dropzone Indicator */}
              <div
                onDragOver={(e) => handleDragOver(e, 'categories')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'categories')}
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                  dragOverTab === 'categories'
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10'
                }`}
              >
                {dragOverTab === 'categories' ? (
                  <div className="text-center py-4 text-teal-600 dark:text-teal-400">
                    <Upload className="w-8 h-8 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs font-bold">Drop categories CSV file here to import...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search & Actions */}
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search categories by name, slug, or description..."
                          value={categorySearch}
                          onChange={(e) => {
                            setCategorySearch(e.target.value);
                            setCategoryPage(1);
                          }}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                          <tr>
                            <th className="px-4 py-3">Category Name</th>
                            <th className="px-4 py-3">Slug ID</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {paginatedCategories.length > 0 ? (
                            paginatedCategories.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-950 dark:text-slate-100">{c.name}</td>
                                <td className="px-4 py-3">
                                  <span className="font-mono bg-slate-50 dark:bg-slate-900 px-2 py-0.5 rounded text-slate-500 border border-slate-100 dark:border-slate-800/50">
                                    {c.slug}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{c.description || '—'}</td>
                                <td className="px-4 py-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => handleOpenCatEdit(c)}
                                    className="p-1 hover:text-teal-600 transition-colors text-slate-400"
                                    title="Edit Category"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(c.id, c.name)}
                                    className="p-1 hover:text-rose-600 transition-colors text-slate-400"
                                    title="Delete Category"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-bold">
                                No product categories match your query.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {catTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-slate-400 font-semibold">
                          Page {categoryPage} of {catTotalPages} ({filteredCategories.length} total categories)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={categoryPage === 1}
                            onClick={() => setCategoryPage(p => Math.max(1, p - 1))}
                            className="p-1 bg-slate-50 dark:bg-slate-800 rounded disabled:opacity-40"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            disabled={categoryPage === catTotalPages}
                            onClick={() => setCategoryPage(p => Math.min(catTotalPages, p + 1))}
                            className="p-1 bg-slate-50 dark:bg-slate-800 rounded disabled:opacity-40"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Create/Edit Category Modal-style Drawer Overlay */}
              {catFormOpen && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xl max-w-md w-full space-y-4 animate-scale-up">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {editingCat ? 'Modify Product Category' : 'Configure New Category'}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">Provide distinct identification for milk, feed, or processed arrays.</p>
                    </div>

                    <form onSubmit={handleSaveCategory} className="space-y-4">
                      {catFormError && (
                        <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-3 rounded-lg text-rose-800 dark:text-rose-400 text-xs">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{catFormError}</span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category Name</label>
                        <input
                          type="text"
                          required
                          value={catForm.name}
                          onChange={(e) => {
                            setCatForm({
                              ...catForm,
                              name: e.target.value,
                              slug: editingCat ? catForm.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                            });
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                          placeholder="e.g. Liquid Milk, Ghee Varieties"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Slug ID</label>
                        <input
                          type="text"
                          required
                          value={catForm.slug}
                          onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                          placeholder="e.g. liquid-milk"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description</label>
                        <textarea
                          value={catForm.description}
                          onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none min-h-[80px]"
                          placeholder="Provide summary of categorized items..."
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setCatFormOpen(false)}
                          className="px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Save Category
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* DELIVERY ROUTES PANEL */}
          {/* ======================================================== */}
          {activeSubTab === 'routes' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Route className="w-5 h-5 text-teal-600" />
                    Delivery Routes Master
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Manage logistics hubs, delivery vectors, and dairy supply routes.
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleExportRoutes}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" /> Import
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'routes')}
                    />
                  </label>
                  <button
                    onClick={handleOpenRouteCreate}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Route
                  </button>
                </div>
              </div>

              {/* CSV Upload Dropzone Route Indicator */}
              <div
                onDragOver={(e) => handleDragOver(e, 'routes')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'routes')}
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                  dragOverTab === 'routes'
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-950/10'
                }`}
              >
                {dragOverTab === 'routes' ? (
                  <div className="text-center py-4 text-teal-600 dark:text-teal-400">
                    <Upload className="w-8 h-8 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs font-bold">Drop routes CSV file here to import...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search & Actions */}
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search routes by name, description, or checkpoints..."
                          value={routeSearch}
                          onChange={(e) => {
                            setRouteSearch(e.target.value);
                            setRoutePage(1);
                          }}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                          <tr>
                            <th className="px-4 py-3">Route Name</th>
                            <th className="px-4 py-3">Start Checkpoint</th>
                            <th className="px-4 py-3">End Checkpoint</th>
                            <th className="px-4 py-3">Description</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                          {paginatedRoutes.length > 0 ? (
                            paginatedRoutes.map((r) => (
                              <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-950 dark:text-slate-100">{r.name}</td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                                    {r.startPoint || '—'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                    {r.endPoint || '—'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{r.description || '—'}</td>
                                <td className="px-4 py-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => handleOpenRouteEdit(r)}
                                    className="p-1 hover:text-teal-600 transition-colors text-slate-400"
                                    title="Edit Route"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRoute(r.id, r.name)}
                                    className="p-1 hover:text-rose-600 transition-colors text-slate-400"
                                    title="Delete Route"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-bold">
                                No delivery routes match your query.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {routeTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-slate-400 font-semibold">
                          Page {routePage} of {routeTotalPages} ({filteredRoutes.length} total routes)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={routePage === 1}
                            onClick={() => setRoutePage(p => Math.max(1, p - 1))}
                            className="p-1 bg-slate-50 dark:bg-slate-800 rounded disabled:opacity-40"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            disabled={routePage === routeTotalPages}
                            onClick={() => setRoutePage(p => Math.min(routeTotalPages, p + 1))}
                            className="p-1 bg-slate-50 dark:bg-slate-800 rounded disabled:opacity-40"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Route Editor Drawer */}
              {routeFormOpen && (
                <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xl max-w-md w-full space-y-4 animate-scale-up">
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {editingRoute ? 'Modify Delivery Route' : 'Configure New Route'}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">Logistical path boundaries for transport trucks.</p>
                    </div>

                    <form onSubmit={handleSaveRoute} className="space-y-4">
                      {routeFormError && (
                        <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-3 rounded-lg text-rose-800 dark:text-rose-400 text-xs">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{routeFormError}</span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Route Name</label>
                        <input
                          type="text"
                          required
                          value={routeForm.name}
                          onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                          placeholder="e.g. Northern Amritsar Core Path"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Start Point</label>
                          <input
                            type="text"
                            value={routeForm.startPoint}
                            onChange={(e) => setRouteForm({ ...routeForm, startPoint: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                            placeholder="e.g. Center Gate"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">End Point</label>
                          <input
                            type="text"
                            value={routeForm.endPoint}
                            onChange={(e) => setRouteForm({ ...routeForm, endPoint: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                            placeholder="e.g. Cold storage hub"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description</label>
                        <textarea
                          value={routeForm.description}
                          onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none min-h-[80px]"
                          placeholder="Provide details about delivery frequencies, agents, and checkpoints..."
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => setRouteFormOpen(false)}
                          className="px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Save Route
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* MILK TYPES & STANDARDS PANEL */}
          {/* ======================================================== */}
          {activeSubTab === 'milk-standards' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Milk className="w-5 h-5 text-teal-600" />
                  Milk Types & Quality Standards
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Configure primary accepted milk registries, baseline rates (INR/L), and baseline Fat & SNF standards.
                </p>
              </div>

              {/* Add Milk Type Form */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl space-y-3">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Configure New Milk Type</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-semibold">Key Identifier</label>
                    <input
                      type="text"
                      placeholder="e.g. camel, skim"
                      value={newMilkType.id}
                      onChange={(e) => setNewMilkType({ ...newMilkType, id: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-semibold">Label Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Camel Milk"
                      value={newMilkType.name}
                      onChange={(e) => setNewMilkType({ ...newMilkType, name: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-semibold">Base Rate (₹/L)</label>
                    <input
                      type="number"
                      placeholder="e.g. 52.00"
                      value={newMilkType.baseRate}
                      onChange={(e) => setNewMilkType({ ...newMilkType, baseRate: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddMilkType}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-lg py-1.5 text-xs font-bold transition-all shadow-sm"
                  >
                    Add Registry
                  </button>
                </div>
              </div>

              {/* Milk Types List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Milk Types & Quality Standards Matrix</h3>
                <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Key</th>
                        <th className="px-4 py-3">Label Name</th>
                        <th className="px-4 py-3">Base Rate (₹)</th>
                        <th className="px-4 py-3">Std. FAT (%)</th>
                        <th className="px-4 py-3">Std. SNF (%)</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {milkTypes.map((type) => {
                        const stds = fatSnfStandards[type.id] || { fat: 4.0, snf: 8.5 };
                        return (
                          <tr key={type.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                            <td className="px-4 py-3"><span className="font-mono bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-2 py-0.5 rounded text-slate-500">{type.id}</span></td>
                            <td className="px-4 py-3 font-bold text-slate-950 dark:text-slate-100">{type.name}</td>
                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">₹{parseFloat(type.baseRate).toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="15"
                                value={stds.fat}
                                onChange={(e) => handleUpdateStandards(type.id, 'fat', e.target.value)}
                                className="w-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 font-mono font-bold focus:ring-1 focus:ring-teal-500 outline-none"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="15"
                                value={stds.snf}
                                onChange={(e) => handleUpdateStandards(type.id, 'snf', e.target.value)}
                                className="w-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-0.5 font-mono font-bold focus:ring-1 focus:ring-teal-500 outline-none"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeleteMilkType(type.id)}
                                className="p-1 hover:text-rose-600 transition-colors text-slate-400"
                                title="Remove Milk Type"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveStandards}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Synchronize Standard Matrix
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* UNITS & EXPENSES PANEL */}
          {/* ======================================================== */}
          {activeSubTab === 'units-expenses' && (
            <div className="space-y-6 animate-fade-in">
              {/* Measurement Units */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-teal-600" />
                    Measurement Units Master
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Manage standard billing and volume inventory measurement labels.
                  </p>
                </div>

                {/* Add Unit input */}
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    placeholder="e.g. Barrels, Pouches"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                  <button
                    onClick={handleAddUnit}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Unit
                  </button>
                </div>

                {/* Unit chips */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {units.map((unit) => (
                    <span
                      key={unit}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      {unit}
                      <button
                        onClick={() => handleRemoveUnit(unit)}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Expense Categories */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-teal-600" />
                    Expense Categories Registry
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Configure standard headings for logging miscellaneous expenditures.
                  </p>
                </div>

                {/* Add Expense Category */}
                <div className="flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    placeholder="e.g. Machinery Hire, Cold chain electricity"
                    value={newExpenseCat}
                    onChange={(e) => setNewExpenseCat(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                  <button
                    onClick={handleAddExpenseCat}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Category
                  </button>
                </div>

                {/* Expense Categories chips */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {expenseCategories.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      {c}
                      <button
                        onClick={() => handleRemoveExpenseCat(c)}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SHIFTS & PAYMENTS PANEL */}
          {/* ======================================================== */}
          {activeSubTab === 'shifts-payments' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-600" />
                  Collection Shifts & Payment Toggles
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Configure active cooperative shift periods and restrict billing payout modalities.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Collection Shifts */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Shift Timing Boundaries</h3>
                  
                  <div className="space-y-3">
                    {shifts.map((shift) => (
                      <div key={shift.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/30 dark:bg-slate-950/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-950 dark:text-slate-100">{shift.name}</span>
                          <span className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600">{shift.id}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold">Start Time</span>
                            <input
                              type="time"
                              value={shift.startTime}
                              onChange={(e) => handleShiftTimeChange(shift.id, 'startTime', e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold">End Time</span>
                            <input
                              type="time"
                              value={shift.endTime}
                              onChange={(e) => handleShiftTimeChange(shift.id, 'endTime', e.target.value)}
                              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold focus:ring-1 focus:ring-teal-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Permitted Payout Methods</h3>
                  
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/10">
                    {['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'WALLET'].map((method) => {
                      const isActive = paymentMethods.includes(method);
                      return (
                        <div key={method} className="flex items-center justify-between p-3">
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{method.replace('_', ' ')}</span>
                            <p className="text-[10px] text-slate-400">Available during invoice settlements.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePaymentMethod(method)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActive ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                isActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={handleSaveShiftsAndPayments}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Payouts & Timings
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* NUMBER SERIES & TAX PANEL */}
          {/* ======================================================== */}
          {activeSubTab === 'series-tax' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Hash className="w-5 h-5 text-teal-600" />
                  Auto-Number Series & Tax Settings
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Manage invoice/collection prefixes, automatic starting sequence integers, and GSTIN registration rates.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Auto-Number Series */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Number Series Sequences</h3>
                  
                  <div className="space-y-3 bg-slate-50/40 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
                    <div className="space-y-2">
                      <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Sales Invoices Sequence</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold">Prefix</span>
                          <input
                            type="text"
                            value={numberSeries.invoicePrefix || ''}
                            onChange={(e) => handleSeriesChange('invoicePrefix', e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold">Starting ID Counter</span>
                          <input
                            type="number"
                            value={numberSeries.invoiceNext || ''}
                            onChange={(e) => handleSeriesChange('invoiceNext', e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Milk Collection Receipt Sequence</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold">Prefix</span>
                          <input
                            type="text"
                            value={numberSeries.collectionPrefix || ''}
                            onChange={(e) => handleSeriesChange('collectionPrefix', e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold">Starting ID Counter</span>
                          <input
                            type="number"
                            value={numberSeries.collectionNext || ''}
                            onChange={(e) => handleSeriesChange('collectionNext', e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300">Delivery Orders Sequence</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold">Prefix</span>
                          <input
                            type="text"
                            value={numberSeries.orderPrefix || ''}
                            onChange={(e) => handleSeriesChange('orderPrefix', e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-bold">Starting ID Counter</span>
                          <input
                            type="number"
                            value={numberSeries.orderNext || ''}
                            onChange={(e) => handleSeriesChange('orderNext', e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax & GST Settings */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tax & GSTIN Config</h3>
                  
                  <div className="space-y-4 bg-slate-50/40 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cooperative GSTIN No.</label>
                      <input
                        type="text"
                        placeholder="e.g. 03AAAAA1111A1Z1"
                        value={taxSettings.gstin || ''}
                        onChange={(e) => handleTaxChange('gstin', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Default Tax Rate (%)</label>
                      <input
                        type="number"
                        placeholder="18.00"
                        step="0.01"
                        value={taxSettings.taxRatePercent || ''}
                        onChange={(e) => handleTaxChange('taxRatePercent', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Tax Inclusive Rates</span>
                        <p className="text-[10px] text-slate-400">Include tax calculations inside base milk prices.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTaxChange('isInclusive', !taxSettings.isInclusive)}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          taxSettings.isInclusive ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            taxSettings.isInclusive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={handleSaveSeriesAndTax}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Sequences & Taxes
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* GENERAL & BUSINESS INFO PANEL */}
          {/* ======================================================== */}
          {activeSubTab === 'business-info' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-teal-600" />
                  Business Profile & General Settings
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Primary corporate identity fields, regional currencies, languages, and timezones.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Identity */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Corporate Contacts</h3>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Corporate Name</label>
                      <input
                        type="text"
                        value={businessSettings.businessName || ''}
                        onChange={(e) => handleBusinessSettingChange('businessName', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Support Phone No.</label>
                      <input
                        type="text"
                        value={businessSettings.phone || ''}
                        onChange={(e) => handleBusinessSettingChange('phone', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Support Email Address</label>
                      <input
                        type="email"
                        value={businessSettings.email || ''}
                        onChange={(e) => handleBusinessSettingChange('email', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Physical Complex Address</label>
                      <textarea
                        value={businessSettings.address || ''}
                        onChange={(e) => handleBusinessSettingChange('address', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-teal-500 min-h-[60px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Regional settings */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Regional Settings</h3>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Base Currency Code</label>
                      <select
                        value={generalSettings.currency || 'INR'}
                        onChange={(e) => handleGeneralSettingChange('currency', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none"
                      >
                        <option value="INR">INR (₹) - Indian Rupee</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Timezone</label>
                      <select
                        value={generalSettings.timezone || 'Asia/Kolkata'}
                        onChange={(e) => handleGeneralSettingChange('timezone', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="UTC">Coordinated Universal Time (UTC)</option>
                        <option value="US/Eastern">US/Eastern (EST/EDT)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Platform Language</label>
                      <select
                        value={generalSettings.language || 'en'}
                        onChange={(e) => handleGeneralSettingChange('language', e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold outline-none"
                      >
                        <option value="en">English (US)</option>
                        <option value="hi">Hindi (हिन्दी)</option>
                        <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  onClick={handleSaveBusinessInfo}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Profile Details
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
