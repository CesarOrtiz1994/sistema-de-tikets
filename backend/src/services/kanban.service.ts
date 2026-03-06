import prisma from '../config/database';
import { TicketStatus, Prisma } from '@prisma/client';
import logger from '../config/logger';

interface KanbanColumn {
  status: TicketStatus;
  label: string;
  tickets: KanbanTicket[];
  count: number;
}

interface KanbanTicket {
  id: string;
  ticketNumber: string;
  title: string;
  priority: string;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  timeInStatus: number; // minutos en el estado actual
  requester: {
    id: string;
    name: string;
    email: string;
    profilePicture: string | null;
  };
  assignments: Array<{
    user: {
      id: string;
      name: string;
      email: string;
      profilePicture: string | null;
    };
  }>;
  department: {
    id: string;
    name: string;
    prefix: string;
  };
}

interface KanbanFilters {
  priority?: string;
  onlyMine?: boolean;
}

export class KanbanService {
  private readonly COLUMN_ORDER: TicketStatus[] = [
    'NEW',
    'ASSIGNED',
    'IN_PROGRESS',
    'WAITING',
    'RESOLVED'
  ];

  // Columnas para subordinados (sin NEW)
  private readonly SUBORDINATE_COLUMN_ORDER: TicketStatus[] = [
    'ASSIGNED',
    'IN_PROGRESS',
    'WAITING',
    'RESOLVED'
  ];

  private readonly STATUS_LABELS: Record<TicketStatus, string> = {
    NEW: 'Nuevo',
    ASSIGNED: 'Asignado',
    IN_PROGRESS: 'En Proceso',
    WAITING: 'Esperando',
    RESOLVED: 'Resuelto',
    CLOSED: 'Cerrado',
    CANCELLED: 'Cancelado'
  };

  /**
   * Obtiene los tickets de un departamento agrupados por estado para el tablero Kanban
   */
  async getDepartmentKanban(
    departmentId: string,
    userId: string,
    filters: KanbanFilters = {}
  ): Promise<KanbanColumn[]> {
    try {
      // Verificar permisos del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          roleType: true,
          departmentUsers: {
            where: { departmentId },
            select: {
              role: true,
              departmentId: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar que el usuario tenga acceso al departamento
      const hasAccess = 
        user.roleType === 'SUPER_ADMIN' ||
        user.departmentUsers.some(du => du.departmentId === departmentId);

      if (!hasAccess) {
        throw new Error('No tienes permisos para ver el tablero de este departamento');
      }

      // Determinar qué columnas mostrar según el rol
      const isSubordinate = user.roleType === 'SUBORDINATE';
      const columnsToShow = isSubordinate ? this.SUBORDINATE_COLUMN_ORDER : this.COLUMN_ORDER;

      // Construir filtros para la consulta
      const where: Prisma.TicketWhereInput = {
        departmentId,
        deletedAt: null,
        status: {
          in: columnsToShow
        }
      };

      // Aplicar filtros adicionales
      if (filters.priority) {
        where.priority = filters.priority as any;
      }

      // Para SUBORDINATE: solo mostrar tickets asignados a ellos
      // Para DEPT_ADMIN: mostrar todos los tickets del departamento
      // Para SUPER_ADMIN: mostrar todos del departamento
      if (user.roleType === 'SUBORDINATE') {
        // Subordinados SOLO ven tickets asignados a ellos
        where.assignments = { some: { userId } };
      }
      // DEPT_ADMIN y SUPER_ADMIN ven todos los tickets del departamento (no se agrega filtro adicional)

      // Filtro onlyMine aplica para DEPT_ADMIN y SUPER_ADMIN
      if (filters.onlyMine && (user.roleType === 'SUPER_ADMIN' || user.roleType === 'DEPT_ADMIN')) {
        where.assignments = { some: { userId } };
      }

      // Obtener todos los tickets del departamento
      const tickets = await prisma.ticket.findMany({
        where,
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          priority: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          slaDeadline: true,
          slaExceeded: true,
          slaPausedAt: true,
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true
            }
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profilePicture: true
                }
              }
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              prefix: true,
              requireDeliverable: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ]
      });

      // Agrupar tickets por estado
      const ticketsByStatus = new Map<TicketStatus, typeof tickets>();
      
      columnsToShow.forEach(status => {
        ticketsByStatus.set(status, []);
      });

      tickets.forEach(ticket => {
        const statusTickets = ticketsByStatus.get(ticket.status);
        if (statusTickets) {
          statusTickets.push(ticket);
        }
      });

      // Construir columnas del Kanban
      const columns: KanbanColumn[] = columnsToShow.map(status => {
        const statusTickets = ticketsByStatus.get(status) || [];
        
        return {
          status,
          label: this.STATUS_LABELS[status],
          count: statusTickets.length,
          tickets: statusTickets.map(ticket => ({
            ...ticket,
            timeInStatus: this.calculateTimeInStatus(ticket.updatedAt)
          }))
        };
      });

      logger.info('Kanban board loaded', {
        departmentId,
        userId,
        totalTickets: tickets.length,
        filters
      });

