import prisma from '../config/database';
import { SLAPriority } from '@prisma/client';

export class SLAConfigurationService {
  async getAllSLAConfigurations() {
    return await prisma.sLAConfiguration.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' }
    });
  }

  async getSLAConfigurationById(id: string) {
    return await prisma.sLAConfiguration.findUnique({
      where: { id }
    });
  }

  async getDefaultSLAConfiguration() {
    return await prisma.sLAConfiguration.findFirst({
      where: { 
        isDefault: true,
        isActive: true 
      }
    });
  }

  async getSLAConfigurationsByPriority(priority: SLAPriority) {
    return await prisma.sLAConfiguration.findMany({
      where: { 
        priority,
        isActive: true 
      }
    });
  }

  async createSLAConfiguration(data: {
    name: string;
    description?: string;
    priority: SLAPriority;
    responseTime: number;
    resolutionTime: number;
    escalationEnabled?: boolean;
    escalationTime?: number;
    businessHoursOnly?: boolean;
    notifyOnBreach?: boolean;
    notifyBefore?: number;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await prisma.sLAConfiguration.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    return await prisma.sLAConfiguration.create({
      data
    });
  }

  async updateSLAConfiguration(id: string, data: {
    name?: string;
    description?: string;
    priority?: SLAPriority;
    responseTime?: number;
    resolutionTime?: number;
    escalationEnabled?: boolean;
    escalationTime?: number;
    businessHoursOnly?: boolean;
    notifyOnBreach?: boolean;
    notifyBefore?: number;
    isActive?: boolean;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await prisma.sLAConfiguration.updateMany({
        where: { 
          isDefault: true,
          NOT: { id }
        },
        data: { isDefault: false }
      });
    }

    return await prisma.sLAConfiguration.update({
      where: { id },
      data
    });
  }

  async deleteSLAConfiguration(id: string) {
    const sla = await prisma.sLAConfiguration.findUnique({
      where: { id }
    });

    if (sla?.isDefault) {
      throw new Error('No se puede eliminar la configuración SLA por defecto');
    }

    return await prisma.sLAConfiguration.update({
      where: { id },
      data: { isActive: false }
    });
  }

  async getSLAStats() {
    const total = await prisma.sLAConfiguration.count({
      where: { isActive: true }
    });

    const byPriority = await prisma.sLAConfiguration.groupBy({
      by: ['priority'],
      where: { isActive: true },
      _count: true,
      _avg: {
        responseTime: true,
        resolutionTime: true
      }
    });

    const defaultSLA = await this.getDefaultSLAConfiguration();

    return {
      total,
      byPriority: byPriority.map(item => ({
        priority: item.priority,
        count: item._count,
        avgResponseTime: item._avg.responseTime,
        avgResolutionTime: item._avg.resolutionTime
      })),
      defaultSLA: defaultSLA ? {
        id: defaultSLA.id,
        name: defaultSLA.name,
        priority: defaultSLA.priority
      } : null
    };
  }
}

export default new SLAConfigurationService();
