import prisma from '../config/database';
import { RoleType } from '@prisma/client';

interface DateFilter {
  dateFrom?: Date;
  dateTo?: Date;
}

interface DeptDateFilter extends DateFilter {
  departmentId?: string;
}

/**
 * Obtener los departmentIds a los que un usuario tiene acceso según su rol
 */
async function getUserDepartmentIds(userId: string, roleType: RoleType): Promise<string[] | null> {
  // SUPER_ADMIN ve todo → null significa sin filtro
  if (roleType === RoleType.SUPER_ADMIN) return null;

  // DEPT_ADMIN y SUBORDINATE ven sus departamentos
  if (roleType === RoleType.DEPT_ADMIN || roleType === RoleType.SUBORDINATE) {
    const deptUsers = await prisma.departmentUser.findMany({
      where: { userId },
      select: { departmentId: true }
    });
    return deptUsers.map(du => du.departmentId);
  }

  // REQUESTER no tiene departamentos — solo ve sus propios tickets
  return [];
}

function buildDateRange(filter: DateFilter) {
  const where: any = {};
  if (filter.dateFrom) where.gte = filter.dateFrom;
  if (filter.dateTo) where.lte = filter.dateTo;
  return Object.keys(where).length > 0 ? where : undefined;
}

function buildTicketWhere(
  departmentIds: string[] | null,
  specificDeptId?: string,
  dateFilter?: DateFilter,
  requesterId?: string,
  userId?: string,
  roleType?: RoleType
) {
  const where: any = { deletedAt: null };

  // Si es REQUESTER, solo sus tickets
  if (requesterId) {
    where.requesterId = requesterId;
  }

  // Si es SUBORDINATE, solo tickets asignados a ellos
  // DEPT_ADMIN ve todos los tickets de su departamento
  if (roleType === RoleType.SUBORDINATE) {
    where.assignments = { some: { userId } };
  }

  // Filtro de departamento específico (query param)
  if (specificDeptId) {
    where.departmentId = specificDeptId;
  } else if (departmentIds !== null && !requesterId) {
    // Filtrar por departamentos del usuario
    if (departmentIds.length === 0) return null; // sin acceso
    where.departmentId = { in: departmentIds };
  }

  // Filtro de fechas
  if (dateFilter) {
    const dateRange = buildDateRange(dateFilter);
    if (dateRange) where.createdAt = dateRange;
  }

  return where;
}

