/**
 * Authentication, Multi-Tenancy & RBAC Security Integration Tests
 */

import '../setup';
import { describe, it, expect, beforeAll, afterEach } from '../framework';
import { api, ApiError } from '../../frontend/src/utils/api';

describe('Security & Multi-Tenant Isolation Suite', () => {
  beforeAll(() => {
    localStorage.clear();
    sessionStorage.setItem('dairysphere_csrf_token', 'csrf_sec_test_token_12345');
  });

  afterEach(() => {
    localStorage.clear();
    // Re-seed CSRF
    sessionStorage.setItem('dairysphere_csrf_token', 'csrf_sec_test_token_12345');
  });

  it('should enforce password strength validation rules', async () => {
    // 1. Weak password (too short)
    await expect(async () => {
      await api.register({
        name: 'Coop Alpha',
        slug: 'coop-alpha',
        adminName: 'Amanpreet Singh',
        adminEmail: 'aman@coop-alpha.com',
        adminPassword: '123'
      });
    }).toThrow('Password is too weak. It must be at least 8 characters long.');

    // 2. Missing uppercase character
    await expect(async () => {
      await api.register({
        name: 'Coop Alpha',
        slug: 'coop-alpha',
        adminName: 'Amanpreet Singh',
        adminEmail: 'aman@coop-alpha.com',
        adminPassword: 'amanpreet123!'
      });
    }).toThrow('Password must contain at least one uppercase letter');
  });

  it('should register a new business tenant and successfully log in', async () => {
    const regRes = await api.register({
      name: 'Cooperative Alpha',
      slug: 'coop-alpha',
      adminName: 'Harpreet Singh',
      adminEmail: 'harpreet@coop-alpha.com',
      adminPassword: 'Password123!'
    });

    expect(regRes.business).toBeDefined();
    expect(regRes.user).toBeDefined();
    expect(regRes.user.role).toBe('ADMIN');
    expect(localStorage.getItem('dairysphere_business_id')).toBe(regRes.business.id);

    // Logout by clearing session tokens
    localStorage.removeItem('dairysphere_token');
    localStorage.removeItem('dairysphere_refresh_token');

    // Attempt login with correct credentials
    const loginRes = await api.login({
      email: 'harpreet@coop-alpha.com',
      password: 'Password123!'
    });

    expect(loginRes.token).toBeDefined();
    expect(loginRes.user.email).toBe('harpreet@coop-alpha.com');
    expect(loginRes.user.role).toBe('ADMIN');
  });

  it('should trigger security account lock after 5 consecutive login failures', async () => {
    // Seed a valid user first
    await api.register({
      name: 'Secure Cooperative',
      slug: 'sec-coop',
      adminName: 'Secure Admin',
      adminEmail: 'sec@coop.com',
      adminPassword: 'Password123!'
    });

    // Logout
    localStorage.removeItem('dairysphere_token');

    // Fail login 4 times
    for (let i = 0; i < 4; i++) {
      await expect(async () => {
        await api.login({ email: 'sec@coop.com', password: 'WrongPassword' });
      }).toThrow('Invalid credentials');
    }

    // 5th failure triggers account temporary lock
    await expect(async () => {
      await api.login({ email: 'sec@coop.com', password: 'WrongPassword' });
    }).toThrow('Account locked: 5 consecutive failed login attempts');

    // 6th attempt is blocked immediately by temporary locking policy
    await expect(async () => {
      await api.login({ email: 'sec@coop.com', password: 'Password123!' });
    }).toThrow('Account temporarily locked');
  });

  it('should enforce strict Role-Based Access Control (RBAC) permissions gatekeeping', async () => {
    // 1. Register as Admin (Default is ADMIN)
    const adminSession = await api.register({
      name: 'Coop Delta',
      slug: 'coop-delta',
      adminName: 'Delta Admin',
      adminEmail: 'admin@coop-delta.com',
      adminPassword: 'Password123!'
    });

    // 2. Create an OPERATOR user as the Admin
    const opUser = await api.createUser({
      name: 'Operator Raju',
      email: 'raju@coop-delta.com',
      password: 'Password123!',
      roleId: 'r3' // Operator role
    });

    // 3. Admin user list access should succeed
    const usersList = await api.getUsers();
    expect(usersList.users.length).toBeGreaterThan(0);

    // 4. Log in as the Operator
    localStorage.removeItem('dairysphere_token');
    await api.login({
      email: 'raju@coop-delta.com',
      password: 'Password123!'
    });

    // 5. Operator attempting to get audit logs should be blocked by RBAC
    await expect(async () => {
      await api.getAuditLogs();
    }).toThrow('RBAC Access Denied');

    // 6. Operator attempting to delete users should be blocked by RBAC
    await expect(async () => {
      await api.deleteUser(opUser.id);
    }).toThrow('RBAC Access Denied');
  });

  it('should guarantee complete multi-tenant data isolation', async () => {
    // Tenant A registers and seeds a farmer
    const tenantASession = await api.register({
      name: 'Tenant A Co-operative',
      slug: 'tenant-a',
      adminName: 'Admin A',
      adminEmail: 'admin@tenant-a.com',
      adminPassword: 'Password123!'
    });

    const farmerA = await api.createFarmer({
      code: 'FMR-TEN-A',
      name: 'Sardar Singh (Tenant A)',
      contacts: ['+91 99999 11111'],
      milkPreference: 'COW'
    });

    // Get farmers of Tenant A
    const farmersA = await api.getFarmers();
    expect(farmersA.length).toBe(1);
    expect(farmersA[0].name).toBe('Sardar Singh (Tenant A)');

    // Tenant B registers and logs in
    localStorage.removeItem('dairysphere_token');
    const tenantBSession = await api.register({
      name: 'Tenant B Co-operative',
      slug: 'tenant-b',
      adminName: 'Admin B',
      adminEmail: 'admin@tenant-b.com',
      adminPassword: 'Password123!'
    });

    // Get farmers of Tenant B (Should be empty, Tenant A's data must be completely invisible!)
    const farmersB = await api.getFarmers();
    expect(farmersB.length).toBe(0);

    // Verify Tenant B cannot update or access Tenant A's farmer
    await expect(async () => {
      await api.updateFarmer(farmerA.id, { name: 'Breached Name' });
    }).toThrow();
  });
});
