export interface Business {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface SessionData {
  business: Business;
  user: User;
  token: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export interface ActivityLog {
  id: string;
  businessId: string;
  userId: string;
  type: string;
  description: string;
  createdAt: string;
}

export interface BusinessPreferences {
  theme: string;
  currency: string;
  language: string;
  timezone: string;
}

export interface CooperativeUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  role: { id: string; name: string } | null;
}

export interface CooperativeRole {
  id: string;
  name: string;
  description?: string;
  businessId: string | null;
  createdAt: string;
  rolePermissions: {
    id: string;
    roleId: string;
    permissionId: string;
    permission: CooperativePermission;
  }[];
  _count?: {
    userRoles: number;
  };
}

export interface CooperativePermission {
  id: string;
  name: string; // e.g. "users:read"
  description?: string;
  group?: string; // e.g. "Users Management" (derived or handled)
}

export interface Farmer {
  id: string;
  businessId: string;
  code: string;
  name: string;
  address: string;
  contacts: string[];
  aadhaar?: string;
  pan?: string;
  gst?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  milkPreference: 'COW' | 'BUFFALO' | 'MIXED';
  status: 'ACTIVE' | 'INACTIVE';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MilkCollection {
  id: string;
  businessId: string;
  farmerId: string;
  farmerCode: string;
  farmerName: string;
  farmerPhone?: string;
  milkType: 'COW' | 'BUFFALO' | 'MIXED';
  quantity: number;
  fat: number;
  snf: number;
  clr?: number;
  temperature?: number;
  ratePerLiter: number;
  totalAmount: number;
  shift: 'MORNING' | 'EVENING';
  collectedAt: string;
  remarks?: string;
  manualAdjustment: number;
  qualityGrade: 'A' | 'B' | 'C' | 'D';
  createdAt: string;
  updatedAt: string;
}

export interface RateChart {
  id: string;
  businessId: string;
  name: string;
  milkType: 'COW' | 'BUFFALO' | 'MIXED';
  pricingMethod: 'FAT_ONLY' | 'SNF_ONLY' | 'FAT_SNF_SOLIDS' | 'MATRIX_LOOKUP';
  baseRate: number;
  fatStandard: number;
  snfStandard: number;
  fatPremium: number;
  snfPremium: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  shift?: 'MORNING' | 'EVENING' | 'BOTH';
  createdAt: string;
  updatedAt: string;
}

export interface FarmerLedger {
  id: string;
  businessId: string;
  farmerId: string;
  farmerCode: string;
  farmerName: string;
  date: string;
  transactionType: 'COLLECTION' | 'PAYMENT' | 'ADVANCE' | 'ADJUSTMENT' | 'RECOVERY';
  referenceId?: string;
  credit: number;
  debit: number;
  balance: number;
  remarks?: string;
  createdAt: string;
}

export interface FarmerBalance {
  farmerId: string;
  farmerCode: string;
  farmerName: string;
  openingBalance: number;
  totalCredit: number;
  totalDebit: number;
  closingBalance: number;
}

export interface PaymentVoucher {
  id: string;
  businessId: string;
  voucherNumber: string;
  farmerId: string;
  farmerCode: string;
  farmerName: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI';
  transactionReference?: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'FAILED';
  paidAt: string;
  remarks?: string;
  createdAt: string;
}

export interface FarmerBill {
  id: string;
  businessId: string;
  billNumber: string;
  farmerId: string;
  farmerCode: string;
  farmerName: string;
  startDate: string;
  endDate: string;
  milkQuantity: number;
  avgFat: number;
  avgSnf: number;
  milkAmount: number;
  bonusAmount: number;
  incentiveAmount: number;
  deductionAmount: number;
  penaltyAmount: number;
  roundOff: number;
  netAmount: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategory {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Product {
  id: string;
  businessId: string;
  categoryId: string;
  categoryName?: string;
  sku: string;
  barcode?: string;
  qrCode?: string;
  name: string;
  brand?: string;
  description?: string;
  price: number;
  costPrice?: number;
  unit: string;
  imageUrl?: string;
  isActive: boolean;
  minStock?: number;
  maxStock?: number;
  reorderLevel?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Warehouse {
  id: string;
  businessId: string;
  name: string;
  code: string;
  address?: string;
  createdAt: string;
}

export interface ProductStock {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  batchNumber?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  updatedAt: string;
}

export interface StockEntry {
  id: string;
  businessId: string;
  entryNumber: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  type: 'OPENING' | 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'VERIFICATION';
  reason?: string;
  batchNumber?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  performedBy: string;
  createdAt: string;
}

export interface StockTransfer {
  id: string;
  businessId: string;
  transferNumber: string;
  productId: string;
  productName: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  quantity: number;
  remarks?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  performedBy: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  code: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  gstin?: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  totalAmount: number;
  batchNumber?: string;
  expiryDate?: string;
  manufacturingDate?: string;
}

export interface PurchaseEntry {
  id: string;
  businessId: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  purchaseDate: string;
  totalAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  remarks?: string;
  items: PurchaseItem[];
  createdAt: string;
}

export interface DeliveryRoute {
  id: string;
  businessId: string;
  code: string;
  name: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  startLocation?: string;
  endLocation?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryArea {
  id: string;
  businessId: string;
  routeId: string;
  routeName?: string;
  name: string;
  zone: string;
  pincode: string;
  createdAt: string;
}

export interface CustomerSubscription {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  routeId: string;
  routeName?: string;
  deliveryAreaId: string;
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  price: number;
  frequency: 'DAILY' | 'ALTERNATE_DAYS' | 'WEEKLY' | 'MONTHLY';
  quantity: number;
  status: 'ACTIVE' | 'HOLD' | 'CANCELLED';
  startDate: string;
  holdStartDate?: string;
  holdEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryLog {
  id: string;
  businessId: string;
  deliveryDate: string;
  shift: 'MORNING' | 'EVENING';
  routeId: string;
  routeName?: string;
  driverName?: string;
  customerId: string;
  customerName: string;
  subscriptionId?: string;
  type: 'SUBSCRIPTION' | 'ONE_TIME';
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalAmount: number;
  status: 'PENDING' | 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'FAILED';
  deliveredQuantity?: number;
  returnedQuantity?: number;
  reason?: string;
  notes?: string;
  proofImage?: string;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

export interface ChartAccount {
  id: string;
  businessId: string;
  code: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  currentBalance: number;
  isActive: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  date: string;
  categoryId: string; // references ChartAccount (EXPENSE type)
  categoryName: string;
  amount: number;
  paidTo: string; // Vendor / Employee
  paidFromAccountId: string; // references Cash or Bank Account
  paidFromAccountName: string;
  paymentMode: 'CASH' | 'BANK' | 'UPI';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  notes?: string;
  isRecurring: boolean;
  recurrenceInterval?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NONE';
  attachments?: string[]; // simulated base64/filenames
  vendorRef?: string;
  createdAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountName: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
}

export interface Voucher {
  id: string;
  businessId: string;
  voucherNo: string;
  date: string;
  type: 'PAYMENT' | 'RECEIPT' | 'JOURNAL';
  paymentMode?: 'CASH' | 'BANK' | 'UPI';
  totalAmount: number;
  notes?: string;
  lines: JournalLine[];
  createdBy: string;
  createdAt: string;
}

export interface DailyClosing {
  id: string;
  businessId: string;
  date: string;
  cashOpening: number;
  cashReceived: number;
  cashPaid: number;
  cashClosing: number;
  bankOpening: number;
  bankReceived: number;
  bankPaid: number;
  bankClosing: number;
  status: 'OPEN' | 'LOCKED';
  closedBy?: string;
  closedAt?: string;
}

export interface FinancialAuditLog {
  id: string;
  businessId: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
}