class MetricsService {
  /**
   * Dashboard principal — métricas generales según rol
   */
  async getDashboard(userId: string, roleType: RoleType, filters: DeptDateFilter) {
    const departmentIds = await getUserDepartmentIds(userId, roleType);
    const isRequester = roleType === RoleType.REQUESTER;

    const where = buildTicketWhere(
      departmentIds,
      filters.departmentId,
      filters,
      isRequester ? userId : undefined,
      userId,
      roleType
    );

    if (where === null) {
      return this.emptyDashboard();
    }

    const [
      totalTickets,
      byStatus,
      byPriority,
      slaExceeded,
      recentTickets
    ] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      }),
      prisma.ticket.groupBy({
        by: ['priority'],
        where,
        _count: { id: true }
      }),
      prisma.ticket.count({ where: { ...where, slaExceeded: true } }),
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          department: { select: { name: true } },
          requester: { select: { name: true } },
          assignments: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        }
      })
    ]);

    // Mapear status counts
    const statusMap: Record<string, number> = {};
    byStatus.forEach(s => { statusMap[s.status] = s._count.id; });

    const priorityMap: Record<string, number> = {};
    byPriority.forEach(p => { priorityMap[p.priority] = p._count.id; });

    // Calcular métricas derivadas
    const pending = (statusMap['NEW'] || 0) + (statusMap['ASSIGNED'] || 0);
    const inProgress = statusMap['IN_PROGRESS'] || 0;
    const waiting = statusMap['WAITING'] || 0;
    const resolved = (statusMap['RESOLVED'] || 0) + (statusMap['CLOSED'] || 0);
    const cancelled = statusMap['CANCELLED'] || 0;

    // Métricas extra para SUPER_ADMIN y DEPT_ADMIN
    let totalUsers = 0;
    let totalDepartments = 0;
    if (roleType === RoleType.SUPER_ADMIN) {
      [totalUsers, totalDepartments] = await Promise.all([
        prisma.user.count({ where: { isActive: true, deletedAt: null } }),
        prisma.department.count({ where: { isActive: true } })
      ]);
    } else if (roleType === RoleType.DEPT_ADMIN && departmentIds) {
      const deptWhere = filters.departmentId
        ? { departmentId: filters.departmentId }
        : { departmentId: { in: departmentIds } };
      const uniqueUsers = await prisma.departmentUser.findMany({
        where: deptWhere,
        distinct: ['userId'],
        select: { userId: true }
      });
      totalUsers = uniqueUsers.length;
      totalDepartments = filters.departmentId ? 1 : departmentIds.length;
    }

    return {
      totalTickets,
      pending,
      inProgress,
      waiting,
      resolved,
      cancelled,
      slaExceeded,
      statusBreakdown: statusMap,
      priorityBreakdown: priorityMap,
      totalUsers,
      totalDepartments,
      recentTickets
    };
  }

  /**
   * Tickets agrupados por estado
   */
  async getTicketsByStatus(userId: string, roleType: RoleType, filters: DeptDateFilter) {
    const departmentIds = await getUserDepartmentIds(userId, roleType);
    const isRequester = roleType === RoleType.REQUESTER;
    const where = buildTicketWhere(departmentIds, filters.departmentId, filters, isRequester ? userId : undefined);
    if (where === null) return [];

    const result = await prisma.ticket.groupBy({
      by: ['status'],
      where,
      _count: { id: true }
    });

    return result.map(r => ({ status: r.status, count: r._count.id }));
  }

  /**
   * Tickets agrupados por departamento
   */
  async getTicketsByDepartment(userId: string, roleType: RoleType, filters: DateFilter) {
    const departmentIds = await getUserDepartmentIds(userId, roleType);

    const where: any = { deletedAt: null };
    if (departmentIds !== null) {
      if (departmentIds.length === 0) return [];
      where.departmentId = { in: departmentIds };
    }
    if (roleType === RoleType.REQUESTER) {
      where.requesterId = userId;
    }

    const dateRange = buildDateRange(filters);
    if (dateRange) where.createdAt = dateRange;

    const result = await prisma.ticket.groupBy({
      by: ['departmentId'],
      where,
      _count: { id: true }
    });

    // Obtener nombres de departamentos
    const deptIds = result.map(r => r.departmentId);
    const departments = await prisma.department.findMany({
      where: { id: { in: deptIds } },
      select: { id: true, name: true }
    });
    const deptMap = new Map(departments.map(d => [d.id, d.name]));

    return result.map(r => ({
      departmentId: r.departmentId,
      departmentName: deptMap.get(r.departmentId) || 'Desconocido',
      count: r._count.id
    }));
  }

  /**
   * Tiempo promedio de resolución (en horas)
   */
  async getAvgResolutionTime(userId: string, roleType: RoleType, filters: DeptDateFilter) {
    const departmentIds = await getUserDepartmentIds(userId, roleType);
    const isRequester = roleType === RoleType.REQUESTER;

    const where: any = {
      deletedAt: null,
      resolvedAt: { not: null }
    };

    if (isRequester) {
      where.requesterId = userId;
    } else if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    } else if (departmentIds !== null) {
      if (departmentIds.length === 0) return { avgHours: 0, count: 0 };
      where.departmentId = { in: departmentIds };
    }

    const dateRange = buildDateRange(filters);
    if (dateRange) where.createdAt = dateRange;

    const tickets = await prisma.ticket.findMany({
      where,
      select: { createdAt: true, resolvedAt: true }
    });

    if (tickets.length === 0) return { avgHours: 0, count: 0 };

    const totalMs = tickets.reduce((sum, t) => {
      const diff = new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime();
      return sum + diff;
    }, 0);

    const avgMs = totalMs / tickets.length;
    const avgHours = Math.round((avgMs / (1000 * 60 * 60)) * 10) / 10;

    return { avgHours, count: tickets.length };
  }

  /**
   * Satisfacción promedio (calificaciones)
   */
  async getSatisfaction(userId: string, roleType: RoleType, filters: DeptDateFilter) {
    const departmentIds = await getUserDepartmentIds(userId, roleType);
    const isRequester = roleType === RoleType.REQUESTER;

    const ticketWhere: any = { deletedAt: null };
    if (isRequester) {
      ticketWhere.requesterId = userId;
    } else if (filters.departmentId) {
      ticketWhere.departmentId = filters.departmentId;
    } else if (departmentIds !== null) {
      if (departmentIds.length === 0) return { avgRating: 0, count: 0, distribution: {} };
      ticketWhere.departmentId = { in: departmentIds };
    }

    const dateRange = buildDateRange(filters);
    if (dateRange) ticketWhere.createdAt = dateRange;

    const ratings = await prisma.ticketRating.findMany({
      where: { ticket: ticketWhere },
      select: { rating: true }
    });

    if (ratings.length === 0) return { avgRating: 0, count: 0, distribution: {} };

    const total = ratings.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((total / ratings.length) * 10) / 10;

    // Distribución por estrellas
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(r => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

    return { avgRating, count: ratings.length, distribution };
  }

  /**
   * Cumplimiento SLA
   */
  async getSlaCompliance(userId: string, roleType: RoleType, filters: DeptDateFilter) {
    const departmentIds = await getUserDepartmentIds(userId, roleType);
    const isRequester = roleType === RoleType.REQUESTER;

    const where: any = { deletedAt: null };
    if (isRequester) {
      where.requesterId = userId;
    } else if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    } else if (departmentIds !== null) {
      if (departmentIds.length === 0) return { total: 0, onTime: 0, exceeded: 0, complianceRate: 0 };
      where.departmentId = { in: departmentIds };
    }

    const dateRange = buildDateRange(filters);
    if (dateRange) where.createdAt = dateRange;

    // Solo tickets que tienen SLA deadline
    where.slaDeadline = { not: null };

    const [total, exceeded] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, slaExceeded: true } })
    ]);

    const onTime = total - exceeded;
    const complianceRate = total > 0 ? Math.round((onTime / total) * 1000) / 10 : 0;

    return { total, onTime, exceeded, complianceRate };
  }

  /**
   * Tendencia de tickets (creados por período)
   */
  async getTicketsTrend(userId: string, roleType: RoleType, filters: DeptDateFilter & { period?: string }) {
    const departmentIds = await getUserDepartmentIds(userId, roleType);
    const isRequester = roleType === RoleType.REQUESTER;

    const where: any = { deletedAt: null };
    if (isRequester) {
      where.requesterId = userId;
    } else if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    } else if (departmentIds !== null) {
      if (departmentIds.length === 0) return [];
      where.departmentId = { in: departmentIds };
    }

    // Determinar rango de fechas según período
    const now = new Date();
    const period = filters.period || 'month';
    let startDate: Date;

    if (filters.dateFrom) {
      startDate = filters.dateFrom;
    } else {
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      }
    }

    where.createdAt = {
      gte: startDate,
      ...(filters.dateTo ? { lte: filters.dateTo } : {})
    };

    const tickets = await prisma.ticket.findMany({
      where,
      select: { createdAt: true, status: true },
      orderBy: { createdAt: 'asc' }
    });

    // Agrupar por día
    const grouped: Record<string, { created: number; resolved: number }> = {};
    tickets.forEach(t => {
      const day = t.createdAt.toISOString().split('T')[0];
      if (!grouped[day]) grouped[day] = { created: 0, resolved: 0 };
      grouped[day].created++;
    });

    // También contar resueltos por día
    const resolvedTickets = await prisma.ticket.findMany({
      where: {
        ...where,
        resolvedAt: { not: null }
      },
      select: { resolvedAt: true }
    });

    resolvedTickets.forEach(t => {
      const day = t.resolvedAt!.toISOString().split('T')[0];
      if (!grouped[day]) grouped[day] = { created: 0, resolved: 0 };
      grouped[day].resolved++;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        created: data.created,
        resolved: data.resolved
      }));
  }

  /**
   * Obtener departamentos accesibles por el usuario (para filtro del frontend)
   */
  async getUserDepartments(userId: string, roleType: RoleType) {
    if (roleType === RoleType.SUPER_ADMIN) {
      return prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });
    }

    if (roleType === RoleType.DEPT_ADMIN || roleType === RoleType.SUBORDINATE) {
      const deptUsers = await prisma.departmentUser.findMany({
        where: { userId },
        select: {
          department: { select: { id: true, name: true } }
        }
      });
      return deptUsers.map(du => du.department);
    }

    return [];
  }

  private emptyDashboard() {
    return {
      totalTickets: 0,
      pending: 0,
      inProgress: 0,
      waiting: 0,
      resolved: 0,
      cancelled: 0,
      slaExceeded: 0,
      statusBreakdown: {},
      priorityBreakdown: {},
      totalUsers: 0,
      totalDepartments: 0,
      recentTickets: []
    };
  }
}

export const metricsService = new MetricsService();
