import prisma from '../config/database';
import { TicketStatus, TicketPriority, Prisma } from '@prisma/client';
import { formValidationService } from './formValidation.service';
import { sanitizationService } from './sanitization.service';
import slaDeadlineService from './slaDeadline.service';
import logger from '../config/logger';

interface CreateTicketData {
  departmentId: string;
  formId: string;
  requesterId: string;
  title: string;
  priority: TicketPriority;
  formData: Record<string, any>;
}

interface UpdateTicketData {
  title?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToId?: string | null;
  formData?: Record<string, any>;
}

export class TicketsService {
  /**
   * Genera un número de ticket único: DEPT-YYYY-NNN
   * Ejemplo: IT-2024-001, RRHH-2024-042
   */
  async generateTicketNumber(departmentId: string): Promise<string> {
    // Obtener el departamento para el prefijo
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { prefix: true }
    });

    if (!department) {
      throw new Error('Departamento no encontrado');
    }

    const year = new Date().getFullYear();
    const prefix = `${department.prefix}-${year}`;

    // Obtener el último ticket del año para este departamento
    const lastTicket = await prisma.ticket.findFirst({
      where: {
        departmentId,
        ticketNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        ticketNumber: 'desc'
      },
      select: {
        ticketNumber: true
      }
    });

    let sequence = 1;
    if (lastTicket) {
      // Extraer el número de secuencia del último ticket
      const parts = lastTicket.ticketNumber.split('-');
      const lastSequence = parseInt(parts[parts.length - 1]);
      sequence = lastSequence + 1;
    }

    // Formatear con ceros a la izquierda (3 dígitos)
    const ticketNumber = `${prefix}-${sequence.toString().padStart(3, '0')}`;
    
    return ticketNumber;
  }

  /**
   * Crea un nuevo ticket
   */
  async createTicket(data: CreateTicketData) {
    try {
      // 1. Validar que el formulario existe y está activo
      const form = await prisma.ticketForm.findUnique({
        where: { id: data.formId },
        include: {
          fields: {
            where: { isVisible: true },
            include: {
              fieldType: true,
              options: true
            }
          }
        }
      });

      if (!form) {
        throw new Error('Formulario no encontrado');
      }

      if (form.status !== 'ACTIVE') {
        throw new Error('El formulario no está activo');
      }

      // 2. Sanitizar form_data
      const sanitizedFormData = sanitizationService.sanitizeFormData(data.formData);

      // 3. Validar form_data contra el schema del formulario
      const validation = await formValidationService.validateFormData(
        data.formId,
        sanitizedFormData
      );

      if (!validation.isValid) {
        const errorMessages = Object.entries(validation.errors)
          .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
          .join('; ');
        throw new Error(`Errores de validación: ${errorMessages}`);
      }

      // 4. Generar número de ticket
      const ticketNumber = await this.generateTicketNumber(data.departmentId);

      // 5. Calcular SLA deadline según prioridad
      const departmentSLA = await prisma.departmentSLA.findFirst({
        where: {
          departmentId: data.departmentId,
          priority: data.priority as any // Cast necesario porque TicketPriority y SLAPriority son el mismo enum
        },
        include: {
          slaConfiguration: true
        }
      });

      let slaDeadline: Date | null = null;
      if (departmentSLA) {
        const slaResult = await slaDeadlineService.calculateSLADeadline({
          slaConfigurationId: departmentSLA.slaConfigurationId
        });
        slaDeadline = slaResult.resolutionDeadline;
      }

      // 6. Crear el ticket en una transacción
      const ticket = await prisma.$transaction(async (tx) => {
        // Crear ticket
        const newTicket = await tx.ticket.create({
          data: {
            ticketNumber,
            departmentId: data.departmentId,
            formId: data.formId,
            requesterId: data.requesterId,
            title: data.title,
            priority: data.priority,
            status: TicketStatus.NEW,
            formData: sanitizedFormData as Prisma.InputJsonValue,
            slaDeadline,
            slaExceeded: false
          },
          include: {
            department: {
              select: {
                id: true,
                name: true,
                prefix: true
              }
            },
            form: {
              select: {
                id: true,
                name: true
              }
            },
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true
              }
            }
          }
        });

        // Registrar en audit_logs
        await tx.auditLog.create({
          data: {
            userId: data.requesterId,
            action: 'CREATE_TICKET',
            resource: 'ticket',
            resourceId: newTicket.id,
            details: {
              ticketNumber: newTicket.ticketNumber,
              title: newTicket.title,
              priority: newTicket.priority,
              departmentId: newTicket.departmentId,
              formId: newTicket.formId
            },
            status: 'success'
          }
        });

        return newTicket;
      });

      logger.info(`Ticket creado: ${ticketNumber} por usuario ${data.requesterId}`);

      return ticket;
    } catch (error) {
      logger.error('Error creando ticket:', error);
      throw error;
    }
  }

  /**
   * Obtiene un ticket por ID
   */
  async getTicketById(ticketId: string, userId: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            prefix: true
          }
        },
        form: {
          select: {
            id: true,
            name: true,
            fields: {
              where: { isVisible: true },
              include: {
                fieldType: true,
                options: true
              },
              orderBy: { order: 'asc' }
            }
          }
        },
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
        }
      }
    });

    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }

    // Obtener historial de audit_logs
    const history = await prisma.auditLog.findMany({
      where: {
        resource: 'ticket',
        resourceId: ticketId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profilePicture: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Verificar permisos (el solicitante, asignado, o admin del departamento pueden ver)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        roleType: true,
        departmentId: true,
        departmentRole: true
      }
    });

    const canView = 
      ticket.requesterId === userId ||
      ticket.assignedToId === userId ||
      user?.roleType === 'SUPER_ADMIN' ||
      (user?.departmentId === ticket.departmentId && user?.departmentRole === 'ADMIN');

    if (!canView) {
      throw new Error('No tienes permisos para ver este ticket');
    }

    return {
      ...ticket,
      history
    };
  }

  /**
   * Lista tickets con filtros y paginación
   */
  async listTickets(params: {
    userId: string;
    departmentId?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    assignedToId?: string;
    requesterId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      userId,
      departmentId,
      status,
      priority,
      assignedToId,
      requesterId,
      search,
      page = 1,
      limit = 20
    } = params;

    // Obtener usuario para verificar permisos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        roleType: true,
        departmentId: true,
        departmentRole: true
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Construir filtros según rol
    const where: Prisma.TicketWhereInput = {
      deletedAt: null
    };

    // Filtros de permisos
    if (user.roleType === 'REQUESTER') {
      // Solicitantes solo ven sus propios tickets
      where.requesterId = userId;
    } else if (user.roleType === 'SUBORDINATE') {
      // Subordinados ven tickets asignados a ellos o del departamento
      where.OR = [
        { assignedToId: userId },
        { departmentId: user.departmentId || '' }
      ];
    } else if (user.roleType === 'DEPT_ADMIN') {
      // Admins de departamento ven todos los tickets de su departamento
      where.departmentId = user.departmentId || '';
    }
    // SUPER_ADMIN ve todos (no agregar filtro)

    // Filtros adicionales
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
    if (requesterId) where.requesterId = requesterId;
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Paginación
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              prefix: true
            }
          },
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
              profilePicture: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.ticket.count({ where })
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Actualiza un ticket
   */
  async updateTicket(ticketId: string, userId: string, data: UpdateTicketData) {
    // Verificar permisos
    const ticket = await this.getTicketById(ticketId, userId);

    const updates: Prisma.TicketUpdateInput = {};
    const historyEntries: Array<{
      action: string;
      field?: string;
      oldValue?: string;
      newValue?: string;
    }> = [];

    if (data.title && data.title !== ticket.title) {
      updates.title = data.title;
      historyEntries.push({
        action: 'TITLE_CHANGED',
        field: 'title',
        oldValue: ticket.title,
        newValue: data.title
      });
    }

    if (data.status && data.status !== ticket.status) {
      updates.status = data.status;
      historyEntries.push({
        action: 'STATUS_CHANGED',
        field: 'status',
        oldValue: ticket.status,
        newValue: data.status
      });

      // Si se marca como resuelto, guardar fecha
      if (data.status === TicketStatus.RESOLVED) {
        updates.resolvedAt = new Date();
      }

      // Si se marca como cerrado, guardar fecha
      if (data.status === TicketStatus.CLOSED) {
        updates.closedAt = new Date();
      }
    }

    if (data.priority && data.priority !== ticket.priority) {
      updates.priority = data.priority;
      historyEntries.push({
        action: 'PRIORITY_CHANGED',
        field: 'priority',
        oldValue: ticket.priority,
        newValue: data.priority
      });

      // Recalcular SLA si cambia la prioridad
      const newDepartmentSLA = await prisma.departmentSLA.findFirst({
        where: {
          departmentId: ticket.departmentId,
          priority: data.priority as any // Cast necesario porque TicketPriority y SLAPriority son el mismo enum
        }
      });

      if (newDepartmentSLA) {
        const newSlaResult = await slaDeadlineService.calculateSLADeadline({
          slaConfigurationId: newDepartmentSLA.slaConfigurationId
        });
        updates.slaDeadline = newSlaResult.resolutionDeadline;
      }
    }

    if (data.assignedToId !== undefined && data.assignedToId !== ticket.assignedToId) {
      updates.assignedTo = data.assignedToId 
        ? { connect: { id: data.assignedToId } }
        : { disconnect: true };
      
      historyEntries.push({
        action: 'ASSIGNED',
        field: 'assignedToId',
        oldValue: ticket.assignedToId || 'null',
        newValue: data.assignedToId || 'null'
      });

      // Cambiar estado a ASSIGNED si se asigna por primera vez
      if (data.assignedToId && ticket.status === TicketStatus.NEW) {
        updates.status = TicketStatus.ASSIGNED;
      }
    }

    if (data.formData) {
      const sanitizedFormData = sanitizationService.sanitizeFormData(data.formData);
      updates.formData = sanitizedFormData as Prisma.InputJsonValue;
      historyEntries.push({
        action: 'FORM_DATA_UPDATED',
        field: 'formData'
      });
    }

    // Actualizar en transacción
    const updatedTicket = await prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: updates,
        include: {
          department: true,
          form: true,
          requester: true,
          assignedTo: true
        }
      });

      // Registrar cambios en audit_logs
      for (const entry of historyEntries) {
        await tx.auditLog.create({
          data: {
            userId,
            action: entry.action,
            resource: 'ticket',
            resourceId: ticketId,
            details: {
              field: entry.field,
              oldValue: entry.oldValue,
              newValue: entry.newValue,
              ticketNumber: ticket.ticketNumber
            },
            status: 'success'
          }
        });
      }

      return updated;
    });

    logger.info(`Ticket ${ticket.ticketNumber} actualizado por usuario ${userId}`);

    return updatedTicket;
  }
}

export const ticketsService = new TicketsService();
