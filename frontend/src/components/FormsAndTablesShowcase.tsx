import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  flexRender, 
  ColumnDef, 
  SortingState, 
  ColumnFiltersState, 
  VisibilityState,
  RowSelectionState,
} from '@tanstack/react-table';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  FileText, Table, UploadCloud, PieChart, Search, SlidersHorizontal, 
  ArrowUpDown, Eye, Download, ChevronDown, Check, Trash2, Edit, Plus, 
  Trash, ChevronRight, ChevronLeft, RefreshCw, AlertTriangle, Printer, 
  CheckCircle2, XCircle, FileSpreadsheet, FileDown, PlusCircle, HelpCircle, 
  Settings2, Activity, Calendar, User, Milk, Thermometer, ShieldAlert, CheckSquare, Square
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { Badge } from './ui/Badge';

// --- TS TYPES & INTERFACES ---
export interface MilkBatch {
  id: string;
  memberId: string;
  memberName: string;
  route: string;
  quantityLiters: number;
  fatPercent: number;
  snfPercent: number; // Solids-Not-Fat
  temperature: number; // Celsius
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  collectionDate: string;
  qcPassed: boolean;
  notes?: string;
  tests: { name: string; result: 'PASSED' | 'FAILED' }[];
}

// Mock initial database for milk delivery batches
const INITIAL_BATCHES: MilkBatch[] = [
  {
    id: 'BATCH-2026-001',
    memberId: 'MEM-0491',
    memberName: 'Anil Deshmukh',
    route: 'Route A - Northern Hills',
    quantityLiters: 250.5,
    fatPercent: 4.5,
    snfPercent: 8.7,
    temperature: 4.2,
    status: 'APPROVED',
    collectionDate: '2026-07-10T06:30:00Z',
    qcPassed: true,
    notes: 'Premium buffalo milk, pristine cooling standard maintained.',
    tests: [
      { name: 'Alcohol Heat Test', result: 'PASSED' },
      { name: 'Acidity Test (pH 6.6)', result: 'PASSED' },
      { name: 'Water Adulteration Test', result: 'PASSED' }
    ]
  },
  {
    id: 'BATCH-2026-002',
    memberId: 'MEM-0820',
    memberName: 'Savitri Bai',
    route: 'Route B - Valley Pastures',
    quantityLiters: 110.0,
    fatPercent: 3.8,
    snfPercent: 8.2,
    temperature: 5.1,
    status: 'APPROVED',
    collectionDate: '2026-07-10T07:15:00Z',
    qcPassed: true,
    notes: 'Standard cow milk collection.',
    tests: [
      { name: 'Alcohol Heat Test', result: 'PASSED' },
      { name: 'Acidity Test (pH 6.5)', result: 'PASSED' },
      { name: 'Water Adulteration Test', result: 'PASSED' }
    ]
  },
  {
    id: 'BATCH-2026-003',
    memberId: 'MEM-0112',
    memberName: 'Gopal Hegde',
    route: 'Route A - Northern Hills',
    quantityLiters: 320.0,
    fatPercent: 4.8,
    snfPercent: 8.9,
    temperature: 8.9,
    status: 'REJECTED',
    collectionDate: '2026-07-10T07:45:00Z',
    qcPassed: false,
    notes: 'Temperature exceeded critical limits (>8°C), rapid microbial acidification risk.',
    tests: [
      { name: 'Alcohol Heat Test', result: 'FAILED' },
      { name: 'Acidity Test (pH 6.1)', result: 'FAILED' },
      { name: 'Water Adulteration Test', result: 'PASSED' }
    ]
  },
  {
    id: 'BATCH-2026-004',
    memberId: 'MEM-0553',
    memberName: 'Meera Nair',
    route: 'Route C - Eastern Plain',
    quantityLiters: 85.2,
    fatPercent: 4.1,
    snfPercent: 8.5,
    temperature: 3.9,
    status: 'PENDING',
    collectionDate: '2026-07-11T05:00:00Z',
    qcPassed: true,
    notes: 'Awaiting secondary safety confirmation.',
    tests: [
      { name: 'Alcohol Heat Test', result: 'PASSED' },
      { name: 'Acidity Test (pH 6.6)', result: 'PASSED' },
      { name: 'Water Adulteration Test', result: 'PASSED' }
    ]
  },
  {
    id: 'BATCH-2026-005',
    memberId: 'MEM-0344',
    memberName: 'Rajesh Patel',
    route: 'Route B - Valley Pastures',
    quantityLiters: 415.0,
    fatPercent: 5.2,
    snfPercent: 9.1,
    temperature: 4.0,
    status: 'APPROVED',
    collectionDate: '2026-07-11T05:30:00Z',
    qcPassed: true,
    notes: 'Excellent high-fat buffalo milk payload.',
    tests: [
      { name: 'Alcohol Heat Test', result: 'PASSED' },
      { name: 'Acidity Test (pH 6.7)', result: 'PASSED' },
      { name: 'Water Adulteration Test', result: 'PASSED' }
    ]
  },
  {
    id: 'BATCH-2026-006',
    memberId: 'MEM-0912',
    memberName: 'Vikram Singh',
    route: 'Route C - Eastern Plain',
    quantityLiters: 195.0,
    fatPercent: 2.1,
    snfPercent: 7.4,
    temperature: 4.5,
    status: 'REJECTED',
    collectionDate: '2026-07-11T06:10:00Z',
    qcPassed: false,
    notes: 'Highly abnormal density, failed solids-not-fat validation check. High risk of added water adulteration.',
    tests: [
      { name: 'Alcohol Heat Test', result: 'PASSED' },
      { name: 'Acidity Test (pH 6.6)', result: 'PASSED' },
      { name: 'Water Adulteration Test', result: 'FAILED' }
    ]
  },
  {
    id: 'BATCH-2026-007',
    memberId: 'MEM-1011',
    memberName: 'Kiran Reddy',
    route: 'Route A - Northern Hills',
    quantityLiters: 155.0,
    fatPercent: 4.0,
    snfPercent: 8.4,
    temperature: 4.1,
    status: 'PENDING',
    collectionDate: '2026-07-11T06:40:00Z',
    qcPassed: true,
    notes: 'No abnormal tests reported.',
    tests: [
      { name: 'Alcohol Heat Test', result: 'PASSED' },
      { name: 'Acidity Test (pH 6.5)', result: 'PASSED' },
      { name: 'Water Adulteration Test', result: 'PASSED' }
    ]
  }
];

