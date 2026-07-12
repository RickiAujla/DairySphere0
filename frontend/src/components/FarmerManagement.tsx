import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../utils/api';
import { Farmer, SessionData } from '../types';
import { 
  Users, Plus, Search, Filter, Edit, Trash2, Download, Upload, 
  Printer, QrCode, AlertCircle, CheckCircle2, Loader2, ChevronLeft, 
  ChevronRight, Info, Phone, MapPin, CreditCard, Tag, RefreshCw, 
  FileText, Database, Calendar, TrendingUp, Coins, X, Check, Eye
} from 'lucide-react';
import { useToast } from '../context/ToastProvider';
import { useDialog } from '../context/DialogProvider';

interface FarmerManagementProps {
  session: SessionData | null;
}

export const FarmerManagement: React.FC<FarmerManagementProps> = ({ session }) => {
  const { showToast } = useToast();
  const { confirm } = useDialog();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Filters & Search State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'INACTIVE'>('all');
  const [milkFilter, setMilkFilter] = useState<'all' | 'COW' | 'BUFFALO' | 'MIXED'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Active Details Modals
  const [viewingFarmer, setViewingFarmer] = useState<Farmer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  
  // Drag and drop import state
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formContacts, setFormContacts] = useState<string[]>(['']);
  const [formAadhaar, setFormAadhaar] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formGst, setFormGst] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formAccountNumber, setFormAccountNumber] = useState('');
  const [formIfscCode, setFormIfscCode] = useState('');
  const [formUpiId, setFormUpiId] = useState('');
  const [formMilkPreference, setFormMilkPreference] = useState<'COW' | 'BUFFALO' | 'MIXED'>('MIXED');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formTags, setFormTags] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Detail View Sub-Tab
  const [detailTab, setDetailTab] = useState<'profile' | 'financials' | 'idcard'>('profile');

  // RBAC checks
  const isAdminOrManager = useMemo(() => {
    const roleName = session?.user?.role || localStorage.getItem('dairysphere_user_role') || '';
    return ['ADMIN', 'MANAGER'].includes(roleName.toUpperCase());
  }, [session]);

  const loadFarmers = async () => {
    setFetching(true);
    try {
      const data = await api.getFarmers({
        search,
        status: statusFilter,
        milkPreference: milkFilter,
        tag: selectedTag,
        sortBy,
        sortOrder
      });
      setFarmers(data);
      setCurrentPage(1);
    } catch (err: any) {
      showToast(err.message || 'Error fetching farmers directory.', 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, [search, statusFilter, milkFilter, selectedTag, sortBy, sortOrder]);

  // Analytics
  const analytics = useMemo(() => {
    const total = farmers.length;
    const active = farmers.filter(f => f.status === 'ACTIVE').length;
    const inactive = total - active;
    const cowPref = farmers.filter(f => f.milkPreference === 'COW').length;
    const buffaloPref = farmers.filter(f => f.milkPreference === 'BUFFALO').length;
    const mixedPref = farmers.filter(f => f.milkPreference === 'MIXED').length;

    // Estimate "New Farmers" this month
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const newThisMonth = farmers.filter(f => {
      const d = new Date(f.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    return { total, active, inactive, cowPref, buffaloPref, mixedPref, newThisMonth };
  }, [farmers]);

  // Extract all distinct tags for filter menu
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    farmers.forEach(f => {
      if (f.tags && Array.isArray(f.tags)) {
        f.tags.forEach(t => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet);
  }, [farmers]);

  // Handle CRUD Form Open
  const handleOpenCreate = () => {
    setEditingFarmer(null);
    setFormName('');
    setFormAddress('');
    setFormContacts(['']);
    setFormAadhaar('');
    setFormPan('');
    setFormGst('');
    setFormBankName('');
    setFormAccountNumber('');
    setFormIfscCode('');
    setFormUpiId('');
    setFormMilkPreference('MIXED');
    setFormStatus('ACTIVE');
    setFormTags('');
    setFormError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setFormName(farmer.name);
    setFormAddress(farmer.address);
    setFormContacts(farmer.contacts && farmer.contacts.length > 0 ? [...farmer.contacts] : ['']);
    setFormAadhaar(farmer.aadhaar || '');
    setFormPan(farmer.pan || '');
    setFormGst(farmer.gst || '');
    setFormBankName(farmer.bankName || '');
    setFormAccountNumber(farmer.accountNumber || '');
    setFormIfscCode(farmer.ifscCode || '');
    setFormUpiId(farmer.upiId || '');
    setFormMilkPreference(farmer.milkPreference);
    setFormStatus(farmer.status);
    setFormTags(farmer.tags ? farmer.tags.join(', ') : '');
    setFormError(null);
    setFormOpen(true);
  };

  // Dynamic Contact Form Fields
  const handleAddContactField = () => {
    setFormContacts([...formContacts, '']);
  };

  const handleRemoveContactField = (index: number) => {
    if (formContacts.length <= 1) return;
    const updated = [...formContacts];
    updated.splice(index, 1);
    setFormContacts(updated);
  };

  const handleContactChange = (index: number, val: string) => {
    const updated = [...formContacts];
    updated[index] = val;
    setFormContacts(updated);
  };

  // Form Submission
  const handleSaveFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Dynamic validations
    if (!formName.trim()) {
      setFormError('Farmer Name is required.');
      return;
    }
    if (!formAddress.trim()) {
      setFormError('Physical Village/VPO Address is required.');
      return;
    }

    const filteredContacts = formContacts.map(c => c.trim()).filter(Boolean);
    if (filteredContacts.length === 0) {
      setFormError('At least one functional Contact Number is required.');
      return;
    }

    // Optional Aadhaar Validation (12-digit format check)
    if (formAadhaar.trim() && !/^\d{4}-\d{4}-\d{4}$/.test(formAadhaar.trim()) && !/^\d{12}$/.test(formAadhaar.trim())) {
      setFormError('Aadhaar number must be 12 digits (e.g. 1234-5678-9012 or 123456789012).');
      return;
    }

    // Optional PAN Validation (5 Letters, 4 Digits, 1 Letter)
    if (formPan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formPan.trim())) {
      setFormError('Invalid PAN Format. Must match standard alphanumeric identifier (e.g., ABCDE1234F).');
      return;
    }

    // Optional Bank Account & IFSC Validation
    if (formIfscCode.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(formIfscCode.trim())) {
      setFormError('Invalid IFSC Code. Must be 11 characters (e.g., SBIN0001234).');
      return;
    }

    // Optional UPI Format Validation
    if (formUpiId.trim() && !/^[\w.-]+@[\w.-]+$/.test(formUpiId.trim())) {
      setFormError('Invalid UPI ID Format (e.g., farmer@upi or name@bank).');
      return;
    }

    setLoading(true);
    const bodyPayload = {
      name: formName.trim(),
      address: formAddress.trim(),
      contacts: filteredContacts,
      aadhaar: formAadhaar.trim() ? formAadhaar.trim() : null,
      pan: formPan.toUpperCase().trim() ? formPan.toUpperCase().trim() : null,
      gst: formGst.toUpperCase().trim() ? formGst.toUpperCase().trim() : null,
      bankName: formBankName.trim() ? formBankName.trim() : null,
      accountNumber: formAccountNumber.trim() ? formAccountNumber.trim() : null,
      ifscCode: formIfscCode.toUpperCase().trim() ? formIfscCode.toUpperCase().trim() : null,
      upiId: formUpiId.trim() ? formUpiId.trim() : null,
      milkPreference: formMilkPreference,
      status: formStatus,
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      if (editingFarmer) {
        const updated = await api.updateFarmer(editingFarmer.id, bodyPayload);
        showToast(`Farmer profile for '${updated.name}' updated successfully.`, 'success');
        if (viewingFarmer && viewingFarmer.id === editingFarmer.id) {
          setViewingFarmer(updated);
        }
      } else {
        const created = await api.createFarmer(bodyPayload);
        showToast(`Farmer '${created.name}' registered with code ${created.code}.`, 'success');
      }
      setFormOpen(false);
      loadFarmers();
    } catch (err: any) {
      setFormError(err.message || 'Error saving farmer record.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDeleteFarmer = (id: string, name: string, code: string) => {
    if (!isAdminOrManager) {
      showToast('RBAC Access Denied: Administrator or Manager role required to delete records.', 'error');
      return;
    }

    confirm({
      title: 'Deregister Farmer Profile?',
      message: `Are you sure you want to permanently delete '${name}' (${code})? This action will generate governance logs and is irreversible.`,
      confirmText: 'Deregister Profile',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.deleteFarmer(id);
          showToast(`Farmer '${name}' deregistered successfully.`, 'success');
          if (viewingFarmer && viewingFarmer.id === id) {
            setViewingFarmer(null);
          }
          loadFarmers();
        } catch (err: any) {
          showToast(err.message || 'Failed to delete farmer profile.', 'error');
        }
      }
    });
  };

  // Bulk Import CSV
  const handleImportCSV = async (file: File) => {
    try {
      await api.validateFileUpload(file, ['csv']);
    } catch (err: any) {
      showToast(err.message || 'File verification failed.', 'error');
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length <= 1) {
          showToast('CSV is empty or missing headers.', 'error');
          setLoading(false);
          return;
        }

        // Simple CSV parser supporting double quotes
        const parseRow = (rowText: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < rowText.length; i++) {
            const char = rowText[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = parseRow(lines[0]).map(h => h.replace(/^["']|["']$/g, '').toLowerCase().trim());
        const nameIdx = headers.indexOf('name');
        const addrIdx = headers.indexOf('address');
        const contactIdx = headers.indexOf('contacts') !== -1 ? headers.indexOf('contacts') : headers.indexOf('phone');
        const aadhaarIdx = headers.indexOf('aadhaar');
        const panIdx = headers.indexOf('pan');
        const milkIdx = headers.indexOf('milkpreference') !== -1 ? headers.indexOf('milkpreference') : headers.indexOf('milk_preference');
        const tagsIdx = headers.indexOf('tags');

        if (nameIdx === -1 || addrIdx === -1) {
          showToast('CSV must contain at least "name" and "address" columns.', 'error');
          setLoading(false);
          return;
        }

        const parsedItems = [];
        for (let i = 1; i < lines.length; i++) {
          const cells = parseRow(lines[i]);
          if (cells.length > Math.max(nameIdx, addrIdx)) {
            const rowData: any = {
              name: cells[nameIdx] || '',
              address: cells[addrIdx] || '',
              contacts: contactIdx !== -1 && cells[contactIdx] ? cells[contactIdx] : '',
              aadhaar: aadhaarIdx !== -1 && cells[aadhaarIdx] ? cells[aadhaarIdx] : null,
              pan: panIdx !== -1 && cells[panIdx] ? cells[panIdx] : null,
              milkPreference: milkIdx !== -1 && cells[milkIdx] ? cells[milkIdx] : 'MIXED',
              tags: tagsIdx !== -1 && cells[tagsIdx] ? cells[tagsIdx] : '',
              status: 'ACTIVE'
            };
            parsedItems.push(rowData);
          }
        }

        const response = await api.importFarmers(parsedItems);
        showToast(`Successful bulk import: ${response.successCount} farmer registries synchronized.`, 'success');
        loadFarmers();
      } catch (err: any) {
        showToast('Failed to parse and upload farmers CSV.', 'error');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleImportCSV(file);
    } else {
      showToast('Please drop a valid .csv template file.', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportCSV(file);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Farmer Code', 'Full Name', 'Address', 'Contact Numbers', 'Aadhaar', 'PAN', 
      'GST', 'Bank Name', 'Account Number', 'IFSC Code', 'UPI ID', 
      'Milk Preference', 'Status', 'Tags', 'Registered Date'
    ];
    const csvRows = [headers.join(',')];

    farmers.forEach(f => {
      const contactsStr = f.contacts ? f.contacts.join(' | ') : '';
      const tagsStr = f.tags ? f.tags.join(' | ') : '';
      const row = [
        `"${f.code}"`,
        `"${f.name.replace(/"/g, '""')}"`,
        `"${f.address.replace(/"/g, '""')}"`,
        `"${contactsStr}"`,
        `"${f.aadhaar || ''}"`,
        `"${f.pan || ''}"`,
        `"${f.gst || ''}"`,
        `"${f.bankName || ''}"`,
        `"${f.accountNumber || ''}"`,
        `"${f.ifscCode || ''}"`,
        `"${f.upiId || ''}"`,
        `"${f.milkPreference}"`,
        `"${f.status}"`,
        `"${tagsStr}"`,
        `"${new Date(f.createdAt).toLocaleDateString()}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dairysphere_farmers_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Farmer directory exported successfully to CSV.', 'success');
  };

  // Printing Layout
  const handlePrintFarmerList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up blocked. Please enable pop-ups to print the directory.', 'error');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>DairySphere - Farmer Registry Directory</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1e293b; }
            h1 { font-size: 20px; font-weight: 800; margin-bottom: 5px; color: #0d9488; text-transform: uppercase; letter-spacing: -0.5px; }
            p.sub { font-size: 11px; color: #64748b; margin-top: 0; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 700; color: #475569; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
            .badge-active { background-color: #d1fae5; color: #065f46; }
            .badge-inactive { background-color: #fee2e2; color: #991b1b; }
            .footer { margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>DairySphere Farmer Registries Directory</h1>
          <p class="sub">Active Tenant Space • Immutable Governance Records • Exported: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Farmer Code</th>
                <th>Farmer Name</th>
                <th>Primary Contact</th>
                <th>Milk Preference</th>
                <th>Status</th>
                <th>Tags</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              ${farmers.map(f => `
                <tr>
                  <td><strong>${f.code}</strong></td>
                  <td>${f.name}</td>
                  <td>${f.contacts[0] || '—'}</td>
                  <td>${f.milkPreference}</td>
                  <td><span class="badge ${f.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}">${f.status}</span></td>
                  <td>${f.tags ? f.tags.join(', ') : '—'}</td>
                  <td>${f.address}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            DairySphere Cloud Native Enterprise Platform Suite © ${new Date().getFullYear()} • Dynamic Registry Integrity Verified
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Print Single ID Card
  const handlePrintSingleIDCard = (farmer: Farmer) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Pop-up blocked. Please enable pop-ups to print the ID Card.', 'error');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>DairySphere Farmer Identity Card - ${farmer.code}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f1f5f9; }
            .card { width: 330px; height: 490px; background: white; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; display: flex; flex-direction: column; position: relative; }
            .card-header { background: linear-gradient(135deg, #0f766e, #0d9488); padding: 20px; color: white; text-align: center; }
            .card-header h2 { margin: 0; font-size: 18px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; }
            .card-header p { margin: 3px 0 0; font-size: 9px; opacity: 0.8; font-weight: bold; letter-spacing: 1px; }
            .avatar-container { display: flex; justify-content: center; margin-top: -30px; margin-bottom: 12px; z-index: 10; }
            .avatar { width: 80px; height: 80px; border-radius: 50%; background: #f8fafc; border: 4px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; justify-content: center; align-items: center; color: #0d9488; font-size: 32px; font-weight: bold; }
            .card-body { padding: 0 24px; flex-grow: 1; display: flex; flex-direction: column; align-items: center; }
            .name { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 4px; text-align: center; }
            .code-badge { background-color: #f1f5f9; border: 1px solid #e2e8f0; color: #0f766e; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; font-family: monospace; margin-bottom: 15px; }
            .info-grid { width: 100%; border-top: 1px solid #f1f5f9; padding-top: 12px; margin-bottom: 15px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; }
            .info-label { color: #64748b; font-weight: bold; }
            .info-value { color: #1e293b; font-weight: 700; text-align: right; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .qr-container { display: flex; flex-direction: column; align-items: center; margin-top: auto; padding-bottom: 20px; }
            .barcode { font-family: monospace; font-size: 10px; letter-spacing: 4px; margin-top: 4px; color: #64748b; }
            .seal { position: absolute; bottom: 80px; right: 25px; width: 50px; height: 50px; border: 2px dashed rgba(13, 148, 136, 0.4); border-radius: 50%; display: flex; justify-content: center; align-items: center; transform: rotate(-15deg); color: rgba(13, 148, 136, 0.5); font-size: 8px; font-weight: 900; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="card-header">
              <h2>DairySphere</h2>
              <p>FARMER LOGISTICS PASS</p>
            </div>
            <div class="avatar-container">
              <div class="avatar">${farmer.name.charAt(0)}</div>
            </div>
            <div class="card-body">
              <div class="name">${farmer.name}</div>
              <div class="code-badge">${farmer.code}</div>
              
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Preference:</span>
                  <span class="info-value" style="text-transform: uppercase;">${farmer.milkPreference} MILK</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Contact:</span>
                  <span class="info-value">${farmer.contacts[0] || '—'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Address:</span>
                  <span class="info-value">${farmer.address}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Status:</span>
                  <span class="info-value" style="color: ${farmer.status === 'ACTIVE' ? '#0f766e' : '#b91c1c'}; font-weight: 900;">${farmer.status}</span>
                </div>
              </div>

              <div class="seal">CO-OP<br>VERIFIED</div>

              <div class="qr-container">
                <!-- Inline Dynamic SVG Barcode vector -->
                <svg width="150" height="35" viewBox="0 0 150 35">
                  <rect width="150" height="35" fill="#ffffff"/>
                  <line x1="10" y1="5" x2="10" y2="30" stroke="#1e293b" stroke-width="3"/>
                  <line x1="18" y1="5" x2="18" y2="30" stroke="#1e293b" stroke-width="1"/>
                  <line x1="22" y1="5" x2="22" y2="30" stroke="#1e293b" stroke-width="2"/>
                  <line x1="28" y1="5" x2="28" y2="30" stroke="#1e293b" stroke-width="4"/>
                  <line x1="36" y1="5" x2="36" y2="30" stroke="#1e293b" stroke-width="1"/>
                  <line x1="42" y1="5" x2="42" y2="30" stroke="#1e293b" stroke-width="3"/>
                  <line x1="48" y1="5" x2="48" y2="30" stroke="#1e293b" stroke-width="2"/>
                  <line x1="56" y1="5" x2="56" y2="30" stroke="#1e293b" stroke-width="1"/>
                  <line x1="60" y1="5" x2="60" y2="30" stroke="#1e293b" stroke-width="3"/>
                  <line x1="68" y1="5" x2="68" y2="30" stroke="#1e293b" stroke-width="4"/>
                  <line x1="74" y1="5" x2="74" y2="30" stroke="#1e293b" stroke-width="1"/>
                  <line x1="80" y1="5" x2="80" y2="30" stroke="#1e293b" stroke-width="2"/>
                  <line x1="88" y1="5" x2="88" y2="30" stroke="#1e293b" stroke-width="3"/>
                  <line x1="94" y1="5" x2="94" y2="30" stroke="#1e293b" stroke-width="1"/>
                  <line x1="98" y1="5" x2="98" y2="30" stroke="#1e293b" stroke-width="2"/>
                  <line x1="104" y1="5" x2="104" y2="30" stroke="#1e293b" stroke-width="4"/>
                  <line x1="112" y1="5" x2="112" y2="30" stroke="#1e293b" stroke-width="1"/>
                  <line x1="118" y1="5" x2="118" y2="30" stroke="#1e293b" stroke-width="3"/>
                  <line x1="126" y1="5" x2="126" y2="30" stroke="#1e293b" stroke-width="2"/>
                  <line x1="132" y1="5" x2="132" y2="30" stroke="#1e293b" stroke-width="1"/>
                  <line x1="140" y1="5" x2="140" y2="30" stroke="#1e293b" stroke-width="3"/>
                </svg>
                <div class="barcode">${farmer.code}</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Pagination helper
  const paginatedFarmers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return farmers.slice(startIndex, startIndex + itemsPerPage);
  }, [farmers, currentPage]);

  const totalPages = Math.ceil(farmers.length / itemsPerPage) || 1;

  return (
    <div className="space-y-6 animate-fade-in pb-12 select-none">
      {/* Module Title card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40 uppercase tracking-widest">
            Module Stage 5.2
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">
            Farmer Registries Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create, manage, and verify cooperative member profiles, preferences, logistics passes, and bank settlements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] bg-slate-50 dark:bg-slate-950 px-3 py-1 rounded-full text-slate-500 font-mono border border-slate-100 dark:border-slate-800">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
            RBAC Guard Active
          </span>
        </div>
      </div>

      {/* Analytics Dashboard section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-widest">Total Registered Members</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{analytics.total}</span>
            <span className="text-[11px] font-bold text-emerald-500 flex items-center bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Direct
            </span>
          </div>
          <p className="text-[10px] text-slate-400">Active participants in dairy pooling network.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-widest">Active Poolers</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{analytics.active}</span>
            <span className="text-[11px] text-slate-400 font-medium">({analytics.total > 0 ? Math.round((analytics.active / analytics.total) * 100) : 0}%)</span>
          </div>
          <p className="text-[10px] text-slate-400">Actively supplying milk arrays this period.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-widest">New Enrolls (Month)</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">+{analytics.newThisMonth}</span>
            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Growth</span>
          </div>
          <p className="text-[10px] text-slate-400">Onboarded in active calendar month.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-widest">Milk Supply Splits</span>
            <Coins className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <span>COW: {analytics.cowPref}</span>
              <span>BUF: {analytics.buffaloPref}</span>
              <span>MIX: {analytics.mixedPref}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
              <div style={{ width: `${analytics.total > 0 ? (analytics.cowPref / analytics.total) * 100 : 0}%` }} className="bg-teal-600" title="Cow Preference"></div>
              <div style={{ width: `${analytics.total > 0 ? (analytics.buffaloPref / analytics.total) * 100 : 0}%` }} className="bg-orange-500" title="Buffalo Preference"></div>
              <div style={{ width: `${analytics.total > 0 ? (analytics.mixedPref / analytics.total) * 100 : 0}%` }} className="bg-slate-400" title="Mixed Preference"></div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">Dynamic logistics segregation.</p>
        </div>
      </div>

      {/* Main UI Body */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
            <div className="relative flex-1 sm:flex-initial min-w-[240px]">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by code, name, contact, GST..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none transition-all"
              />
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-slate-700 dark:text-slate-300 outline-none cursor-pointer pr-1"
              >
                <option value="all">Status: All</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>

            {/* Filter Milk Preference */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={milkFilter}
                onChange={(e) => setMilkFilter(e.target.value as any)}
                className="bg-transparent text-slate-700 dark:text-slate-300 outline-none cursor-pointer pr-1"
              >
                <option value="all">Supply Preference: All</option>
                <option value="COW">Cow Milk</option>
                <option value="BUFFALO">Buffalo Milk</option>
                <option value="MIXED">Mixed Milk</option>
              </select>
            </div>

            {/* Tags dropdown filter */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="bg-transparent text-slate-700 dark:text-slate-300 outline-none cursor-pointer pr-1"
                >
                  <option value="all">Tag: All</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto xl:justify-end">
            <button
              onClick={handlePrintFarmerList}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-100 dark:border-slate-800"
              title="Print Directory"
            >
              <Printer className="w-3.5 h-3.5" /> Print List
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-100 dark:border-slate-800"
              title="Export CSV Directory"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-all border border-slate-100 dark:border-slate-800">
              <Upload className="w-3.5 h-3.5" /> Import CSV
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> Register Farmer
            </button>
          </div>
        </div>

        {/* Drag and Drop Zone overlay */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-300 ${
            dragOver
              ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-md'
              : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'
          }`}
        >
          {dragOver ? (
            <div className="text-center py-12 text-teal-600 dark:text-teal-400">
              <Upload className="w-12 h-12 mx-auto mb-3 animate-bounce" />
              <p className="text-sm font-extrabold">Drop farmers .csv file here to import...</p>
              <p className="text-[10px] text-slate-400 mt-1">Automatic verification and sequencing code generators will apply.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fetching ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-400 mt-3 animate-pulse">Querying Farmer ledger registry...</span>
                </div>
              ) : (
                <>
                  {/* Table Layout */}
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
                        <tr>
                          <th className="px-4 py-3.5">Farmer ID / Code</th>
                          <th className="px-4 py-3.5">Name</th>
                          <th className="px-4 py-3.5">Contact Number</th>
                          <th className="px-4 py-3.5">Preference</th>
                          <th className="px-4 py-3.5">Village Address</th>
                          <th className="px-4 py-3.5">Tags</th>
                          <th className="px-4 py-3.5">Status</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                        {paginatedFarmers.length > 0 ? (
                          paginatedFarmers.map((f) => (
                            <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-all">
                              <td className="px-4 py-3.5">
                                <span className="font-mono bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded text-teal-700 dark:text-teal-400 border border-slate-100 dark:border-slate-800/60 font-bold">
                                  {f.code}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="font-extrabold text-slate-950 dark:text-slate-100 block">{f.name}</span>
                                <span className="text-[10px] text-slate-400 font-semibold font-mono block">Registered: {new Date(f.createdAt).toLocaleDateString()}</span>
                              </td>
                              <td className="px-4 py-3.5 font-mono text-xs">
                                <div className="flex flex-col gap-0.5">
                                  {f.contacts && f.contacts.map((c, i) => (
                                    <span key={i} className="flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black ${
                                  f.milkPreference === 'COW'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 border border-emerald-100 dark:border-emerald-900/30'
                                    : f.milkPreference === 'BUFFALO'
                                    ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 border border-orange-100 dark:border-orange-900/30'
                                    : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 border border-indigo-100 dark:border-indigo-900/30'
                                }`}>
                                  {f.milkPreference}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 max-w-xs truncate text-slate-500 dark:text-slate-400" title={f.address}>
                                <span className="inline-flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  {f.address}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex flex-wrap gap-1">
                                  {f.tags && f.tags.length > 0 ? (
                                    f.tags.map((tag, idx) => (
                                      <span key={idx} className="bg-slate-50 dark:bg-slate-950 text-slate-500 border border-slate-100 dark:border-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                        {tag}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">No tags</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  f.status === 'ACTIVE'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40'
                                    : 'bg-slate-50 dark:bg-slate-950/30 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${f.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                                  {f.status}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setViewingFarmer(f);
                                    setDetailTab('profile');
                                  }}
                                  className="p-1 hover:text-teal-600 transition-colors text-slate-400 inline-flex items-center"
                                  title="View Farmer Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(f)}
                                  className="p-1 hover:text-teal-600 transition-colors text-slate-400 inline-flex items-center"
                                  title="Modify Profile"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFarmer(f.id, f.name, f.code)}
                                  className="p-1 hover:text-rose-600 transition-colors text-slate-400 inline-flex items-center"
                                  title="Deregister Member"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-4 py-16 text-center text-slate-400 font-bold">
                              No farmer registries match your parameters or search query.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination control */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        Page {currentPage} of {totalPages} ({farmers.length} total members matched)
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 disabled:opacity-40"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VIEW DETAILS DRAWER Overlay */}
      {viewingFarmer && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex justify-end">
          <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl p-6 flex flex-col justify-between animate-slide-in overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 flex items-center justify-center font-extrabold text-base border border-teal-100 dark:border-teal-900/30">
                    {viewingFarmer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{viewingFarmer.name}</h3>
                    <p className="text-[11px] font-bold text-slate-400 font-mono flex items-center gap-1.5">
                      Code: {viewingFarmer.code}
                      <span className={`w-2 h-2 rounded-full ${viewingFarmer.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                      {viewingFarmer.status}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingFarmer(null)}
                  className="p-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Subtabs inside Drawer */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 gap-1 p-0.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl">
                {[
                  { id: 'profile', label: 'Farmer Profile', icon: <Users className="w-3.5 h-3.5" /> },
                  { id: 'financials', label: 'Financial Matrix', icon: <CreditCard className="w-3.5 h-3.5" /> },
                  { id: 'idcard', label: 'Logistics Pass ID', icon: <QrCode className="w-3.5 h-3.5" /> }
                ].map(subTab => (
                  <button
                    key={subTab.id}
                    onClick={() => setDetailTab(subTab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold tracking-tight transition-all ${
                      detailTab === subTab.id
                        ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/40 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {subTab.icon}
                    {subTab.label}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              {detailTab === 'profile' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="bg-slate-50/50 dark:bg-slate-950/10 p-4 rounded-xl space-y-3.5 border border-slate-100 dark:border-slate-800/40">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Physical Address</span>
                      <p className="font-extrabold text-slate-800 dark:text-slate-200 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        {viewingFarmer.address}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Numbers</span>
                      <div className="space-y-1">
                        {viewingFarmer.contacts && viewingFarmer.contacts.map((c, i) => (
                          <p key={i} className="font-mono font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            {c}
                            {i === 0 && <span className="text-[9px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950/20 px-1.5 rounded uppercase tracking-wider">Primary</span>}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Milk Preference</span>
                        <span className="inline-flex mt-1 text-[10px] font-black bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900/40 px-2 py-0.5 rounded uppercase">
                          {viewingFarmer.milkPreference} Milk
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cooperative Status</span>
                        <span className="inline-flex mt-1 text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 px-2 py-0.5 rounded-full uppercase">
                          {viewingFarmer.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Assigned Tags</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {viewingFarmer.tags && viewingFarmer.tags.length > 0 ? (
                          viewingFarmer.tags.map((tag, i) => (
                            <span key={i} className="bg-slate-50 dark:bg-slate-950 text-slate-500 border border-slate-100 dark:border-slate-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No tags associated</span>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/60 pt-3 flex justify-between text-[10px] text-slate-400 font-semibold font-mono">
                      <span>Onboarded: {new Date(viewingFarmer.createdAt).toLocaleString()}</span>
                      <span>Last Updated: {new Date(viewingFarmer.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'financials' && (
                <div className="space-y-4 animate-fade-in text-xs">
                  <div className="bg-slate-50/50 dark:bg-slate-950/10 p-4 rounded-xl space-y-4 border border-slate-100 dark:border-slate-800/40">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-tight flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-teal-600" />
                        Settlement Bank Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3.5 bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bank Name</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{viewingFarmer.bankName || 'Not Set'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">IFSC Code</span>
                          <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200">{viewingFarmer.ifscCode || 'Not Set'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Account Number</span>
                          <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200">{viewingFarmer.accountNumber ? viewingFarmer.accountNumber.replace(/.(?=.{4})/g, '*') : 'Not Set'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-tight flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-yellow-500" />
                        UPI Identification
                      </h4>
                      <div className="bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 font-mono">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">UPI VPA String</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">{viewingFarmer.upiId || 'Not Configured'}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2 uppercase tracking-tight flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Governance / Tax IDs (Optional)
                      </h4>
                      <div className="grid grid-cols-2 gap-3 bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 font-mono">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Aadhaar (UIDAI)</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{viewingFarmer.aadhaar ? viewingFarmer.aadhaar.replace(/.(?=.{4})/g, '*') : 'Not Provided'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">PAN (IT Dept)</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{viewingFarmer.pan ? viewingFarmer.pan.replace(/.(?=.{3})/g, '*') : 'Not Provided'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">GST Registration</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">{viewingFarmer.gst || 'Exempt / Not Provided'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'idcard' && (
                <div className="space-y-4 animate-fade-in text-xs flex flex-col items-center">
                  <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-[310px] h-[450px] rounded-2xl shadow-md overflow-hidden flex flex-col relative">
                    <div className="bg-gradient-to-r from-teal-800 to-teal-600 p-4 text-center text-white">
                      <h4 className="text-sm font-black uppercase tracking-tight">DairySphere</h4>
                      <p className="text-[8px] tracking-widest font-bold opacity-85 mt-0.5">FARMER LOGISTICS PASS</p>
                    </div>
                    <div className="flex justify-center -mt-8 z-10">
                      <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 border-4 border-white dark:border-slate-950 shadow flex items-center justify-center font-black text-xl text-teal-600">
                        {viewingFarmer.name.charAt(0)}
                      </div>
                    </div>
                    <div className="p-4 flex-grow flex flex-col items-center">
                      <div className="text-sm font-black text-slate-900 dark:text-slate-100">{viewingFarmer.name}</div>
                      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[10px] px-2.5 py-0.5 rounded-full font-mono text-teal-700 dark:text-teal-400 font-extrabold mt-1">
                        {viewingFarmer.code}
                      </div>

                      <div className="w-full border-t border-slate-100 dark:border-slate-800 mt-3 pt-3 space-y-1.5 text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">MILK SPLIT:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase">{viewingFarmer.milkPreference}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">PRIMARY:</span>
                          <span className="font-mono font-extrabold text-slate-800 dark:text-slate-200">{viewingFarmer.contacts[0] || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-bold">ADDRESS:</span>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{viewingFarmer.address}</span>
                        </div>
                      </div>

                      {/* Barcode vector layout */}
                      <div className="mt-auto flex flex-col items-center pb-2">
                        <svg width="150" height="30" viewBox="0 0 150 30" className="opacity-80">
                          <rect width="150" height="30" fill="#ffffff"/>
                          <line x1="5" y1="2" x2="5" y2="28" stroke="#1e293b" stroke-width="2"/>
                          <line x1="12" y1="2" x2="12" y2="28" stroke="#1e293b" stroke-width="1"/>
                          <line x1="15" y1="2" x2="15" y2="28" stroke="#1e293b" stroke-width="3"/>
                          <line x1="22" y1="2" x2="22" y2="28" stroke="#1e293b" stroke-width="1"/>
                          <line x1="26" y1="2" x2="26" y2="28" stroke="#1e293b" stroke-width="2"/>
                          <line x1="32" y1="2" x2="32" y2="28" stroke="#1e293b" stroke-width="4"/>
                          <line x1="40" y1="2" x2="40" y2="28" stroke="#1e293b" stroke-width="1"/>
                          <line x1="45" y1="2" x2="45" y2="28" stroke="#1e293b" stroke-width="3"/>
                          <line x1="50" y1="2" x2="50" y2="28" stroke="#1e293b" stroke-width="1"/>
                          <line x1="55" y1="2" x2="55" y2="28" stroke="#1e293b" stroke-width="2"/>
                          <line x1="62" y1="2" x2="62" y2="28" stroke="#1e293b" stroke-width="4"/>
                          <line x1="70" y1="2" x2="70" y2="28" stroke="#1e293b" stroke-width="1"/>
                          <line x1="75" y1="2" x2="75" y2="28" stroke="#1e293b" stroke-width="3"/>
                          <line x1="82" y1="2" x2="82" y2="28" stroke="#1e293b" stroke-width="2"/>
                          <line x1="88" y1="2" x2="88" y2="28" stroke="#1e293b" stroke-width="1"/>
                          <line x1="94" y1="2" x2="94" y2="28" stroke="#1e293b" stroke-width="3"/>
                          <line x1="102" y1="2" x2="102" y2="28" stroke="#1e293b" stroke-width="4"/>
                          <line x1="110" y1="2" x2="110" y2="28" stroke="#1e293b" stroke-width="1"/>
                          <line x1="115" y1="2" x2="115" y2="28" stroke="#1e293b" stroke-width="2"/>
                          <line x1="122" y1="2" x2="122" y2="28" stroke="#1e293b" stroke-width="3"/>
                          <line x1="128" y1="2" x2="128" y2="28" stroke="#1e293b" stroke-width="1"/>
                          <line x1="135" y1="2" x2="135" y2="28" stroke="#1e293b" stroke-width="3"/>
                        </svg>
                        <span className="font-mono text-[9px] text-slate-400 tracking-wider mt-1">{viewingFarmer.code}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePrintSingleIDCard(viewingFarmer)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm w-full max-w-[310px] justify-center"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Member ID Card
                  </button>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-2">
              <button
                onClick={() => handleOpenEdit(viewingFarmer)}
                className="flex-1 py-2 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 transition-all flex items-center justify-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Profile
              </button>
              <button
                onClick={() => handleDeleteFarmer(viewingFarmer.id, viewingFarmer.name, viewingFarmer.code)}
                className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Deregister
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT FARMER FORM MODAL Overlay */}
      {formOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {editingFarmer ? 'Modify Farmer Profile' : 'Register New Cooperative Member'}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  {editingFarmer ? `Editing Record: ${editingFarmer.code}` : 'System Auto-Generated Sequencing Code'}
                </p>
              </div>
              <button 
                onClick={() => setFormOpen(false)}
                className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFarmer} className="flex-grow overflow-y-auto space-y-4 py-4 pr-1">
              {formError && (
                <div className="flex items-start gap-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-3 rounded-xl text-rose-800 dark:text-rose-400 text-xs font-bold">
                  <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* General details group */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-3.5">
                <h4 className="text-[10px] font-extrabold text-teal-600 uppercase tracking-widest">Section 1: General & Contact Particulars</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sukhdev Singh"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Milk Pooling Preference</label>
                    <select
                      value={formMilkPreference}
                      onChange={(e) => setFormMilkPreference(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer"
                    >
                      <option value="MIXED">Mixed Milk</option>
                      <option value="COW">Cow Only</option>
                      <option value="BUFFALO">Buffalo Only</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Physical Village Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VPO Jandiala, Amritsar, Punjab"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                </div>

                {/* Multiple Contacts */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contact Numbers *</label>
                    <button
                      type="button"
                      onClick={handleAddContactField}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 hover:text-teal-700 bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded"
                    >
                      <Plus className="w-3 h-3" /> Add Number
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formContacts.map((contact, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] text-slate-400 font-bold w-6">#{idx + 1}</span>
                        <input
                          type="text"
                          required={idx === 0}
                          placeholder="e.g. +91 98765 43210"
                          value={contact}
                          onChange={(e) => handleContactChange(idx, e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                        />
                        {formContacts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveContactField(idx)}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Financial registries details group */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-3.5">
                <h4 className="text-[10px] font-extrabold text-teal-600 uppercase tracking-widest">Section 2: Bank Settlement & Financial particulars</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. State Bank of India"
                      value={formBankName}
                      onChange={(e) => setFormBankName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. SBIN0001234"
                      value={formIfscCode}
                      onChange={(e) => setFormIfscCode(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-semibold uppercase focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Bank Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 30123456789"
                      value={formAccountNumber}
                      onChange={(e) => setFormAccountNumber(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">UPI ID (VPA)</label>
                    <input
                      type="text"
                      placeholder="e.g. name@paytm"
                      value={formUpiId}
                      onChange={(e) => setFormUpiId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tax registries details group */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-3.5">
                <h4 className="text-[10px] font-extrabold text-teal-600 uppercase tracking-widest">Section 3: Statutory IDs & Metadata tags</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Aadhaar Number (UIDAI)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1234-5678-9012"
                      value={formAadhaar}
                      onChange={(e) => setFormAadhaar(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">PAN (10 alphanumeric)</label>
                    <input
                      type="text"
                      placeholder="e.g. ABCDE1234F"
                      value={formPan}
                      onChange={(e) => setFormPan(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-semibold uppercase focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">GST IN (If Applicable)</label>
                    <input
                      type="text"
                      placeholder="e.g. 03ABCDE1234F1Z5"
                      value={formGst}
                      onChange={(e) => setFormGst(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-semibold uppercase focus:ring-1 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Farmer Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-teal-500 outline-none cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE Pooler</option>
                      <option value="INACTIVE">INACTIVE Pooler</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Farmer Categorization Tags (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Premium, Bulk Supplier, Organic, Low Fat"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-teal-500 outline-none"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">Separate labels with commas to easily filter them in the list.</span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-40"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Member Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
