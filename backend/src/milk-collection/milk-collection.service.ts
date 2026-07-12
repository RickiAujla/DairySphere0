import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppLogger } from '../common/logger/logger.service';
import { CreateMilkCollectionDto, UpdateMilkCollectionDto, MilkType, Shift } from './dto/milk-collection.dto';

@Injectable()
export class MilkCollectionService {
  constructor(
    private readonly db: DatabaseService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('MilkCollectionService');
  }

  // Rate calculator matching the frontend logic for absolute consistency
  calculateMilkRate(milkType: MilkType, fat: number, snf: number): number {
    let baseRate = 0;
    let baseFat = 0;
    let baseSNF = 0;
    let fatPremium = 0;
    let snfPremium = 0;
    let minRate = 0;
    let maxRate = 0;

    if (milkType === MilkType.COW) {
      baseRate = 45.00;
      baseFat = 4.0;
      baseSNF = 8.5;
      fatPremium = 0.50;
      snfPremium = 0.40;
      minRate = 35.00;
      maxRate = 60.00;
    } else if (milkType === MilkType.BUFFALO) {
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

  calculateQualityGrade(milkType: MilkType, fat: number, snf: number): 'A' | 'B' | 'C' | 'D' {
    if (milkType === MilkType.COW) {
      if (fat >= 4.5 && snf >= 8.7) return 'A';
      if (fat >= 4.0 && snf >= 8.4) return 'B';
      if (fat >= 3.5 && snf >= 8.0) return 'C';
      return 'D';
    } else if (milkType === MilkType.BUFFALO) {
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

  async getCollections(
    businessId: string, 
    filters: {
      search?: string;
      shift?: Shift;
      milkType?: MilkType;
      startDate?: string;
      endDate?: string;
      farmerId?: string;
    }
  ) {
    const { search, shift, milkType, startDate, endDate, farmerId } = filters;
    const where: any = {
      businessId,
      deletedAt: null
    };

    if (shift) where.shift = shift;
    if (milkType) where.milkType = milkType;
    if (farmerId) where.farmerName = `Farmer ${farmerId}`;

    if (startDate || endDate) {
      where.collectedAt = {};
      if (startDate) {
        where.collectedAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.collectedAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { farmerName: { contains: search, mode: 'insensitive' } },
        { remarks: { contains: search, mode: 'insensitive' } }
      ];
    }

    return await this.db.milkCollection.findMany({
      where,
      orderBy: { collectedAt: 'desc' }
    });
  }

  async createCollection(businessId: string, dto: CreateMilkCollectionDto, userId: string) {
    // 1. Check duplicate
    const targetDate = new Date(dto.collectedAt);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existing = await this.db.milkCollection.findFirst({
      where: {
        businessId,
        farmerName: `Farmer ${dto.farmerId}`,
        shift: dto.shift,
        collectedAt: {
          gte: dayStart,
          lte: dayEnd
        },
        deletedAt: null
      }
    });

    if (existing) {
      throw new BadRequestException(`Duplicate entry: Farmer already has a collection logged for shift ${dto.shift} on this day.`);
    }

    // Since we don't have a physical Farmer table in schema.prisma, we look up or mock farmer details
    // For production backend integrity, we fetch farmer details if a Farmer model exists, or store farmerName from request.
    // We assume the caller passes or we extract a name. Let's make a mock lookup or fetch.
    const farmerName = `Farmer ${dto.farmerId}`; 

    const ratePerLiter = this.calculateMilkRate(dto.milkType, dto.fat, dto.snf);
    const manualAdjustment = dto.manualAdjustment || 0;
    const rawAmt = (dto.quantity * ratePerLiter) + manualAdjustment;
    const totalAmount = Math.round(rawAmt * 100) / 100;

    // We can run this in a transaction
    return await this.db.$transaction(async (tx) => {
      const record = await tx.milkCollection.create({
        data: {
          businessId,
          farmerName,
          milkType: dto.milkType,
          quantity: dto.quantity,
          fat: dto.fat,
          snf: dto.snf,
          ratePerLiter,
          totalAmount,
          shift: dto.shift,
          collectedAt: new Date(dto.collectedAt),
        }
      });

      // Log audit trail
      this.logger.log(`Logged milk collection: ${record.quantity}L from ${record.farmerName} on shift ${record.shift}`);
      return record;
    });
  }

  async updateCollection(businessId: string, id: string, dto: UpdateMilkCollectionDto, userId: string) {
    const existing = await this.db.milkCollection.findFirst({
      where: { id, businessId, deletedAt: null }
    });

    if (!existing) {
      throw new NotFoundException(`Milk collection log not found.`);
    }

    // Verify duplicate with new values
    const farmerId = dto.farmerId || existing.farmerName.replace('Farmer ', '');
    const shift = dto.shift || existing.shift;
    const collectedAt = dto.collectedAt ? new Date(dto.collectedAt) : existing.collectedAt;

    if (dto.farmerId || dto.shift || dto.collectedAt) {
      const dayStart = new Date(collectedAt);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(collectedAt);
      dayEnd.setHours(23, 59, 59, 999);

      const duplicate = await this.db.milkCollection.findFirst({
        where: {
          id: { not: id },
          businessId,
          farmerName: `Farmer ${farmerId}`,
          shift,
          collectedAt: {
            gte: dayStart,
            lte: dayEnd
          },
          deletedAt: null
        }
      });

      if (duplicate) {
        throw new BadRequestException(`Duplicate entry: Farmer already has a collection logged for shift ${shift} on this day.`);
      }
    }

    const milkType = dto.milkType || (existing.milkType as MilkType);
    const quantity = dto.quantity !== undefined ? dto.quantity : Number(existing.quantity);
    const fat = dto.fat !== undefined ? dto.fat : Number(existing.fat);
    const snf = dto.snf !== undefined ? dto.snf : Number(existing.snf);
    const manualAdjustment = dto.manualAdjustment !== undefined ? dto.manualAdjustment : 0;

    const ratePerLiter = this.calculateMilkRate(milkType, fat, snf);
    const rawAmt = (quantity * ratePerLiter) + manualAdjustment;
    const totalAmount = Math.round(rawAmt * 100) / 100;

    return await this.db.$transaction(async (tx) => {
      const updated = await tx.milkCollection.update({
        where: { id },
        data: {
          milkType,
          quantity,
          fat,
          snf,
          ratePerLiter,
          totalAmount,
          shift,
          collectedAt,
        }
      });

      this.logger.log(`Updated milk collection log ${id} for ${updated.farmerName}`);
      return updated;
    });
  }

  async deleteCollection(businessId: string, id: string, userId: string) {
    const existing = await this.db.milkCollection.findFirst({
      where: { id, businessId, deletedAt: null }
    });

    if (!existing) {
      throw new NotFoundException(`Milk collection log not found.`);
    }

    await this.db.milkCollection.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    this.logger.log(`Soft deleted milk collection log ${id} of ${existing.farmerName}`);
    return { success: true };
  }

  async getAnalytics(businessId: string, days: number = 30) {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const logs = await this.db.milkCollection.findMany({
      where: {
        businessId,
        collectedAt: { gte: dateLimit },
        deletedAt: null
      }
    });

    let totalVolume = 0;
    let totalAmt = 0;
    let fatSum = 0;
    let snfSum = 0;

    let cowVolume = 0;
    let buffaloVolume = 0;
    let mixedVolume = 0;

    let morningVolume = 0;
    let eveningVolume = 0;

    logs.forEach(c => {
      const q = Number(c.quantity);
      totalVolume += q;
      totalAmt += Number(c.totalAmount);
      fatSum += Number(c.fat) * q;
      snfSum += Number(c.snf) * q;

      if (c.milkType === 'COW') cowVolume += q;
      if (c.milkType === 'BUFFALO') buffaloVolume += q;
      if (c.milkType === 'MIXED') mixedVolume += q;

      if (c.shift === 'MORNING') morningVolume += q;
      if (c.shift === 'EVENING') eveningVolume += q;
    });

    const averageFat = totalVolume > 0 ? Math.round((fatSum / totalVolume) * 100) / 100 : 0;
    const averageSnf = totalVolume > 0 ? Math.round((snfSum / totalVolume) * 100) / 100 : 0;

    return {
      totalVolume: Math.round(totalVolume * 100) / 100,
      totalAmount: Math.round(totalAmt * 100) / 100,
      averageFat,
      averageSnf,
      milkTypeBreakdown: [
        { name: 'Cow', value: Math.round(cowVolume * 100) / 100 },
        { name: 'Buffalo', value: Math.round(buffaloVolume * 100) / 100 },
        { name: 'Mixed', value: Math.round(mixedVolume * 100) / 100 },
      ],
      shiftBreakdown: [
        { name: 'Morning', value: Math.round(morningVolume * 100) / 100 },
        { name: 'Evening', value: Math.round(eveningVolume * 100) / 100 },
      ]
    };
  }
}
