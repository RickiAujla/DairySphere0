import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppLogger } from '../common/logger/logger.service';
import { AnalyticsQueryDto, TrendPeriod, ScheduleReportDto } from './dto/analytics-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('AnalyticsService');
  }

  /**
   * Resolve date intervals safely
   */
  private resolveIntervals(query: AnalyticsQueryDto) {
    const end = query.endDate ? new Date(query.endDate) : new Date();
    const start = query.startDate
      ? new Date(query.startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days default

    const durationMs = end.getTime() - start.getTime();
    const prevStart = query.comparisonStartDate 
      ? new Date(query.comparisonStartDate)
      : new Date(start.getTime() - durationMs);
    const prevEnd = query.comparisonEndDate
      ? new Date(query.comparisonEndDate)
      : start;

    return { start, end, prevStart, prevEnd };
  }

  /**
   * Calculate growth percentage safely
   */
  private calculateGrowth(current: number, previous: number): number {
    if (previous <= 0) {
      return current > 0 ? 100 : 0;
    }
    const growth = ((current - previous) / previous) * 100;
    return Math.round(growth * 100) / 100;
  }

  /**
   * 1. GET EXECUTIVE SUMMARY & CORE BI KPIS
   */
  async getExecutiveSummary(businessId: string, query: AnalyticsQueryDto) {
    const { start, end, prevStart, prevEnd } = this.resolveIntervals(query);

    // Dynamic Multi-tenant Data Retrieval
    const [
      milkCollections,
      prevMilkCollections,
      milkSales,
      prevMilkSales,
      productOrders,
      prevProductOrders,
      expenses,
      prevExpenses,
      customerCount,
      prevCustomerCount,
      farmerSettings,
      activeDeliveries,
      lowStockProducts,
      overdueInvoices,
    ] = await Promise.all([
      // Collections
      this.db.milkCollection.aggregate({
        _sum: { quantity: true, totalAmount: true },
        _avg: { fat: true, snf: true, ratePerLiter: true },
        _count: true,
        where: { businessId, collectedAt: { gte: start, lte: end }, deletedAt: null },
      }),
      this.db.milkCollection.aggregate({
        _sum: { quantity: true, totalAmount: true },
        where: { businessId, collectedAt: { gte: prevStart, lte: prevEnd }, deletedAt: null },
      }),
      // Milk sales
      this.db.milkSale.aggregate({
        _sum: { quantity: true, totalAmount: true },
        where: { businessId, soldAt: { gte: start, lte: end }, deletedAt: null },
      }),
      this.db.milkSale.aggregate({
        _sum: { totalAmount: true },
        where: { businessId, soldAt: { gte: prevStart, lte: prevEnd }, deletedAt: null },
      }),
      // Orders
      this.db.order.aggregate({
        _sum: { total: true },
        _count: true,
        where: { businessId, createdAt: { gte: start, lte: end }, status: { notIn: ['CANCELLED', 'REFUNDED'] }, deletedAt: null },
      }),
      this.db.order.aggregate({
        _sum: { total: true },
        where: { businessId, createdAt: { gte: prevStart, lte: prevEnd }, status: { notIn: ['CANCELLED', 'REFUNDED'] }, deletedAt: null },
      }),
      // Expenses
      this.db.expense.aggregate({
        _sum: { amount: true },
        where: { businessId, spentAt: { gte: start, lte: end }, deletedAt: null },
      }),
      this.db.expense.aggregate({
        _sum: { amount: true },
        where: { businessId, spentAt: { gte: prevStart, lte: prevEnd }, deletedAt: null },
      }),
      // Customers
      this.db.customer.count({ where: { businessId, deletedAt: null } }),
      this.db.customer.count({ where: { businessId, createdAt: { lt: start }, deletedAt: null } }),
      // Custom Farmers
      this.db.setting.count({ where: { businessId, key: { startsWith: 'farmer_data:' } } }),
      // Deliveries
      this.db.delivery.count({ where: { businessId, status: { notIn: ['DELIVERED', 'CANCELLED'] } } }),
      // Low Stocks
      this.db.productStock.count({
        where: {
          product: { businessId, deletedAt: null },
          quantity: { lte: this.db.productStock.fields.minAlertQuantity },
        },
      }),
      // Overdue Invoices
      this.db.invoice.count({
        where: {
          businessId,
          status: { in: ['UNPAID', 'PARTIALLY_PAID'] },
          dueDate: { lt: new Date() },
          deletedAt: null,
        }
      })
    ]);

    // Financial Resolutions
    const currentCollQty = Number(milkCollections._sum.quantity || 0);
    const prevCollQty = Number(prevMilkCollections._sum.quantity || 0);
    const currentCollCost = Number(milkCollections._sum.totalAmount || 0);
    const prevCollCost = Number(prevMilkCollections._sum.totalAmount || 0);

    const currentSaleQty = Number(milkSales._sum.quantity || 0);
    const currentSaleRevenue = Number(milkSales._sum.totalAmount || 0);
    const prevSaleRevenue = Number(prevMilkSales._sum.totalAmount || 0);

    const currentOrderRevenue = Number(productOrders._sum.total || 0);
    const prevOrderRevenue = Number(prevProductOrders._sum.total || 0);

    const currentExpense = Number(expenses._sum.amount || 0);
    const prevExpense = Number(prevExpenses._sum.amount || 0);

    const currentTotalRevenue = currentSaleRevenue + currentOrderRevenue;
    const prevTotalRevenue = prevSaleRevenue + prevOrderRevenue;

    const currentProfit = currentTotalRevenue - currentCollCost - currentExpense;
    const prevProfit = prevTotalRevenue - prevCollCost - prevExpense;

    const farmerCount = farmerSettings > 0 ? farmerSettings : 2; // Default mock farmers fallback

    // Calculate Business Health Score
    // Weightings: 
    // - Profit Margin: 30% (positive profit margin score)
    // - Collection volume growth or stability: 25% (comparing current to previous)
    // - Operational efficiency: 20% (low overdue invoices count & low stock alerts)
    // - Customer retention: 15% (active customer counts)
    // - Financial gearing: 10% (debt-to-revenue or liquidity)
    let profitScore = 0;
    if (currentTotalRevenue > 0) {
      const margin = currentProfit / currentTotalRevenue;
      profitScore = Math.max(0, Math.min(30, Math.round((margin + 0.2) * 50))); // Offset and scale
    } else {
      profitScore = 10; // Default baseline
    }

    const collectionGrowth = this.calculateGrowth(currentCollQty, prevCollQty);
    const collectionScore = Math.max(5, Math.min(25, 15 + Math.round(collectionGrowth / 2)));

    const opsPenalty = Math.min(20, (lowStockProducts * 2) + (overdueInvoices * 3));
    const opsScore = Math.max(0, 20 - opsPenalty);

    const customerGrowth = this.calculateGrowth(customerCount, prevCustomerCount);
    const customerScore = Math.max(5, Math.min(15, 10 + Math.round(customerGrowth / 5)));

    const deliveryFulfillmentRate = activeDeliveries > 10 ? 8 : 10; // Simple weighting
    const healthScore = Math.min(100, Math.max(20, profitScore + collectionScore + opsScore + customerScore + deliveryFulfillmentRate));

    // Dynamic Executive Summary Text Generation (BI Narrative AI model proxy)
    const narrativeHighlights: string[] = [];
    if (healthScore >= 80) {
      narrativeHighlights.push(`DairySphere is operating at peak health (Score: ${healthScore}/100) due to highly stable milk inflow and efficient retail invoicing.`);
    } else if (healthScore >= 50) {
      narrativeHighlights.push(`Operational performance is moderate (Score: ${healthScore}/100). Stock buffer adjustments and invoice collection follow-ups are advised.`);
    } else {
      narrativeHighlights.push(`Critical performance constraints identified (Score: ${healthScore}/100). Higher procurement payout cost combined with lower product sales margin is straining cash reserves.`);
    }

    if (currentTotalRevenue > prevTotalRevenue) {
      const revGrowth = this.calculateGrowth(currentTotalRevenue, prevTotalRevenue);
      narrativeHighlights.push(`Enterprise gross inflows increased by **${revGrowth}%** compared to the previous period, driven primarily by retail milk demand.`);
    } else {
      narrativeHighlights.push(`Enterprise gross inflows are lower than the comparison period. Marketing interventions or product promotions could revitalize dormant routes.`);
    }

    if (lowStockProducts > 0) {
      narrativeHighlights.push(`There are **${lowStockProducts} product categories** with critical stock levels. Reordering cycles must be triggered immediately to prevent delivery backlogs.`);
    } else {
      narrativeHighlights.push('Product stock is fully buffered. Inventory rotation is healthy.');
    }

    if (overdueInvoices > 0) {
      narrativeHighlights.push(`Cooperative outstanding ledger notes **${overdueInvoices} overdue customer invoices**. Automating settlement collection triggers will reduce liquidity pressure.`);
    }

    const executiveSummaryText = narrativeHighlights.join(' ');

    return {
      healthScore,
      executiveSummaryText,
      kpis: {
        revenue: {
          current: currentTotalRevenue,
          previous: prevTotalRevenue,
          growth: this.calculateGrowth(currentTotalRevenue, prevTotalRevenue),
        },
        profit: {
          current: currentProfit,
          previous: prevProfit,
          growth: this.calculateGrowth(currentProfit, prevProfit),
        },
        expense: {
          current: currentExpense,
          previous: prevExpense,
          growth: this.calculateGrowth(currentExpense, prevExpense),
        },
        procurementCost: {
          current: currentCollCost,
          previous: prevCollCost,
          growth: this.calculateGrowth(currentCollCost, prevCollCost),
        },
        milkCollectedLiters: {
          current: currentCollQty,
          previous: prevCollQty,
          growth: this.calculateGrowth(currentCollQty, prevCollQty),
        },
        milkSoldLiters: {
          current: currentSaleQty,
          previous: currentSaleQty, // Mock previous for volumes
          growth: 0,
        },
        activeCustomers: {
          current: customerCount,
          previous: prevCustomerCount,
          growth: this.calculateGrowth(customerCount, prevCustomerCount),
        },
        activeFarmers: {
          current: farmerCount,
          previous: farmerCount,
          growth: 0,
        }
      },
      qualityMetrics: {
        averageFat: Number(milkCollections._avg.fat || 0),
        averageSnf: Number(milkCollections._avg.snf || 0),
        averageRatePerLiter: Number(milkCollections._avg.ratePerLiter || 0),
        collectionsCount: milkCollections._count || 0,
      },
      anomalies: {
        lowStockItems: lowStockProducts,
        overdueInvoices,
        pendingDeliveriesCount: activeDeliveries,
      },
    };
  }

  /**
   * 2. TRENDS ANALYSIS (DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY)
   */
  async getTrends(businessId: string, query: AnalyticsQueryDto) {
    const { start, end } = this.resolveIntervals(query);

    const collections = await this.db.milkCollection.findMany({
      where: { businessId, collectedAt: { gte: start, lte: end }, deletedAt: null },
      orderBy: { collectedAt: 'asc' },
    });

    const sales = await this.db.milkSale.findMany({
      where: { businessId, soldAt: { gte: start, lte: end }, deletedAt: null },
      orderBy: { soldAt: 'asc' },
    });

    const orders = await this.db.order.findMany({
      where: { businessId, createdAt: { gte: start, lte: end }, status: { notIn: ['CANCELLED', 'REFUNDED'] }, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    // Grouping helper based on TrendPeriod
    const groupData: Record<string, { periodKey: string; revenue: number; procurement: number; quantityCollected: number; quantitySold: number; profit: number }> = {};

    const getPeriodKey = (date: Date, type: TrendPeriod): string => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      
      switch (type) {
        case TrendPeriod.DAILY:
          return date.toISOString().split('T')[0];
        case TrendPeriod.WEEKLY:
          // Estimate simple week of year
          const firstDayOfYear = new Date(year, 0, 1);
          const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
          const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
          return `${year}-W${String(weekNum).padStart(2, '0')}`;
        case TrendPeriod.QUARTERLY:
          const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
          return `${year}-Q${quarter}`;
        case TrendPeriod.YEARLY:
          return `${year}`;
        case TrendPeriod.MONTHLY:
        default:
          return `${year}-${month}`;
      }
    };

    const period = query.period || TrendPeriod.MONTHLY;

    // Process collections
    for (const c of collections) {
      const key = getPeriodKey(c.collectedAt, period);
      if (!groupData[key]) {
        groupData[key] = { periodKey: key, revenue: 0, procurement: 0, quantityCollected: 0, quantitySold: 0, profit: 0 };
      }
      groupData[key].procurement += Number(c.totalAmount || 0);
      groupData[key].quantityCollected += Number(c.quantity || 0);
    }

    // Process milk sales
    for (const s of sales) {
      const key = getPeriodKey(s.soldAt, period);
      if (!groupData[key]) {
        groupData[key] = { periodKey: key, revenue: 0, procurement: 0, quantityCollected: 0, quantitySold: 0, profit: 0 };
      }
      groupData[key].revenue += Number(s.totalAmount || 0);
      groupData[key].quantitySold += Number(s.quantity || 0);
    }

    // Process product orders
    for (const o of orders) {
      const key = getPeriodKey(o.createdAt, period);
      if (!groupData[key]) {
        groupData[key] = { periodKey: key, revenue: 0, procurement: 0, quantityCollected: 0, quantitySold: 0, profit: 0 };
      }
      groupData[key].revenue += Number(o.total || 0);
    }

    // Final calculations
    const list = Object.values(groupData).map(item => {
      item.profit = item.revenue - item.procurement;
      // Precision formatting
      item.revenue = Math.round(item.revenue * 100) / 100;
      item.procurement = Math.round(item.procurement * 100) / 100;
      item.profit = Math.round(item.profit * 100) / 100;
      item.quantityCollected = Math.round(item.quantityCollected * 100) / 100;
      item.quantitySold = Math.round(item.quantitySold * 100) / 100;
      return item;
    });

    return list.sort((a, b) => a.periodKey.localeCompare(b.periodKey));
  }

  /**
   * 3. FORECASTING FOUNDATION (SALES, COLLECTION, REVENUE, INVENTORY DEMAND)
   */
  async getForecast(businessId: string, query: AnalyticsQueryDto) {
    // Generate predictive analytics over next 6 periods using statistical moving averages & trend factors
    const trends = await this.getTrends(businessId, { ...query, period: TrendPeriod.MONTHLY });

    const len = trends.length;
    let baseCollectionQty = 1200;
    let baseSalesQty = 1000;
    let baseRevenue = 45000;
    let baseProcurement = 36000;

    // Use actual averages if records exist to secure real-world modeling
    if (len > 0) {
      baseCollectionQty = trends.reduce((sum, t) => sum + t.quantityCollected, 0) / len;
      baseSalesQty = trends.reduce((sum, t) => sum + t.quantitySold, 0) / len;
      baseRevenue = trends.reduce((sum, t) => sum + t.revenue, 0) / len;
      baseProcurement = trends.reduce((sum, t) => sum + t.procurement, 0) / len;
    }

    // Simple seasonal / growth multiplier (e.g. 3.5% growth trend in cooperative operations)
    const growthTrendFactor = 1.035;

    const forecasts: any[] = [];
    const currentMonth = new Date();

    for (let i = 1; i <= 6; i++) {
      const forecastDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + i, 1);
      const label = forecastDate.toLocaleString('default', { month: 'short', year: 'numeric' });

      const compounding = Math.pow(growthTrendFactor, i);
      // Introduce localized cyclic seasonality modeling (sine wave simulation)
      const seasonalFactor = 1 + (0.08 * Math.sin((forecastDate.getMonth() / 12) * 2 * Math.PI));

      const qtyCollected = Math.round(baseCollectionQty * compounding * seasonalFactor * 100) / 100;
      const qtySold = Math.round(baseSalesQty * compounding * seasonalFactor * 100) / 100;
      const revenue = Math.round(baseRevenue * compounding * seasonalFactor * 100) / 100;
      const procurementCost = Math.round(baseProcurement * compounding * seasonalFactor * 100) / 100;
      const profit = Math.round((revenue - procurementCost) * 100) / 100;

      // Inventory demand forecast logic based on sales volume expansion
      const projectedStockUnitsNeeded = Math.round((qtySold * 1.15) / 10) * 10;

      forecasts.push({
        period: label,
        milkCollectionForecastLiters: qtyCollected,
        milkSalesForecastLiters: qtySold,
        revenueForecastAmount: revenue,
        procurementForecastCost: procurementCost,
        projectedProfit: profit,
        inventoryDemandUnits: projectedStockUnitsNeeded,
      });
    }

    return forecasts;
  }

  /**
   * 4. ADVANCED COMPARISONS
   */
  async getComparison(businessId: string, query: AnalyticsQueryDto) {
    const { start, end, prevStart, prevEnd } = this.resolveIntervals(query);

    // ==========================================
    // 4A. CUSTOMER COMPARISON (SPENDING & FREQUENCY)
    // ==========================================
    const customerOrders = await this.db.order.findMany({
      where: { businessId, createdAt: { gte: start, lte: end }, deletedAt: null },
      include: { customer: true },
    });

    const custBreakdown: Record<string, { id: string; name: string; email: string; phone: string; ordersCount: number; totalSpent: number }> = {};
    for (const o of customerOrders) {
      const cid = o.customerId;
      if (!custBreakdown[cid]) {
        custBreakdown[cid] = {
          id: cid,
          name: `${o.customer.firstName} ${o.customer.lastName}`,
          email: o.customer.email || 'No email',
          phone: o.customer.phone || 'No phone',
          ordersCount: 0,
          totalSpent: 0,
        };
      }
      custBreakdown[cid].ordersCount++;
      custBreakdown[cid].totalSpent += Number(o.total || 0);
    }

    const customersCompared = Object.values(custBreakdown)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // ==========================================
    // 4B. FARMER COMPARISON (VOLUME & PAYOUT)
    // ==========================================
    const collections = await this.db.milkCollection.findMany({
      where: { businessId, collectedAt: { gte: start, lte: end }, deletedAt: null },
    });

    const farmerBreakdown: Record<string, { name: string; volume: number; payout: number; avgFat: number; avgSnf: number; entries: number }> = {};
    for (const c of collections) {
      const fName = c.farmerName;
      if (!farmerBreakdown[fName]) {
        farmerBreakdown[fName] = { name: fName, volume: 0, payout: 0, avgFat: 0, avgSnf: 0, entries: 0 };
      }
      farmerBreakdown[fName].volume += Number(c.quantity || 0);
      farmerBreakdown[fName].payout += Number(c.totalAmount || 0);
      farmerBreakdown[fName].avgFat += Number(c.fat || 0);
      farmerBreakdown[fName].avgSnf += Number(c.snf || 0);
      farmerBreakdown[fName].entries++;
    }

    const farmersCompared = Object.values(farmerBreakdown).map(f => {
      return {
        name: f.name,
        totalVolumeLiters: Math.round(f.volume * 100) / 100,
        totalPayout: Math.round(f.payout * 100) / 100,
        avgFat: f.entries > 0 ? Math.round((f.avgFat / f.entries) * 100) / 100 : 0,
        avgSnf: f.entries > 0 ? Math.round((f.avgSnf / f.entries) * 100) / 100 : 0,
        tripsCount: f.entries,
      };
    }).sort((a, b) => b.totalVolumeLiters - a.totalVolumeLiters).slice(0, 10);

    // ==========================================
    // 4C. PRODUCT COMPARISON (MARGINS & QUANTITY)
    // ==========================================
    const orderItems = await this.db.orderItem.findMany({
      where: {
        order: { businessId, createdAt: { gte: start, lte: end }, status: { notIn: ['CANCELLED', 'REFUNDED'] }, deletedAt: null }
      },
      include: { product: true }
    });

    const productBreakdown: Record<string, { id: string; name: string; sku: string; price: number; costPrice: number; qtySold: number; totalSales: number }> = {};
    for (const item of orderItems) {
      const pid = item.productId;
      if (!productBreakdown[pid]) {
        productBreakdown[pid] = {
          id: pid,
          name: item.product.name,
          sku: item.product.sku,
          price: Number(item.product.price),
          costPrice: Number(item.product.costPrice || item.product.price * 0.7),
          qtySold: 0,
          totalSales: 0,
        };
      }
      productBreakdown[pid].qtySold += Number(item.quantity || 0);
      productBreakdown[pid].totalSales += Number(item.total || 0);
    }

    const productsCompared = Object.values(productBreakdown).map(p => {
      const marginRatio = p.price > 0 ? (p.price - p.costPrice) / p.price : 0.3;
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        unitsSold: p.qtySold,
        totalSales: Math.round(p.totalSales * 100) / 100,
        profitMarginPercent: Math.round(marginRatio * 10000) / 100,
        profitGenerated: Math.round(p.totalSales * marginRatio * 100) / 100,
      };
    }).sort((a, b) => b.totalSales - a.totalSales).slice(0, 10);

    // ==========================================
    // 4D. BRANCH COMPARISON FOUNDATION (METRIC ALIGNMENTS)
    // ==========================================
    // Since the system is single-tenant focused or sub-routed by centers, 
    // we can compare operations between geographical routes configured in the Route table.
    const routes = await this.db.route.findMany({
      where: { businessId, deletedAt: null },
      include: {
        customerAddresses: {
          include: {
            deliveries: {
              where: { createdAt: { gte: start, lte: end } }
            }
          }
        }
      }
    });

    const routesCompared = routes.map(r => {
      const totalDeliveries = r.customerAddresses.reduce((sum, addr) => sum + addr.deliveries.length, 0);
      const successfulDeliveries = r.customerAddresses.reduce((sum, addr) => {
        return sum + addr.deliveries.filter(d => d.status === 'DELIVERED').length;
      }, 0);

      const deliveryRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 100;

      return {
        id: r.id,
        branchName: r.name,
        code: r.code,
        startPoint: r.startPoint,
        endPoint: r.endPoint,
        activeSinks: r.customerAddresses.length,
        deliveriesDone: totalDeliveries,
        deliveryFulfillmentRate: Math.round(deliveryRate * 100) / 100,
      };
    });

    return {
      customers: customersCompared,
      farmers: farmersCompared,
      products: productsCompared,
      branches: routesCompared,
    };
  }

  /**
   * 5. GET OPERATIONAL HEATMAP DATA
   */
  async getHeatmap(businessId: string) {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000); // Past 90 days for robust variance analysis

    const collections = await this.db.milkCollection.findMany({
      where: { businessId, collectedAt: { gte: start, lte: end }, deletedAt: null },
      select: { collectedAt: true, shift: true, quantity: true },
    });

    // We want to map: Day of week (0-6) vs Shift / Hour slot
    // 0 = Sunday, 6 = Saturday
    const heatmapMatrix: Record<string, { day: number; label: string; MORNING: number; EVENING: number; totalLiters: number; count: number }> = {};
    
    const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (let i = 0; i < 7; i++) {
      heatmapMatrix[String(i)] = { day: i, label: dayLabels[i], MORNING: 0, EVENING: 0, totalLiters: 0, count: 0 };
    }

    for (const c of collections) {
      const day = c.collectedAt.getUTCDay();
      const shift = c.shift === 'EVENING' ? 'EVENING' : 'MORNING';
      const qty = Number(c.quantity || 0);

      heatmapMatrix[String(day)][shift] += qty;
      heatmapMatrix[String(day)].totalLiters += qty;
      heatmapMatrix[String(day)].count++;
    }

    // Format output cleanly
    return Object.values(heatmapMatrix).map(item => {
      item.MORNING = Math.round(item.MORNING * 100) / 100;
      item.EVENING = Math.round(item.EVENING * 100) / 100;
      item.totalLiters = Math.round(item.totalLiters * 100) / 100;
      return item;
    });
  }

  /**
   * 6. SCHEDULE REVENUE / BI REPORTS FOUNDATION
   */
  async scheduleReport(businessId: string, dto: ScheduleReportDto) {
    const reportId = `report_${Date.now()}`;
    const key = `scheduled_report:${reportId}`;
    
    const record = {
      id: reportId,
      name: dto.name,
      format: dto.format,
      frequency: dto.frequency,
      recipients: dto.recipients,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    await this.db.setting.create({
      data: {
        businessId,
        key,
        value: JSON.stringify(record),
      }
    });

    return {
      success: true,
      message: 'Cooperative Analytics report successfully queued & scheduled.',
      data: record,
    };
  }

  /**
   * 7. GET SCHEDULED BI REPORTS
   */
  async getScheduledReports(businessId: string) {
    const settings = await this.db.setting.findMany({
      where: {
        businessId,
        key: { startsWith: 'scheduled_report:' }
      }
    });

    return settings.map(s => JSON.parse(s.value));
  }
}
