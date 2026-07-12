import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api, calculateMilkRate, calculateQualityGrade } from '../utils/api';
import { MilkCollection, Farmer, SessionData } from '../types';
import { 
  ClipboardList, Plus, Search, Filter, Edit, Trash2, Download, Upload, 
  Printer, AlertCircle, CheckCircle2, Loader2, ChevronLeft, 
  ChevronRight, Info, Calendar, FileText, BarChart3, TrendingUp, Coins, 
  X, Check, Eye, Layers, Grid, FileSpreadsheet, RefreshCw, SlidersHorizontal
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

interface MilkCollectionManagementProps {
  session: SessionData | null;
}

export const MilkCollectionManagement: React.FC<MilkCollectionManagementProps> = ({ session }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  // Navigation sub-tabs inside Milk Collection
  const [subTab, setSubTab] = useState<'dashboard' | 'register' | 'bulk-entry' | 'bulk-import'>('dashboard');

  const [collections, setCollections] = useState<MilkCollection[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [fetching, setFetching] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Filters & Search State
  const [search, setSearch] = useState('');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'MORNING' | 'EVENING'>('all');
  const [milkFilter, setMilkFilter] = useState<'all' | 'COW' | 'BUFFALO' | 'MIXED'>('all');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('all');
  const [farmerFilter, setFarmerFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<string>('collectedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active Modals / Drawer State
  const [viewingCollection, setViewingCollection] = useState<MilkCollection | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<MilkCollection | null>(null);

  // Form Field State
  const [formFarmerId, setFormFarmerId] = useState('');
  const [formShift, setFormShift] = useState<'MORNING' | 'EVENING'>('MORNING');
  const [formCollectedAt, setFormCollectedAt] = useState('');
  const [formMilkType, setFormMilkType] = useState<'COW' | 'BUFFALO' | 'MIXED'>('MIXED');
  const [formQuantity, setFormQuantity] = useState('');
  const [formFat, setFormFat] = useState('');
  const [formSnf, setFormSnf] = useState('');
  const [formClr, setFormClr] = useState('');
  const [formTemperature, setFormTemperature] = useState('');
  const [formManualAdjustment, setFormManualAdjustment] = useState('0');
  const [formRemarks, setFormRemarks] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Bulk Entry Grid Rows
  const [bulkRows, setBulkRows] = useState<Array<{
    id: string;
    farmerId: string;
    milkType: 'COW' | 'BUFFALO' | 'MIXED';
    shift: 'MORNING' | 'EVENING';
    quantity: string;
    fat: string;
    snf: string;
    manualAdjustment: string;
    remarks: string;
  }>>([
    { id: '1', farmerId: '', milkType: 'MIXED', shift: 'MORNING', quantity: '', fat: '', snf: '', manualAdjustment: '0', remarks: '' }
  ]);

  // Bulk Import State
  const [importDragOver, setImportDragOver] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [rawImportText, setRawImportText] = useState('');
  const [importSummary, setImportSummary] = useState<{ successCount: number; duplicateCount: number; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);

  // RBAC checks
  const canWrite = useMemo(() => {
    const roleName = session?.user?.role || localStorage.getItem('dairysphere_user_role') || '';
    return ['ADMIN', 'MANAGER', 'OPERATOR'].includes(roleName.toUpperCase());
  }, [session]);

  const canDelete = useMemo(() => {
    const roleName = session?.user?.role || localStorage.getItem('dairysphere_user_role') || '';
    return ['ADMIN', 'MANAGER'].includes(roleName.toUpperCase());
  }, [session]);

  // Initialize date defaults
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormCollectedAt(today);
    
    // Auto shift detect based on current local hour (Morning: before 12 PM, Evening: 12 PM onwards)
    const hour = new Date().getHours();
    setFormShift(hour < 12 ? 'MORNING' : 'EVENING');
  }, [formOpen]);

  // Fetch Farmers & Collections
  const loadInitialData = async () => {
    setFetching(true);
    try {
      const farmersData = await api.getFarmers({ status: 'ACTIVE' });
      setFarmers(farmersData);

      const logs = await api.getMilkCollections({
        search,
        shift: shiftFilter,
        milkType: milkFilter,
        qualityGrade: gradeFilter,
        startDate,
        endDate,
        farmerId: farmerFilter,
        sortBy,
        sortOrder
      });
      setCollections(logs);
      setCurrentPage(1);
    } catch (err: any) {
      showToast(err.message || 'Error loading records.', 'error');
    } finally {
      setFetching(false);
    }
  };

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await api.getMilkCollectionAnalytics(30);
      setAnalytics(data);
    } catch (err: any) {
      showToast('Error loading collection analytics.', 'error');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [search, shiftFilter, milkFilter, gradeFilter, startDate, endDate, farmerFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (subTab === 'dashboard') {
      loadAnalytics();
    }
  }, [subTab, collections]);

  // Handle single form farmer pick to auto-fill milk preference
  const handleFarmerChange = (id: string) => {
    setFormFarmerId(id);
    const selectedFarmer = farmers.find(f => f.id === id);
    if (selectedFarmer) {
      setFormMilkType(selectedFarmer.milkPreference);
      // set base fat / snf defaults to guide entry speed
      if (selectedFarmer.milkPreference === 'COW') {
        setFormFat('4.0');
        setFormSnf('8.5');
      } else if (selectedFarmer.milkPreference === 'BUFFALO') {
        setFormFat('6.5');
        setFormSnf('9.0');
      } else {
        setFormFat('5.0');
        setFormSnf('8.7');
      }
    }
  };

  // Real-time calculations for Single Entry Form
  const liveCalculation = useMemo(() => {
    const qty = parseFloat(formQuantity) || 0;
    const fatPercent = parseFloat(formFat) || 0;
    const snfPercent = parseFloat(formSnf) || 0;
    const adj = parseFloat(formManualAdjustment) || 0;

    if (qty <= 0 || fatPercent < 1.0 || fatPercent > 15.0 || snfPercent < 5.0 || snfPercent > 12.0) {
      return { rate: 0, amount: 0, grade: 'D' as const, formula: 'Invalid entry parameters' };
    }

    const rate = calculateMilkRate(formMilkType, fatPercent, snfPercent);
    const amt = Math.round(((qty * rate) + adj) * 100) / 100;
    const grade = calculateQualityGrade(formMilkType, fatPercent, snfPercent);

    let formulaStr = '';
    if (formMilkType === 'COW') {
      formulaStr = `Base Cow Rate ₹45.00/L (at 4.0% Fat / 8.5% SNF) + Fat offset ₹0.50 per 0.1% + SNF offset ₹0.40 per 0.1%`;
    } else if (formMilkType === 'BUFFALO') {
      formulaStr = `Base Buffalo Rate ₹65.00/L (at 6.5% Fat / 9.0% SNF) + Fat offset ₹0.70 per 0.1% + SNF offset ₹0.55 per 0.1%`;
    } else {
      formulaStr = `Base Mixed Rate ₹52.00/L (at 5.0% Fat / 8.7% SNF) + Fat offset ₹0.60 per 0.1% + SNF offset ₹0.45 per 0.1%`;
    }

    return { rate, amount: amt, grade, formula: formulaStr };
  }, [formMilkType, formQuantity, formFat, formSnf, formManualAdjustment]);

  // Open Add form
  const handleOpenAdd = () => {
    setEditingCollection(null);
    setFormFarmerId('');
    setFormQuantity('');
    setFormFat('');
    setFormSnf('');
    setFormClr('');
    setFormTemperature('');
    setFormManualAdjustment('0');
    setFormRemarks('');
    setFormError(null);
    setFormOpen(true);
  };

  // Open Edit form
  const handleOpenEdit = (col: MilkCollection) => {
    setEditingCollection(col);
    setFormFarmerId(col.farmerId);
    setFormShift(col.shift);
    setFormCollectedAt(col.collectedAt.substring(0, 10));
    setFormMilkType(col.milkType);
    setFormQuantity(String(col.quantity));
    setFormFat(String(col.fat));
    setFormSnf(String(col.snf));
    setFormClr(col.clr ? String(col.clr) : '');
    setFormTemperature(col.temperature ? String(col.temperature) : '');
    setFormManualAdjustment(String(col.manualAdjustment || 0));
    setFormRemarks(col.remarks || '');
    setFormError(null);
    setFormOpen(true);
  };

  // Save Single Entry
  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFarmerId) {
      setFormError('Farmer selection is required.');
      return;
    }

    const qty = parseFloat(formQuantity);
    if (isNaN(qty) || qty <= 0) {
      setFormError('Quantity must be greater than zero.');
      return;
    }

    const fatVal = parseFloat(formFat);
    if (isNaN(fatVal) || fatVal < 1.0 || fatVal > 15.0) {
      setFormError('Fat % must be between 1.0% and 15.0%.');
      return;
    }

    const snfVal = parseFloat(formSnf);
    if (isNaN(snfVal) || snfVal < 5.0 || snfVal > 12.0) {
      setFormError('SNF % must be between 5.0% and 12.0%.');
      return;
    }

    setSaving(true);
    setFormError(null);

    const body = {
      farmerId: formFarmerId,
      milkType: formMilkType,
      quantity: qty,
      fat: fatVal,
      snf: snfVal,
      clr: formClr ? parseFloat(formClr) : undefined,
      temperature: formTemperature ? parseFloat(formTemperature) : undefined,
      collectedAt: new Date(formCollectedAt).toISOString(),
      shift: formShift,
      remarks: formRemarks,
      manualAdjustment: parseFloat(formManualAdjustment) || 0
    };

    try {
      if (editingCollection) {
        await api.updateMilkCollection(editingCollection.id, body);
        showToast('Milk collection record updated successfully.', 'success');
      } else {
        await api.createMilkCollection(body);
        showToast('Milk collection record added successfully.', 'success');
      }
      setFormOpen(false);
      loadInitialData();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Entry
  const handleDeleteCollection = async (col: MilkCollection) => {
    const confirmDelete = await confirm({
      title: 'Confirm deletion',
      message: `Are you sure you want to permanently delete the milk collection log of ${col.quantity}L from ${col.farmerName} (${col.farmerCode}) on shift ${col.shift}?`,
      confirmText: 'Delete Record',
      cancelText: 'Cancel'
    });

    if (confirmDelete) {
      try {
        await api.deleteMilkCollection(col.id);
        showToast('Milk collection record deleted.', 'info');
        loadInitialData();
      } catch (err: any) {
        showToast(err.message || 'Error deleting record.', 'error');
      }
    }
  };

  // --- Bulk Entry Grid Handlers ---
  const handleAddBulkRow = () => {
    setBulkRows([
      ...bulkRows,
      { id: String(Date.now()), farmerId: '', milkType: 'MIXED', shift: 'MORNING', quantity: '', fat: '', snf: '', manualAdjustment: '0', remarks: '' }
    ]);
  };

  const handleRemoveBulkRow = (rowId: string) => {
    if (bulkRows.length <= 1) return;
    setBulkRows(bulkRows.filter(r => r.id !== rowId));
  };

  const handleUpdateBulkRow = (rowId: string, field: string, val: string) => {
    setBulkRows(bulkRows.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row, [field]: val };
        // If farmer is picked, auto update milkType preference
        if (field === 'farmerId') {
          const matched = farmers.find(f => f.id === val);
          if (matched) {
            updatedRow.milkType = matched.milkPreference;
            if (matched.milkPreference === 'COW') {
              updatedRow.fat = '4.0';
              updatedRow.snf = '8.5';
            } else if (matched.milkPreference === 'BUFFALO') {
              updatedRow.fat = '6.5';
              updatedRow.snf = '9.0';
            } else {
              updatedRow.fat = '5.0';
              updatedRow.snf = '8.7';
            }
          }
        }
        return updatedRow;
      }
      return row;
    }));
  };

  const handleSaveBulkRows = async () => {
    // Basic validation
    const emptyFarmer = bulkRows.some(r => !r.farmerId);
    if (emptyFarmer) {
      showToast('All bulk rows must have a selected farmer.', 'error');
      return;
    }

    const invalidNumbers = bulkRows.some(r => {
      const q = parseFloat(r.quantity);
      const f = parseFloat(r.fat);
      const s = parseFloat(r.snf);
      return isNaN(q) || q <= 0 || isNaN(f) || f < 1.0 || f > 15.0 || isNaN(s) || s < 5.0 || s > 12.0;
    });

    if (invalidNumbers) {
      showToast('All bulk rows must have valid Quantity (>0), Fat (1-15%) and SNF (5-12%) measurements.', 'error');
      return;
    }

    setSaving(true);
    let successCount = 0;
    let failCount = 0;
    let duplicateCount = 0;

    const todayDate = new Date().toISOString();

    for (const row of bulkRows) {
      const body = {
        farmerId: row.farmerId,
        milkType: row.milkType,
        quantity: parseFloat(row.quantity),
        fat: parseFloat(row.fat),
        snf: parseFloat(row.snf),
        collectedAt: todayDate,
        shift: row.shift,
        manualAdjustment: parseFloat(row.manualAdjustment) || 0,
        remarks: row.remarks || 'Bulk entry'
      };

      try {
        await api.createMilkCollection(body);
        successCount++;
      } catch (err: any) {
        if (err.message && err.message.includes('Duplicate')) {
          duplicateCount++;
        } else {
          failCount++;
        }
      }
    }

    setSaving(false);
    if (successCount > 0) {
      showToast(`Successfully logged ${successCount} collection records.`, 'success');
      setBulkRows([
        { id: '1', farmerId: '', milkType: 'MIXED', shift: 'MORNING', quantity: '', fat: '', snf: '', manualAdjustment: '0', remarks: '' }
      ]);
      setSubTab('register');
      loadInitialData();
    }
    if (duplicateCount > 0 || failCount > 0) {
      showToast(`Warning: ${duplicateCount} duplicate entries skipped, ${failCount} rows failed registration.`, 'warning');
    }
  };

  // --- Bulk Import Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setImportDragOver(true);
  };

  const handleDragLeave = () => {
    setImportDragOver(false);
  };

  const parseAndImport = async (jsonText: string) => {
    setImporting(true);
    setImportSummary(null);
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        showToast('Invalid file format. File must contain an array of objects.', 'error');
        return;
      }
      const summary = await api.importMilkCollections(parsed);
      setImportSummary(summary);
      if (summary.successCount > 0) {
        showToast(`Successfully imported ${summary.successCount} collection records.`, 'success');
        loadInitialData();
      }
    } catch (err: any) {
      showToast('Error parsing file content. Please check JSON syntax.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setImportDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      try {
        await api.validateFileUpload(files[0], ['csv']);
      } catch (err: any) {
        showToast(err.message || 'File verification failed.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          parseAndImport(evt.target.result as string);
        }
      };
      reader.readAsText(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      try {
        await api.validateFileUpload(files[0], ['csv']);
      } catch (err: any) {
        showToast(err.message || 'File verification failed.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          parseAndImport(evt.target.result as string);
        }
      };
      reader.readAsText(files[0]);
    }
  };

  // Template Downloader
  const downloadImportTemplate = () => {
    const sample = [
      {
        farmerCode: "FMR-001",
        milkType: "COW",
        shift: "MORNING",
        quantity: 25.5,
        fat: 4.2,
        snf: 8.6,
        clr: 28.5,
        temperature: 4.5,
        manualAdjustment: 0,
        remarks: "Premium feed batch"
      },
      {
        farmerCode: "FMR-002",
        milkType: "BUFFALO",
        shift: "EVENING",
        quantity: 14.2,
        fat: 7.1,
        snf: 9.3,
        clr: 30.1,
        temperature: 5.2,
        manualAdjustment: 10,
        remarks: "Bonus grade cream"
      }
    ];

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sample, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "milk_collection_import_template.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Template downloaded successfully.', 'success');
  };

  // CSV Export for register
  const handleExportCSV = () => {
    if (collections.length === 0) {
      showToast('No records available for export.', 'warning');
      return;
    }

    const headers = ['Collection ID', 'Date', 'Shift', 'Farmer Code', 'Farmer Name', 'Milk Type', 'Quantity (L)', 'Fat %', 'SNF %', 'CLR', 'Temp (°C)', 'Rate Per Liter (₹)', 'Manual Adj (₹)', 'Total Amount (₹)', 'Quality Grade', 'Remarks'];
    const rows = collections.map(c => [
      c.id,
      c.collectedAt.substring(0, 10),
      c.shift,
      c.farmerCode,
      c.farmerName,
      c.milkType,
      c.quantity,
      c.fat,
      c.snf,
      c.clr || '',
      c.temperature || '',
      c.ratePerLiter,
      c.manualAdjustment || 0,
      c.totalAmount,
      c.qualityGrade,
      c.remarks || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `dairysphere_milk_collection_register_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('CSV register downloaded successfully.', 'success');
  };

  // Printing Collection Register view
  const handlePrintRegister = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const totalLitres = collections.reduce((acc, c) => acc + c.quantity, 0).toFixed(2);
    const totalAmt = collections.reduce((acc, c) => acc + c.totalAmount, 0).toFixed(2);
    const avgFat = (collections.reduce((acc, c) => acc + (c.fat * c.quantity), 0) / parseFloat(totalLitres) || 0).toFixed(2);
    const avgSnf = (collections.reduce((acc, c) => acc + (c.snf * c.quantity), 0) / parseFloat(totalLitres) || 0).toFixed(2);

    printWindow.document.write(`
      <html>
        <head>
          <title>DairySphere - Milk Collection Register Ledger</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 24px; }
            h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
            .header-info { font-size: 11px; color: #64748b; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9; font-weight: 600; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .totals-panel { display: flex; gap: 24px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px; }
            .stat { font-size: 11px; }
            .stat-val { font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 2px; }
            .footer-signature { margin-top: 60px; display: flex; justify-content: space-between; font-size: 10px; color: #64748b; }
            .signature-line { border-top: 1px solid #94a3b8; width: 180px; margin-top: 40px; text-align: center; padding-top: 6px; }
          </style>
        </head>
        <body onload="window.print()">
          <h1>Milk Collection Register Ledger</h1>
          <div class="header-info">
            Cooperative Node: ${session?.business?.name || 'Main Hub'} | Date Printed: ${new Date().toLocaleString()} | Operator Id: ${session?.user?.name || 'System Agent'}
          </div>

          <div class="totals-panel">
            <div class="stat">
              <div>TOTAL VOLUME</div>
              <div class="stat-val">${totalLitres} Liters</div>
            </div>
            <div class="stat">
              <div>TOTAL ACCRUED AMOUNT</div>
              <div class="stat-val">₹${totalAmt}</div>
            </div>
            <div class="stat">
              <div>WEIGHTED AVG FAT</div>
              <div class="stat-val">${avgFat}%</div>
            </div>
            <div class="stat">
              <div>WEIGHTED AVG SNF</div>
              <div class="stat-val">${avgSnf}%</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift</th>
                <th>Farmer Code</th>
                <th>Farmer Name</th>
                <th>Milk Type</th>
                <th>Quantity</th>
                <th>Fat %</th>
                <th>SNF %</th>
                <th>Rate/L</th>
                <th>Manual Adj.</th>
                <th>Total Amt</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${collections.map(c => `
                <tr>
                  <td>${c.collectedAt.substring(0, 10)}</td>
                  <td>${c.shift}</td>
                  <td>${c.farmerCode}</td>
                  <td>${c.farmerName}</td>
                  <td>${c.milkType}</td>
                  <td>${c.quantity.toFixed(2)}L</td>
                  <td>${c.fat.toFixed(1)}%</td>
                  <td>${c.snf.toFixed(1)}%</td>
                  <td>₹${c.ratePerLiter.toFixed(2)}</td>
                  <td>₹${(c.manualAdjustment || 0).toFixed(2)}</td>
                  <td>₹${c.totalAmount.toFixed(2)}</td>
                  <td><strong>${c.qualityGrade}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer-signature">
            <div class="signature-line">Cooperative Desk Officer Signature</div>
            <div class="signature-line">Audit Control Desk</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Thermal print for individual slip
  const handlePrintSlip = (c: MilkCollection) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Milk Collection Slip - ${c.farmerCode}</title>
          <style>
            body { 
              font-family: "Courier New", Courier, monospace; 
              color: #000; 
              width: 280px; 
              margin: 0; 
              padding: 10px; 
              font-size: 11px; 
              line-height: 1.4; 
            }
            .center { text-align: center; }
            .header { font-size: 13px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
            .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
            .row-item { display: flex; justify-content: space-between; }
            .amount { font-size: 14px; font-weight: bold; }
            .footer { font-size: 9px; margin-top: 15px; text-align: center; color: #555; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="center header">${session?.business?.name || 'DAIRYSPHERE'}</div>
          <div class="center" style="font-size: 9px;">MILK COLLECTION LOG RECEIPT</div>
          <div class="divider"></div>
          
          <div class="row-item"><span>Receipt No:</span><span>${c.id}</span></div>
          <div class="row-item"><span>Date:</span><span>${c.collectedAt.substring(0, 10)}</span></div>
          <div class="row-item"><span>Shift:</span><span>${c.shift}</span></div>
          <div class="row-item"><span>Operator:</span><span>${session?.user?.name || 'operator'}</span></div>
          
          <div class="divider"></div>
          
          <div class="row-item"><span>Farmer Code:</span><span><strong>${c.farmerCode}</strong></span></div>
          <div class="row-item"><span>Farmer Name:</span><span>${c.farmerName}</span></div>
          <div class="row-item"><span>Milk Variety:</span><span>${c.milkType}</span></div>
          
          <div class="divider"></div>
          
          <div class="row-item"><span>Quantity:</span><span><strong>${c.quantity.toFixed(2)} Liters</strong></span></div>
          <div class="row-item"><span>Fat %:</span><span>${c.fat.toFixed(1)}%</span></div>
          <div class="row-item"><span>SNF %:</span><span>${c.snf.toFixed(1)}%</span></div>
          ${c.clr ? `<div class="row-item"><span>CLR Reading:</span><span>${c.clr}</span></div>` : ''}
          ${c.temperature ? `<div class="row-item"><span>Temperature:</span><span>${c.temperature}°C</span></div>` : ''}
          
          <div class="divider"></div>
          
          <div class="row-item"><span>Base Rate:</span><span>₹${c.ratePerLiter.toFixed(2)}/L</span></div>
          <div class="row-item"><span>Manual Adj:</span><span>₹${(c.manualAdjustment || 0).toFixed(2)}</span></div>
          <div class="row-item"><span>Quality Grade:</span><span><strong>Grade ${c.qualityGrade}</strong></span></div>
          
          <div class="divider"></div>
          
          <div class="row-item amount"><span>TOTAL VALUE:</span><span>₹${c.totalAmount.toFixed(2)}</span></div>
          
          <div class="divider"></div>
          <div class="footer">
            Thank you for your active co-operation.<br/>
            DairySphere Digital Ledger - Stage 5.3
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Pagination Helper
  const paginatedCollections = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return collections.slice(startIndex, startIndex + itemsPerPage);
  }, [collections, currentPage]);

  const totalPages = Math.ceil(collections.length / itemsPerPage) || 1;

  // Chart data colors
  const MILK_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];
  const SHIFT_COLORS = ['#f59e0b', '#6366f1'];

  return (
    <div className="space-y-6">
      {/* Module Title and Navigation Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            Milk Collection Desk
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Log, validate, and audit real-time milk collection sessions with enterprise rate calculations.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setSubTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              subTab === 'dashboard'
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/40'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />
            Performance & Trends
          </button>
          <button 
            onClick={() => setSubTab('register')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
              subTab === 'register'
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/40'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1.5" />
            Collection Ledger
          </button>
          {canWrite && (
            <>
              <button 
                onClick={() => setSubTab('bulk-entry')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  subTab === 'bulk-entry'
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/40'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Grid className="w-3.5 h-3.5 inline mr-1.5" />
                Quick Bulk Entry
              </button>
              <button 
                onClick={() => setSubTab('bulk-import')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  subTab === 'bulk-import'
                    ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-900/40'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5 inline mr-1.5" />
                Import JSON Logs
              </button>
            </>
          )}
        </div>
      </div>

      {/* SUBTAB 1: PERFORMANCE ANALYTICS DASHBOARD */}
      {subTab === 'dashboard' && (
        <div className="space-y-6">
          {loadingAnalytics || !analytics ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <Loader2 className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 font-medium">Crunching collection session performance indicators...</p>
            </div>
          ) : (
            <>
              {/* Analytics Summary Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Litres Collected</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalVolume.toLocaleString()} L</p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Past 30 days session intake
                    </p>
                  </div>
                  <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-lg text-teal-600 dark:text-teal-400">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Accrued Farmer Payments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{analytics.totalAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Accrued payout ledger total</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-blue-600 dark:text-blue-400">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weighted Fat Avg</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.averageFat}%</p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400">Optimal chemical density</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Weighted SNF Avg</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.averageSnf}%</p>
                    <p className="text-[10px] text-teal-600 dark:text-teal-400">Premium quality aggregate</p>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Main Analytics Visuals */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Time-Series Area Chart (Daily Volume & Payout) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Daily Intake & Valuation Trends</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Consolidated Milk volume and financial values over past 30 days</p>
                    </div>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.dailyTrends}>
                        <defs>
                          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis yAxisId="left" stroke="#14b8a6" fontSize={10} tickLine={false} label={{ value: 'Liters', angle: -90, position: 'insideLeft', style: {fontSize: 10, fill: '#14b8a6'} }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={10} tickLine={false} label={{ value: 'Amount (₹)', angle: 90, position: 'insideRight', style: {fontSize: 10, fill: '#3b82f6'} }} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                        <Area yAxisId="left" type="monotone" dataKey="volume" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" name="Volume (L)" />
                        <Area yAxisId="right" type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" name="Value (₹)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Donut and breakdown charts */}
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Milk Variety Distribution</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Breakdown of gross collection share by Milk Category</p>
                    <div className="h-44 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.milkTypeBreakdown}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {analytics.milkTypeBreakdown.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={MILK_COLORS[index % MILK_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                    {analytics.milkTypeBreakdown.map((item: any, idx: number) => (
                      <div key={item.name} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MILK_COLORS[idx] }}></span>
                          <span>{item.name} Milk</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-white">{item.value.toLocaleString()} Liters</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shift Breakdown & Top Farmers Contribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Shift Delivery Proportions</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Comparing Morning vs Evening shifts session volume</p>
                    <div className="h-44 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.shiftBreakdown}
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {analytics.shiftBreakdown.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={SHIFT_COLORS[index % SHIFT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                    {analytics.shiftBreakdown.map((item: any, idx: number) => (
                      <div key={item.name} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SHIFT_COLORS[idx] }}></span>
                          <span>{item.name} Shift</span>
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-white">{item.value.toLocaleString()} Liters</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Top 5 Farmer Contributors (By Volume)</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Members with the highest quantity logged in current register context</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                          <th className="pb-3">Farmer Code</th>
                          <th className="pb-3">Name</th>
                          <th className="pb-3 text-right">Logged Intake</th>
                          <th className="pb-3 text-right">Value Generated</th>
                          <th className="pb-3 text-right">Logs Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.topFarmers.slice(0, 5).map((farmer: any) => (
                          <tr key={farmer.code} className="border-b border-gray-50 dark:border-gray-900/40 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/20">
                            <td className="py-2.5 font-mono text-teal-600 dark:text-teal-400">{farmer.code}</td>
                            <td className="py-2.5 font-medium text-gray-800 dark:text-gray-200">{farmer.name}</td>
                            <td className="py-2.5 text-right text-gray-800 dark:text-gray-200">{farmer.volume.toFixed(1)} Liters</td>
                            <td className="py-2.5 text-right font-medium text-teal-600 dark:text-teal-400">₹{farmer.amount.toLocaleString()}</td>
                            <td className="py-2.5 text-right text-gray-500 dark:text-gray-400">{farmer.count} slips</td>
                          </tr>
                        ))}
                        {analytics.topFarmers.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-400 dark:text-gray-500">No farmer contribution data registered yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SUBTAB 2: REGISTER LEDGER VIEW */}
      {subTab === 'register' && (
        <div className="space-y-6">
          {/* Filters & Control Deck */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Filter by Farmer Name, Code or Remarks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white text-sm rounded-lg focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canWrite && (
                  <button 
                    onClick={handleOpenAdd}
                    className="bg-teal-600 dark:bg-teal-500 text-white hover:bg-teal-700 dark:hover:bg-teal-600 px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Intake Log
                  </button>
                )}
                <button 
                  onClick={handleExportCSV}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button 
                  onClick={handlePrintRegister}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" /> Print Ledger
                </button>
              </div>
            </div>

            {/* Advanced Filters Drawer */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800/60 grid grid-cols-2 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Shift</label>
                <select 
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value as any)}
                  className="w-full text-xs py-1.5 px-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded focus:outline-none"
                >
                  <option value="all">All Shifts</option>
                  <option value="MORNING">Morning Shift</option>
                  <option value="EVENING">Evening Shift</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Milk Variety</label>
                <select 
                  value={milkFilter}
                  onChange={(e) => setMilkFilter(e.target.value as any)}
                  className="w-full text-xs py-1.5 px-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded focus:outline-none"
                >
                  <option value="all">All Varieties</option>
                  <option value="COW">Cow Milk</option>
                  <option value="BUFFALO">Buffalo Milk</option>
                  <option value="MIXED">Mixed Milk</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Quality Grade</label>
                <select 
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value as any)}
                  className="w-full text-xs py-1.5 px-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded focus:outline-none"
                >
                  <option value="all">All Grades</option>
                  <option value="A">Grade A (Premium)</option>
                  <option value="B">Grade B (Standard)</option>
                  <option value="C">Grade C (Average)</option>
                  <option value="D">Grade D (Substandard)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Farmer Profile</label>
                <select 
                  value={farmerFilter}
                  onChange={(e) => setFarmerFilter(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded focus:outline-none"
                >
                  <option value="all">All Members</option>
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">From Date</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">To Date</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 rounded focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Records Table ledger */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="p-4">Date & Shift</th>
                    <th className="p-4">Farmer Details</th>
                    <th className="p-4">Milk Type</th>
                    <th className="p-4 text-right">Quantity</th>
                    <th className="p-4 text-center">Fat / SNF</th>
                    <th className="p-4 text-right">Rate/L</th>
                    <th className="p-4 text-right">Total Amount</th>
                    <th className="p-4 text-center">Grade</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {paginatedCollections.map((col) => (
                    <tr key={col.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/10 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{col.collectedAt.substring(0, 10)}</div>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase mt-0.5">{col.shift}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 dark:text-white">{col.farmerName}</div>
                        <div className="font-mono text-teal-600 dark:text-teal-400 mt-0.5">{col.farmerCode}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          col.milkType === 'COW'
                            ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30'
                            : col.milkType === 'BUFFALO'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'
                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'
                        }`}>
                          {col.milkType}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-gray-800 dark:text-gray-200">
                        {col.quantity.toFixed(2)} L
                      </td>
                      <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                        <div>Fat: <span className="font-semibold text-gray-800 dark:text-gray-200">{col.fat.toFixed(1)}%</span></div>
                        <div className="text-[10px] mt-0.5">SNF: <span className="font-semibold text-gray-800 dark:text-gray-200">{col.snf.toFixed(1)}%</span></div>
                      </td>
                      <td className="p-4 text-right text-gray-600 dark:text-gray-400">
                        ₹{col.ratePerLiter.toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-semibold text-teal-600 dark:text-teal-400 text-sm">
                        ₹{col.totalAmount.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border ${
                          col.qualityGrade === 'A'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40'
                            : col.qualityGrade === 'B'
                            ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40'
                            : col.qualityGrade === 'C'
                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                            : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40'
                        }`}>
                          {col.qualityGrade}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setViewingCollection(col)}
                            title="Print thermal receipt ticket"
                            className="p-1.5 rounded bg-gray-50 dark:bg-gray-850 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canWrite && (
                            <button 
                              onClick={() => handleOpenEdit(col)}
                              className="p-1.5 rounded bg-gray-50 dark:bg-gray-850 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button 
                              onClick={() => handleDeleteCollection(col)}
                              className="p-1.5 rounded bg-gray-50 dark:bg-gray-850 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {collections.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-gray-400 dark:text-gray-500 font-medium">
                        No milk collection records found. Pick another filter or add a fresh intake log.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Panel */}
            {collections.length > 0 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs bg-gray-50/50 dark:bg-gray-950/30">
                <span className="text-gray-500 dark:text-gray-400">
                  Showing <span className="font-semibold text-gray-800 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-gray-800 dark:text-white">{Math.min(currentPage * itemsPerPage, collections.length)}</span> of <span className="font-semibold text-gray-800 dark:text-white">{collections.length}</span> registers
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-1.5 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: QUICK BULK ENTRY SHEET */}
      {subTab === 'bulk-entry' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              Sequential Intake Sheet
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ideal for fast paced on-desk collection. Tab through inputs to log multiple farmers simultaneously for today's current session. Rates and totals dynamically calculate per row.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="p-3 w-1/4">Farmer Selection</th>
                    <th className="p-3 w-1/12">Shift</th>
                    <th className="p-3 w-1/8">Milk Type</th>
                    <th className="p-3 w-1/8">Quantity (Liters)</th>
                    <th className="p-3 w-1/12">Fat %</th>
                    <th className="p-3 w-1/12">SNF %</th>
                    <th className="p-3 w-1/12">Manual Adj (₹)</th>
                    <th className="p-3 text-right">Estimated Yield</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                  {bulkRows.map((row, index) => {
                    const parsedQty = parseFloat(row.quantity) || 0;
                    const parsedFat = parseFloat(row.fat) || 0;
                    const parsedSnf = parseFloat(row.snf) || 0;
                    const parsedAdj = parseFloat(row.manualAdjustment) || 0;
                    
                    const rate = (parsedQty > 0 && parsedFat >= 1 && parsedSnf >= 5) 
                      ? calculateMilkRate(row.milkType, parsedFat, parsedSnf) 
                      : 0;
                    const totalAmt = Math.round(((parsedQty * rate) + parsedAdj) * 100) / 100;

                    return (
                      <tr key={row.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-850/20">
                        <td className="p-3">
                          <select 
                            value={row.farmerId}
                            onChange={(e) => handleUpdateBulkRow(row.id, 'farmerId', e.target.value)}
                            className="w-full text-xs p-1.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded focus:outline-none"
                          >
                            <option value="">-- Choose Member --</option>
                            {farmers.map(f => (
                              <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            value={row.shift}
                            onChange={(e) => handleUpdateBulkRow(row.id, 'shift', e.target.value)}
                            className="w-full text-xs p-1.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded focus:outline-none"
                          >
                            <option value="MORNING">MORNING</option>
                            <option value="EVENING">EVENING</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            value={row.milkType}
                            onChange={(e) => handleUpdateBulkRow(row.id, 'milkType', e.target.value)}
                            className="w-full text-xs p-1.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded focus:outline-none"
                          >
                            <option value="COW">COW</option>
                            <option value="BUFFALO">BUFFALO</option>
                            <option value="MIXED">MIXED</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input 
                            type="number"
                            placeholder="0.00"
                            step="0.1"
                            value={row.quantity}
                            onChange={(e) => handleUpdateBulkRow(row.id, 'quantity', e.target.value)}
                            className="w-full text-xs p-1.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded focus:outline-none font-medium"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number"
                            placeholder="Fat %"
                            step="0.1"
                            value={row.fat}
                            onChange={(e) => handleUpdateBulkRow(row.id, 'fat', e.target.value)}
                            className="w-full text-xs p-1.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded focus:outline-none"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number"
                            placeholder="SNF %"
                            step="0.1"
                            value={row.snf}
                            onChange={(e) => handleUpdateBulkRow(row.id, 'snf', e.target.value)}
                            className="w-full text-xs p-1.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded focus:outline-none"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number"
                            placeholder="0"
                            value={row.manualAdjustment}
                            onChange={(e) => handleUpdateBulkRow(row.id, 'manualAdjustment', e.target.value)}
                            className="w-full text-xs p-1.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded focus:outline-none"
                          />
                        </td>
                        <td className="p-3 text-right font-semibold text-gray-800 dark:text-gray-200">
                          {totalAmt > 0 ? (
                            <div>
                              <div className="text-teal-600 dark:text-teal-400">₹{totalAmt.toFixed(2)}</div>
                              <div className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5">₹{rate.toFixed(2)}/L</div>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            disabled={bulkRows.length <= 1}
                            onClick={() => handleRemoveBulkRow(row.id)}
                            className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-30 transition"
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

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-950/30">
              <button 
                onClick={handleAddBulkRow}
                className="px-3.5 py-1.5 border border-gray-200 dark:border-gray-800 text-xs font-semibold rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                + Append Row
              </button>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSubTab('register')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  Discard
                </button>
                <button 
                  onClick={handleSaveBulkRows}
                  disabled={saving}
                  className="bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white px-5 py-2 text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loggin intake...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Save Collection Group
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: BULK LOG IMPORT DRAWER */}
      {subTab === 'bulk-import' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50 dark:border-gray-800 pb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Import Collection Records (JSON Format)</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Load large scale collections logs seamlessly by dropping your structured log files below.</p>
              </div>
              <button 
                onClick={downloadImportTemplate}
                className="px-3.5 py-1.5 text-xs font-semibold border border-teal-200 dark:border-teal-900 text-teal-700 dark:text-teal-400 rounded-lg bg-teal-50/50 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download JSON Template
              </button>
            </div>

            {/* Drag & Drop Canvas */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => importFileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition ${
                importDragOver 
                  ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/10'
                  : 'border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-950/10 hover:border-teal-500 dark:hover:border-teal-500'
              }`}
            >
              <input 
                type="file"
                ref={importFileRef}
                onChange={handleFileSelect}
                accept=".json"
                className="hidden"
              />
              <Upload className={`w-8 h-8 mb-3 transition-colors ${importDragOver ? 'text-teal-500' : 'text-gray-400'}`} />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Drag & Drop structured JSON log file here, or browse files</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Accepts compliant JSON logs arrays up to 500 records per file</p>
            </div>

            {/* Pasting raw JSON */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Or Paste Raw JSON Array</label>
              <textarea 
                rows={6}
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                placeholder='[\n  {\n    "farmerCode": "FMR-001",\n    "milkType": "COW",\n    "shift": "MORNING",\n    "quantity": 12.5,\n    "fat": 4.1,\n    "snf": 8.5\n  }\n]'
                className="w-full text-xs font-mono p-3 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-teal-500"
              />
              <div className="flex justify-end">
                <button 
                  disabled={!rawImportText || importing}
                  onClick={() => parseAndImport(rawImportText)}
                  className="bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white disabled:opacity-40 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                >
                  {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                  Submit Raw JSON Text
                </button>
              </div>
            </div>

            {/* Import Summary Results */}
            {importSummary && (
              <div className="mt-4 p-5 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl space-y-3">
                <h3 className="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">Import Log Result Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-100 dark:border-gray-800 text-center">
                    <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">ROWS LOADED</div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{importSummary.successCount} rows</div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-100 dark:border-gray-800 text-center">
                    <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">DUPLICATES SKIPPED</div>
                    <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{importSummary.duplicateCount} rows</div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-100 dark:border-gray-800 text-center col-span-2 md:col-span-1">
                    <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">VALIDATION ERRORS</div>
                    <div className="text-xl font-bold text-red-500 mt-1">{importSummary.errors.length} errors</div>
                  </div>
                </div>

                {importSummary.errors.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-bold text-red-500 flex items-center gap-1 mb-2">
                      <AlertCircle className="w-3.5 h-3.5" /> List of validation rejections
                    </div>
                    <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded p-3 text-[11px] font-mono text-red-700 dark:text-red-400 max-h-40 overflow-y-auto space-y-1">
                      {importSummary.errors.map((err, i) => (
                        <div key={i}>• {err}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT SINGLE INTAKE REGISTER DRAWER */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-950/30">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                {editingCollection ? 'Modify Collection Log' : 'Log New Milk Intake'}
              </h3>
              <button 
                onClick={() => setFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="p-5 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-red-50/80 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs font-medium text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {formError}
                </div>
              )}

              {/* Farmer selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Farmer *</label>
                <select 
                  value={formFarmerId}
                  onChange={(e) => handleFarmerChange(e.target.value)}
                  disabled={!!editingCollection}
                  className="w-full text-xs p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-teal-500 disabled:opacity-50"
                >
                  <option value="">-- Select Active Farmer --</option>
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              {/* Grid block */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Shift</label>
                  <select 
                    value={formShift}
                    onChange={(e) => setFormShift(e.target.value as any)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-teal-500"
                  >
                    <option value="MORNING">MORNING (AM)</option>
                    <option value="EVENING">EVENING (PM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Intake Date</label>
                  <input 
                    type="date"
                    value={formCollectedAt}
                    onChange={(e) => setFormCollectedAt(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Variety Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Milk Variety</label>
                  <select 
                    value={formMilkType}
                    onChange={(e) => setFormMilkType(e.target.value as any)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-teal-500"
                  >
                    <option value="COW">COW</option>
                    <option value="BUFFALO">BUFFALO</option>
                    <option value="MIXED">MIXED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Quantity (Litres) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="Enter quantity"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-teal-500 font-semibold text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Chemical tests */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-950/30 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800/80">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Fat Percentage *</label>
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="e.g. 4.2"
                    value={formFat}
                    onChange={(e) => setFormFat(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-[9px] text-gray-400 dark:text-gray-500">Allowed range: 1.0% - 15.0%</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">SNF Percentage *</label>
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="e.g. 8.5"
                    value={formSnf}
                    onChange={(e) => setFormSnf(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-[9px] text-gray-400 dark:text-gray-500">Allowed range: 5.0% - 12.0%</span>
                </div>
              </div>

              {/* Optional test variables */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">CLR Reading (Optional)</label>
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="e.g. 28"
                    value={formClr}
                    onChange={(e) => setFormClr(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Temperature °C (Optional)</label>
                  <input 
                    type="number"
                    step="0.1"
                    placeholder="e.g. 4.5"
                    value={formTemperature}
                    onChange={(e) => setFormTemperature(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Adjustments & Remarks */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Manual Cash Adjustment (₹)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 10 or -5"
                    value={formManualAdjustment}
                    onChange={(e) => setFormManualAdjustment(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-[9px] text-gray-400 dark:text-gray-500">Premium bonus (positive) or deductions (negative)</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Operator Notes / Remarks</label>
                  <input 
                    type="text"
                    placeholder="e.g. Clean stainless steel can"
                    value={formRemarks}
                    onChange={(e) => setFormRemarks(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Real-time calculated live feedback */}
              <div className="bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Dynamic Valuation Rate:</span>
                  <span className="text-sm font-bold text-teal-700 dark:text-teal-400">₹{liveCalculation.rate.toFixed(2)}/L</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Chemical Quality Rank:</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300">Grade {liveCalculation.grade}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-teal-100 dark:border-teal-900/30">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Estimated Total Payout:</span>
                  <span className="text-lg font-bold text-teal-600 dark:text-teal-400">₹{liveCalculation.amount.toLocaleString()}</span>
                </div>
                <div className="text-[9px] text-gray-400 dark:text-gray-500 italic mt-1 leading-normal">
                  {liveCalculation.formula}
                </div>
              </div>
            </form>

            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30 flex items-center justify-end gap-2">
              <button 
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                Discard
              </button>
              <button 
                type="button"
                onClick={handleSaveCollection}
                disabled={saving}
                className="bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Record
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL TICKET RECEIPT WINDOW */}
      {viewingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Intake Receipt Log</span>
              <button 
                onClick={() => setViewingCollection(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal Slip UI layout */}
            <div className="p-6 bg-amber-50/20 dark:bg-gray-950/40 font-mono text-[11px] text-gray-800 dark:text-gray-300 space-y-4">
              <div className="text-center space-y-1">
                <div className="text-sm font-bold text-gray-900 dark:text-white uppercase">{session?.business?.name || 'DAIRYSPHERE'}</div>
                <div className="text-[9px] text-gray-400 uppercase tracking-wider">Session Collection Desk</div>
              </div>

              <div className="border-t border-dashed border-gray-300 dark:border-gray-800 pt-3 space-y-1">
                <div className="flex justify-between">
                  <span>Log Ref:</span>
                  <span className="font-semibold">{viewingCollection.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{viewingCollection.collectedAt.substring(0, 10)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shift:</span>
                  <span>{viewingCollection.shift}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 dark:border-gray-800 pt-3 space-y-1">
                <div className="flex justify-between">
                  <span>Member Code:</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">{viewingCollection.farmerCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Member Name:</span>
                  <span>{viewingCollection.farmerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Milk Variety:</span>
                  <span>{viewingCollection.milkType}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-300 dark:border-gray-800 pt-3 space-y-1">
                <div className="flex justify-between font-bold text-gray-950 dark:text-white">
                  <span>Net Volume:</span>
                  <span>{viewingCollection.quantity.toFixed(2)} Liters</span>
                </div>
                <div className="flex justify-between">
                  <span>Fat %:</span>
                  <span>{viewingCollection.fat.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>SNF %:</span>
                  <span>{viewingCollection.snf.toFixed(1)}%</span>
                </div>
                {viewingCollection.clr && (
                  <div className="flex justify-between">
                    <span>CLR Reading:</span>
                    <span>{viewingCollection.clr}</span>
                  </div>
                )}
                {viewingCollection.temperature && (
                  <div className="flex justify-between">
                    <span>Temperature:</span>
                    <span>{viewingCollection.temperature}°C</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-gray-300 dark:border-gray-800 pt-3 space-y-1">
                <div className="flex justify-between">
                  <span>Pricing/L:</span>
                  <span>₹{viewingCollection.ratePerLiter.toFixed(2)}</span>
                </div>
                {viewingCollection.manualAdjustment !== 0 && (
                  <div className="flex justify-between">
                    <span>Manual Adj:</span>
                    <span className={viewingCollection.manualAdjustment > 0 ? 'text-emerald-600' : 'text-red-500'}>
                      ₹{viewingCollection.manualAdjustment.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Quality Rank:</span>
                  <span className="font-semibold">Grade {viewingCollection.qualityGrade}</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-800 pt-3 flex justify-between font-bold text-gray-900 dark:text-white text-xs">
                <span>TOTAL PAYOUT:</span>
                <span className="text-sm">₹{viewingCollection.totalAmount.toFixed(2)}</span>
              </div>

              {viewingCollection.remarks && (
                <div className="pt-2 text-[10px] text-gray-400 dark:text-gray-500 italic">
                  Note: {viewingCollection.remarks}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30 flex items-center justify-end gap-2">
              <button 
                onClick={() => setViewingCollection(null)}
                className="px-4 py-2 text-xs font-semibold border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Close Receipt
              </button>
              <button 
                onClick={() => handlePrintSlip(viewingCollection)}
                className="bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
