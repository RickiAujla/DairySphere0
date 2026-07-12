/**
 * DairySphere Enterprise Test Framework
 * Enterprise-grade custom test harness for E2E, Integration, Regression, and Performance testing.
 */

import { performance } from 'perf_hooks';

export type TestHook = () => void | Promise<void>;
export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: Error;
}

export interface SuiteResult {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
}

class TestRegistry {
  private static instance: TestRegistry;
  
  suites: { name: string; fn: () => void | Promise<void> }[] = [];
  currentSuiteName: string = '';
  currentSuiteTests: { name: string; fn: () => void | Promise<void> }[] = [];
  
  beforeAllHooks: TestHook[] = [];
  afterAllHooks: TestHook[] = [];
  beforeEachHooks: TestHook[] = [];
  afterEachHooks: TestHook[] = [];

  static getInstance(): TestRegistry {
    if (!TestRegistry.instance) {
      TestRegistry.instance = new TestRegistry();
    }
    return TestRegistry.instance;
  }

  clearHooks() {
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
  }
}

const registry = TestRegistry.getInstance();

export function describe(name: string, fn: () => void | Promise<void>) {
  registry.suites.push({ name, fn });
}

export function it(name: string, fn: () => void | Promise<void>) {
  registry.currentSuiteTests.push({ name, fn });
}

// Hooks
export function beforeAll(fn: TestHook) { registry.beforeAllHooks.push(fn); }
export function afterAll(fn: TestHook) { registry.afterAllHooks.push(fn); }
export function beforeEach(fn: TestHook) { registry.beforeEachHooks.push(fn); }
export function afterEach(fn: TestHook) { registry.afterEachHooks.push(fn); }

// Assertion Engine
class Assertion {
  constructor(private actual: any) {}