// --- FORM SYSTEM ZOD SCHEMA ---
const formSchema = z.object({
  memberId: z.string().min(4, 'Member ID is required (e.g. MEM-0000)'),
  memberName: z.string().min(3, 'Member Full Name must be at least 3 characters'),
  route: z.string().min(1, 'Delivery Route selection is required'),
  quantityLiters: z.number().positive('Quantity must be a positive number').max(2000, 'Maximum batch size cannot exceed 2,000 liters'),
  fatPercent: z.number().min(1.0, 'Fat % must be at least 1.0%').max(15.0, 'Fat % cannot exceed 15.0%'),
  snfPercent: z.number().min(5.0, 'SNF % must be at least 5.0%').max(12.0, 'SNF % cannot exceed 12.0%'),
  temperature: z.number().min(0.1, 'Temperature must be above freezing (0.1°C)').max(30.0, 'Temperature sensor reading is too high'),
  status: z.enum(['APPROVED', 'PENDING', 'REJECTED']),
  collectionDate: z.string().min(1, 'Collection timestamp is required'),
  notes: z.string().optional(),
  tests: z.array(z.object({
    name: z.string().min(1, 'QC Test Name is required'),
    result: z.enum(['PASSED', 'FAILED'])
  })).min(1, 'At least one quality control safety test must be cataloged')
});

type FormSchemaType = z.infer<typeof formSchema>;

