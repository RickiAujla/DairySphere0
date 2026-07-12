/**
 * API Security, Validation, Rate Limiting & Error Handling Integration Tests
 */

import '../setup';
import { describe, it, expect, beforeAll, afterEach } from '../framework';
import { api, ApiError } from '../../frontend/src/utils/api';

describe('API Security and System Safeguards Suite', () => {
  beforeAll(() => {
    localStorage.clear();
    sessionStorage.setItem('dairysphere_csrf_token', 'csrf_sec_test_token_12345');
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.setItem('dairysphere_csrf_token', 'csrf_sec_test_token_12345');
  });

  it('should validate inputs, negative ranges, and return structured ApiError details', async () => {
    // Register business to establish session
    await api.register({
      name: 'Alpha Test Coop',
      slug: 'alpha-test',
      adminName: 'Tester',
      adminEmail: 'test@alpha-test.com',
      adminPassword: 'Password123!'
    });

    // 1. Create farmer with negative or invalid fields should throw validation errors
    await expect(async () => {
      await api.createFarmer({
        code: '', // invalid blank code
        name: 'Short', // too short name
        contacts: []
      });
    }).toThrow();

    // Establish farmer for milk collection
    const testFarmer = await api.createFarmer({
      name: 'John Doe',
      contacts: ['+91 99999 99999'],
      milkPreference: 'COW'
    });

    // 2. Log milk collection with a negative quantity or absurd fat content
    await expect(async () => {
      await api.createMilkCollection({
        farmerId: testFarmer.id,
        shift: 'MORNING',
        milkType: 'COW',
        quantity: -10.5, // Negative quantity!
        fat: 4.5,
        snf: 8.5
      });
    }).toThrow('Quantity must be a positive number');
  });

  it('should block SQL Injection (SQLi) and Cross-Site Scripting (XSS) malicious payloads', async () => {
    await api.register({
      name: 'Safe Coop',
      slug: 'safe-coop',
      adminName: 'Securer',
      adminEmail: 'securer@safe-coop.com',
      adminPassword: 'Password123!'
    });

    // 1. SQL Injection attempt in the search field
    await expect(async () => {
      await api.getFarmers({
        search: "Sukhdev'OR '1'='1"
      });
    }).toThrow('Security Warning: Malicious input pattern or injection sequence detected.');

    // 2. Cross-Site Scripting (XSS) script tags injection attempt
    await expect(async () => {
      await api.createFarmer({
        code: 'FMR-HACK',
        name: '<script>alert("XSS")</script> Hack',
        contacts: ['+91 99999 99999'],
        milkPreference: 'COW'
      });
    }).toThrow('Security Warning: Malicious input pattern or injection sequence detected.');
  });

  it('should enforce CSRF defense token check on state-changing requests', async () => {
    await api.register({
      name: 'CSRF Test',
      slug: 'csrf-test',
      adminName: 'CSRF Admin',
      adminEmail: 'csrf@test.com',
      adminPassword: 'Password123!'
    });

    // Remove CSRF token from sessionStorage
    sessionStorage.removeItem('dairysphere_csrf_token');

    // Attempting state-changing operation (like creating farmer) should throw CSRF failure
    await expect(async () => {
      await api.createFarmer({
        code: 'FMR-CSRF',
        name: 'CSRF Attempt',
        contacts: ['+91 88888 88888'],
        milkPreference: 'COW'
      });
    }).toThrow('CSRF verification failed: Anti-forgery request token is missing.');
  });

  it('should trigger rate-limiting protection under high request volume traffic', async () => {
    // Perform more than 120 requests in rapid succession to trigger 429
    let rateLimited = false;
    try {
      for (let i = 0; i < 150; i++) {
        // Simple light-weight check of profile or tenant which checks rate limit
        await api.getFarmers();
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 429) {
        rateLimited = true;
      }
    }
    expect(rateLimited).toBeTruthy();
  });
});