  toBe(expected: any) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(this.actual)}`);
    }
  }

  toEqual(expected: any) {
    const actStr = JSON.stringify(this.actual);
    const expStr = JSON.stringify(expected);
    if (actStr !== expStr) {
      throw new Error(`Expected deep equality: ${expStr} but got ${actStr}`);
    }
  }

  toBeDefined() {
    if (this.actual === undefined) {
      throw new Error(`Expected value to be defined, but it was undefined`);
    }
  }

  toBeUndefined() {
    if (this.actual !== undefined) {
      throw new Error(`Expected value to be undefined, but got ${JSON.stringify(this.actual)}`);
    }
  }

  toBeTruthy() {
    if (!this.actual) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} to be truthy`);
    }
  }

  toBeFalsy() {
    if (this.actual) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} to be falsy`);
    }
  }

  toContain(item: any) {
    if (!Array.isArray(this.actual) && typeof this.actual !== 'string') {
      throw new Error(`Expected array or string to contain item, but target is ${typeof this.actual}`);
    }
    if (Array.isArray(this.actual)) {
      const found = this.actual.some(x => JSON.stringify(x) === JSON.stringify(item) || x === item);
      if (!found) {
        throw new Error(`Expected array to contain ${JSON.stringify(item)}, but it did not`);
      }
    } else {
      if (!this.actual.includes(item)) {
        throw new Error(`Expected string to contain "${item}", but it did not`);
      }
    }
  }

  toBeGreaterThan(expected: number) {
    if (typeof this.actual !== 'number' || this.actual <= expected) {
      throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
    }
  }

  toBeLessThan(expected: number) {
    if (typeof this.actual !== 'number' || this.actual >= expected) {
      throw new Error(`Expected ${this.actual} to be less than ${expected}`);
    }
  }

  async toThrow(expectedError?: string | RegExp) {
    if (typeof this.actual !== 'function') {
      throw new Error('Actual value passed to expect() must be a function to assert throw');
    }
    let threw = false;
    let errorThrown: any = null;
    try {
      await this.actual();
    } catch (e: any) {
      threw = true;
      errorThrown = e;
    }
    if (!threw) {
      throw new Error('Expected function to throw an error, but it returned successfully');
    }
    if (expectedError && errorThrown) {
      const errMsg = errorThrown.message || String(errorThrown);
      if (typeof expectedError === 'string') {
        if (!errMsg.includes(expectedError)) {
          throw new Error(`Expected error containing "${expectedError}" but got "${errMsg}"`);
        }
      } else if (expectedError instanceof RegExp) {
        if (!expectedError.test(errMsg)) {
          throw new Error(`Expected error matching ${expectedError} but got "${errMsg}"`);
        }
      }
    }
  }
}

export function expect(actual: any) {
  return new Assertion(actual);
}

// Test Data Factories
export const TestFactories = {
  createBusiness(overrides = {}) {
    return {
      id: `biz-f-${Math.random().toString(36).substring(2, 9)}`,
      name: 'Alpha Dairy Co-operative',
      slug: `alpha-dairy-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
      ...overrides
    };
  },

  createUser(overrides = {}) {
    return {
      id: `usr-f-${Math.random().toString(36).substring(2, 9)}`,
      name: 'Test Administrator',
      email: `test-admin-${Math.random().toString(36).substring(2, 5)}@dairysphere.com`,
      passwordHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Sha256 of empty
      businessId: 'default-biz',
      isActive: true,
      createdAt: new Date().toISOString(),
      ...overrides
    };
  },

  createFarmer(overrides = {}) {
    return {
      id: `fmr-f-${Math.random().toString(36).substring(2, 9)}`,
      businessId: 'default-biz',
      code: `FMR-F-${Math.floor(100 + Math.random() * 900)}`,
      name: 'Harpreet Singh',
      address: 'Village Chowk, Gurdaspur, Punjab',
      contacts: ['+91 99887 76655'],
      aadhaar: '1122-3344-5566',
      bankName: 'HDFC Bank',
      accountNumber: '50100200300',
      ifscCode: 'HDFC0000123',
      milkPreference: 'COW',
      status: 'ACTIVE',
      tags: ['Regular'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  },

  createMilkCollection(overrides = {}) {
    const qty = 15.5;
    const fat = 4.2;
    const snf = 8.6;
    // Calculate SNF rate using standard SNF + Fat formula
    const baseRate = 42.0;
    const finalRate = parseFloat((baseRate * (fat / 4.0 + snf / 8.5)).toFixed(2));
    const finalAmt = parseFloat((qty * finalRate).toFixed(2));

    return {
      id: `col-f-${Math.random().toString(36).substring(2, 9)}`,
      businessId: 'default-biz',
      farmerId: 'fmr-1',
      farmerName: 'Sukhdev Singh',
      farmerCode: 'FMR-001',
      date: new Date().toISOString().split('T')[0],
      shift: 'MORNING',
      milkType: 'COW',
      quantity: qty,
      fat,
      snf,
      temperature: 4.1,
      lactometerReading: 28.5,
      rate: finalRate,
      amount: finalAmt,
      status: 'ACCEPTED',
      recordedBy: 'usr-admin',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  },

  createProduct(overrides = {}) {
    return {
      id: `prod-f-${Math.random().toString(36).substring(2, 9)}`,
      businessId: 'default-biz',
      categoryId: 'cat-1',
      categoryName: 'Liquid Milk',
      sku: `SKU-L-${Math.floor(1000 + Math.random() * 9000)}`,
      name: 'Premium Standardized Milk',
      brand: 'DairySphere',
      price: 60.00,
      costPrice: 45.00,
      unit: 'Liter',
      minStock: 100,
      maxStock: 2000,
      reorderLevel: 250,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides
    };
  },

  createCustomer(overrides = {}) {
    return {
      id: `cust-f-${Math.random().toString(36).substring(2, 9)}`,
      businessId: 'default-biz',
      code: `CST-${Math.floor(100 + Math.random() * 900)}`,
      name: 'Amritsar Sweets House',
      phone: '+91 98150 11223',
      email: 'info@amritsarsweets.com',
      address: 'Lawrence Road, Amritsar, Punjab',
      isActive: true,
      createdAt: new Date().toISOString(),
      ...overrides
    };
  },

  createExpense(overrides = {}) {
    return {
      id: `exp-f-${Math.random().toString(36).substring(2, 9)}`,
      businessId: 'default-biz',
      voucherNumber: `EXP-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
      category: 'Fuel',
      amount: 1500.00,
      paymentMethod: 'CASH',
      description: 'Diesel for collection truck',
      recordedBy: 'usr-admin',
      createdAt: new Date().toISOString(),
      ...overrides
    };
  }
};

// Runner Engine
export async function runAllSuites(): Promise<SuiteResult[]> {
  const suiteResults: SuiteResult[] = [];
  const suitesToRun = [...registry.suites];
  
  for (const suite of suitesToRun) {
    registry.clearHooks();
    registry.currentSuiteName = suite.name;
    registry.currentSuiteTests = [];
    
    // Execute suite definer to populate its tests and hooks
    await suite.fn();
    
    const testResults: TestResult[] = [];
    let passedCount = 0;
    let failedCount = 0;

    // Run beforeAll hooks for the suite
    for (const hook of registry.beforeAllHooks) {
      await hook();
    }

    // Run tests
    for (const test of registry.currentSuiteTests) {
      // Run beforeEach hooks
      for (const hook of registry.beforeEachHooks) {
        await hook();
      }

      const start = performance.now();
      let passed = true;
      let testError: Error | undefined;

      try {
        await test.fn();
      } catch (err: any) {
        passed = false;
        failedCount++;
        testError = err instanceof Error ? err : new Error(String(err));
      }

      const end = performance.now();
      if (passed) {
        passedCount++;
      }

      testResults.push({
        name: test.name,
        passed,
        duration: parseFloat((end - start).toFixed(2)),
        error: testError
      });

      // Run afterEach hooks
      for (const hook of registry.afterEachHooks) {
        await hook();
      }
    }

    // Run afterAll hooks for the suite
    for (const hook of registry.afterAllHooks) {
      await hook();
    }

    suiteResults.push({
      name: suite.name,
      tests: testResults,
      passed: passedCount,
      failed: failedCount
    });
  }

  return suiteResults;
}