      return columns;
    } catch (error) {
      logger.error('Error loading kanban board:', error);
      throw error;
    }
  }

  /**
   * Obtiene los tickets de todos los departamentos del usuario agrupados por estado
   */
  async getAllDepartmentsKanban(
    userId: string,
    filters: KanbanFilters = {}
  ): Promise<KanbanColumn[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          roleType: true,
          departmentUsers: {
            select: {
              departmentId: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const isSubordinate = user.roleType === 'SUBORDINATE';
      const columnsToShow = isSubordinate ? this.SUBORDINATE_COLUMN_ORDER : this.COLUMN_ORDER;

      // Determinar departamentos accesibles
      let departmentFilter: Prisma.TicketWhereInput = {};
      if (user.roleType === 'SUPER_ADMIN') {
        // Super admin ve todos los departamentos
        departmentFilter = { deletedAt: null };
      } else {
        const deptIds = user.departmentUsers.map(du => du.departmentId);
        if (deptIds.length === 0) {
          return columnsToShow.map(status => ({
            status,
            label: this.STATUS_LABELS[status],
            count: 0,
            tickets: []
          }));
        }
        departmentFilter = { departmentId: { in: deptIds }, deletedAt: null };
      }

      const where: Prisma.TicketWhereInput = {
        ...departmentFilter,
        status: { in: columnsToShow }
      };

      if (filters.priority) {
        where.priority = filters.priority as any;
      }

      // Para SUBORDINATE: solo mostrar tickets asignados a ellos
      // Para DEPT_ADMIN: mostrar todos los tickets de sus departamentos
      // Para SUPER_ADMIN: mostrar todos
      if (user.roleType === 'SUBORDINATE') {
        // Subordinados SOLO ven tickets asignados a ellos
        where.assignments = { some: { userId } };
      }
      // DEPT_ADMIN y SUPER_ADMIN ven todos los tickets (no se agrega filtro adicional)

      // Filtro onlyMine aplica para DEPT_ADMIN y SUPER_ADMIN
      if (filters.onlyMine && (user.roleType === 'SUPER_ADMIN' || user.roleType === 'DEPT_ADMIN')) {
        where.assignments = { some: { userId } };
      }

      const tickets = await prisma.ticket.findMany({
        where,
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          priority: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          slaDeadline: true,
          slaExceeded: true,
          slaPausedAt: true,
          requester: {
            select: { id: true, name: true, email: true, profilePicture: true }
          },
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, email: true, profilePicture: true }
              }
            }
          },
          department: {
            select: { id: true, name: true, prefix: true, requireDeliverable: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ]
      });

      const ticketsByStatus = new Map<TicketStatus, typeof tickets>();
      columnsToShow.forEach(status => ticketsByStatus.set(status, []));
      tickets.forEach(ticket => {
        const statusTickets = ticketsByStatus.get(ticket.status);
        if (statusTickets) statusTickets.push(ticket);
      });

      const columns: KanbanColumn[] = columnsToShow.map(status => {
        const statusTickets = ticketsByStatus.get(status) || [];
        return {
          status,
          label: this.STATUS_LABELS[status],
          count: statusTickets.length,
          tickets: statusTickets.map(ticket => ({
            ...ticket,
            timeInStatus: this.calculateTimeInStatus(ticket.updatedAt)
          }))
        };
      });

      logger.info('Kanban board loaded (all departments)', {
        userId,
        totalTickets: tickets.length,
        filters
      });

      return columns;
    } catch (error) {
      logger.error('Error loading all departments kanban:', error);
      throw error;
    }
  }

  /**
   * Asignación rápida de ticket desde el Kanban
   */
  async quickAssignTicket(
    ticketId: string,
    assignedUserIds: string[],
    userId: string
  ): Promise<void> {
    try {
      // Verificar que el ticket existe
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          status: true,
          departmentId: true
        }
      });

      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }

      // Verificar permisos del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          roleType: true,
          departmentUsers: {
            where: { departmentId: ticket.departmentId },
            select: {
              role: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Solo SUPER_ADMIN y DEPT_ADMIN pueden asignar tickets
      const canAssign = 
        user.roleType === 'SUPER_ADMIN' ||
        user.departmentUsers.some(du => du.role === 'ADMIN');

      if (!canAssign) {
        throw new Error('No tienes permisos para asignar tickets');
      }

      // Verificar que los usuarios existen
      if (assignedUserIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: assignedUserIds } }
        });

        if (users.length !== assignedUserIds.length) {
          throw new Error('Uno o más usuarios asignados no fueron encontrados');
        }
      }

      // Actualizar asignaciones
      await prisma.ticketAssignment.deleteMany({
        where: { ticketId }
      });

      if (assignedUserIds.length > 0) {
        await prisma.ticketAssignment.createMany({
          data: assignedUserIds.map(uid => ({
            ticketId,
            userId: uid,
            assignedBy: userId
          }))
        });
      }

      // Si el ticket está en NEW y se asigna, cambiar a ASSIGNED
      if (ticket.status === 'NEW' && assignedUserIds.length > 0) {
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: 'ASSIGNED' }
        });
      }

      logger.info('Ticket quick assigned', {
        ticketId,
        assignedUserIds,
        userId
      });
    } catch (error) {
      logger.error('Error in quick assign:', error);
      throw error;
    }
  }

  /**
   * Calcula el tiempo que un ticket ha estado en su estado actual (en minutos)
   */
  private calculateTimeInStatus(updatedAt: Date): number {
    const now = new Date();
    const diffMs = now.getTime() - updatedAt.getTime();
    return Math.floor(diffMs / (1000 * 60)); // convertir a minutos
  }
}

export default new KanbanService();
