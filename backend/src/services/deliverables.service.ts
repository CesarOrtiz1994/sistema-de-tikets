import prisma from '../config/database';
import { DeliverableStatus, TicketStatus } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';

export class DeliverablesService {
  /**
   * Subir un entregable para un ticket
   */
  async uploadDeliverable(
    ticketId: string,
    userId: string,
    file: Express.Multer.File
  ) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        department: true,
        assignments: {
          include: {
            user: true
          }
        }
      }
    });

    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }

    if (!ticket.department.requireDeliverable) {
      throw new Error('Este departamento no requiere entregables');
    }

    const isAssigned = ticket.assignments.some(a => a.userId === userId);
    if (!isAssigned) {
      throw new Error('Solo los agentes asignados pueden subir el entregable');
    }

    const allowedStatuses: string[] = ['IN_PROGRESS', 'WAITING', 'RESOLVED'];
    if (!allowedStatuses.includes(ticket.status)) {
      throw new Error('Solo puedes subir entregables cuando el ticket está en progreso, en espera o resuelto');
    }

    if (ticket.deliverableRejections >= ticket.department.maxDeliverableRejections) {
      throw new Error(`Has excedido el límite de ${ticket.department.maxDeliverableRejections} rechazos. El ticket debe cerrarse.`);
    }

    // Crear directorio para entregables si no existe
    const deliverableDir = path.join(process.cwd(), 'uploads', 'deliverables', ticketId);
    await fs.mkdir(deliverableDir, { recursive: true });

    // Mover archivo al directorio de entregables
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(deliverableDir, fileName);
    await fs.writeFile(filePath, file.buffer);

    // Crear registro del entregable
    const deliverable = await prisma.ticketDeliverable.create({
      data: {
        ticketId,
        uploadedById: userId,
        fileUrl: `/uploads/deliverables/${ticketId}/${fileName}`,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        status: DeliverableStatus.PENDING
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return deliverable;
  }

  /**
   * Aprobar un entregable (solo solicitante)
   */
  async approveDeliverable(
    deliverableId: string,
    userId: string
  ) {
    const deliverable = await prisma.ticketDeliverable.findUnique({
      where: { id: deliverableId },
      include: {
        ticket: {
          include: {
            requester: true,
            department: true
          }
        }
      }
    });

    if (!deliverable) {
      throw new Error('Entregable no encontrado');
    }

    if (deliverable.ticket.requesterId !== userId) {
      throw new Error('Solo el solicitante puede aprobar el entregable');
    }

    if (deliverable.status !== DeliverableStatus.PENDING) {
      throw new Error('Este entregable ya fue revisado');
    }

    // Actualizar el entregable a APPROVED
    const updatedDeliverable = await prisma.ticketDeliverable.update({
      where: { id: deliverableId },
      data: {
        status: DeliverableStatus.APPROVED,
        reviewedById: userId,
        reviewedAt: new Date()
      }
    });

    return updatedDeliverable;
  }

  /**
   * Rechazar un entregable (solo solicitante)
   * Si excede el límite de rechazos, cierra el ticket y crea uno nuevo de seguimiento
   */
  async rejectDeliverable(
    deliverableId: string,
    userId: string,
    rejectionReason: string
  ) {
    const deliverable = await prisma.ticketDeliverable.findUnique({
      where: { id: deliverableId },
      include: {
        ticket: {
          include: {
            requester: true,
            department: true,
            assignments: {
              include: {
                user: true
              }
            },
            form: true
          }
        }
      }
    });

    if (!deliverable) {
      throw new Error('Entregable no encontrado');
    }

    if (deliverable.ticket.requesterId !== userId) {
      throw new Error('Solo el solicitante puede rechazar el entregable');
    }

    if (deliverable.status !== DeliverableStatus.PENDING) {
      throw new Error('Este entregable ya fue revisado');
    }

    const ticket = deliverable.ticket;
    const newRejectionCount = ticket.deliverableRejections + 1;
    const maxRejections = ticket.department.maxDeliverableRejections;
    const exceededLimit = newRejectionCount >= maxRejections;

    // Usar transacción para asegurar consistencia
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar el entregable a REJECTED
      const updatedDeliverable = await tx.ticketDeliverable.update({
        where: { id: deliverableId },
        data: {
          status: DeliverableStatus.REJECTED,
          rejectionReason,
          reviewedById: userId,
          reviewedAt: new Date()
        }
      });

      // 2. Incrementar contador de rechazos
      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          deliverableRejections: newRejectionCount,
          status: exceededLimit ? TicketStatus.CLOSED : TicketStatus.IN_PROGRESS,
          closedAt: exceededLimit ? new Date() : null
        }
      });

      let followUpTicket = null;

      // 3. Si excedió el límite, crear ticket de seguimiento
      if (exceededLimit) {
        // Generar número de ticket para el seguimiento
        const lastTicket = await tx.ticket.findFirst({
          where: { departmentId: ticket.departmentId },
          orderBy: { createdAt: 'desc' },
          select: { ticketNumber: true }
        });

        const prefix = ticket.department.prefix;
        const lastNumber = lastTicket
          ? parseInt(lastTicket.ticketNumber.split('-')[1])
          : 0;
        const newTicketNumber = `${prefix}-${String(lastNumber + 1).padStart(5, '0')}`;

        // Crear nuevo ticket de seguimiento
        followUpTicket = await tx.ticket.create({
          data: {
            ticketNumber: newTicketNumber,
            departmentId: ticket.departmentId,
            formId: ticket.formId,
            requesterId: ticket.requesterId,
            parentTicketId: ticket.id,
            title: `Seguimiento: ${ticket.title}`,
            priority: ticket.priority,
            status: TicketStatus.NEW,
            formData: ticket.formData as any
          },
          include: {
            department: true,
            requester: true,
            assignments: {
              include: {
                user: true
              }
            }
          }
        });
      }

      return {
        deliverable: updatedDeliverable,
        ticket: updatedTicket,
        followUpTicket,
        exceededLimit,
        rejectionCount: newRejectionCount,
        maxRejections
      };
    });

    return result;
  }

  /**
   * Obtener entregables de un ticket
   */
  async getTicketDeliverables(ticketId: string, userId: string) {
    // Verificar acceso al ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        requesterId: true,
        departmentId: true,
        assignments: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!ticket) {
      throw new Error('Ticket no encontrado');
    }

    // Verificar que el usuario tiene acceso al ticket
    const isAssigned = ticket.assignments.some(a => a.userId === userId);
    const hasAccess =
      ticket.requesterId === userId ||
      isAssigned ||
      (await this.userHasDepartmentAccess(userId, ticket.departmentId));

    if (!hasAccess) {
      throw new Error('No tienes acceso a este ticket');
    }

    const deliverables = await prisma.ticketDeliverable.findMany({
      where: { ticketId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return deliverables;
  }

  /**
   * Verificar si un usuario tiene acceso a un departamento
   */
  private async userHasDepartmentAccess(userId: string, departmentId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        departmentUsers: {
          where: { departmentId }
        }
      }
    });

    if (!user) {
      return false;
    }

    return (
      user.roleType === 'SUPER_ADMIN' ||
      (user.departmentUsers && user.departmentUsers.length > 0)
    );
  }
}

export const deliverablesService = new DeliverablesService();
