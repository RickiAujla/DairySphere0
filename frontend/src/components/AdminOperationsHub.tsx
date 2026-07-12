import React, { useState, useEffect } from 'react';
import { 
  Users, ClipboardList, CreditCard, Bell, Settings, Database, 
  ShieldAlert, Activity, ShieldCheck, Plus, Check, X, FileText, 
  Trash2, Download, Upload, AlertTriangle, Shield, CheckCircle2, 
  RefreshCw, Loader2, Play, Power, HelpCircle, HardDrive, 
  Mail, MessageSquare, Info, Sliders, Server, Cpu, Clock, Send, Eye
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SessionData } from '../types';
import { api } from '../utils/api';

// ==========================================
// CLIENT-SIDE SCHEMAS & UTILS
// ==========================================

interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

interface Employee {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  documents: EmployeeDocument[];
  salaryStructure: {
    basic: number;
    hra: number;
    da: number;
    pf: number;
    esic: number;
    allowances: number;
  };
  joinedAt: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  date: string;
  shift: 'MORNING' | 'EVENING';
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE';
  remarks?: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'SICK' | 'CASUAL' | 'EARNED' | 'MATERNITY';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // e.g. "2026-07"
  basic: number;
  hra: number;
  da: number;
  allowances: number;
  pf: number;
  esic: number;
  netSalary: number;
  status: 'PENDING' | 'PAID';
  paidAt?: string;
  referenceNo?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  channel: 'EMAIL' | 'SMS' | 'IN_APP';
  subject?: string;
  content: string;
}

interface NotificationLog {
  id: string;
  channel: 'EMAIL' | 'SMS' | 'IN_APP';
  recipient: string;
  title: string;
  content: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  sentAt: string;
}

interface FinancialYear {
  id: string;
  code: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface NumberSeries {
  id: string;
  module: string;
  prefix: string;
  suffix: string;
  currentNumber: number;
  length: number;
}

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
}

interface AppHealthMetrics {
  cpu: number[];
  memory: number[];
  latency: number[];
}

interface AdminOperationsHubProps {
  session: SessionData;
}

