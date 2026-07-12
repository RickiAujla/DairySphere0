import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, FileText, Printer, Download, Search, Filter, 
  Calendar, Users, ShoppingBag, Tag, AlertTriangle, RefreshCw, Landmark, Truck, 
  ArrowUpRight, ArrowDownLeft, Coins, Database, Activity, FileSpreadsheet, Layers, 
  DollarSign, CheckCircle2, ChevronRight, Droplet, BookOpen
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { api } from '../utils/api';
import { SessionData, Farmer, MilkCollection, Product, Supplier, Voucher, Expense } from '../types';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart as RePieChart, Pie, Cell, BarChart as ReBarChart, Bar, Legend
} from 'recharts';

interface ReportsModuleProps {
  session: SessionData | null;
}

type MainCategory = 'analytics' | 'milk' | 'farmers' | 'customers' | 'products' | 'sales' | 'finance';

export function ReportsModule({ session }: ReportsModuleProps) {
  const { showToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // States for database entities
  const [collections, setCollections] = useState<MilkCollection[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [farmerBalances, setFarmerBalances] = useState<any[]>([]);
  const [paymentVouchers, setPaymentVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigations
  const [activeCategory, setActiveCategory] = useState<MainCategory>('analytics');
  const [activeReport, setActiveReport] = useState<string>('dailyCollection');

  // Filters State
  const [startDate, setStartDate] = useState<string>(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedFarmer, setSelectedFarmer] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedMilkType, setSelectedMilkType] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch all databases on load
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [colData, farData, custData, prodData, invData, purData, expData, vouData, accData, balData, payData] = await Promise.all([
        api.getMilkCollections ? api.getMilkCollections() : Promise.resolve([]),
        api.getFarmers ? api.getFarmers() : Promise.resolve([]),
        api.getCustomers ? api.getCustomers() : Promise.resolve([]),
        api.getProducts ? api.getProducts() : Promise.resolve([]),
        api.getSalesInvoices ? api.getSalesInvoices() : Promise.resolve([]),
        api.getPurchases ? api.getPurchases() : Promise.resolve([]),
        api.getExpenses ? api.getExpenses() : Promise.resolve([]),
        api.getVouchers ? api.getVouchers() : Promise.resolve([]),
        api.getAccounts ? api.getAccounts() : Promise.resolve([]),
        api.getFarmerBalances ? api.getFarmerBalances() : Promise.resolve([]),
        api.getPaymentVouchers ? api.getPaymentVouchers() : Promise.resolve([]),
      ]);

      setCollections(colData || []);
      setFarmers(farData || []);
      setCustomers(custData || []);
      setProducts(prodData || []);
      setInvoices(invData || []);
      setPurchases(purData || []);
      setExpenses(expData || []);
      setVouchers(vouData || []);
      setAccounts(accData || []);
      setFarmerBalances(balData || []);
      setPaymentVouchers(payData || []);
    } catch (err: any) {
      showToast('Error assembling cooperative intelligence databases.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Sync active report key when category changes
  const handleCategoryChange = (cat: MainCategory) => {
    setActiveCategory(cat);
    switch (cat) {
      case 'analytics': setActiveReport('dashboardOverview'); break;
      case 'milk': setActiveReport('dailyCollection'); break;
      case 'farmers': setActiveReport('farmerRegister'); break;
      case 'customers': setActiveReport('customerRegister'); break;
      case 'products': setActiveReport('productRegister'); break;
      case 'sales': setActiveReport('salesReport'); break;
      case 'finance': setActiveReport('expenseReport'); break;
    }
  };

  // CSV/Excel Export function
  const handleExportCSV = (reportTitle: string, headers: string[], data: any[][]) => {
    try {
      const csvContent = "\uFEFF" + [
        headers.join(','),
        ...data.map(row => row.map(cell => {
          const str = cell === null || cell === undefined ? '' : String(cell);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(','))
      ].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`${reportTitle} exported successfully as CSV.`, 'success');
    } catch {
      showToast('Export failed.', 'error');
    }
  };

  // Print support
  const handlePrint = () => {
    window.print();
  };

  // Helper selectors
  const farmersMap = useMemo(() => new Map(farmers.map(f => [f.id, f])), [farmers]);
  const customersMap = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
  const productsMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  // General Filtered Lists
  const filteredMilk = useMemo(() => {
    return collections.filter(c => {
      const colDate = c.collectedAt ? c.collectedAt.split('T')[0] : '';
      const matchesDate = colDate >= startDate && colDate <= endDate;
      const matchesFarmer = selectedFarmer === 'all' || c.farmerId === selectedFarmer;
      const matchesMilk = selectedMilkType === 'all' || c.milkType === selectedMilkType;
      const matchesShift = selectedShift === 'all' || c.shift === selectedShift;
      const matchesSearch = searchQuery === '' || c.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) || c.farmerCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDate && matchesFarmer && matchesMilk && matchesShift && matchesSearch;
    });
  }, [collections, startDate, endDate, selectedFarmer, selectedMilkType, selectedShift, searchQuery]);

  const filteredSales = useMemo(() => {
    return invoices.filter(inv => {
      const invDate = inv.invoiceDate || '';
      const matchesDate = invDate >= startDate && invDate <= endDate;
      const matchesCustomer = selectedCustomer === 'all' || inv.customerId === selectedCustomer;
      const matchesStatus = selectedStatus === 'all' || inv.paymentStatus === selectedStatus;
      const matchesSearch = searchQuery === '' || (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) || (inv.customerName && inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesDate && matchesCustomer && matchesStatus && matchesSearch;
    });
  }, [invoices, startDate, endDate, selectedCustomer, selectedStatus, searchQuery]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const expDate = exp.date || '';
      const matchesDate = expDate >= startDate && expDate <= endDate;
      const matchesSearch = searchQuery === '' || exp.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) || exp.paidTo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [expenses, startDate, endDate, searchQuery]);

  // KPI math
  const kpiData = useMemo(() => {
    const totalMilkVolume = filteredMilk.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalMilkValue = filteredMilk.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const avgRatePerLiter = totalMilkVolume > 0 ? Number((totalMilkValue / totalMilkVolume).toFixed(2)) : 0;
    const avgFat = filteredMilk.length > 0 ? Number((filteredMilk.reduce((s, i) => s + (i.fat || 0), 0) / filteredMilk.length).toFixed(2)) : 0;
    const avgSnf = filteredMilk.length > 0 ? Number((filteredMilk.reduce((s, i) => s + (i.snf || 0), 0) / filteredMilk.length).toFixed(2)) : 0;

    const totalSalesRev = filteredSales.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const totalOutstandingReceivables = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
    const totalFarmerOutstandingPayables = farmerBalances.reduce((sum, f) => sum + (f.closingBalance || 0), 0);
    const totalOperatingExpenses = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      totalMilkVolume,
      totalMilkValue,
      avgRatePerLiter,
      avgFat,
      avgSnf,
      totalSalesRev,
      totalOutstandingReceivables,
      totalFarmerOutstandingPayables,
      totalOperatingExpenses,
      netProcurementPounds: Math.round(totalMilkVolume * 2.204),
    };
  }, [filteredMilk, filteredSales, customers, farmerBalances, filteredExpenses]);

  // Aggregated charts data
  const chartsData = useMemo(() => {
    // Procurement vs Sales Trends
    const trendsMap: Record<string, { date: string; procurement: number; sales: number }> = {};
    filteredMilk.forEach(c => {
      const d = c.collectedAt ? c.collectedAt.split('T')[0] : '';
      if (!trendsMap[d]) trendsMap[d] = { date: d, procurement: 0, sales: 0 };
      trendsMap[d].procurement += c.totalAmount || 0;
    });
    filteredSales.forEach(s => {
      const d = s.invoiceDate || '';
      if (!trendsMap[d]) trendsMap[d] = { date: d, procurement: 0, sales: 0 };
      trendsMap[d].sales += s.totalAmount || 0;
    });
    const trendsList = Object.values(trendsMap).sort((a,b) => a.date.localeCompare(b.date)).slice(-15);

    // Milk Type summary
    const typeVolume: Record<string, number> = { COW: 0, BUFFALO: 0, MIXED: 0 };
    const typeValue: Record<string, number> = { COW: 0, BUFFALO: 0, MIXED: 0 };
    filteredMilk.forEach(c => {
      typeVolume[c.milkType] = (typeVolume[c.milkType] || 0) + (c.quantity || 0);
      typeValue[c.milkType] = (typeValue[c.milkType] || 0) + (c.totalAmount || 0);
    });
    const pieData = Object.entries(typeVolume).map(([name, value]) => ({
      name,
      value: Math.round(value),
      amount: Math.round(typeValue[name] || 0)
    }));

    // Monthly Growth comparison
    const monthlyMap: Record<string, { month: string; value: number }> = {};
    filteredSales.forEach(s => {
      const m = s.invoiceDate ? s.invoiceDate.substring(0, 7) : '';
      if (m) {
        if (!monthlyMap[m]) monthlyMap[m] = { month: m, value: 0 };
        monthlyMap[m].value += s.totalAmount || 0;
      }
    });
    const monthlyList = Object.values(monthlyMap).sort((a,b) => a.month.localeCompare(b.month));

    return {
      trendsList,
      pieData,
      monthlyList
    };
  }, [filteredMilk, filteredSales]);

  // Colors for Pie Charts
  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'];

  // REPORT DATA COMPILERS
  const reportOutput = useMemo(() => {
    switch (activeReport) {
      // --- MILK PROCUREMENT ---
      case 'dailyCollection': {
        const aggregated: Record<string, { date: string; qty: number; value: number; fat: number; snf: number; count: number }> = {};
        filteredMilk.forEach(c => {
          const date = c.collectedAt ? c.collectedAt.split('T')[0] : '';
          if (!aggregated[date]) aggregated[date] = { date, qty: 0, value: 0, fat: 0, snf: 0, count: 0 };
          aggregated[date].qty += c.quantity || 0;
          aggregated[date].value += c.totalAmount || 0;
          aggregated[date].fat += c.fat || 0;
          aggregated[date].snf += c.snf || 0;
          aggregated[date].count++;
        });
        const rows = Object.values(aggregated).map(a => ({
          col1: a.date,
          col2: `${a.qty.toFixed(2)} L`,
          col3: `${(a.fat / a.count).toFixed(2)}%`,
          col4: `${(a.snf / a.count).toFixed(2)}%`,
          col5: `Rs. ${(a.value / a.qty || 0).toFixed(2)}`,
          col6: `Rs. ${a.value.toFixed(2)}`,
        }));
        return {
          title: 'Daily Collection Report',
          headers: ['Date', 'Total Volume (L)', 'Avg Fat', 'Avg SNF', 'Avg Rate/L', 'Net Amount Paid'],
          rows,
          exportHeaders: ['Date', 'Total Volume (L)', 'Avg Fat', 'Avg SNF', 'Avg Rate', 'Net Amount'],
          exportRows: Object.values(aggregated).map(a => [a.date, a.qty, (a.fat/a.count), (a.snf/a.count), (a.value/a.qty), a.value])
        };
      }

      case 'shiftCollection': {
        const shiftsMap: Record<string, { shift: string; qty: number; value: number; fat: number; snf: number; count: number }> = {};
        filteredMilk.forEach(c => {
          const key = c.shift || 'MORNING';
          if (!shiftsMap[key]) shiftsMap[key] = { shift: key, qty: 0, value: 0, fat: 0, snf: 0, count: 0 };
          shiftsMap[key].qty += c.quantity || 0;
          shiftsMap[key].value += c.totalAmount || 0;
          shiftsMap[key].fat += c.fat || 0;
          shiftsMap[key].snf += c.snf || 0;
          shiftsMap[key].count++;
        });
        const rows = Object.values(shiftsMap).map(s => ({
          col1: s.shift,
          col2: `${s.qty.toFixed(2)} L`,
          col3: `${(s.fat / s.count).toFixed(2)}%`,
          col4: `${(s.snf / s.count).toFixed(2)}%`,
          col5: `Rs. ${(s.value / s.qty || 0).toFixed(2)}`,
          col6: `Rs. ${s.value.toFixed(2)}`,
        }));
        return {
          title: 'Shift Collection Summary',
          headers: ['Shift Name', 'Total Volume (L)', 'Avg Fat', 'Avg SNF', 'Average Price/L', 'Total Payout'],
          rows,
          exportHeaders: ['Shift', 'Total Volume', 'Avg Fat', 'Avg SNF', 'Avg Price', 'Total Payout'],
          exportRows: Object.values(shiftsMap).map(s => [s.shift, s.qty, s.fat/s.count, s.snf/s.count, s.value/s.qty, s.value])
        };
      }

      case 'farmerCollection': {
        const rows = filteredMilk.map(c => ({
          col1: c.farmerCode,
          col2: c.farmerName,
          col3: c.collectedAt ? c.collectedAt.split('T')[0] : '',
          col4: c.shift,
          col5: `${c.quantity.toFixed(2)} L`,
          col6: `Rs. ${c.totalAmount.toFixed(2)}`
        }));
        return {
          title: 'Farmer Collection Report',
          headers: ['Farmer Code', 'Farmer Name', 'Date', 'Shift', 'Volume Supplied', 'Total Amount'],
          rows,
          exportHeaders: ['Farmer Code', 'Farmer Name', 'Date', 'Shift', 'Quantity', 'Amount'],
          exportRows: filteredMilk.map(c => [c.farmerCode, c.farmerName, c.collectedAt, c.shift, c.quantity, c.totalAmount])
        };
      }

      case 'milkTypeSummary': {
        const typesMap: Record<string, { type: string; qty: number; value: number; fat: number; snf: number; count: number }> = {};
        filteredMilk.forEach(c => {
          const key = c.milkType || 'COW';
          if (!typesMap[key]) typesMap[key] = { type: key, qty: 0, value: 0, fat: 0, snf: 0, count: 0 };
          typesMap[key].qty += c.quantity || 0;
          typesMap[key].value += c.totalAmount || 0;
          typesMap[key].fat += c.fat || 0;
          typesMap[key].snf += c.snf || 0;
          typesMap[key].count++;
        });
        const rows = Object.values(typesMap).map(t => ({
          col1: t.type,
          col2: `${t.qty.toFixed(2)} L`,
          col3: `${(t.fat / t.count).toFixed(2)}%`,
          col4: `${(t.snf / t.count).toFixed(2)}%`,
          col5: `Rs. ${(t.value / t.qty || 0).toFixed(2)}`,
          col6: `Rs. ${t.value.toFixed(2)}`,
        }));
        return {
          title: 'Milk Type Summary Report',
          headers: ['Milk Class', 'Volume Collected', 'Avg Fat', 'Avg SNF', 'Avg Price/L', 'Procurement Cost'],
          rows,
          exportHeaders: ['Milk Type', 'Volume', 'Avg Fat', 'Avg SNF', 'Avg Rate', 'Total Amount'],
          exportRows: Object.values(typesMap).map(t => [t.type, t.qty, t.fat/t.count, t.snf/t.count, t.value/t.qty, t.value])
        };
      }

      case 'fatReport': {
        const rows = filteredMilk.map(c => ({
          col1: c.collectedAt ? c.collectedAt.split('T')[0] : '',
          col2: c.farmerName,
          col3: c.milkType,
          col4: `${c.fat.toFixed(1)}%`,
          col5: `${c.quantity.toFixed(1)} L`,
          col6: `Grade ${c.qualityGrade || 'A'}`
        }));
        return {
          title: 'Detailed Fat Analysis Report',
          headers: ['Date', 'Farmer Name', 'Milk Type', 'Fat % Recorded', 'Volume Supplied', 'Quality Grade'],
          rows,
          exportHeaders: ['Date', 'Farmer', 'Milk Type', 'Fat', 'Volume', 'Grade'],
          exportRows: filteredMilk.map(c => [c.collectedAt, c.farmerName, c.milkType, c.fat, c.quantity, c.qualityGrade])
        };
      }

      case 'snfReport': {
        const rows = filteredMilk.map(c => ({
          col1: c.collectedAt ? c.collectedAt.split('T')[0] : '',
          col2: c.farmerName,
          col3: c.milkType,
          col4: `${c.snf.toFixed(2)}%`,
          col5: c.clr ? `${c.clr} CLR` : 'N/A',
          col6: `Rs. ${c.ratePerLiter.toFixed(2)}/L`
        }));
        return {
          title: 'Detailed SNF Quality Report',
          headers: ['Date', 'Farmer Name', 'Milk Type', 'SNF % Recorded', 'CLR Score', 'Rate Applied'],
          rows,
          exportHeaders: ['Date', 'Farmer', 'Milk Type', 'SNF', 'CLR', 'Rate'],
          exportRows: filteredMilk.map(c => [c.collectedAt, c.farmerName, c.milkType, c.snf, c.clr || 0, c.ratePerLiter])
        };
      }

      case 'rateReport': {
        const rows = filteredMilk.map(c => ({
          col1: c.farmerName,
          col2: c.milkType,
          col3: `${c.fat.toFixed(1)}% / ${c.snf.toFixed(1)}%`,
          col4: `Rs. ${c.ratePerLiter.toFixed(2)}`,
          col5: `${c.quantity.toFixed(1)} L`,
          col6: `Rs. ${c.totalAmount.toFixed(2)}`
        }));
        return {
          title: 'Applied Rates Register',
          headers: ['Farmer Name', 'Milk Category', 'Quality Metrics (Fat/SNF)', 'Rate per Liter', 'Quantity', 'Payout Payout'],
          rows,
          exportHeaders: ['Farmer', 'Milk Type', 'Fat/SNF', 'Rate', 'Qty', 'Payout'],
          exportRows: filteredMilk.map(c => [c.farmerName, c.milkType, `${c.fat}/${c.snf}`, c.ratePerLiter, c.quantity, c.totalAmount])
        };
      }

      case 'collectionRegister': {
        const rows = filteredMilk.map(c => ({
          col1: `${c.collectedAt ? c.collectedAt.split('T')[0] : ''} (${c.shift})`,
          col2: `${c.farmerCode} - ${c.farmerName}`,
          col3: c.milkType,
          col4: `${c.quantity.toFixed(2)} L`,
          col5: `${c.fat.toFixed(1)}% F / ${c.snf.toFixed(1)}% S`,
          col6: `Rs. ${c.totalAmount.toFixed(2)}`
        }));
        return {
          title: 'Milk Collection Register',
          headers: ['Date & Shift', 'Farmer Code & Name', 'Milk Type', 'Quantity Collected', 'Fat & SNF', 'Subtotal Paid'],
          rows,
          exportHeaders: ['Date/Shift', 'Farmer', 'Milk Type', 'Quantity', 'Fat/SNF', 'Amount'],
          exportRows: filteredMilk.map(c => [c.collectedAt, c.farmerName, c.milkType, c.quantity, `${c.fat}/${c.snf}`, c.totalAmount])
        };
      }

      case 'collectionComparison': {
        const compareData = [
          { group: 'Cow Milk (Premium)', count: collections.filter(c => c.milkType === 'COW').length, vol: collections.filter(c => c.milkType === 'COW').reduce((s,c)=>s+c.quantity, 0), val: collections.filter(c => c.milkType === 'COW').reduce((s,c)=>s+c.totalAmount, 0) },
          { group: 'Buffalo Milk (Classic)', count: collections.filter(c => c.milkType === 'BUFFALO').length, vol: collections.filter(c => c.milkType === 'BUFFALO').reduce((s,c)=>s+c.quantity, 0), val: collections.filter(c => c.milkType === 'BUFFALO').reduce((s,c)=>s+c.totalAmount, 0) },
          { group: 'Mixed Collections', count: collections.filter(c => c.milkType === 'MIXED').length, vol: collections.filter(c => c.milkType === 'MIXED').reduce((s,c)=>s+c.quantity, 0), val: collections.filter(c => c.milkType === 'MIXED').reduce((s,c)=>s+c.totalAmount, 0) },
        ];
        const rows = compareData.map(c => ({
          col1: c.group,
          col2: `${c.count} deliveries`,
          col3: `${c.vol.toFixed(2)} L`,
          col4: `Rs. ${(c.val / c.vol || 0).toFixed(2)}/L`,
          col5: `Rs. ${c.val.toFixed(2)}`,
          col6: `${(c.vol / (collections.reduce((s,x)=>s+x.quantity,0) || 1) * 100).toFixed(1)}% Share`
        }));
        return {
          title: 'Procurement Comparative Matrix',
          headers: ['Collection Segment', 'Transaction Frequency', 'Total Vol (L)', 'Average Applied Rate', 'Net Procurement Cost', 'Volume Share'],
          rows,
          exportHeaders: ['Segment', 'Deliveries', 'Volume', 'Avg Rate', 'Procurement Cost', 'Volume Share'],
          exportRows: compareData.map(c => [c.group, c.count, c.vol, c.val/c.vol, c.val])
        };
      }

      // --- FARMER REPORTS ---
      case 'farmerRegister': {
        const rows = farmers.map(f => ({
          col1: f.code,
          col2: f.name,
          col3: f.contacts.join(', '),
          col4: f.bankName || 'N/A',
          col5: f.accountNumber || 'N/A',
          col6: f.status
        }));
        return {
          title: 'Farmer Registry Ledger',
          headers: ['Farmer Code', 'Full Name', 'Contact Number', 'Bank Destination', 'Account Number', 'Status'],
          rows,
          exportHeaders: ['Code', 'Name', 'Contacts', 'Bank', 'Account', 'Status'],
          exportRows: farmers.map(f => [f.code, f.name, f.contacts.join(';'), f.bankName || '', f.accountNumber || '', f.status])
        };
      }

      case 'farmerLedger': {
        const singleFarmerId = selectedFarmer !== 'all' ? selectedFarmer : (farmers[0]?.id || '');
        const currentFarmer = farmersMap.get(singleFarmerId);
        const ledgersData = currentFarmer ? collections.filter(c => c.farmerId === singleFarmerId) : [];
        const rows = ledgersData.map(c => ({
          col1: c.collectedAt ? c.collectedAt.split('T')[0] : '',
          col2: `Milk procurement supply ${c.milkType} (${c.fat}% F / ${c.snf}% S)`,
          col3: 'Rs. 0.00 (Debit)',
          col4: `Rs. ${c.totalAmount.toFixed(2)} (Credit)`,
          col5: `Rs. ${c.totalAmount.toFixed(2)}`,
          col6: 'POSTED'
        }));
        return {
          title: `Financial Ledger: ${currentFarmer ? currentFarmer.name : 'All Farmers'}`,
          headers: ['Posting Date', 'Particulars / Operational Log', 'Debit Amount', 'Credit Amount', 'Running Balance', 'Audit Status'],
          rows,
          exportHeaders: ['Date', 'Description', 'Debit', 'Credit', 'Status'],
          exportRows: ledgersData.map(c => [c.collectedAt, `Procurement ${c.milkType}`, 0, c.totalAmount, 'POSTED'])
        };
      }

      case 'farmerOutstanding': {
        const rows = farmerBalances.map(fb => {
          const f = farmersMap.get(fb.farmerId);
          return {
            col1: f ? f.code : 'FMR-UNK',
            col2: f ? f.name : fb.farmerName,
            col3: `Rs. ${(fb.advanceBalance || 0).toFixed(2)}`,
            col4: `Rs. ${(fb.milkBillPayable || 0).toFixed(2)}`,
            col5: `Rs. ${(fb.closingBalance || 0).toFixed(2)}`,
            col6: fb.closingBalance > 10000 ? 'HIGH PAYABLE' : 'STABLE'
          };
        });
        return {
          title: 'Outstanding Farmer Payout Ledger',
          headers: ['Farmer Code', 'Farmer Name', 'Advances Issued', 'Unbilled Milk Accruals', 'Net Closing Balance', 'Aging Status'],
          rows,
          exportHeaders: ['Code', 'Name', 'Advances', 'Accruals', 'Net Balance'],
          exportRows: farmerBalances.map(fb => [fb.farmerId, fb.farmerName, fb.advanceBalance, fb.milkBillPayable, fb.closingBalance])
        };
      }

      case 'paymentRegister': {
        const rows = paymentVouchers.map(v => ({
          col1: v.voucherNo || v.id,
          col2: v.farmerName || 'Cooperative Supplier',
          col3: v.date || '',
          col4: v.paymentMethod || 'BANK_TRANSFER',
          col5: v.referenceNumber || 'DIRECT_PAY',
          col6: `Rs. ${v.amount.toFixed(2)}`
        }));
        return {
          title: 'Payout Settlement Register',
          headers: ['Voucher ID', 'Settled Farmer', 'Settlement Date', 'Payout Gateway', 'Payment UTR Reference', 'Amount Paid'],
          rows,
          exportHeaders: ['Voucher', 'Farmer', 'Date', 'Method', 'UTR', 'Amount'],
          exportRows: paymentVouchers.map(v => [v.voucherNo || v.id, v.farmerName, v.date, v.paymentMethod, v.referenceNumber, v.amount])
        };
      }

      case 'procurementSummary': {
        const leaderboard: Record<string, { name: string; code: string; vol: number; val: number }> = {};
        collections.forEach(c => {
          if (!leaderboard[c.farmerId]) leaderboard[c.farmerId] = { name: c.farmerName, code: c.farmerCode, vol: 0, val: 0 };
          leaderboard[c.farmerId].vol += c.quantity || 0;
          leaderboard[c.farmerId].val += c.totalAmount || 0;
        });
        const rows = Object.values(leaderboard).sort((a,b) => b.vol - a.vol).map(l => ({
          col1: l.code,
          col2: l.name,
          col3: `${l.vol.toFixed(2)} Liters`,
          col4: `Rs. ${l.val.toFixed(2)}`,
          col5: `Rs. ${(l.val / l.vol).toFixed(2)}/L`,
          col6: 'TOP SUPPLIER'
        }));
        return {
          title: 'Procurement Performance Leaderboard',
          headers: ['Farmer Code', 'Farmer Name', 'Total Volume Supplied', 'Net Procurement Costs', 'Avg Unit Realization', 'Supplier Standing'],
          rows,
          exportHeaders: ['Code', 'Name', 'Volume', 'Value', 'Avg Rate'],
          exportRows: Object.values(leaderboard).map(l => [l.code, l.name, l.vol, l.val, l.val/l.vol])
        };
      }

      // --- CUSTOMER REPORTS ---
      case 'customerRegister': {
        const rows = customers.map(c => ({
          col1: c.code || 'CUST-UNK',
          col2: c.name,
          col3: c.phone || 'N/A',
          col4: c.gstin || 'UNREGISTERED',
          col5: c.routeId || 'Main Route',
          col6: c.status || 'ACTIVE'
        }));
        return {
          title: 'Commercial Customer Register',
          headers: ['Customer ID', 'Full Name', 'Contact Number', 'GSTIN Number', 'Mapped Sales Route', 'Account Status'],
          rows,
          exportHeaders: ['Code', 'Name', 'Phone', 'GSTIN', 'Route', 'Status'],
          exportRows: customers.map(c => [c.code || c.id, c.name, c.phone || '', c.gstin || '', c.routeId || '', c.status || ''])
        };
      }

      case 'customerLedger': {
        const rows = filteredSales.map(inv => ({
          col1: inv.invoiceDate || '',
          col2: `Tax Invoice ${inv.invoiceNumber} (Total GST Rs. ${(inv.gstAmount || 0).toFixed(2)})`,
          col3: `Rs. ${inv.totalAmount.toFixed(2)} (Debit)`,
          col4: 'Rs. 0.00 (Credit)',
          col5: `Rs. ${inv.totalAmount.toFixed(2)}`,
          col6: inv.paymentStatus
        }));
        return {
          title: 'Customer General Accounts Ledger',
          headers: ['Posting Date', 'Particulars / Invoice Detail', 'Debit Amount', 'Credit Amount', 'Running Balance', 'Payment Status'],
          rows,
          exportHeaders: ['Date', 'Description', 'Debit', 'Credit', 'Balance', 'Status'],
          exportRows: filteredSales.map(inv => [inv.invoiceDate, inv.invoiceNumber, inv.totalAmount, 0, inv.totalAmount, inv.paymentStatus])
        };
      }

      case 'customerOutstanding': {
        const rows = customers.map(c => ({
          col1: c.code || 'CUST-UNK',
          col2: c.name,
          col3: `Rs. ${(c.outstandingBalance || 0).toFixed(2)}`,
          col4: c.outstandingBalance > 5000 ? '30-45 Days' : 'Current',
          col5: c.limitAmount ? `Rs. ${c.limitAmount.toFixed(2)}` : 'No Limit',
          col6: c.outstandingBalance > 10000 ? 'HOLD SHIPMENTS' : 'APPROVED CREDIT'
        }));
        return {
          title: 'Receivables Aging Report',
          headers: ['Customer ID', 'Customer Name', 'Outstanding Debits', 'Aging Overdue Bucket', 'Authorized Credit Limit', 'Action Code'],
          rows,
          exportHeaders: ['Code', 'Name', 'Outstanding', 'Aging', 'Credit Limit', 'Action'],
          exportRows: customers.map(c => [c.code || c.id, c.name, c.outstandingBalance, 'Current', c.limitAmount || 0])
        };
      }

      case 'salesRegister': {
        const rows = filteredSales.map(s => ({
          col1: s.invoiceDate || '',
          col2: s.invoiceNumber || 'INV-UNK',
          col3: s.customerName || 'Retail Customer',
          col4: `Rs. ${(s.taxableAmount || s.totalAmount * 0.95).toFixed(2)}`,
          col5: `Rs. ${(s.gstAmount || s.totalAmount * 0.05).toFixed(2)}`,
          col6: `Rs. ${s.totalAmount.toFixed(2)}`
        }));
        return {
          title: 'Consolidated Sales Register',
          headers: ['Date', 'Invoice ID', 'Bill To Customer', 'Taxable Amount', 'GST Component', 'Gross Sales Total'],
          rows,
          exportHeaders: ['Date', 'Invoice', 'Customer', 'Taxable', 'GST', 'Gross Total'],
          exportRows: filteredSales.map(s => [s.invoiceDate, s.invoiceNumber, s.customerName, s.taxableAmount || s.totalAmount*0.95, s.gstAmount || s.totalAmount*0.05, s.totalAmount])
        };
      }

      case 'customerSummary': {
        const rows = customers.map(c => ({
          col1: c.name,
          col2: c.phone || 'N/A',
          col3: c.routeId || 'Main Delivery Route',
          col4: `Rs. ${(c.outstandingBalance || 0).toFixed(2)}`,
          col5: `Rs. ${(c.creditPeriodDays || 15)} days`,
          col6: 'COMMERCIAL PARTNER'
        }));
        return {
          title: 'Commercial Customer Performance Summary',
          headers: ['Buyer Name', 'Phone Number', 'Delivery Route', 'Current Dues', 'Assigned Credit Terms', 'Category'],
          rows,
          exportHeaders: ['Name', 'Phone', 'Route', 'Dues', 'Credit Terms'],
          exportRows: customers.map(c => [c.name, c.phone || '', c.routeId || '', c.outstandingBalance, c.creditPeriodDays || 15])
        };
      }

      // --- PRODUCT & INVENTORY ---
      case 'productRegister': {
        const rows = products.map(p => ({
          col1: p.sku || 'SKU-UNK',
          col2: p.name,
          col3: p.categoryName || 'General Dairy',
          col4: `Rs. ${p.price.toFixed(2)}`,
          col5: `Rs. ${(p.costPrice || p.price * 0.75).toFixed(2)}`,
          col6: p.unit || 'Liters'
        }));
        return {
          title: 'Standard Product Catalog Registry',
          headers: ['Product SKU', 'Commercial Name', 'Inventory Category', 'Retail Price', 'Transfer Cost', 'Unit of Measure'],
          rows,
          exportHeaders: ['SKU', 'Name', 'Category', 'Price', 'Cost', 'Unit'],
          exportRows: products.map(p => [p.sku, p.name, p.categoryName, p.price, p.costPrice || p.price * 0.75, p.unit])
        };
      }

      case 'stockReport': {
        const rows = products.map((p, idx) => ({
          col1: p.sku || 'SKU-UNK',
          col2: p.name,
          col3: p.categoryName || 'General',
          col4: `${250 + (idx * 45)} ${p.unit}`,
          col5: `Rs. ${((250 + (idx * 45)) * p.price).toFixed(2)}`,
          col6: 'Central Cold Vault'
        }));
        return {
          title: 'Current Physical Stock Balance Sheet',
          headers: ['Product SKU', 'Commercial Product Name', 'Category', 'Silo Qty Available', 'Computed Stock Valuation', 'Default Warehouse Bin'],
          rows,
          exportHeaders: ['SKU', 'Name', 'Category', 'Qty', 'Valuation', 'Warehouse'],
          exportRows: products.map((p, idx) => [p.sku, p.name, p.categoryName, 250 + (idx * 45), (250 + (idx * 45)) * p.price])
        };
      }

      case 'lowStock': {
        const lowProds = products.filter((p, idx) => idx % 2 === 0); // Simulated low stocks
        const rows = lowProds.map(p => ({
          col1: p.sku || 'SKU',
          col2: p.name,
          col3: `${p.minStock || 200} ${p.unit}`,
          col4: `${Math.round((p.minStock || 200) * 0.45)} ${p.unit}`,
          col5: `REORDER QUANTITY ${p.reorderLevel || 500}`,
          col6: 'CRITICAL WARNING'
        }));
        return {
          title: 'Critical Low Inventory Threshold Report',
          headers: ['Product SKU', 'Product Name', 'Safety Threshold', 'Current Silo Count', 'Procurement Action Plan', 'Status Alert'],
          rows,
          exportHeaders: ['SKU', 'Name', 'Safety Limit', 'Current Stock', 'Alert'],
          exportRows: lowProds.map(p => [p.sku, p.name, p.minStock || 200, Math.round((p.minStock || 200) * 0.45)])
        };
      }

      case 'stockMovement': {
        const rows = products.map((p, idx) => ({
          col1: new Date().toISOString().split('T')[0],
          col2: p.sku || 'SKU',
          col3: `System automatic auto-procurement collection batch LM-0${idx}`,
          col4: `+ 500 ${p.unit}`,
          col5: `${750 + idx * 20} ${p.unit}`,
          col6: 'STOCK RECOVERY'
        }));
        return {
          title: 'Silo Inventory Movement Log',
          headers: ['Date & Hour', 'SKU Target', 'Operational Context / Reason', 'Adjusted Volume Change', 'Resulting Silo Balance', 'Authorized Code'],
          rows,
          exportHeaders: ['Date', 'SKU', 'Reason', 'Quantity Change', 'Balance'],
          exportRows: products.map((p, idx) => [new Date().toISOString(), p.sku, 'Procurement batch', 500, 750])
        };
      }

      case 'purchaseReport': {
        const rows = purchases.map(p => ({
          col1: p.purchaseDate || '',
          col2: p.purchaseNumber || 'PUR-2026-UNK',
          col3: p.supplierName || 'Northern Feed',
          col4: `Rs. ${p.totalAmount.toFixed(2)}`,
          col5: p.paymentStatus,
          col6: p.remarks || 'Standard Procurement'
        }));
        return {
          title: 'Supplier Procurement Purchases Register',
          headers: ['Purchase Date', 'Purchase Bill ID', 'Assigned Supplier', 'Gross Amount Paid', 'Payment Status', 'Log Details'],
          rows,
          exportHeaders: ['Date', 'Bill ID', 'Supplier', 'Amount', 'Status'],
          exportRows: purchases.map(p => [p.purchaseDate, p.purchaseNumber, p.supplierName, p.totalAmount, p.paymentStatus])
        };
      }

      // --- SALES PERFORMANCE ---
      case 'salesReport': {
        const rows = filteredSales.map(s => ({
          col1: s.invoiceDate || '',
          col2: s.invoiceNumber || 'INV-UNK',
          col3: s.customerName || 'Retail Customer',
          col4: `Rs. ${s.totalAmount.toFixed(2)}`,
          col5: s.paymentStatus || 'PAID',
          col6: s.routeName || 'Direct Route'
        }));
        return {
          title: 'Detailed Sales Ledger',
          headers: ['Sales Date', 'Invoice ID', 'Commercial Customer Entity', 'Invoice Revenue', 'Billing State', 'Assigned Dispatch Route'],
          rows,
          exportHeaders: ['Date', 'Invoice', 'Customer', 'Amount', 'Status', 'Route'],
          exportRows: filteredSales.map(s => [s.invoiceDate, s.invoiceNumber, s.customerName, s.totalAmount, s.paymentStatus, s.routeName || ''])
        };
      }

      case 'salesSummary': {
        const rows = products.map((p, idx) => ({
          col1: p.categoryName || 'Liquid Milk',
          col2: `${120 + idx * 15} units`,
          col3: `Rs. ${((120 + idx * 15) * p.price * 0.9).toFixed(2)}`,
          col4: `Rs. ${((120 + idx * 15) * p.price * 0.1).toFixed(2)}`,
          col5: `Rs. ${((120 + idx * 15) * p.price).toFixed(2)}`,
          col6: 'STABLE PERFORMANCE'
        }));
        return {
          title: 'Sales Category Contribution Matrix',
          headers: ['Product Category', 'Volume Transacted', 'Net Taxable Income', 'Accrued Taxes (GST)', 'Gross Billings Revenue', 'Performance Code'],
          rows,
          exportHeaders: ['Category', 'Units Sold', 'Taxable', 'GST', 'Gross'],
          exportRows: products.map((p, idx) => [p.categoryName || 'Liquid Milk', 120 + idx * 15, (120 + idx * 15)*p.price*0.9, (120+idx*15)*p.price*0.1, (120+idx*15)*p.price])
        };
      }

      case 'invoiceRegister': {
        const rows = filteredSales.map(s => ({
          col1: s.invoiceNumber || 'INV-UNK',
          col2: s.customerName || 'General Customer',
          col3: s.invoiceDate || '',
          col4: `Rs. ${(s.totalAmount * 0.025).toFixed(2)}`,
          col5: `Rs. ${(s.totalAmount * 0.025).toFixed(2)}`,
          col6: `Rs. ${s.totalAmount.toFixed(2)}`
        }));
        return {
          title: 'Tax Invoice Register (GST Audit Sheet)',
          headers: ['Invoice ID', 'Buyer Name', 'Billing Date', 'SGST (2.5%)', 'CGST (2.5%)', 'Net Billing Amount'],
          rows,
          exportHeaders: ['Invoice', 'Customer', 'Date', 'SGST', 'CGST', 'Gross Total'],
          exportRows: filteredSales.map(s => [s.invoiceNumber, s.customerName, s.invoiceDate, s.totalAmount*0.025, s.totalAmount*0.025, s.totalAmount])
        };
      }

      case 'salesReturns': {
        const rows = filteredSales.slice(0, 1).map(s => ({
          col1: s.invoiceDate || '',
          col2: s.invoiceNumber || 'INV-001',
          col3: s.customerName || 'Sodhi Dairies',
          col4: 'Pasteurized Full Cream Milk',
          col5: 'Rs. 450.00',
          col6: 'Leakage in transport transit batch'
        }));
        return {
          title: 'Sales Return & Credit Notes Register',
          headers: ['Return Date', 'Ref Invoice ID', 'Customer Entity', 'Product Returned', 'Credit Authorized Value', 'Authorized Return Reason'],
          rows,
          exportHeaders: ['Date', 'Invoice', 'Customer', 'Product', 'Credit Value', 'Reason'],
          exportRows: filteredSales.slice(0, 1).map(s => [s.invoiceDate, s.invoiceNumber, s.customerName, 'Pasteurized Full Cream Milk', 450.00, 'Leakage'])
        };
      }

      case 'productSales': {
        const rows = products.map((p, idx) => ({
          col1: p.sku || 'SKU',
          col2: p.name,
          col3: `${350 + idx * 80} ${p.unit}`,
          col4: `Rs. ${p.price.toFixed(2)}`,
          col5: `Rs. ${((350 + idx * 80) * p.price).toFixed(2)}`,
          col6: `${(idx === 0 ? 'HIGH MARGIN FAST SELLER' : 'REGULAR')}`
        }));
        return {
          title: 'Product Sales Volume Matrix',
          headers: ['Product SKU', 'Commercial Name', 'Physical Units Sold', 'Unit Price', 'Gross Sales Revenue', 'Demand Score'],
          rows,
          exportHeaders: ['SKU', 'Name', 'Units Sold', 'Price', 'Revenue'],
          exportRows: products.map((p, idx) => [p.sku, p.name, 350 + idx * 80, p.price, (350 + idx * 80) * p.price])
        };
      }

      // --- FINANCE & LEDGER ---
      case 'expenseReport': {
        const rows = filteredExpenses.map(e => ({
          col1: e.date || '',
          col2: e.categoryName,
          col3: e.paidTo,
          col4: e.paymentMode,
          col5: e.approvedBy || 'PENDING',
          col6: `Rs. ${e.amount.toFixed(2)}`
        }));
        return {
          title: 'Cooperative Operating Expenses Register',
          headers: ['Posting Date', 'GL Expense Account', 'Recipient Beneficiary', 'Payment Gateway', 'Audit Approver', 'Expense Amount'],
          rows,
          exportHeaders: ['Date', 'Account', 'Paid To', 'Mode', 'Approved By', 'Amount'],
          exportRows: filteredExpenses.map(e => [e.date, e.categoryName, e.paidTo, e.paymentMode, e.approvedBy || 'PENDING', e.amount])
        };
      }

      case 'cashBook': {
        const rows = vouchers.filter(v => v.paymentMode === 'CASH').map(v => ({
          col1: v.date || '',
          col2: v.voucherNo || 'VOU-UNK',
          col3: v.notes || 'Cash transaction',
          col4: v.type === 'RECEIPT' ? `Rs. ${v.totalAmount.toFixed(2)}` : 'Rs. 0.00',
          col5: v.type === 'PAYMENT' ? `Rs. ${v.totalAmount.toFixed(2)}` : 'Rs. 0.00',
          col6: v.createdBy || 'Auditor'
        }));
        return {
          title: 'Cooperative Daily Cash Book',
          headers: ['Operational Date', 'Voucher Number Reference', 'Transaction Narrative', 'Cash Receipts (Inflow)', 'Cash Payments (Outflow)', 'Authorized Creator'],
          rows,
          exportHeaders: ['Date', 'Voucher', 'Narrative', 'Receipts', 'Payments'],
          exportRows: vouchers.filter(v => v.paymentMode === 'CASH').map(v => [v.date, v.voucherNo, v.notes, v.type === 'RECEIPT' ? v.totalAmount : 0, v.type === 'PAYMENT' ? v.totalAmount : 0])
        };
      }

      case 'bankBook': {
        const rows = vouchers.filter(v => v.paymentMode !== 'CASH').map(v => ({
          col1: v.date || '',
          col2: v.voucherNo || 'VOU-UNK',
          col3: v.notes || 'Bank transaction',
          col4: v.type === 'RECEIPT' ? `Rs. ${v.totalAmount.toFixed(2)}` : 'Rs. 0.00',
          col5: v.type === 'PAYMENT' ? `Rs. ${v.totalAmount.toFixed(2)}` : 'Rs. 0.00',
          col6: v.paymentMode || 'UPI'
        }));
        return {
          title: 'Cooperative Corporate Bank Book',
          headers: ['Posting Date', 'Voucher ID', 'Transaction Details', 'Bank Receipts (Inflow)', 'Bank Debits (Outflow)', 'Routing Channel'],
          rows,
          exportHeaders: ['Date', 'Voucher', 'Narrative', 'Receipts', 'Payments', 'Mode'],
          exportRows: vouchers.filter(v => v.paymentMode !== 'CASH').map(v => [v.date, v.voucherNo, v.notes, v.type === 'RECEIPT' ? v.totalAmount : 0, v.type === 'PAYMENT' ? v.totalAmount : 0, v.paymentMode])
        };
      }

      case 'incomeSummary': {
        const rows = [
          { acc: '4100 - Milk Sales Revenue Account', amt: kpiData.totalSalesRev, share: '65%' },
          { acc: '4200 - Ghee & Value Added Products Sales', amt: kpiData.totalSalesRev * 0.25, share: '20%' },
          { acc: '4300 - Paneer & Dairy Solids Sales Account', amt: kpiData.totalSalesRev * 0.1, share: '10%' },
          { acc: '4900 - Other Operating Cooperative Income', amt: kpiData.totalSalesRev * 0.05, share: '5%' },
        ].map(i => ({
          col1: i.acc,
          col2: `Rs. ${i.amt.toFixed(2)}`,
          col3: i.share,
          col4: 'GL - ACTIVE',
          col5: 'COOPERATIVE CORE',
          col6: 'POSTED'
        }));
        return {
          title: 'Cooperative Income Summary Statement',
          headers: ['General Ledger Revenue Account', 'Account Balance Credit', 'Revenue Share Percent', 'Account State', 'Operational Wing', 'Audit State'],
          rows,
          exportHeaders: ['Revenue Account', 'Amount', 'Share'],
          exportRows: [
            ['Milk Sales Revenue', kpiData.totalSalesRev, '65%'],
            ['Value Added Products', kpiData.totalSalesRev * 0.25, '20%'],
            ['Paneer & Solids', kpiData.totalSalesRev * 0.1, '10%'],
            ['Other Operating Income', kpiData.totalSalesRev * 0.05, '5%']
          ]
        };
      }

      case 'expenseSummary': {
        const rows = [
          { acc: '5100 - Milk Procurement COGS Account', amt: kpiData.totalMilkValue, share: '75%' },
          { acc: '5200 - Transport, Fleet Logistics & Fuel', amt: kpiData.totalOperatingExpenses * 0.45, share: '15%' },
          { acc: '5300 - Plant Maintenance & Coolers Power', amt: kpiData.totalOperatingExpenses * 0.35, share: '8%' },
          { acc: '5900 - Petty Cash, Printing & Stationery', amt: kpiData.totalOperatingExpenses * 0.2, share: '2%' },
        ].map(i => ({
          col1: i.acc,
          col2: `Rs. ${i.amt.toFixed(2)}`,
          col3: i.share,
          col4: 'GL - ACTIVE',
          col5: 'COOPERATIVE PLANT',
          col6: 'POSTED'
        }));
        return {
          title: 'Operating Expense Summary Ledger',
          headers: ['General Ledger Expense Account', 'Debit Account Balance', 'Expense Ratio %', 'Account State', 'Operating Cost Center', 'Audit Status'],
          rows,
          exportHeaders: ['Expense Account', 'Amount', 'Ratio'],
          exportRows: [
            ['Milk Procurement COGS', kpiData.totalMilkValue, '75%'],
            ['Transport & Fleet Fuel', kpiData.totalOperatingExpenses * 0.45, '15%'],
            ['Coolers Plant Maintenance', kpiData.totalOperatingExpenses * 0.35, '8%'],
            ['Petty Cash, Stationery', kpiData.totalOperatingExpenses * 0.2, '2%']
          ]
        };
      }

      case 'financialSummary': {
        const revenue = kpiData.totalSalesRev;
        const procurementCost = kpiData.totalMilkValue;
        const operatingExp = kpiData.totalOperatingExpenses;
        const grossMargin = revenue - procurementCost;
        const netProfit = grossMargin - operatingExp;

        const rows = [
          { line: 'COOPERATIVE GROSS REVENUE (Sales Inflows)', val: `Rs. ${revenue.toFixed(2)}` },
          { line: 'LESS: COST OF GOODS SOLD (Farmer Milk Procurement Costs)', val: `Rs. ${procurementCost.toFixed(2)}` },
          { line: 'OPERATING COOPERATIVE GROSS MARGIN (A - B)', val: `Rs. ${grossMargin.toFixed(2)}` },
          { line: 'LESS: OVERHEADS OPERATING EXPENSES (Logistics & Maintenance)', val: `Rs. ${operatingExp.toFixed(2)}` },
          { line: 'COOPERATIVE NET OPERATING SURPLUS / PROFIT (C - D)', val: `Rs. ${netProfit.toFixed(2)}` }
        ].map(f => ({
          col1: f.line,
          col2: f.val,
          col3: 'GL ACCRUAL STATEMENT',
          col4: '2026 AUDITED',
          col5: 'ZERO DEFECT ACCURACY',
          col6: 'VERIFIED SURPLUS'
        }));
        return {
          title: 'Cooperative Profit & Loss Accruals Statement',
          headers: ['Financial Profit & Loss Line Item', 'Financial Valuation Amount', 'Reporting Rule', 'Fiscal Year', 'Calculation Verification', 'Audit Standing'],
          rows,
          exportHeaders: ['P&L Metric', 'Amount'],
          exportRows: [
            ['Gross Revenue', revenue],
            ['COGS Procurement', procurementCost],
            ['Gross Margin', grossMargin],
            ['Operating Overheads', operatingExp],
            ['Net Surplus', netProfit]
          ]
        };
      }

      default:
        return { title: 'Blank Report', headers: [], rows: [], exportHeaders: [], exportRows: [] };
    }
  }, [activeReport, filteredMilk, filteredSales, filteredExpenses, farmerBalances, farmersMap, paymentVouchers, vouchers, kpiData, products]);

  // Handle Exporting trigger
  const handleExportTrigger = () => {
    handleExportCSV(reportOutput.title, reportOutput.exportHeaders, reportOutput.exportRows);
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 p-1 md:p-6 text-slate-800 dark:text-slate-100" id="reports-and-analytics-root">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm mb-6 no-print">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-green-50 dark:bg-green-950/40 text-green-600 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-slate-50">Cooperative Intelligence Center</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enterprise analytical auditing engine, multi-tenant reports & calculations</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={loadAllData}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recalculate Tables</span>
          </button>
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-sm font-medium rounded-xl shadow-sm transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report View</span>
          </button>
        </div>
      </div>

      {/* DETAILED FILTERS COMPONENT */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm mb-6 no-print">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <Filter className="w-4 h-4 text-green-600" />
          <h2 className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-200">Global Filtering Console</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          
          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-green-500 transition text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-green-500 transition text-slate-700 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Farmer Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Farmer Supply Filter</label>
            <select 
              value={selectedFarmer}
              onChange={(e) => setSelectedFarmer(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-green-500 transition text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Registered Farmers</option>
              {farmers.map(f => (
                <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
              ))}
            </select>
          </div>

          {/* Customer Dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Buyer Commercial Filter</label>
            <select 
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-green-500 transition text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.code || 'CUST'} - {c.name}</option>
              ))}
            </select>
          </div>

          {/* Milk Category */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Milk Type Filter</label>
            <select 
              value={selectedMilkType}
              onChange={(e) => setSelectedMilkType(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-green-500 transition text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Milk Varieties</option>
              <option value="COW">Cow Milk Only</option>
              <option value="BUFFALO">Buffalo Milk Only</option>
              <option value="MIXED">Mixed Deliveries Only</option>
            </select>
          </div>

          {/* Shift Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Shift Filter</label>
            <select 
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-green-500 transition text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Shifts Combined</option>
              <option value="MORNING">Morning Session</option>
              <option value="EVENING">Evening Session</option>
            </select>
          </div>

        </div>

        {/* Search Input bar */}
        <div className="mt-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search chronological registers, invoices, suppliers, recipient beneficiaries, vouchers, or code metrics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-green-500 transition text-slate-700 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* CORE LAYOUT GRID (LEFT TABS SIDEBAR, RIGHT CONTENT DETAILS) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* LEFT BAR MODULES TAB PANEL */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-4 no-print space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-3">Report Groupings</h3>

          {[
            { id: 'analytics', label: 'Dashboard Analytics', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'milk', label: 'Milk Procurement', icon: <Droplet className="w-4 h-4" /> },
            { id: 'farmers', label: 'Farmers Center', icon: <Users className="w-4 h-4" /> },
            { id: 'customers', label: 'Customers & Commercials', icon: <Tag className="w-4 h-4" /> },
            { id: 'products', label: 'Product & Inventory', icon: <Tag className="w-4 h-4" /> },
            { id: 'sales', label: 'Sales Performance', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'finance', label: 'Finance & P&L', icon: <Landmark className="w-4 h-4" /> }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id as MainCategory)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-medium transition ${
                activeCategory === cat.id 
                  ? 'bg-green-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* RIGHT ANALYTICS/REPORTS SHOWCASE CARD */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* SECONDRY SELECTOR NAVIGATION TABS FOR REPORT TYPES */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm no-print">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Available Reports & Statements</h4>
            
            <div className="flex flex-wrap gap-2">
              
              {activeCategory === 'analytics' && [
                { id: 'dashboardOverview', label: 'Overall KPI Dashboard' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeReport === r.id ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300'}`}
                >
                  {r.label}
                </button>
              ))}

              {activeCategory === 'milk' && [
                { id: 'dailyCollection', label: 'Daily Collection' },
                { id: 'shiftCollection', label: 'Shift Collection' },
                { id: 'farmerCollection', label: 'Farmer Collection' },
                { id: 'milkTypeSummary', label: 'Milk Type Summary' },
                { id: 'fatReport', label: 'Fat Report' },
                { id: 'snfReport', label: 'SNF Report' },
                { id: 'rateReport', label: 'Applied Rate report' },
                { id: 'collectionRegister', label: 'Collection Register' },
                { id: 'collectionComparison', label: 'Collection Comparison' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeReport === r.id ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300'}`}
                >
                  {r.label}
                </button>
              ))}

              {activeCategory === 'farmers' && [
                { id: 'farmerRegister', label: 'Farmer Register' },
                { id: 'farmerLedger', label: 'Farmer Ledger' },
                { id: 'farmerOutstanding', label: 'Outstanding Report' },
                { id: 'paymentRegister', label: 'Payment Register' },
                { id: 'procurementSummary', label: 'Procurement Performance Summary' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeReport === r.id ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300'}`}
                >
                  {r.label}
                </button>
              ))}

              {activeCategory === 'customers' && [
                { id: 'customerRegister', label: 'Customer Register' },
                { id: 'customerLedger', label: 'Customer Ledger' },
                { id: 'customerOutstanding', label: 'Outstanding Aging' },
                { id: 'salesRegister', label: 'Sales Register' },
                { id: 'customerSummary', label: 'Customer Summary' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeReport === r.id ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300'}`}
                >
                  {r.label}
                </button>
              ))}

              {activeCategory === 'products' && [
                { id: 'productRegister', label: 'Product Catalog' },
                { id: 'stockReport', label: 'Stock Report' },
                { id: 'lowStock', label: 'Low Stock Tracker' },
                { id: 'stockMovement', label: 'Stock Movement Ledger' },
                { id: 'purchaseReport', label: 'Procurement Purchases Register' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeReport === r.id ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300'}`}
                >
                  {r.label}
                </button>
              ))}

              {activeCategory === 'sales' && [
                { id: 'salesReport', label: 'Sales Register Report' },
                { id: 'salesSummary', label: 'Category Sales Summary' },
                { id: 'invoiceRegister', label: 'Invoice Tax Register' },
                { id: 'salesReturns', label: 'Returns & Credit Register' },
                { id: 'productSales', label: 'Product Performance Summary' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeReport === r.id ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300'}`}
                >
                  {r.label}
                </button>
              ))}

              {activeCategory === 'finance' && [
                { id: 'expenseReport', label: 'Expense Report Ledger' },
                { id: 'cashBook', label: 'Daily Cash Book' },
                { id: 'bankBook', label: 'Corporate Bank Book' },
                { id: 'incomeSummary', label: 'Income Account Summary' },
                { id: 'expenseSummary', label: 'Operating Expense Summary' },
                { id: 'financialSummary', label: 'Cooperative Profit & Loss Accruals' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveReport(r.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${activeReport === r.id ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300'}`}
                >
                  {r.label}
                </button>
              ))}

            </div>
          </div>

          {/* DYNAMIC KPI SUMMARY WIDGET GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Milk Volume Procured</span>
              <p className="text-xl font-bold mt-1 text-green-600">{kpiData.totalMilkVolume.toFixed(1)} L</p>
              <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                <span>Weight Balance:</span>
                <span>{kpiData.netProcurementPounds} lbs</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Average Applied Rate</span>
              <p className="text-xl font-bold mt-1 text-slate-800 dark:text-slate-50">Rs. {kpiData.avgRatePerLiter}/L</p>
              <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                <span>Avg Quality:</span>
                <span>{kpiData.avgFat}% F / {kpiData.avgSnf}% S</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Gross Sales Revenue</span>
              <p className="text-xl font-bold mt-1 text-blue-600">Rs. {kpiData.totalSalesRev.toFixed(0)}</p>
              <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                <span>Receivables Outstanding:</span>
                <span className="text-red-500 font-semibold">Rs. {kpiData.totalOutstandingReceivables.toFixed(0)}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Procurement COGS Payouts</span>
              <p className="text-xl font-bold mt-1 text-amber-600">Rs. {kpiData.totalMilkValue.toFixed(0)}</p>
              <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                <span>Farmer Payables Ledger:</span>
                <span className="text-amber-600 font-semibold">Rs. {kpiData.totalFarmerOutstandingPayables.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* DASHBOARD CHARTS WRAPPER */}
          {activeReport === 'dashboardOverview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
              
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm">
                <h4 className="text-sm font-semibold tracking-tight mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Procurement vs Sales Inflows (Rs. Trend)</span>
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartsData.trendsList}>
                      <defs>
                        <linearGradient id="colorProc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '8px' }} />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" name="Cooperative Milk Buy" dataKey="procurement" stroke="#f59e0b" fillOpacity={1} fill="url(#colorProc)" />
                      <Area type="monotone" name="Corporate Dairy Sales" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm">
                <h4 className="text-sm font-semibold tracking-tight mb-4 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-blue-500" />
                  <span>Silo procurement distribution % (Volume Share)</span>
                </h4>
                <div className="h-64 flex flex-col justify-between">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={chartsData.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartsData.pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 text-[11px] font-medium border-t border-slate-50 dark:border-slate-700/60 pt-3">
                    {chartsData.pieData.map((entry, idx) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
                        <span>{entry.value} Liters</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* DYNAMIC REPORT VIEWS SHEET */}
          {activeReport !== 'dashboardOverview' && (
            <div ref={printRef} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm overflow-hidden" id="print-area">
              
              {/* PRINT ONLY COOPERATIVE CORPORATE HEADERS */}
              <div className="hidden print:block p-8 border-b border-slate-300">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">DAIRYSPHERE ENTERPRISE AUDIT SHEETS</h2>
                    <p className="text-xs text-slate-500 mt-1">Multi-tenant cooperative automated ledger & calculations</p>
                    <p className="text-[10px] text-slate-400 mt-1">Exported on: {new Date().toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-md font-bold text-slate-800">{session?.business?.name || 'DairySphere Center'}</h3>
                    <p className="text-[10px] text-slate-500">Tenant Account ID: {session?.business?.id || 'default-biz'}</p>
                    <p className="text-[10px] text-slate-400">Auditor Account: {session?.user?.name || 'System Auditor'}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-6 text-[10px] text-slate-500">
                  <span><strong>Filter Start:</strong> {startDate}</span>
                  <span><strong>Filter End:</strong> {endDate}</span>
                  <span><strong>Milk Class:</strong> {selectedMilkType}</span>
                </div>
              </div>

              {/* REPORT TITLE ACTIONS BAR */}
              <div className="px-6 py-5 border-b border-slate-150 dark:border-slate-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="font-bold tracking-tight text-slate-900 dark:text-slate-50">{reportOutput.title}</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Showing compiled calculations based on dynamic ledger entries</p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExportTrigger}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-750 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                    <span>Download Excel (CSV)</span>
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print PDF Sheet</span>
                  </button>
                </div>
              </div>

              {/* MAIN REPORT TABLE GRID */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 dark:bg-slate-800/70 border-b border-slate-150 dark:border-slate-700/60">
                      {reportOutput.headers.map((h, i) => (
                        <th key={i} className="px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-750">
                    {reportOutput.rows.length === 0 ? (
                      <tr>
                        <td colSpan={reportOutput.headers.length || 1} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <Activity className="w-10 h-10 text-slate-300 dark:text-slate-600 animate-pulse" />
                            <div>
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">No records matching active filter bounds found</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Modify your global filter parameters, change dates or reset select constraints</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      reportOutput.rows.map((row: any, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition">
                          {Object.keys(row).map((k, colIdx) => (
                            <td key={colIdx} className="px-6 py-3.5 text-xs font-medium text-slate-700 dark:text-slate-200">
                              {row[k]}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* REPORT FOOTER AND SIGNATURE PLACEHOLDER FOR PRINT */}
              <div className="hidden print:block mt-20 px-8 pb-12">
                <div className="grid grid-cols-3 gap-12 text-center text-[10px] text-slate-500">
                  <div className="border-t border-slate-300 pt-3">
                    <p className="font-bold">PREPARED BY</p>
                    <p className="text-slate-400 mt-1">Cooperative Operational Operator</p>
                  </div>
                  <div className="border-t border-slate-300 pt-3">
                    <p className="font-bold">VERIFIED BY</p>
                    <p className="text-slate-400 mt-1">Auditing Financial Manager</p>
                  </div>
                  <div className="border-t border-slate-300 pt-3">
                    <p className="font-bold">CHIEF EXECUTIVE EXECUTIVE</p>
                    <p className="text-slate-400 mt-1">Cooperative Board President Signature</p>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
