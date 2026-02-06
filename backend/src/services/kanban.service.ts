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
  assignedTo: {
    id: string;
    name: string;
    email: string;
    profilePicture: string | null;
  } | null;
  department: {
    id: string;
    name: string;
    prefix: string;
  };
}

interface KanbanFilters {
  priority?: string;
  assignedToId?: string;
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

      if (filters.assignedToId) {
        where.assignedToId = filters.assignedToId;
      }

      if (filters.onlyMine) {
        where.OR = [
          { requesterId: userId },
          { assignedToId: userId }
        ];
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
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              prefix: true
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
   * Asignación rápida de ticket desde el Kanban
   */
  async quickAssignTicket(
    ticketId: string,
    assignedToId: string | null,
    userId: string
  ): Promise<void> {
    try {
      // Verificar que el ticket existe
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          status: true,
          departmentId: true,
          assignedToId: true
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

      // Si se está asignando a alguien, verificar que el usuario existe
      if (assignedToId) {
        const assignee = await prisma.user.findUnique({
          where: { id: assignedToId }
        });

        if (!assignee) {
          throw new Error('Usuario asignado no encontrado');
        }
      }

      // Actualizar el ticket
      const updateData: Prisma.TicketUpdateInput = {
        assignedTo: assignedToId ? { connect: { id: assignedToId } } : { disconnect: true }
      };

      // Si el ticket está en NEW y se asigna, cambiar a ASSIGNED
      if (ticket.status === 'NEW' && assignedToId) {
        updateData.status = 'ASSIGNED';
      }

      await prisma.ticket.update({
        where: { id: ticketId },
        data: updateData
      });

      logger.info('Ticket quick assigned', {
        ticketId,
        assignedToId,
        previousAssignedTo: ticket.assignedToId,
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
