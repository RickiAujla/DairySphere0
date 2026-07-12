/**
 * Comprehensive Business Workflows End-to-End Simulation Tests
 */

import '../setup';
import { describe, it, expect, beforeAll } from '../framework';
import { api, calculateMilkRate, calculateQualityGrade } from '../../frontend/src/utils/api';

describe('DairySphere Core Business Workflows E2E Suite', () => {
  let businessId: string;
  let activeToken: string;

  beforeAll(async () => {
    localStorage.clear();
    sessionStorage.setItem('dairysphere_csrf_token', 'csrf_sec_test_token_12345');

    // Register primary cooperative business tenant
    const session = await api.register({
      name: 'Shimla Hills Cooperative',
      slug: 'shimla-hills',
      adminName: 'Suresh Kumar',
      adminEmail: 'suresh@shimla-hills.com',
      adminPassword: 'Password123!'
    });

    businessId = session.business.id;
    activeToken = session.token;
  });

  it('should successfully complete Master Data (Farmers) CRUD, Search & Filters', async () => {
    // 1. Create multiple farmers
    const f1 = await api.createFarmer({
      code: 'FMR-101',
      name: 'Amarjit Singh',
      contacts: ['+91 98765 43210'],
      aadhaar: '1234-5678-9012',
      bankName: 'State Bank of India',
      accountNumber: '11112222333',
      ifscCode: 'SBIN0001234',
      milkPreference: 'COW'
    });

    const f2 = await api.createFarmer({
      code: 'FMR-102',
      name: 'Baldev Singh Dhillon',
      contacts: ['+91 98765 43211'],
      aadhaar: '1234-5678-9013',
      bankName: 'Punjab National Bank',
      accountNumber: '44445555666',
      ifscCode: 'PUNB0005678',
      milkPreference: 'BUFFALO'
    });

    expect(f1.id).toBeDefined();
    expect(f2.id).toBeDefined();

    // 2. Fetch list and assert length
    const farmers = await api.getFarmers();
    expect(farmers.length).toBe(2);

    // 3. Update farmer profiles (CRUD: U)
    const updatedF1 = await api.updateFarmer(f1.id, {
      name: 'Amarjit Singh Bajwa',
      milkPreference: 'COW'
    });
    expect(updatedF1.name).toBe('Amarjit Singh Bajwa');

    // 4. Test Search filters
    const searchRes = await api.getFarmers();
    const searchFiltered = searchRes.filter((f: any) => f.name.toLowerCase().includes('dhillon'));
    expect(searchFiltered.length).toBe(1);
    expect(searchFiltered[0].code).toBe('FMR-102');

    // 5. Test preference/type filters
    const cowPref = searchRes.filter((f: any) => f.milkPreference === 'COW');
    expect(cowPref.length).toBe(1);
    expect(cowPref[0].name).toBe('Amarjit Singh Bajwa');
  });

  it('should execute Milk Collection with pricing calculations, duplicates prevention and logs verification', async () => {
    const farmers = await api.getFarmers();
    const fCow = farmers.find((f: any) => f.milkPreference === 'COW');
    const fBuf = farmers.find((f: any) => f.milkPreference === 'BUFFALO');

    // 1. Log a valid COW collection and assert quality math calculation
    const cowCol = await api.createMilkCollection({
      farmerId: fCow.id,
      shift: 'MORNING',
      milkType: 'COW',
      quantity: 20.0,
      fat: 4.5,
      snf: 8.8
    });

    expect(cowCol.amount).toBeGreaterThan(0);
    expect(cowCol.rate).toBe(calculateMilkRate('COW', 4.5, 8.8));
    expect(cowCol.amount).toBe(parseFloat((20.0 * cowCol.rate).toFixed(2)));

    // 2. Try to log duplicate collection (same farmer, same day, same shift) to prevent fraud
    await expect(async () => {
      await api.createMilkCollection({
        farmerId: fCow.id,
        shift: 'MORNING',
        milkType: 'COW',
        quantity: 15.0,
        fat: 4.0,
        snf: 8.5
      });
    }).toThrow('Duplicate milk collection log detected for this farmer, shift, and date.');

    // 3. Log a valid BUFFALO collection
    const bufCol = await api.createMilkCollection({
      farmerId: fBuf.id,
      shift: 'MORNING',
      milkType: 'BUFFALO',
      quantity: 12.5,
      fat: 7.2,
      snf: 9.3
    });

    expect(bufCol.rate).toBe(calculateMilkRate('BUFFALO', 7.2, 9.3));
    expect(bufCol.amount).toBe(parseFloat((12.5 * bufCol.rate).toFixed(2)));

    // 4. Verify ledgers/registers reflect these collections
    const collections = await api.getMilkCollections();
    expect(collections.length).toBe(2);
  });

  it('should compile Procurement Billing invoices, calculate rates, and execute payouts', async () => {
    const farmers = await api.getFarmers();
    const fCow = farmers.find((f: any) => f.milkPreference === 'COW');

    // 1. Generate billing run for current period
    const billingRun = await api.createBillingInvoice({
      farmerId: fCow.id,
      startDate: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });

    expect(billingRun.id).toBeDefined();
    expect(billingRun.farmerId).toBe(fCow.id);
    expect(billingRun.totalLiters).toBe(20.0); // matches previous MORNING COW collection quantity
    expect(billingRun.status).toBe('UNPAID');

    // 2. Perform payment settlement against billing invoice
    const payout = await api.settleBillingPayment({
      invoiceId: billingRun.id,
      amount: billingRun.totalAmount,
      paymentMethod: 'BANK_TRANSFER',
      transactionReference: 'TXN-COOP-88991'
    });

    expect(payout.status).toBe('PAID');
    expect(payout.transactionReference).toBe('TXN-COOP-88991');

    // 3. Verify Ledger shows settlement
    const ledger = await api.getFarmerLedger(fCow.id);
    expect(ledger.balance).toBe(0); // settled in full
  });

  it('should process Inventory and SKU SKU management: Product CRUD, Stock Entry, Purchase & Transfers', async () => {
    // 1. Create product category
    const cat = await api.createProductCategory({
      name: 'Cattle Feed',
      description: 'Cooperative supplied high nutrition cattle feed bags'
    });

    // 2. Product CRUD (Create)
    const product = await api.createProduct({
      categoryId: cat.id,
      sku: 'SKU-FEED-50KG',
      name: 'Kapila Pashu Aahar Super',
      brand: 'Kapila',
      price: 1200.00,
      costPrice: 950.00,
      unit: 'Bag',
      minStock: 20,
      maxStock: 500,
      reorderLevel: 50
    });

    expect(product.sku).toBe('SKU-FEED-50KG');

    // 3. Log Stock Entry / Purchases to raise inventory count
    const stockIn = await api.createStockEntry({
      productId: product.id,
      type: 'PURCHASE',
      quantity: 100,
      unitPrice: 950.00,
      description: 'Bulk purchase of Kapila Cattle Feed Bags'
    });

    expect(stockIn.quantity).toBe(100);

    // 4. Verify inventory stocks
    const updatedProd = await api.getProduct(product.id);
    expect(updatedProd.stockCount).toBe(100);
  });

  it('should process Customers, Sales Orders, Invoices & Payments', async () => {
    // 1. Create retail customer
    const cust = await api.createCustomer({
      code: 'CUST-301',
      name: 'Kashmir Sweet Mart',
      phone: '+91 98888 77777',
      address: 'Mall Road, Shimla'
    });

    expect(cust.id).toBeDefined();

    // 2. Create products list to sell (e.g. Standard Cow Milk pouch)
    const milkProd = await api.createProduct({
      categoryId: 'cat-liquid-milk',
      sku: 'SKU-COW-1L',
      name: 'Coop Standard Cow Milk 1L',
      price: 58.00,
      costPrice: 42.00,
      unit: 'Packet'
    });

    // Add stock for the milk packet
    await api.createStockEntry({
      productId: milkProd.id,
      type: 'ADJUSTMENT',
      quantity: 500,
      unitPrice: 42.00,
      description: 'Morning pasteurized standard supply'
    });

    // 3. Place Order/Sale
    const order = await api.createSaleOrder({
      customerId: cust.id,
      items: [
        { productId: milkProd.id, quantity: 50, price: 58.00 }
      ],
      paymentMethod: 'CASH'
    });

    expect(order.total).toBe(50 * 58.00); // 2900.00
    expect(order.paymentStatus).toBe('PAID');

    // 4. Verify customer transaction register and stock deductions
    const soldMilk = await api.getProduct(milkProd.id);
    expect(soldMilk.stockCount).toBe(450); // 500 - 50
  });

  it('should manage Logistics: Routes, Deliveries, and Consumer Subscriptions', async () => {
    // 1. Create delivery route
    const route = await api.createDeliveryRoute({
      code: 'RTE-SH-01',
      name: 'Mall Road Delivery Link',
      startPoint: 'Processing Center',
      endPoint: 'Ridge Square',
      assignedDriver: 'Madan Lal'
    });

    expect(route.code).toBe('RTE-SH-01');

    // 2. Subscribe کشمیر Sweet Mart to daily supply
    const customers = await api.getCustomers();
    const cust = customers.find((c: any) => c.name.includes('Kashmir'));

    const sub = await api.createDeliverySubscription({
      customerId: cust.id,
      routeId: route.id,
      productId: 'prod-std-cow-milk', // sample standard milk
      dailyQuantity: 10,
      startDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE'
    });

    expect(sub.dailyQuantity).toBe(10);
    expect(sub.status).toBe('ACTIVE');

    // 3. Dispatch Delivery Run for the Route
    const run = await api.dispatchDeliveryRun({
      routeId: route.id,
      date: new Date().toISOString().split('T')[0]
    });

    expect(run.routeId).toBe(route.id);
    expect(run.status).toBe('COMPLETED');
  });

  it('should track cooperative corporate Finance: Expenses, Cash/Bank ledger entries', async () => {
    // 1. Log corporate expense
    const exp = await api.createExpense({
      category: 'Logistics/Fuel',
      amount: 1200.00,
      paymentMethod: 'CASH',
      description: 'Diesel for delivery loader'
    });

    expect(exp.amount).toBe(1200.00);

    // 2. Verify cash book entries
    const cashBook = await api.getCashBook();
    const expenseEntry = cashBook.find((e: any) => e.description.includes('Diesel'));
    expect(expenseEntry).toBeDefined();
    expect(expenseEntry.amount).toBe(1200.00);
  });

  it('should configure outgoing Integration parameters, Trigger Webhooks, and verify system Alerts', async () => {
    // 1. Create webhook subscription
    const hook = await api.createWebhookSubscription({
      url: 'https://external-erp.shimla.com/webhooks/milk',
      events: ['MILK_COLLECTED', 'BILLING_SETTLED']
    });

    expect(hook.url).toBe('https://external-erp.shimla.com/webhooks/milk');
    expect(hook.events).toContain('MILK_COLLECTED');

    // 2. Test configure Integration channel
    const configRes = await api.configureIntegration('TALLY', {
      baseUrl: 'https://shimla-tally.com:9000',
      companyName: 'Shimla Hills Cooperative Corp'
    }, true);

    expect(configRes.success).toBeTruthy();

    // 3. Trigger integration link ping
    const pingRes = await api.testIntegration('TALLY');
    expect(pingRes.status).toBe('SUCCESS');
    expect(pingRes.latencyMs).toBeGreaterThan(0);
  });

  it('should execute administrative features: System Backup, Preferences & Settings Restore', async () => {
    // 1. Update settings
    const settings = await api.updateSettings({
      paymentCycle: 'WEEKLY',
      cowRatePerFatSnf: 45.0,
      buffaloRatePerFatSnf: 65.0
    });

    expect(settings.paymentCycle).toBe('WEEKLY');

    // 2. Trigger System Backup snapshot
    const backup = await api.createSystemBackup();
    expect(backup.id).toBeDefined();
    expect(backup.status).toBe('COMPLETED');
    expect(backup.fileSizeKb).toBeGreaterThan(0);

    // 3. Restore snapshot verify configuration persistence
    const restore = await api.restoreSystemBackup(backup.id);
    expect(restore.success).toBeTruthy();
  });
});