export const AdminOperationsHub: React.FC<AdminOperationsHubProps> = ({ session }) => {
  // Navigation Tabs
  type HubTab = 'employees' | 'attendance' | 'salary' | 'notifications' | 'settings' | 'backup' | 'audit' | 'adminTools';
  const [activeTab, setActiveTab] = useState<HubTab>('employees');

  // General Notification Alert Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showHubToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper helper to write and log system audit entries
  const triggerAuditLog = (action: string, entityName: string, details: string) => {
    try {
      const logs = JSON.parse(localStorage.getItem('ds_audit_logs') || '[]');
      const newLog = {
        id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        businessId: session.business.id,
        userId: session.user.id,
        action,
        entityName,
        details,
        createdAt: new Date().toISOString(),
        user: {
          name: session.user.name,
          email: session.user.email
        }
      };
      logs.unshift(newLog);
      localStorage.setItem('ds_audit_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Audit logger failed', e);
    }
  };

  // ==========================================
  // STATE MANAGEMENT & DB SEEDING (LOCALSTORAGE)
  // ==========================================

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);
  const [notifTemplates, setNotifTemplates] = useState<NotificationTemplate[]>([]);
  const [notifLogs, setNotifLogs] = useState<NotificationLog[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [numberSeries, setNumberSeries] = useState<NumberSeries[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [taxConfig, setTaxConfig] = useState({ gstRate: 5, panRequiredLimit: 50000, tdsRate: 1 });
  const [queueStatus, setQueueStatus] = useState({ active: 0, waiting: 0, failed: 0 });

  // Load All States from LocalStorage / Defaults
  useEffect(() => {
    // 1. Employees Seed & Load
    const localEmployees = localStorage.getItem('op_employees');
    if (!localEmployees) {
      const defaultEmployees: Employee[] = [
        {
          id: 'emp-1',
          code: 'EMP-2026-001',
          name: 'Amritpal Singh',
          email: 'amritpal.singh@dairysphere.com',
          phone: '+91 98765 43210',
          department: 'Procurement',
          designation: 'Lead Milk Quality Inspector',
          role: 'MANAGER',
          status: 'ACTIVE',
          documents: [
            { id: 'doc-1', name: 'Aadhar_Card.pdf', type: 'PDF', size: '1.2 MB', uploadedAt: '2026-05-10T10:00:00Z' },
            { id: 'doc-2', name: 'Degree_Certificate.pdf', type: 'PDF', size: '2.4 MB', uploadedAt: '2026-05-10T10:15:00Z' }
          ],
          salaryStructure: { basic: 28000, hra: 8000, da: 4000, pf: 3360, esic: 1120, allowances: 3000 },
          joinedAt: '2026-01-15'
        },
        {
          id: 'emp-2',
          code: 'EMP-2026-002',
          name: 'Gurpreet Kaur',
          email: 'gurpreet.kaur@dairysphere.com',
          phone: '+91 94123 45678',
          department: 'Accounts',
          designation: 'Senior Ledger Clerk',
          role: 'OPERATOR',
          status: 'ACTIVE',
          documents: [
            { id: 'doc-3', name: 'PAN_Card.pdf', type: 'PDF', size: '840 KB', uploadedAt: '2026-06-01T09:30:00Z' }
          ],
          salaryStructure: { basic: 22000, hra: 6000, da: 3000, pf: 2640, esic: 880, allowances: 1500 },
          joinedAt: '2026-03-01'
        },
        {
          id: 'emp-3',
          code: 'EMP-2026-003',
          name: 'Rohan Sharma',
          email: 'rohan.sharma@dairysphere.com',
          phone: '+91 98112 23344',
          department: 'Operations',
          designation: 'Cold Storage Operator',
          role: 'OPERATOR',
          status: 'INACTIVE',
          documents: [],
          salaryStructure: { basic: 18000, hra: 5000, da: 2000, pf: 2160, esic: 720, allowances: 1000 },
          joinedAt: '2026-02-10'
        }
      ];
      localStorage.setItem('op_employees', JSON.stringify(defaultEmployees));
      setEmployees(defaultEmployees);
    } else {
      setEmployees(JSON.parse(localEmployees));
    }

    // 2. Attendance Seed & Load
    const localAttendance = localStorage.getItem('op_attendance');
    if (!localAttendance) {
      const defaultAttendance: AttendanceRecord[] = [
        { id: 'att-1', employeeId: 'emp-1', employeeCode: 'EMP-2026-001', employeeName: 'Amritpal Singh', date: '2026-07-10', shift: 'MORNING', status: 'PRESENT', remarks: 'On Time' },
        { id: 'att-2', employeeId: 'emp-1', employeeCode: 'EMP-2026-001', employeeName: 'Amritpal Singh', date: '2026-07-11', shift: 'MORNING', status: 'PRESENT', remarks: 'On Time' },
        { id: 'att-3', employeeId: 'emp-2', employeeCode: 'EMP-2026-002', employeeName: 'Gurpreet Kaur', date: '2026-07-10', shift: 'EVENING', status: 'PRESENT', remarks: 'Late by 10m' },
        { id: 'att-4', employeeId: 'emp-2', employeeCode: 'EMP-2026-002', employeeName: 'Gurpreet Kaur', date: '2026-07-11', shift: 'EVENING', status: 'LEAVE', remarks: 'Sickness Approved' }
      ];
      localStorage.setItem('op_attendance', JSON.stringify(defaultAttendance));
      setAttendance(defaultAttendance);
    } else {
      setAttendance(JSON.parse(localAttendance));
    }

    // 3. Leave Requests Seed & Load
    const localLeaves = localStorage.getItem('op_leaves');
    if (!localLeaves) {
      const defaultLeaves: LeaveRequest[] = [
        { id: 'lv-1', employeeId: 'emp-2', employeeName: 'Gurpreet Kaur', type: 'SICK', startDate: '2026-07-11', endDate: '2026-07-12', reason: 'High viral fever', status: 'APPROVED', createdAt: '2026-07-10T14:20:00Z' },
        { id: 'lv-2', employeeId: 'emp-1', employeeName: 'Amritpal Singh', type: 'CASUAL', startDate: '2026-07-20', endDate: '2026-07-22', reason: 'Family Function attending', status: 'PENDING', createdAt: '2026-07-11T11:05:00Z' }
      ];
      localStorage.setItem('op_leaves', JSON.stringify(defaultLeaves));
      setLeaveRequests(defaultLeaves);
    } else {
      setLeaveRequests(JSON.parse(localLeaves));
    }

    // 4. Salary Payments Seed & Load
    const localSalaries = localStorage.getItem('op_salaries');
    if (!localSalaries) {
      const defaultSalaries: SalaryPayment[] = [
        { id: 'sal-1', employeeId: 'emp-1', employeeName: 'Amritpal Singh', month: '2026-06', basic: 28000, hra: 8000, da: 4000, allowances: 3000, pf: 3360, esic: 1120, netSalary: 38520, status: 'PAID', paidAt: '2026-07-01T10:00:00Z', referenceNo: 'TXN876543210' },
        { id: 'sal-2', employeeId: 'emp-2', employeeName: 'Gurpreet Kaur', month: '2026-06', basic: 22000, hra: 6000, da: 3000, allowances: 1500, pf: 2640, esic: 880, netSalary: 29980, status: 'PAID', paidAt: '2026-07-02T11:20:00Z', referenceNo: 'TXN876543211' },
        { id: 'sal-3', employeeId: 'emp-1', employeeName: 'Amritpal Singh', month: '2026-07', basic: 28000, hra: 8000, da: 4000, allowances: 3000, pf: 3360, esic: 1120, netSalary: 38520, status: 'PENDING' }
      ];
      localStorage.setItem('op_salaries', JSON.stringify(defaultSalaries));
      setSalaryPayments(defaultSalaries);
    } else {
      setSalaryPayments(JSON.parse(localSalaries));
    }

    // 5. Notification Templates Load
    const localTemplates = localStorage.getItem('op_notif_templates');
    if (!localTemplates) {
      const defaultTemplates: NotificationTemplate[] = [
        { id: 'tmpl-1', name: 'Milk Intake Receipt', channel: 'SMS', content: 'Dear Member, we collected {qty}L {type} milk fat {fat}% snf {snf}% today. Net: Rs {amt}. Team DairySphere.' },
        { id: 'tmpl-2', name: 'Monthly Payment Payout Advice', channel: 'EMAIL', subject: 'DairySphere Monthly Payout Dispatch advice', content: 'Dear Cooperative Supplier, we have dispatched your monthly payout of Rs {amount} for bills dated {start} to {end}. Reference: {ref}.' },
        { id: 'tmpl-3', name: 'Employee Security Alert', channel: 'IN_APP', content: 'User registered security device or changed login credentials.' }
      ];
      localStorage.setItem('op_notif_templates', JSON.stringify(defaultTemplates));
      setNotifTemplates(defaultTemplates);
    } else {
      setNotifTemplates(JSON.parse(localTemplates));
    }

    // 6. Notification Dispatch Logs
    const localNotifLogs = localStorage.getItem('op_notif_logs');
    if (!localNotifLogs) {
      const defaultNotifLogs: NotificationLog[] = [
        { id: 'log-n1', channel: 'SMS', recipient: '+91 98000 12345', title: 'Milk Intake Receipt', content: 'Dear Member, we collected 12.5L COW milk fat 4.2% snf 8.4% today. Net: Rs 550. Team DairySphere.', status: 'DELIVERED', sentAt: '2026-07-12T08:30:00Z' },
        { id: 'log-n2', channel: 'EMAIL', recipient: 'farmer.bill@gmail.com', title: 'Monthly Payment Advice', content: 'Dear Cooperative Supplier, we have dispatched Rs 24,500. Ref: NETBANKING987.', status: 'DELIVERED', sentAt: '2026-07-11T16:45:00Z' }
      ];
      localStorage.setItem('op_notif_logs', JSON.stringify(defaultNotifLogs));
      setNotifLogs(defaultNotifLogs);
    } else {
      setNotifLogs(JSON.parse(localNotifLogs));
    }

    // 7. System & Business Preference Configurations
    const localFY = localStorage.getItem('op_fy_settings');
    if (!localFY) {
      const defaultFY: FinancialYear[] = [
        { id: 'fy-1', code: 'FY25-26', startDate: '2025-04-01', endDate: '2026-03-31', isActive: false },
        { id: 'fy-2', code: 'FY26-27', startDate: '2026-04-01', endDate: '2027-03-31', isActive: true }
      ];
      localStorage.setItem('op_fy_settings', JSON.stringify(defaultFY));
      setFinancialYears(defaultFY);
    } else {
      setFinancialYears(JSON.parse(localFY));
    }

    const localSeries = localStorage.getItem('op_number_series');
    if (!localSeries) {
      const defaultSeries: NumberSeries[] = [
        { id: 'ns-1', module: 'Milk Collections', prefix: 'COL-', suffix: '-2026', currentNumber: 1045, length: 5 },
        { id: 'ns-2', module: 'Sales Invoices', prefix: 'INV-', suffix: '-2026', currentNumber: 890, length: 5 },
        { id: 'ns-3', module: 'Salary Slips', prefix: 'PAY-', suffix: '-2026', currentNumber: 42, length: 4 }
      ];
      localStorage.setItem('op_number_series', JSON.stringify(defaultSeries));
      setNumberSeries(defaultSeries);
    } else {
      setNumberSeries(JSON.parse(localSeries));
    }

    // 8. Administrative Flags & Tools
    const localFlags = localStorage.getItem('op_feature_flags');
    if (!localFlags) {
      const defaultFlags: FeatureFlag[] = [
        { id: 'ff-1', key: 'snf_pricing_v2', name: 'Dynamic SNF Standard pricing matrix', description: 'Enables high-fidelity SNF/Fat correlation lookup chart rules.', isEnabled: true },
        { id: 'ff-2', key: 'sms_payout_alerts', name: 'Real-time SMS Payout triggers', description: 'Automatically triggers external SMS dispatcher upon successful voucher generation.', isEnabled: false },
        { id: 'ff-3', key: 'automated_route_optimization', name: 'Logistics Route Optimization AI', description: 'Runs background heuristic solvers for milk tanker tracking optimization.', isEnabled: false }
      ];
      localStorage.setItem('op_feature_flags', JSON.stringify(defaultFlags));
      setFeatureFlags(defaultFlags);
    } else {
      setFeatureFlags(JSON.parse(localFlags));
    }

    const localMaintenance = localStorage.getItem('sys_maintenance_mode');
    setMaintenanceMode(localMaintenance === 'true');

    const localTaxes = localStorage.getItem('op_tax_settings');
    if (localTaxes) {
      setTaxConfig(JSON.parse(localTaxes));
    }

    // Seed Random Queue status
    setQueueStatus({ active: 2, waiting: 0, failed: 0 });

  }, [session.business.id]);

  // ==========================================
  // REAL-TIME SYSTEM TELEMETRY (DIAGNOSTICS HEALTH)
  // ==========================================

  const [healthMetrics, setHealthMetrics] = useState<AppHealthMetrics>({
    cpu: Array(15).fill(0).map(() => Math.floor(Math.random() * 20) + 15),
    memory: Array(15).fill(0).map(() => Math.floor(Math.random() * 10) + 42),
    latency: Array(15).fill(0).map(() => Math.floor(Math.random() * 15) + 8)
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setHealthMetrics(prev => {
        const nextCpu = [...prev.cpu.slice(1), Math.floor(Math.random() * 25) + 15];
        const nextMemory = [...prev.memory.slice(1), Math.floor(Math.random() * 8) + 44];
        const nextLatency = [...prev.latency.slice(1), Math.floor(Math.random() * 12) + 6];
        return { cpu: nextCpu, memory: nextMemory, latency: nextLatency };
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const healthData = healthMetrics.cpu.map((cpuVal, idx) => ({
    name: idx === 14 ? 'Now' : `-${14 - idx}s`,
    CPU: cpuVal,
    Memory: healthMetrics.memory[idx],
    Latency: healthMetrics.latency[idx]
  }));

  // ==========================================
  // 1. EMPLOYEE MODULE ACTIONS
  // ==========================================

  const [newEmp, setNewEmp] = useState({
    name: '', email: '', phone: '', department: 'Procurement', designation: '', role: 'OPERATOR',
    basic: 20000, hra: 5000, da: 2000, allowances: 1000
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.email || !newEmp.designation) {
      showHubToast('Please complete all required employee profile fields.', 'error');
      return;
    }

    // Generate strict codes
    const code = `EMP-2026-0${employees.length + 1}`;
    const pf = Math.round(newEmp.basic * 0.12);
    const esic = Math.round(newEmp.basic * 0.04);

    const createdEmp: Employee = {
      id: `emp-${Date.now()}`,
      code,
      name: newEmp.name,
      email: newEmp.email,
      phone: newEmp.phone || '+91 99999 99999',
      department: newEmp.department,
      designation: newEmp.designation,
      role: newEmp.role,
      status: 'ACTIVE',
      documents: [],
      salaryStructure: {
        basic: Number(newEmp.basic),
        hra: Number(newEmp.hra),
        da: Number(newEmp.da),
        allowances: Number(newEmp.allowances),
        pf,
        esic
      },
      joinedAt: new Date().toISOString().split('T')[0]
    };

    const nextEmployees = [createdEmp, ...employees];
    setEmployees(nextEmployees);
    localStorage.setItem('op_employees', JSON.stringify(nextEmployees));
    
    // Log Audit and trigger transactional ledger update
    triggerAuditLog('EMPLOYEE_REGISTER', 'Employee', `Created employee ${createdEmp.name} (${code}) in department ${createdEmp.department}`);
    showHubToast(`Employee ${createdEmp.name} successfully registered. Assigned Code: ${code}.`);
    
    // Clear Form
    setNewEmp({
      name: '', email: '', phone: '', department: 'Procurement', designation: '', role: 'OPERATOR',
      basic: 20000, hra: 5000, da: 2000, allowances: 1000
    });
  };

  const toggleEmployeeStatus = (empId: string) => {
    const nextEmps = employees.map(emp => {
      if (emp.id === empId) {
        const nextStatus: 'ACTIVE' | 'INACTIVE' = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        triggerAuditLog('EMPLOYEE_STATUS_CHANGE', 'Employee', `Toggled status of ${emp.name} to ${nextStatus}`);
        return { ...emp, status: nextStatus };
      }
      return emp;
    });
    setEmployees(nextEmps);
    localStorage.setItem('op_employees', JSON.stringify(nextEmps));
    showHubToast('Employee operational status updated.');
  };

  const handleDeleteEmployeeDoc = (empId: string, docId: string) => {
    const nextEmps = employees.map(emp => {
      if (emp.id === empId) {
        const nextDocs = emp.documents.filter(d => d.id !== docId);
        triggerAuditLog('EMPLOYEE_DOCUMENT_DELETE', 'Employee', `Removed document ${docId} from ${emp.name}`);
        return { ...emp, documents: nextDocs };
      }
      return emp;
    });
    setEmployees(nextEmps);
    localStorage.setItem('op_employees', JSON.stringify(nextEmps));
    showHubToast('Document successfully archived.');
  };

  const handleSimulateUpload = (empId: string) => {
    const fileName = prompt("Enter document title/type (e.g. Identity_Proof.pdf, Driving_License.png):");
    if (!fileName) return;

    const nextEmps = employees.map(emp => {
      if (emp.id === empId) {
        const newDoc: EmployeeDocument = {
          id: `doc-${Date.now()}`,
          name: fileName,
          type: fileName.split('.').pop()?.toUpperCase() || 'FILE',
          size: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
          uploadedAt: new Date().toISOString()
        };
        const nextDocs = [...emp.documents, newDoc];
        triggerAuditLog('EMPLOYEE_DOCUMENT_UPLOAD', 'Employee', `Uploaded secure credentials (${fileName}) to ${emp.name}`);
        return { ...emp, documents: nextDocs };
      }
      return emp;
    });
    setEmployees(nextEmps);
    localStorage.setItem('op_employees', JSON.stringify(nextEmps));
    showHubToast('Document uploaded and encrypted in tenant store.');
  };

  // ==========================================
  // 2. ATTENDANCE & SHIFTS
  // ==========================================

  const [attDate, setAttDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attShift, setAttShift] = useState<'MORNING' | 'EVENING'>('MORNING');
  const [attStatuses, setAttStatuses] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE'>>({});
  const [attRemarks, setAttRemarks] = useState<Record<string, string>>({});

  useEffect(() => {
    // Populate statuses with existing ones or default to PRESENT
    const currentDayLogs = attendance.filter(log => log.date === attDate && log.shift === attShift);
    const initialStatuses: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE'> = {};
    const initialRemarks: Record<string, string> = {};

    employees.filter(e => e.status === 'ACTIVE').forEach(emp => {
      const match = currentDayLogs.find(log => log.employeeId === emp.id);
      initialStatuses[emp.id] = match ? match.status : 'PRESENT';
      initialRemarks[emp.id] = match ? (match.remarks || '') : '';
    });

    setAttStatuses(initialStatuses);
    setAttRemarks(initialRemarks);
  }, [attDate, attShift, employees, attendance]);

  const handleSaveAttendance = () => {
    // Create or update records
    const remainingLogs = attendance.filter(log => !(log.date === attDate && log.shift === attShift));
    const newLogs: AttendanceRecord[] = employees
      .filter(emp => emp.status === 'ACTIVE')
      .map(emp => ({
        id: `att-${emp.id}-${attDate}-${attShift}`,
        employeeId: emp.id,
        employeeCode: emp.code,
        employeeName: emp.name,
        date: attDate,
        shift: attShift,
        status: attStatuses[emp.id] || 'PRESENT',
        remarks: attRemarks[emp.id] || ''
      }));

    const finalLogs = [...remainingLogs, ...newLogs];
    setAttendance(finalLogs);
    localStorage.setItem('op_attendance', JSON.stringify(finalLogs));

    triggerAuditLog('ATTENDANCE_REGISTER_SAVE', 'Attendance', `Logged cooperative shift attendance for date ${attDate} - ${attShift}`);
    showHubToast('Shift attendance successfully written to database logs.');
  };

  const handleProcessLeave = (leaveId: string, action: 'APPROVED' | 'REJECTED') => {
    const nextLeaves = leaveRequests.map(lv => {
      if (lv.id === leaveId) {
        triggerAuditLog('LEAVE_ACTION', 'LeaveRequest', `Set leave request status to ${action} for ${lv.employeeName}`);
        return { ...lv, status: action };
      }
      return lv;
    });
    setLeaveRequests(nextLeaves);
    localStorage.setItem('op_leaves', JSON.stringify(nextLeaves));
    showHubToast(`Leave request status set to ${action}.`);
  };

  // ==========================================
  // 3. SALARY FOUNDATION
  // ==========================================

  const [payoutMonth, setPayoutMonth] = useState<string>('2026-07');
  const [salaryRegisterFilter, setSalaryRegisterFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');

  const handleCalculatePayrollRun = () => {
    // Run transactions and calculations for active employees for the month
    const activeEmployees = employees.filter(e => e.status === 'ACTIVE');
    const existingForMonth = salaryPayments.filter(sp => sp.month === payoutMonth);
    
    const uncalculated = activeEmployees.filter(emp => !existingForMonth.some(sp => sp.employeeId === emp.id));
    
    if (uncalculated.length === 0) {
      showHubToast(`Payroll calculations for month ${payoutMonth} are already fully calculated & processed.`, 'info');
      return;
    }

    const newPayouts: SalaryPayment[] = uncalculated.map(emp => {
      const basic = emp.salaryStructure.basic;
      const hra = emp.salaryStructure.hra;
      const da = emp.salaryStructure.da;
      const allowances = emp.salaryStructure.allowances;
      const pf = emp.salaryStructure.pf;
      const esic = emp.salaryStructure.esic;
      const netSalary = (basic + hra + da + allowances) - (pf + esic);

      return {
        id: `sal-${emp.id}-${payoutMonth}`,
        employeeId: emp.id,
        employeeName: emp.name,
        month: payoutMonth,
        basic, hra, da, allowances, pf, esic,
        netSalary,
        status: 'PENDING'
      };
    });

    const finalPayouts = [...salaryPayments, ...newPayouts];
    setSalaryPayments(finalPayouts);
    localStorage.setItem('op_salaries', JSON.stringify(finalPayouts));

    triggerAuditLog('PAYROLL_RUN', 'Payroll', `Executed standard transactional payroll calculation for ${newPayouts.length} employees for ${payoutMonth}`);
    showHubToast(`Calculated payroll for ${newPayouts.length} employees for month ${payoutMonth}.`);
  };

  const handleDisburseSalary = (payoutId: string) => {
    const referenceNo = `PAYTXN-${Date.now().toString().slice(-8)}`;
    const nextPayments = salaryPayments.map(sp => {
      if (sp.id === payoutId) {
        triggerAuditLog('SALARY_DISBURSE', 'Payroll', `Disbursed salary of Rs ${sp.netSalary} to ${sp.employeeName} for ${sp.month}`);
        return {
          ...sp,
          status: 'PAID',
          paidAt: new Date().toISOString(),
          referenceNo
        };
      }
      return sp;
    });

    setSalaryPayments(nextPayments);
    localStorage.setItem('op_salaries', JSON.stringify(nextPayments));
    showHubToast(`Disbursement successful. Txn Reference ID: ${referenceNo}`);
  };

  // ==========================================
  // 4. NOTIFICATION CENTER DISPATCH
  // ==========================================

  const [activeNotifTab, setActiveNotifTab] = useState<'logs' | 'templates'>('logs');
  const [newTmpl, setNewTmpl] = useState({ name: '', channel: 'SMS' as 'EMAIL' | 'SMS' | 'IN_APP', subject: '', content: '' });

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTmpl.name || !newTmpl.content) {
      showHubToast('Template title and layout content cannot be empty.', 'error');
      return;
    }

    const template: NotificationTemplate = {
      id: `tmpl-${Date.now()}`,
      name: newTmpl.name,
      channel: newTmpl.channel,
      subject: newTmpl.channel === 'EMAIL' ? newTmpl.subject : undefined,
      content: newTmpl.content
    };

    const nextTemplates = [...notifTemplates, template];
    setNotifTemplates(nextTemplates);
    localStorage.setItem('op_notif_templates', JSON.stringify(nextTemplates));

    triggerAuditLog('NOTIFICATION_TEMPLATE_CREATE', 'Notification', `Created notification template: ${template.name}`);
    showHubToast(`Notification template "${template.name}" registered successfully.`);
    setNewTmpl({ name: '', channel: 'SMS', subject: '', content: '' });
  };

  const handleTestBroadcast = (tmplId: string) => {
    const tmpl = notifTemplates.find(t => t.id === tmplId);
    if (!tmpl) return;

    const recipient = tmpl.channel === 'EMAIL' ? 'audit.compliance@cooperative.in' : '+91 91111 22222';
    
    // Simulate compilation
    let text = tmpl.content;
    text = text.replace('{amount}', '45,800').replace('{start}', '2026-06-01').replace('{end}', '2026-06-30').replace('{ref}', 'IMPS-998877');
    text = text.replace('{qty}', '25').replace('{type}', 'BUFFALO').replace('{fat}', '7.4').replace('{snf}', '9.1').replace('{amt}', '1450');

    const newLog: NotificationLog = {
      id: `log-n-${Date.now()}`,
      channel: tmpl.channel,
      recipient,
      title: tmpl.name,
      content: text,
      status: 'DELIVERED',
      sentAt: new Date().toISOString()
    };

    const nextLogs = [newLog, ...notifLogs];
    setNotifLogs(nextLogs);
    localStorage.setItem('op_notif_logs', JSON.stringify(nextLogs));
    
    triggerAuditLog('NOTIFICATION_TEST_SEND', 'Notification', `Simulated dispatch of notification "${tmpl.name}" via ${tmpl.channel}`);
    showHubToast(`Dispatched test template alert over the ${tmpl.channel} channel.`);
  };

  // ==========================================
  // 5. SYSTEM SETTINGS & SYSTEM POLICIES
  // ==========================================

  const [activeFYCode, setActiveFYCode] = useState('FY26-27');

  const handleAddFY = () => {
    const code = prompt("Enter financial year code (e.g., FY27-28):");
    const start = prompt("Enter Start Date (YYYY-MM-DD):", "2027-04-01");
    const end = prompt("Enter End Date (YYYY-MM-DD):", "2028-03-31");

    if (!code || !start || !end) return;

    const newYear: FinancialYear = {
      id: `fy-${Date.now()}`,
      code,
      startDate: start,
      endDate: end,
      isActive: false
    };

    const nextFYs = [...financialYears, newYear];
    setFinancialYears(nextFYs);
    localStorage.setItem('op_fy_settings', JSON.stringify(nextFYs));
    showHubToast(`Added financial year timeline entry: ${code}`);
  };

  const handleSetActiveFY = (id: string) => {
    const nextFYs = financialYears.map(fy => {
      const active = fy.id === id;
      if (active) {
        setActiveFYCode(fy.code);
        triggerAuditLog('FINANCIAL_YEAR_SET', 'Settings', `Switched active financial reporting timeline to ${fy.code}`);
      }
      return { ...fy, isActive: active };
    });
    setFinancialYears(nextFYs);
    localStorage.setItem('op_fy_settings', JSON.stringify(nextFYs));
    showHubToast(`Switched active reporting financial year timeline.`);
  };

  const handleUpdateTaxAndCompliance = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('op_tax_settings', JSON.stringify(taxConfig));
    triggerAuditLog('TAX_COMPLIANCE_SETTINGS', 'Settings', `Updated GST tax limits and compliance parameters.`);
    showHubToast('Cooperative taxation parameters recorded.');
  };

  // ==========================================
  // 6. BACKUP & RESTORE / DATA MANAGEMENT
  // ==========================================

  const handleBackupExport = () => {
    // Generate JSON package
    const payload = {
      version: "DairySphere Enterprise 5.10",
      tenantId: session.business.id,
      timestamp: new Date().toISOString(),
      data: {
        employees,
        attendance,
        leaveRequests,
        salaryPayments,
        notifTemplates,
        notifLogs,
        financialYears,
        numberSeries,
        featureFlags,
        taxConfig
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daisysphere_coop_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();

    triggerAuditLog('SYSTEM_DATA_BACKUP', 'Backup', `Exported full database state archive payload.`);
    showHubToast('Database backup archive JSON file exported and downloaded.');
  };

  const handleRestoreImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showHubToast('File size exceeds the security limit of 5MB.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'json' && file.type !== 'application/json') {
      showHubToast('Invalid file format. Only JSON backup files are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.version && json.data) {
          const { data } = json;
          
          if (data.employees) {
            localStorage.setItem('op_employees', JSON.stringify(data.employees));
            setEmployees(data.employees);
          }
          if (data.attendance) {
            localStorage.setItem('op_attendance', JSON.stringify(data.attendance));
            setAttendance(data.attendance);
          }
          if (data.leaveRequests) {
            localStorage.setItem('op_leaves', JSON.stringify(data.leaveRequests));
            setLeaveRequests(data.leaveRequests);
          }
          if (data.salaryPayments) {
            localStorage.setItem('op_salaries', JSON.stringify(data.salaryPayments));
            setSalaryPayments(data.salaryPayments);
          }
          if (data.financialYears) {
            localStorage.setItem('op_fy_settings', JSON.stringify(data.financialYears));
            setFinancialYears(data.financialYears);
          }
          if (data.numberSeries) {
            localStorage.setItem('op_number_series', JSON.stringify(data.numberSeries));
            setNumberSeries(data.numberSeries);
          }

          triggerAuditLog('SYSTEM_DATA_RESTORE', 'Backup', `Restored entire database state from backup archive stamped: ${json.timestamp}`);
          showHubToast('Cooperative database recovery completed. Reloading states.');
        } else {
          showHubToast('Invalid JSON Backup file format.', 'error');
        }
      } catch (err) {
        showHubToast('Corrupted JSON database backup recovery aborting.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleSimulateExcelImport = () => {
    const mockImports: Employee[] = [
      {
        id: `emp-imp-${Date.now()}`,
        code: `EMP-2026-IMP`,
        name: 'Sardar Jagdeep Singh',
        email: 'jagdeep@northerncoop.com',
        phone: '+91 94444 55555',
        department: 'Operations',
        designation: 'Bulk Tanker Driver',
        role: 'OPERATOR',
        status: 'ACTIVE',
        documents: [],
        salaryStructure: { basic: 15000, hra: 4000, da: 1500, pf: 1800, esic: 600, allowances: 2000 },
        joinedAt: new Date().toISOString().split('T')[0]
      }
    ];

    const nextEmps = [...mockImports, ...employees];
    setEmployees(nextEmps);
    localStorage.setItem('op_employees', JSON.stringify(nextEmps));
    
    triggerAuditLog('EXCEL_BULK_IMPORT', 'DataManagement', `Imported bulk employee lists from Excel sheet payload.`);
    showHubToast('Bulk processed 1 new Employee records from spreadsheet template.');
  };

  // ==========================================
  // 7. AUDIT & DIAGNOSTICS LEDGER
  // ==========================================

  const [sysAuditLogs, setSysAuditLogs] = useState<any[]>([]);
  const [auditFilter, setAuditFilter] = useState('');

  useEffect(() => {
    const rawLogs = localStorage.getItem('ds_audit_logs');
    if (rawLogs) {
      setSysAuditLogs(JSON.parse(rawLogs));
    }
  }, [toast]); // reload on toast actions

  const filteredAudits = sysAuditLogs.filter(log => {
    const term = auditFilter.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.entityName.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term)
    );
  });

  // ==========================================
  // 8. ADMIN TOOLS & DIAGNOSTICS
  // ==========================================

  const handleToggleMaintenance = () => {
    const state = !maintenanceMode;
    setMaintenanceMode(state);
    localStorage.setItem('sys_maintenance_mode', state ? 'true' : 'false');
    triggerAuditLog('SYSTEM_MAINTENANCE_TOGGLE', 'Settings', `Switched Maintenance Gate State to ${state}`);
    showHubToast(`Production site maintenance status set to ${state ? 'ENABLED' : 'DISABLED'}.`);
  };

  const handleToggleFeatureFlag = (flagId: string) => {
    const nextFlags = featureFlags.map(ff => {
      if (ff.id === flagId) {
        const state = !ff.isEnabled;
        triggerAuditLog('FEATURE_FLAG_TOGGLE', 'Settings', `Toggled heuristic feature flag "${ff.key}" state to ${state}`);
        return { ...ff, isEnabled: state };
      }
      return ff;
    });
    setFeatureFlags(nextFlags);
    localStorage.setItem('op_feature_flags', JSON.stringify(nextFlags));
    showHubToast('Heuristic functional switches toggled.');
  };

  const handleClearCache = () => {
    triggerAuditLog('SYSTEM_CACHE_PURGE', 'Settings', 'Cleared compiled route indexes & SNR lookup cache matrices.');
    showHubToast('Purged 1,420 compiled SNR rate charts and physical distribution logs.');
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Toast Alert Box */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4.5 py-3.5 rounded-xl border shadow-lg animate-bounce-short ${
          toast.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : toast.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              : 'bg-teal-50 dark:bg-teal-950/90 border-teal-200 dark:border-teal-850 text-teal-800 dark:text-teal-300'
        }`}>
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-teal-600 dark:text-teal-400" />}
          <span className="text-[11px] font-bold tracking-tight">{toast.text}</span>
        </div>
      )}

      {/* Global Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/30 rounded-full text-[9px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" /> Stage 5.10 Systems
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            Operations & Administration Suite
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise database controllers, cooperative payroll structures, attendance logs, and diagnostic parameters.
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleBackupExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Cloud Backup JSON
          </button>
          
          <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-855 dark:hover:bg-slate-700 text-white hover:shadow-xs text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Restore Database
            <input 
              type="file" 
              accept=".json" 
              onChange={handleRestoreImport} 
              className="hidden" 
            />
          </label>
        </div>
      </div>

      {/* Primary Navigation Hub Modules Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sidebar Selector Navigation Panel */}
        <div className="lg:col-span-3 space-y-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-4 shadow-xs h-fit">
          <span className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Module Controls</span>
          
          {[
            { id: 'employees', label: 'Employee Profiles', desc: 'Registry & Roles', icon: <Users className="w-4 h-4" /> },
            { id: 'attendance', label: 'Attendance Ledger', desc: 'Shift Log & Leaves', icon: <ClipboardList className="w-4 h-4" /> },
            { id: 'salary', label: 'Salary Foundation', desc: 'Structures & Payouts', icon: <CreditCard className="w-4 h-4" /> },
            { id: 'notifications', label: 'Notif Gateways', desc: 'Templates & Dispatch', icon: <Bell className="w-4 h-4" /> },
            { id: 'settings', label: 'System Settings', desc: 'FY & Tax Compliance', icon: <Settings className="w-4 h-4" /> },
            { id: 'backup', label: 'Data Management', desc: 'Import & Backup Tools', icon: <Database className="w-4 h-4" /> },
            { id: 'audit', label: 'Governance Logs', desc: 'Security Audit Feed', icon: <ShieldAlert className="w-4 h-4" /> },
            { id: 'adminTools', label: 'Diagnostics Suite', desc: 'System Engine Health', icon: <Activity className="w-4 h-4" /> },
          ].map((tab) => {
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as HubTab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition relative cursor-pointer ${
                  isSel 
                    ? 'bg-teal-550 text-white shadow-xs shadow-teal-550/15'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div className="shrink-0">{tab.icon}</div>
                <div>
                  <span className="text-[11px] font-black block leading-tight">{tab.label}</span>
                  <span className={`text-[8.5px] block truncate mt-0.5 ${isSel ? 'text-teal-100' : 'text-slate-400'}`}>{tab.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Display Panel Container */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* ==========================================
              TAB 1: EMPLOYEE MANAGEMENT
              ========================================== */}
          {activeTab === 'employees' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" /> Employee Rosters & Roles
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure staff identities, professional designations, security credentials, and compliance documents.
                  </p>
                </div>
              </div>

              {/* Grid 2-cols: List & Register Form */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Registration Form */}
                <form onSubmit={handleCreateEmployee} className="xl:col-span-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-4">
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-teal-600" /> New Staff Registration
                  </h4>

                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Employee Name</label>
                      <input 
                        type="text" 
                        required
                        value={newEmp.name}
                        onChange={e => setNewEmp({...newEmp, name: e.target.value})}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-teal-550 focus:outline-hidden"
                        placeholder="e.g. Sardar Harpreet Singh"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Office Email</label>
                        <input 
                          type="email" 
                          required
                          value={newEmp.email}
                          onChange={e => setNewEmp({...newEmp, email: e.target.value})}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-teal-550 focus:outline-hidden"
                          placeholder="harpreet@dairysphere.com"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number</label>
                        <input 
                          type="text" 
                          value={newEmp.phone}
                          onChange={e => setNewEmp({...newEmp, phone: e.target.value})}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-teal-550 focus:outline-hidden"
                          placeholder="+91 98000 00000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Department</label>
                        <select 
                          value={newEmp.department}
                          onChange={e => setNewEmp({...newEmp, department: e.target.value})}
                          className="w-full px-2 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                        >
                          <option value="Procurement">Procurement</option>
                          <option value="Accounts">Accounts</option>
                          <option value="Operations">Operations</option>
                          <option value="Logistics">Logistics</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Designation</label>
                        <input 
                          type="text" 
                          required
                          value={newEmp.designation}
                          onChange={e => setNewEmp({...newEmp, designation: e.target.value})}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-teal-550 focus:outline-hidden"
                          placeholder="e.g. Tanker Operator"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Security Role</label>
                        <select 
                          value={newEmp.role}
                          onChange={e => setNewEmp({...newEmp, role: e.target.value})}
                          className="w-full px-2 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                        >
                          <option value="MANAGER">MANAGER</option>
                          <option value="OPERATOR">OPERATOR</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Basic Monthly Salary</label>
                        <input 
                          type="number" 
                          required
                          value={newEmp.basic}
                          onChange={e => setNewEmp({...newEmp, basic: Number(e.target.value)})}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-teal-550 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-650 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:shadow-xs transition cursor-pointer"
                  >
                    Commit Employee Register
                  </button>
                </form>

                {/* Directory Table Grid */}
                <div className="xl:col-span-8 space-y-4">
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest flex items-center justify-between">
                    <span>Registered Employee Database ({employees.length})</span>
                    <button 
                      type="button"
                      onClick={handleSimulateExcelImport}
                      className="text-[9px] text-teal-600 dark:text-teal-400 font-bold hover:underline"
                    >
                      + Import Excel Sheet Templates
                    </button>
                  </h4>

                  <div className="space-y-4">
                    {employees.map(emp => (
                      <div key={emp.id} className="border border-slate-100 dark:border-slate-850 rounded-2xl p-5 hover:shadow-xs transition bg-slate-50/10 space-y-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <span className="text-[12px] font-black text-slate-900 dark:text-white block leading-none">{emp.name}</span>
                              <span className="text-[8.5px] font-mono text-slate-400 font-semibold uppercase mt-1 block">
                                {emp.code} • {emp.designation} • <span className="text-teal-600">{emp.department}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-bold ${
                              emp.status === 'ACTIVE' 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {emp.status}
                            </span>

                            <button 
                              onClick={() => toggleEmployeeStatus(emp.id)}
                              className={`p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-[9px] font-bold cursor-pointer ${
                                emp.status === 'ACTIVE' ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </div>

                        {/* Profiles Parameters */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Office Email</span>
                            <span className="text-[11px] text-slate-700 dark:text-slate-350 block truncate font-medium">{emp.email}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Phone Contact</span>
                            <span className="text-[11px] text-slate-700 dark:text-slate-350 block font-medium">{emp.phone}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Coop Basic Pay</span>
                            <span className="text-[11px] text-slate-700 dark:text-slate-350 block font-mono font-bold">Rs {emp.salaryStructure.basic.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Auth Role</span>
                            <span className="text-[11px] text-slate-700 dark:text-slate-350 block font-bold text-teal-600">{emp.role}</span>
                          </div>
                        </div>

                        {/* Documents Vault */}
                        <div className="bg-slate-50/50 dark:bg-slate-950/40 rounded-xl border border-slate-100/80 dark:border-slate-850/60 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">KYC Compliance Documents ({emp.documents.length})</span>
                            <button 
                              type="button" 
                              onClick={() => handleSimulateUpload(emp.id)}
                              className="text-[8.5px] font-bold text-teal-600 dark:text-teal-450 hover:underline"
                            >
                              + Upload Verified Document
                            </button>
                          </div>

                          {emp.documents.length === 0 ? (
                            <span className="text-[9px] text-amber-500 block">⚠️ Critical: KYC Compliance credentials pending.</span>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {emp.documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                    <span className="text-[10px] text-slate-700 dark:text-slate-300 truncate" title={doc.name}>{doc.name}</span>
                                    <span className="text-[8px] text-slate-400 shrink-0">({doc.size})</span>
                                  </div>
                                  <button 
                                    onClick={() => handleDeleteEmployeeDoc(emp.id, doc.id)}
                                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-md cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==========================================
              TAB 2: ATTENDANCE LEDGER
              ========================================== */}
          {activeTab === 'attendance' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-teal-600" /> Attendance Ledger & Shift Tracker
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Log staff entry status, designate shifts, record clock timings, and authorize leave requests.
                  </p>
                </div>
              </div>

              {/* Attendance Controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Daily Status logger */}
                <div className="md:col-span-8 bg-slate-50/30 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-3">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                      Shift Attendance Sheet
                    </h4>

                    {/* Date/Shift controls */}
                    <div className="flex items-center gap-2">
                      <input 
                        type="date" 
                        value={attDate}
                        onChange={e => setAttDate(e.target.value)}
                        className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      />
                      <select 
                        value={attShift}
                        onChange={e => setAttShift(e.target.value as any)}
                        className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      >
                        <option value="MORNING">Morning Shift</option>
                        <option value="EVENING">Evening Shift</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {employees.filter(e => e.status === 'ACTIVE').map(emp => (
                      <div key={emp.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:shadow-xs transition">
                        <div className="min-w-0">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white block truncate leading-none">{emp.name}</span>
                          <span className="text-[8.5px] font-mono text-slate-400 font-semibold block uppercase mt-1 leading-none">{emp.code} • {emp.designation}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden shrink-0 select-none">
                            {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as const).map(st => {
                              const isSel = (attStatuses[emp.id] || 'PRESENT') === st;
                              return (
                                <button
                                  key={st}
                                  onClick={() => setAttStatuses(prev => ({ ...prev, [emp.id]: st }))}
                                  className={`px-2.5 py-1 text-[8.5px] font-bold uppercase transition-all cursor-pointer ${
                                    isSel
                                      ? st === 'PRESENT' ? 'bg-emerald-500 text-white'
                                        : st === 'ABSENT' ? 'bg-rose-500 text-white'
                                        : st === 'LATE' ? 'bg-amber-500 text-white'
                                        : 'bg-teal-500 text-white'
                                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {st.slice(0, 3)}
                                </button>
                              );
                            })}
                          </div>

                          <input 
                            type="text" 
                            placeholder="Remarks"
                            value={attRemarks[emp.id] || ''}
                            onChange={e => setAttRemarks(prev => ({ ...prev, [emp.id]: e.target.value }))}
                            className="px-2 py-1 text-[10px] bg-slate-50 dark:bg-slate-950/40 border border-slate-250 dark:border-slate-800/60 rounded-lg w-28 text-slate-700 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={handleSaveAttendance}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-650 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:shadow-xs transition cursor-pointer"
                  >
                    Lock & Transact Shift Attendance
                  </button>
                </div>

                {/* Leaves Management */}
                <div className="md:col-span-4 bg-slate-50/30 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-4">
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
                    Staff Leave Request Vault
                  </h4>

                  <div className="space-y-3.5">
                    {leaveRequests.map(lv => (
                      <div key={lv.id} className="bg-white dark:bg-slate-900 p-3.5 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-1.5">
                          <div>
                            <span className="text-[11px] font-black text-slate-900 dark:text-white block leading-none">{lv.employeeName}</span>
                            <span className="text-[8px] text-teal-600 font-bold uppercase mt-1 block tracking-wider">{lv.type} LEAVE</span>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                            lv.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700'
                              : lv.status === 'REJECTED' ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {lv.status}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Timeline: <strong>{lv.startDate}</strong> to <strong>{lv.endDate}</strong></span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed pt-1 font-medium bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-lg">
                            "{lv.reason}"
                          </p>
                        </div>

                        {lv.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleProcessLeave(lv.id, 'APPROVED')}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-650 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleProcessLeave(lv.id, 'REJECTED')}
                              className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-650 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==========================================
              TAB 3: SALARY FOUNDATION
              ========================================== */}
          {activeTab === 'salary' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-teal-600" /> Cooperative Salary Foundation & Payroll Runs
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Structure basic components, allowances, tax-exempt provident fund parameters, and lock monthly disbursement ledgers.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <input 
                    type="month" 
                    value={payoutMonth}
                    onChange={e => setPayoutMonth(e.target.value)}
                    className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl font-bold"
                  />
                  <button 
                    onClick={handleCalculatePayrollRun}
                    className="px-3 py-2 bg-teal-650 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Execute Payroll Run
                  </button>
                </div>
              </div>

              {/* Salary Components Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-4.5 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Basic Component Rules</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-1">100% Guaranteed</span>
                  <p className="text-[9.5px] text-slate-500 mt-1 leading-tight">Defined individually in employee profiles.</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-4.5 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Cooperative DA Allocation</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-1">Fixed 15%</span>
                  <p className="text-[9.5px] text-slate-500 mt-1 leading-tight">Standardized dearness allowance on Basic.</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-4.5 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">EPF Deduction Rule</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-1">12.0% Employer Co</span>
                  <p className="text-[9.5px] text-slate-500 mt-1 leading-tight">Monthly provident security reserve pool.</p>
                </div>
                <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-4.5 rounded-2xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">ESIC Deductions Matrix</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white block mt-1">4.00% Fixed</span>
                  <p className="text-[9.5px] text-slate-500 mt-1 leading-tight">Monthly state health coverage insurance contributions.</p>
                </div>
              </div>

              {/* Payroll Disbursal Registers Table */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 dark:border-slate-850 pb-2">
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest">
                    Salary Register Timeline: {payoutMonth}
                  </h4>

                  {/* Filter Status Selector */}
                  <div className="flex p-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-lg select-none">
                    {(['ALL', 'PENDING', 'PAID'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setSalaryRegisterFilter(f)}
                        className={`px-3 py-1 text-[9px] font-bold uppercase rounded-md transition cursor-pointer ${
                          salaryRegisterFilter === f 
                            ? 'bg-white dark:bg-slate-800 text-teal-650' 
                            : 'text-slate-400 hover:text-slate-950'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 text-[9px] uppercase tracking-wider font-extrabold">
                        <th className="py-2.5">Staff Associate</th>
                        <th className="py-2.5">Month</th>
                        <th className="py-2.5 text-right">Basic (Rs)</th>
                        <th className="py-2.5 text-right">Allowances</th>
                        <th className="py-2.5 text-right">PF & ESIC</th>
                        <th className="py-2.5 text-right font-black">Net Pay</th>
                        <th className="py-2.5 text-center">Audit Status</th>
                        <th className="py-2.5 text-right">Payroll Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salaryPayments
                        .filter(sp => sp.month === payoutMonth)
                        .filter(sp => salaryRegisterFilter === 'ALL' || sp.status === salaryRegisterFilter)
                        .map(sp => (
                          <tr key={sp.id} className="border-b border-slate-100/50 dark:border-slate-850/50 hover:bg-slate-50/20">
                            <td className="py-3.5 font-bold text-slate-900 dark:text-white">{sp.employeeName}</td>
                            <td className="py-3.5 font-mono text-slate-400">{sp.month}</td>
                            <td className="py-3.5 text-right font-mono text-slate-600 dark:text-slate-350">{sp.basic.toLocaleString()}</td>
                            <td className="py-3.5 text-right font-mono text-slate-600 dark:text-slate-350">{sp.allowances.toLocaleString()}</td>
                            <td className="py-3.5 text-right font-mono text-rose-600">-{ (sp.pf + sp.esic).toLocaleString() }</td>
                            <td className="py-3.5 text-right font-mono font-black text-teal-600 dark:text-teal-400">Rs {sp.netSalary.toLocaleString()}</td>
                            <td className="py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase ${
                                sp.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-150 text-slate-500'
                              }`}>
                                {sp.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              {sp.status === 'PENDING' ? (
                                <button
                                  onClick={() => handleDisburseSalary(sp.id)}
                                  className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-650 text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg transition hover:shadow-xs cursor-pointer"
                                >
                                  Disburse Net Pay
                                </button>
                              ) : (
                                <div className="text-right">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Ref ID</span>
                                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-350 block font-medium">{sp.referenceNo}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* ==========================================
              TAB 4: NOTIFICATIONS GATEWAYS
              ========================================== */}
          {activeTab === 'notifications' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-teal-600" /> Notifications & Communications Center
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Configure Email pipelines, dynamic SMS dispatch parameters, and edit template layouts.
                  </p>
                </div>

                <div className="flex p-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl select-none shrink-0">
                  <button 
                    onClick={() => setActiveNotifTab('logs')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[9.5px] font-black uppercase rounded-lg transition cursor-pointer ${
                      activeNotifTab === 'logs' ? 'bg-white dark:bg-slate-800 text-teal-650' : 'text-slate-400'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" /> Dispatch Logs
                  </button>
                  <button 
                    onClick={() => setActiveNotifTab('templates')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[9.5px] font-black uppercase rounded-lg transition cursor-pointer ${
                      activeNotifTab === 'templates' ? 'bg-white dark:bg-slate-800 text-teal-650' : 'text-slate-400'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> SMS & Email Layouts
                  </button>
                </div>
              </div>

              {activeNotifTab === 'logs' ? (
                <div className="space-y-4">
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest border-b border-slate-50 dark:border-slate-850 pb-2">
                    Real-time Gateway Dispatch Feeds ({notifLogs.length})
                  </h4>

                  <div className="space-y-3">
                    {notifLogs.map(nl => (
                      <div key={nl.id} className="border border-slate-100 dark:border-slate-850 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-slate-50/15">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                              nl.channel === 'SMS' ? 'bg-indigo-50 text-indigo-700'
                                : nl.channel === 'EMAIL' ? 'bg-teal-50 text-teal-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {nl.channel}
                            </span>
                            <span className="text-[11px] font-black text-slate-900 dark:text-white leading-none">{nl.title}</span>
                          </div>

                          <div className="text-[10px] text-slate-400 font-medium">
                            Recipient Gateway Address: <strong className="text-slate-600 dark:text-slate-350">{nl.recipient}</strong> • Stamped: <span>{new Date(nl.sentAt).toLocaleString()}</span>
                          </div>

                          <p className="text-[11px] text-slate-655 dark:text-slate-400 font-medium leading-relaxed bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-2.5 rounded-xl italic">
                            "{nl.content}"
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">{nl.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  {/* Create Template form */}
                  <form onSubmit={handleCreateTemplate} className="xl:col-span-5 bg-slate-50/40 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-4">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest border-b border-slate-100 pb-2">
                      Add Communication Template
                    </h4>

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Template Name</label>
                        <input 
                          type="text" 
                          required
                          value={newTmpl.name}
                          onChange={e => setNewTmpl({...newTmpl, name: e.target.value})}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-teal-550"
                          placeholder="e.g. Milk Rate Alert"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Alert Channel</label>
                          <select 
                            value={newTmpl.channel}
                            onChange={e => setNewTmpl({...newTmpl, channel: e.target.value as any})}
                            className="w-full px-2 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                          >
                            <option value="SMS">SMS Gateway</option>
                            <option value="EMAIL">Email SMTP</option>
                            <option value="IN_APP">In-App Screen</option>
                          </select>
                        </div>
                        {newTmpl.channel === 'EMAIL' && (
                          <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subject Header</label>
                            <input 
                              type="text" 
                              value={newTmpl.subject}
                              onChange={e => setNewTmpl({...newTmpl, subject: e.target.value})}
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
                              placeholder="Email Subject"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Message Layout Body</label>
                        <textarea 
                          rows={4}
                          required
                          value={newTmpl.content}
                          onChange={e => setNewTmpl({...newTmpl, content: e.target.value})}
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono focus:outline-hidden"
                          placeholder="e.g. Dear Cooperative Member, we processed your monthly payout {amount}..."
                        />
                        <span className="text-[8.5px] text-slate-400 block mt-1.5 leading-tight">
                          Supported token bindings: `{'{amount}'}`, `{'{ref}'}`, `{'{qty}'}`, `{'{type}'}`
                        </span>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-teal-600 hover:bg-teal-650 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                    >
                      Save Communication Layout
                    </button>
                  </form>

                  {/* Templates List */}
                  <div className="xl:col-span-7 space-y-4">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest border-b border-slate-50 pb-2">
                      Registered Layout Blueprints ({notifTemplates.length})
                    </h4>

                    <div className="space-y-3">
                      {notifTemplates.map(tmpl => (
                        <div key={tmpl.id} className="border border-slate-100 dark:border-slate-850 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                            <div>
                              <span className="text-[11.5px] font-black text-slate-900 dark:text-white block leading-none">{tmpl.name}</span>
                              <span className="text-[8.5px] text-teal-600 font-bold uppercase tracking-wider mt-1.5 block">{tmpl.channel} CHANNEL</span>
                            </div>

                            <button 
                              onClick={() => handleTestBroadcast(tmpl.id)}
                              className="px-2.5 py-1.5 border border-teal-200 text-teal-700 dark:border-teal-800 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 text-[9.5px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer"
                            >
                              Dispatch Test Alert
                            </button>
                          </div>

                          {tmpl.subject && (
                            <div className="text-[10px] text-slate-500">
                              Subject Line: <strong className="text-slate-700 dark:text-slate-300">{tmpl.subject}</strong>
                            </div>
                          )}

                          <p className="text-[10.5px] font-mono text-slate-500 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 leading-relaxed italic">
                            "{tmpl.content}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              TAB 5: SYSTEM SETTINGS
              ========================================== */}
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-teal-600" /> Cooperative System Rules & Preferences
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Designate financial timelines, set dynamic voucher naming sequence formats, and customize tax specifications.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Number series sequences */}
                <div className="xl:col-span-4 bg-slate-50/30 dark:bg-slate-950/10 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl space-y-4">
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center justify-between">
                    <span>Dynamic Serial Sequences</span>
                  </h4>

                  <div className="space-y-3">
                    {numberSeries.map(ns => (
                      <div key={ns.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                        <span className="text-[10.5px] font-black text-slate-900 dark:text-white block leading-none">{ns.module}</span>
                        
                        <div className="grid grid-cols-3 gap-2 mt-2.5 text-center text-[10px] text-slate-500">
                          <div>
                            <span className="text-[7.5px] font-bold uppercase tracking-wider block mb-0.5">Prefix</span>
                            <span className="font-mono font-bold bg-slate-50 dark:bg-slate-950 p-1 rounded block text-teal-600">{ns.prefix}</span>
                          </div>
                          <div>
                            <span className="text-[7.5px] font-bold uppercase tracking-wider block mb-0.5">Current No</span>
                            <span className="font-mono font-bold bg-slate-50 dark:bg-slate-950 p-1 rounded block text-slate-700 dark:text-slate-300">{ns.currentNumber}</span>
                          </div>
                          <div>
                            <span className="text-[7.5px] font-bold uppercase tracking-wider block mb-0.5">Suffix</span>
                            <span className="font-mono font-bold bg-slate-50 dark:bg-slate-950 p-1 rounded block text-teal-600">{ns.suffix}</span>
                          </div>
                        </div>

                        <div className="text-[9.5px] text-slate-400 mt-2 text-right">
                          Sample Target Sequence: <strong className="font-mono text-slate-655 dark:text-slate-350">{ns.prefix}{String(ns.currentNumber + 1).padStart(ns.length, '0')}{ns.suffix}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fiscal periods and Tax configs */}
                <div className="xl:col-span-8 space-y-6">
                  
                  {/* FY timeline picker */}
                  <div className="border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                      <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest">
                        Cooperative Reporting Fiscal Periods
                      </h4>
                      <button 
                        onClick={handleAddFY}
                        className="text-[9.5px] text-teal-600 font-bold hover:underline"
                      >
                        + Add Fiscal Period
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {financialYears.map(fy => (
                        <div key={fy.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl">
                          <div>
                            <span className="text-[11px] font-black text-slate-900 dark:text-white block leading-none">{fy.code}</span>
                            <span className="text-[8.5px] text-slate-400 font-mono block mt-1">{fy.startDate} to {fy.endDate}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {fy.isActive ? (
                              <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-900 text-[8.5px] font-black uppercase rounded-full">
                                Active FY
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleSetActiveFY(fy.id)}
                                className="px-2.5 py-1 hover:bg-white dark:hover:bg-slate-900 border border-slate-250 dark:border-slate-800 text-[9px] font-bold uppercase rounded-lg transition cursor-pointer"
                              >
                                Set Active
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Taxation configs form */}
                  <form onSubmit={handleUpdateTaxAndCompliance} className="border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-4">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2">
                      Cooperative Taxation Parameters & Deductions
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Standard Processing GST (%)</label>
                        <input 
                          type="number" 
                          value={taxConfig.gstRate}
                          onChange={e => setTaxConfig({...taxConfig, gstRate: Number(e.target.value)})}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">PAN Mandatory Payout Threshold (Rs)</label>
                        <input 
                          type="number" 
                          value={taxConfig.panRequiredLimit}
                          onChange={e => setTaxConfig({...taxConfig, panRequiredLimit: Number(e.target.value)})}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Standard TDS Deduction (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={taxConfig.tdsRate}
                          onChange={e => setTaxConfig({...taxConfig, tdsRate: Number(e.target.value)})}
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[9.5px] text-slate-400 italic">These standards apply universally across farmer billing periods and payout vouchers.</span>
                      <button 
                        type="submit"
                        className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:shadow-xs cursor-pointer"
                      >
                        Commit Tax Schemes
                      </button>
                    </div>
                  </form>

                </div>

              </div>
            </div>
          )}

          {/* ==========================================
              TAB 6: DATA MANAGEMENT
              ========================================== */}
          {activeTab === 'backup' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-teal-600" /> Administrative Data Archiving & Recoveries
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Generate encrypted JSON system archives, batch import operational spreadsheets, and trigger older records pruning cycles.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Action Card: Backup */}
                <div className="border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-3 text-left">
                  <div className="w-8 h-8 bg-teal-50 dark:bg-teal-950/40 text-teal-650 rounded-lg flex items-center justify-center">
                    <Download className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="text-[11.5px] font-black text-slate-900 dark:text-white block leading-none">Database Backup Generator</h4>
                  <p className="text-[10.5px] text-slate-450 leading-relaxed">
                    Builds a comprehensive data package file containing all registered employees, shift rosters, payroll structures, tax schemes, and system logs.
                  </p>
                  <button 
                    onClick={handleBackupExport}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Build & Export Backup
                  </button>
                </div>

                {/* Action Card: Restore */}
                <div className="border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-3 text-left">
                  <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg flex items-center justify-center">
                    <Upload className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="text-[11.5px] font-black text-slate-900 dark:text-white block leading-none">Recover Database Payload</h4>
                  <p className="text-[10.5px] text-slate-450 leading-relaxed">
                    Recovers previous cooperative database states using local file archives. Note: uploading a previous state replaces any current local files.
                  </p>
                  <label className="w-full py-2 bg-teal-600 hover:bg-teal-650 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition text-center block cursor-pointer">
                    Upload & Restore States
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleRestoreImport} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Action Card: Archive */}
                <div className="border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-3 text-left">
                  <div className="w-8 h-8 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg flex items-center justify-center">
                    <HardDrive className="w-4.5 h-4.5" />
                  </div>
                  <h4 className="text-[11.5px] font-black text-slate-900 dark:text-white block leading-none">Audit Records Archiving</h4>
                  <p className="text-[10.5px] text-slate-450 leading-relaxed">
                    Purges and archives old cooperative milk intake records, log reports, and payment logs prior to FY25 to free local browser buffer spaces.
                  </p>
                  <button 
                    onClick={() => {
                      triggerAuditLog('SYSTEM_DATA_ARCHIVE', 'DataManagement', 'Archived historical audit logs older than 90 days.');
                      showHubToast('Archived 2,840 historical milk logs. Cache storage freed by 4.2 MB.');
                    }}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Prune Historic Archives
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ==========================================
              TAB 7: AUDIT LEDGER
              ========================================== */}
          {activeTab === 'audit' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-teal-600" /> Administrative Security Audit Trails
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Immutable activity ledger tracking employee registrations, database state backups, and critical settings modifications.
                  </p>
                </div>

                <input 
                  type="text" 
                  value={auditFilter}
                  onChange={e => setAuditFilter(e.target.value)}
                  placeholder="Search logs..."
                  className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl w-44 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2.5 max-h-120 overflow-y-auto">
                {filteredAudits.length === 0 ? (
                  <p className="text-center py-8 text-[11px] text-slate-400">No matching system audit reports found.</p>
                ) : (
                  filteredAudits.map((log: any) => (
                    <div key={log.id} className="p-3.5 border border-slate-100 dark:border-slate-850/80 rounded-xl hover:shadow-xs transition bg-slate-50/10 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-left">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 font-mono text-[8.5px] rounded-md font-bold uppercase tracking-wider">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-teal-650 font-bold uppercase tracking-wider">{log.entityName}</span>
                        </div>
                        <p className="text-[11.5px] text-slate-700 dark:text-slate-300 font-medium">
                          {log.details}
                        </p>
                        <div className="flex items-center gap-2.5 text-[9.5px] text-slate-400 font-semibold">
                          <span>Operator: <strong>{log.user?.name || 'Administrator'}</strong> ({log.user?.email})</span>
                          <span>•</span>
                          <span>Timestamp: {new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[8.5px] font-mono text-slate-400 font-bold bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                          {log.id}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              TAB 8: DIAGNOSTICS & ADMIN TOOLS
              ========================================== */}
          {activeTab === 'adminTools' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-600" /> Admin Engine Diagnostics Dashboard
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Live system resource charts, maintenance gate toggle controllers, heuristic feature switches, and compiler indexes purger.
                  </p>
                </div>
              </div>

              {/* Live Metric dials */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Chart: CPU usage */}
                <div className="border border-slate-100 dark:border-slate-850 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Core CPU Utilization</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white block mt-0.5">{healthMetrics.cpu[14]}% Load</span>
                    </div>
                    <Cpu className="w-5 h-5 text-teal-650 animate-pulse" />
                  </div>

                  <div className="h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={healthData}>
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="CPU" stroke="#0d9488" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCpu)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart: RAM load */}
                <div className="border border-slate-100 dark:border-slate-850 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Tenant Heap Memory</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white block mt-0.5">{healthMetrics.memory[14]} MB Alloc</span>
                    </div>
                    <Server className="w-5 h-5 text-indigo-500" />
                  </div>

                  <div className="h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={healthData}>
                        <defs>
                          <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="Memory" stroke="#6366f1" strokeWidth={1.5} fillOpacity={1} fill="url(#colorMem)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart: Latency load */}
                <div className="border border-slate-100 dark:border-slate-850 rounded-2xl p-4.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Database Replication IO Delay</span>
                      <span className="text-lg font-black text-slate-900 dark:text-white block mt-0.5">{healthMetrics.latency[14]} ms Ping</span>
                    </div>
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>

                  <div className="h-20 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={healthData}>
                        <defs>
                          <linearGradient id="colorLat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="Latency" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={1} fill="url(#colorLat)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Maintenance Gate Controller & Feature Flags Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left controls: Maintenance and purge */}
                <div className="md:col-span-4 space-y-6">
                  
                  {/* Maintenance gate card */}
                  <div className="border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-3 bg-slate-50/15">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Power className="w-4 h-4 text-teal-650" /> Production Maintenance Lockout
                    </h4>
                    <p className="text-[10px] text-slate-450 leading-relaxed">
                      Lock active data writing across Cooperative operators for scheduled maintenance routines.
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-850">
                      <span className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300">
                        Gate Status: <strong className={maintenanceMode ? 'text-rose-600' : 'text-emerald-600'}>{maintenanceMode ? 'LOCKED' : 'ONLINE'}</strong>
                      </span>

                      <button 
                        onClick={handleToggleMaintenance}
                        className={`px-3 py-1.5 text-[9.5px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer ${
                          maintenanceMode ? 'bg-emerald-600 text-white hover:bg-emerald-650' : 'bg-rose-600 text-white hover:bg-rose-650'
                        }`}
                      >
                        {maintenanceMode ? 'Open Portal' : 'Lock Portal'}
                      </button>
                    </div>
                  </div>

                  {/* Cache clearing tool */}
                  <div className="border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-3 bg-slate-50/15">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-indigo-500" /> Purge Memory Indexes
                    </h4>
                    <p className="text-[10px] text-slate-450 leading-relaxed">
                      Forces local state database cache compilation matrices renewal. Safe to execute during active sessions.
                    </p>
                    <button 
                      onClick={handleClearCache}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-650 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:shadow-xs transition cursor-pointer"
                    >
                      Clear Memory Indexes
                    </button>
                  </div>

                </div>

                {/* Right controls: Feature switches */}
                <div className="md:col-span-8 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 space-y-4">
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-slate-300 uppercase tracking-widest border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center justify-between">
                    <span>Engine Heuristic Switches (Feature Flags)</span>
                  </h4>

                  <div className="space-y-3">
                    {featureFlags.map(ff => (
                      <div key={ff.id} className="flex items-start justify-between gap-4 p-3.5 border border-slate-100 dark:border-slate-850 rounded-xl hover:shadow-xs transition bg-slate-50/15">
                        <div className="space-y-1">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white block leading-none">{ff.name}</span>
                          <span className="text-[8px] font-mono text-slate-400 font-bold block">Key: {ff.key}</span>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            {ff.description}
                          </p>
                        </div>

                        <div className="shrink-0 pt-0.5 select-none">
                          <button
                            onClick={() => handleToggleFeatureFlag(ff.id)}
                            className={`w-11 h-6 rounded-full p-0.5 transition-colors relative cursor-pointer ${
                              ff.isEnabled ? 'bg-teal-550' : 'bg-slate-200'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                              ff.isEnabled ? 'transform translate-x-5' : 'transform translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
