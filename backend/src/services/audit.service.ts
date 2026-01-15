import prisma from '../config/database';

export class AuditService {
  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 50
    } = filters;

    const where: any = {};

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (resource) where.resource = { contains: resource, mode: 'insensitive' };
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getAuditLogById(id: string) {
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!log) {
      throw new Error('Log de auditoría no encontrado');
    }

    return log;
  }

  async getUserAuditLogs(userId: string, page = 1, limit = 50) {
    return this.getAuditLogs({ userId, page, limit });
  }

  async getAuditStats(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalLogs,
      successLogs,
      errorLogs,
      actionStats,
      resourceStats
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.count({ where: { ...where, status: 'success' } }),
      prisma.auditLog.count({ where: { ...where, status: 'error' } }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10
      }),
      prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: true,
        orderBy: { _count: { resource: 'desc' } },
        take: 10
      })
    ]);

    return {
      total: totalLogs,
      success: successLogs,
      error: errorLogs,
      successRate: totalLogs > 0 ? (successLogs / totalLogs) * 100 : 0,
      topActions: actionStats.map((stat: any) => ({
        action: stat.action,
        count: stat._count
      })),
      topResources: resourceStats.map((stat: any) => ({
        resource: stat.resource,
        count: stat._count
      }))
    };
  }
}
