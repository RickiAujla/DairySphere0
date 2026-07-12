/**
 * Mocking Browser Context for Node.js Environment
 * This allows importing and executing client-side API logic in the test runner.
 */

import crypto from 'crypto';

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
  { id: 'rp12', roleId: 'r2', permissionId: 'p1' },
  { id: 'rp13', roleId: 'r2', permissionId: 'p2' },
  { id: 'rp14', roleId: 'r2', permissionId: 'p4' },
  { id: 'rp15', roleId: 'r2', permissionId: 'p7' },
  { id: 'rp16', roleId: 'r2', permissionId: 'p8' },
  { id: 'rp17', roleId: 'r2', permissionId: 'p10' },
  { id: 'rp18', roleId: 'r2', permissionId: 'p11' },
  { id: 'rp19', roleId: 'r3', permissionId: 'p1' },
  { id: 'rp20', roleId: 'r3', permissionId: 'p7' },
  { id: 'rp21', roleId: 'r3', permissionId: 'p8' },
  { id: 'rp22', roleId: 'r3', permissionId: 'p10' },
];

class StorageMock implements Storage {
  private store: Record<string, string> = {
    'ds_permissions': JSON.stringify(DEFAULT_PERMISSIONS),
    'ds_roles': JSON.stringify(DEFAULT_ROLES),
    'ds_role_permissions': JSON.stringify(DEFAULT_ROLE_PERMISSIONS)
  };

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {
      'ds_permissions': JSON.stringify(DEFAULT_PERMISSIONS),
      'ds_roles': JSON.stringify(DEFAULT_ROLES),
      'ds_role_permissions': JSON.stringify(DEFAULT_ROLE_PERMISSIONS)
    };
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
}

// Global shims
const localStorageMock = new StorageMock();
const sessionStorageMock = new StorageMock();

Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock, writable: true });

// Define window with mock crypto
const windowMock = {
  crypto: {
    subtle: {
      async digest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer> {
        const hash = crypto.createHash(algorithm.toLowerCase().replace('-', ''));
        hash.update(Buffer.from(data));
        const buffer = hash.digest();
        // Convert node buffer to ArrayBuffer
        return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      }
    }
  }
};

Object.defineProperty(global, 'window', { value: windowMock, writable: true });

// Node 18+ has global.atob and btoa, but we define them just in case
if (typeof global.atob === 'undefined') {
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}
if (typeof global.btoa === 'undefined') {
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

// Mock fetch to simulate successful network requests when hitting the backend API proxy inside rawApi
const fetchMock = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input.toString();
  
  // Return mock responses for internal fetch inside rawApi (e.g. integrations endpoints)
  if (url.includes('/api/integrations/configure')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: JSON.parse(init?.body as string) })
    } as Response;
  }

  if (url.includes('/api/integrations/test')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { status: 'ACTIVE', latencyMs: 45 } })
    } as Response;
  }

  if (url.includes('/api/integrations/webhooks/subscriptions')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { id: 'wh-sub-mock', url: 'https://mock.com' } })
    } as Response;
  }

  // Fallback default response
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, message: 'Mock response' })
  } as Response;
};

Object.defineProperty(global, 'fetch', { value: fetchMock, writable: true });

// Seed CSRF token so state-changing operations bypass verifyCSRF
sessionStorageMock.setItem('dairysphere_csrf_token', 'csrf_sec_test_token_12345');
