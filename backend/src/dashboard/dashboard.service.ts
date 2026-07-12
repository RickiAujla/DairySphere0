import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppLogger } from '../common/logger/logger.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('DashboardService');
  }

  /**
   * Helper to parse dates and return current and comparison intervals.
   */
  private resolveDateIntervals(query: DashboardQueryDto) {
    const end = query.endDate ? new Date(query.endDate) : new Date();
    const start = query.startDate
      ? new Date(query.startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days

    const durationMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - durationMs);
    const prevEnd = start;

    return { start, end, prevStart, prevEnd };
  }

  /**
   * Helper to calculate percentage growth.
   */
  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    const growth = ((current - previous) / previous) * 100;
    return Math.round(growth * 100) / 100; // Round to 2 decimal places
  }

  /**
   * 1. Core KPIs and General Dashboard Statistics
   */
  async getKpiStats(businessId: string, query: DashboardQueryDto) {
    const { start, end, prevStart, prevEnd } = this.resolveDateIntervals(query);

    // Current Milk Collections
    const currentMilk = await this.db.milkCollection.aggregate({
      _sum: { quantity: true, totalAmount: true },
      where: { businessId, collectedAt: { gte: start, lte: end }, deletedAt: null },
    });

    const prevMilk = await this.db.milkCollection.aggregate({
      _sum: { quantity: true, totalAmount: true },
      where: { businessId, collectedAt: { gte: prevStart, lte: prevEnd }, deletedAt: null },
    });

    // Current Milk Sales
    const currentMilkSalesVal = await this.db.milkSale.aggregate({
      _sum: { totalAmount: true },
      where: { businessId, soldAt: { gte: start, lte: end }, deletedAt: null },
    });

    const prevMilkSalesVal = await this.db.milkSale.aggregate({
      _sum: { totalAmount: true },
      where: { businessId, soldAt: { gte: prevStart, lte: prevEnd }, deletedAt: null },
    });

    // Product Orders Revenue
    const currentOrders = await this.db.order.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        businessId,
        createdAt: { gte: start, lte: end },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        deletedAt: null,
      },
    });

    const prevOrders = await this.db.order.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        businessId,
        createdAt: { gte: prevStart, lte: prevEnd },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        deletedAt: null,
      },
    });

    // Total active customers
    const activeCustomers = await this.db.customer.count({
      where: { businessId, deletedAt: null },
    });

    const prevActiveCustomers = await this.db.customer.count({
      where: { businessId, createdAt: { lt: start }, deletedAt: null },
    });

    // Calculations
    const currentMilkQty = Number(currentMilk._sum.quantity || 0);
    const prevMilkQty = Number(prevMilk._sum.quantity || 0);

    const currentRevenue = Number(currentMilkSalesVal._sum.totalAmount || 0) + Number(currentOrders._sum.total || 0);
    const prevRevenue = Number(prevMilkSalesVal._sum.totalAmount || 0) + Number(prevOrders._sum.total || 0);

    const lowStockCount = await this.db.productStock.count({
      where: {
        product: { businessId, deletedAt: null },
        quantity: { lte: this.db.productStock.fields.minAlertQuantity },
      },
    });

    const pendingDeliveries = await this.db.delivery.count({
      where: { businessId, status: 'PENDING' },
    });

    return {
      revenue: {
        current: currentRevenue,
        previous: prevRevenue,
        growth: this.calculateGrowth(currentRevenue, prevRevenue),
      },
      milkCollected: {
        current: currentMilkQty,
        previous: prevMilkQty,
        growth: this.calculateGrowth(currentMilkQty, prevMilkQty),
      },
      activeCustomers: {
        current: activeCustomers,
        previous: prevActiveCustomers,
        growth: this.calculateGrowth(activeCustomers, prevActiveCustomers),
      },
      lowStockCount,
      pendingDeliveries,
      orderCount: {
        current: currentOrders._count.id,
        previous: prevOrders._count.id,
        growth: this.calculateGrowth(currentOrders._count.id, prevOrders._count.id),
      },
    };
  }

  /**
   * 2. Revenue Statistics
   */
  async getRevenueStats(businessId: string, query: DashboardQueryDto) {
    const { start, end, prevStart, prevEnd } = this.resolveDateIntervals(query);

    // Get Milk sales revenue
    const currentMilkSales = await this.db.milkSale.aggregate({
      _sum: { totalAmount: true },
      where: { businessId, soldAt: { gte: start, lte: end }, deletedAt: null },
    });

    const prevMilkSales = await this.db.milkSale.aggregate({
      _sum: { totalAmount: true },
      where: { businessId, soldAt: { gte: prevStart, lte: prevEnd }, deletedAt: null },
    });

    // Get Product orders revenue
    const currentProductSales = await this.db.order.aggregate({
      _sum: { total: true },
      where: {
        businessId,
        createdAt: { gte: start, lte: end },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        deletedAt: null,
      },
    });

    const prevProductSales = await this.db.order.aggregate({
      _sum: { total: true },
      where: {
        businessId,
        createdAt: { gte: prevStart, lte: prevEnd },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        deletedAt: null,
      },
    });

    // Invoices status
    const invoices = await this.db.invoice.groupBy({
      by: ['status'],
      _sum: { total: true, amountPaid: true },
      where: { businessId, issuedAt: { gte: start, lte: end }, deletedAt: null },
    });

    // Expenses in the period
    const expenses = await this.db.expense.aggregate({
      _sum: { amount: true },
      where: { businessId, spentAt: { gte: start, lte: end }, deletedAt: null },
    });

    const milkRevenue = Number(currentMilkSales._sum.totalAmount || 0);
    const prevMilkRevenue = Number(prevMilkSales._sum.totalAmount || 0);

    const productRevenue = Number(currentProductSales._sum.total || 0);
    const prevProductRevenue = Number(prevProductSales._sum.total || 0);

    const totalRevenue = milkRevenue + productRevenue;
    const prevTotalRevenue = prevMilkRevenue + prevProductRevenue;

    const totalExpenses = Number(expenses._sum.amount || 0);

    // Invoices breakdown
    const invoiceStatusBreakdown = invoices.map(inv => ({
      status: inv.status,
      count: 0, // grouped count is done separately if needed, but we can aggregate here
      total: Number(inv._sum.total || 0),
      paid: Number(inv._sum.amountPaid || 0),
    }));

    return {
      totalRevenue,
      prevTotalRevenue,
      revenueGrowth: this.calculateGrowth(totalRevenue, prevTotalRevenue),
      breakdown: {
        milkSales: {
          current: milkRevenue,
          previous: prevMilkRevenue,
          growth: this.calculateGrowth(milkRevenue, prevMilkRevenue),
        },
        productSales: {
          current: productRevenue,
          previous: prevProductRevenue,
          growth: this.calculateGrowth(productRevenue, prevProductRevenue),
        },
      },
      expenses: {
        total: totalExpenses,
        netProfit: totalRevenue - totalExpenses,
      },
      invoices: invoiceStatusBreakdown,
    };
  }

  /**
   * 3. Customer Statistics
   */
  async getCustomerStats(businessId: string, query: DashboardQueryDto) {
    const { start, end } = this.resolveDateIntervals(query);

    const totalCustomers = await this.db.customer.count({
      where: { businessId, deletedAt: null },
    });

    const newCustomers = await this.db.customer.count({
      where: { businessId, createdAt: { gte: start, lte: end }, deletedAt: null },
    });

    const activeSubscriptions = await this.db.customerSubscription.count({
      where: { customer: { businessId, deletedAt: null }, isActive: true },
    });

    // Customers with orders
    const uniqueOrderingCustomers = await this.db.order.groupBy({
      by: ['customerId'],
      where: { businessId, createdAt: { gte: start, lte: end }, deletedAt: null },
    });

    return {
      totalCustomers,
      newCustomers,
      activeSubscriptions,
      purchasingCustomersCount: uniqueOrderingCustomers.length,
      retentionRate: totalCustomers > 0 ? Math.round((uniqueOrderingCustomers.length / totalCustomers) * 10000) / 100 : 0,
    };
  }

  /**
   * 4. Product Statistics
   */
  async getProductStats(businessId: string, query: DashboardQueryDto) {
    const { start, end } = this.resolveDateIntervals(query);

    const totalProducts = await this.db.product.count({
      where: { businessId, deletedAt: null },
    });

    const activeProducts = await this.db.product.count({
      where: { businessId, isActive: true, deletedAt: null },
    });

    // Top selling products by order quantity and total sales
    const orderItems = await this.db.orderItem.findMany({
      where: {
        order: { businessId, createdAt: { gte: start, lte: end }, deletedAt: null },
      },
      include: {
        product: true,
      },
    });

    // Aggregate in memory to be fast and safe
    const salesByProduct: Record<string, { name: string; sku: string; quantity: number; revenue: number }> = {};
    for (const item of orderItems) {
      const prod = item.product;
      if (!salesByProduct[prod.id]) {
        salesByProduct[prod.id] = {
          name: prod.name,
          sku: prod.sku,
          quantity: 0,
          revenue: 0,
        };
      }
      salesByProduct[prod.id].quantity += Number(item.quantity);
      salesByProduct[prod.id].revenue += Number(item.total);
    }

    const topSelling = Object.values(salesByProduct)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Distribution by category
    const categories = await this.db.productCategory.findMany({
      where: { businessId, deletedAt: null },
      include: {
        _count: {
          select: { products: { where: { deletedAt: null } } },
        },
      },
    });

    const categoryDistribution = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      productCount: cat._count.products,
    }));

    return {
      totalProducts,
      activeProducts,
      categoryCount: categories.length,
      topSelling,
      categoryDistribution,
    };
  }

  /**
   * 5. Order Statistics
   */
  async getOrderStats(businessId: string, query: DashboardQueryDto) {
    const { start, end } = this.resolveDateIntervals(query);

    const totalOrders = await this.db.order.count({
      where: { businessId, createdAt: { gte: start, lte: end }, deletedAt: null },
    });

    const orderStatusBreakdown = await this.db.order.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { total: true },
      where: { businessId, createdAt: { gte: start, lte: end }, deletedAt: null },
    });

    const financialAggregate = await this.db.order.aggregate({
      _avg: { total: true },
      _sum: { discount: true, total: true },
      where: {
        businessId,
        createdAt: { gte: start, lte: end },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        deletedAt: null,
      },
    });

    return {
      totalOrders,
      statusBreakdown: orderStatusBreakdown.map(stat => ({
        status: stat.status,
        count: stat._count.id,
        totalRevenue: Number(stat._sum.total || 0),
      })),
      averageOrderValue: Number(financialAggregate._avg.total || 0),
      totalDiscounts: Number(financialAggregate._sum.discount || 0),
      netOrderRevenue: Number(financialAggregate._sum.total || 0),
    };
  }

  /**
   * 6. Delivery Statistics
   */
  async getDeliveryStats(businessId: string, query: DashboardQueryDto) {
    const { start, end } = this.resolveDateIntervals(query);

    const totalDeliveries = await this.db.delivery.count({
      where: { businessId, createdAt: { gte: start, lte: end } },
    });

    const deliveryStatusBreakdown = await this.db.delivery.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { businessId, createdAt: { gte: start, lte: end } },
    });

    const successfulDeliveries = await this.db.delivery.count({
      where: { businessId, status: 'DELIVERED', createdAt: { gte: start, lte: end } },
    });

    // Average completion time (deliveredAt - createdAt)
    const deliveriesWithTime = await this.db.delivery.findMany({
      where: {
        businessId,
        status: 'DELIVERED',
        deliveredAt: { not: null },
        createdAt: { gte: start, lte: end },
      },
      select: {
        createdAt: true,
        deliveredAt: true,
      },
    });

    let totalTimeMinutes = 0;
    for (const d of deliveriesWithTime) {
      if (d.deliveredAt) {
        const diffMs = d.deliveredAt.getTime() - d.createdAt.getTime();
        totalTimeMinutes += diffMs / (1000 * 60);
      }
    }

    const averageCompletionMinutes = deliveriesWithTime.length > 0
      ? Math.round(totalTimeMinutes / deliveriesWithTime.length)
      : 0;

    return {
      totalDeliveries,
      successRate: totalDeliveries > 0 ? Math.round((successfulDeliveries / totalDeliveries) * 10000) / 100 : 0,
      averageCompletionMinutes,
      statusBreakdown: deliveryStatusBreakdown.map(stat => ({
        status: stat.status,
        count: stat._count.id,
      })),
    };
  }

  /**
   * 7. Employee Statistics
   */
  async getEmployeeStats(businessId: string, query: DashboardQueryDto) {
    const totalEmployees = await this.db.employee.count({
      where: { businessId, deletedAt: null },
    });

    const activeEmployees = await this.db.employee.count({
      where: { businessId, isActive: true, deletedAt: null },
    });

    // Total monthly salary payout
    const salaries = await this.db.salary.aggregate({
      _sum: { netSalary: true },
      where: {
        employee: { businessId, deletedAt: null },
        status: 'PAID',
        paidAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // start of current month
        },
      },
    });

    // Today's attendance summary
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const attendances = await this.db.attendance.groupBy({
      by: ['status'],
      _count: { id: true },
      where: {
        employee: { businessId, deletedAt: null },
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    return {
      totalEmployees,
      activeEmployees,
      currentMonthPaidSalary: Number(salaries._sum.netSalary || 0),
      todayAttendanceSummary: attendances.map(att => ({
        status: att.status,
        count: att._count.id,
      })),
    };
  }

  /**
   * 8. Milk Collection Statistics
   */
  async getMilkCollectionStats(businessId: string, query: DashboardQueryDto) {
    const { start, end } = this.resolveDateIntervals(query);

    const aggregateStats = await this.db.milkCollection.aggregate({
      _sum: { quantity: true, totalAmount: true },
      _avg: { fat: true, snf: true, ratePerLiter: true },
      where: { businessId, collectedAt: { gte: start, lte: end }, deletedAt: null },
    });

    // Volume breakdown by milk type
    const milkTypeBreakdown = await this.db.milkCollection.groupBy({
      by: ['milkType'],
      _sum: { quantity: true, totalAmount: true },
      _count: { id: true },
      where: { businessId, collectedAt: { gte: start, lte: end }, deletedAt: null },
    });

    // Volume breakdown by shift
    const shiftBreakdown = await this.db.milkCollection.groupBy({
      by: ['shift'],
      _sum: { quantity: true },
      where: { businessId, collectedAt: { gte: start, lte: end }, deletedAt: null },
    });

    return {
      totalQuantityLiters: Number(aggregateStats._sum.quantity || 0),
      totalPayoutAmount: Number(aggregateStats._sum.totalAmount || 0),
      averageFat: Number(aggregateStats._avg.fat || 0),
      averageSnf: Number(aggregateStats._avg.snf || 0),
      averageRatePerLiter: Number(aggregateStats._avg.ratePerLiter || 0),
      milkTypeBreakdown: milkTypeBreakdown.map(b => ({
        milkType: b.milkType,
        quantity: Number(b._sum.quantity || 0),
        payoutAmount: Number(b._sum.totalAmount || 0),
        count: b._count.id,
      })),
      shiftBreakdown: shiftBreakdown.map(s => ({
        shift: s.shift,
        quantity: Number(s._sum.quantity || 0),
      })),
    };
  }

  /**
   * 9. Inventory Statistics
   */
  async getInventoryStats(businessId: string, query: DashboardQueryDto) {
    const totalProducts = await this.db.product.count({
      where: { businessId, deletedAt: null },
    });

    // Retrieve product stock lists
    const stocks = await this.db.productStock.findMany({
      where: {
        product: { businessId, deletedAt: null },
      },
      include: {
        product: true,
      },
    });

    let totalQuantity = 0;
    let totalStockValueRetail = 0;
    let totalStockValueCost = 0;
    let lowStockCount = 0;

    for (const stock of stocks) {
      const qty = Number(stock.quantity);
      totalQuantity += qty;
      totalStockValueRetail += qty * Number(stock.product.price);
      totalStockValueCost += qty * Number(stock.product.costPrice || stock.product.price);
      if (qty <= Number(stock.minAlertQuantity)) {
        lowStockCount++;
      }
    }

    return {
      totalProductSKUs: totalProducts,
      totalStockUnits: totalQuantity,
      stockValueRetail: totalStockValueRetail,
      stockValueCost: totalStockValueCost,
      estimatedProfitMargin: totalStockValueRetail > 0 ? Math.round(((totalStockValueRetail - totalStockValueCost) / totalStockValueRetail) * 10000) / 100 : 0,
      lowStockItemsCount: lowStockCount,
    };
  }

  /**
   * 10. Charts - Revenue Chart API
   */
  async getRevenueChart(businessId: string, query: DashboardQueryDto) {
    const { start, end } = this.resolveDateIntervals(query);

    const orders = await this.db.order.findMany({
      where: {
        businessId,
        createdAt: { gte: start, lte: end },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        deletedAt: null,
      },
      select: {
        createdAt: true,
        total: true,
      },
    });

    const milkSales = await this.db.milkSale.findMany({
      where: {
        businessId,
        soldAt: { gte: start, lte: end },
        deletedAt: null,
      },
      select: {
        soldAt: true,
        totalAmount: true,
      },
    });

    const dailyRevenue: Record<string, { date: string; productRevenue: number; milkRevenue: number; totalRevenue: number }> = {};

    // Group orders
    for (const o of orders) {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      if (!dailyRevenue[dateStr]) {
        dailyRevenue[dateStr] = { date: dateStr, productRevenue: 0, milkRevenue: 0, totalRevenue: 0 };
      }
      dailyRevenue[dateStr].productRevenue += Number(o.total);
      dailyRevenue[dateStr].totalRevenue += Number(o.total);
    }

    // Group milk sales
    for (const s of milkSales) {
      const dateStr = s.soldAt.toISOString().split('T')[0];
      if (!dailyRevenue[dateStr]) {
        dailyRevenue[dateStr] = { date: dateStr, productRevenue: 0, milkRevenue: 0, totalRevenue: 0 };
      }
      dailyRevenue[dateStr].milkRevenue += Number(s.totalAmount);
      dailyRevenue[dateStr].totalRevenue += Number(s.totalAmount);
    }

    return Object.values(dailyRevenue).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 11. Charts - Sales Trend API
   */
  async getSalesTrend(businessId: string, query: DashboardQueryDto) {
    const { start, end } = this.resolveDateIntervals(query);

    const milkSales = await this.db.milkSale.findMany({
      where: {
        businessId,
        soldAt: { gte: start, lte: end },
        deletedAt: null,
      },
      select: {
        soldAt: true,
        quantity: true,
      },
    });

    const dailyQuantity: Record<string, { date: string; milkLiters: number }> = {};

    for (const s of milkSales) {
      const dateStr = s.soldAt.toISOString().split('T')[0];
      if (!dailyQuantity[dateStr]) {
        dailyQuantity[dateStr] = { date: dateStr, milkLiters: 0 };
      }
      dailyQuantity[dateStr].milkLiters += Number(s.quantity);
    }

    return Object.values(dailyQuantity).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 12. Charts - Customer Growth API
   */
  async getCustomerGrowth(businessId: string, query: DashboardQueryDto) {
    const { start, end } = this.resolveDateIntervals(query);

    const customers = await this.db.customer.findMany({
      where: { businessId, createdAt: { lte: end }, deletedAt: null },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const countBeforeStart = customers.filter(c => c.createdAt < start).length;

    const dailyRegistrations: Record<string, number> = {};
    for (const c of customers) {
      if (c.createdAt >= start) {
        const dateStr = c.createdAt.toISOString().split('T')[0];
        dailyRegistrations[dateStr] = (dailyRegistrations[dateStr] || 0) + 1;
      }
    }

    // Generate date array
    const result: Array<{ date: string; newCustomers: number; cumulativeCustomers: number }> = [];
    let cumulative = countBeforeStart;

    const currentPtr = new Date(start);
    while (currentPtr <= end) {
      const dateStr = currentPtr.toISOString().split('T')[0];
      const newCount = dailyRegistrations[dateStr] || 0;
      cumulative += newCount;
      result.push({
        date: dateStr,
        newCustomers: newCount,
        cumulativeCustomers: cumulative,
      });
      currentPtr.setUTCDate(currentPtr.getUTCDate() + 1);
    }

    return result;
  }

  /**
   * 13. Charts - Product Distribution API
   */
  async getProductDistribution(businessId: string, query: DashboardQueryDto) {
    const { start, end } = this.resolveDateIntervals(query);

    const orderItems = await this.db.orderItem.findMany({
      where: {
        order: { businessId, createdAt: { gte: start, lte: end }, deletedAt: null },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const distribution: Record<string, { category: string; quantity: number; revenue: number }> = {};

    for (const item of orderItems) {
      const categoryName = item.product.category.name;
      if (!distribution[categoryName]) {
        distribution[categoryName] = { category: categoryName, quantity: 0, revenue: 0 };
      }
      distribution[categoryName].quantity += Number(item.quantity);
      distribution[categoryName].revenue += Number(item.total);
    }

    return Object.values(distribution);
  }

  /**
   * 14. Charts - Order Trend API
   */
  async getOrderTrend(businessId: string, query: DashboardQueryDto) {
    const { start, end } = this.resolveDateIntervals(query);

    const orders = await this.db.order.findMany({
      where: { businessId, createdAt: { gte: start, lte: end }, deletedAt: null },
      select: { createdAt: true, status: true },
    });

    const dailyOrders: Record<string, { date: string; totalOrders: number; completedOrders: number; cancelledOrders: number }> = {};

    for (const o of orders) {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      if (!dailyOrders[dateStr]) {
        dailyOrders[dateStr] = { date: dateStr, totalOrders: 0, completedOrders: 0, cancelledOrders: 0 };
      }
      dailyOrders[dateStr].totalOrders++;
      if (o.status === 'DELIVERED') {
        dailyOrders[dateStr].completedOrders++;
      } else if (o.status === 'CANCELLED') {
        dailyOrders[dateStr].cancelledOrders++;
      }
    }

    return Object.values(dailyOrders).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 15. Charts - Payment Trend API
   */
  async getPaymentTrend(businessId: string, query: DashboardQueryDto) {
    const { start, end } = this.resolveDateIntervals(query);

    const payments = await this.db.payment.findMany({
      where: { businessId, paidAt: { gte: start, lte: end }, status: 'COMPLETED' },
      select: { amount: true, method: true },
    });

    const methodDistribution: Record<string, { method: string; amount: number; transactionCount: number }> = {};

    for (const p of payments) {
      const methodStr = p.method;
      if (!methodDistribution[methodStr]) {
        methodDistribution[methodStr] = { method: methodStr, amount: 0, transactionCount: 0 };
      }
      methodDistribution[methodStr].amount += Number(p.amount);
      methodDistribution[methodStr].transactionCount++;
    }

    return Object.values(methodDistribution);
  }

  /**
   * 16. Widgets - Recent Activity (Paginated)
   */
  async getRecentActivity(businessId: string, query: DashboardQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.db.activityLog.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      this.db.activityLog.count({ where: { businessId } }),
    ]);

    return {
      items: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 17. Widgets - Pending Tasks
   */
  async getPendingTasks(businessId: string) {
    const pendingOrders = await this.db.order.findMany({
      where: { businessId, status: 'PENDING', deletedAt: null },
      select: { id: true, total: true, createdAt: true, customer: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const lowStock = await this.db.productStock.findMany({
      where: {
        product: { businessId, deletedAt: null },
        quantity: { lte: this.db.productStock.fields.minAlertQuantity },
      },
      include: {
        product: true,
      },
      take: 5,
    });

    const overdueInvoices = await this.db.invoice.findMany({
      where: {
        businessId,
        status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
        dueDate: { lt: new Date() },
        deletedAt: null,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    return {
      pendingOrders: pendingOrders.map(o => ({
        id: o.id,
        description: `Order from ${o.customer.firstName} ${o.customer.lastName}`,
        amount: Number(o.total),
        createdAt: o.createdAt,
      })),
      lowStockAlerts: lowStock.map(s => ({
        id: s.id,
        productName: s.product.name,
        sku: s.product.sku,
        currentStock: Number(s.quantity),
        minAlert: Number(s.minAlertQuantity),
      })),
      overdueInvoices: overdueInvoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: `${inv.customer.firstName} ${inv.customer.lastName}`,
        amountDue: Number(inv.total) - Number(inv.amountPaid),
        dueDate: inv.dueDate,
      })),
    };
  }

  /**
   * 18. Widgets - Notifications Summary
   */
  async getNotificationsSummary(businessId: string) {
    const unreadCount = await this.db.notification.count({
      where: { businessId, isRead: false },
    });

    const recentNotifications = await this.db.notification.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      unreadCount,
      recent: recentNotifications,
    };
  }

  /**
   * 19. Widgets - Today's Summary Operations
   */
  async getTodaySummary(businessId: string) {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const milkCollectedToday = await this.db.milkCollection.aggregate({
      _sum: { quantity: true, totalAmount: true },
      where: { businessId, collectedAt: { gte: todayStart, lte: todayEnd }, deletedAt: null },
    });

    const milkSoldToday = await this.db.milkSale.aggregate({
      _sum: { quantity: true, totalAmount: true },
      where: { businessId, soldAt: { gte: todayStart, lte: todayEnd }, deletedAt: null },
    });

    const ordersPlacedToday = await this.db.order.aggregate({
      _count: { id: true },
      _sum: { total: true },
      where: { businessId, createdAt: { gte: todayStart, lte: todayEnd }, deletedAt: null },
    });

    const deliveriesSummary = await this.db.delivery.groupBy({
      by: ['status'],
      _count: { id: true },
      where: { businessId, createdAt: { gte: todayStart, lte: todayEnd } },
    });

    const newCustomersToday = await this.db.customer.count({
      where: { businessId, createdAt: { gte: todayStart, lte: todayEnd }, deletedAt: null },
    });

    return {
      milkCollection: {
        volumeLiters: Number(milkCollectedToday._sum.quantity || 0),
        cost: Number(milkCollectedToday._sum.totalAmount || 0),
      },
      milkSales: {
        volumeLiters: Number(milkSoldToday._sum.quantity || 0),
        revenue: Number(milkSoldToday._sum.totalAmount || 0),
      },
      productOrders: {
        count: ordersPlacedToday._count.id,
        revenue: Number(ordersPlacedToday._sum.total || 0),
      },
      deliveries: deliveriesSummary.map(d => ({
        status: d.status,
        count: d._count.id,
      })),
      newCustomersToday,
    };
  }
}
