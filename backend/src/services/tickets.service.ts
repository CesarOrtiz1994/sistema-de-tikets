import prisma from '../config/database';
import { TicketStatus, TicketPriority, Prisma } from '@prisma/client';
import { formValidationService } from './formValidation.service';
import { sanitizationService } from './sanitization.service';
import slaDeadlineService from './slaDeadline.service';
import departmentSLAService from './departmentSLA.service';
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
  waitingReason?: string;
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

      // 2. Construir mapa de opciones válidas para campos de selección
      const fieldOptionsMap: Record<string, string[]> = {};
      for (const field of form.fields) {
        const fieldTypeName = field.fieldType.name.toUpperCase();
        // Solo para campos de selección (SELECT, MULTISELECT, RADIO, CHECKBOX)
        if (['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX'].includes(fieldTypeName)) {
          if (field.options && field.options.length > 0) {
            fieldOptionsMap[field.id] = field.options.map(opt => opt.value);
          }
        }
      }

      // 3. Sanitizar form_data (sin escapar valores de campos selection)
      const sanitizedFormData = sanitizationService.sanitizeFormData(data.formData, fieldOptionsMap);

      // 4. Validar form_data contra el schema del formulario
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
      // Busca SLA del departamento o usa SLA global de la misma prioridad
      const slaConfig = await departmentSLAService.getSLAForDepartmentAndPriority(
        data.departmentId,
        data.priority as any // Cast necesario porque TicketPriority y SLAPriority son el mismo enum
      );

      let slaDeadline: Date | null = null;
      let slaStartTime: Date | null = null;
      let createdOutsideBusinessHours = false;
      
      if (slaConfig) {
        const slaConfigId = (slaConfig as any).sla_configuration_id || (slaConfig as any).id;
        const slaResult = await slaDeadlineService.calculateSLADeadline({
          slaConfigurationId: slaConfigId,
          departmentId: data.departmentId
        });
        slaDeadline = slaResult.resolutionDeadline;
        slaStartTime = slaResult.slaStartTime;
        createdOutsideBusinessHours = slaResult.createdOutsideBusinessHours;
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
            slaStartTime,
            createdOutsideBusinessHours,
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
            prefix: true,
            requireRating: true,
            requireDeliverable: true
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
        },
        rating: {
          select: {
            id: true,
            rating: true,
            comment: true,
            ratedBy: true,
            ratedAt: true
          }
        }
      }
    });

    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }

    if (ticket.deletedAt) {
      throw new Error('Ticket eliminado');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        roleType: true,
        departmentUsers: {
          select: {
            departmentId: true,
            role: true
          }
        }
      }
    });

    // Verificar si el usuario tiene acceso al departamento del ticket
    const hasAccessToDepartment = user?.departmentUsers.some(
      du => du.departmentId === ticket.departmentId
    );

    const canView =
      ticket.requesterId === userId ||
      ticket.assignedToId === userId ||
      user?.roleType === 'SUPER_ADMIN' ||
      hasAccessToDepartment;

    if (!canView) {
      throw new Error('No tienes permisos para ver este ticket');
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
        departmentUsers: {
          select: {
            departmentId: true,
            role: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener todos los departamentos donde el usuario es ADMIN
    const adminDepartmentIds = user.departmentUsers
      .filter(du => du.role === 'ADMIN')
      .map(du => du.departmentId);

    // Obtener todos los departamentos donde el usuario es MEMBER (para SUBORDINATE)
    const memberDepartmentIds = user.departmentUsers
      .filter(du => du.role === 'MEMBER')
      .map(du => du.departmentId);

    // Log para depuración
    logger.info('Filtrado de tickets para usuario:', {
      userId: user.id,
      roleType: user.roleType,
      adminDepartmentIds,
      memberDepartmentIds,
      requestedDepartmentId: departmentId
    });

    // Construir filtros según rol
    const where: Prisma.TicketWhereInput = {
      deletedAt: null
    };

    // Determinar si el usuario es administrador de departamento
    const isDeptAdmin = user.roleType === 'DEPT_ADMIN' || adminDepartmentIds.length > 0;

    // Si se envía requesterId explícitamente, usarlo (para "Mis Tickets")
    // Esto permite que cualquier rol vea solo sus propios tickets creados
    if (requesterId) {
      where.requesterId = requesterId;
    } else {
      // Filtros de permisos por defecto (para otras vistas)
      if (user.roleType === 'REQUESTER') {
        // Solicitantes solo ven sus propios tickets
        where.requesterId = userId;
      } else if (user.roleType === 'SUBORDINATE') {
        // Subordinados ven tickets asignados a ellos o de sus departamentos
        const deptIds = [...adminDepartmentIds, ...memberDepartmentIds];
        if (deptIds.length > 0) {
          where.OR = [
            { assignedToId: userId },
            { departmentId: { in: deptIds } }
          ];
        } else {
          // Si no tiene departamentos, solo ve tickets asignados a él
          where.assignedToId = userId;
        }
      } else if (isDeptAdmin && adminDepartmentIds.length > 0) {
        // Admins de departamento ven tickets de TODOS sus departamentos asignados
        // Si se especifica un departmentId, verificar que sea uno de sus departamentos
        if (departmentId) {
          if (adminDepartmentIds.includes(departmentId)) {
            where.departmentId = departmentId;
          } else {
            // Si intenta acceder a un departamento que no le pertenece, no mostrar nada
            where.departmentId = 'invalid-department-id';
          }
        } else {
          // Si no se especifica departamento, mostrar tickets de TODOS sus departamentos
          where.departmentId = { in: adminDepartmentIds };
        }
      }
      // SUPER_ADMIN ve todos (no agregar filtro)
    }

    // Filtros adicionales (solo para SUPER_ADMIN)
    if (departmentId && user.roleType === 'SUPER_ADMIN') {
      where.departmentId = departmentId;
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;
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

    // Obtener información del usuario para validaciones
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleType: true }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

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
      // Validaciones de transiciones para SUBORDINADOS
      if (user.roleType === 'SUBORDINATE') {
        const currentStatus = ticket.status;
        const newStatus = data.status;

        // Validación: NO pueden cambiar a NEW
        if (newStatus === TicketStatus.NEW) {
          throw new Error('No tienes permisos para cambiar el ticket a estado Nuevo');
        }

        // Validación: ASSIGNED solo puede ir a IN_PROGRESS
        if (currentStatus === TicketStatus.ASSIGNED) {
          if (newStatus !== TicketStatus.IN_PROGRESS) {
            throw new Error('Desde Asignado solo puedes cambiar a En Progreso. Primero debes empezar a trabajar en el ticket.');
          }
        }

        // Validación: IN_PROGRESS no puede regresar a ASSIGNED
        if (currentStatus === TicketStatus.IN_PROGRESS) {
          if (newStatus === TicketStatus.ASSIGNED) {
            throw new Error('No puedes regresar un ticket de En Progreso a Asignado. Si necesitas pausarlo, usa el estado Esperando.');
          }
        }

        // Validación: WAITING solo puede ir a IN_PROGRESS
        if (currentStatus === TicketStatus.WAITING) {
          if (newStatus !== TicketStatus.IN_PROGRESS) {
            throw new Error('Desde Esperando solo puedes cambiar a En Progreso para continuar trabajando en el ticket.');
          }
        }

        // Validación: RESOLVED solo puede regresar a IN_PROGRESS
        if (currentStatus === TicketStatus.RESOLVED) {
          if (newStatus !== TicketStatus.IN_PROGRESS) {
            throw new Error('Desde Resuelto solo puedes cambiar a En Progreso si necesitas trabajar nuevamente en el ticket.');
          }
        }
      }

      // Validación: Si el departamento requiere entregable, verificar antes de marcar como RESOLVED
      if (data.status === TicketStatus.RESOLVED && (ticket.department as any)?.requireDeliverable) {
        const approvedDeliverable = await prisma.ticketDeliverable.findFirst({
          where: {
            ticketId,
            status: 'APPROVED'
          }
        });

        if (!approvedDeliverable) {
          // Verificar si hay al menos un entregable pendiente
          const pendingDeliverable = await prisma.ticketDeliverable.findFirst({
            where: {
              ticketId,
              status: 'PENDING'
            }
          });

          if (!pendingDeliverable) {
            throw new Error('Este departamento requiere que subas un entregable antes de resolver el ticket. Ve a la pestaña de Entregables para subir tu archivo.');
          }
        }
      }

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

      // === LÓGICA DE PAUSA/REANUDACIÓN DE SLA ===
      
      // Si cambia A WAITING: pausar el SLA y guardar motivo
      if (data.status === TicketStatus.WAITING && ticket.status !== TicketStatus.WAITING) {
        if (data.waitingReason) {
          updates.waitingReason = data.waitingReason;
        }
        updates.slaPausedAt = new Date();
        historyEntries.push({
          action: 'SLA_PAUSED',
          field: 'slaPausedAt',
          newValue: 'SLA pausado - ticket en espera'
        });
      }

      // Si cambia DESDE WAITING a otro estado: reanudar el SLA y limpiar motivo
      if (ticket.status === TicketStatus.WAITING && data.status !== TicketStatus.WAITING) {
        updates.waitingReason = null;
        if (ticket.slaPausedAt) {
          // Calcular cuántos minutos estuvo pausado
          const pausedDuration = Math.floor(
            (new Date().getTime() - new Date(ticket.slaPausedAt).getTime()) / (1000 * 60)
          );
          
          // Acumular el tiempo pausado
          const totalPausedMinutes = (ticket.slaTotalPausedMinutes || 0) + pausedDuration;
          updates.slaTotalPausedMinutes = totalPausedMinutes;
          
          // Extender el deadline sumando el tiempo pausado
          if (ticket.slaDeadline) {
            const newDeadline = new Date(ticket.slaDeadline);
            newDeadline.setMinutes(newDeadline.getMinutes() + pausedDuration);
            updates.slaDeadline = newDeadline;
          }
          
          // Limpiar la fecha de pausa
          updates.slaPausedAt = null;
          
          historyEntries.push({
            action: 'SLA_RESUMED',
            field: 'slaPausedAt',
            oldValue: `Pausado ${pausedDuration} minutos`,
            newValue: 'SLA reanudado'
          });
        }
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
      // Busca SLA del departamento o usa SLA global de la misma prioridad
      const newSlaConfig = await departmentSLAService.getSLAForDepartmentAndPriority(
        ticket.departmentId,
        data.priority as any // Cast necesario porque TicketPriority y SLAPriority son el mismo enum
      );

      if (newSlaConfig) {
        const slaConfigId = (newSlaConfig as any).sla_configuration_id || (newSlaConfig as any).id;
        const newSlaResult = await slaDeadlineService.calculateSLADeadline({
          slaConfigurationId: slaConfigId,
          departmentId: ticket.departmentId
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
      // Obtener el formulario con sus campos y opciones
      const form = await prisma.ticketForm.findUnique({
        where: { id: ticket.formId },
        include: {
          fields: {
            include: {
              fieldType: true,
              options: true
            }
          }
        }
      });

      // Construir mapa de opciones válidas para campos de selección
      const fieldOptionsMap: Record<string, string[]> = {};
      if (form) {
        for (const field of form.fields) {
          const fieldTypeName = field.fieldType.name.toUpperCase();
          if (['SELECT', 'MULTISELECT', 'RADIO', 'CHECKBOX'].includes(fieldTypeName)) {
            if (field.options && field.options.length > 0) {
              fieldOptionsMap[field.id] = field.options.map(opt => opt.value);
            }
          }
        }
      }

      const sanitizedFormData = sanitizationService.sanitizeFormData(data.formData, fieldOptionsMap);
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
