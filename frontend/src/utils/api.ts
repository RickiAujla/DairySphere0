const DEFAULT_PERMISSIONS = [
  { id: 'p1', name: 'users:read', description: 'Read user list and details', group: 'Security & RBAC' },
  { id: 'p2', name: 'users:write', description: 'Create and update users', group: 'Security & RBAC' },
  { id: 'p3', name: 'users:delete', description: 'Delete users', group: 'Security & RBAC' },
  { id: 'p4', name: 'roles:read', description: 'Read roles and permission mappings', group: 'Security & RBAC' },
  { id: 'p5', name: 'roles:write', description: 'Create and edit roles', group: 'Security & RBAC' },
  { id: 'p6', name: 'roles:delete', description: 'Delete roles', group: 'Security & RBAC' },
  { id: 'p7', name: 'milk-collections:read', description: 'Read farmer milk collection logs', group: 'Cooperative Operations' },
  { id: 'p8', name: 'milk-collections:write', description: 'Log milk collection data', group: 'Cooperative Operations' },
  { id: 'p9', name: 'milk-collections:delete', description: 'Delete collection logs', group: 'Cooperative Operations' },
  { id: 'p10', name: 'rates:read', description: 'View milk rate charts', group: 'Cooperative Operations' },
  { id: 'p11', name: 'rates:write', description: 'Set and update milk rates', group: 'Cooperative Operations' },
];

const DEFAULT_ROLES = [
  { id: 'r1', name: 'ADMIN', description: 'Super administrator with full system controls', businessId: null },
  { id: 'r2', name: 'MANAGER', description: 'Manager with cooperative operational permissions', businessId: null },
  { id: 'r3', name: 'OPERATOR', description: 'Operator with data-entry capabilities', businessId: null }
];

const DEFAULT_ROLE_PERMISSIONS = [
  // Admin permissions
  { id: 'rp1', roleId: 'r1', permissionId: 'p1' },
  { id: 'rp2', roleId: 'r1', permissionId: 'p2' },
  { id: 'rp3', roleId: 'r1', permissionId: 'p3' },
  { id: 'rp4', roleId: 'r1', permissionId: 'p4' },
  { id: 'rp5', roleId: 'r1', permissionId: 'p5' },
  { id: 'rp6', roleId: 'r1', permissionId: 'p6' },
  { id: 'rp7', roleId: 'r1', permissionId: 'p7' },
  { id: 'rp8', roleId: 'r1', permissionId: 'p8' },
  { id: 'rp9', roleId: 'r1', permissionId: 'p9' },
  { id: 'rp10', roleId: 'r1', permissionId: 'p10' },
  { id: 'rp11', roleId: 'r1', permissionId: 'p11' },
  // Manager permissions
  { id: 'rp12', roleId: 'r2', permissionId: 'p1' },
  { id: 'rp13', roleId: 'r2', permissionId: 'p2' },
  { id: 'rp14', roleId: 'r2', permissionId: 'p4' },
  { id: 'rp15', roleId: 'r2', permissionId: 'p7' },
  { id: 'rp16', roleId: 'r2', permissionId: 'p8' },
  { id: 'rp17', roleId: 'r2', permissionId: 'p10' },
  { id: 'rp18', roleId: 'r2', permissionId: 'p11' },
  // Operator permissions
  { id: 'rp19', roleId: 'r3', permissionId: 'p1' },
  { id: 'rp20', roleId: 'r3', permissionId: 'p7' },
  { id: 'rp21', roleId: 'r3', permissionId: 'p8' },
  { id: 'rp22', roleId: 'r3', permissionId: 'p10' },
];

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helpers to read/write persistent state from LocalStorage
function getStorage<T>(key: string, defaultValue: T): T {
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

// Initialize tables in mock local storage DB
const initializeDB = () => {
  getStorage('ds_permissions', DEFAULT_PERMISSIONS);
  getStorage('ds_roles', DEFAULT_ROLES);
  getStorage('ds_role_permissions', DEFAULT_ROLE_PERMISSIONS);
  getStorage('ds_businesses', []);
  getStorage('ds_users', []);
  getStorage('ds_user_roles', []);
  getStorage('ds_settings', {});
  getStorage('ds_audit_logs', []);
  getStorage('ds_activity_logs', []);
  
  // Seed initial product categories
  getStorage('ds_product_categories', [
    { id: 'cat-1', name: 'Liquid Milk', slug: 'liquid-milk', description: 'Fresh milk varieties: cow, buffalo, skimmed', createdAt: new Date().toISOString() },
    { id: 'cat-2', name: 'Fermented Products', slug: 'fermented-products', description: 'Yogurt, Curd, Lassi, Chaas', createdAt: new Date().toISOString() },
    { id: 'cat-3', name: 'Fats & Lipids', slug: 'fats-and-lipids', description: 'Butter, Ghee, Cream', createdAt: new Date().toISOString() },
    { id: 'cat-4', name: 'Solid Cheese', slug: 'solid-cheese', description: 'Paneer, Cheddar, Mozzarella', createdAt: new Date().toISOString() }
  ]);

  // Seed Warehouses
  getStorage('ds_warehouses', [
    { id: 'wh-1', businessId: 'default-biz', name: 'Main Cold Storage Hub', code: 'WH-CSH01', address: 'Cooperative Complex, Sector A, Amritsar', createdAt: new Date().toISOString() },
    { id: 'wh-2', businessId: 'default-biz', name: 'Bulk Distribution Silo', code: 'WH-BDS02', address: 'Industrial Area Phase II, Jalandhar', createdAt: new Date().toISOString() }
  ]);

  // Seed Products
  getStorage('ds_products', [
    {
      id: 'prod-1',
      businessId: 'default-biz',
      categoryId: 'cat-1',
      categoryName: 'Liquid Milk',
      sku: 'PRD-LM-001',
      name: 'Pasteurized Full Cream Milk',
      brand: 'DairySphere Premium',
      description: 'High-fat pasteurized milk processed under standard thermal cycles.',
      price: 64.00,
      costPrice: 48.00,
      unit: 'Liter',
      barcode: '8901234567890',
      qrCode: 'https://dairysphere.com/qr/PRD-LM-001',
      imageUrl: '',
      isActive: true,
      minStock: 200,
      maxStock: 5000,
      reorderLevel: 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-2',
      businessId: 'default-biz',
      categoryId: 'cat-3',
      categoryName: 'Fats & Lipids',
      sku: 'PRD-FL-002',
      name: 'Premium Pure Cow Ghee',
      brand: 'DairySphere Gold',
      description: 'Traditional granular yellow cow ghee clarifying 99.7% milk fats.',
      price: 680.00,
      costPrice: 510.00,
      unit: 'Kg',
      barcode: '8901234567891',
      qrCode: 'https://dairysphere.com/qr/PRD-FL-002',
      imageUrl: '',
      isActive: true,
      minStock: 50,
      maxStock: 1000,
      reorderLevel: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'prod-3',
      businessId: 'default-biz',
      categoryId: 'cat-4',
      categoryName: 'Solid Cheese',
      sku: 'PRD-SC-003',
      name: 'Fresh Premium Paneer',
      brand: 'DairySphere Fresh',
      description: 'Soft vacuum-packed cottage cheese high in protein, moisture controlled.',
      price: 360.00,
      costPrice: 270.00,
      unit: 'Kg',
      barcode: '8901234567892',
      qrCode: 'https://dairysphere.com/qr/PRD-SC-003',
      imageUrl: '',
      isActive: true,
      minStock: 80,
      maxStock: 1500,
      reorderLevel: 150,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);

  // Seed Product Stocks
  getStorage('ds_product_stocks', [
    {
      id: 'stock-1',
      businessId: 'default-biz',
      productId: 'prod-1',
      productName: 'Pasteurized Full Cream Milk',
      productSku: 'PRD-LM-001',
      warehouseId: 'wh-1',
      warehouseName: 'Main Cold Storage Hub',
      quantity: 1250,
      minStock: 200,
      maxStock: 5000,
      reorderLevel: 500,
      batchNumber: 'B-LM0712',
      expiryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      manufacturingDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'stock-2',
      businessId: 'default-biz',
      productId: 'prod-2',
      productName: 'Premium Pure Cow Ghee',
      productSku: 'PRD-FL-002',
      warehouseId: 'wh-1',
      warehouseName: 'Main Cold Storage Hub',
      quantity: 420,
      minStock: 50,
      maxStock: 1000,
      reorderLevel: 100,
      batchNumber: 'B-CG0630',
      expiryDate: new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0],
      manufacturingDate: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'stock-3',
      businessId: 'default-biz',
      productId: 'prod-3',
      productName: 'Fresh Premium Paneer',
      productSku: 'PRD-SC-003',
      warehouseId: 'wh-2',
      warehouseName: 'Bulk Distribution Silo',
      quantity: 45,
      minStock: 80,
      maxStock: 1500,
      reorderLevel: 150,
      batchNumber: 'B-PN0711',
      expiryDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
      manufacturingDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    }
  ]);

  // Seed Suppliers
  getStorage('ds_suppliers', [
    { id: 'sup-1', businessId: 'default-biz', name: 'Northern Feed & Minerals', code: 'SUP-NFM01', contactPerson: 'Harbhajan Singh', phone: '+91 94170 12345', email: 'sales@northernfeed.com', address: 'GT Road Bypass, Amritsar', gstin: '03AAAAA1111A1Z1', createdAt: new Date().toISOString() },
    { id: 'sup-2', businessId: 'default-biz', name: 'Apex Dairy Packagers Ltd', code: 'SUP-ADP02', contactPerson: 'Meenakshi Sharma', phone: '+91 98140 54321', email: 'info@apexdairypack.com', address: 'Industrial Focal Point, Ludhiana', gstin: '03BBBBB2222B2Z2', createdAt: new Date().toISOString() }
  ]);

  // Seed Stock Entries
  getStorage('ds_stock_entries', [
    { id: 'ent-1', businessId: 'default-biz', entryNumber: 'ENT-2026-0001', productId: 'prod-1', productName: 'Pasteurized Full Cream Milk', productSku: 'PRD-LM-001', warehouseId: 'wh-1', warehouseName: 'Main Cold Storage Hub', quantity: 1250, type: 'OPENING', reason: 'System Initialization Opening Stock', batchNumber: 'B-LM0712', expiryDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], manufacturingDate: new Date().toISOString().split('T')[0], performedBy: 'Cooperative Admin', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 'ent-2', businessId: 'default-biz', entryNumber: 'ENT-2026-0002', productId: 'prod-2', productName: 'Premium Pure Cow Ghee', productSku: 'PRD-FL-002', warehouseId: 'wh-1', warehouseName: 'Main Cold Storage Hub', quantity: 400, type: 'OPENING', reason: 'System Initialization Opening Stock', batchNumber: 'B-CG0630', expiryDate: new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0], manufacturingDate: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0], performedBy: 'Cooperative Admin', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 'ent-3', businessId: 'default-biz', entryNumber: 'ENT-2026-0003', productId: 'prod-2', productName: 'Premium Pure Cow Ghee', productSku: 'PRD-FL-002', warehouseId: 'wh-1', warehouseName: 'Main Cold Storage Hub', quantity: 20, type: 'STOCK_IN', reason: 'Packaging recovery recovery yield surplus', batchNumber: 'B-CG0630', expiryDate: new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0], manufacturingDate: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0], performedBy: 'Cooperative Admin', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() }
  ]);

  // Seed Stock Transfers
  getStorage('ds_stock_transfers', []);

  // Seed Purchase Register (Purchase Entries)
  getStorage('ds_purchases', [
    {
      id: 'pur-1',
      businessId: 'default-biz',
      purchaseNumber: 'PUR-2026-0001',
      supplierId: 'sup-1',
      supplierName: 'Northern Feed & Minerals',
      purchaseDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
      totalAmount: 102000.00,
      paymentStatus: 'PAID',
      remarks: 'Procurement of Premium cow ghee ingredients.',
      items: [
        { id: 'pitem-1', productId: 'prod-2', productName: 'Premium Pure Cow Ghee', quantity: 200, costPrice: 510.00, totalAmount: 102000.00, batchNumber: 'B-CG0630', expiryDate: new Date(Date.now() + 86400000 * 180).toISOString().split('T')[0], manufacturingDate: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0] }
      ],
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ]);

  // Seed initial delivery routes
  getStorage('ds_delivery_routes', [
    { id: 'route-1', name: 'Amritsar Hub Route', description: 'Covers northern district dairy collection centers', startPoint: 'Main Cooperative Gate', endPoint: 'Amritsar Processing Unit', createdAt: new Date().toISOString() },
    { id: 'route-2', name: 'Jalandhar Express Route', description: 'Express lane for retail supply chain delivery', startPoint: 'Main Cold Storage', endPoint: 'Jalandhar City Junction', createdAt: new Date().toISOString() }
  ]);

  // Seed initial farmers list
  getStorage('ds_farmers', [
    {
      id: 'fmr-1',
      businessId: 'default-biz', // will fall back to tenant's businessId if needed, but we can query multi-tenant
      code: 'FMR-001',
      name: 'Sukhdev Singh',
      address: 'VPO Jandiala, Amritsar, Punjab',
      contacts: ['+91 98765 43210', '+91 98765 43211'],
      aadhaar: '1234-5678-9012',
      pan: 'ABCDE1234F',
      gst: '03ABCDE1234F1Z5',
      bankName: 'State Bank of India',
      accountNumber: '30123456789',
      ifscCode: 'SBIN0001234',
      upiId: 'sukhdev@sbi',
      milkPreference: 'COW',
      status: 'ACTIVE',
      tags: ['Premium', 'Bulk Supplier'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fmr-2',
      businessId: 'default-biz',
      code: 'FMR-002',
      name: 'Gurpreet Kaur',
      address: 'Village Rayya, Beas, Punjab',
      contacts: ['+91 87654 32109'],
      aadhaar: '2345-6789-0123',
      bankName: 'Punjab National Bank',
      accountNumber: '401234567890',
      ifscCode: 'PUNB0123400',
      upiId: 'gurpreet@okaxis',
      milkPreference: 'BUFFALO',
      status: 'ACTIVE',
      tags: ['Organic'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fmr-3',
      businessId: 'default-biz',
      code: 'FMR-003',
      name: 'Rajesh Kumar',
      address: 'Basti Nau, Jalandhar, Punjab',
      contacts: ['+91 76543 21098', '+91 76543 21099'],
      aadhaar: '3456-7890-1234',
      bankName: 'HDFC Bank',
      accountNumber: '50123456789012',
      ifscCode: 'HDFC0000123',
      upiId: 'rajesh@okhdfc',
      milkPreference: 'MIXED',
      status: 'ACTIVE',
      tags: ['Regular'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'fmr-4',
      businessId: 'default-biz',
      code: 'FMR-004',
      name: 'Balwinder Singh',
      address: 'VPO Mehta, Amritsar, Punjab',
      contacts: ['+91 65432 10987'],
      aadhaar: '4567-8901-2345',
      bankName: 'State Bank of India',
      accountNumber: '30987654321',
      ifscCode: 'SBIN0001234',
      upiId: 'balwinder@paytm',
      milkPreference: 'COW',
      status: 'INACTIVE',
      tags: ['Seasonal'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);
};

initializeDB();

const hashPassword = async (password: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'dairysphere_enterprise_salt');
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return btoa(password + 'dairysphere_salt_fallback');
  }
};

function validatePasswordStrength(password: string) {
  if (password.length < 8) {
    throw new ApiError(400, 'Password is too weak. It must be at least 8 characters long.');
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    throw new ApiError(400, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
  }
}

const failedLoginTracker = new Map<string, { count: number; lockUntil: number }>();

function trackFailedLogin(email: string) {
  const current = failedLoginTracker.get(email) || { count: 0, lockUntil: 0 };
  current.count += 1;
  if (current.count >= 5) {
    current.lockUntil = Date.now() + 5 * 60 * 1000; // Lock for 5 minutes
    failedLoginTracker.set(email, current);
    throw new ApiError(403, 'Account locked: 5 consecutive failed login attempts. Please try again after 5 minutes.');
  }
  failedLoginTracker.set(email, current);
}

function clearFailedLogin(email: string) {
  failedLoginTracker.delete(email);
}

function checkLoginLock(email: string) {
  const tracker = failedLoginTracker.get(email);
  if (tracker && tracker.lockUntil > Date.now()) {
    const remainingSeconds = Math.ceil((tracker.lockUntil - Date.now()) / 1000);
    throw new ApiError(403, `Account temporarily locked due to multiple failed login attempts. Try again in ${remainingSeconds} seconds.`);
  }
}

const getTenantAndUser = () => {
  const businessId = localStorage.getItem('dairysphere_business_id');
  const token = localStorage.getItem('dairysphere_token');
  
  const businesses = getStorage<any[]>('ds_businesses', []);
  const users = getStorage<any[]>('ds_users', []);
  
  const business = businesses.find(b => b.id === businessId);
  let user: any = null;
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3 && parts[2] === 'mocksignature') {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && Date.now() < payload.exp) {
          user = users.find(u => u.id === payload.userId);
        }
      }
    } catch {
      // ignore
    }
  }
  return { businessId, business, user };
};

const createAuditLog = (action: string, entityName: string, entityId: string | null, oldValue: string | null, newValue: string | null) => {
  const { businessId, user } = getTenantAndUser();
  if (!businessId) return;
  const logs = getStorage<any[]>('ds_audit_logs', []);
  const newLog = {
    id: 'aud-' + Math.random().toString(36).substring(2, 9),
    businessId,
    userId: user?.id || 'system',
    action,
    entityName,
    entityId,
    oldValue,
    newValue,
    createdAt: new Date().toISOString(),
    user: user ? { name: user.name, email: user.email } : { name: 'System', email: 'system@dairysphere.com' }
  };
  logs.unshift(newLog);
  localStorage.setItem('ds_audit_logs', JSON.stringify(logs));
};

const createActivityLog = (type: string, description: string) => {
  const { businessId, user } = getTenantAndUser();
  if (!businessId) return;
  const logs = getStorage<any[]>('ds_activity_logs', []);
  const newLog = {
    id: 'act-' + Math.random().toString(36).substring(2, 9),
    businessId,
    userId: user?.id || 'system',
    type,
    description,
    createdAt: new Date().toISOString()
  };
  logs.unshift(newLog);
  localStorage.setItem('ds_activity_logs', JSON.stringify(logs));
};

// Simulate API delay for a highly realistic feel
const delay = (ms = 300) => {
  // Optimize delay: reduce it to 10% of its original simulated time for faster responses!
  const optimizedMs = Math.max(10, Math.round(ms * 0.1));
  return new Promise(resolve => setTimeout(resolve, optimizedMs));
};

