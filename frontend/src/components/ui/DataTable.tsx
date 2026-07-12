import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Search, SlidersHorizontal, ArrowUpDown, Eye, Download, ChevronDown, Check
} from 'lucide-react';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  sortValue?: (row: T) => string | number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchPlaceholder?: string;
  onExportCSV?: (filteredData: T[]) => void;
  actions?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  onExportCSV,
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortColId, setSortColId] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map((c) => c.id));
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);

  // 1. Filter data based on query
  const filteredData = useMemo(() => {
    if (!search) return data;
    
    return data.filter((row) => {
      return columns.some((col) => {
        if (!col.searchable) return false;
        const val = col.sortValue ? col.sortValue(row) : col.accessor(row);
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(search.toLowerCase());
        }
        return false;
      });
    });
  }, [data, columns, search]);

  // 2. Sort data
  const sortedData = useMemo(() => {
    if (!sortColId) return filteredData;

    const col = columns.find((c) => c.id === sortColId);
    if (!col) return filteredData;

    const sorted = [...filteredData].sort((a, b) => {
      const aVal = col.sortValue ? col.sortValue(a) : col.accessor(a);
      const bVal = col.sortValue ? col.sortValue(b) : col.accessor(b);

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();

      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredData, columns, sortColId, sortDirection]);

  // 3. Paginate
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;

  const handleSort = (colId: string) => {
    if (sortColId === colId) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColId(colId);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const toggleColumnVisibility = (id: string) => {
    setVisibleColumns((prev) =>
      prev.includes(id) ? prev.filter((colId) => colId !== id) : [...prev, id]
    );
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const defaultExport = () => {
    if (onExportCSV) {
      onExportCSV(sortedData);
    } else {
      // Default fallback CSV trigger
      const headerRow = columns.filter((col) => visibleColumns.includes(col.id)).map((col) => col.header).join(',');
      const rows = sortedData.map((row) =>
        columns
          .filter((col) => visibleColumns.includes(col.id))
          .map((col) => {
            const val = col.sortValue ? col.sortValue(row) : col.accessor(row);
            const rawText = typeof val === 'string' || typeof val === 'number' ? String(val) : '';
            return `"${rawText.replace(/"/g, '""')}"`;
          })
          .join(',')
      );
      
      const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'dairysphere_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 1. CONTROLS HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-[11px] font-bold text-gray-950 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs focus:ring-3 focus:ring-teal-500/20 focus:border-teal-500 outline-hidden transition"
          />
        </div>

        {/* Visibility & Export & Custom actions */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Column Visibility Selector */}
          <div className="relative">
            <button
              onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Columns</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showVisibilityDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 flex flex-col gap-0.5">
                <span className="text-[8px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1 block">Toggle Columns</span>
                {columns.map((col) => {
                  const visible = visibleColumns.includes(col.id);
                  return (
                    <button
                      key={col.id}
                      onClick={() => toggleColumnVisibility(col.id)}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold rounded-lg text-left transition hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <span className={visible ? 'text-slate-900 dark:text-slate-200' : 'text-slate-400'}>{col.header}</span>
                      {visible && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export Menu trigger */}
          <button
            onClick={defaultExport}
            className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold flex items-center gap-2 uppercase tracking-wider cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {/* Sibling Actions */}
          {actions}
        </div>
      </div>

      {/* 2. MAIN TABLE MATRIX CONTAINER */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 select-none">
                {columns
                  .filter((col) => visibleColumns.includes(col.id))
                  .map((col) => (
                    <th
                      key={col.id}
                      onClick={() => col.sortable && handleSort(col.id)}
                      className={`px-4.5 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 ${
                        col.sortable ? 'cursor-pointer hover:text-slate-800 dark:hover:text-slate-300' : ''
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <ArrowUpDown className={`w-3 h-3 text-gray-400 ${sortColId === col.id ? 'text-teal-600' : ''}`} />
                        )}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-805/40">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.filter((c) => visibleColumns.includes(c.id)).length}
                    className="px-6 py-12 text-center text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest"
                  >
                    No matching records resolved
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30 transition-colors"
                  >
                    {columns
                      .filter((col) => visibleColumns.includes(col.id))
                      .map((col) => (
                        <td
                          key={col.id}
                          className="px-4.5 py-3.5 text-[11px] font-medium text-gray-800 dark:text-slate-300 leading-normal"
                        >
                          {col.accessor(row)}
                        </td>
                      ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. PAGINATION INDEX */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
        {/* Selected Rows count */}
        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          Showing {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
        </span>

        {/* Dynamic page buttons */}
        <div className="flex items-center gap-4">
          {/* Page size controller */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent text-[10px] font-bold text-slate-600 dark:text-slate-300 border-0 focus:ring-0 p-0 pr-6 cursor-pointer"
            >
              {[5, 10, 20, 50].map((sz) => (
                <option key={sz} value={sz} className="dark:bg-slate-900">
                  {sz}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
              <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-lg">{currentPage}</span>
              <span className="text-slate-300">/</span>
              <span>{totalPages}</span>
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