export const FormsAndTablesShowcase: React.FC = () => {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [activeTab, setActiveTab] = useState<'table' | 'form' | 'import' | 'presentation'>('table');
  
  // Real-time local state to represent our "database"
  const [batches, setBatches] = useState<MilkBatch[]>(INITIAL_BATCHES);

  // --- REUSABLE TABLE STATE ---
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: true,
    memberId: true,
    memberName: true,
    route: true,
    quantityLiters: true,
    fatPercent: true,
    snfPercent: true,
    temperature: true,
    status: true,
    collectionDate: false, // Hidden by default to demonstrate visibility controls
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [routeFilter, setRouteFilter] = useState<string>('ALL');

  // Sticky header / Column resize / Row details
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // --- REUSABLE MULTI-STEP FORM STATE ---
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // --- IMPORT WIZARD STATE ---
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'error' | 'success'>('upload');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [mappedColumns, setMappedColumns] = useState<Record<string, string>>({
    id: 'Record ID',
    memberId: 'Farmer ID',
    memberName: 'Farmer Name',
    quantityLiters: 'Volume (L)',
    fatPercent: 'Fat content (%)',
    snfPercent: 'Solids-not-fat (%)',
    temperature: 'Temperature (C)',
  });
  const [importPreviewRows, setImportPreviewRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<any[]>([]);

  // --- PRESENTATION TOGGLES (LOADING / ERROR STATES) ---
  const [presentationLoading, setPresentationLoading] = useState(false);
  const [presentationError, setPresentationError] = useState(false);

  // --- DATA FILTERING LOGIC FOR TANSTACK TABLE ---
  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && batch.status !== statusFilter) return false;
      // 2. Route Filter
      if (routeFilter !== 'ALL' && batch.route !== routeFilter) return false;
      return true;
    });
  }, [batches, statusFilter, routeFilter]);

  // --- TABLE COLUMNS DEFINITION ---
  const columns = useMemo<ColumnDef<MilkBatch>[]>(() => [
    {
      id: 'select',
      header: 'Select',
      cell: ({ row }) => (
        <div className="px-1 flex items-center justify-center">
          <button
            onClick={() => row.toggleSelected()}
            className="text-slate-400 hover:text-teal-600 transition duration-150 cursor-pointer"
            aria-label="Select raw row for bulk actions"
          >
            {row.getIsSelected() ? (
              <CheckSquare className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        </div>
      ),
    },
    {
      accessorKey: 'id',
      id: 'id',
      header: 'Batch ID',
      cell: info => <span className="font-mono text-[10px] font-bold text-gray-500 dark:text-slate-400">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'memberId',
      id: 'memberId',
      header: 'Member ID',
      cell: info => <span className="font-mono text-[10px] font-semibold">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'memberName',
      id: 'memberName',
      header: 'Cooperative Farmer',
      cell: info => <span className="font-semibold text-gray-900 dark:text-slate-100">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'route',
      id: 'route',
      header: 'Collection Route',
      cell: info => <span className="text-gray-500 dark:text-slate-400">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'quantityLiters',
      id: 'quantityLiters',
      header: 'Quantity (L)',
      cell: info => (
        <span className="font-mono font-bold text-teal-700 dark:text-teal-400 text-[11px]">
          {(info.getValue() as number).toFixed(1)} L
        </span>
      ),
    },
    {
      accessorKey: 'fatPercent',
      id: 'fatPercent',
      header: 'Fat %',
      cell: info => <span className="font-mono text-gray-600 dark:text-slate-300">{(info.getValue() as number).toFixed(1)}%</span>,
    },
    {
      accessorKey: 'snfPercent',
      id: 'snfPercent',
      header: 'SNF %',
      cell: info => <span className="font-mono text-gray-600 dark:text-slate-300">{(info.getValue() as number).toFixed(1)}%</span>,
    },
    {
      accessorKey: 'temperature',
      id: 'temperature',
      header: 'Temp (°C)',
      cell: info => {
        const temp = info.getValue() as number;
        const tooWarm = temp > 8.0;
        return (
          <span className={`font-mono font-semibold flex items-center gap-1 text-[11px] ${tooWarm ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            <Thermometer className="w-3.5 h-3.5 shrink-0" />
            {temp.toFixed(1)}°C
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      id: 'status',
      header: 'SLA Status',
      cell: info => {
        const val = info.getValue() as string;
        let variant: 'success' | 'danger' | 'warning' = 'warning';
        if (val === 'APPROVED') variant = 'success';
        if (val === 'REJECTED') variant = 'danger';

        return (
          <Badge variant={variant} className="font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5">
            {val}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'collectionDate',
      id: 'collectionDate',
      header: 'Collected Timestamp',
      cell: info => <span className="font-mono text-[9px] text-gray-400">{new Date(info.getValue() as string).toLocaleString()}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpandedRowId(expandedRowId === row.original.id ? null : row.original.id)}
            className="p-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-500 rounded-lg transition hover:shadow-xs cursor-pointer"
            title="Expand Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteBatch(row.original.id)}
            className="p-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 rounded-lg transition cursor-pointer"
            title="Delete Record"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ], [expandedRowId]);

  // --- TANSTACK TABLE HOOK ---
  const table = useReactTable<MilkBatch>({
    data: filteredBatches,
    columns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const val = row.getValue(columnId);
      if (!val) return false;
      return String(val).toLowerCase().includes(search);
    },
  });

  // Automatically configure standard page size to 5
  useEffect(() => {
    table.setPageSize(5);
  }, [table]);

  // --- ACTIONS & BUSINESS OPERATIONS ---
  const handleDeleteBatch = (id: string) => {
    confirm({
      title: 'Delete Quality Milk Batch?',
      message: `Are you sure you want to permanently erase delivery ID ${id}? This operation updates multi-tenant accounting logs immediately.`,
      confirmLabel: 'Erase Record',
      cancelLabel: 'Retain Record',
      type: 'danger',
      onConfirm: () => {
        setBatches(prev => prev.filter(b => b.id !== id));
        showToast(`Batch record ${id} has been erased permanently.`, 'success', 'LEDGER UPDATED');
      }
    });
  };

  const handleBulkApprove = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) return;

    confirm({
      title: `Bulk Approve ${selectedRows.length} Deliveries?`,
      message: 'Approving these deliveries will sync payout registers for the designated dairy farmers. Are you sure you wish to bypass individual audits?',
      confirmLabel: 'Approve Deliveries',
      cancelLabel: 'Keep Pending',
      type: 'success',
      onConfirm: () => {
        const ids = selectedRows.map(row => row.original.id);
        setBatches(prev => prev.map(batch => ids.includes(batch.id) ? { ...batch, status: 'APPROVED' } : batch));
        setRowSelection({});
        showToast(`Bulk approved ${selectedRows.length} batch records securely.`, 'success', 'PAYOUTS GENERATED');
      }
    });
  };

  const handleBulkReject = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) return;

    confirm({
      title: `Bulk Reject ${selectedRows.length} Deliveries?`,
      message: 'This will lock raw payrolls and flag these deliveries as contaminants. Cooperating farmers will be notified of QC failures immediately.',
      confirmLabel: 'Reject Batches',
      cancelLabel: 'Review More',
      type: 'danger',
      onConfirm: () => {
        const ids = selectedRows.map(row => row.original.id);
        setBatches(prev => prev.map(batch => ids.includes(batch.id) ? { ...batch, status: 'REJECTED', qcPassed: false } : batch));
        setRowSelection({});
        showToast(`Bulk rejected ${selectedRows.length} batch records immediately.`, 'warning', 'NOTIFICATIONS DISPATCHED');
      }
    });
  };

  // --- REACT HOOK FORM SETUP WITH ZOD RESOLVER ---
  const formMethods = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      memberId: '',
      memberName: '',
      route: 'Route A - Northern Hills',
      quantityLiters: 150.0,
      fatPercent: 4.0,
      snfPercent: 8.5,
      temperature: 4.0,
      status: 'PENDING',
      collectionDate: new Date().toISOString().substring(0, 16),
      notes: '',
      tests: [
        { name: 'Alcohol Heat Test', result: 'PASSED' },
        { name: 'Acidity Test (pH 6.6)', result: 'PASSED' },
        { name: 'Water Adulteration Test', result: 'PASSED' }
      ]
    },
    mode: 'onTouched'
  });

  const { register, control, handleSubmit, formState: { errors, isDirty, isSubmitting }, reset } = formMethods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'tests'
  });

  // Watch dirty state to warn operators before switching tabs
  useEffect(() => {
    setIsFormDirty(isDirty);
  }, [isDirty]);

  const handleFormSubmit = (data: FormSchemaType) => {
    // Determine overall QC result based on safety tests
    const allPassed = data.tests.every(t => t.result === 'PASSED');
    
    const newBatch: MilkBatch = {
      id: `BATCH-2026-${String(batches.length + 1).padStart(3, '0')}`,
      memberId: data.memberId,
      memberName: data.memberName,
      route: data.route,
      quantityLiters: data.quantityLiters,
      fatPercent: data.fatPercent,
      snfPercent: data.snfPercent,
      temperature: data.temperature,
      status: allPassed ? data.status : 'REJECTED', // Auto reject if quality checks fail
      collectionDate: data.collectionDate + ':00Z',
      qcPassed: allPassed,
      notes: data.notes || 'Manual payload log.',
      tests: data.tests
    };

    setBatches(prev => [newBatch, ...prev]);
    showToast(`Milk delivery from ${data.memberName} cataloged in block ledger!`, 'success', 'BATCH COMMITTED');
    reset();
    setFormStep(1);
    setIsFormDirty(false);
    setActiveTab('table');
  };

  const handleResetForm = () => {
    confirm({
      title: 'Discard Local Draft?',
      message: 'This will reset all quality values, test criteria, and cooperative credentials to default templates.',
      confirmLabel: 'Discard Draft',
      cancelLabel: 'Keep Writing',
      type: 'warning',
      onConfirm: () => {
        reset();
        setFormStep(1);
        setIsFormDirty(false);
        showToast('Form fields cleared.', 'info');
      }
    });
  };

  // --- EXPORT FOUNDATION SIMULATIONS ---
  const handleExportCSV = () => {
    showToast('Preparing CSV layout metrics...', 'info');
    setTimeout(() => {
      // Create a plain text CSV representation
      const headers = ['Batch ID', 'Farmer ID', 'Farmer Name', 'Volume (L)', 'Fat %', 'SNF %', 'Temp (°C)', 'SLA Status', 'Collected On'];
      const rows = filteredBatches.map(b => [
        b.id, b.memberId, b.memberName, b.quantityLiters, b.fatPercent, b.snfPercent, b.temperature, b.status, b.collectionDate
      ]);
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `dairysphere_qc_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Exported ${filteredBatches.length} milk deliveries to CSV successfully!`, 'success', 'EXPORT COMPLETED');
    }, 800);
  };

  const handleExportExcel = () => {
    showToast('Compiling Excel Binary OpenXML layout structure...', 'info', 'GENERATING SHEET');
    setTimeout(() => {
      showToast('Excel document exported successfully. (Simulation completed with binary blob mapping)', 'success', 'EXCEL COMPLETED');
    }, 1200);
  };

  const handleExportPDF = () => {
    showToast('Assembling high-dpi vector graphics and table headers...', 'info', 'COMPILING PDF');
    setTimeout(() => {
      showToast('PDF Ledger Report saved to local directories.', 'success', 'PDF COMPLETED');
    }, 1400);
  };

  const handlePrintView = () => {
    showToast('Optimizing stylesheets for print viewport...', 'info');
    window.print();
  };

  // --- IMPORT WIZARD ACTION LOGIC ---
  const handleTriggerImportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImportFile(file);
      setImportStep('mapping');
      showToast(`File "${file.name}" uploaded. Define columns layout.`, 'info');
    }
  };

  const handleProcessImportMapping = () => {
    setImportStep('preview');
    setImportProgress(10);
    
    // Simulate mapping calculation
    const timer = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          // Set preview mock entries
          setImportPreviewRows([
            { id: 'IMPORT-001', memberId: 'MEM-0320', memberName: 'Ramesh Gopi', quantityLiters: 180.5, fatPercent: 4.2, snfPercent: 8.6, temperature: 4.1, status: 'PENDING' },
            { id: 'IMPORT-002', memberId: 'MEM-0941', memberName: 'Amrita Pritam', quantityLiters: 90.0, fatPercent: 3.5, snfPercent: 8.0, temperature: 11.2, status: 'PENDING' }, // Warning! Warm
            { id: 'IMPORT-003', memberId: 'MEM-XX42', memberName: 'Invalid Farmer Entry', quantityLiters: -12.0, fatPercent: 18.0, snfPercent: 3.1, temperature: 4.0, status: 'PENDING' }, // ERROR ROW
          ]);
          return 100;
        }
        return prev + 30;
      });
    }, 200);
  };

  const handleCorrectRowData = (index: number, field: string, value: any) => {
    setImportPreviewRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleFinalizeImport = () => {
    // Filter out row with invalid inputs
    const errorsList = [];
    const validRowsToInsert: MilkBatch[] = [];

    importPreviewRows.forEach((row, idx) => {
      if (!row.memberId || row.memberId.startsWith('MEM-XX') || row.quantityLiters <= 0 || row.fatPercent > 15 || row.snfPercent < 5) {
        errorsList.push({
          row: idx + 1,
          desc: `Row ${idx + 1} fails dairy standards. ID must be valid and Volume/Fat must be in range. (Received Member: ${row.memberName}, Volume: ${row.quantityLiters}L)`
        });
      } else {
        validRowsToInsert.push({
          id: `BATCH-IMP-${String(batches.length + idx + 1).padStart(3, '0')}`,
          memberId: row.memberId,
          memberName: row.memberName,
          route: 'Imported Hub Route',
          quantityLiters: Number(row.quantityLiters),
          fatPercent: Number(row.fatPercent),
          snfPercent: Number(row.snfPercent),
          temperature: Number(row.temperature),
          status: 'APPROVED',
          collectionDate: new Date().toISOString(),
          qcPassed: true,
          tests: [
            { name: 'Alcohol Heat Test', result: 'PASSED' },
            { name: 'Acidity Test (pH 6.6)', result: 'PASSED' },
          ]
        });
      }
    });

    if (errorsList.length > 0) {
      setImportErrors(errorsList);
      setImportStep('error');
      showToast('Import completed with compliance flags. Action required.', 'warning', 'COMPLIANCE FAILURE');
    } else {
      setBatches(prev => [...validRowsToInsert, ...prev]);
      setImportStep('success');
      showToast(`Imported ${validRowsToInsert.length} deliveries into ledger log.`, 'success', 'TRANSACTIONS SYNCHRONIZED');
    }
  };

  const handleTabChange = (tab: 'table' | 'form' | 'import' | 'presentation') => {
    if (activeTab === 'form' && isFormDirty) {
      confirm({
        title: 'Discard Unsaved Form Data?',
        message: 'You are currently configuring a dairy collection draft. Leaving this tab will erase changes. Continue?',
        confirmLabel: 'Leave Tab',
        cancelLabel: 'Keep Editing',
        type: 'warning',
        onConfirm: () => {
          setIsFormDirty(false);
          setActiveTab(tab);
        }
      });
    } else {
      setActiveTab(tab);
    }
  };

  // --- STATS COMPUTATIONS ---
  const stats = useMemo(() => {
    const totalVolume = batches.reduce((sum, b) => b.status === 'APPROVED' ? sum + b.quantityLiters : sum, 0);
    const avgFat = batches.reduce((sum, b) => b.status === 'APPROVED' ? sum + b.fatPercent : sum, 0) / (batches.filter(b => b.status === 'APPROVED').length || 1);
    const pendingCount = batches.filter(b => b.status === 'PENDING').length;
    const contaminatedCount = batches.filter(b => b.status === 'REJECTED').length;

    return {
      totalVolume,
      avgFat,
      pendingCount,
      contaminatedCount
    };
  }, [batches]);

  return (
    <div className="space-y-8 print:bg-white print:text-black">
      
      {/* 1. SECTION HEADER */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-400 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-teal-100 dark:border-teal-900/40">
              Stage 3.4 Operational
            </span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> WCAG 2.1 Compliant
            </span>
          </div>
          <h2 className="text-3xl font-black font-display text-gray-900 dark:text-slate-100 tracking-tight uppercase">
            Forms & Presentation Engine
          </h2>
          <p className="text-[11px] text-gray-600 dark:text-slate-400 mt-1 max-w-2xl font-medium leading-relaxed">
            Enterprise validation workflows, multi-step wizards, and highly performant TanStack table assemblies optimized for cold-chain dairy operations.
          </p>
        </div>

        {/* Presentation Controls: Force Loading/Error states globally for demonstration */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <button
            onClick={() => {
              setPresentationLoading(true);
              setTimeout(() => setPresentationLoading(false), 1200);
              showToast('Simulation: Reloading database cache lines...', 'info');
            }}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Activity className="w-3.5 h-3.5" /> Force Load State
          </button>
          <button
            onClick={() => {
              setPresentationError(!presentationError);
              showToast(presentationError ? 'Errors cleared.' : 'Simulation: External regional API timed out.', presentationError ? 'info' : 'error');
            }}
            className={`px-3 py-1.5 border rounded-lg text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 cursor-pointer ${
              presentationError 
                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400' 
                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Toggle Error State
          </button>
        </div>
      </div>

      {/* --- STATS PANEL --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <Milk className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cooperative Payload</span>
            <span className="block text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">{stats.totalVolume.toFixed(1)} L</span>
            <span className="block text-[8px] text-gray-500 dark:text-slate-500">Approved pure milk</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mean Quality Fat</span>
            <span className="block text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">{stats.avgFat.toFixed(2)}%</span>
            <span className="block text-[8px] text-emerald-600 dark:text-emerald-400 font-semibold">High butterfat standard</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <RefreshCw className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Awaiting Auditing</span>
            <span className="block text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100">{stats.pendingCount} Batches</span>
            <span className="block text-[8px] text-gray-500 dark:text-slate-500">Inbound cold tankers</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 rounded-2xl flex items-center gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">SLA Quarantined</span>
            <span className="block text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400">{stats.contaminatedCount} Rejects</span>
            <span className="block text-[8px] text-rose-500 dark:text-rose-500 font-semibold">Temp / Adulteration violations</span>
          </div>
        </div>
      </div>

      {/* --- SIMULATED ERROR AND LOADING STATES FOR DEMONSTRATION --- */}
      {presentationLoading && (
        <Card className="animate-pulse">
          <CardContent className="py-12 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-10 h-10 text-teal-600 animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading cold-chain telemetry lines...</p>
          </CardContent>
        </Card>
      )}

      {presentationError && (
        <ErrorState
          title="Telemetry API Outage Detected"
          message="DairySphere was unable to securely shake hands with regional cold-tank data streams. The core scheduler has engaged standard fail-safe buffers."
          errorCode="ERR_COLD_STREAM_TIMEOUT"
          retryLabel="Recalibrate Data Bridge"
          onRetry={() => {
            setPresentationLoading(true);
            setTimeout(() => {
              setPresentationLoading(false);
              setPresentationError(false);
              showToast('Bridge re-established successfully!', 'success');
            }, 1000);
          }}
        />
      )}

      {!presentationLoading && !presentationError && (
        <>
          {/* 2. INNER TAB SWITCHER */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800/80 pb-px gap-2 overflow-x-auto print:hidden">
            <button
              onClick={() => handleTabChange('table')}
              className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'table' 
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
              }`}
            >
              <Table className="w-4 h-4" /> TanStack Data Table
            </button>
            <button
              onClick={() => handleTabChange('form')}
              className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'form' 
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" /> Multi-Step Quality Form
            </button>
            <button
              onClick={() => handleTabChange('import')}
              className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'import' 
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
              }`}
            >
              <UploadCloud className="w-4 h-4" /> Log Import Wizard
            </button>
            <button
              onClick={() => handleTabChange('presentation')}
              className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'presentation' 
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-black' 
                  : 'border-transparent text-slate-400 hover:text-slate-850 dark:hover:text-slate-200'
              }`}
            >
              <PieChart className="w-4 h-4" /> Details & Feed
            </button>
          </div>

          {/* --- TAB CONTENT 1: TANSTACK ENTERPRISE DATA TABLE --- */}
          {activeTab === 'table' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              
              {/* Dynamic Table Action Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xs print:hidden">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative w-full">
                    <Search className="absolute left-3 w-4 h-4 text-slate-400 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Global search member names, batch IDs, routes..."
                      value={globalFilter}
                      onChange={e => setGlobalFilter(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-[11px] font-semibold text-gray-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 rounded-xl focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  
                  {/* Status Dropdown Filter */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Status:</span>
                    <select 
                      value={statusFilter} 
                      onChange={e => {
                        setStatusFilter(e.target.value);
                        table.setPageIndex(0);
                      }}
                      className="bg-transparent focus:outline-hidden font-black uppercase text-teal-600 cursor-pointer"
                    >
                      <option value="ALL">ALL COOPERATIVE</option>
                      <option value="APPROVED">APPROVED ONLY</option>
                      <option value="PENDING">PENDING STATUS</option>
                      <option value="REJECTED">REJECTED / FAIL</option>
                    </select>
                  </div>

                  {/* Route Dropdown Filter */}
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase text-slate-600 dark:text-slate-400">
                    <span>Route:</span>
                    <select 
                      value={routeFilter} 
                      onChange={e => {
                        setRouteFilter(e.target.value);
                        table.setPageIndex(0);
                      }}
                      className="bg-transparent focus:outline-hidden font-black uppercase text-teal-600 cursor-pointer"
                    >
                      <option value="ALL">ALL MILK VEHICLES</option>
                      <option value="Route A - Northern Hills">NORTHERN HILLS (A)</option>
                      <option value="Route B - Valley Pastures">VALLEY PASTURES (B)</option>
                      <option value="Route C - Eastern Plain">EASTERN PLAIN (C)</option>
                    </select>
                  </div>

                  {/* Column Visibility Control */}
                  <div className="relative group">
                    <button
                      className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-extrabold uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
                    >
                      <Settings2 className="w-3.5 h-3.5" /> Column Columns <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 hidden group-hover:block z-50">
                      <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-2 px-2">Toggle Fields</span>
                      {table.getAllLeafColumns().map(column => {
                        if (column.id === 'select' || column.id === 'actions') return null;
                        return (
                          <label key={column.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-355 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={column.getIsVisible()}
                              onChange={column.getToggleVisibilityHandler()}
                              className="accent-teal-555"
                            />
                            {column.id.toUpperCase()}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

              {/* Bulk Actions Indicator if Rows Selected */}
              {Object.keys(rowSelection).length > 0 && (
                <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in print:hidden">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="text-[11px] font-extrabold text-teal-900 dark:text-teal-355 uppercase">
                      {Object.keys(rowSelection).length} Deliveries selected for corporate batch processing
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="primary" size="sm" onClick={handleBulkApprove}>
                      Bulk Approve Payout
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleBulkReject}>
                      Bulk Quota Reject
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setRowSelection({})}>
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}

              {/* STICKY DATA TABLE CONTAINER */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs relative print:border-none print:shadow-none">
                <div className="overflow-x-auto max-h-[420px] scrollbar-thin">
                  <table className="w-full text-left border-collapse">
                    
                    {/* Sticky Table Header */}
                    <thead className="bg-slate-50 dark:bg-slate-950/80 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => {
                            const isSortable = header.column.getCanSort();
                            return (
                              <th 
                                key={header.id} 
                                className="px-5 py-3.5 font-black whitespace-nowrap cursor-pointer select-none group"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <div className="flex items-center gap-1.5">
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                  {isSortable && (
                                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-500 transition duration-150" />
                                  )}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      ))}
                    </thead>

                    {/* Table Body */}
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-355">
                      {table.getRowModel().rows.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400 font-mono text-[10px] uppercase">
                            No telemetry logs found corresponding to chosen filters.
                          </td>
                        </tr>
                      ) : (
                        table.getRowModel().rows.map(row => {
                          const isExpanded = expandedRowId === row.original.id;
                          return (
                            <React.Fragment key={row.id}>
                              <tr 
                                className={`transition-colors duration-150 ${
                                  row.getIsSelected() 
                                    ? 'bg-teal-500/5 dark:bg-teal-500/10' 
                                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-850/40'
                                } ${isExpanded ? 'bg-slate-50/50 dark:bg-slate-850/40 border-b-none' : ''}`}
                              >
                                {row.getVisibleCells().map(cell => (
                                  <td key={cell.id} className="px-5 py-3.5 whitespace-nowrap">
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )}
                                  </td>
                                ))}
                              </tr>

                              {/* Expandable row detail panel */}
                              {isExpanded && (
                                <tr>
                                  <td colSpan={columns.length} className="bg-slate-50/80 dark:bg-slate-900/60 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                                      <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Quality Audit Narrative</h4>
                                        <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl italic leading-relaxed">
                                          "{row.original.notes || 'No manual log logs added to this collection run.'}"
                                        </p>
                                        <div className="text-[9px] font-mono font-black text-slate-400 uppercase">
                                          SYSTEM REF ID: {row.original.id} | BATCHED ON {new Date(row.original.collectionDate).toLocaleString()}
                                        </div>
                                      </div>

                                      <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Safety & Pasteurization Checklist</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                          {row.original.tests.map((test, index) => (
                                            <div key={index} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
                                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{test.name}</span>
                                              {test.result === 'PASSED' ? (
                                                <Badge variant="success" className="text-[8px] px-1 py-0.5">PASSED</Badge>
                                              ) : (
                                                <Badge variant="danger" className="text-[8px] px-1 py-0.5">FAILED</Badge>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>

                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Rows per page:</span>
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={e => table.setPageSize(Number(e.target.value))}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-teal-600 px-2 py-1 cursor-pointer focus:outline-hidden"
                    >
                      {[5, 10, 20].map(size => (
                        <option key={size} value={size}>{size} records</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Showing {table.getPaginationRowModel().rows.length} of {table.getFilteredRowModel().rows.length} items
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-805 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                      aria-label="Previous ledger page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {Array.from({ length: table.getPageCount() }).map((_, idx) => {
                      const isCurrent = table.getState().pagination.pageIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => table.setPageIndex(idx)}
                          className={`w-7 h-7 text-[10px] font-black rounded-lg border flex items-center justify-center transition cursor-pointer ${
                            isCurrent 
                              ? 'bg-teal-500 border-teal-500 text-white shadow-xs' 
                              : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-500 hover:text-slate-850'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                      className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-805 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                      aria-label="Next ledger page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Export Foundation Footer Panels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
                <button
                  onClick={handleExportCSV}
                  className="p-3.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between transition cursor-pointer group text-left"
                >
                  <div className="space-y-0.5">
                    <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Export raw text</span>
                    <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">Comma-Separated (CSV)</span>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
                </button>

                <button
                  onClick={handleExportExcel}
                  className="p-3.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between transition cursor-pointer group text-left"
                >
                  <div className="space-y-0.5">
                    <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Enterprise spreadsheet</span>
                    <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">Excel Ledger Format</span>
                  </div>
                  <FileSpreadsheet className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
                </button>

                <button
                  onClick={handleExportPDF}
                  className="p-3.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between transition cursor-pointer group text-left"
                >
                  <div className="space-y-0.5">
                    <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Auditor report</span>
                    <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">Document PDF Blueprint</span>
                  </div>
                  <FileDown className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
                </button>

                <button
                  onClick={handlePrintView}
                  className="p-3.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between transition cursor-pointer group text-left"
                >
                  <div className="space-y-0.5">
                    <span className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hard-copy archive</span>
                    <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">Dynamic Printer View</span>
                  </div>
                  <Printer className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
                </button>
              </div>

            </div>
          )}

          {/* --- TAB CONTENT 2: MULTI-STEP REACT HOOK FORM WITH ZOD VALIDATION --- */}
          {activeTab === 'form' && (
            <Card className="animate-in fade-in duration-300 max-w-2xl mx-auto print:hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>Catalog Quality Delivery Run</CardTitle>
                    <CardDescription>Multi-step cold-chain batch validation schema</CardDescription>
                  </div>
                  
                  {/* Step Indicators */}
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3].map(step => (
                      <div 
                        key={step} 
                        className={`w-7 h-7 text-[10px] font-black rounded-full flex items-center justify-center transition duration-200 border ${
                          formStep === step
                            ? 'bg-teal-500 border-teal-500 text-white shadow-xs'
                            : formStep > step
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        {formStep > step ? <Check className="w-3.5 h-3.5" /> : step}
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                
                <FormProvider {...formMethods}>
                  <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                    
                    {/* STEP 1: MEMBER IDENTITY & LOGISTICS */}
                    {formStep === 1 && (
                      <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
                        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl flex items-start gap-3">
                          <User className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">Farmer Verification System</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              Specify farmer identification credentials to execute decentralized multi-tenant accounting and quality check logs.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Cooperative Farmer ID *"
                            placeholder="e.g. MEM-0491"
                            description="Farmer ledger code used for billing routes."
                            error={errors.memberId?.message}
                            {...register('memberId')}
                          />

                          <Input
                            label="Farmer Full Name *"
                            placeholder="e.g. Anil Deshmukh"
                            description="Full legal billing name of co-op member."
                            error={errors.memberName?.message}
                            {...register('memberName')}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5 w-full">
                            <label className="block text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest">
                              Collection Route *
                            </label>
                            <select
                              {...register('route')}
                              className="w-full px-4 py-2.5 text-[11px] font-medium text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                            >
                              <option value="Route A - Northern Hills">Route A - Northern Hills</option>
                              <option value="Route B - Valley Pastures">Route B - Valley Pastures</option>
                              <option value="Route C - Eastern Plain">Route C - Eastern Plain</option>
                            </select>
                          </div>

                          <Input
                            label="Collection Timestamp *"
                            type="datetime-local"
                            error={errors.collectionDate?.message}
                            {...register('collectionDate')}
                          />
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button 
                            type="button" 
                            variant="primary"
                            onClick={() => {
                              // Manually trigger partial validation before advancing
                              formMethods.trigger(['memberId', 'memberName', 'route', 'collectionDate']).then(isValid => {
                                if (isValid) setFormStep(2);
                                else showToast('Please resolve validation markers on farmer fields.', 'error');
                              });
                            }}
                          >
                            Proceed to Physics Specs <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: QUANTITY & COLD CHAIN METRICS */}
                    {formStep === 2 && (
                      <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
                        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl flex items-start gap-3">
                          <Thermometer className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h4 className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">Cold-Chain Temperature Warning</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                              Inbound milk must be cooled to &lt;4.5°C within 2 hours of extraction. Raw temperatures above 8°C pose biological risks and fail standard safety SLAs.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Batch Volume (Liters) *"
                            type="number"
                            step="0.1"
                            placeholder="e.g. 250.5"
                            description="Volume collected in standardized liters."
                            error={errors.quantityLiters?.message}
                            {...register('quantityLiters', { valueAsNumber: true })}
                          />

                          <Input
                            label="Raw Butterfat Content (%) *"
                            type="number"
                            step="0.1"
                            placeholder="e.g. 4.2"
                            description="Buffalo range: 4-12%, Cow range: 3-5%."
                            error={errors.fatPercent?.message}
                            {...register('fatPercent', { valueAsNumber: true })}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input
                            label="Solids-Not-Fat (SNF %) *"
                            type="number"
                            step="0.1"
                            placeholder="e.g. 8.5"
                            description="Regulatory minimum: cow 8.2%, buffalo 9.0%."
                            error={errors.snfPercent?.message}
                            {...register('snfPercent', { valueAsNumber: true })}
                          />

                          <Input
                            label="Reception Temperature (°C) *"
                            type="number"
                            step="0.1"
                            placeholder="e.g. 4.0"
                            description="Target chilled threshold: 2°C - 4.5°C."
                            error={errors.temperature?.message}
                            {...register('temperature', { valueAsNumber: true })}
                          />
                        </div>

                        <div className="flex justify-between pt-4">
                          <Button type="button" variant="outline" onClick={() => setFormStep(1)}>
                            Back to Farmer ID
                          </Button>
                          <Button 
                            type="button" 
                            variant="primary"
                            onClick={() => {
                              formMethods.trigger(['quantityLiters', 'fatPercent', 'snfPercent', 'temperature']).then(isValid => {
                                if (isValid) setFormStep(3);
                                else showToast('Physics standards fail validation parameters.', 'error');
                              });
                            }}
                          >
                            Proceed to Quality Checklist <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: QUALITY ASSURANCE CHECKLIST & NOTES */}
                    {formStep === 3 && (
                      <div className="space-y-4 animate-in slide-in-from-right-3 duration-200">
                        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 p-4 rounded-2xl space-y-2">
                          <div className="flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <h4 className="text-[11px] font-extrabold uppercase text-slate-700 dark:text-slate-300">Quality Assurance Tests</h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                Failures on any test criteria below triggers immediate batch quarantine status in system directories.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Dynamic checklist fields array */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-2">
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">QC Field Checklist</span>
                            <button
                              type="button"
                              onClick={() => append({ name: 'Secondary Microbe Test', result: 'PASSED' })}
                              className="text-[10px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" /> Add Specific Lab Test
                            </button>
                          </div>

                          {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850/80">
                              <div className="flex-1">
                                <input
                                  {...register(`tests.${index}.name` as const)}
                                  className="w-full bg-transparent border-b border-slate-250 dark:border-slate-800 focus:border-teal-500 focus:outline-hidden text-[11px] font-bold text-slate-855 dark:text-slate-100"
                                  placeholder="QC Test Name"
                                />
                                {errors.tests?.[index]?.name && (
                                  <span className="text-[9px] text-rose-600 font-semibold">{errors.tests[index]?.name?.message}</span>
                                )}
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                <select
                                  {...register(`tests.${index}.result` as const)}
                                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold text-teal-600 p-1 cursor-pointer"
                                >
                                  <option value="PASSED">PASSED</option>
                                  <option value="FAILED">FAILED (HAZARD)</option>
                                </select>
                                
                                {fields.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                                  >
                                    <Trash className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Optional notes */}
                        <div className="space-y-1.5 w-full">
                          <label className="block text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest">
                            QC Notes / Operator Recommendations
                          </label>
                          <textarea
                            {...register('notes')}
                            rows={3}
                            placeholder="Add thermal logs, storage silo numbers, or collection vehicle details..."
                            className="w-full px-4 py-2.5 text-[11px] font-medium text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 shadow-xs"
                          />
                        </div>

                        <div className="space-y-1.5 w-full">
                          <label className="block text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest">
                            Desired SLA Destination Status
                          </label>
                          <select
                            {...register('status')}
                            className="w-full px-4 py-2.5 text-[11px] font-medium text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                          >
                            <option value="PENDING">PENDING FINAL AUDIT</option>
                            <option value="APPROVED">IMMEDIATE RELEASE APPROVED</option>
                            <option value="REJECTED">PRE-EMPTIVE ISOLATE / QUARANTINE</option>
                          </select>
                        </div>

                        <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                          <Button type="button" variant="outline" onClick={() => setFormStep(2)}>
                            Back to Specs
                          </Button>
                          <div className="flex gap-2">
                            <Button type="button" variant="ghost" className="text-rose-600" onClick={handleResetForm}>
                              Discard Draft
                            </Button>
                            <Button 
                              type="submit" 
                              variant="primary" 
                              loading={isSubmitting}
                            >
                              Commit & Sign Batch
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                  </form>
                </FormProvider>

              </CardContent>
            </Card>
          )}

          {/* --- TAB CONTENT 3: RAW CO-OP COLLECTION CSV IMPORT WIZARD --- */}
          {activeTab === 'import' && (
            <Card className="animate-in fade-in duration-300 max-w-2xl mx-auto print:hidden">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-5">
                <CardTitle>Cooperative Delivery Logs Importer</CardTitle>
                <CardDescription>Parse and validate raw member transaction files securely</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                
                {/* IMPORT STEP 1: DRAG & DROP FILE UPLOAD */}
                {importStep === 'upload' && (
                  <div className="space-y-6 text-center py-6">
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md mx-auto flex flex-col items-center justify-center space-y-4 hover:border-teal-500 transition duration-150 relative">
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Drag & drop raw delivery CSV</span>
                        <span className="block text-[10px] text-slate-400 mt-1">Accepts standard .csv, .xls, .json dairy files (Max size: 50MB)</span>
                      </div>
                      
                      <input
                        type="file"
                        accept=".csv,.xlsx,.json"
                        onChange={handleTriggerImportUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    
                    <div className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Or copy raw logs paste manually. All uploads undergo automatic multi-tenant schema isolation checks.
                    </div>
                  </div>
                )}

                {/* IMPORT STEP 2: FIELD SCHEMA MAPPING */}
                {importStep === 'mapping' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-150 dark:border-teal-900/40 rounded-xl flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                      <span className="text-[10px] font-black uppercase text-teal-800 dark:text-teal-400 tracking-wider">Identify Column Headers</span>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Core Schema Fields Mapping</span>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-150 dark:border-slate-850">
                        {Object.keys(mappedColumns).map(field => (
                          <div key={field} className="flex items-center justify-between py-2">
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-355">{field.toUpperCase()}</span>
                            <select
                              value={mappedColumns[field]}
                              onChange={e => setMappedColumns({ ...mappedColumns, [field]: e.target.value })}
                              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-lg text-[10px] font-bold text-teal-600 p-1 cursor-pointer"
                            >
                              <option value="Farmer ID">Farmer ID (Co-op Code)</option>
                              <option value="Farmer Name">Farmer Full Name</option>
                              <option value="Volume (L)">Volume (Liters)</option>
                              <option value="Fat content (%)">Fat content (%)</option>
                              <option value="Solids-not-fat (%)">Solids-not-fat (%)</option>
                              <option value="Temperature (C)">Temperature (°C)</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-2 border-t border-slate-150 dark:border-slate-800">
                      <Button variant="outline" onClick={() => setImportStep('upload')}>Cancel</Button>
                      <Button variant="primary" onClick={handleProcessImportMapping}>Verify Columns Match</Button>
                    </div>
                  </div>
                )}

                {/* IMPORT STEP 3: TRANSACTION PREVIEW & CORRECTION */}
                {importStep === 'preview' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-2">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Previewing Logs File</span>
                      <Badge variant="warning" className="font-mono text-[9px]">3 ROWS FOUND</Badge>
                    </div>

                    <div className="space-y-3.5">
                      {importPreviewRows.map((row, index) => {
                        const hasError = row.memberId.startsWith('MEM-XX') || row.quantityLiters <= 0;
                        return (
                          <div key={index} className={`p-4 rounded-2xl border ${
                            hasError 
                              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900' 
                              : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
                          } space-y-3`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-400 uppercase">TRANS RECORD #{index + 1}</span>
                              {hasError && (
                                <span className="text-[9px] text-rose-600 font-semibold flex items-center gap-1 uppercase">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Fails Physics Validation
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div>
                                <span className="block text-[9px] uppercase text-slate-400">Farmer ID</span>
                                <input
                                  type="text"
                                  value={row.memberId}
                                  onChange={e => handleCorrectRowData(index, 'memberId', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg p-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-105"
                                />
                              </div>

                              <div>
                                <span className="block text-[9px] uppercase text-slate-400">Farmer Name</span>
                                <input
                                  type="text"
                                  value={row.memberName}
                                  onChange={e => handleCorrectRowData(index, 'memberName', e.target.value)}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg p-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-105"
                                />
                              </div>

                              <div>
                                <span className="block text-[9px] uppercase text-slate-400">Volume (L)</span>
                                <input
                                  type="number"
                                  value={row.quantityLiters}
                                  onChange={e => handleCorrectRowData(index, 'quantityLiters', Number(e.target.value))}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg p-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-105"
                                />
                              </div>

                              <div>
                                <span className="block text-[9px] uppercase text-slate-400">Fat content (%)</span>
                                <input
                                  type="number"
                                  value={row.fatPercent}
                                  onChange={e => handleCorrectRowData(index, 'fatPercent', Number(e.target.value))}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-lg p-1.5 text-[10px] font-bold text-slate-700 dark:text-slate-105"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between pt-4 border-t border-slate-150 dark:border-slate-800">
                      <Button variant="outline" onClick={() => setImportStep('mapping')}>Back to Mapping</Button>
                      <Button variant="primary" onClick={handleFinalizeImport}>Execute Transaction Import</Button>
                    </div>
                  </div>
                )}

                {/* IMPORT STEP 4: IMPORT ERROR LEDGER */}
                {importStep === 'error' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-extrabold uppercase text-rose-700 dark:text-rose-400">Compliance Errors Blocked Commit</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          The following records violate regulatory milk metrics. Fix them in the CSV or correct the row data above.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-850">
                      {importErrors.map((err, idx) => (
                        <div key={idx} className="text-[10px] font-mono text-rose-600 flex items-start gap-2 py-1.5">
                          <span>●</span>
                          <span>{err.desc}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-150 dark:border-slate-800">
                      <Button variant="outline" onClick={() => setImportStep('preview')}>Correct Preview Fields</Button>
                      <Button variant="danger" onClick={() => {
                        setImportStep('upload');
                        setImportFile(null);
                        showToast('Import job canceled.', 'info');
                      }}>Restart Upload</Button>
                    </div>
                  </div>
                )}

                {/* IMPORT STEP 5: IMPORT COMPLETED SUCCESS SCREEN */}
                {importStep === 'success' && (
                  <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
                      <Check className="w-6 h-6 animate-pulse" />
                    </div>

                    <div>
                      <h4 className="text-[12px] font-black uppercase text-gray-900 dark:text-slate-100 tracking-tight">Ledger Synchronized Successfully</h4>
                      <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                        Raw milk shipments mapped and cataloged. Member payout files are now updated for governance audits.
                      </p>
                    </div>

                    <div className="pt-4 flex justify-center gap-2">
                      <Button variant="outline" onClick={() => {
                        setImportStep('upload');
                        setImportFile(null);
                      }}>Import New Sheet</Button>
                      <Button variant="primary" onClick={() => handleTabChange('table')}>View Delivery Logs</Button>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          )}

          {/* --- TAB CONTENT 4: DATA PRESENTATION DETAIL VIEW & ACTIVITY FEED --- */}
          {activeTab === 'presentation' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Detail View Component */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-5 md:col-span-2 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-teal-600" /> Silo Storage Allocation Detail
                    </h3>
                    <Badge variant="success" className="text-[8px]">FACILITY HIGH SLA</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-850">
                      <span className="block text-[8px] font-black uppercase text-slate-400">COLD SILO ID</span>
                      <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-100">Silo-A (Chilling Center Northern)</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-850">
                      <span className="block text-[8px] font-black uppercase text-slate-400">TOTAL silos capacity</span>
                      <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-100">25,000 / 30,000 L</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-850">
                      <span className="block text-[8px] font-black uppercase text-slate-400">THERMAL STABILITY</span>
                      <span className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                        ● 3.8°C (OPTIMAL)
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-850">
                      <span className="block text-[8px] font-black uppercase text-slate-400">SLA AUDIT STATUS</span>
                      <span className="block text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                        SECURE LOGGED
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 p-3.5 rounded-2xl text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Silo pressure registers within 1.2 bar tolerance limits. Next automated temperature calibration cycle will fire in exactly 45 minutes. No safety flags reported.
                    </span>
                  </div>
                </div>

                {/* 2. Timeline Activity Feed */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-3">
                    <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Operational Ledger Stream
                    </h3>
                  </div>

                  <div className="relative border-l-2 border-slate-100 dark:border-slate-850 pl-4 space-y-5">
                    
                    {/* Timeline Item 1 */}
                    <div className="relative">
                      <div className="absolute -left-[21px] top-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                      <div className="space-y-0.5">
                        <span className="block text-[10px] font-bold text-slate-805 dark:text-slate-105">Batch #2026-005 Approved</span>
                        <p className="text-[9px] text-slate-400">MEM-0344 delivery certified at 5.2% butterfat.</p>
                        <span className="block text-[8px] font-mono text-slate-400">10 mins ago • Northern Hills</span>
                      </div>
                    </div>

                    {/* Timeline Item 2 */}
                    <div className="relative">
                      <div className="absolute -left-[21px] top-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
                      <div className="space-y-0.5">
                        <span className="block text-[10px] font-bold text-slate-805 dark:text-slate-105">Batch #2026-006 Quarantined</span>
                        <p className="text-[9px] text-slate-400">Water adulteration test failed standards on Eastern Route.</p>
                        <span className="block text-[8px] font-mono text-slate-400">32 mins ago • System Auto-Block</span>
                      </div>
                    </div>

                    {/* Timeline Item 3 */}
                    <div className="relative">
                      <div className="absolute -left-[21px] top-0 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-slate-900" />
                      <div className="space-y-0.5">
                        <span className="block text-[10px] font-bold text-slate-805 dark:text-slate-105">Inbound Tanker Scheduled</span>
                        <p className="text-[9px] text-slate-400">Route C driver dispatched to chilling hub.</p>
                        <span className="block text-[8px] font-mono text-slate-400">1 hr ago • Fleet Logistics</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};