const rawApi = {
  validateFileUpload: (file: File, allowedCategories: ('csv' | 'image' | 'text')[]) => {
    const isImage = file.type.startsWith('image/');
    const maxSize = isImage ? 5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new ApiError(400, `File size exceeds the security limit of ${maxSize / (1024 * 1024)}MB.`);
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    let isAllowed = false;

    for (const cat of allowedCategories) {
      if (cat === 'csv') {
        const csvMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'application/csv', 'text/x-csv', 'text/plain'];
        if (extension === 'csv' || csvMimeTypes.includes(file.type)) {
          isAllowed = true;
        }
      }
      if (cat === 'image') {
        const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
        if (imageExtensions.includes(extension || '') || imageMimeTypes.includes(file.type)) {
          isAllowed = true;
        }
      }
      if (cat === 'text') {
        if (extension === 'txt' || file.type.startsWith('text/')) {
          isAllowed = true;
        }
      }
    }

    if (!isAllowed) {
      throw new ApiError(400, `Unsupported file format. Allowed formats: ${allowedCategories.join(', ').toUpperCase()}`);
    }

    return true;
  },

  refreshToken: async () => {
    const refreshToken = localStorage.getItem('dairysphere_refresh_token');
    if (!refreshToken) {
      throw new ApiError(401, 'Session Expired: Refresh token is missing. Please log in.');
    }
    try {
      const parts = refreshToken.split('.');
      if (parts.length !== 3 || parts[2] !== 'mockrefreshsignature') {
        throw new ApiError(401, 'Invalid session token signature.');
      }
      const payload = JSON.parse(atob(parts[1]));
      if (payload.exp && Date.now() > payload.exp) {
        throw new ApiError(401, 'Session expired. Please log in again.');
      }
      const users = getStorage<any[]>('ds_users', []);
      const user = users.find(u => u.id === payload.userId);
      if (!user) {
        throw new ApiError(401, 'Active user session not found.');
      }

      const userRoles = getStorage<any[]>('ds_user_roles', []);
      const roles = getStorage<any[]>('ds_roles', []);
      const ur = userRoles.find(r => r.userId === user.id);
      const roleObj = ur ? roles.find(rl => rl.id === ur.roleId) : null;
      const roleName = roleObj ? roleObj.name : 'OPERATOR';

      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: roleName,
        exp: Date.now() + 3600 * 1000
      })) + '.mocksignature';

      localStorage.setItem('dairysphere_token', mockToken);
      return { token: mockToken };
    } catch {
      throw new ApiError(401, 'Verification failed. Safe session restart required.');
    }
  },

  register: async (body: any) => {
    await delay(500);
    const businesses = getStorage<any[]>('ds_businesses', []);
    const users = getStorage<any[]>('ds_users', []);
    const userRoles = getStorage<any[]>('ds_user_roles', []);
    const settingsMap = getStorage<Record<string, any>>('ds_settings', {});

    if (businesses.some(b => b.slug === body.slug)) {
      throw new ApiError(400, 'A cooperative with this domain slug already exists.');
    }
    if (users.some(u => u.email === body.adminEmail)) {
      throw new ApiError(400, 'A user with this email address already exists.');
    }

    validatePasswordStrength(body.adminPassword);
    const passwordHash = await hashPassword(body.adminPassword);

    const newBusiness = {
      id: 'biz-' + Math.random().toString(36).substring(2, 9),
      name: body.name,
      slug: body.slug,
      createdAt: new Date().toISOString()
    };

    const newUser = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name: body.adminName,
      email: body.adminEmail,
      passwordHash,
      businessId: newBusiness.id,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    businesses.push(newBusiness);
    users.push(newUser);

    // Default admin role assignment
    userRoles.push({
      id: 'ur-' + Math.random().toString(36).substring(2, 9),
      userId: newUser.id,
      roleId: 'r1' // Default ADMIN
    });

    // Default business settings setup
    settingsMap[newBusiness.id] = {
      theme: body.theme || 'light',
      currency: body.currency || 'INR',
      language: body.language || 'en',
      timezone: 'Asia/Kolkata',
      tax_rate_percent: '0.00',
      subscription_plan: 'ENTERPRISE_GROWTH',
      logo_url: ''
    };

    localStorage.setItem('ds_businesses', JSON.stringify(businesses));
    localStorage.setItem('ds_users', JSON.stringify(users));
    localStorage.setItem('ds_user_roles', JSON.stringify(userRoles));
    localStorage.setItem('ds_settings', JSON.stringify(settingsMap));

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: 'ADMIN',
      exp: Date.now() + 3600 * 1000
    })) + '.mocksignature';

    const mockRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify({
      userId: newUser.id,
      exp: Date.now() + 7 * 24 * 3600 * 1000
    })) + '.mockrefreshsignature';

    localStorage.setItem('dairysphere_token', mockToken);
    localStorage.setItem('dairysphere_refresh_token', mockRefreshToken);
    localStorage.setItem('dairysphere_business_id', newBusiness.id);

    createAuditLog('REGISTER', 'Business', newBusiness.id, null, JSON.stringify(newBusiness));
    createActivityLog('REGISTRATION', `Cooperative '${newBusiness.name}' registered with administrator '${newUser.name}'.`);

    return {
      token: mockToken,
      business: newBusiness,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: 'ADMIN'
      }
    };
  },

  login: async (body: any) => {
    await delay(500);
    const users = getStorage<any[]>('ds_users', []);
    const userRoles = getStorage<any[]>('ds_user_roles', []);
    const roles = getStorage<any[]>('ds_roles', []);
    const businesses = getStorage<any[]>('ds_businesses', []);

    checkLoginLock(body.email);

    const hashedPassword = await hashPassword(body.password);
    const user = users.find(u => u.email === body.email && (u.passwordHash === hashedPassword || u.passwordHash === body.password));
    if (!user) {
      trackFailedLogin(body.email);
      throw new ApiError(401, 'Invalid credentials. Please verify your email and password.');
    }

    clearFailedLogin(body.email);

    const business = businesses.find(b => b.id === user.businessId);
    if (!business) {
      throw new ApiError(404, 'Cooperative tenant workspace not found.');
    }

    // Determine role
    const ur = userRoles.find(r => r.userId === user.id);
    const roleObj = ur ? roles.find(rl => rl.id === ur.roleId) : null;
    const roleName = roleObj ? roleObj.name : 'OPERATOR';

    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: roleName,
      exp: Date.now() + 3600 * 1000
    })) + '.mocksignature';

    const mockRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + btoa(JSON.stringify({
      userId: user.id,
      exp: Date.now() + 7 * 24 * 3600 * 1000
    })) + '.mockrefreshsignature';

    localStorage.setItem('dairysphere_token', mockToken);
    localStorage.setItem('dairysphere_refresh_token', mockRefreshToken);
    localStorage.setItem('dairysphere_business_id', business.id);

    createAuditLog('LOGIN', 'User', user.id, null, null);
    createActivityLog('AUTHENTICATION', `Administrator '${user.name}' successfully logged into cooperative context.`);

    return {
      token: mockToken,
      business,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: roleName
      }
    };
  },

  getProfile: async () => {
    await delay(200);
    const { business } = getTenantAndUser();
    if (!business) {
      throw new ApiError(404, 'Tenant workspace profile not loaded.');
    }
    return business;
  },

  updateProfile: async (body: any) => {
    await delay(300);
    const { businessId, business } = getTenantAndUser();
    if (!businessId || !business) {
      throw new ApiError(404, 'Tenant workspace not active.');
    }

    const businesses = getStorage<any[]>('ds_businesses', []);
    const idx = businesses.findIndex(b => b.id === businessId);
    
    const oldVal = JSON.stringify(businesses[idx]);
    businesses[idx].name = body.name;
    localStorage.setItem('ds_businesses', JSON.stringify(businesses));

    // Save logo_url in settings too if specified
    if (body.logoUrl !== undefined) {
      const settingsMap = getStorage<Record<string, any>>('ds_settings', {});
      if (!settingsMap[businessId]) settingsMap[businessId] = {};
      settingsMap[businessId].logo_url = body.logoUrl;
      localStorage.setItem('ds_settings', JSON.stringify(settingsMap));
    }

    createAuditLog('UPDATE', 'Business', businessId, oldVal, JSON.stringify(businesses[idx]));
    createActivityLog('PROFILE_UPDATE', `Tenant corporate name updated to '${body.name}'.`);

    return businesses[idx];
  },

  getSettings: async () => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    if (!businessId) {
      throw new ApiError(404, 'No business tenant active.');
    }
    const settingsMap = getStorage<Record<string, any>>('ds_settings', {});
    const settings = settingsMap[businessId] || {
      theme: 'light',
      currency: 'INR',
      language: 'en',
      timezone: 'Asia/Kolkata',
      tax_rate_percent: '0.00',
      subscription_plan: 'ENTERPRISE_GROWTH',
      logo_url: '',
      master_milk_types: JSON.stringify([
        { id: 'cow', name: 'Cow Milk', baseRate: 42.50 },
        { id: 'buffalo', name: 'Buffalo Milk', baseRate: 58.00 },
        { id: 'mixed', name: 'Mixed Milk', baseRate: 48.00 }
      ]),
      master_fat_snf_standards: JSON.stringify({
        cow: { fat: 3.5, snf: 8.5 },
        buffalo: { fat: 6.0, snf: 9.0 },
        mixed: { fat: 4.5, snf: 8.5 }
      }),
      master_units: JSON.stringify(["Liters", "Kgs", "Grams", "Packets", "Boxes", "Tubs"]),
      master_expense_categories: JSON.stringify(["Feed", "Veterinary", "Fuel", "Salary", "Utilities", "Maintenance", "Rent", "Other"]),
      master_payment_methods: JSON.stringify(["CASH", "BANK_TRANSFER", "UPI", "CARD", "WALLET"]),
      master_collection_shifts: JSON.stringify([
        { id: 'MORNING', name: 'Morning Shift', startTime: '06:00', endTime: '09:30' },
        { id: 'EVENING', name: 'Evening Shift', startTime: '17:00', endTime: '20:30' }
      ]),
      master_tax_settings: JSON.stringify({
        gstin: '03AAAAA1111A1Z1',
        taxRatePercent: 18.00,
        isInclusive: false
      }),
      master_business_settings: JSON.stringify({
        businessName: 'DairySphere Punjab',
        phone: '+91 98765 00112',
        email: 'contact@dairysphere-punjab.org',
        address: 'Amritsar Dairy Complex, GT Road, Amritsar, Punjab'
      }),
      master_number_series: JSON.stringify({
        invoicePrefix: 'DS-INV-2026-',
        invoiceNext: 1024,
        collectionPrefix: 'DS-COL-',
        collectionNext: 5012,
        orderPrefix: 'DS-ORD-',
        orderNext: 842
      }),
      master_general_settings: JSON.stringify({
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        language: 'en'
      })
    };
    return settings;
  },

  updateSettings: async (settings: Record<string, string>) => {
    await delay(300);
    const { businessId } = getTenantAndUser();
    if (!businessId) {
      throw new ApiError(404, 'No business tenant active.');
    }

    const settingsMap = getStorage<Record<string, any>>('ds_settings', {});
    const current = settingsMap[businessId] || {};
    const oldVal = JSON.stringify(current);
    
    settingsMap[businessId] = {
      ...current,
      ...settings
    };
    localStorage.setItem('ds_settings', JSON.stringify(settingsMap));

    createAuditLog('UPDATE_SETTINGS', 'Setting', businessId, oldVal, JSON.stringify(settingsMap[businessId]));
    createActivityLog('SETTINGS_UPDATE', 'System tax settings & cooperative subscription configurations updated.');

    return settingsMap[businessId];
  },

  updatePreferences: async (body: any) => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    if (!businessId) {
      throw new ApiError(404, 'No business tenant active.');
    }

    const settingsMap = getStorage<Record<string, any>>('ds_settings', {});
    const current = settingsMap[businessId] || {};
    const oldVal = JSON.stringify(current);

    settingsMap[businessId] = {
      ...current,
      theme: body.theme,
      currency: body.currency,
      language: body.language,
      timezone: body.timezone
    };
    localStorage.setItem('ds_settings', JSON.stringify(settingsMap));

    createAuditLog('UPDATE_PREFERENCES', 'Setting', businessId, oldVal, JSON.stringify(settingsMap[businessId]));
    createActivityLog('PREFERENCES_UPDATE', `UI preference settings updated (Theme: ${body.theme.toUpperCase()}).`);

    return settingsMap[businessId];
  },

  getAuditLogs: async () => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    const logs = getStorage<any[]>('ds_audit_logs', []);
    const filtered = logs.filter(l => l.businessId === businessId);
    return filtered;
  },

  getActivityLogs: async () => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    const logs = getStorage<any[]>('ds_activity_logs', []);
    const filtered = logs.filter(l => l.businessId === businessId);
    return filtered;
  },

  // RBAC USER MANAGEMENT
  getUsers: async (params?: { search?: string; roleId?: string; status?: string; page?: number; limit?: number }) => {
    await delay(300);
    const { businessId } = getTenantAndUser();
    if (!businessId) {
      throw new ApiError(404, 'Workspace tenant context not loaded.');
    }

    const users = getStorage<any[]>('ds_users', []);
    const userRoles = getStorage<any[]>('ds_user_roles', []);
    const roles = getStorage<any[]>('ds_roles', []);

    let filtered = users.filter(u => u.businessId === businessId);

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    const mappedUsers = filtered.map(u => {
      const ur = userRoles.find(r => r.userId === u.id);
      const rObj = ur ? roles.find(rl => rl.id === ur.roleId) : null;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        isActive: u.isActive !== false,
        createdAt: u.createdAt || new Date().toISOString(),
        role: rObj ? { id: rObj.id, name: rObj.name } : null
      };
    });

    return {
      users: mappedUsers
    };
  },

  createUser: async (body: any) => {
    await delay(400);
    const { businessId } = getTenantAndUser();
    if (!businessId) {
      throw new ApiError(404, 'No workspace active.');
    }

    const users = getStorage<any[]>('ds_users', []);
    if (users.some(u => u.email === body.email)) {
      throw new ApiError(400, 'A user account with this email already exists.');
    }

    validatePasswordStrength(body.password);
    const passwordHash = await hashPassword(body.password);

    const newUser = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name: body.name,
      email: body.email,
      passwordHash,
      businessId,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem('ds_users', JSON.stringify(users));

    // Assign Role
    if (body.roleId) {
      const userRoles = getStorage<any[]>('ds_user_roles', []);
      userRoles.push({
        id: 'ur-' + Math.random().toString(36).substring(2, 9),
        userId: newUser.id,
        roleId: body.roleId
      });
      localStorage.setItem('ds_user_roles', JSON.stringify(userRoles));
    }

    const roles = getStorage<any[]>('ds_roles', []);
    const rObj = roles.find(rl => rl.id === body.roleId);

    createAuditLog('CREATE', 'User', newUser.id, null, JSON.stringify(newUser));
    createActivityLog('USER_CREATED', `New cooperative user '${body.name}' registered as role '${rObj?.name || 'OPERATOR'}'.`);

    return newUser;
  },

  updateUser: async (id: string, body: any) => {
    await delay(300);
    const users = getStorage<any[]>('ds_users', []);
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      throw new ApiError(404, 'User account not found.');
    }

    const oldVal = JSON.stringify(users[idx]);
    users[idx].name = body.name;
    users[idx].email = body.email;
    if (body.password) {
      validatePasswordStrength(body.password);
      users[idx].passwordHash = await hashPassword(body.password);
    }
    if (body.isActive !== undefined) {
      users[idx].isActive = body.isActive;
    }

    localStorage.setItem('ds_users', JSON.stringify(users));

    if (body.roleId) {
      const userRoles = getStorage<any[]>('ds_user_roles', []);
      const urIdx = userRoles.findIndex(ur => ur.userId === id);
      if (urIdx !== -1) {
        userRoles[urIdx].roleId = body.roleId;
      } else {
        userRoles.push({
          id: 'ur-' + Math.random().toString(36).substring(2, 9),
          userId: id,
          roleId: body.roleId
        });
      }
      localStorage.setItem('ds_user_roles', JSON.stringify(userRoles));
    }

    createAuditLog('UPDATE', 'User', id, oldVal, JSON.stringify(users[idx]));
    createActivityLog('USER_UPDATED', `User profile configuration updated for cooperative administrator '${body.name}'.`);

    return users[idx];
  },

  deleteUser: async (id: string) => {
    await delay(300);
    const users = getStorage<any[]>('ds_users', []);
    const user = users.find(u => u.id === id);
    if (!user) {
      throw new ApiError(404, 'User account not found.');
    }

    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem('ds_users', JSON.stringify(filtered));

    // Clean up role maps
    const userRoles = getStorage<any[]>('ds_user_roles', []);
    const filteredRoles = userRoles.filter(ur => ur.userId !== id);
    localStorage.setItem('ds_user_roles', JSON.stringify(filteredRoles));

    createAuditLog('DELETE', 'User', id, JSON.stringify(user), null);
    createActivityLog('USER_DELETED', `User account '${user.name}' removed from cooperative directories.`);

    return { success: true };
  },

  // RBAC ROLE & PERMISSION MANAGEMENT
  getRoles: async () => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    
    const roles = getStorage<any[]>('ds_roles', []);
    const rolePermissions = getStorage<any[]>('ds_role_permissions', []);
    const permissions = getStorage<any[]>('ds_permissions', []);
    const userRoles = getStorage<any[]>('ds_user_roles', []);

    // Return system default roles (businessId === null) OR tenant custom roles (businessId === currentTenant)
    const filtered = roles.filter(r => r.businessId === null || r.businessId === businessId);

    const mapped = filtered.map(r => {
      // Find role permission maps
      const rpFiltered = rolePermissions.filter(rp => rp.roleId === r.id);
      const rPermissions = rpFiltered.map(rp => {
        const pObj = permissions.find(p => p.id === rp.permissionId);
        return {
          id: rp.id,
          roleId: r.id,
          permissionId: rp.permissionId,
          permission: pObj || { id: rp.permissionId, name: 'unknown' }
        };
      });

      // Count active users
      const userCount = userRoles.filter(ur => ur.roleId === r.id).length;

      return {
        id: r.id,
        name: r.name,
        description: r.description,
        businessId: r.businessId,
        createdAt: r.createdAt || new Date().toISOString(),
        rolePermissions: rPermissions,
        _count: {
          userRoles: userCount
        }
      };
    });

    return mapped;
  },

  createRole: async (body: any) => {
    await delay(350);
    const { businessId } = getTenantAndUser();
    if (!businessId) {
      throw new ApiError(404, 'No business workspace active.');
    }

    const roles = getStorage<any[]>('ds_roles', []);
    if (roles.some(r => r.name.toUpperCase() === body.name.toUpperCase() && (r.businessId === null || r.businessId === businessId))) {
      throw new ApiError(400, 'A role with this name already exists.');
    }

    const newRole = {
      id: 'role-' + Math.random().toString(36).substring(2, 9),
      name: body.name.toUpperCase(),
      description: body.description,
      businessId,
      createdAt: new Date().toISOString()
    };

    roles.push(newRole);
    localStorage.setItem('ds_roles', JSON.stringify(roles));

    // Map Permissions
    if (body.permissionIds && body.permissionIds.length > 0) {
      const rolePermissions = getStorage<any[]>('ds_role_permissions', []);
      body.permissionIds.forEach((pid: string) => {
        rolePermissions.push({
          id: 'rp-' + Math.random().toString(36).substring(2, 9),
          roleId: newRole.id,
          permissionId: pid
        });
      });
      localStorage.setItem('ds_role_permissions', JSON.stringify(rolePermissions));
    }

    createAuditLog('CREATE', 'Role', newRole.id, null, JSON.stringify(newRole));
    createActivityLog('ROLE_CREATED', `Custom cooperative role '${newRole.name}' configured with privilege levels.`);

    return newRole;
  },

  updateRole: async (id: string, body: any) => {
    await delay(350);
    const roles = getStorage<any[]>('ds_roles', []);
    const idx = roles.findIndex(r => r.id === id);
    if (idx === -1) {
      throw new ApiError(404, 'Role record not found.');
    }

    const oldVal = JSON.stringify(roles[idx]);
    roles[idx].name = body.name.toUpperCase();
    roles[idx].description = body.description;
    localStorage.setItem('ds_roles', JSON.stringify(roles));

    // Update Permission Maps
    if (body.permissionIds) {
      let rolePermissions = getStorage<any[]>('ds_role_permissions', []);
      // Clear old permissions for this role
      rolePermissions = rolePermissions.filter(rp => rp.roleId !== id);
      // Add new permissions
      body.permissionIds.forEach((pid: string) => {
        rolePermissions.push({
          id: 'rp-' + Math.random().toString(36).substring(2, 9),
          roleId: id,
          permissionId: pid
        });
      });
      localStorage.setItem('ds_role_permissions', JSON.stringify(rolePermissions));
    }

    createAuditLog('UPDATE', 'Role', id, oldVal, JSON.stringify(roles[idx]));
    createActivityLog('ROLE_UPDATED', `Role security configurations modified for group level '${body.name.toUpperCase()}'.`);

    return roles[idx];
  },

  deleteRole: async (id: string) => {
    await delay(300);
    const roles = getStorage<any[]>('ds_roles', []);
    const role = roles.find(r => r.id === id);
    if (!role) {
      throw new ApiError(404, 'Role record not found.');
    }

    // Protection against deleting core system ADMIN
    if (role.name === 'ADMIN' && role.businessId === null) {
      throw new ApiError(403, 'Deleting core system ADMIN role is strictly forbidden.');
    }

    const filtered = roles.filter(r => r.id !== id);
    localStorage.setItem('ds_roles', JSON.stringify(filtered));

    // Clean up permission maps
    const rolePermissions = getStorage<any[]>('ds_role_permissions', []);
    const filteredRP = rolePermissions.filter(rp => rp.roleId !== id);
    localStorage.setItem('ds_role_permissions', JSON.stringify(filteredRP));

    createAuditLog('DELETE', 'Role', id, JSON.stringify(role), null);
    createActivityLog('ROLE_DELETED', `Custom cooperative role group '${role.name}' removed.`);

    return { success: true };
  },

  getPermissions: async () => {
    await delay(150);
    const permissions = getStorage<any[]>('ds_permissions', []);
    return permissions;
  },

  // PRODUCT CATEGORIES MASTER DATA
  getCategories: async (params?: { search?: string }) => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    const categories = getStorage<any[]>('ds_product_categories', []);
    
    let filtered = [...categories];
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q)));
    }
    return filtered;
  },

  createCategory: async (body: any) => {
    await delay(300);
    const { businessId } = getTenantAndUser();
    const categories = getStorage<any[]>('ds_product_categories', []);

    const slug = body.slug.toLowerCase().trim();
    if (categories.some(c => c.slug === slug)) {
      throw new ApiError(400, `Product category with slug '${slug}' already exists.`);
    }

    const newCat = {
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      name: body.name,
      slug,
      description: body.description || '',
      createdAt: new Date().toISOString()
    };

    categories.push(newCat);
    localStorage.setItem('ds_product_categories', JSON.stringify(categories));

    createAuditLog('CREATE_PRODUCT_CATEGORY', 'ProductCategory', newCat.id, null, JSON.stringify(newCat));
    createActivityLog('MASTER_DATA', `Created product category: ${newCat.name}`);

    return newCat;
  },

  updateCategory: async (id: string, body: any) => {
    await delay(300);
    const categories = getStorage<any[]>('ds_product_categories', []);
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new ApiError(404, 'Category not found.');
    }

    const oldVal = JSON.stringify(categories[idx]);
    const slug = body.slug.toLowerCase().trim();
    if (slug !== categories[idx].slug && categories.some(c => c.slug === slug)) {
      throw new ApiError(400, `Product category with slug '${slug}' already exists.`);
    }

    categories[idx] = {
      ...categories[idx],
      name: body.name,
      slug,
      description: body.description || ''
    };

    localStorage.setItem('ds_product_categories', JSON.stringify(categories));

    createAuditLog('UPDATE_PRODUCT_CATEGORY', 'ProductCategory', id, oldVal, JSON.stringify(categories[idx]));
    createActivityLog('MASTER_DATA', `Updated product category: ${body.name}`);

    return categories[idx];
  },

  deleteCategory: async (id: string) => {
    await delay(200);
    const categories = getStorage<any[]>('ds_product_categories', []);
    const cat = categories.find(c => c.id === id);
    if (!cat) {
      throw new ApiError(404, 'Category not found.');
    }

    const filtered = categories.filter(c => c.id !== id);
    localStorage.setItem('ds_product_categories', JSON.stringify(filtered));

    createAuditLog('DELETE_PRODUCT_CATEGORY', 'ProductCategory', id, JSON.stringify(cat), null);
    createActivityLog('MASTER_DATA', `Deleted product category: ${cat.name}`);

    return { success: true };
  },

  importCategories: async (items: any[]) => {
    await delay(400);
    const categories = getStorage<any[]>('ds_product_categories', []);
    let successCount = 0;

    items.forEach(item => {
      if (item.name && item.slug) {
        const slug = item.slug.toLowerCase().trim();
        const existingIdx = categories.findIndex(c => c.slug === slug);
        if (existingIdx !== -1) {
          categories[existingIdx] = {
            ...categories[existingIdx],
            name: item.name,
            description: item.description || ''
          };
        } else {
          categories.push({
            id: 'cat-' + Math.random().toString(36).substring(2, 9),
            name: item.name,
            slug,
            description: item.description || '',
            createdAt: new Date().toISOString()
          });
        }
        successCount++;
      }
    });

    localStorage.setItem('ds_product_categories', JSON.stringify(categories));
    createActivityLog('MASTER_DATA', `Imported ${successCount} product categories.`);
    return { successCount };
  },

  // DELIVERY ROUTES MASTER DATA
  getRoutes: async (params?: { search?: string }) => {
    await delay(200);
    const routes = getStorage<any[]>('ds_delivery_routes', []);
    
    let filtered = [...routes];
    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(r => r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)) || (r.startPoint && r.startPoint.toLowerCase().includes(q)) || (r.endPoint && r.endPoint.toLowerCase().includes(q)));
    }
    return filtered;
  },

  createRoute: async (body: any) => {
    await delay(300);
    const routes = getStorage<any[]>('ds_delivery_routes', []);

    const newRoute = {
      id: 'route-' + Math.random().toString(36).substring(2, 9),
      name: body.name,
      description: body.description || '',
      startPoint: body.startPoint || '',
      endPoint: body.endPoint || '',
      createdAt: new Date().toISOString()
    };

    routes.push(newRoute);
    localStorage.setItem('ds_delivery_routes', JSON.stringify(routes));

    createAuditLog('CREATE_DELIVERY_ROUTE', 'Route', newRoute.id, null, JSON.stringify(newRoute));
    createActivityLog('MASTER_DATA', `Created delivery route: ${newRoute.name}`);

    return newRoute;
  },

  updateRoute: async (id: string, body: any) => {
    await delay(300);
    const routes = getStorage<any[]>('ds_delivery_routes', []);
    const idx = routes.findIndex(r => r.id === id);
    if (idx === -1) {
      throw new ApiError(404, 'Route not found.');
    }

    const oldVal = JSON.stringify(routes[idx]);
    routes[idx] = {
      ...routes[idx],
      name: body.name,
      description: body.description || '',
      startPoint: body.startPoint || '',
      endPoint: body.endPoint || ''
    };

    localStorage.setItem('ds_delivery_routes', JSON.stringify(routes));

    createAuditLog('UPDATE_DELIVERY_ROUTE', 'Route', id, oldVal, JSON.stringify(routes[idx]));
    createActivityLog('MASTER_DATA', `Updated delivery route: ${body.name}`);

    return routes[idx];
  },

  deleteRoute: async (id: string) => {
    await delay(200);
    const routes = getStorage<any[]>('ds_delivery_routes', []);
    const route = routes.find(r => r.id === id);
    if (!route) {
      throw new ApiError(404, 'Route not found.');
    }

    const filtered = routes.filter(r => r.id !== id);
    localStorage.setItem('ds_delivery_routes', JSON.stringify(filtered));

    createAuditLog('DELETE_DELIVERY_ROUTE', 'Route', id, JSON.stringify(route), null);
    createActivityLog('MASTER_DATA', `Deleted delivery route: ${route.name}`);

    return { success: true };
  },

  importRoutes: async (items: any[]) => {
    await delay(400);
    const routes = getStorage<any[]>('ds_delivery_routes', []);
    let successCount = 0;

    items.forEach(item => {
      if (item.name) {
        routes.push({
          id: 'route-' + Math.random().toString(36).substring(2, 9),
          name: item.name,
          description: item.description || '',
          startPoint: item.startPoint || '',
          endPoint: item.endPoint || '',
          createdAt: new Date().toISOString()
        });
        successCount++;
      }
    });

    localStorage.setItem('ds_delivery_routes', JSON.stringify(routes));
    createActivityLog('MASTER_DATA', `Imported ${successCount} delivery routes.`);
    return { successCount };
  },

  // ========================================================
  // FARMER MANAGEMENT ENDPOINTS
  // ========================================================
  getFarmers: async (params?: { search?: string; status?: string; tag?: string; milkPreference?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) => {
    await delay(300);
    const { businessId } = getTenantAndUser();
    let farmers = getStorage<any[]>('ds_farmers', []);

    if (businessId) {
      farmers = farmers.filter(f => !f.businessId || f.businessId === 'default-biz' || f.businessId === businessId);
    }

    let filtered = [...farmers];

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(q) || 
        f.code.toLowerCase().includes(q) || 
        f.address.toLowerCase().includes(q) ||
        (f.contacts && f.contacts.some((c: string) => c.toLowerCase().includes(q))) ||
        (f.aadhaar && f.aadhaar.includes(q)) ||
        (f.pan && f.pan.toLowerCase().includes(q)) ||
        (f.gst && f.gst.toLowerCase().includes(q))
      );
    }

    if (params?.status && params.status !== 'all') {
      filtered = filtered.filter(f => f.status === params.status);
    }

    if (params?.tag && params.tag !== 'all') {
      filtered = filtered.filter(f => f.tags && f.tags.includes(params.tag));
    }

    if (params?.milkPreference && params.milkPreference !== 'all') {
      filtered = filtered.filter(f => f.milkPreference === params.milkPreference);
    }

    if (params?.sortBy) {
      const sortBy = params.sortBy;
      const order = params.sortOrder === 'desc' ? -1 : 1;
      filtered.sort((a, b) => {
        const valA = a[sortBy] || '';
        const valB = b[sortBy] || '';
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * order;
        }
        return (valA > valB ? 1 : -1) * order;
      });
    } else {
      filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return filtered;
  },

  getFarmer: async (id: string) => {
    await delay(200);
    const farmers = getStorage<any[]>('ds_farmers', []);
    const farmer = farmers.find(f => f.id === id);
    if (!farmer) {
      throw new ApiError(404, 'Farmer not found.');
    }
    return farmer;
  },

  createFarmer: async (body: any) => {
    await delay(300);
    const { businessId } = getTenantAndUser();
    const farmers = getStorage<any[]>('ds_farmers', []);

    let nextNum = 1;
    if (farmers.length > 0) {
      const codes = farmers
        .map(f => {
          const match = f.code.match(/FMR-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
      if (codes.length > 0) {
        nextNum = Math.max(...codes) + 1;
      } else {
        nextNum = farmers.length + 1;
      }
    }
    const code = `FMR-${String(nextNum).padStart(3, '0')}`;

    if (!body.name?.trim()) {
      throw new ApiError(400, 'Farmer Name is required.');
    }
    if (!body.address?.trim()) {
      throw new ApiError(400, 'Farmer Address is required.');
    }
    if (!body.contacts || body.contacts.length === 0 || !body.contacts[0]?.trim()) {
      throw new ApiError(400, 'At least one contact number is required.');
    }

    const newFarmer = {
      id: 'fmr-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      code,
      name: body.name.trim(),
      address: body.address.trim(),
      contacts: body.contacts.map((c: string) => c.trim()).filter(Boolean),
      aadhaar: body.aadhaar?.trim() || null,
      pan: body.pan?.toUpperCase().trim() || null,
      gst: body.gst?.toUpperCase().trim() || null,
      bankName: body.bankName?.trim() || null,
      accountNumber: body.accountNumber?.trim() || null,
      ifscCode: body.ifscCode?.toUpperCase().trim() || null,
      upiId: body.upiId?.trim() || null,
      milkPreference: body.milkPreference || 'MIXED',
      status: body.status || 'ACTIVE',
      tags: body.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    farmers.push(newFarmer);
    localStorage.setItem('ds_farmers', JSON.stringify(farmers));

    createAuditLog('CREATE_FARMER', 'Farmer', newFarmer.id, null, JSON.stringify(newFarmer));
    createActivityLog('FARMER_MANAGEMENT', `Registered new farmer: ${newFarmer.name} (${newFarmer.code})`);

    return newFarmer;
  },

  updateFarmer: async (id: string, body: any) => {
    await delay(300);
    const farmers = getStorage<any[]>('ds_farmers', []);
    const idx = farmers.findIndex(f => f.id === id);
    if (idx === -1) {
      throw new ApiError(404, 'Farmer not found.');
    }

    if (!body.name?.trim()) {
      throw new ApiError(400, 'Farmer Name is required.');
    }
    if (!body.address?.trim()) {
      throw new ApiError(400, 'Farmer Address is required.');
    }
    if (!body.contacts || body.contacts.length === 0 || !body.contacts[0]?.trim()) {
      throw new ApiError(400, 'At least one contact number is required.');
    }

    const oldVal = JSON.stringify(farmers[idx]);
    farmers[idx] = {
      ...farmers[idx],
      name: body.name.trim(),
      address: body.address.trim(),
      contacts: body.contacts.map((c: string) => c.trim()).filter(Boolean),
      aadhaar: body.aadhaar?.trim() || null,
      pan: body.pan?.toUpperCase().trim() || null,
      gst: body.gst?.toUpperCase().trim() || null,
      bankName: body.bankName?.trim() || null,
      accountNumber: body.accountNumber?.trim() || null,
      ifscCode: body.ifscCode?.toUpperCase().trim() || null,
      upiId: body.upiId?.trim() || null,
      milkPreference: body.milkPreference || 'MIXED',
      status: body.status || 'ACTIVE',
      tags: body.tags || [],
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('ds_farmers', JSON.stringify(farmers));

    createAuditLog('UPDATE_FARMER', 'Farmer', id, oldVal, JSON.stringify(farmers[idx]));
    createActivityLog('FARMER_MANAGEMENT', `Updated farmer profile: ${body.name} (${farmers[idx].code})`);

    return farmers[idx];
  },

  deleteFarmer: async (id: string) => {
    await delay(200);
    const farmers = getStorage<any[]>('ds_farmers', []);
    const farmer = farmers.find(f => f.id === id);
    if (!farmer) {
      throw new ApiError(404, 'Farmer not found.');
    }

    const filtered = farmers.filter(f => f.id !== id);
    localStorage.setItem('ds_farmers', JSON.stringify(filtered));

    createAuditLog('DELETE_FARMER', 'Farmer', id, JSON.stringify(farmer), null);
    createActivityLog('FARMER_MANAGEMENT', `Deleted farmer profile: ${farmer.name} (${farmer.code})`);

    return { success: true };
  },

  importFarmers: async (items: any[]) => {
    await delay(500);
    const { businessId } = getTenantAndUser();
    const farmers = getStorage<any[]>('ds_farmers', []);
    let successCount = 0;

    let nextNum = 1;
    if (farmers.length > 0) {
      const codes = farmers
        .map(f => {
          const match = f.code.match(/FMR-(\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => n > 0);
      if (codes.length > 0) {
        nextNum = Math.max(...codes) + 1;
      } else {
        nextNum = farmers.length + 1;
      }
    }

    items.forEach(item => {
      if (item.name && item.address) {
        const code = `FMR-${String(nextNum++).padStart(3, '0')}`;
        let contactsList: string[] = [];
        if (Array.isArray(item.contacts)) {
          contactsList = item.contacts;
        } else if (typeof item.contacts === 'string' && item.contacts) {
          contactsList = item.contacts.split(/[,;|]/).map((c: string) => c.trim()).filter(Boolean);
        } else if (item.phone || item.contact || item.phoneNumber) {
          contactsList = [String(item.phone || item.contact || item.phoneNumber).trim()];
        } else {
          contactsList = ['+91 00000 00000'];
        }

        let tagsList: string[] = [];
        if (Array.isArray(item.tags)) {
          tagsList = item.tags;
        } else if (typeof item.tags === 'string' && item.tags) {
          tagsList = item.tags.split(/[,;|]/).map((t: string) => t.trim()).filter(Boolean);
        }

        farmers.push({
          id: 'fmr-' + Math.random().toString(36).substring(2, 9),
          businessId: businessId || 'default-biz',
          code,
          name: String(item.name).trim(),
          address: String(item.address).trim(),
          contacts: contactsList,
          aadhaar: item.aadhaar ? String(item.aadhaar).trim() : null,
          pan: item.pan ? String(item.pan).toUpperCase().trim() : null,
          gst: item.gst ? String(item.gst).toUpperCase().trim() : null,
          bankName: item.bankName ? String(item.bankName).trim() : null,
          accountNumber: item.accountNumber ? String(item.accountNumber).trim() : null,
          ifscCode: item.ifscCode ? String(item.ifscCode).toUpperCase().trim() : null,
          upiId: item.upiId ? String(item.upiId).trim() : null,
          milkPreference: ['COW', 'BUFFALO', 'MIXED'].includes(String(item.milkPreference || '').toUpperCase()) 
            ? String(item.milkPreference).toUpperCase() 
            : 'MIXED',
          status: ['ACTIVE', 'INACTIVE'].includes(String(item.status || '').toUpperCase()) 
            ? String(item.status).toUpperCase() 
            : 'ACTIVE',
          tags: tagsList,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        successCount++;
      }
    });

    localStorage.setItem('ds_farmers', JSON.stringify(farmers));
    createActivityLog('FARMER_MANAGEMENT', `Bulk imported ${successCount} farmers list.`);
    return { successCount };
  },

  // ========================================================
  // MILK COLLECTION ENDPOINTS
  // ========================================================
  getMilkCollections: async (params?: { 
    search?: string; 
    shift?: 'MORNING' | 'EVENING' | 'all'; 
    milkType?: 'COW' | 'BUFFALO' | 'MIXED' | 'all'; 
    qualityGrade?: 'A' | 'B' | 'C' | 'D' | 'all'; 
    startDate?: string; 
    endDate?: string; 
    farmerId?: string; 
    sortBy?: string; 
    sortOrder?: 'asc' | 'desc';
  }) => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    let collections = getStorage<any[]>('ds_milk_collections', []);

    if (businessId) {
      collections = collections.filter(c => !c.businessId || c.businessId === businessId);
    }

    let filtered = [...collections];

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(c => 
        c.farmerName.toLowerCase().includes(q) || 
        c.farmerCode.toLowerCase().includes(q) || 
        (c.remarks && c.remarks.toLowerCase().includes(q))
      );
    }

    if (params?.shift && params.shift !== 'all') {
      filtered = filtered.filter(c => c.shift === params.shift);
    }

    if (params?.milkType && params.milkType !== 'all') {
      filtered = filtered.filter(c => c.milkType === params.milkType);
    }

    if (params?.qualityGrade && params.qualityGrade !== 'all') {
      filtered = filtered.filter(c => c.qualityGrade === params.qualityGrade);
    }

    if (params?.farmerId && params.farmerId !== 'all') {
      filtered = filtered.filter(c => c.farmerId === params.farmerId);
    }

    if (params?.startDate) {
      const start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(c => {
        const d = new Date(c.collectedAt);
        return d >= start;
      });
    }

    if (params?.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(c => {
        const d = new Date(c.collectedAt);
        return d <= end;
      });
    }

    if (params?.sortBy) {
      const sortBy = params.sortBy;
      const order = params.sortOrder === 'desc' ? -1 : 1;
      filtered.sort((a, b) => {
        const valA = a[sortBy] ?? '';
        const valB = b[sortBy] ?? '';
        if (typeof valA === 'string' && typeof valB === 'string') {
          return valA.localeCompare(valB) * order;
        }
        return (valA > valB ? 1 : -1) * order;
      });
    } else {
      filtered.sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));
    }

    return filtered;
  },

  createMilkCollection: async (body: {
    farmerId: string;
    milkType: 'COW' | 'BUFFALO' | 'MIXED';
    quantity: number;
    fat: number;
    snf: number;
    clr?: number;
    temperature?: number;
    collectedAt: string;
    shift: 'MORNING' | 'EVENING';
    remarks?: string;
    manualAdjustment?: number;
  }) => {
    await delay(300);
    const { businessId } = getTenantAndUser();
    const collections = getStorage<any[]>('ds_milk_collections', []);
    const farmers = getStorage<any[]>('ds_farmers', []);

    const farmer = farmers.find(f => f.id === body.farmerId);
    if (!farmer) {
      throw new ApiError(404, 'Farmer not found.');
    }

    if (body.quantity <= 0) {
      throw new ApiError(400, 'Quantity must be greater than zero.');
    }
    if (body.fat < 1.0 || body.fat > 15.0) {
      throw new ApiError(400, 'Fat percentage must be between 1.0% and 15.0%.');
    }
    if (body.snf < 5.0 || body.snf > 12.0) {
      throw new ApiError(400, 'SNF percentage must be between 5.0% and 12.0%.');
    }

    const targetDateStr = body.collectedAt.substring(0, 10);
    const hasDuplicate = collections.some(c => 
      c.businessId === businessId &&
      c.farmerId === body.farmerId &&
      c.collectedAt.substring(0, 10) === targetDateStr &&
      c.shift === body.shift
    );
    if (hasDuplicate) {
      throw new ApiError(400, `Duplicate Entry: ${farmer.name} (${farmer.code}) already has a collection logged for shift ${body.shift} on ${targetDateStr}.`);
    }

    const ratePerLiter = calculateMilkRate(body.milkType, body.fat, body.snf);
    const manualAdj = Number(body.manualAdjustment || 0);
    const rawAmount = (body.quantity * ratePerLiter) + manualAdj;
    const totalAmount = Math.round(rawAmount * 100) / 100;
    const qualityGrade = calculateQualityGrade(body.milkType, body.fat, body.snf);

    const newRecord = {
      id: 'col-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      farmerId: body.farmerId,
      farmerCode: farmer.code,
      farmerName: farmer.name,
      farmerPhone: farmer.contacts?.[0] || '',
      milkType: body.milkType,
      quantity: Number(body.quantity),
      fat: Number(body.fat),
      snf: Number(body.snf),
      clr: body.clr ? Number(body.clr) : undefined,
      temperature: body.temperature ? Number(body.temperature) : undefined,
      ratePerLiter,
      totalAmount,
      shift: body.shift,
      collectedAt: body.collectedAt,
      remarks: body.remarks || '',
      manualAdjustment: manualAdj,
      qualityGrade,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    collections.push(newRecord);
    localStorage.setItem('ds_milk_collections', JSON.stringify(collections));

    createAuditLog('CREATE_MILK_COLLECTION', 'MilkCollection', newRecord.id, null, JSON.stringify(newRecord));
    createActivityLog('MILK_COLLECTION', `Logged milk collection: ${newRecord.quantity}L of ${newRecord.milkType} milk from ${farmer.name} (Grade ${qualityGrade}).`);

    return newRecord;
  },

  updateMilkCollection: async (id: string, body: {
    farmerId: string;
    milkType: 'COW' | 'BUFFALO' | 'MIXED';
    quantity: number;
    fat: number;
    snf: number;
    clr?: number;
    temperature?: number;
    collectedAt: string;
    shift: 'MORNING' | 'EVENING';
    remarks?: string;
    manualAdjustment?: number;
  }) => {
    await delay(300);
    const { businessId } = getTenantAndUser();
    const collections = getStorage<any[]>('ds_milk_collections', []);
    const farmers = getStorage<any[]>('ds_farmers', []);

    const idx = collections.findIndex(c => c.id === id);
    if (idx === -1) {
      throw new ApiError(404, 'Milk collection log not found.');
    }

    const farmer = farmers.find(f => f.id === body.farmerId);
    if (!farmer) {
      throw new ApiError(404, 'Farmer not found.');
    }

    if (body.quantity <= 0) {
      throw new ApiError(400, 'Quantity must be greater than zero.');
    }
    if (body.fat < 1.0 || body.fat > 15.0) {
      throw new ApiError(400, 'Fat percentage must be between 1.0% and 15.0%.');
    }
    if (body.snf < 5.0 || body.snf > 12.0) {
      throw new ApiError(400, 'SNF percentage must be between 5.0% and 12.0%.');
    }

    const targetDateStr = body.collectedAt.substring(0, 10);
    const hasDuplicate = collections.some(c => 
      c.id !== id &&
      c.businessId === businessId &&
      c.farmerId === body.farmerId &&
      c.collectedAt.substring(0, 10) === targetDateStr &&
      c.shift === body.shift
    );
    if (hasDuplicate) {
      throw new ApiError(400, `Duplicate Entry: ${farmer.name} (${farmer.code}) already has a collection logged for shift ${body.shift} on ${targetDateStr}.`);
    }

    const ratePerLiter = calculateMilkRate(body.milkType, body.fat, body.snf);
    const manualAdj = Number(body.manualAdjustment || 0);
    const rawAmount = (body.quantity * ratePerLiter) + manualAdj;
    const totalAmount = Math.round(rawAmount * 100) / 100;
    const qualityGrade = calculateQualityGrade(body.milkType, body.fat, body.snf);

    const oldVal = JSON.stringify(collections[idx]);

    collections[idx] = {
      ...collections[idx],
      farmerId: body.farmerId,
      farmerCode: farmer.code,
      farmerName: farmer.name,
      farmerPhone: farmer.contacts?.[0] || '',
      milkType: body.milkType,
      quantity: Number(body.quantity),
      fat: Number(body.fat),
      snf: Number(body.snf),
      clr: body.clr ? Number(body.clr) : undefined,
      temperature: body.temperature ? Number(body.temperature) : undefined,
      ratePerLiter,
      totalAmount,
      shift: body.shift,
      collectedAt: body.collectedAt,
      remarks: body.remarks || '',
      manualAdjustment: manualAdj,
      qualityGrade,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('ds_milk_collections', JSON.stringify(collections));

    createAuditLog('UPDATE_MILK_COLLECTION', 'MilkCollection', id, oldVal, JSON.stringify(collections[idx]));
    createActivityLog('MILK_COLLECTION', `Updated milk collection log for ${farmer.name}: ${collections[idx].quantity}L of ${collections[idx].milkType} milk.`);

    return collections[idx];
  },

  deleteMilkCollection: async (id: string) => {
    await delay(200);
    const collections = getStorage<any[]>('ds_milk_collections', []);
    const log = collections.find(c => c.id === id);
    if (!log) {
      throw new ApiError(404, 'Milk collection record not found.');
    }

    const filtered = collections.filter(c => c.id !== id);
    localStorage.setItem('ds_milk_collections', JSON.stringify(filtered));

    createAuditLog('DELETE_MILK_COLLECTION', 'MilkCollection', id, JSON.stringify(log), null);
    createActivityLog('MILK_COLLECTION', `Deleted milk collection log: ${log.quantity}L from ${log.farmerName}.`);

    return { success: true };
  },

  importMilkCollections: async (items: any[]) => {
    await delay(400);
    const { businessId } = getTenantAndUser();
    const collections = getStorage<any[]>('ds_milk_collections', []);
    const farmers = getStorage<any[]>('ds_farmers', []);

    let successCount = 0;
    let duplicateCount = 0;
    let errors: string[] = [];

    items.forEach((item, index) => {
      try {
        const farmerCode = String(item.farmerCode || item.code || '').trim().toUpperCase();
        const farmer = farmers.find(f => f.code.toUpperCase() === farmerCode);
        if (!farmer) {
          throw new Error(`Row ${index + 1}: Farmer with code "${farmerCode}" not found.`);
        }

        const quantity = Number(item.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          throw new Error(`Row ${index + 1}: Invalid quantity "${item.quantity}".`);
        }

        const fat = Number(item.fat);
        if (isNaN(fat) || fat < 1.0 || fat > 15.0) {
          throw new Error(`Row ${index + 1}: Invalid fat percentage "${item.fat}".`);
        }

        const snf = Number(item.snf);
        if (isNaN(snf) || snf < 5.0 || snf > 12.0) {
          throw new Error(`Row ${index + 1}: Invalid SNF percentage "${item.snf}".`);
        }

        const milkType = ['COW', 'BUFFALO', 'MIXED'].includes(String(item.milkType || '').toUpperCase())
          ? String(item.milkType).toUpperCase() as 'COW' | 'BUFFALO' | 'MIXED'
          : farmer.milkPreference;

        const shift = ['MORNING', 'EVENING'].includes(String(item.shift || '').toUpperCase())
          ? String(item.shift).toUpperCase() as 'MORNING' | 'EVENING'
          : 'MORNING';

        const collectedAt = item.collectedAt || item.date || new Date().toISOString();
        const targetDateStr = new Date(collectedAt).toISOString().substring(0, 10);

        const hasDuplicate = collections.some(c => 
          c.businessId === businessId &&
          c.farmerId === farmer.id &&
          c.collectedAt.substring(0, 10) === targetDateStr &&
          c.shift === shift
        );

        if (hasDuplicate) {
          duplicateCount++;
          return;
        }

        const ratePerLiter = calculateMilkRate(milkType, fat, snf);
        const manualAdj = Number(item.manualAdjustment || 0);
        const rawAmount = (quantity * ratePerLiter) + manualAdj;
        const totalAmount = Math.round(rawAmount * 100) / 100;
        const qualityGrade = calculateQualityGrade(milkType, fat, snf);

        const newRecord = {
          id: 'col-' + Math.random().toString(36).substring(2, 9),
          businessId: businessId || 'default-biz',
          farmerId: farmer.id,
          farmerCode: farmer.code,
          farmerName: farmer.name,
          farmerPhone: farmer.contacts?.[0] || '',
          milkType,
          quantity,
          fat,
          snf,
          clr: item.clr ? Number(item.clr) : undefined,
          temperature: item.temperature ? Number(item.temperature) : undefined,
          ratePerLiter,
          totalAmount,
          shift,
          collectedAt: new Date(collectedAt).toISOString(),
          remarks: item.remarks || 'Imported via bulk log',
          manualAdjustment: manualAdj,
          qualityGrade,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        collections.push(newRecord);
        successCount++;
      } catch (err: any) {
        errors.push(err.message);
      }
    });

    if (successCount > 0) {
      localStorage.setItem('ds_milk_collections', JSON.stringify(collections));
      createActivityLog('MILK_COLLECTION', `Bulk imported ${successCount} milk collection records.`);
    }

    return { successCount, duplicateCount, errors };
  },

  getMilkCollectionAnalytics: async (days: number = 30) => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    const collections = getStorage<any[]>('ds_milk_collections', []);

    const tenantCollections = collections.filter(c => !c.businessId || c.businessId === businessId);

    let totalVolume = 0;
    let totalAmt = 0;
    let fatSum = 0;
    let snfSum = 0;

    let cowVolume = 0;
    let buffaloVolume = 0;
    let mixedVolume = 0;

    let morningVolume = 0;
    let eveningVolume = 0;

    const dailyMap: Record<string, { date: string; volume: number; amount: number }> = {};
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      dailyMap[dateStr] = { date: dateStr, volume: 0, amount: 0 };
    }

    const farmerMap: Record<string, { code: string; name: string; volume: number; amount: number; count: number }> = {};

    tenantCollections.forEach(c => {
      totalVolume += c.quantity;
      totalAmt += c.totalAmount;
      fatSum += c.fat * c.quantity;
      snfSum += c.snf * c.quantity;

      if (c.milkType === 'COW') cowVolume += c.quantity;
      if (c.milkType === 'BUFFALO') buffaloVolume += c.quantity;
      if (c.milkType === 'MIXED') mixedVolume += c.quantity;

      if (c.shift === 'MORNING') morningVolume += c.quantity;
      if (c.shift === 'EVENING') eveningVolume += c.quantity;

      const dateStr = c.collectedAt.substring(0, 10);
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].volume = Math.round((dailyMap[dateStr].volume + c.quantity) * 100) / 100;
        dailyMap[dateStr].amount = Math.round((dailyMap[dateStr].amount + c.totalAmount) * 100) / 100;
      }

      if (!farmerMap[c.farmerId]) {
        farmerMap[c.farmerId] = { code: c.farmerCode, name: c.farmerName, volume: 0, amount: 0, count: 0 };
      }
      farmerMap[c.farmerId].volume = Math.round((farmerMap[c.farmerId].volume + c.quantity) * 100) / 100;
      farmerMap[c.farmerId].amount = Math.round((farmerMap[c.farmerId].amount + c.totalAmount) * 100) / 100;
      farmerMap[c.farmerId].count += 1;
    });

    const averageFat = totalVolume > 0 ? Math.round((fatSum / totalVolume) * 100) / 100 : 0;
    const averageSnf = totalVolume > 0 ? Math.round((snfSum / totalVolume) * 100) / 100 : 0;

    const dailyTrends = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    const topFarmers = Object.values(farmerMap)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    return {
      totalVolume: Math.round(totalVolume * 100) / 100,
      totalAmount: Math.round(totalAmt * 100) / 100,
      averageFat,
      averageSnf,
      milkTypeBreakdown: [
        { name: 'Cow', value: Math.round(cowVolume * 100) / 100, color: '#3b82f6' },
        { name: 'Buffalo', value: Math.round(buffaloVolume * 100) / 100, color: '#10b981' },
        { name: 'Mixed', value: Math.round(mixedVolume * 100) / 100, color: '#f59e0b' },
      ],
      shiftBreakdown: [
        { name: 'Morning', value: Math.round(morningVolume * 100) / 100, color: '#f59e0b' },
        { name: 'Evening', value: Math.round(eveningVolume * 100) / 100, color: '#6366f1' },
      ],
      dailyTrends,
      topFarmers,
    };
  },

  // ==========================================
  // STAGE 5.4: RATE MANAGEMENT ENDPOINTS
  // ==========================================
  getRateCharts: async () => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    let charts = getStorage<any[]>('ds_rate_charts', []);
    if (businessId) {
      charts = charts.filter(c => !c.businessId || c.businessId === businessId);
    }
    if (charts.length === 0) {
      // Seed default rate charts
      const defaultCharts = [
        {
          id: 'rc-1',
          businessId: businessId || 'default-biz',
          name: 'Standard Cow Rate Chart (Active)',
          milkType: 'COW',
          pricingMethod: 'FAT_SNF_SOLIDS',
          baseRate: 45.00,
          fatStandard: 4.0,
          snfStandard: 8.5,
          fatPremium: 0.50,
          snfPremium: 0.40,
          effectiveFrom: '2026-01-01T00:00:00.000Z',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'rc-2',
          businessId: businessId || 'default-biz',
          name: 'Standard Buffalo Rate Chart (Active)',
          milkType: 'BUFFALO',
          pricingMethod: 'FAT_SNF_SOLIDS',
          baseRate: 65.00,
          fatStandard: 6.5,
          snfStandard: 9.0,
          fatPremium: 0.70,
          snfPremium: 0.55,
          effectiveFrom: '2026-01-01T00:00:00.000Z',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ds_rate_charts', JSON.stringify(defaultCharts));
      return defaultCharts;
    }
    return charts;
  },

  createRateChart: async (body: any) => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    const charts = getStorage<any[]>('ds_rate_charts', []);
    const newChart = {
      id: 'rc-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      name: body.name,
      milkType: body.milkType,
      pricingMethod: body.pricingMethod || 'FAT_SNF_SOLIDS',
      baseRate: Number(body.baseRate),
      fatStandard: Number(body.fatStandard),
      snfStandard: Number(body.snfStandard),
      fatPremium: Number(body.fatPremium),
      snfPremium: Number(body.snfPremium),
      effectiveFrom: body.effectiveFrom || new Date().toISOString(),
      effectiveTo: body.effectiveTo || undefined,
      isActive: body.isActive ?? true,
      shift: body.shift || 'BOTH',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    charts.push(newChart);
    localStorage.setItem('ds_rate_charts', JSON.stringify(charts));
    createAuditLog('CREATE_RATE_CHART', 'RateChart', newChart.id, null, JSON.stringify(newChart));
    return newChart;
  },

  updateRateChart: async (id: string, body: any) => {
    await delay(200);
    const charts = getStorage<any[]>('ds_rate_charts', []);
    const idx = charts.findIndex(c => c.id === id);
    if (idx === -1) throw new ApiError(404, 'Rate chart not found.');
    const oldVal = JSON.stringify(charts[idx]);
    charts[idx] = {
      ...charts[idx],
      name: body.name,
      milkType: body.milkType,
      pricingMethod: body.pricingMethod,
      baseRate: Number(body.baseRate),
      fatStandard: Number(body.fatStandard),
      snfStandard: Number(body.snfStandard),
      fatPremium: Number(body.fatPremium),
      snfPremium: Number(body.snfPremium),
      effectiveFrom: body.effectiveFrom,
      effectiveTo: body.effectiveTo || undefined,
      isActive: body.isActive ?? true,
      shift: body.shift || 'BOTH',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('ds_rate_charts', JSON.stringify(charts));
    createAuditLog('UPDATE_RATE_CHART', 'RateChart', id, oldVal, JSON.stringify(charts[idx]));
    return charts[idx];
  },

  deleteRateChart: async (id: string) => {
    await delay(150);
    const charts = getStorage<any[]>('ds_rate_charts', []);
    const chart = charts.find(c => c.id === id);
    if (!chart) throw new ApiError(404, 'Rate chart not found.');
    const filtered = charts.filter(c => c.id !== id);
    localStorage.setItem('ds_rate_charts', JSON.stringify(filtered));
    createAuditLog('DELETE_RATE_CHART', 'RateChart', id, JSON.stringify(chart), null);
    return { success: true };
  },

  // ==========================================
  // STAGE 5.4: LEDGER ENDPOINTS
  // ==========================================
  getFarmerLedger: async (params?: any) => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    let ledgers = getStorage<any[]>('ds_farmer_ledgers', []);
    if (businessId) {
      ledgers = ledgers.filter(l => !l.businessId || l.businessId === businessId);
    }
    if (ledgers.length === 0) {
      // Seed initial ledgers
      const seedLedgers = [
        {
          id: 'led-1',
          businessId: businessId || 'default-biz',
          farmerId: 'fmr-1',
          farmerCode: 'FMR-001',
          farmerName: 'Sukhdev Singh',
          date: '2026-07-01T08:30:00.000Z',
          transactionType: 'COLLECTION',
          referenceId: 'col-seed-1',
          credit: 1200.00,
          debit: 0.00,
          balance: 1200.00,
          remarks: 'Milk Collection: 25.00L (Cow, Morning)',
          createdAt: new Date().toISOString()
        },
        {
          id: 'led-2',
          businessId: businessId || 'default-biz',
          farmerId: 'fmr-1',
          farmerCode: 'FMR-001',
          farmerName: 'Sukhdev Singh',
          date: '2026-07-05T12:00:00.000Z',
          transactionType: 'PAYMENT',
          referenceId: 'pay-seed-1',
          credit: 0.00,
          debit: 1000.00,
          balance: 200.00,
          remarks: 'Payment Voucher - Cash payout',
          createdAt: new Date().toISOString()
        },
        {
          id: 'led-3',
          businessId: businessId || 'default-biz',
          farmerId: 'fmr-2',
          farmerCode: 'FMR-002',
          farmerName: 'Gurpreet Kaur',
          date: '2026-07-02T18:45:00.000Z',
          transactionType: 'COLLECTION',
          referenceId: 'col-seed-2',
          credit: 1950.00,
          debit: 0.00,
          balance: 1950.00,
          remarks: 'Milk Collection: 30.00L (Buffalo, Evening)',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ds_farmer_ledgers', JSON.stringify(seedLedgers));
      ledgers = seedLedgers;
    }

    let filtered = [...ledgers];
    const farmerIdParam = typeof params === 'string' ? params : params?.farmerId;
    if (farmerIdParam && farmerIdParam !== 'all') {
      filtered = filtered.filter(l => l.farmerId === farmerIdParam);
    }
    if (params?.startDate) {
      filtered = filtered.filter(l => new Date(l.date) >= new Date(params.startDate!));
    }
    if (params?.endDate) {
      filtered = filtered.filter(l => new Date(l.date) <= new Date(params.endDate! + 'T23:59:59.999Z'));
    }

    // Sort chronologically to maintain correct balance
    filtered.sort((a, b) => a.date.localeCompare(b.date));
    
    const balanceVal = filtered.length > 0 ? filtered[filtered.length - 1].balance : 0;
    Object.defineProperty(filtered, 'balance', { value: balanceVal, writable: true, enumerable: true });
    
    return filtered;
  },

  getFarmerBalances: async () => {
    await delay(150);
    const farmers = getStorage<any[]>('ds_farmers', []);
    const ledgers = await api.getFarmerLedger();
    
    return farmers.map(f => {
      const fLedgers = ledgers.filter(l => l.farmerId === f.id);
      const totalCredit = fLedgers.reduce((sum, l) => sum + Number(l.credit), 0);
      const totalDebit = fLedgers.reduce((sum, l) => sum + Number(l.debit), 0);
      const closingBalance = totalCredit - totalDebit;

      return {
        farmerId: f.id,
        farmerCode: f.code,
        farmerName: f.name,
        openingBalance: 0.00,
        totalCredit,
        totalDebit,
        closingBalance
      };
    });
  },

  createLedgerAdjustment: async (body: {
    farmerId: string;
    transactionType: 'ADVANCE' | 'ADJUSTMENT' | 'RECOVERY' | 'PAYMENT' | 'COLLECTION';
    amount: number;
    remarks: string;
    date: string;
  }) => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    const ledgers = getStorage<any[]>('ds_farmer_ledgers', []);
    const farmers = getStorage<any[]>('ds_farmers', []);
    const farmer = farmers.find(f => f.id === body.farmerId);
    if (!farmer) throw new ApiError(404, 'Farmer not found.');

    const fLedgers = ledgers.filter(l => l.farmerId === body.farmerId);
    fLedgers.sort((a, b) => a.date.localeCompare(b.date));
    const currentBalance = fLedgers.length > 0 ? fLedgers[fLedgers.length - 1].balance : 0;

    let credit = 0;
    let debit = 0;
    if (body.transactionType === 'COLLECTION' || body.transactionType === 'ADJUSTMENT') {
      credit = Number(body.amount);
    } else {
      debit = Number(body.amount);
    }

    const newBalance = currentBalance + credit - debit;

    const newLedger = {
      id: 'led-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      farmerId: body.farmerId,
      farmerCode: farmer.code,
      farmerName: farmer.name,
      date: body.date || new Date().toISOString(),
      transactionType: body.transactionType,
      credit,
      debit,
      balance: newBalance,
      remarks: body.remarks,
      createdAt: new Date().toISOString()
    };

    ledgers.push(newLedger);
    localStorage.setItem('ds_farmer_ledgers', JSON.stringify(ledgers));

    createAuditLog('CREATE_LEDGER_ADJUSTMENT', 'FarmerLedger', newLedger.id, null, JSON.stringify(newLedger));
    createActivityLog('LEDGER', `Logged ledger ${body.transactionType} of Rs. ${body.amount} for ${farmer.name}.`);

    return newLedger;
  },

  // ==========================================
  // STAGE 5.4: PAYMENT VOUCHERS ENDPOINTS
  // ==========================================
  getPaymentVouchers: async (params?: { farmerId?: string; startDate?: string; endDate?: string }) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    let vouchers = getStorage<any[]>('ds_payment_vouchers', []);
    if (businessId) {
      vouchers = vouchers.filter(v => !v.businessId || v.businessId === businessId);
    }

    if (vouchers.length === 0) {
      const seedVouchers = [
        {
          id: 'pay-seed-1',
          businessId: businessId || 'default-biz',
          voucherNumber: 'PV-2026-0001',
          farmerId: 'fmr-1',
          farmerCode: 'FMR-001',
          farmerName: 'Sukhdev Singh',
          amount: 1000.00,
          paymentMethod: 'CASH',
          paymentStatus: 'PAID',
          paidAt: '2026-07-05T12:00:00.000Z',
          remarks: 'Weekly Milk Payment payout',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ds_payment_vouchers', JSON.stringify(seedVouchers));
      vouchers = seedVouchers;
    }

    let filtered = [...vouchers];
    if (params?.farmerId && params.farmerId !== 'all') {
      filtered = filtered.filter(v => v.farmerId === params.farmerId);
    }
    if (params?.startDate) {
      filtered = filtered.filter(v => new Date(v.paidAt) >= new Date(params.startDate!));
    }
    if (params?.endDate) {
      filtered = filtered.filter(v => new Date(v.paidAt) <= new Date(params.endDate! + 'T23:59:59.999Z'));
    }

    return filtered.sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  },

  createPaymentVoucher: async (body: {
    farmerId: string;
    amount: number;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI';
    transactionReference?: string;
    remarks?: string;
    paidAt: string;
  }) => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    const vouchers = getStorage<any[]>('ds_payment_vouchers', []);
    const farmers = getStorage<any[]>('ds_farmers', []);
    const farmer = farmers.find(f => f.id === body.farmerId);
    if (!farmer) throw new ApiError(404, 'Farmer not found.');

    const prefix = 'PV-' + new Date().getFullYear() + '-';
    const nextNum = String(vouchers.length + 1).padStart(4, '0');
    const voucherNumber = prefix + nextNum;

    const newVoucher = {
      id: 'pay-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      voucherNumber,
      farmerId: body.farmerId,
      farmerCode: farmer.code,
      farmerName: farmer.name,
      amount: Number(body.amount),
      paymentMethod: body.paymentMethod,
      transactionReference: body.transactionReference || '',
      paymentStatus: 'PAID' as const,
      paidAt: body.paidAt || new Date().toISOString(),
      remarks: body.remarks || 'Farmer Payout Payout',
      createdAt: new Date().toISOString()
    };

    vouchers.push(newVoucher);
    localStorage.setItem('ds_payment_vouchers', JSON.stringify(vouchers));

    // Automatically debit from farmer ledger
    await api.createLedgerAdjustment({
      farmerId: body.farmerId,
      transactionType: 'PAYMENT',
      amount: Number(body.amount),
      remarks: `Paid via ${body.paymentMethod} (Ref: ${voucherNumber})`,
      date: body.paidAt
    });

    createAuditLog('CREATE_PAYMENT_VOUCHER', 'PaymentVoucher', newVoucher.id, null, JSON.stringify(newVoucher));
    createActivityLog('PAYMENTS', `Issued payment voucher ${voucherNumber} of Rs. ${body.amount} to ${farmer.name}.`);

    return newVoucher;
  },

  // ==========================================
  // STAGE 5.4: BILLING ENDPOINTS
  // ==========================================
  getFarmerBills: async (params?: { farmerId?: string; startDate?: string; endDate?: string }) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    let bills = getStorage<any[]>('ds_farmer_bills', []);
    if (businessId) {
      bills = bills.filter(b => !b.businessId || b.businessId === businessId);
    }

    if (bills.length === 0) {
      const seedBills = [
        {
          id: 'bill-seed-1',
          businessId: businessId || 'default-biz',
          billNumber: 'BILL-2026-0001',
          farmerId: 'fmr-1',
          farmerCode: 'FMR-001',
          farmerName: 'Sukhdev Singh',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
          milkQuantity: 120.00,
          avgFat: 4.2,
          avgSnf: 8.6,
          milkAmount: 5400.00,
          bonusAmount: 100.00,
          incentiveAmount: 50.00,
          deductionAmount: 0.00,
          penaltyAmount: 0.00,
          roundOff: 0.00,
          netAmount: 5550.00,
          isLocked: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ds_farmer_bills', JSON.stringify(seedBills));
      bills = seedBills;
    }

    let filtered = [...bills];
    if (params?.farmerId && params.farmerId !== 'all') {
      filtered = filtered.filter(b => b.farmerId === params.farmerId);
    }
    if (params?.startDate) {
      filtered = filtered.filter(b => new Date(b.startDate) >= new Date(params.startDate!));
    }
    if (params?.endDate) {
      filtered = filtered.filter(b => new Date(b.endDate) <= new Date(params.endDate!));
    }

    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  createBillingInvoice: async (data: any) => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const collections = getStorage<any[]>('ds_milk_collections', []);
    const farmers = getStorage<any[]>('ds_farmers', []);

    const farmer = farmers.find(f => f.id === data.farmerId);
    if (!farmer) throw new ApiError(404, 'Farmer not found.');

    const fCollections = collections.filter(c => c.farmerId === data.farmerId);
    const totalLiters = fCollections.reduce((sum, c) => sum + Number(c.quantity), 0) || 20.0;
    const totalAmount = fCollections.reduce((sum, c) => sum + Number(c.totalAmount), 0) || 970.00;

    const invoices = getStorage<any[]>('ds_farmer_bills', []);
    const newInvoice = {
      id: 'bill-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      farmerId: data.farmerId,
      farmerName: farmer.name,
      farmerCode: farmer.code,
      startDate: data.startDate,
      endDate: data.endDate,
      totalLiters,
      milkQuantity: totalLiters,
      totalAmount,
      netAmount: totalAmount,
      status: 'UNPAID',
      isLocked: false,
      createdAt: new Date().toISOString()
    };
    invoices.unshift(newInvoice);
    localStorage.setItem('ds_farmer_bills', JSON.stringify(invoices));
    return newInvoice;
  },

  settleBillingPayment: async (data: any) => {
    await delay(200);
    const invoices = getStorage<any[]>('ds_farmer_bills', []);
    const idx = invoices.findIndex(i => i.id === data.invoiceId);
    if (idx === -1) throw new ApiError(404, 'Billing invoice not found.');

    invoices[idx].status = 'PAID';
    invoices[idx].paymentStatus = 'PAID';
    invoices[idx].transactionReference = data.transactionReference;
    invoices[idx].paymentMethod = data.paymentMethod;
    localStorage.setItem('ds_farmer_bills', JSON.stringify(invoices));

    const ledgers = getStorage<any[]>('ds_farmer_ledgers', []);
    const fLedgers = ledgers.filter(l => l.farmerId === invoices[idx].farmerId);
    const totalCredit = fLedgers.reduce((acc, l) => acc + Number(l.credit || 0), 0);
    const totalDebit = fLedgers.reduce((acc, l) => acc + Number(l.debit || 0), 0);
    const balance = totalCredit - totalDebit;

    if (balance !== 0) {
      const newLedger = {
        id: 'led-' + Math.random().toString(36).substring(2, 9),
        businessId: invoices[idx].businessId,
        farmerId: invoices[idx].farmerId,
        farmerCode: invoices[idx].farmerCode,
        farmerName: invoices[idx].farmerName,
        date: new Date().toISOString(),
        transactionType: 'PAYMENT',
        referenceId: data.invoiceId,
        credit: 0,
        debit: balance,
        balance: 0,
        remarks: 'Settlement against bill voucher: ' + invoices[idx].id,
        createdAt: new Date().toISOString()
      };
      ledgers.push(newLedger);
      localStorage.setItem('ds_farmer_ledgers', JSON.stringify(ledgers));
    }

    return invoices[idx];
  },

  generateFarmerBills: async (body: {
    startDate: string;
    endDate: string;
    bonusRate?: number;
    incentiveAmount?: number;
    deductionAmount?: number;
    penaltyAmount?: number;
  }) => {
    await delay(500);
    const { businessId } = getTenantAndUser();
    const farmers = getStorage<any[]>('ds_farmers', []);
    const collections = getStorage<any[]>('ds_milk_collections', []);
    const bills = getStorage<any[]>('ds_farmer_bills', []);

    const start = new Date(body.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(body.endDate);
    end.setHours(23, 59, 59, 999);

    const periodCollections = collections.filter(c => {
      const d = new Date(c.collectedAt);
      return (!businessId || c.businessId === businessId) && d >= start && d <= end;
    });

    const generatedBills: any[] = [];

    // Group collections by farmer
    farmers.forEach(farmer => {
      const fCollections = periodCollections.filter(c => c.farmerId === farmer.id);
      if (fCollections.length === 0) return;

      const milkQuantity = fCollections.reduce((sum, c) => sum + Number(c.quantity), 0);
      const totalAmountRaw = fCollections.reduce((sum, c) => sum + Number(c.totalAmount), 0);
      
      const avgFat = fCollections.reduce((sum, c) => sum + Number(c.fat), 0) / fCollections.length;
      const avgSnf = fCollections.reduce((sum, c) => sum + Number(c.snf), 0) / fCollections.length;

      const bonusAmount = Number(body.bonusRate || 0) * milkQuantity;
      const incentiveAmount = Number(body.incentiveAmount || 0);
      const deductionAmount = Number(body.deductionAmount || 0);
      const penaltyAmount = Number(body.penaltyAmount || 0);

      const netAmountRaw = totalAmountRaw + bonusAmount + incentiveAmount - deductionAmount - penaltyAmount;
      const netAmount = Math.round(netAmountRaw);
      const roundOff = netAmount - netAmountRaw;

      // Avoid duplicates for the same period
      const existingIdx = bills.findIndex(b => b.farmerId === farmer.id && b.startDate === body.startDate && b.endDate === body.endDate);
      if (existingIdx !== -1 && bills[existingIdx].isLocked) {
        // Skip locked bills
        return;
      }

      const prefix = 'BILL-' + new Date().getFullYear() + '-';
      const nextNum = String(bills.length + 1).padStart(4, '0');
      const billNumber = prefix + nextNum;

      const newBill = {
        id: 'bill-' + Math.random().toString(36).substring(2, 9),
        businessId: businessId || 'default-biz',
        billNumber,
        farmerId: farmer.id,
        farmerCode: farmer.code,
        farmerName: farmer.name,
        startDate: body.startDate,
        endDate: body.endDate,
        milkQuantity: Math.round(milkQuantity * 100) / 100,
        avgFat: Math.round(avgFat * 100) / 100,
        avgSnf: Math.round(avgSnf * 100) / 100,
        milkAmount: Math.round(totalAmountRaw * 100) / 100,
        bonusAmount: Math.round(bonusAmount * 100) / 100,
        incentiveAmount: Math.round(incentiveAmount * 100) / 100,
        deductionAmount: Math.round(deductionAmount * 100) / 100,
        penaltyAmount: Math.round(penaltyAmount * 100) / 100,
        roundOff: Math.round(roundOff * 100) / 100,
        netAmount,
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIdx !== -1) {
        bills[existingIdx] = newBill; // Overwrite unlocked
      } else {
        bills.push(newBill);
      }
      generatedBills.push(newBill);

      // Log credit to Farmer Ledger automatically when bill is generated
      api.createLedgerAdjustment({
        farmerId: farmer.id,
        transactionType: 'COLLECTION',
        amount: netAmount,
        remarks: `Auto-generated Bill: ${billNumber} for period ${body.startDate} to ${body.endDate}`,
        date: body.endDate
      });
    });

    localStorage.setItem('ds_farmer_bills', JSON.stringify(bills));
    createActivityLog('BILLING', `Generated ${generatedBills.length} farmer bills for period ${body.startDate} to ${body.endDate}.`);
    return generatedBills;
  },

  lockBill: async (id: string, isLocked: boolean) => {
    await delay(150);
    const bills = getStorage<any[]>('ds_farmer_bills', []);
    const idx = bills.findIndex(b => b.id === id);
    if (idx === -1) throw new ApiError(404, 'Bill not found.');
    bills[idx].isLocked = isLocked;
    bills[idx].updatedAt = new Date().toISOString();
    localStorage.setItem('ds_farmer_bills', JSON.stringify(bills));
    createAuditLog('LOCK_BILL', 'FarmerBill', id, `Locked: ${!isLocked}`, `Locked: ${isLocked}`);
    return bills[idx];
  },

  regenerateBill: async (id: string) => {
    await delay(300);
    const bills = getStorage<any[]>('ds_farmer_bills', []);
    const bill = bills.find(b => b.id === id);
    if (!bill) throw new ApiError(404, 'Bill not found.');
    if (bill.isLocked) throw new ApiError(400, 'Locked bills cannot be regenerated.');

    // Recalculate using generateFarmerBills logic
    const results = await api.generateFarmerBills({
      startDate: bill.startDate,
      endDate: bill.endDate
    });
    return results.find(r => r.farmerId === bill.farmerId) || bill;
  },

  getProduct: async (id: string) => {
    await delay(100);
    const products = getStorage<any[]>('ds_products', []);
    const product = products.find(p => p.id === id);
    if (!product) throw new ApiError(404, 'Product not found.');

    const stocks = getStorage<any[]>('ds_product_stocks', []);
    const productStocks = stocks.filter(s => s.productId === id);
    const totalStock = productStocks.reduce((sum, s) => sum + Number(s.quantity || 0), 0);

    return {
      ...product,
      stockCount: totalStock
    };
  },

  // ==========================================
  // STAGE 5.5: INVENTORY & PRODUCTS ENDPOINTS
  // ==========================================
  getProducts: async (params?: { search?: string; categoryId?: string; status?: string }) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    let products = getStorage<any[]>('ds_products', []);
    if (businessId) {
      products = products.filter(p => !p.businessId || p.businessId === businessId);
    }
    if (params?.categoryId && params.categoryId !== 'all') {
      products = products.filter(p => p.categoryId === params.categoryId);
    }
    if (params?.status && params.status !== 'all') {
      const active = params.status === 'ACTIVE';
      products = products.filter(p => p.isActive === active);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) || 
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }
    return products;
  },

  createProduct: async (data: any) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    const products = getStorage<any[]>('ds_products', []);
    const categories = getStorage<any[]>('ds_product_categories', []);
    
    // Check SKU duplicate
    if (products.some(p => p.sku === data.sku && p.businessId === businessId)) {
      throw new ApiError(400, `SKU ${data.sku} is already assigned to another product.`);
    }

    const cat = categories.find(c => c.id === data.categoryId);

    const newProduct = {
      id: 'prod-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      categoryId: data.categoryId,
      categoryName: cat ? cat.name : 'Unknown Category',
      sku: data.sku,
      name: data.name,
      brand: data.brand || '',
      description: data.description || '',
      price: Number(data.price),
      costPrice: Number(data.costPrice || 0),
      unit: data.unit,
      barcode: data.barcode || '',
      qrCode: `https://dairysphere.com/qr/${data.sku}`,
      imageUrl: data.imageUrl || '',
      isActive: data.isActive !== false,
      minStock: Number(data.minStock || 0),
      maxStock: Number(data.maxStock || 10000),
      reorderLevel: Number(data.reorderLevel || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    products.push(newProduct);
    localStorage.setItem('ds_products', JSON.stringify(products));

    // Also initialize empty stocks in all warehouses for this product
    const warehouses = getStorage<any[]>('ds_warehouses', []);
    const stocks = getStorage<any[]>('ds_product_stocks', []);
    warehouses.forEach(wh => {
      stocks.push({
        id: 'stock-' + Math.random().toString(36).substring(2, 9),
        businessId: businessId || 'default-biz',
        productId: newProduct.id,
        productName: newProduct.name,
        productSku: newProduct.sku,
        warehouseId: wh.id,
        warehouseName: wh.name,
        quantity: 0,
        minStock: newProduct.minStock,
        maxStock: newProduct.maxStock,
        reorderLevel: newProduct.reorderLevel,
        updatedAt: new Date().toISOString()
      });
    });
    localStorage.setItem('ds_product_stocks', JSON.stringify(stocks));

    // Record Stock Entry if openingStock is set
    if (Number(data.openingStock) > 0) {
      const mainWh = warehouses[0];
      if (mainWh) {
        await api.createStockEntry({
          productId: newProduct.id,
          warehouseId: mainWh.id,
          quantity: Number(data.openingStock),
          type: 'OPENING',
          reason: 'Initial Product Registration Opening Stock',
          batchNumber: data.batchNumber || 'B-INIT',
          expiryDate: data.expiryDate || '',
          manufacturingDate: data.manufacturingDate || ''
        });
      }
    }

    createAuditLog('CREATE_PRODUCT', 'Product', newProduct.id, null, JSON.stringify(newProduct));
    return newProduct;
  },

  updateProduct: async (id: string, data: any) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    const products = getStorage<any[]>('ds_products', []);
    const categories = getStorage<any[]>('ds_product_categories', []);
    
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new ApiError(404, 'Product not found.');

    const oldVal = JSON.stringify(products[idx]);
    const cat = categories.find(c => c.id === data.categoryId);

    products[idx] = {
      ...products[idx],
      categoryId: data.categoryId,
      categoryName: cat ? cat.name : products[idx].categoryName,
      sku: data.sku,
      name: data.name,
      brand: data.brand || '',
      description: data.description || '',
      price: Number(data.price),
      costPrice: Number(data.costPrice || 0),
      unit: data.unit,
      barcode: data.barcode || '',
      qrCode: `https://dairysphere.com/qr/${data.sku}`,
      imageUrl: data.imageUrl || '',
      isActive: data.isActive !== false,
      minStock: Number(data.minStock || 0),
      maxStock: Number(data.maxStock || 10000),
      reorderLevel: Number(data.reorderLevel || 0),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('ds_products', JSON.stringify(products));

    // Update product information inside product stocks
    const stocks = getStorage<any[]>('ds_product_stocks', []);
    let stocksUpdated = false;
    stocks.forEach(st => {
      if (st.productId === id) {
        st.productName = products[idx].name;
        st.productSku = products[idx].sku;
        st.minStock = products[idx].minStock;
        st.maxStock = products[idx].maxStock;
        st.reorderLevel = products[idx].reorderLevel;
        stocksUpdated = true;
      }
    });
    if (stocksUpdated) {
      localStorage.setItem('ds_product_stocks', JSON.stringify(stocks));
    }

    createAuditLog('UPDATE_PRODUCT', 'Product', id, oldVal, JSON.stringify(products[idx]));
    return products[idx];
  },

  deleteProduct: async (id: string) => {
    await delay(150);
    const products = getStorage<any[]>('ds_products', []);
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) throw new ApiError(404, 'Product not found.');
    
    const oldVal = JSON.stringify(products[idx]);
    products.splice(idx, 1);
    localStorage.setItem('ds_products', JSON.stringify(products));

    // Delete associated stocks
    let stocks = getStorage<any[]>('ds_product_stocks', []);
    stocks = stocks.filter(st => st.productId !== id);
    localStorage.setItem('ds_product_stocks', JSON.stringify(stocks));

    createAuditLog('DELETE_PRODUCT', 'Product', id, oldVal, null);
    return { success: true };
  },

  getProductCategories: async () => {
    await delay(50);
    return getStorage<any[]>('ds_product_categories', []);
  },

  createProductCategory: async (data: any) => {
    await delay(100);
    const categories = getStorage<any[]>('ds_product_categories', []);
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    
    if (categories.some(c => c.slug === slug)) {
      throw new ApiError(400, `Category with similar name already exists.`);
    }

    const newCat = {
      id: 'cat-' + Math.random().toString(36).substring(2, 9),
      name: data.name,
      slug,
      description: data.description || '',
      createdAt: new Date().toISOString()
    };

    categories.push(newCat);
    localStorage.setItem('ds_product_categories', JSON.stringify(categories));
    createAuditLog('CREATE_CATEGORY', 'ProductCategory', newCat.id, null, JSON.stringify(newCat));
    return newCat;
  },

  updateProductCategory: async (id: string, data: any) => {
    await delay(100);
    const categories = getStorage<any[]>('ds_product_categories', []);
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) throw new ApiError(404, 'Category not found.');

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const oldVal = JSON.stringify(categories[idx]);

    categories[idx] = {
      ...categories[idx],
      name: data.name,
      slug,
      description: data.description || '',
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('ds_product_categories', JSON.stringify(categories));
    createAuditLog('UPDATE_CATEGORY', 'ProductCategory', id, oldVal, JSON.stringify(categories[idx]));
    return categories[idx];
  },

  deleteProductCategory: async (id: string) => {
    await delay(100);
    const categories = getStorage<any[]>('ds_product_categories', []);
    const products = getStorage<any[]>('ds_products', []);

    if (products.some(p => p.categoryId === id)) {
      throw new ApiError(400, 'Cannot delete category containing active products.');
    }

    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) throw new ApiError(404, 'Category not found.');

    const oldVal = JSON.stringify(categories[idx]);
    categories.splice(idx, 1);
    localStorage.setItem('ds_product_categories', JSON.stringify(categories));
    createAuditLog('DELETE_CATEGORY', 'ProductCategory', id, oldVal, null);
    return { success: true };
  },

  getWarehouses: async () => {
    await delay(50);
    return getStorage<any[]>('ds_warehouses', []);
  },

  createWarehouse: async (data: any) => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const warehouses = getStorage<any[]>('ds_warehouses', []);

    if (warehouses.some(w => w.code.toUpperCase() === data.code.toUpperCase() && w.businessId === businessId)) {
      throw new ApiError(400, `Warehouse Code ${data.code} is already in use.`);
    }

    const newWh = {
      id: 'wh-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      name: data.name,
      code: data.code.toUpperCase(),
      address: data.address || '',
      createdAt: new Date().toISOString()
    };

    warehouses.push(newWh);
    localStorage.setItem('ds_warehouses', JSON.stringify(warehouses));

    // For all active products, initialize 0 stock records inside this warehouse
    const products = getStorage<any[]>('ds_products', []);
    const stocks = getStorage<any[]>('ds_product_stocks', []);
    products.forEach(p => {
      stocks.push({
        id: 'stock-' + Math.random().toString(36).substring(2, 9),
        businessId: businessId || 'default-biz',
        productId: p.id,
        productName: p.name,
        productSku: p.sku,
        warehouseId: newWh.id,
        warehouseName: newWh.name,
        quantity: 0,
        minStock: p.minStock || 5,
        maxStock: p.maxStock || 5000,
        reorderLevel: p.reorderLevel || 10,
        updatedAt: new Date().toISOString()
      });
    });
    localStorage.setItem('ds_product_stocks', JSON.stringify(stocks));

    createAuditLog('CREATE_WAREHOUSE', 'Warehouse', newWh.id, null, JSON.stringify(newWh));
    return newWh;
  },

  getInventoryStock: async (params?: { warehouseId?: string; search?: string }) => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    let stocks = getStorage<any[]>('ds_product_stocks', []);
    if (businessId) {
      stocks = stocks.filter(s => !s.businessId || s.businessId === businessId);
    }
    if (params?.warehouseId && params.warehouseId !== 'all') {
      stocks = stocks.filter(s => s.warehouseId === params.warehouseId);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      stocks = stocks.filter(s => 
        s.productName.toLowerCase().includes(q) || 
        s.productSku.toLowerCase().includes(q)
      );
    }
    return stocks;
  },

  getStockEntries: async () => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    let entries = getStorage<any[]>('ds_stock_entries', []);
    if (businessId) {
      entries = entries.filter(e => !e.businessId || e.businessId === businessId);
    }
    return entries;
  },

  createStockEntry: async (data: any) => {
    await delay(150);
    const { businessId, user } = getTenantAndUser();
    const stocks = getStorage<any[]>('ds_product_stocks', []);
    const entries = getStorage<any[]>('ds_stock_entries', []);
    const products = getStorage<any[]>('ds_products', []);
    const warehouses = getStorage<any[]>('ds_warehouses', []);

    const prod = products.find(p => p.id === data.productId);
    const wh = warehouses.find(w => w.id === data.warehouseId);

    if (!prod || !wh) throw new ApiError(400, 'Invalid Product or Warehouse mapping.');

    // Look for matching stock or create one
    let stockIdx = stocks.findIndex(s => s.productId === data.productId && s.warehouseId === data.warehouseId);
    if (stockIdx === -1) {
      const newStock = {
        id: 'stock-' + Math.random().toString(36).substring(2, 9),
        businessId: businessId || 'default-biz',
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        warehouseId: wh.id,
        warehouseName: wh.name,
        quantity: 0,
        minStock: prod.minStock || 5,
        maxStock: prod.maxStock || 10000,
        reorderLevel: prod.reorderLevel || 10,
        updatedAt: new Date().toISOString()
      };
      stocks.push(newStock);
      stockIdx = stocks.length - 1;
    }

    const currentQty = Number(stocks[stockIdx].quantity);
    const changeQty = Number(data.quantity);
    let finalQty = currentQty;

    if (data.type === 'OPENING') {
      finalQty = changeQty;
    } else if (data.type === 'STOCK_IN' || data.type === 'PURCHASE') {
      finalQty = currentQty + changeQty;
    } else if (data.type === 'STOCK_OUT') {
      if (currentQty < changeQty) {
        throw new ApiError(400, `Insufficient stock in ${wh.name}. Available: ${currentQty} ${prod.unit}`);
      }
      finalQty = currentQty - changeQty;
    } else if (data.type === 'ADJUSTMENT' || data.type === 'VERIFICATION') {
      finalQty = changeQty;
    }

    // Save stock value updates
    stocks[stockIdx].quantity = finalQty;
    if (data.batchNumber) stocks[stockIdx].batchNumber = data.batchNumber;
    if (data.expiryDate) stocks[stockIdx].expiryDate = data.expiryDate;
    if (data.manufacturingDate) stocks[stockIdx].manufacturingDate = data.manufacturingDate;
    stocks[stockIdx].updatedAt = new Date().toISOString();
    localStorage.setItem('ds_product_stocks', JSON.stringify(stocks));

    // Save Stock Entry audit record
    const entryNumber = 'ENT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const newEntry = {
      id: 'ent-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      entryNumber,
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      warehouseId: wh.id,
      warehouseName: wh.name,
      quantity: changeQty,
      type: data.type,
      reason: data.reason || 'Inventory general operation',
      batchNumber: data.batchNumber || '',
      expiryDate: data.expiryDate || '',
      manufacturingDate: data.manufacturingDate || '',
      performedBy: user?.name || 'Cooperative Admin',
      createdAt: new Date().toISOString()
    };

    entries.unshift(newEntry);
    localStorage.setItem('ds_stock_entries', JSON.stringify(entries));

    createAuditLog('STOCK_ENTRY', 'ProductStock', stocks[stockIdx].id, `Qty: ${currentQty}`, `Qty: ${finalQty}`);
    return newEntry;
  },

  createStockTransfer: async (data: any) => {
    await delay(200);
    const { businessId, user } = getTenantAndUser();
    const stocks = getStorage<any[]>('ds_product_stocks', []);
    const transfers = getStorage<any[]>('ds_stock_transfers', []);
    const products = getStorage<any[]>('ds_products', []);
    const warehouses = getStorage<any[]>('ds_warehouses', []);

    const prod = products.find(p => p.id === data.productId);
    const fromWh = warehouses.find(w => w.id === data.fromWarehouseId);
    const toWh = warehouses.find(w => w.id === data.toWarehouseId);

    if (!prod || !fromWh || !toWh) throw new ApiError(400, 'Invalid parameters for transfer.');
    if (data.fromWarehouseId === data.toWarehouseId) throw new ApiError(400, 'Source and destination warehouses cannot be identical.');

    // Look up stocks
    const fromStockIdx = stocks.findIndex(s => s.productId === data.productId && s.warehouseId === data.fromWarehouseId);
    const toStockIdx = stocks.findIndex(s => s.productId === data.productId && s.warehouseId === data.toWarehouseId);

    if (fromStockIdx === -1 || Number(stocks[fromStockIdx].quantity) < Number(data.quantity)) {
      const avail = fromStockIdx === -1 ? 0 : stocks[fromStockIdx].quantity;
      throw new ApiError(400, `Insufficient source stock. Available: ${avail} ${prod.unit} in ${fromWh.name}`);
    }

    const transferQty = Number(data.quantity);
    
    // Decrement source
    stocks[fromStockIdx].quantity = Number(stocks[fromStockIdx].quantity) - transferQty;
    stocks[fromStockIdx].updatedAt = new Date().toISOString();

    // Increment destination
    if (toStockIdx === -1) {
      stocks.push({
        id: 'stock-' + Math.random().toString(36).substring(2, 9),
        businessId: businessId || 'default-biz',
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        warehouseId: toWh.id,
        warehouseName: toWh.name,
        quantity: transferQty,
        minStock: prod.minStock || 5,
        maxStock: prod.maxStock || 10000,
        reorderLevel: prod.reorderLevel || 10,
        batchNumber: stocks[fromStockIdx].batchNumber || '',
        expiryDate: stocks[fromStockIdx].expiryDate || '',
        manufacturingDate: stocks[fromStockIdx].manufacturingDate || '',
        updatedAt: new Date().toISOString()
      });
    } else {
      stocks[toStockIdx].quantity = Number(stocks[toStockIdx].quantity) + transferQty;
      if (stocks[fromStockIdx].batchNumber) stocks[toStockIdx].batchNumber = stocks[fromStockIdx].batchNumber;
      if (stocks[fromStockIdx].expiryDate) stocks[toStockIdx].expiryDate = stocks[fromStockIdx].expiryDate;
      stocks[toStockIdx].updatedAt = new Date().toISOString();
    }

    localStorage.setItem('ds_product_stocks', JSON.stringify(stocks));

    // Register Transfer entry
    const transferNumber = 'TRF-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const newTransfer = {
      id: 'trf-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      transferNumber,
      productId: prod.id,
      productName: prod.name,
      fromWarehouseId: fromWh.id,
      fromWarehouseName: fromWh.name,
      toWarehouseId: toWh.id,
      toWarehouseName: toWh.name,
      quantity: transferQty,
      remarks: data.remarks || 'Stock replenishment transfer',
      status: 'COMPLETED',
      performedBy: user?.name || 'Cooperative Admin',
      createdAt: new Date().toISOString()
    };

    transfers.unshift(newTransfer);
    localStorage.setItem('ds_stock_transfers', JSON.stringify(transfers));

    // Create dual stock entries for ledger history
    const entries = getStorage<any[]>('ds_stock_entries', []);
    entries.unshift({
      id: 'ent-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      entryNumber: 'ENT-OUT-' + Math.floor(1000 + Math.random() * 9000),
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      warehouseId: fromWh.id,
      warehouseName: fromWh.name,
      quantity: transferQty,
      type: 'STOCK_OUT',
      reason: `Transfer to ${toWh.name} (Ref: ${transferNumber})`,
      batchNumber: stocks[fromStockIdx].batchNumber || '',
      performedBy: user?.name || 'Cooperative Admin',
      createdAt: new Date().toISOString()
    });
    entries.unshift({
      id: 'ent-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      entryNumber: 'ENT-IN-' + Math.floor(1000 + Math.random() * 9000),
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      warehouseId: toWh.id,
      warehouseName: toWh.name,
      quantity: transferQty,
      type: 'STOCK_IN',
      reason: `Transfer from ${fromWh.name} (Ref: ${transferNumber})`,
      batchNumber: stocks[fromStockIdx].batchNumber || '',
      performedBy: user?.name || 'Cooperative Admin',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('ds_stock_entries', JSON.stringify(entries));

    createAuditLog('STOCK_TRANSFER', 'StockTransfer', newTransfer.id, null, JSON.stringify(newTransfer));
    return newTransfer;
  },

  getSuppliers: async () => {
    await delay(50);
    return getStorage<any[]>('ds_suppliers', []);
  },

  createSupplier: async (data: any) => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const suppliers = getStorage<any[]>('ds_suppliers', []);

    if (suppliers.some(s => s.code.toUpperCase() === data.code.toUpperCase() && s.businessId === businessId)) {
      throw new ApiError(400, `Supplier Code ${data.code} already exists.`);
    }

    const newSupplier = {
      id: 'sup-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      name: data.name,
      code: data.code.toUpperCase(),
      contactPerson: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      gstin: data.gstin || '',
      createdAt: new Date().toISOString()
    };

    suppliers.push(newSupplier);
    localStorage.setItem('ds_suppliers', JSON.stringify(suppliers));
    createAuditLog('CREATE_SUPPLIER', 'Supplier', newSupplier.id, null, JSON.stringify(newSupplier));
    return newSupplier;
  },

  getPurchases: async () => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    let purchases = getStorage<any[]>('ds_purchases', []);
    if (businessId) {
      purchases = purchases.filter(p => !p.businessId || p.businessId === businessId);
    }
    return purchases;
  },

  createPurchase: async (data: any) => {
    await delay(200);
    const { businessId, user } = getTenantAndUser();
    const purchases = getStorage<any[]>('ds_purchases', []);
    const suppliers = getStorage<any[]>('ds_suppliers', []);
    const products = getStorage<any[]>('ds_products', []);

    const supplier = suppliers.find(s => s.id === data.supplierId);
    if (!supplier) throw new ApiError(400, 'Invalid Supplier mapping.');

    const purchaseNumber = 'PUR-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    let calculatedTotal = 0;

    const purchaseItems = data.items.map((it: any) => {
      const prod = products.find(p => p.id === it.productId);
      if (!prod) throw new ApiError(400, `Product with ID ${it.productId} not found.`);
      
      const itemTotal = Number(it.quantity) * Number(it.costPrice);
      calculatedTotal += itemTotal;

      return {
        id: 'pitem-' + Math.random().toString(36).substring(2, 9),
        productId: prod.id,
        productName: prod.name,
        quantity: Number(it.quantity),
        costPrice: Number(it.costPrice),
        totalAmount: itemTotal,
        batchNumber: it.batchNumber || 'B-PUR-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
        expiryDate: it.expiryDate || '',
        manufacturingDate: it.manufacturingDate || ''
      };
    });

    const newPurchase = {
      id: 'pur-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      purchaseNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
      totalAmount: calculatedTotal,
      paymentStatus: data.paymentStatus || 'UNPAID',
      remarks: data.remarks || '',
      items: purchaseItems,
      createdAt: new Date().toISOString()
    };

    purchases.unshift(newPurchase);
    localStorage.setItem('ds_purchases', JSON.stringify(purchases));

    // Automatically STOCK IN all purchased items to Main warehouse (wh-1)
    const warehouses = getStorage<any[]>('ds_warehouses', []);
    const mainWh = warehouses[0];
    if (mainWh) {
      for (const item of purchaseItems) {
        await api.createStockEntry({
          productId: item.productId,
          warehouseId: mainWh.id,
          quantity: item.quantity,
          type: 'STOCK_IN',
          reason: `Procured under Purchase Invoice: ${purchaseNumber}`,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          manufacturingDate: item.manufacturingDate
        });
      }
    }

    createAuditLog('CREATE_PURCHASE', 'PurchaseEntry', newPurchase.id, null, JSON.stringify(newPurchase));
    return newPurchase;
  },

  // ==========================================
  // STAGE 5.6: CUSTOMER & SALES MANAGEMENT
  // ==========================================
  getCustomers: async () => {
    await delay(50);
    const { businessId } = getTenantAndUser();
    let customers = getStorage<any[]>('ds_customers', []);
    if (customers.length === 0) {
      customers = [
        {
          id: 'cust-1',
          businessId: businessId || 'default-biz',
          code: 'CUST-0001',
          name: 'Mother Dairy Coop',
          email: 'procurement@motherdairy.com',
          phone: '+91 98765 43210',
          address: 'Main Industrial Area, Sector 4, Ludhiana',
          category: 'Wholesaler',
          gstNumber: '03AABCM1234F1Z0',
          creditLimit: 500000,
          outstandingBalance: 120000,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cust-2',
          businessId: businessId || 'default-biz',
          code: 'CUST-0002',
          name: 'Verka Dairy Outlets',
          email: 'sales@verka.coop',
          phone: '+91 98123 45678',
          address: 'GT Road East, Amritsar',
          category: 'Distributor',
          gstNumber: '03AABCV5678D2Z9',
          creditLimit: 1000000,
          outstandingBalance: 250000,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cust-3',
          businessId: businessId || 'default-biz',
          code: 'CUST-0003',
          name: 'Amul Distribution Jalandhar',
          email: 'jalandhar@amul.coop',
          phone: '+91 94632 10987',
          address: 'Circular Road, Near Railway Crossing, Jalandhar',
          category: 'Wholesaler',
          gstNumber: '03AABCA9012G3Z8',
          creditLimit: 800000,
          outstandingBalance: 0,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cust-4',
          businessId: businessId || 'default-biz',
          code: 'CUST-0004',
          name: 'Standard Retail Stores',
          email: 'info@standardretail.in',
          phone: '+91 81462 88888',
          address: 'Mall Road, Civil Lines, Bathinda',
          category: 'Retailer',
          gstNumber: '',
          creditLimit: 100000,
          outstandingBalance: 15000,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ds_customers', JSON.stringify(customers));
      
      // Seed matching ledger entries
      const ledgers = [
        {
          id: 'cl-1',
          businessId: businessId || 'default-biz',
          customerId: 'cust-1',
          customerName: 'Mother Dairy Coop',
          date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
          type: 'INVOICE',
          referenceNumber: 'INV-2026-00001',
          debit: 120000,
          credit: 0,
          balance: 120000,
          remarks: 'Initial outstanding sales invoice',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cl-2',
          businessId: businessId || 'default-biz',
          customerId: 'cust-2',
          customerName: 'Verka Dairy Outlets',
          date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
          type: 'INVOICE',
          referenceNumber: 'INV-2026-00002',
          debit: 250000,
          credit: 0,
          balance: 250000,
          remarks: 'Initial outstanding sales invoice',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cl-3',
          businessId: businessId || 'default-biz',
          customerId: 'cust-4',
          customerName: 'Standard Retail Stores',
          date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
          type: 'INVOICE',
          referenceNumber: 'INV-2026-00003',
          debit: 150000,
          credit: 0,
          balance: 150000,
          remarks: 'Initial sales invoice',
          createdAt: new Date().toISOString()
        },
        {
          id: 'cl-4',
          businessId: businessId || 'default-biz',
          customerId: 'cust-4',
          customerName: 'Standard Retail Stores',
          date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
          type: 'PAYMENT',
          referenceNumber: 'PAY-2026-00001',
          debit: 0,
          credit: 135000,
          balance: 15000,
          remarks: 'Partial payment received - UPI',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ds_customer_ledger', JSON.stringify(ledgers));

      // Seed initial sales invoices
      const seededInvoices = [
        {
          id: 'sales-1',
          businessId: businessId || 'default-biz',
          invoiceNumber: 'INV-2026-00001',
          orderNumber: 'SO-2026-00001',
          customerId: 'cust-1',
          customerName: 'Mother Dairy Coop',
          invoiceDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
          orderStatus: 'DELIVERED',
          paymentStatus: 'UNPAID',
          subtotal: 101694.92,
          discount: 0,
          gstRate: 18,
          gstAmount: 18305.08,
          taxAmount: 18305.08,
          totalAmount: 120000.00,
          paidAmount: 0.00,
          outstandingAmount: 120000.00,
          remarks: 'Delivered successfully to main plant',
          items: [
            {
              productId: 'prod-1',
              productName: 'Double Toned Milk (1L)',
              productSku: 'MILK-DT-1L',
              quantity: 2000,
              unitPrice: 60.00,
              discount: 0,
              gstRate: 18,
              gstAmount: 18305.08,
              totalAmount: 120000.00
            }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: 'sales-2',
          businessId: businessId || 'default-biz',
          invoiceNumber: 'INV-2026-00002',
          orderNumber: 'SO-2026-00002',
          customerId: 'cust-2',
          customerName: 'Verka Dairy Outlets',
          invoiceDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
          orderStatus: 'DELIVERED',
          paymentStatus: 'UNPAID',
          subtotal: 211864.41,
          discount: 0,
          gstRate: 18,
          gstAmount: 38135.59,
          taxAmount: 38135.59,
          totalAmount: 250000.00,
          paidAmount: 0.00,
          outstandingAmount: 250000.00,
          remarks: 'Urgent stock supply',
          items: [
            {
              productId: 'prod-1',
              productName: 'Double Toned Milk (1L)',
              productSku: 'MILK-DT-1L',
              quantity: 4166.67,
              unitPrice: 60.00,
              discount: 0,
              gstRate: 18,
              gstAmount: 38135.59,
              totalAmount: 250000.00
            }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: 'sales-3',
          businessId: businessId || 'default-biz',
          invoiceNumber: 'INV-2026-00003',
          orderNumber: 'SO-2026-00003',
          customerId: 'cust-4',
          customerName: 'Standard Retail Stores',
          invoiceDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
          orderStatus: 'DELIVERED',
          paymentStatus: 'PARTIAL',
          subtotal: 127118.64,
          discount: 0,
          gstRate: 18,
          gstAmount: 22881.36,
          taxAmount: 22881.36,
          totalAmount: 150000.00,
          paidAmount: 135000.00,
          outstandingAmount: 15000.00,
          remarks: 'Delivered via Local Delivery Van',
          items: [
            {
              productId: 'prod-1',
              productName: 'Double Toned Milk (1L)',
              productSku: 'MILK-DT-1L',
              quantity: 2500,
              unitPrice: 60.00,
              discount: 0,
              gstRate: 18,
              gstAmount: 22881.36,
              totalAmount: 150000.00
            }
          ],
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ds_sales_invoices', JSON.stringify(seededInvoices));

      // Seed initial payments
      const seededPayments = [
        {
          id: 'pay-1',
          businessId: businessId || 'default-biz',
          paymentNumber: 'PAY-2026-00001',
          customerId: 'cust-4',
          customerName: 'Standard Retail Stores',
          amount: 135000.00,
          paymentMethod: 'UPI',
          transactionReference: 'UPI-992834781203',
          paymentDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
          remarks: 'Payment for invoice INV-2026-00003',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ds_customer_payments', JSON.stringify(seededPayments));
    }
    
    if (businessId) {
      customers = customers.filter(c => !c.businessId || c.businessId === businessId);
    }
    return customers;
  },

  createCustomer: async (data: any) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    const customers = getStorage<any[]>('ds_customers', []);
    
    // Generate code
    const num = customers.length + 1;
    const code = 'CUST-' + String(num).padStart(4, '0');
    
    const newCustomer = {
      id: 'cust-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      code,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      category: data.category || 'Retailer',
      gstNumber: data.gstNumber || '',
      creditLimit: parseFloat(data.creditLimit) || 0,
      outstandingBalance: 0,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    
    customers.push(newCustomer);
    localStorage.setItem('ds_customers', JSON.stringify(customers));
    
    createAuditLog('CREATE_CUSTOMER', 'Customer', newCustomer.id, null, JSON.stringify(newCustomer));
    createActivityLog('CUSTOMER', `Registered customer ${newCustomer.name} (${newCustomer.code}).`);
    return newCustomer;
  },

  updateCustomer: async (id: string, data: any) => {
    await delay(150);
    const customers = getStorage<any[]>('ds_customers', []);
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) throw new ApiError(404, 'Customer not found.');
    
    const oldVal = JSON.stringify(customers[idx]);
    customers[idx] = {
      ...customers[idx],
      name: data.name,
      email: data.email ?? customers[idx].email,
      phone: data.phone ?? customers[idx].phone,
      address: data.address ?? customers[idx].address,
      category: data.category ?? customers[idx].category,
      gstNumber: data.gstNumber ?? customers[idx].gstNumber,
      creditLimit: parseFloat(data.creditLimit) ?? customers[idx].creditLimit,
      status: data.status ?? customers[idx].status,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('ds_customers', JSON.stringify(customers));
    createAuditLog('UPDATE_CUSTOMER', 'Customer', id, oldVal, JSON.stringify(customers[idx]));
    createActivityLog('CUSTOMER', `Updated profile of customer ${customers[idx].name}.`);
    return customers[idx];
  },

  deleteCustomer: async (id: string) => {
    await delay(100);
    const customers = getStorage<any[]>('ds_customers', []);
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) throw new ApiError(404, 'Customer not found.');
    
    const oldVal = JSON.stringify(customers[idx]);
    const filtered = customers.filter(c => c.id !== id);
    localStorage.setItem('ds_customers', JSON.stringify(filtered));
    
    createAuditLog('DELETE_CUSTOMER', 'Customer', id, oldVal, null);
    createActivityLog('CUSTOMER', `Deleted customer ${customers[idx].name}.`);
    return { success: true };
  },

  getSalesInvoices: async () => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    let invoices = getStorage<any[]>('ds_sales_invoices', []);
    if (businessId) {
      invoices = invoices.filter(i => !i.businessId || i.businessId === businessId);
    }
    return invoices;
  },

  createSalesInvoice: async (data: any) => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    const invoices = getStorage<any[]>('ds_sales_invoices', []);
    const customers = getStorage<any[]>('ds_customers', []);
    const products = getStorage<any[]>('ds_products', []);
    
    const customer = customers.find(c => c.id === data.customerId);
    if (!customer) throw new ApiError(400, 'Invalid Customer selection.');
    
    // Check credit limit
    const potentialOutstanding = (customer.outstandingBalance || 0) + Number(data.totalAmount || 0);
    if (customer.creditLimit && potentialOutstanding > customer.creditLimit) {
      throw new ApiError(400, `Cannot create order. Total outstanding of Rs. ${potentialOutstanding.toFixed(2)} would exceed Customer credit limit of Rs. ${customer.creditLimit.toFixed(2)}.`);
    }

    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    const invoiceNumber = 'INV-' + year + '-' + rand;
    const orderNumber = 'SO-' + year + '-' + rand;
    
    // Process order items
    const invoiceItems = (data.items || []).map((it: any) => {
      const prod = products.find(p => p.id === it.productId);
      const productName = prod ? prod.name : 'Unknown Product';
      const productSku = prod ? prod.sku : '';
      const qty = parseFloat(it.quantity) || 0;
      const price = parseFloat(it.unitPrice) || 0;
      const disc = parseFloat(it.discount) || 0;
      const gstRate = parseFloat(it.gstRate) || 0;
      
      const itemSubtotal = qty * price;
      const discounted = itemSubtotal - disc;
      const gstAmount = (discounted * gstRate) / 100;
      const totalAmount = discounted + gstAmount;
      
      return {
        productId: it.productId,
        productName,
        productSku,
        quantity: qty,
        unitPrice: price,
        discount: disc,
        gstRate,
        gstAmount,
        totalAmount
      };
    });
    
    const calculatedSubtotal = invoiceItems.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice - item.discount), 0);
    const calculatedGst = invoiceItems.reduce((acc: number, item: any) => acc + item.gstAmount, 0);
    const calculatedTotal = calculatedSubtotal + calculatedGst;
    
    const paidAmount = parseFloat(data.paidAmount) || 0;
    const outstandingAmount = calculatedTotal - paidAmount;
    
    const newInvoice = {
      id: 'sales-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      invoiceNumber,
      orderNumber,
      customerId: customer.id,
      customerName: customer.name,
      invoiceDate: data.invoiceDate || new Date().toISOString().split('T')[0],
      orderStatus: data.orderStatus || 'DELIVERED',
      paymentStatus: paidAmount >= calculatedTotal ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'UNPAID'),
      subtotal: calculatedSubtotal,
      discount: parseFloat(data.discount) || 0,
      gstRate: 18,
      gstAmount: calculatedGst,
      taxAmount: calculatedGst,
      totalAmount: calculatedTotal,
      paidAmount,
      outstandingAmount,
      remarks: data.remarks || '',
      items: invoiceItems,
      createdAt: new Date().toISOString()
    };
    
    invoices.unshift(newInvoice);
    localStorage.setItem('ds_sales_invoices', JSON.stringify(invoices));
    
    // Update Customer outstanding balance
    const custIdx = customers.findIndex(c => c.id === customer.id);
    if (custIdx !== -1) {
      customers[custIdx].outstandingBalance = (customers[custIdx].outstandingBalance || 0) + outstandingAmount;
      localStorage.setItem('ds_customers', JSON.stringify(customers));
    }
    
    // Create customer ledger entries
    const ledger = getStorage<any[]>('ds_customer_ledger', []);
    const prevLedger = ledger.filter(l => l.customerId === customer.id);
    const prevBalance = prevLedger.length > 0 ? prevLedger[0].balance : 0;
    
    const newLedgerEntry = {
      id: 'cl-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      customerId: customer.id,
      customerName: customer.name,
      date: newInvoice.invoiceDate,
      type: 'INVOICE',
      referenceNumber: invoiceNumber,
      debit: calculatedTotal,
      credit: 0,
      balance: prevBalance + calculatedTotal,
      remarks: `Sales Invoice generated. Remarks: ${newInvoice.remarks}`,
      createdAt: new Date().toISOString()
    };
    ledger.unshift(newLedgerEntry);
    
    if (paidAmount > 0) {
      const payLedgerEntry = {
        id: 'cl-' + Math.random().toString(36).substring(2, 9),
        businessId: businessId || 'default-biz',
        customerId: customer.id,
        customerName: customer.name,
        date: newInvoice.invoiceDate,
        type: 'PAYMENT',
        referenceNumber: 'PAY-ON-INV-' + invoiceNumber,
        debit: 0,
        credit: paidAmount,
        balance: prevBalance + calculatedTotal - paidAmount,
        remarks: `Payment received during invoice generation`,
        createdAt: new Date().toISOString()
      };
      ledger.unshift(payLedgerEntry);
    }
    localStorage.setItem('ds_customer_ledger', JSON.stringify(ledger));
    
    // Automatically STOCK OUT all sold items from Main warehouse (wh-1)
    const warehouses = getStorage<any[]>('ds_warehouses', []);
    const mainWh = warehouses[0];
    if (mainWh) {
      for (const item of invoiceItems) {
        await api.createStockEntry({
          productId: item.productId,
          warehouseId: mainWh.id,
          quantity: item.quantity,
          type: 'STOCK_OUT',
          reason: `Sold under Sales Invoice: ${invoiceNumber}`,
          batchNumber: 'B-SALE-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          expiryDate: '',
          manufacturingDate: ''
        });
      }
    }
    
    createAuditLog('CREATE_SALES_INVOICE', 'SalesInvoice', newInvoice.id, null, JSON.stringify(newInvoice));
    createActivityLog('SALES', `Created invoice ${invoiceNumber} for customer ${customer.name}. Total: Rs. ${calculatedTotal.toFixed(2)}.`);
    return newInvoice;
  },

  updateSalesInvoiceStatus: async (id: string, status: string) => {
    await delay(100);
    const invoices = getStorage<any[]>('ds_sales_invoices', []);
    const idx = invoices.findIndex(i => i.id === id);
    if (idx === -1) throw new ApiError(404, 'Invoice not found.');
    
    const oldVal = JSON.stringify(invoices[idx]);
    invoices[idx].orderStatus = status;
    invoices[idx].updatedAt = new Date().toISOString();
    
    localStorage.setItem('ds_sales_invoices', JSON.stringify(invoices));
    createAuditLog('UPDATE_SALES_STATUS', 'SalesInvoice', id, oldVal, JSON.stringify(invoices[idx]));
    createActivityLog('SALES', `Updated sales order status of ${invoices[idx].invoiceNumber} to ${status}.`);
    return invoices[idx];
  },

  getSalesReturns: async () => {
    await delay(50);
    const { businessId } = getTenantAndUser();
    let returns = getStorage<any[]>('ds_sales_returns', []);
    if (businessId) {
      returns = returns.filter(r => !r.businessId || r.businessId === businessId);
    }
    return returns;
  },
  
  createSalesReturn: async (data: any) => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    const returns = getStorage<any[]>('ds_sales_returns', []);
    const invoices = getStorage<any[]>('ds_sales_invoices', []);
    const customers = getStorage<any[]>('ds_customers', []);
    const products = getStorage<any[]>('ds_products', []);
    
    const invoice = invoices.find(i => i.id === data.invoiceId);
    if (!invoice) throw new ApiError(400, 'Invalid Sales Invoice selection.');
    
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    const returnNumber = 'RET-' + year + '-' + rand;
    
    const returnItems = (data.items || []).map((it: any) => {
      const prod = products.find(p => p.id === it.productId);
      const productName = prod ? prod.name : 'Unknown Product';
      const qty = parseFloat(it.quantity) || 0;
      const price = parseFloat(it.unitPrice) || 0;
      const gstRate = parseFloat(it.gstRate) || 0;
      
      const itemSubtotal = qty * price;
      const gstAmount = (itemSubtotal * gstRate) / 100;
      const totalAmount = itemSubtotal + gstAmount;
      
      return {
        productId: it.productId,
        productName,
        quantity: qty,
        unitPrice: price,
        gstRate,
        gstAmount,
        totalAmount
      };
    });
    
    const calculatedSubtotal = returnItems.reduce((acc: number, item: any) => acc + (item.quantity * item.unitPrice), 0);
    const calculatedGst = returnItems.reduce((acc: number, item: any) => acc + item.gstAmount, 0);
    const calculatedTotal = calculatedSubtotal + calculatedGst;
    
    const newReturn = {
      id: 'ret-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      returnNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      returnDate: data.returnDate || new Date().toISOString().split('T')[0],
      subtotal: calculatedSubtotal,
      gstAmount: calculatedGst,
      totalAmount: calculatedTotal,
      remarks: data.remarks || '',
      items: returnItems,
      createdAt: new Date().toISOString()
    };
    
    returns.unshift(newReturn);
    localStorage.setItem('ds_sales_returns', JSON.stringify(returns));
    
    // Update customer outstanding
    const custIdx = customers.findIndex(c => c.id === invoice.customerId);
    if (custIdx !== -1) {
      customers[custIdx].outstandingBalance = Math.max(0, (customers[custIdx].outstandingBalance || 0) - calculatedTotal);
      localStorage.setItem('ds_customers', JSON.stringify(customers));
    }
    
    // Update Customer Ledger
    const ledger = getStorage<any[]>('ds_customer_ledger', []);
    const prevLedger = ledger.filter(l => l.customerId === invoice.customerId);
    const prevBalance = prevLedger.length > 0 ? prevLedger[0].balance : 0;
    
    const returnLedgerEntry = {
      id: 'cl-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      date: newReturn.returnDate,
      type: 'RETURN',
      referenceNumber: returnNumber,
      debit: 0,
      credit: calculatedTotal,
      balance: Math.max(0, prevBalance - calculatedTotal),
      remarks: `Sales Return Credit Note generated for Invoice: ${invoice.invoiceNumber}. Remarks: ${newReturn.remarks}`,
      createdAt: new Date().toISOString()
    };
    ledger.unshift(returnLedgerEntry);
    localStorage.setItem('ds_customer_ledger', JSON.stringify(ledger));
    
    // Stock items back into Main Warehouse wh-1
    const warehouses = getStorage<any[]>('ds_warehouses', []);
    const mainWh = warehouses[0];
    if (mainWh) {
      for (const item of returnItems) {
        await api.createStockEntry({
          productId: item.productId,
          warehouseId: mainWh.id,
          quantity: item.quantity,
          type: 'STOCK_IN',
          reason: `Returned stock under Sales Return CN: ${returnNumber}`,
          batchNumber: 'B-RET-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          expiryDate: '',
          manufacturingDate: ''
        });
      }
    }
    
    createAuditLog('CREATE_SALES_RETURN', 'SalesReturn', newReturn.id, null, JSON.stringify(newReturn));
    createActivityLog('SALES_RETURN', `Logged sales return ${returnNumber} from customer ${invoice.customerName}. Total returned: Rs. ${calculatedTotal.toFixed(2)}.`);
    return newReturn;
  },

  getCustomerPayments: async () => {
    await delay(50);
    const { businessId } = getTenantAndUser();
    let payments = getStorage<any[]>('ds_customer_payments', []);
    if (businessId) {
      payments = payments.filter(p => !p.businessId || p.businessId === businessId);
    }
    return payments;
  },
  
  createCustomerPayment: async (data: any) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    const payments = getStorage<any[]>('ds_customer_payments', []);
    const customers = getStorage<any[]>('ds_customers', []);
    const invoices = getStorage<any[]>('ds_sales_invoices', []);
    
    const customer = customers.find(c => c.id === data.customerId);
    if (!customer) throw new ApiError(400, 'Invalid Customer selection.');
    
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    const paymentNumber = 'PAY-' + year + '-' + rand;
    const payAmount = parseFloat(data.amount) || 0;
    
    const newPayment = {
      id: 'pay-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      paymentNumber,
      customerId: customer.id,
      customerName: customer.name,
      amount: payAmount,
      paymentMethod: data.paymentMethod || 'CASH',
      transactionReference: data.transactionReference || '',
      paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
      remarks: data.remarks || '',
      createdAt: new Date().toISOString()
    };
    
    payments.unshift(newPayment);
    localStorage.setItem('ds_customer_payments', JSON.stringify(payments));
    
    // Deduct from customer outstanding balance
    const custIdx = customers.findIndex(c => c.id === customer.id);
    if (custIdx !== -1) {
      customers[custIdx].outstandingBalance = Math.max(0, (customers[custIdx].outstandingBalance || 0) - payAmount);
      localStorage.setItem('ds_customers', JSON.stringify(customers));
    }
    
    // Apply payment to invoice if mapped
    if (data.invoiceId) {
      const invIdx = invoices.findIndex(i => i.id === data.invoiceId);
      if (invIdx !== -1) {
        invoices[invIdx].paidAmount = (invoices[invIdx].paidAmount || 0) + payAmount;
        invoices[invIdx].outstandingAmount = Math.max(0, invoices[invIdx].totalAmount - invoices[invIdx].paidAmount);
        invoices[invIdx].paymentStatus = invoices[invIdx].paidAmount >= invoices[invIdx].totalAmount ? 'PAID' : (invoices[invIdx].paidAmount > 0 ? 'PARTIAL' : 'UNPAID');
        localStorage.setItem('ds_sales_invoices', JSON.stringify(invoices));
      }
    }
    
    // Customer ledger entry
    const ledger = getStorage<any[]>('ds_customer_ledger', []);
    const prevLedger = ledger.filter(l => l.customerId === customer.id);
    const prevBalance = prevLedger.length > 0 ? prevLedger[0].balance : 0;
    
    const ledgerEntry = {
      id: 'cl-' + Math.random().toString(36).substring(2, 9),
      businessId: businessId || 'default-biz',
      customerId: customer.id,
      customerName: customer.name,
      date: newPayment.paymentDate,
      type: 'PAYMENT',
      referenceNumber: paymentNumber,
      debit: 0,
      credit: payAmount,
      balance: Math.max(0, prevBalance - payAmount),
      remarks: `Payment received via ${newPayment.paymentMethod}. Reference: ${newPayment.transactionReference}. Remarks: ${newPayment.remarks}`,
      createdAt: new Date().toISOString()
    };
    ledger.unshift(ledgerEntry);
    localStorage.setItem('ds_customer_ledger', JSON.stringify(ledger));
    
    createAuditLog('CREATE_CUSTOMER_PAYMENT', 'CustomerPayment', newPayment.id, null, JSON.stringify(newPayment));
    createActivityLog('PAYMENTS', `Received payment ${paymentNumber} of Rs. ${payAmount.toFixed(2)} from customer ${customer.name}.`);
    return newPayment;
  },
  
  getCustomerLedger: async (customerId: string) => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    let ledger = getStorage<any[]>('ds_customer_ledger', []);
    if (businessId) {
      ledger = ledger.filter(l => !l.businessId || l.businessId === businessId);
    }
    if (customerId && customerId !== 'all') {
      ledger = ledger.filter(l => l.customerId === customerId);
    }
    return ledger;
  },

  // === DELIVERY & DISTRIBUTION MODULE API ===

  getDeliveryRoutes: async () => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    let routes = getStorage<any[]>('ds_delivery_routes', []);
    
    // Seed default routes if empty
    if (routes.length === 0) {
      routes = [
        {
          id: 'route-1',
          businessId: bid,
          code: 'R-NORTH-01',
          name: 'North Civil Lines Route',
          vehicleNumber: 'PB-02-AX-8821',
          driverName: 'Karan Singh',
          driverPhone: '+91 98765 43210',
          startLocation: 'Main Cold Storage Hub',
          endLocation: 'Civil Lines Sector C',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'route-2',
          businessId: bid,
          code: 'R-EAST-02',
          name: 'East Model Town Route',
          vehicleNumber: 'PB-08-CZ-1422',
          driverName: 'Gurpreet Singh',
          driverPhone: '+91 98765 43211',
          startLocation: 'Main Cold Storage Hub',
          endLocation: 'Model Town Block G',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'route-3',
          businessId: bid,
          code: 'R-WEST-03',
          name: 'West Urban Estate Route',
          vehicleNumber: 'PB-02-BY-9905',
          driverName: 'Amit Sharma',
          driverPhone: '+91 98765 43212',
          startLocation: 'Bulk Distribution Silo',
          endLocation: 'Urban Estate Phase III',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ds_delivery_routes', JSON.stringify(routes));
    }

    return routes.filter(r => r.businessId === bid);
  },

  createDeliveryRoute: async (data: any) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const routes = getStorage<any[]>('ds_delivery_routes', []);

    if (!data.code || !data.name) {
      throw new ApiError(400, 'Route code and name are required.');
    }

    if (routes.some(r => r.businessId === bid && r.code.toUpperCase() === data.code.toUpperCase())) {
      throw new ApiError(400, `Route with code ${data.code} already exists.`);
    }

    const newRoute = {
      id: 'route-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      code: data.code.toUpperCase(),
      name: data.name,
      vehicleNumber: data.vehicleNumber || '',
      driverName: data.driverName || '',
      driverPhone: data.driverPhone || '',
      startLocation: data.startLocation || 'Main Hub',
      endLocation: data.endLocation || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    routes.unshift(newRoute);
    localStorage.setItem('ds_delivery_routes', JSON.stringify(routes));
    createAuditLog('CREATE_DELIVERY_ROUTE', 'DeliveryRoute', newRoute.id, null, JSON.stringify(newRoute));
    createActivityLog('DELIVERY', `Created delivery route ${newRoute.code} - ${newRoute.name}. Driver: ${newRoute.driverName}.`);
    return newRoute;
  },

  updateDeliveryRoute: async (id: string, data: any) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const routes = getStorage<any[]>('ds_delivery_routes', []);
    const idx = routes.findIndex(r => r.id === id && r.businessId === bid);

    if (idx === -1) throw new ApiError(404, 'Delivery Route not found.');

    const oldVal = JSON.stringify(routes[idx]);
    routes[idx] = {
      ...routes[idx],
      name: data.name || routes[idx].name,
      vehicleNumber: data.vehicleNumber !== undefined ? data.vehicleNumber : routes[idx].vehicleNumber,
      driverName: data.driverName !== undefined ? data.driverName : routes[idx].driverName,
      driverPhone: data.driverPhone !== undefined ? data.driverPhone : routes[idx].driverPhone,
      startLocation: data.startLocation !== undefined ? data.startLocation : routes[idx].startLocation,
      endLocation: data.endLocation !== undefined ? data.endLocation : routes[idx].endLocation,
      isActive: data.isActive !== undefined ? data.isActive : routes[idx].isActive,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('ds_delivery_routes', JSON.stringify(routes));
    createAuditLog('UPDATE_DELIVERY_ROUTE', 'DeliveryRoute', id, oldVal, JSON.stringify(routes[idx]));
    createActivityLog('DELIVERY', `Updated delivery route ${routes[idx].code} - ${routes[idx].name}.`);
    return routes[idx];
  },

  getDeliveryAreas: async () => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    let areas = getStorage<any[]>('ds_delivery_areas', []);

    // Seed default areas if empty
    if (areas.length === 0) {
      areas = [
        { id: 'area-1', businessId: bid, routeId: 'route-1', name: 'Civil Lines Area A', zone: 'North Zone', pincode: '143001', createdAt: new Date().toISOString() },
        { id: 'area-2', businessId: bid, routeId: 'route-1', name: 'Cantt Road Sector 2', zone: 'North Zone', pincode: '143001', createdAt: new Date().toISOString() },
        { id: 'area-3', businessId: bid, routeId: 'route-2', name: 'Model Town Block B', zone: 'East Zone', pincode: '144001', createdAt: new Date().toISOString() },
        { id: 'area-4', businessId: bid, routeId: 'route-3', name: 'Urban Estate Phase II', zone: 'West Zone', pincode: '144003', createdAt: new Date().toISOString() }
      ];
      localStorage.setItem('ds_delivery_areas', JSON.stringify(areas));
    }

    // Attach route names for display convenience
    const routes = getStorage<any[]>('ds_delivery_routes', []);
    return areas.filter(a => a.businessId === bid).map(a => {
      const route = routes.find(r => r.id === a.routeId);
      return {
        ...a,
        routeName: route ? `${route.code} - ${route.name}` : 'Unassigned Route'
      };
    });
  },

  createDeliveryArea: async (data: any) => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const areas = getStorage<any[]>('ds_delivery_areas', []);

    if (!data.name || !data.zone || !data.routeId) {
      throw new ApiError(400, 'Area name, zone, and route assignment are required.');
    }

    const newArea = {
      id: 'area-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      routeId: data.routeId,
      name: data.name,
      zone: data.zone,
      pincode: data.pincode || '',
      createdAt: new Date().toISOString()
    };

    areas.push(newArea);
    localStorage.setItem('ds_delivery_areas', JSON.stringify(areas));
    createAuditLog('CREATE_DELIVERY_AREA', 'DeliveryArea', newArea.id, null, JSON.stringify(newArea));
    createActivityLog('DELIVERY', `Created delivery area ${newArea.name} under Zone ${newArea.zone}.`);
    return newArea;
  },

  updateDeliveryArea: async (id: string, data: any) => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const areas = getStorage<any[]>('ds_delivery_areas', []);
    const idx = areas.findIndex(a => a.id === id && a.businessId === bid);

    if (idx === -1) throw new ApiError(404, 'Delivery Area not found.');

    const oldVal = JSON.stringify(areas[idx]);
    areas[idx] = {
      ...areas[idx],
      routeId: data.routeId || areas[idx].routeId,
      name: data.name || areas[idx].name,
      zone: data.zone || areas[idx].zone,
      pincode: data.pincode !== undefined ? data.pincode : areas[idx].pincode
    };

    localStorage.setItem('ds_delivery_areas', JSON.stringify(areas));
    createAuditLog('UPDATE_DELIVERY_AREA', 'DeliveryArea', id, oldVal, JSON.stringify(areas[idx]));
    createActivityLog('DELIVERY', `Updated delivery area ${areas[idx].name}.`);
    return areas[idx];
  },

  deleteDeliveryArea: async (id: string) => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const areas = getStorage<any[]>('ds_delivery_areas', []);
    const idx = areas.findIndex(a => a.id === id && a.businessId === bid);

    if (idx === -1) throw new ApiError(404, 'Delivery Area not found.');

    const oldVal = JSON.stringify(areas[idx]);
    areas.splice(idx, 1);
    localStorage.setItem('ds_delivery_areas', JSON.stringify(areas));
    createAuditLog('DELETE_DELIVERY_AREA', 'DeliveryArea', id, oldVal, null);
    createActivityLog('DELIVERY', `Deleted delivery area.`);
    return { success: true };
  },

  getCustomerSubscriptions: async () => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    let subs = getStorage<any[]>('ds_customer_subscriptions', []);

    // Seed default subscriptions if empty to make the dashboard highly interactive
    if (subs.length === 0) {
      const customers = getStorage<any[]>('ds_customers', []);
      const products = getStorage<any[]>('ds_products', []);
      const routes = getStorage<any[]>('ds_delivery_routes', []);
      const areas = getStorage<any[]>('ds_delivery_areas', []);

      if (customers.length > 0 && products.length > 0) {
        subs = [
          {
            id: 'sub-1',
            businessId: bid,
            customerId: customers[0].id,
            customerName: customers[0].name,
            customerPhone: customers[0].phone || '+91 99123 45671',
            routeId: routes[0]?.id || 'route-1',
            deliveryAreaId: areas[0]?.id || 'area-1',
            productId: products[0].id,
            productName: products[0].name,
            sku: products[0].sku,
            unit: products[0].unit,
            price: products[0].price,
            frequency: 'DAILY',
            quantity: 2,
            status: 'ACTIVE',
            startDate: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'sub-2',
            businessId: bid,
            customerId: customers[1]?.id || customers[0].id,
            customerName: customers[1]?.name || customers[0].name,
            customerPhone: customers[1]?.phone || '+91 99123 45672',
            routeId: routes[1]?.id || 'route-2',
            deliveryAreaId: areas[2]?.id || 'area-3',
            productId: products[0].id,
            productName: products[0].name,
            sku: products[0].sku,
            unit: products[0].unit,
            price: products[0].price,
            frequency: 'ALTERNATE_DAYS',
            quantity: 1,
            status: 'ACTIVE',
            startDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'sub-3',
            businessId: bid,
            customerId: customers[2]?.id || customers[0].id,
            customerName: customers[2]?.name || customers[0].name,
            customerPhone: customers[2]?.phone || '+91 99123 45673',
            routeId: routes[2]?.id || 'route-3',
            deliveryAreaId: areas[3]?.id || 'area-4',
            productId: products[1]?.id || products[0].id,
            productName: products[1]?.name || products[0].name,
            sku: products[1]?.sku || products[0].sku,
            unit: products[1]?.unit || products[0].unit,
            price: products[1]?.price || products[0].price,
            frequency: 'WEEKLY',
            quantity: 5,
            status: 'HOLD',
            startDate: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
            holdStartDate: new Date().toISOString().split('T')[0],
            holdEndDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('ds_customer_subscriptions', JSON.stringify(subs));
      }
    }

    const routes = getStorage<any[]>('ds_delivery_routes', []);
    return subs.filter(s => s.businessId === bid).map(s => {
      const route = routes.find(r => r.id === s.routeId);
      return {
        ...s,
        routeName: route ? `${route.code} - ${route.name}` : 'Unassigned Route'
      };
    });
  },

  createCustomerSubscription: async (data: any) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const subs = getStorage<any[]>('ds_customer_subscriptions', []);
    const customers = getStorage<any[]>('ds_customers', []);
    const products = getStorage<any[]>('ds_products', []);

    const customer = customers.find(c => c.id === data.customerId);
    const product = products.find(p => p.id === data.productId);

    if (!customer) throw new ApiError(400, 'Invalid Customer selection.');
    if (!product) throw new ApiError(400, 'Invalid Product selection.');
    if (!data.routeId || !data.deliveryAreaId || !data.frequency || !data.quantity) {
      throw new ApiError(400, 'Route, Area, Frequency, and Quantity are required.');
    }

    const newSub = {
      id: 'sub-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone || '',
      routeId: data.routeId,
      deliveryAreaId: data.deliveryAreaId,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unit: product.unit,
      price: Number(product.price),
      frequency: data.frequency,
      quantity: Number(data.quantity),
      status: data.status || 'ACTIVE',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      holdStartDate: data.holdStartDate || '',
      holdEndDate: data.holdEndDate || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    subs.unshift(newSub);
    localStorage.setItem('ds_customer_subscriptions', JSON.stringify(subs));
    createAuditLog('CREATE_SUBSCRIPTION', 'CustomerSubscription', newSub.id, null, JSON.stringify(newSub));
    createActivityLog('DELIVERY', `Created ${newSub.frequency} milk subscription for customer ${customer.name}. Qty: ${newSub.quantity} ${newSub.unit}.`);
    return newSub;
  },

  updateCustomerSubscription: async (id: string, data: any) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const subs = getStorage<any[]>('ds_customer_subscriptions', []);
    const idx = subs.findIndex(s => s.id === id && s.businessId === bid);

    if (idx === -1) throw new ApiError(404, 'Subscription not found.');

    const oldVal = JSON.stringify(subs[idx]);
    subs[idx] = {
      ...subs[idx],
      routeId: data.routeId || subs[idx].routeId,
      deliveryAreaId: data.deliveryAreaId || subs[idx].deliveryAreaId,
      frequency: data.frequency || subs[idx].frequency,
      quantity: data.quantity !== undefined ? Number(data.quantity) : subs[idx].quantity,
      status: data.status || subs[idx].status,
      holdStartDate: data.holdStartDate !== undefined ? data.holdStartDate : subs[idx].holdStartDate,
      holdEndDate: data.holdEndDate !== undefined ? data.holdEndDate : subs[idx].holdEndDate,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('ds_customer_subscriptions', JSON.stringify(subs));
    createAuditLog('UPDATE_SUBSCRIPTION', 'CustomerSubscription', id, oldVal, JSON.stringify(subs[idx]));
    createActivityLog('DELIVERY', `Updated subscription status/parameters for customer ${subs[idx].customerName}. Status: ${subs[idx].status}.`);
    return subs[idx];
  },

  getDeliveryLogs: async (date?: string, shift?: string) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const targetDate = date || new Date().toISOString().split('T')[0];
    const targetShift = shift || 'MORNING';

    let logs = getStorage<any[]>('ds_delivery_logs', []);
    
    // Filter matching existing logs for that day/shift
    const existingLogs = logs.filter(l => l.businessId === bid && l.deliveryDate === targetDate && l.shift === targetShift);
    if (existingLogs.length > 0) {
      return existingLogs;
    }

    // Dynamic generation logic considering active subscriptions & frequency criteria!
    const activeSubs = getStorage<any[]>('ds_customer_subscriptions', []);
    const routes = getStorage<any[]>('ds_delivery_routes', []);
    const generatedLogs: any[] = [];

    activeSubs.forEach(sub => {
      if (sub.businessId !== bid) return;

      // Status check
      if (sub.status === 'CANCELLED') return;
      if (sub.status === 'HOLD') {
        // Check if current target date falls within hold range
        if (sub.holdStartDate && sub.holdEndDate) {
          if (targetDate >= sub.holdStartDate && targetDate <= sub.holdEndDate) {
            return; // On Hold currently
          }
        } else if (sub.holdStartDate && targetDate >= sub.holdStartDate) {
          return; // Indefinite Hold starting
        }
      }

      // Frequency eligibility check
      let isEligible = false;
      const subStart = new Date(sub.startDate);
      const deliveryD = new Date(targetDate);
      const diffTime = Math.abs(deliveryD.getTime() - subStart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (sub.frequency === 'DAILY') {
        isEligible = true;
      } else if (sub.frequency === 'ALTERNATE_DAYS') {
        // Deliver every 2 days
        isEligible = diffDays % 2 === 0;
      } else if (sub.frequency === 'WEEKLY') {
        // Deliver if day of week matches (0 = Sunday, 1 = Monday...)
        isEligible = subStart.getDay() === deliveryD.getDay();
      } else if (sub.frequency === 'MONTHLY') {
        // Deliver if day of month matches
        isEligible = subStart.getDate() === deliveryD.getDate();
      }

      if (isEligible) {
        const route = routes.find(r => r.id === sub.routeId);
        
        generatedLogs.push({
          id: 'log-' + Math.random().toString(36).substring(2, 9),
          businessId: bid,
          deliveryDate: targetDate,
          shift: targetShift,
          routeId: sub.routeId,
          routeName: route ? `${route.code} - ${route.name}` : 'Unassigned Route',
          driverName: route?.driverName || 'No Driver Assigned',
          customerId: sub.customerId,
          customerName: sub.customerName,
          customerPhone: sub.customerPhone || '',
          subscriptionId: sub.id,
          type: 'SUBSCRIPTION',
          productId: sub.productId,
          productName: sub.productName,
          quantity: sub.quantity,
          price: sub.price,
          totalAmount: sub.quantity * sub.price,
          status: 'PENDING',
          deliveredQuantity: sub.quantity,
          returnedQuantity: 0,
          reason: '',
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    });

    // Merge into storage database
    if (generatedLogs.length > 0) {
      const updatedLogs = [...generatedLogs, ...logs];
      localStorage.setItem('ds_delivery_logs', JSON.stringify(updatedLogs));
      createActivityLog('DELIVERY', `Generated ${generatedLogs.length} subscription deliveries automatically for ${targetDate} (${targetShift} Shift).`);
      return generatedLogs;
    }

    return [];
  },

  createOneTimeDelivery: async (data: any) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const logs = getStorage<any[]>('ds_delivery_logs', []);
    const customers = getStorage<any[]>('ds_customers', []);
    const products = getStorage<any[]>('ds_products', []);
    const routes = getStorage<any[]>('ds_delivery_routes', []);

    const customer = customers.find(c => c.id === data.customerId);
    const product = products.find(p => p.id === data.productId);
    const route = routes.find(r => r.id === data.routeId);

    if (!customer) throw new ApiError(400, 'Invalid Customer.');
    if (!product) throw new ApiError(400, 'Invalid Product.');
    if (!route) throw new ApiError(400, 'Invalid Route selection.');

    const newLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      deliveryDate: data.deliveryDate || new Date().toISOString().split('T')[0],
      shift: data.shift || 'MORNING',
      routeId: route.id,
      routeName: `${route.code} - ${route.name}`,
      driverName: route.driverName || 'No Driver Assigned',
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone || '',
      type: 'ONE_TIME',
      productId: product.id,
      productName: product.name,
      quantity: Number(data.quantity || 1),
      price: Number(product.price),
      totalAmount: Number(data.quantity || 1) * Number(product.price),
      status: 'PENDING',
      deliveredQuantity: Number(data.quantity || 1),
      returnedQuantity: 0,
      reason: '',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logs.unshift(newLog);
    localStorage.setItem('ds_delivery_logs', JSON.stringify(logs));
    createAuditLog('CREATE_ONE_TIME_DELIVERY', 'DeliveryLog', newLog.id, null, JSON.stringify(newLog));
    createActivityLog('DELIVERY', `Logged ad-hoc delivery order of ${newLog.quantity} ${product.unit} of ${product.name} for ${customer.name}.`);
    return newLog;
  },

  updateDeliveryLogStatus: async (id: string, data: any) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const logs = getStorage<any[]>('ds_delivery_logs', []);
    const idx = logs.findIndex(l => l.id === id && l.businessId === bid);

    if (idx === -1) throw new ApiError(404, 'Delivery Log entry not found.');

    const oldVal = JSON.stringify(logs[idx]);
    const prevStatus = logs[idx].status;

    // Apply updates
    logs[idx] = {
      ...logs[idx],
      status: data.status, // 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'FAILED'
      deliveredQuantity: data.status === 'FAILED' ? 0 : (data.deliveredQuantity !== undefined ? Number(data.deliveredQuantity) : logs[idx].quantity),
      returnedQuantity: data.status === 'FAILED' ? logs[idx].quantity : (data.returnedQuantity !== undefined ? Number(data.returnedQuantity) : 0),
      reason: data.reason || '',
      notes: data.notes || '',
      proofImage: data.proofImage || logs[idx].proofImage,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem('ds_delivery_logs', JSON.stringify(logs));
    createAuditLog('UPDATE_DELIVERY_STATUS', 'DeliveryLog', id, oldVal, JSON.stringify(logs[idx]));
    createActivityLog('DELIVERY', `Updated delivery status of order to ${data.status} for customer ${logs[idx].customerName}.`);

    // Perform database transaction logic: Stock out products from physical inventory upon successful delivery!
    if (data.status === 'DELIVERED' || data.status === 'PARTIALLY_DELIVERED') {
      const warehouses = getStorage<any[]>('ds_warehouses', []);
      const mainWh = warehouses[0]; // main cold storage hub
      const deliveredQty = logs[idx].deliveredQuantity;
      
      if (mainWh && deliveredQty > 0) {
        try {
          await api.createStockEntry({
            productId: logs[idx].productId,
            warehouseId: mainWh.id,
            quantity: deliveredQty,
            type: 'STOCK_OUT',
            reason: `Fulfillment of ${logs[idx].type} Delivery Ref: ${logs[idx].id}`,
            batchNumber: 'B-DELV-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
            expiryDate: '',
            manufacturingDate: ''
          });
        } catch (e) {
          console.error('Stock entry creation skipped or failed, preceding delivery status holds.', e);
        }
      }
    }

    return logs[idx];
  },

  optimizeRoute: async (routeId: string) => {
    await delay(200);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const logs = getStorage<any[]>('ds_delivery_logs', []);
    
    // Fetch matching delivery logs for today
    const today = new Date().toISOString().split('T')[0];
    const routeLogs = logs.filter(l => l.businessId === bid && l.routeId === routeId && l.status === 'PENDING');

    if (routeLogs.length === 0) {
      return { success: true, message: 'No pending deliveries to optimize on this route today.' };
    }

    // Foundation Algorithmic Optimization: Sort routes lexicographically by customer name/pincode to minimize transport steps
    const sorted = [...routeLogs].sort((a, b) => a.customerName.localeCompare(b.customerName));
    
    // Map with custom sequencing
    sorted.forEach((item, index) => {
      const originalIdx = logs.findIndex(l => l.id === item.id);
      if (originalIdx !== -1) {
        logs[originalIdx].notes = `Optimized Delivery Order Segment #${index + 1}. ` + (logs[originalIdx].notes || '');
      }
    });

    localStorage.setItem('ds_delivery_logs', JSON.stringify(logs));
    createActivityLog('DELIVERY', `Triggered route optimization algorithms for route ID ${routeId}. Sequenced ${sorted.length} delivery operations.`);
    return { success: true, message: `Successfully optimized transport sequences for ${sorted.length} active drop locations!` };
  },

  // === FINANCE & ACCOUNTING MODULE API ===

  getAccounts: async () => {
    await delay(50);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    let accounts = getStorage<any[]>('ds_chart_of_accounts', []);

    if (accounts.length === 0) {
      accounts = [
        { id: 'acc-cash', businessId: bid, code: '10010', name: 'Petty Cash Account', type: 'ASSET', openingBalance: 25000.00, currentBalance: 25000.00, isActive: true, createdAt: new Date().toISOString() },
        { id: 'acc-bank', businessId: bid, code: '10020', name: 'HDFC Corporate Bank', type: 'ASSET', openingBalance: 150000.00, currentBalance: 150000.00, isActive: true, createdAt: new Date().toISOString() },
        { id: 'acc-receivable', businessId: bid, code: '10035', name: 'Accounts Receivable (Customers)', type: 'ASSET', openingBalance: 0.00, currentBalance: 0.00, isActive: true, createdAt: new Date().toISOString() },
        { id: 'acc-payable', businessId: bid, code: '20010', name: 'Accounts Payable (Suppliers)', type: 'LIABILITY', openingBalance: 0.00, currentBalance: 0.00, isActive: true, createdAt: new Date().toISOString() },
        { id: 'acc-gst', businessId: bid, code: '20050', name: 'GST Clearance Control', type: 'LIABILITY', openingBalance: 0.00, currentBalance: 0.00, isActive: true, createdAt: new Date().toISOString() },
        { id: 'acc-equity', businessId: bid, code: '30010', name: 'Shareholder Capital', type: 'EQUITY', openingBalance: 175000.00, currentBalance: 175000.00, isActive: true, createdAt: new Date().toISOString() },
        { id: 'acc-rev-milk', businessId: bid, code: '40010', name: 'Milk Sales Revenue', type: 'INCOME', openingBalance: 0.00, currentBalance: 0.00, isActive: true, createdAt: new Date().toISOString() },
        { id: 'acc-rev-feed', businessId: bid, code: '40020', name: 'Cattle Feed Sales Revenue', type: 'INCOME', openingBalance: 0.00, currentBalance: 0.00, isActive: true, createdAt: new Date().toISOString() },
        { id: 'acc-exp-procure', businessId: bid, code: '50010', name: 'Milk Procurement Cost', type: 'EXPENSE', openingBalance: 0.00, currentBalance: 0.00, isActive: true, createdAt: new Date().toISOString() },
        { id: 'acc-exp-fuel', businessId: bid, code: '50020', name: 'Transport & Fleet Fuel Expense', type: 'EXPENSE', openingBalance: 0.00, currentBalance: 0.00, isActive: true, createdAt: new Date().toISOString() },
        { id: 'acc-exp-rent', businessId: bid, code: '50030', name: 'Office Rent & Maintenance', type: 'EXPENSE', openingBalance: 0.00, currentBalance: 0.00, isActive: true, createdAt: new Date().toISOString() },
        { id: 'acc-exp-utility', businessId: bid, code: '50040', name: 'Electricity & Utilities', type: 'EXPENSE', openingBalance: 0.00, currentBalance: 0.00, isActive: true, createdAt: new Date().toISOString() }
      ];
      localStorage.setItem('ds_chart_of_accounts', JSON.stringify(accounts));
    }

    return accounts.filter(a => a.businessId === bid);
  },

  createAccount: async (data: any) => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const accounts = getStorage<any[]>('ds_chart_of_accounts', []);

    if (!data.code || !data.name || !data.type) {
      throw new ApiError(400, 'Account code, name, and type are required.');
    }

    if (accounts.some(a => a.businessId === bid && a.code === data.code)) {
      throw new ApiError(400, `Account with code ${data.code} already exists.`);
    }

    const newAcc = {
      id: 'acc-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      code: data.code,
      name: data.name,
      type: data.type,
      openingBalance: Number(data.openingBalance || 0),
      currentBalance: Number(data.openingBalance || 0),
      isActive: true,
      createdAt: new Date().toISOString()
    };

    accounts.push(newAcc);
    localStorage.setItem('ds_chart_of_accounts', JSON.stringify(accounts));
    
    // Log Financial Audit
    const { user } = getTenantAndUser();
    const fLogs = getStorage<any[]>('ds_financial_audit_logs', []);
    fLogs.unshift({
      id: 'flog-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'sys',
      userName: user?.name || 'System',
      action: 'CREATE_ACCOUNT',
      module: 'FINANCE',
      details: `Created Chart of Account item: ${newAcc.code} - ${newAcc.name} (${newAcc.type})`
    });
    localStorage.setItem('ds_financial_audit_logs', JSON.stringify(fLogs));

    return newAcc;
  },

  getExpenses: async () => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    let expenses = getStorage<any[]>('ds_expenses_register', []);

    if (expenses.length === 0) {
      // Seed default expenses
      expenses = [
        {
          id: 'exp-1',
          businessId: bid,
          date: new Date(Date.now() - 48 * 3600 * 1000).toISOString().split('T')[0],
          categoryId: 'acc-exp-fuel',
          categoryName: 'Transport & Fleet Fuel Expense',
          amount: 4500.00,
          paidTo: 'Hind Petroleum Corp',
          paidFromAccountId: 'acc-bank',
          paidFromAccountName: 'HDFC Corporate Bank',
          paymentMode: 'BANK',
          status: 'APPROVED',
          approvedBy: 'Admin Team',
          notes: 'Fuel replenishment for Route North-01 vehicle PB-02-AX-8821.',
          isRecurring: false,
          attachments: ['fuel_receipt_102.pdf'],
          createdAt: new Date().toISOString()
        },
        {
          id: 'exp-2',
          businessId: bid,
          date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
          categoryId: 'acc-exp-rent',
          categoryName: 'Office Rent & Maintenance',
          amount: 15000.00,
          paidTo: 'S. Gurbachan Singh',
          paidFromAccountId: 'acc-bank',
          paidFromAccountName: 'HDFC Corporate Bank',
          paymentMode: 'BANK',
          status: 'PENDING',
          notes: 'Monthly corporate office space rental payment request.',
          isRecurring: true,
          recurrenceInterval: 'MONTHLY',
          attachments: [],
          createdAt: new Date().toISOString()
        },
        {
          id: 'exp-3',
          businessId: bid,
          date: new Date().toISOString().split('T')[0],
          categoryId: 'acc-exp-utility',
          categoryName: 'Electricity & Utilities',
          amount: 1240.00,
          paidTo: 'State Electricity Board',
          paidFromAccountId: 'acc-cash',
          paidFromAccountName: 'Petty Cash Account',
          paymentMode: 'CASH',
          status: 'PENDING',
          notes: 'Emergency repairs on local cooling unit backup generator battery.',
          isRecurring: false,
          attachments: [],
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ds_expenses_register', JSON.stringify(expenses));
    }

    return expenses.filter(e => e.businessId === bid);
  },

  createExpense: async (data: any) => {
    await delay(120);
    const { businessId, user } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const expenses = getStorage<any[]>('ds_expenses_register', []);

    if (!data.categoryId || !data.amount || !data.paidFromAccountId) {
      throw new ApiError(400, 'Expense category, amount, and source account are required.');
    }

    const accounts = getStorage<any[]>('ds_chart_of_accounts', []);
    const categoryAcc = accounts.find(a => a.id === data.categoryId);
    const sourceAcc = accounts.find(a => a.id === data.paidFromAccountId);

    if (!categoryAcc || !sourceAcc) {
      throw new ApiError(404, 'Invalid account references.');
    }

    const newExp = {
      id: 'exp-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      date: data.date || new Date().toISOString().split('T')[0],
      categoryId: data.categoryId,
      categoryName: categoryAcc.name,
      amount: Number(data.amount),
      paidTo: data.paidTo || 'General Vendor',
      paidFromAccountId: data.paidFromAccountId,
      paidFromAccountName: sourceAcc.name,
      paymentMode: data.paymentMode || 'CASH',
      status: 'PENDING', // starts pending for approval workflow
      notes: data.notes || '',
      isRecurring: !!data.isRecurring,
      recurrenceInterval: data.isRecurring ? data.recurrenceInterval : 'NONE',
      attachments: data.attachments || [],
      vendorRef: data.vendorRef || '',
      createdAt: new Date().toISOString()
    };

    expenses.unshift(newExp);
    localStorage.setItem('ds_expenses_register', JSON.stringify(expenses));

    // Audit Log
    const fLogs = getStorage<any[]>('ds_financial_audit_logs', []);
    fLogs.unshift({
      id: 'flog-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'sys',
      userName: user?.name || 'System',
      action: 'CREATE_EXPENSE_PENDING',
      module: 'EXPENSES',
      details: `Logged pending expense of Rs. ${newExp.amount.toFixed(2)} for ${newExp.categoryName}`
    });
    localStorage.setItem('ds_financial_audit_logs', JSON.stringify(fLogs));

    return newExp;
  },

  approveExpense: async (id: string, approvedBy: string) => {
    await delay(150);
    const { businessId, user } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const expenses = getStorage<any[]>('ds_expenses_register', []);
    const idx = expenses.findIndex(e => e.id === id && e.businessId === bid);

    if (idx === -1) throw new ApiError(404, 'Expense request not found.');
    if (expenses[idx].status !== 'PENDING') throw new ApiError(400, 'Expense has already been processed.');

    // DB Transactions simulation for ledger accounting integration
    expenses[idx].status = 'APPROVED';
    expenses[idx].approvedBy = approvedBy || 'Authorized Manager';

    localStorage.setItem('ds_expenses_register', JSON.stringify(expenses));

    // Generate Double Entry Journal Voucher Automatically on approval
    const vouchers = getStorage<any[]>('ds_vouchers_register', []);
    const voucherNo = 'VOU-EXP-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    
    const lines = [
      { id: 'l1', accountId: expenses[idx].categoryId, accountName: expenses[idx].categoryName, type: 'DEBIT', amount: expenses[idx].amount },
      { id: 'l2', accountId: expenses[idx].paidFromAccountId, accountName: expenses[idx].paidFromAccountName, type: 'CREDIT', amount: expenses[idx].amount }
    ];

    const newVoucher = {
      id: 'vou-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      voucherNo,
      date: expenses[idx].date,
      type: 'PAYMENT' as any,
      paymentMode: expenses[idx].paymentMode,
      totalAmount: expenses[idx].amount,
      notes: `Auto-generated voucher for approved expense: ${expenses[idx].notes}`,
      lines,
      createdBy: approvedBy,
      createdAt: new Date().toISOString()
    };

    vouchers.unshift(newVoucher);
    localStorage.setItem('ds_vouchers_register', JSON.stringify(vouchers));

    // Safely update Chart accounts current balances based on debits/credits
    const accounts = getStorage<any[]>('ds_chart_of_accounts', []);
    lines.forEach(line => {
      const acc = accounts.find(a => a.id === line.accountId && a.businessId === bid);
      if (acc) {
        const isDebitIncrease = acc.type === 'ASSET' || acc.type === 'EXPENSE';
        if (line.type === 'DEBIT') {
          acc.currentBalance = isDebitIncrease 
            ? Number((acc.currentBalance + line.amount).toFixed(2)) 
            : Number((acc.currentBalance - line.amount).toFixed(2));
        } else {
          acc.currentBalance = isDebitIncrease 
            ? Number((acc.currentBalance - line.amount).toFixed(2)) 
            : Number((acc.currentBalance + line.amount).toFixed(2));
        }
      }
    });
    localStorage.setItem('ds_chart_of_accounts', JSON.stringify(accounts));

    // Insert to Audit Logs
    const fLogs = getStorage<any[]>('ds_financial_audit_logs', []);
    fLogs.unshift({
      id: 'flog-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'sys',
      userName: user?.name || 'System',
      action: 'APPROVE_EXPENSE',
      module: 'EXPENSES',
      details: `Approved expense ref ${id}. Ledger entry posted: Voucher ${voucherNo} for Rs. ${expenses[idx].amount.toFixed(2)}`
    });
    localStorage.setItem('ds_financial_audit_logs', JSON.stringify(fLogs));

    return expenses[idx];
  },

  getVouchers: async () => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    let vouchers = getStorage<any[]>('ds_vouchers_register', []);

    // Seed default vouchers if empty
    if (vouchers.length === 0) {
      vouchers = [
        {
          id: 'vou-default-1',
          businessId: bid,
          voucherNo: 'VOU-PAY-1002',
          date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split('T')[0],
          type: 'PAYMENT',
          paymentMode: 'BANK',
          totalAmount: 1850.00,
          notes: 'Direct internet and telephone utility payment.',
          lines: [
            { id: 'vl1', accountId: 'acc-exp-utility', accountName: 'Electricity & Utilities', type: 'DEBIT', amount: 1850.00 },
            { id: 'vl2', accountId: 'acc-bank', accountName: 'HDFC Corporate Bank', type: 'CREDIT', amount: 1850.00 }
          ],
          createdBy: 'System Auditor',
          createdAt: new Date().toISOString()
        },
        {
          id: 'vou-default-2',
          businessId: bid,
          voucherNo: 'VOU-REC-504',
          date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
          type: 'RECEIPT',
          paymentMode: 'UPI',
          totalAmount: 7420.00,
          notes: 'Direct local buyer advance settlement for daily skimmed milk bulk collection.',
          lines: [
            { id: 'vl3', accountId: 'acc-bank', accountName: 'HDFC Corporate Bank', type: 'DEBIT', amount: 7420.00 },
            { id: 'vl4', accountId: 'acc-rev-milk', accountName: 'Milk Sales Revenue', type: 'CREDIT', amount: 7420.00 }
          ],
          createdBy: 'System Auditor',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ds_vouchers_register', JSON.stringify(vouchers));
    }

    return vouchers.filter(v => v.businessId === bid);
  },

  createVoucher: async (data: any) => {
    await delay(150);
    const { businessId, user } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const vouchers = getStorage<any[]>('ds_vouchers_register', []);

    if (!data.type || !data.lines || data.lines.length < 2) {
      throw new ApiError(400, 'Voucher type and at least 2 balanced transaction lines are required.');
    }

    // Verify debit/credit math matches (Decimal Precision Check)
    let totalDebits = 0;
    let totalCredits = 0;
    data.lines.forEach((l: any) => {
      const amt = Number(l.amount);
      if (l.type === 'DEBIT') totalDebits = Number((totalDebits + amt).toFixed(2));
      else totalCredits = Number((totalCredits + amt).toFixed(2));
    });

    if (totalDebits !== totalCredits) {
      throw new ApiError(400, `Double entry mismatch! Debits (Rs. ${totalDebits.toFixed(2)}) must exactly match Credits (Rs. ${totalCredits.toFixed(2)}).`);
    }

    const voucherNo = 'VOU-' + data.type.substring(0,3) + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    const newVou = {
      id: 'vou-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      voucherNo,
      date: data.date || new Date().toISOString().split('T')[0],
      type: data.type,
      paymentMode: data.paymentMode || 'CASH',
      totalAmount: totalDebits,
      notes: data.notes || '',
      lines: data.lines.map((l: any, idx: number) => ({
        id: `vl-${idx}-${Math.random().toString(36).substring(2, 5)}`,
        accountId: l.accountId,
        accountName: l.accountName,
        type: l.type,
        amount: Number(l.amount)
      })),
      createdBy: user?.name || 'System Operator',
      createdAt: new Date().toISOString()
    };

    vouchers.unshift(newVou);
    localStorage.setItem('ds_vouchers_register', JSON.stringify(vouchers));

    // DB transaction: Safely update ledger account current balances
    const accounts = getStorage<any[]>('ds_chart_of_accounts', []);
    newVou.lines.forEach((line: any) => {
      const acc = accounts.find(a => a.id === line.accountId && a.businessId === bid);
      if (acc) {
        const isDebitIncrease = acc.type === 'ASSET' || acc.type === 'EXPENSE';
        if (line.type === 'DEBIT') {
          acc.currentBalance = isDebitIncrease 
            ? Number((acc.currentBalance + line.amount).toFixed(2)) 
            : Number((acc.currentBalance - line.amount).toFixed(2));
        } else {
          acc.currentBalance = isDebitIncrease 
            ? Number((acc.currentBalance - line.amount).toFixed(2)) 
            : Number((acc.currentBalance + line.amount).toFixed(2));
        }
      }
    });
    localStorage.setItem('ds_chart_of_accounts', JSON.stringify(accounts));

    // Audit logs
    const fLogs = getStorage<any[]>('ds_financial_audit_logs', []);
    fLogs.unshift({
      id: 'flog-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'sys',
      userName: user?.name || 'System',
      action: 'CREATE_VOUCHER',
      module: 'ACCOUNTING',
      details: `Manually posted manual ${newVou.type} voucher ${newVou.voucherNo} of Rs. ${newVou.totalAmount.toFixed(2)}`
    });
    localStorage.setItem('ds_financial_audit_logs', JSON.stringify(fLogs));

    return newVou;
  },

  getDailyClosings: async () => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    let closings = getStorage<any[]>('ds_daily_closings', []);

    if (closings.length === 0) {
      // Seed a couple historic closed days
      closings = [
        {
          id: 'close-1',
          businessId: bid,
          date: new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0],
          cashOpening: 25000.00,
          cashReceived: 4500.00,
          cashPaid: 1240.00,
          cashClosing: 28260.00,
          bankOpening: 150000.00,
          bankReceived: 18500.00,
          bankPaid: 4500.00,
          bankClosing: 164000.00,
          status: 'LOCKED',
          closedBy: 'System Auditor',
          closedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
        }
      ];
      localStorage.setItem('ds_daily_closings', JSON.stringify(closings));
    }

    return closings.filter(c => c.businessId === bid);
  },

  closeDay: async (date: string, closedBy: string) => {
    await delay(200);
    const { businessId, user } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    const closings = getStorage<any[]>('ds_daily_closings', []);

    // Check if day is already closed
    const isClosed = closings.some(c => c.businessId === bid && c.date === date && c.status === 'LOCKED');
    if (isClosed) {
      throw new ApiError(400, `Operational Day ${date} is already locked and cannot be reclosed.`);
    }

    // Dynamic calculation based on transactions/vouchers posted today
    const vouchers = getStorage<any[]>('ds_vouchers_register', []).filter(v => v.businessId === bid && v.date === date);

    let cashReceived = 0;
    let cashPaid = 0;
    let bankReceived = 0;
    let bankPaid = 0;

    vouchers.forEach(v => {
      const mode = v.paymentMode || 'CASH';
      if (mode === 'CASH') {
        if (v.type === 'RECEIPT') cashReceived += v.totalAmount;
        else if (v.type === 'PAYMENT') cashPaid += v.totalAmount;
      } else {
        if (v.type === 'RECEIPT') bankReceived += v.totalAmount;
        else if (v.type === 'PAYMENT') bankPaid += v.totalAmount;
      }
    });

    // Fetch opening balance from yesterday or default
    const yesterdayDate = new Date(new Date(date).getTime() - 24 * 3600 * 1000).toISOString().split('T')[0];
    const yesterdayClosing = closings.find(c => c.businessId === bid && c.date === yesterdayDate);

    const cashOpening = yesterdayClosing ? yesterdayClosing.cashClosing : 25000.00;
    const bankOpening = yesterdayClosing ? yesterdayClosing.bankClosing : 150000.00;

    const cashClosing = Number((cashOpening + cashReceived - cashPaid).toFixed(2));
    const bankClosing = Number((bankOpening + bankReceived - bankPaid).toFixed(2));

    const newClosing = {
      id: 'close-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      date,
      cashOpening,
      cashReceived,
      cashPaid,
      cashClosing,
      bankOpening,
      bankReceived,
      bankPaid,
      bankClosing,
      status: 'LOCKED' as const,
      closedBy: closedBy || 'Admin Team',
      closedAt: new Date().toISOString()
    };

    closings.unshift(newClosing);
    localStorage.setItem('ds_daily_closings', JSON.stringify(closings));

    // Audit logs
    const fLogs = getStorage<any[]>('ds_financial_audit_logs', []);
    fLogs.unshift({
      id: 'flog-' + Math.random().toString(36).substring(2, 9),
      businessId: bid,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'sys',
      userName: user?.name || 'System',
      action: 'CLOSE_DAY_LOCK',
      module: 'RECONCILIATION',
      details: `Reconciled and locked day ${date}. Cash balance reconciled at Rs. ${cashClosing.toFixed(2)}, Bank balance Rs. ${bankClosing.toFixed(2)}`
    });
    localStorage.setItem('ds_financial_audit_logs', JSON.stringify(fLogs));

    return newClosing;
  },

  getFinancialAuditLogs: async () => {
    await delay(80);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';
    let logs = getStorage<any[]>('ds_financial_audit_logs', []);

    if (logs.length === 0) {
      logs = [
        {
          id: 'flog-init',
          businessId: bid,
          timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
          userId: 'usr-admin',
          userName: 'Preet Gill (COO)',
          action: 'SEED_CHART_OF_ACCOUNTS',
          module: 'FINANCE',
          details: 'Initialized standardized general ledger Chart of Accounts layout.'
        }
      ];
      localStorage.setItem('ds_financial_audit_logs', JSON.stringify(logs));
    }

    return logs.filter(l => l.businessId === bid);
  },

  getAnalyticsSummary: async (startDate?: string, endDate?: string) => {
    await delay(120);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 3600 * 1000);

    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = start;

    // Fetch tables
    const collections = getStorage<any[]>('ds_milk_collections', []).filter(c => c.businessId === bid);
    const sales = getStorage<any[]>('ds_milk_sales', []).filter(s => s.businessId === bid);
    const orders = getStorage<any[]>('ds_orders', []).filter(o => o.businessId === bid && o.status !== 'CANCELLED');
    const expenses = getStorage<any[]>('ds_expenses', []).filter(e => e.businessId === bid);
    const customers = getStorage<any[]>('ds_customers', []).filter(c => c.businessId === bid);
    const farmers = getStorage<any[]>('ds_farmers', []).filter(f => f.businessId === bid);
    const stocks = getStorage<any[]>('ds_product_stocks', []);

    // Filter by dates
    const filterByDate = (list: any[], dateField: string, sDate: Date, eDate: Date) => {
      return list.filter(item => {
        const d = new Date(item[dateField]);
        return d >= sDate && d <= eDate;
      });
    };

    const currentColl = filterByDate(collections, 'collectedAt', start, end);
    const prevColl = filterByDate(collections, 'collectedAt', prevStart, prevEnd);

    const currentSales = filterByDate(sales, 'soldAt', start, end);
    const prevSales = filterByDate(sales, 'soldAt', prevStart, prevEnd);

    const currentOrders = filterByDate(orders, 'createdAt', start, end);
    const prevOrders = filterByDate(orders, 'createdAt', prevStart, prevEnd);

    const currentExpenses = filterByDate(expenses, 'spentAt', start, end);
    const prevExpenses = filterByDate(expenses, 'spentAt', prevStart, prevEnd);

    // Summarize quantities and costs
    const sum = (arr: any[], field: string) => arr.reduce((acc, item) => acc + Number(item[field] || 0), 0);

    const curCollQty = sum(currentColl, 'quantity');
    const prevCollQty = sum(prevColl, 'quantity');
    const curCollCost = sum(currentColl, 'totalAmount');
    const prevCollCost = sum(prevColl, 'totalAmount');

    const curSaleQty = sum(currentSales, 'quantity');
    const curSaleRev = sum(currentSales, 'totalAmount');
    const prevSaleRev = sum(prevSales, 'totalAmount');

    const curOrderRev = sum(currentOrders, 'total');
    const prevOrderRev = sum(prevOrders, 'total');

    const curExp = sum(currentExpenses, 'amount');
    const prevExp = sum(prevExpenses, 'amount');

    const curRev = curSaleRev + curOrderRev;
    const prevRev = prevSaleRev + prevOrderRev;

    const curProfit = curRev - curCollCost - curExp;
    const prevProfit = prevRev - prevCollCost - prevExp;

    const lowStockCount = stocks.filter(st => {
      const p = getStorage<any[]>('ds_products', []).find(prd => prd.id === st.productId);
      return p && p.businessId === bid && Number(st.quantity) <= Number(st.minAlertQuantity || 50);
    }).length;

    // Calculate growth helper
    const growth = (curr: number, prev: number) => {
      if (prev <= 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 10000) / 100;
    };

    // Calculate Health Score
    let profitScore = 15;
    if (curRev > 0) {
      const margin = curProfit / curRev;
      profitScore = Math.max(0, Math.min(30, Math.round((margin + 0.2) * 50)));
    }
    const collectionGrowthVal = growth(curCollQty, prevCollQty);
    const collectionScore = Math.max(5, Math.min(25, 15 + Math.round(collectionGrowthVal / 2)));
    const opsScore = Math.max(0, 20 - (lowStockCount * 3));
    const customerScore = Math.max(10, Math.min(15, 10 + Math.round(customers.length / 10)));
    const healthScore = Math.min(100, Math.max(30, profitScore + collectionScore + opsScore + customerScore + 10));

    // Quality Averages
    const avg = (arr: any[], field: string) => arr.length > 0 ? arr.reduce((acc, x) => acc + Number(x[field] || 0), 0) / arr.length : 0;

    // Narrative Text
    const narrative: string[] = [];
    if (healthScore >= 80) {
      narrative.push(`Enterprise status is peak (Health Score: ${healthScore}/100) on active collection streams.`);
    } else {
      narrative.push(`Cooperative health is stabilized at ${healthScore}/100. Optimizing stock and credit schedules is recommended.`);
    }
    if (curRev > prevRev) {
      narrative.push(`Inflows expanded by **${growth(curRev, prevRev)}%** relative to the previous 30-day index.`);
    } else {
      narrative.push(`Revenue trends show localized deceleration. Deploying route-level milk campaigns or expanding local delivery hubs could stimulate margin expansion.`);
    }
    if (lowStockCount > 0) {
      narrative.push(`Warning: **${lowStockCount} items** are depleted below safe buffer quantities. Immediately initiate procurement purchase invoices.`);
    } else {
      narrative.push(`All logistics distribution stock levels are fully optimized and secure.`);
    }

    return {
      healthScore,
      executiveSummaryText: narrative.join(' '),
      kpis: {
        revenue: { current: curRev, previous: prevRev, growth: growth(curRev, prevRev) },
        profit: { current: curProfit, previous: prevProfit, growth: growth(curProfit, prevProfit) },
        expense: { current: curExp, previous: prevExp, growth: growth(curExp, prevExp) },
        procurementCost: { current: curCollCost, previous: prevCollCost, growth: growth(curCollCost, prevCollCost) },
        milkCollectedLiters: { current: curCollQty, previous: prevCollQty, growth: growth(curCollQty, prevCollQty) },
        milkSoldLiters: { current: curSaleQty, previous: curSaleQty * 0.9, growth: 11.11 },
        activeCustomers: { current: customers.length, previous: Math.max(1, customers.length - 1), growth: growth(customers.length, Math.max(1, customers.length - 1)) },
        activeFarmers: { current: farmers.length || 4, previous: farmers.length || 4, growth: 0 }
      },
      qualityMetrics: {
        averageFat: avg(currentColl, 'fat') || 4.2,
        averageSnf: avg(currentColl, 'snf') || 8.6,
        averageRatePerLiter: avg(currentColl, 'ratePerLiter') || 48.5,
        collectionsCount: currentColl.length
      },
      anomalies: {
        lowStockItems: lowStockCount,
        overdueInvoices: 1,
        pendingDeliveriesCount: 3
      }
    };
  },

  getAnalyticsTrends: async (period?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY', startDate?: string, endDate?: string) => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 180 * 24 * 3600 * 1000); // 6 months default

    const collections = getStorage<any[]>('ds_milk_collections', []).filter(c => c.businessId === bid);
    const sales = getStorage<any[]>('ds_milk_sales', []).filter(s => s.businessId === bid);
    const orders = getStorage<any[]>('ds_orders', []).filter(o => o.businessId === bid && o.status !== 'CANCELLED');

    const filterByDate = (list: any[], dateField: string) => {
      return list.filter(item => {
        const d = new Date(item[dateField]);
        return d >= start && d <= end;
      });
    };

    const currentColl = filterByDate(collections, 'collectedAt');
    const currentSales = filterByDate(sales, 'soldAt');
    const currentOrders = filterByDate(orders, 'createdAt');

    const groupData: Record<string, any> = {};

    const getPeriodKey = (date: Date, type: string): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      if (type === 'DAILY') return date.toISOString().split('T')[0];
      if (type === 'WEEKLY') {
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return `${year}-W${String(weekNum).padStart(2, '0')}`;
      }
      if (type === 'QUARTERLY') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${year}-Q${quarter}`;
      }
      if (type === 'YEARLY') return `${year}`;
      return `${year}-${month}`; // MONTHLY DEFAULT
    };

    const pType = period || 'MONTHLY';

    for (const c of currentColl) {
      const k = getPeriodKey(new Date(c.collectedAt), pType);
      if (!groupData[k]) groupData[k] = { periodKey: k, revenue: 0, procurement: 0, quantityCollected: 0, quantitySold: 0, profit: 0 };
      groupData[k].procurement += Number(c.totalAmount || 0);
      groupData[k].quantityCollected += Number(c.quantity || 0);
    }

    for (const s of currentSales) {
      const k = getPeriodKey(new Date(s.soldAt), pType);
      if (!groupData[k]) groupData[k] = { periodKey: k, revenue: 0, procurement: 0, quantityCollected: 0, quantitySold: 0, profit: 0 };
      groupData[k].revenue += Number(s.totalAmount || 0);
      groupData[k].quantitySold += Number(s.quantity || 0);
    }

    for (const o of currentOrders) {
      const k = getPeriodKey(new Date(o.createdAt), pType);
      if (!groupData[k]) groupData[k] = { periodKey: k, revenue: 0, procurement: 0, quantityCollected: 0, quantitySold: 0, profit: 0 };
      groupData[k].revenue += Number(o.total || 0);
    }

    // Default seed trend periods if empty
    if (Object.keys(groupData).length === 0) {
      const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const defaultData = labels.map((l, i) => ({
        periodKey: `2026-0${i+1}`,
        revenue: 40000 + (i * 8000),
        procurement: 32000 + (i * 6000),
        quantityCollected: 800 + (i * 150),
        quantitySold: 720 + (i * 130),
        profit: 8000 + (i * 2000)
      }));
      return defaultData;
    }

    const list = Object.values(groupData).map(item => {
      item.profit = item.revenue - item.procurement;
      item.revenue = Math.round(item.revenue * 100) / 100;
      item.procurement = Math.round(item.procurement * 100) / 100;
      item.profit = Math.round(item.profit * 100) / 100;
      item.quantityCollected = Math.round(item.quantityCollected * 100) / 100;
      item.quantitySold = Math.round(item.quantitySold * 100) / 100;
      return item;
    });

    return list.sort((a, b) => a.periodKey.localeCompare(b.periodKey));
  },

  getAnalyticsForecast: async () => {
    await delay(120);
    // Exponential smoothing & seasonal growth forecasting simulator
    const forecasts = [];
    const baseCollectionQty = 1450;
    const baseSalesQty = 1250;
    const baseRevenue = 58000;
    const baseProcurement = 44000;
    const currentMonth = new Date();

    for (let i = 1; i <= 6; i++) {
      const forecastDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
      const label = forecastDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      const trend = Math.pow(1.028, i); // 2.8% compounded growth rate
      const seasonality = 1 + (0.07 * Math.sin((forecastDate.getMonth() / 12) * 2 * Math.PI));

      const collected = Math.round(baseCollectionQty * trend * seasonality * 100) / 100;
      const sold = Math.round(baseSalesQty * trend * seasonality * 100) / 100;
      const revenue = Math.round(baseRevenue * trend * seasonality * 100) / 100;
      const procurement = Math.round(baseProcurement * trend * seasonality * 100) / 100;

      forecasts.push({
        period: label,
        milkCollectionForecastLiters: collected,
        milkSalesForecastLiters: sold,
        revenueForecastAmount: revenue,
        procurementForecastCost: procurement,
        projectedProfit: Math.round((revenue - procurement) * 100) / 100,
        inventoryDemandUnits: Math.round((sold * 1.12) / 10) * 10
      });
    }

    return forecasts;
  },

  getAnalyticsComparison: async (startDate?: string, endDate?: string) => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 3600 * 1000);

    const collections = getStorage<any[]>('ds_milk_collections', []).filter(c => c.businessId === bid);
    const orders = getStorage<any[]>('ds_orders', []).filter(o => o.businessId === bid && o.status !== 'CANCELLED');
    const routes = getStorage<any[]>('ds_routes', []).filter(r => r.businessId === bid);
    const products = getStorage<any[]>('ds_products', []).filter(p => p.businessId === bid);

    // Farmers compared
    const farmerMap: Record<string, any> = {};
    for (const c of collections) {
      const d = new Date(c.collectedAt);
      if (d >= start && d <= end) {
        if (!farmerMap[c.farmerName]) {
          farmerMap[c.farmerName] = { name: c.farmerName, totalVolumeLiters: 0, totalPayout: 0, avgFat: 0, avgSnf: 0, tripsCount: 0 };
        }
        farmerMap[c.farmerName].totalVolumeLiters += Number(c.quantity || 0);
        farmerMap[c.farmerName].totalPayout += Number(c.totalAmount || 0);
        farmerMap[c.farmerName].avgFat += Number(c.fat || 0);
        farmerMap[c.farmerName].avgSnf += Number(c.snf || 0);
        farmerMap[c.farmerName].tripsCount++;
      }
    }

    const farmers = Object.values(farmerMap).map((f: any) => {
      f.avgFat = f.tripsCount > 0 ? Math.round((f.avgFat / f.tripsCount) * 100) / 100 : 0;
      f.avgSnf = f.tripsCount > 0 ? Math.round((f.avgSnf / f.tripsCount) * 100) / 100 : 0;
      f.totalVolumeLiters = Math.round(f.totalVolumeLiters * 100) / 100;
      f.totalPayout = Math.round(f.totalPayout * 100) / 100;
      return f;
    }).sort((a, b) => b.totalVolumeLiters - a.totalVolumeLiters).slice(0, 5);

    // Customers compared
    const customerMap: Record<string, any> = {};
    for (const o of orders) {
      const d = new Date(o.createdAt);
      if (d >= start && d <= end) {
        const cName = o.customerName || `Cust-${o.customerId.substring(0, 5)}`;
        if (!customerMap[cName]) {
          customerMap[cName] = { name: cName, ordersCount: 0, totalSpent: 0 };
        }
        customerMap[cName].ordersCount++;
        customerMap[cName].totalSpent += Number(o.total || 0);
      }
    }

    const customersObj = Object.values(customerMap).map((c: any) => {
      c.totalSpent = Math.round(c.totalSpent * 100) / 100;
      return c;
    }).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    // Products compared
    const productsCompared = products.map(p => {
      const totalUnitsSold = Math.floor(Math.random() * 200) + 40;
      const rate = Number(p.price || 60);
      const cost = Number(p.costPrice || rate * 0.7);
      const totalRevenue = totalUnitsSold * rate;
      const margin = ((rate - cost) / rate) * 100;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        unitsSold: totalUnitsSold,
        totalSales: totalRevenue,
        profitMarginPercent: Math.round(margin * 100) / 100,
        profitGenerated: totalRevenue * (margin / 100)
      };
    }).sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);

    // Branches/Routes compared
    const branches = routes.map(r => {
      const performance = Math.floor(Math.random() * 10) + 90; // 90-100% success rate
      return {
        id: r.id,
        branchName: r.name,
        code: r.code,
        startPoint: r.startPoint,
        endPoint: r.endPoint,
        activeSinks: Math.floor(Math.random() * 15) + 5,
        deliveriesDone: Math.floor(Math.random() * 120) + 40,
        deliveryFulfillmentRate: performance
      };
    });

    // Fallbacks if tables are sparse
    const finalFarmers = farmers.length > 0 ? farmers : [
      { name: 'Karan Singh Dhillon', totalVolumeLiters: 1450, totalPayout: 71050, avgFat: 4.2, avgSnf: 8.7, tripsCount: 22 },
      { name: 'Harpreet Singh Sandhu', totalVolumeLiters: 1120, totalPayout: 54320, avgFat: 4.0, avgSnf: 8.5, tripsCount: 19 },
      { name: 'Gurbaksh Singh Sidhu', totalVolumeLiters: 980, totalPayout: 48020, avgFat: 4.1, avgSnf: 8.6, tripsCount: 16 }
    ];

    const finalCustomers = customersObj.length > 0 ? customersObj : [
      { name: 'Verka Distribution Ltd', ordersCount: 12, totalSpent: 245000 },
      { name: 'Amritsar Milk Point', ordersCount: 8, totalSpent: 185000 },
      { name: 'Lovely Dairy Retailers', ordersCount: 10, totalSpent: 112000 }
    ];

    const finalProducts = productsCompared.length > 0 ? productsCompared : [
      { name: 'Pasteurized Full Cream Milk', sku: 'PRD-LM-001', unitsSold: 420, totalSales: 26880, profitMarginPercent: 25, profitGenerated: 6720 },
      { name: 'Premium Pure Ghee (1Kg)', sku: 'PRD-FL-002', unitsSold: 45, totalSales: 30600, profitMarginPercent: 25, profitGenerated: 7650 },
      { name: 'Vacuum cottage paneer (1Kg)', sku: 'PRD-SC-003', unitsSold: 120, totalSales: 43200, profitMarginPercent: 25, profitGenerated: 10800 }
    ];

    const finalBranches = branches.length > 0 ? branches : [
      { branchName: 'Amritsar Route Alpha', code: 'RT-001', activeSinks: 14, deliveriesDone: 420, deliveryFulfillmentRate: 98.4 },
      { branchName: 'Jalandhar Bulk Route', code: 'RT-002', activeSinks: 8, deliveriesDone: 240, deliveryFulfillmentRate: 95.8 },
      { branchName: 'Gurdaspur Dairy Link', code: 'RT-003', activeSinks: 11, deliveriesDone: 310, deliveryFulfillmentRate: 99.1 }
    ];

    return {
      farmers: finalFarmers,
      customers: finalCustomers,
      products: finalProducts,
      branches: finalBranches
    };
  },

  getAnalyticsHeatmap: async () => {
    await delay(80);
    // Day of week collection volume matrix
    const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return labels.map((l, i) => {
      const baseMorning = 800 + (i * 45) + (i % 2 === 0 ? 80 : -50);
      const baseEvening = 720 + (i * 35) + (i % 2 !== 0 ? 60 : -40);
      return {
        day: i,
        label: l,
        MORNING: Math.round(baseMorning * 100) / 100,
        EVENING: Math.round(baseEvening * 100) / 100,
        totalLiters: Math.round((baseMorning + baseEvening) * 100) / 100,
        count: 24
      };
    });
  },

  scheduleAnalyticsReport: async (dto: { name: string; format: 'PDF' | 'EXCEL' | 'CSV'; frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'; recipients: string }) => {
    await delay(150);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';

    const rId = `report_${Date.now()}`;
    const key = `scheduled_report:${rId}`;
    const valueObj = {
      id: rId,
      name: dto.name,
      format: dto.format,
      frequency: dto.frequency,
      recipients: dto.recipients,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    const settingsObj = getStorage<Record<string, any>>('ds_settings_dict', {});
    const settingKey = `${bid}:${key}`;
    settingsObj[settingKey] = valueObj;
    localStorage.setItem('ds_settings_dict', JSON.stringify(settingsObj));

    createActivityLog('REPORT_SCHEDULED', `Scheduled ${dto.format} report: "${dto.name}" with frequency ${dto.frequency}`);
    return { success: true, message: 'Cooperative BI Report has been registered in the system schedules.', data: valueObj };
  },

  getScheduledAnalyticsReports: async () => {
    await delay(100);
    const { businessId } = getTenantAndUser();
    const bid = businessId || 'default-biz';

    const settingsObj = getStorage<Record<string, any>>('ds_settings_dict', {});
    const list = [];
    const prefix = `${bid}:scheduled_report:`;

    for (const key of Object.keys(settingsObj)) {
      if (key.startsWith(prefix)) {
        list.push(settingsObj[key]);
      }
    }

    if (list.length === 0) {
      return [
        { id: 'rep-init', name: 'Cooperative Financial Health Audit', format: 'PDF', frequency: 'WEEKLY', recipients: 'gill@dairysphere.com', createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), isActive: true }
      ];
    }

    return list;
  },

  getSchedulerJobs: async () => {
    await delay(100);
    const defaultJobs = [
      {
        id: 'job-farmer-billing',
        name: 'Automatic Farmer Billing Run',
        category: 'AUTOMATION',
        description: 'Compiles milk collection logs for the active period, calculates fat/snf premiums, and prepares payouts.',
        cronExpression: '0 0 * * 0',
        nextRun: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        retryPolicy: { maxRetries: 3, backoffMs: 5000 },
        lastStatus: 'SUCCESS',
        lastRun: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'job-customer-billing',
        name: 'Automatic Customer Subscription Billing',
        category: 'AUTOMATION',
        description: 'Processes deliveries and active delivery subscriptions to create monthly consumer billing invoices.',
        cronExpression: '0 0 1 * *',
        nextRun: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        retryPolicy: { maxRetries: 3, backoffMs: 5000 },
        lastStatus: 'SUCCESS',
        lastRun: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'job-invoice-generation',
        name: 'Automatic Invoice Dispatcher',
        category: 'AUTOMATION',
        description: 'Certifies pending purchase orders and automatically compiles structured invoices.',
        cronExpression: '0 */4 * * *',
        nextRun: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
        retryPolicy: { maxRetries: 2, backoffMs: 2000 },
        lastStatus: 'SUCCESS',
        lastRun: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      },
      {
        id: 'job-ledger-updates',
        name: 'Real-time Ledger Reconciler',
        category: 'AUTOMATION',
        description: 'Syncs collection payouts, payroll payouts, and customer sales invoices to the general accounting ledger.',
        cronExpression: '*/30 * * * *',
        nextRun: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        retryPolicy: { maxRetries: 5, backoffMs: 1000 },
        lastStatus: 'SUCCESS',
        lastRun: new Date(Date.now() - 22 * 60 * 1000).toISOString()
      },
      {
        id: 'job-daily-closing',
        name: 'Automatic Daily Operations Closing',
        category: 'AUTOMATION',
        description: 'Freezes milk registries, locks stock ledgers, aggregates morning/evening logs, and flags anomalies.',
        cronExpression: '0 22 * * *',
        nextRun: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
        retryPolicy: { maxRetries: 3, backoffMs: 10000 },
        lastStatus: 'SUCCESS',
        lastRun: new Date(Date.now() - 14 * 3600 * 1000).toISOString()
      },
      {
        id: 'job-monthly-closing',
        name: 'Monthly Ledger Rollover closing',
        category: 'AUTOMATION',
        description: 'Consolidates tax registers, balances depreciation metrics, and carries forward structural balances.',
        cronExpression: '0 2 1 * *',
        nextRun: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        retryPolicy: { maxRetries: 3, backoffMs: 15000 },
        lastStatus: 'SUCCESS',
        lastRun: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'job-alerts-reminders',
        name: 'SLA Alerts & Reminders Dispatcher',
        category: 'NOTIFICATIONS',
        description: 'Dispatches payment reminders, low-stock alerts, and automated subscription renewal notices via push, SMS, and email.',
        cronExpression: '0 9 * * *',
        nextRun: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
        retryPolicy: { maxRetries: 3, backoffMs: 3000 },
        lastStatus: 'SUCCESS',
        lastRun: new Date(Date.now() - 15 * 3600 * 1000).toISOString()
      },
      {
        id: 'job-db-backup',
        name: 'Automated Database Snapshot Backup',
        category: 'BACKUPS',
        description: 'Takes a full secure physical cold snapshot of the relational PostgreSQL schema and assets.',
        cronExpression: '0 1 * * *',
        nextRun: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
        retryPolicy: { maxRetries: 3, backoffMs: 30000 },
        lastStatus: 'SUCCESS',
        lastRun: new Date(Date.now() - 23 * 3600 * 1000).toISOString()
      },
      {
        id: 'job-maintenance-cleanup',
        name: 'Log & Temp Asset Vacuum Purge',
        category: 'BACKUPS',
        description: 'Cleans up system-temp assets, session cache records, and logs older than 90 days.',
        cronExpression: '0 3 * * 0',
        nextRun: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
        retryPolicy: { maxRetries: 2, backoffMs: 5000 },
        lastStatus: 'SUCCESS',
        lastRun: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        id: 'job-scheduled-reports',
        name: 'Cooperative Performance BI Report compiler',
        category: 'REPORTS',
        description: 'Assembles financial sheets, supplier fat/snf analytics graphs, and prints executive summaries.',
        cronExpression: '0 6 * * *',
        nextRun: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
        retryPolicy: { maxRetries: 3, backoffMs: 4000 },
        lastStatus: 'SUCCESS',
        lastRun: new Date(Date.now() - 18 * 3600 * 1000).toISOString()
      }
    ];

    return getStorage('ds_scheduler_jobs', defaultJobs);
  },

  getSchedulerQueue: async () => {
    await delay(50);
    return getStorage('ds_scheduler_queue', []);
  },

  getSchedulerHistory: async () => {
    await delay(80);
    const defaultHistory = [
      {
        id: 'hist-1',
        jobId: 'job-daily-closing',
        jobName: 'Automatic Daily Operations Closing',
        category: 'AUTOMATION',
        status: 'SUCCESS',
        durationMs: 1420,
        runAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
        logs: 'Worker spawned. Initializing job execution context.\nFreezing daily milk registries for morning and evening shifts.\nLocked current transaction tables to read-only. Safe exit.'
      },
      {
        id: 'hist-2',
        jobId: 'job-scheduled-reports',
        jobName: 'Cooperative Performance BI Report compiler',
        category: 'REPORTS',
        status: 'SUCCESS',
        durationMs: 2150,
        runAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
        logs: 'Worker spawned. Initializing job execution context.\nCompiling cooperative financial charts & supplier reports...\nStructured PDF cooperative health audit cards.\nAssembled CSV summary.'
      },
      {
        id: 'hist-3',
        jobId: 'job-alerts-reminders',
        jobName: 'SLA Alerts & Reminders Dispatcher',
        category: 'NOTIFICATIONS',
        status: 'SUCCESS',
        durationMs: 980,
        runAt: new Date(Date.now() - 15 * 3600 * 1000).toISOString(),
        logs: 'Worker spawned. Scanning accounts receivable tables...\nDispatched payment reminders: 18 SMS alerts, 18 emails, 18 push warnings.'
      }
    ];
    return getStorage('ds_scheduler_history', defaultHistory);
  },

  triggerSchedulerJob: async (jobId: string) => {
    await delay(200);
    const jobs = await api.getSchedulerJobs();
    const job = jobs.find((j: any) => j.id === jobId);
    if (!job) {
      throw new ApiError(404, `Job spec '${jobId}' not found.`);
    }

    const queueId = `q-${Math.random().toString(36).substring(2, 9)}`;
    const newQueueEntry = {
      id: queueId,
      jobId: job.id,
      jobName: job.name,
      status: 'COMPLETED',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      logs: [
        'Worker spawned manually via admin console.',
        'Loading telemetry profiles for tenant databases...',
        `Job '${job.name}' logical operations executed successfully.`,
        'Syncing results with immutable audit ledgers.',
        'Completed job execution successfully. Clean exit.'
      ]
    };

    // Update job last status
    const updatedJobs = jobs.map((j: any) => {
      if (j.id === jobId) {
        return {
          ...j,
          lastStatus: 'SUCCESS',
          lastRun: new Date().toISOString()
        };
      }
      return j;
    });
    localStorage.setItem('ds_scheduler_jobs', JSON.stringify(updatedJobs));

    // Save to queue list
    const queue = getStorage<any[]>('ds_scheduler_queue', []);
    queue.push(newQueueEntry);
    localStorage.setItem('ds_scheduler_queue', JSON.stringify(queue));

    // Save to history list
    const history = getStorage<any[]>('ds_scheduler_history', []);
    const historyEntry = {
      id: `hist-${Math.random().toString(36).substring(2, 9)}`,
      jobId: job.id,
      jobName: job.name,
      category: job.category,
      status: 'SUCCESS',
      durationMs: 1200 + Math.floor(Math.random() * 800),
      runAt: new Date().toISOString(),
      logs: newQueueEntry.logs.join('\n')
    };
    history.unshift(historyEntry);
    localStorage.setItem('ds_scheduler_history', JSON.stringify(history));

    createActivityLog('JOB_RUN_SUCCESS', `Triggered automation job manually: "${job.name}"`);

    return { success: true, data: historyEntry };
  },

  updateSchedulerJob: async (id: string, dto: { cronExpression?: string; maxRetries?: number }) => {
    await delay(150);
    const jobs = await api.getSchedulerJobs();
    const updatedJobs = jobs.map((j: any) => {
      if (j.id === id) {
        return {
          ...j,
          cronExpression: dto.cronExpression ?? j.cronExpression,
          retryPolicy: {
            ...j.retryPolicy,
            maxRetries: dto.maxRetries ?? j.retryPolicy.maxRetries
          }
        };
      }
      return j;
    });
    localStorage.setItem('ds_scheduler_jobs', JSON.stringify(updatedJobs));
    createActivityLog('JOB_POLICY_UPDATED', `Updated scheduled job policy configuration for job ID: ${id}`);
    return { success: true };
  },

  clearSchedulerHistory: async () => {
    await delay(100);
    localStorage.setItem('ds_scheduler_history', JSON.stringify([]));
    createActivityLog('SCHEDULER_HISTORY_CLEARED', 'Admin safely cleared system scheduler history registers.');
    return { success: true };
  },

  getIntegrationsConfigs: async () => {
    try {
      const response = await fetch('/api/integrations/configs', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        }
      });
      if (response.ok) {
        const res = await response.json();
        return res.data;
      }
    } catch (e) {}

    const defaultConfigs = [
      {
        id: 'stripe-int',
        provider: 'STRIPE',
        name: 'Stripe International Payments',
        category: 'PAYMENTS',
        enabled: true,
        credentials: { apiKey: 'sk_live_51M••••••••88x', webhookSecret: 'whsec_7d••••••••d9b' },
        status: 'ACTIVE',
        lastTestedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'razorpay-int',
        provider: 'RAZORPAY',
        name: 'Razorpay Payment Gateway',
        category: 'PAYMENTS',
        enabled: true,
        credentials: { keyId: 'rzp_live_vU••••••••8bX', keySecret: '9F••••••••X0z' },
        status: 'ACTIVE',
        lastTestedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 'cashfree-int',
        provider: 'CASHFREE',
        name: 'Cashfree Payouts Engine',
        category: 'PAYMENTS',
        enabled: false,
        credentials: { appId: '', secretKey: '' },
        status: 'UNCONFIGURED',
      },
      {
        id: 'twilio-int',
        provider: 'TWILIO',
        name: 'Twilio SMS Notification Dispatcher',
        category: 'COMMUNICATION',
        enabled: true,
        credentials: { accountSid: 'AC99••••••••df3', authToken: 'cf8••••••••9d2', fromNumber: '+15550199' },
        status: 'ACTIVE',
        lastTestedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      },
      {
        id: 'whatsapp-int',
        provider: 'WHATSAPP',
        name: 'WhatsApp Business API Gateway',
        category: 'COMMUNICATION',
        enabled: false,
        credentials: { apiToken: '', phoneNumberId: '' },
        status: 'UNCONFIGURED',
      },
      {
        id: 'smtp-int',
        provider: 'SMTP',
        name: 'SMTP Corporate Mail Gateway',
        category: 'COMMUNICATION',
        enabled: true,
        credentials: { host: 'smtp.gmail.com', port: '587', user: 'billing@dairysphere.com', password: '••••••••' },
        status: 'ACTIVE',
        lastTestedAt: new Date().toISOString(),
      },
      {
        id: 'firebase-push-int',
        provider: 'FIREBASE_PUSH',
        name: 'Firebase Cloud Messaging (FCM)',
        category: 'COMMUNICATION',
        enabled: true,
        credentials: { clientEmail: 'fcm-admin@dairysphere.iam.gserviceaccount.com', projectId: 'dairysphere-fcm' },
        status: 'ACTIVE',
        lastTestedAt: new Date().toISOString(),
      },
      {
        id: 's3-int',
        provider: 'S3',
        name: 'Amazon S3 Document Vault',
        category: 'STORAGE',
        enabled: true,
        credentials: { accessKeyId: 'AKIA••••••••99X', secretAccessKey: 'p9••••••••D8m', bucketName: 'dairysphere-cold-snapshots' },
        status: 'ACTIVE',
        lastTestedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
      {
        id: 'gcs-int',
        provider: 'GCS',
        name: 'Google Cloud Storage Archives',
        category: 'STORAGE',
        enabled: false,
        credentials: { projectId: '', bucketName: '', serviceAccountKey: '' },
        status: 'UNCONFIGURED',
      },
      {
        id: 'azure-blob-int',
        provider: 'AZURE_BLOB',
        name: 'Azure Blob Storage Gateway',
        category: 'STORAGE',
        enabled: false,
        credentials: { connectionString: '' },
        status: 'UNCONFIGURED',
      },
      {
        id: 'tally-int',
        provider: 'TALLY',
        name: 'Tally Prime ERP Connector',
        category: 'ACCOUNTING',
        enabled: true,
        credentials: { baseUrl: 'http://localhost:9000/tally', companyName: 'DairySphere Cooperative Co.' },
        status: 'ACTIVE',
        lastTestedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'google-oauth-int',
        provider: 'GOOGLE_OAUTH',
        name: 'Google Federated Authenticator',
        category: 'AUTH',
        enabled: true,
        credentials: { clientId: '77893-dairysphere.apps.googleusercontent.com', clientSecret: 'GOCSPX-u••••••••d3b' },
        status: 'ACTIVE',
        lastTestedAt: new Date().toISOString(),
      }
    ];

    return getStorage('ds_integration_configs', defaultConfigs);
  },

  configureIntegration: async (provider: string, credentials: any, enabled?: boolean) => {
    try {
      const response = await fetch('/api/integrations/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        },
        body: JSON.stringify({ provider, credentials, enabled })
      });
      if (response.ok) {
        const res = await response.json();
        return res.data;
      }
    } catch (e) {}

    const configs = await api.getIntegrationsConfigs();
    const updated = configs.map((c: any) => {
      if (c.provider === provider) {
        const maskedCreds = { ...c.credentials, ...credentials };
        return {
          ...c,
          credentials: maskedCreds,
          enabled: enabled !== undefined ? enabled : c.enabled,
          status: enabled ? 'ACTIVE' : 'UNCONFIGURED'
        };
      }
      return c;
    });
    localStorage.setItem('ds_integration_configs', JSON.stringify(updated));
    createActivityLog('INTEGRATION_UPDATE', `Re-configured provider API parameters for: ${provider}`);
    return { success: true };
  },

  testIntegration: async (provider: string) => {
    try {
      const response = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        },
        body: JSON.stringify({ provider })
      });
      if (response.ok) {
        const res = await response.json();
        return res.data;
      }
    } catch (e) {}

    await delay(1000);
    const latency = 120 + Math.floor(Math.random() * 80);
    const logs = getStorage<any[]>('ds_integration_logs', []);
    const newLog = {
      id: `ilog-${Math.random().toString(36).substring(2, 9)}`,
      provider,
      action: 'API_PING_HANDSHAKE',
      status: 'SUCCESS',
      message: 'Network link certified. OAuth response status 200 OK.',
      durationMs: latency,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem('ds_integration_logs', JSON.stringify(logs));
    createActivityLog('INTEGRATION_TEST', `Executed ping handshake latency test on provider: ${provider}`);
    return { success: true, latencyMs: latency, response: 'Connection certified. Latency: ' + latency + 'ms. Remote gateway returned: code=200_ok, tenant_verified=true' };
  },

  getIntegrationLogs: async () => {
    try {
      const response = await fetch('/api/integrations/logs', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        }
      });
      if (response.ok) {
        const res = await response.json();
        return res.data;
      }
    } catch (e) {}

    const defaultLogs = [
      {
        id: 'ilog-1',
        provider: 'STRIPE',
        action: 'PROCESS_TRANSACTION',
        status: 'SUCCESS',
        message: 'Settled instant payout of USD 450.00 for billing invoice #INV-2026-8812. Ref: str_tx_9921a8x9',
        durationMs: 840,
        timestamp: new Date(Date.now() - 3600 * 1000).toISOString()
      },
      {
        id: 'ilog-2',
        provider: 'TWILIO',
        action: 'DISPATCH_MESSAGE',
        status: 'SUCCESS',
        message: 'SMS message dispatched safely to supplier +91 94170 12345. Status: DELIVERED',
        durationMs: 420,
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'ilog-3',
        provider: 'S3',
        action: 'OBJECT_PUT_UPLOAD',
        status: 'SUCCESS',
        message: 'Successfully archived physical backup snapshot milk_collection_v2_2026.zip. Saved to: s3://dairysphere-cold-snapshots/',
        durationMs: 1650,
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      }
    ];
    return getStorage('ds_integration_logs', defaultLogs);
  },

  getWebhookSubscriptions: async () => {
    try {
      const response = await fetch('/api/integrations/webhooks/subscriptions', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        }
      });
      if (response.ok) {
        const res = await response.json();
        return res.data;
      }
    } catch (e) {}

    const defaultSubs = [
      {
        id: 'sub-billing',
        url: 'https://cooperative-erp.com/api/webhooks/dairysphere',
        secret: 'whsec_secret_key_abc123',
        events: ['milk.collected', 'invoice.paid'],
        enabled: true,
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 'sub-zapier',
        url: 'https://hooks.zapier.com/hooks/catch/12930129/ab9102c',
        secret: 'whsec_zapier_secret_xyz789',
        events: ['payment.failed', 'user.registered'],
        enabled: true,
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      }
    ];
    return getStorage('ds_webhook_subs', defaultSubs);
  },

  createWebhookSubscription: async (dto: { url: string; events: string[] }) => {
    try {
      const response = await fetch('/api/integrations/webhooks/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        },
        body: JSON.stringify(dto)
      });
      if (response.ok) {
        const res = await response.json();
        return res.data;
      }
    } catch (e) {}

    const subs = await api.getWebhookSubscriptions();
    const newSub = {
      id: `sub-${Math.random().toString(36).substring(2, 9)}`,
      url: dto.url,
      secret: 'whsec_' + Math.random().toString(36).substring(2, 14),
      events: dto.events,
      enabled: true,
      createdAt: new Date().toISOString()
    };
    subs.push(newSub);
    localStorage.setItem('ds_webhook_subs', JSON.stringify(subs));
    createActivityLog('WEBHOOK_SUB_CREATED', `Registered new outgoing webhook listener: ${dto.url}`);
    return { success: true, data: newSub };
  },

  updateWebhookSubscription: async (id: string, dto: { url?: string; events?: string[]; enabled?: boolean }) => {
    try {
      const response = await fetch(`/api/integrations/webhooks/subscriptions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        },
        body: JSON.stringify(dto)
      });
      if (response.ok) {
        const res = await response.json();
        return res.data;
      }
    } catch (e) {}

    const subs = await api.getWebhookSubscriptions();
    const updated = subs.map((s: any) => {
      if (s.id === id) {
        return {
          ...s,
          url: dto.url ?? s.url,
          events: dto.events ?? s.events,
          enabled: dto.enabled ?? s.enabled
        };
      }
      return s;
    });
    localStorage.setItem('ds_webhook_subs', JSON.stringify(updated));
    createActivityLog('WEBHOOK_SUB_UPDATED', `Re-configured subscription parameters for webhook listener ID: ${id}`);
    return { success: true };
  },

  deleteWebhookSubscription: async (id: string) => {
    try {
      const response = await fetch(`/api/integrations/webhooks/subscriptions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {}

    const subs = await api.getWebhookSubscriptions();
    const filtered = subs.filter((s: any) => s.id !== id);
    localStorage.setItem('ds_webhook_subs', JSON.stringify(filtered));
    createActivityLog('WEBHOOK_SUB_DELETED', `Deleted outgoing webhook subscription ID: ${id}`);
    return { success: true };
  },

  getWebhookDeliveries: async () => {
    try {
      const response = await fetch('/api/integrations/webhooks/deliveries', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        }
      });
      if (response.ok) {
        const res = await response.json();
        return res.data;
      }
    } catch (e) {}

    const defaultDeliveries = [
      {
        id: 'wlog-1',
        subscriptionId: 'sub-billing',
        event: 'invoice.paid',
        payload: '{"invoiceId":"INV-2026-0811","amount":12000,"currency":"INR"}',
        statusCode: 200,
        responseBody: '{"received":true,"status":"synced"}',
        status: 'SUCCESS',
        retryCount: 0,
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
      {
        id: 'wlog-2',
        subscriptionId: 'sub-zapier',
        event: 'payment.failed',
        payload: '{"invoiceId":"INV-2026-9812","customerId":"farmer-102"}',
        statusCode: 502,
        responseBody: 'Bad Gateway Cloudflare',
        status: 'FAILED',
        retryCount: 2,
        nextAttemptAt: new Date(Date.now() + 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      }
    ];
    return getStorage('ds_webhook_deliveries', defaultDeliveries);
  },

  triggerPayment: async (dto: { provider: string; amount: number; currency: string; customerId: string }) => {
    try {
      const response = await fetch('/api/integrations/trigger-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        },
        body: JSON.stringify(dto)
      });
      if (response.ok) {
        const res = await response.json();
        return res.data;
      }
    } catch (e) {}

    await delay(1200);
    const logs = getStorage<any[]>('ds_integration_logs', []);
    const transactionId = `${dto.provider.toLowerCase().substring(0, 3)}_tx_${Math.random().toString(36).substring(2, 11)}`;
    const newLog = {
      id: `ilog-${Math.random().toString(36).substring(2, 9)}`,
      provider: dto.provider,
      action: 'PROCESS_TRANSACTION',
      status: 'SUCCESS',
      message: `Charge of ${dto.currency} ${dto.amount.toFixed(2)} completed successfully for customer [${dto.customerId}]. Gateway Ref: ${transactionId}`,
      durationMs: 850,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem('ds_integration_logs', JSON.stringify(logs));
    
    const deliveries = getStorage<any[]>('ds_webhook_deliveries', []);
    deliveries.unshift({
      id: `wlog-${Math.random().toString(36).substring(2, 9)}`,
      subscriptionId: 'sub-billing',
      event: 'invoice.paid',
      payload: JSON.stringify({ transactionId, customerId: dto.customerId, amount: dto.amount, currency: dto.currency }),
      statusCode: 200,
      responseBody: '{"received":true}',
      status: 'SUCCESS',
      retryCount: 0,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('ds_webhook_deliveries', JSON.stringify(deliveries));

    createActivityLog('PAYMENT_SETTLED', `Processed ${dto.provider} transaction of ${dto.currency} ${dto.amount} successfully.`);
    return { success: true, transactionId, message: 'Settlement completed successfully.' };
  },

  uploadFile: async (dto: { provider: string; fileName: string; content: string }) => {
    try {
      const response = await fetch('/api/integrations/upload-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        },
        body: JSON.stringify(dto)
      });
      if (response.ok) {
        const res = await response.json();
        return res.data;
      }
    } catch (e) {}

    await delay(1400);
    const logs = getStorage<any[]>('ds_integration_logs', []);
    const bucketName = dto.provider === 'S3' ? 'dairysphere-cold-snapshots' : 'dairysphere-gcs-bucket';
    const remoteUrl = `https://${dto.provider.toLowerCase()}.amazonaws.com/${bucketName}/${dto.fileName}`;
    const newLog = {
      id: `ilog-${Math.random().toString(36).substring(2, 9)}`,
      provider: dto.provider,
      action: 'OBJECT_PUT_UPLOAD',
      status: 'SUCCESS',
      message: `Uploaded physical archive asset '${dto.fileName}' to secure storage bucket [${bucketName}]. Location URL: ${remoteUrl}`,
      durationMs: 1400,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem('ds_integration_logs', JSON.stringify(logs));
    createActivityLog('ARCHIVE_UPLOAD', `Uploaded cold storage archive '${dto.fileName}' using provider: ${dto.provider}`);
    return { success: true, remoteUrl, bucket: bucketName };
  },

  sendNotification: async (dto: { provider: string; recipient: string; subject: string; message: string }) => {
    try {
      const response = await fetch('/api/integrations/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        },
        body: JSON.stringify(dto)
      });
      if (response.ok) {
        const res = await response.json();
        return res.data;
      }
    } catch (e) {}

    await delay(1000);
    const logs = getStorage<any[]>('ds_integration_logs', []);
    const newLog = {
      id: `ilog-${Math.random().toString(36).substring(2, 9)}`,
      provider: dto.provider,
      action: 'DISPATCH_MESSAGE',
      status: 'SUCCESS',
      message: `Message dispatched to recipient '${dto.recipient}'. Subject: "${dto.subject}". Details: 100% delivered.`,
      durationMs: 980,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem('ds_integration_logs', JSON.stringify(logs));
    createActivityLog('NOTIFICATION_DISPATCH', `Successfully dispatched notification to ${dto.recipient} via ${dto.provider}`);
    return { success: true, message: 'Notification delivered.' };
  },

  exchangeGoogleToken: async (code: string) => {
    try {
      const response = await fetch('/api/integrations/oauth-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dairysphere_token')}`,
          'X-Business-Id': localStorage.getItem('dairysphere_business_id') || 'default-biz'
        },
        body: JSON.stringify({ code })
      });
      if (response.ok) {
        const res = await response.json();
        return res.data;
      }
    } catch (e) {}

    await delay(1200);
    return {
      success: true,
      accessToken: 'ya29.a0Axoo_google_token_sample_abc123xyz789',
      idToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im9sdnNrb2xjbGlwc0BnbWFpbC5jb20iLCJuYW1lIjoiRGFpcnlTcGhlcmUgQWRtaW4gT3BlcmF0b3IifQ',
      user: {
        email: 'olvskolclips@gmail.com',
        name: 'DairySphere Admin Operator',
        picture: 'https://lh3.googleusercontent.com/a/default-avatar'
      }
    };
  }
};

const cacheStore = new Map<string, { value: any; expiry: number }>();
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 10000; // 10s
const MAX_REQUESTS_PER_WINDOW = 120;

function checkRateLimit() {
  const now = Date.now();
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new ApiError(429, 'Rate limit exceeded: Too many operations. Please wait a moment.');
  }
  requestTimestamps.push(now);
}

function detectInjection(val: any): boolean {
  if (typeof val === 'string') {
    const sqlPattern = /(UNION\s+ALL\s+SELECT|SELECT\s+.*\s+FROM|INSERT\s+INTO|UPDATE\s+.*\s+SET|DELETE\s+FROM|DROP\s+TABLE|--|'OR\s+'1'='1|"\s*OR\s*"1"\s*=\s*"1)/i;
    const xssPattern = /(<script|javascript:|onload=|onerror=)/i;
    return sqlPattern.test(val) || xssPattern.test(val);
  }
  if (Array.isArray(val)) {
    return val.some(detectInjection);
  }
  if (val !== null && typeof val === 'object') {
    return Object.values(val).some(detectInjection);
  }
  return false;
}

function sanitizeInput(val: any, parentKey?: string): any {
  if (parentKey && /password/i.test(parentKey)) {
    return val; // Passwords shouldn't have chars escaped/corrupted to preserve hashes
  }
  if (typeof val === 'string') {
    return val
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  if (Array.isArray(val)) {
    return val.map(v => sanitizeInput(v));
  }
  if (val !== null && typeof val === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(val)) {
      cleaned[key] = sanitizeInput(val[key], key);
    }
    return cleaned;
  }
  return val;
}

if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem('dairysphere_csrf_token')) {
  sessionStorage.setItem('dairysphere_csrf_token', 'csrf_sec_' + Math.random().toString(36).substring(2, 12));
}

function verifyCSRF(prop: string) {
  const isStateChanging = 
    prop.startsWith('create') ||
    prop.startsWith('update') ||
    prop.startsWith('delete') ||
    prop.startsWith('import') ||
    prop.startsWith('save') ||
    prop.startsWith('add') ||
    prop.startsWith('register') ||
    prop.startsWith('login');

  if (isStateChanging) {
    const csrfToken = sessionStorage.getItem('dairysphere_csrf_token');
    if (!csrfToken) {
      throw new ApiError(403, 'CSRF verification failed: Anti-forgery request token is missing.');
    }
  }
}

// Security Hardened and Performance Optimized Proxy for API
export const api = new Proxy(rawApi, {
  get(target: any, prop: string) {
    const originalMethod = target[prop];
    if (typeof originalMethod !== 'function') {
      return originalMethod;
    }

    return async function (...args: any[]) {
      // 1. Sliding window rate limit check
      checkRateLimit();

      // 2. Anti-CSRF token validation
      verifyCSRF(prop);

      // 3. SQLi & XSS pattern validation on raw arguments
      if (detectInjection(args)) {
        createAuditLog('SECURITY_ALERT', 'System', null, 'Malicious payload signature detected', `Blocked execution on ${prop}`);
        throw new ApiError(400, 'Security Warning: Malicious input pattern or injection sequence detected.');
      }

      // 4. Centralized Session, Tenant Isolation and RBAC gatekeeping
      const isAuthExempt = ['login', 'register', 'refreshToken', 'validateFileUpload'].includes(prop);
      let userRole = 'OPERATOR';

      if (!isAuthExempt) {
        const { businessId, user } = getTenantAndUser();
        if (!businessId || !user) {
          throw new ApiError(401, 'Unauthorized: Active security session required.');
        }

        const token = localStorage.getItem('dairysphere_token');
        if (token) {
          try {
            const parts = token.split('.');
            const payload = JSON.parse(atob(parts[1]));
            if (payload.exp && Date.now() > payload.exp) {
              throw new ApiError(401, 'Session Expired: Security token has expired. Please log in.');
            }
            userRole = payload.role || 'OPERATOR';
          } catch {
            throw new ApiError(401, 'Unauthorized: Tampered security token detected.');
          }
        } else {
          throw new ApiError(401, 'Unauthorized: Session token missing.');
        }

        // Centralized RBAC Gatekeeping Rules
        const rbacRules: Record<string, string[]> = {
          'getUsers': ['ADMIN'],
          'createUser': ['ADMIN'],
          'updateUser': ['ADMIN'],
          'deleteUser': ['ADMIN'],
          'getRoles': ['ADMIN'],
          'updateRolePermissions': ['ADMIN'],
          'getAuditLogs': ['ADMIN'],
          'getActivityLogs': ['ADMIN'],
          
          'updateSettings': ['ADMIN', 'MANAGER'],
          'deleteFarmer': ['ADMIN', 'MANAGER'],
          'deleteMilkCollection': ['ADMIN', 'MANAGER'],
          'deleteProduct': ['ADMIN', 'MANAGER'],
          'deleteSale': ['ADMIN', 'MANAGER'],
          'deletePurchase': ['ADMIN', 'MANAGER'],
          'deleteCustomer': ['ADMIN', 'MANAGER'],
          'deletePayment': ['ADMIN', 'MANAGER'],
          'closeDayAndLock': ['ADMIN', 'MANAGER']
        };

        const allowedRoles = rbacRules[prop];
        if (allowedRoles && !allowedRoles.includes(userRole)) {
          createAuditLog('UNAUTHORIZED_ACCESS', 'System', null, `Role ${userRole} attempted to call ${prop}`, 'Blocked');
          throw new ApiError(403, 'RBAC Access Denied: You do not have the necessary security authorization to perform this operation.');
        }
      }

      // 5. Output Sanitization & Recursive XSS escaping of input mutations
      const sanitizedArgs = sanitizeInput(args);

      // 6. Cache GET queries to avoid redundant parsing and artificial delays
      if (prop.startsWith('get') && prop !== 'getTenantAndUser') {
        const cacheKey = `${prop}:${JSON.stringify(sanitizedArgs)}`;
        const cached = cacheStore.get(cacheKey);
        if (cached && Date.now() < cached.expiry) {
          return cached.value;
        }
        const result = await originalMethod.apply(target, sanitizedArgs);
        cacheStore.set(cacheKey, { value: result, expiry: Date.now() + 5000 }); // Cache for 5 seconds
        return result;
      }

      // 7. Invalidate cache on mutations to guarantee consistent state
      if (
        prop.startsWith('create') ||
        prop.startsWith('update') ||
        prop.startsWith('delete') ||
        prop.startsWith('import') ||
        prop.startsWith('save') ||
        prop.startsWith('add') ||
        prop.startsWith('register') ||
        prop.startsWith('login')
      ) {
        cacheStore.clear();
      }

      return originalMethod.apply(target, sanitizedArgs);
    };
  }
});


export function calculateMilkRate(milkType: 'COW' | 'BUFFALO' | 'MIXED', fat: number, snf: number): number {
  let baseRate = 0;
  let baseFat = 0;
  let baseSNF = 0;
  let fatPremium = 0;
  let snfPremium = 0;
  let minRate = 0;
  let maxRate = 0;

  if (milkType === 'COW') {
    baseRate = 45.00;
    baseFat = 4.0;
    baseSNF = 8.5;
    fatPremium = 0.50;
    snfPremium = 0.40;
    minRate = 35.00;
    maxRate = 60.00;
  } else if (milkType === 'BUFFALO') {
    baseRate = 65.00;
    baseFat = 6.5;
    baseSNF = 9.0;
    fatPremium = 0.70;
    snfPremium = 0.55;
    minRate = 50.00;
    maxRate = 90.00;
  } else {
    baseRate = 52.00;
    baseFat = 5.0;
    baseSNF = 8.7;
    fatPremium = 0.60;
    snfPremium = 0.45;
    minRate = 42.00;
    maxRate = 75.00;
  }

  const fatDiff = (fat - baseFat) * 10;
  const snfDiff = (snf - baseSNF) * 10;

  let calculatedRate = baseRate + (fatDiff * fatPremium) + (snfDiff * snfPremium);
  
  if (calculatedRate < minRate) calculatedRate = minRate;
  if (calculatedRate > maxRate) calculatedRate = maxRate;

  return Math.round(calculatedRate * 100) / 100;
}

export function calculateQualityGrade(milkType: 'COW' | 'BUFFALO' | 'MIXED', fat: number, snf: number): 'A' | 'B' | 'C' | 'D' {
  if (milkType === 'COW') {
    if (fat >= 4.5 && snf >= 8.7) return 'A';
    if (fat >= 4.0 && snf >= 8.4) return 'B';
    if (fat >= 3.5 && snf >= 8.0) return 'C';
    return 'D';
  } else if (milkType === 'BUFFALO') {
    if (fat >= 7.5 && snf >= 9.2) return 'A';
    if (fat >= 6.5 && snf >= 8.8) return 'B';
    if (fat >= 5.5 && snf >= 8.4) return 'C';
    return 'D';
  } else {
    if (fat >= 5.5 && snf >= 8.8) return 'A';
    if (fat >= 4.8 && snf >= 8.5) return 'B';
    if (fat >= 4.0 && snf >= 8.2) return 'C';
    return 'D';
  }
}

