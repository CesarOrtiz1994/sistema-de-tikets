import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';
import { TicketStatus } from '@prisma/client';

class TicketRatingController {
  /**
   * PUT /api/tickets/:id/resolve
   * Marcar ticket como resuelto (solo el asignado o admin)
   */
  async resolveTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: { department: true }
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket no encontrado'
        });
      }

      // Verificar permisos: solo el asignado o admin pueden resolver
      const userRole = (req as any).user?.roleType;
      const isAssignee = ticket.assignedToId === userId;
      const isAdmin = userRole === 'SUPER_ADMIN' || userRole === 'DEPT_ADMIN';

      if (!isAssignee && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para resolver este ticket'
        });
      }

      // Actualizar ticket a RESOLVED
      const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: {
          status: TicketStatus.RESOLVED,
          resolvedAt: new Date()
        }
      });

      // Auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'RESOLVE_TICKET',
          resource: 'TICKET',
          resourceId: id,
          details: {
            ticketNumber: ticket.ticketNumber,
            previousStatus: ticket.status
          },
          status: 'SUCCESS',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });

      return res.json({
        success: true,
        data: updatedTicket,
        message: 'Ticket marcado como resuelto'
      });
    } catch (error: any) {
      logger.error('Error resolving ticket:', error);

      // Auditoría de error
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'RESOLVE_TICKET',
            resource: 'TICKET',
            resourceId: req.params.id,
            details: { error: error.message },
            status: 'ERROR',
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
          }
        }).catch(err => logger.error('Error creating audit log:', err));
      }

      return next(error);
    }
  }

  /**
   * POST /api/tickets/:id/rate
   * Calificar un ticket (solo el solicitante)
   */
  async rateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = (req as any).user?.id;

      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: { rating: true }
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket no encontrado'
        });
      }

      // Solo el solicitante puede calificar
      if (ticket.requesterId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Solo el solicitante puede calificar el ticket'
        });
      }

      // Verificar que el ticket esté resuelto o cerrado
      if (ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CLOSED) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden calificar tickets resueltos o cerrados'
        });
      }

      // Verificar si ya tiene calificación
      if (ticket.rating) {
        return res.status(400).json({
          success: false,
          message: 'Este ticket ya ha sido calificado'
        });
      }

      // Crear calificación
      const ticketRating = await prisma.ticketRating.create({
        data: {
          ticketId: id,
          rating,
          comment,
          ratedBy: userId
        }
      });

      // Auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'RATE_TICKET',
          resource: 'TICKET_RATING',
          resourceId: ticketRating.id,
          details: {
            ticketNumber: ticket.ticketNumber,
            rating,
            hasComment: !!comment
          },
          status: 'SUCCESS',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });

      return res.json({
        success: true,
        data: ticketRating,
        message: 'Calificación registrada exitosamente'
      });
    } catch (error: any) {
      logger.error('Error rating ticket:', error);

      // Auditoría de error
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'RATE_TICKET',
            resource: 'TICKET_RATING',
            resourceId: null,
            details: { error: error.message, ticketId: req.params.id },
            status: 'ERROR',
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
          }
        }).catch(err => logger.error('Error creating audit log:', err));
      }

      return next(error);
    }
  }

  /**
   * PUT /api/tickets/:id/close
   * Cerrar ticket con calificación (solo el solicitante)
   */
  async closeTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = (req as any).user?.id;

      const ticket = await prisma.ticket.findUnique({
        where: { id },
        include: { 
          rating: true,
          department: true
        }
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket no encontrado'
        });
      }

      // Solo el solicitante puede cerrar
      if (ticket.requesterId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Solo el solicitante puede cerrar el ticket'
        });
      }

      // Verificar que el ticket esté resuelto
      if (ticket.status !== TicketStatus.RESOLVED) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden cerrar tickets que estén en estado RESUELTO'
        });
      }

      // Verificar si el departamento requiere calificación
      const requiresRating = ticket.department.requireRating;

      // Si el departamento requiere calificación, validar que se proporcione
      if (requiresRating) {
        if (!rating) {
          return res.status(400).json({
            success: false,
            message: 'Este departamento requiere calificación para cerrar el ticket'
          });
        }

        // Crear calificación si no existe
        if (!ticket.rating) {
          await prisma.ticketRating.create({
            data: {
              ticketId: id,
              rating,
              comment,
              ratedBy: userId
            }
          });
        }
      }

      // Cerrar ticket
      const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: {
          status: TicketStatus.CLOSED,
          closedAt: new Date()
        },
        include: {
          rating: true
        }
      });

      // Auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CLOSE_TICKET',
          resource: 'TICKET',
          resourceId: id,
          details: {
            ticketNumber: ticket.ticketNumber,
            rating: rating || null,
            hasComment: !!comment,
            requiresRating
          },
          status: 'SUCCESS',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });

      return res.json({
        success: true,
        data: updatedTicket,
        message: 'Ticket cerrado exitosamente'
      });
    } catch (error: any) {
      logger.error('Error closing ticket:', error);

      // Auditoría de error
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'CLOSE_TICKET',
            resource: 'TICKET',
            resourceId: req.params.id,
            details: { error: error.message },
            status: 'ERROR',
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
          }
        }).catch(err => logger.error('Error creating audit log:', err));
      }

      return next(error);
    }
  }

  /**
   * POST /api/tickets/:id/reopen
   * Reabrir un ticket cerrado (solo el solicitante)
   */
  async reopenTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      const ticket = await prisma.ticket.findUnique({
        where: { id }
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Ticket no encontrado'
        });
      }

      // Solo el solicitante puede reabrir
      if (ticket.requesterId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Solo el solicitante puede reabrir el ticket'
        });
      }

      // Solo se pueden reabrir tickets cerrados
      if (ticket.status !== TicketStatus.CLOSED) {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden reabrir tickets cerrados'
        });
      }

      // Reabrir ticket
      const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: {
          status: TicketStatus.IN_PROGRESS,
          closedAt: null
        }
      });

      // Auditoría
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'REOPEN_TICKET',
          resource: 'TICKET',
          resourceId: id,
          details: {
            ticketNumber: ticket.ticketNumber,
            reason
          },
          status: 'SUCCESS',
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });

      return res.json({
        success: true,
        data: updatedTicket,
        message: 'Ticket reabierto exitosamente'
      });
    } catch (error: any) {
      logger.error('Error reopening ticket:', error);

      // Auditoría de error
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'REOPEN_TICKET',
            resource: 'TICKET',
            resourceId: req.params.id,
            details: { error: error.message },
            status: 'ERROR',
            ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.get('user-agent') || 'unknown'
          }
        }).catch(err => logger.error('Error creating audit log:', err));
      }

      return next(error);
    }
  }
}

export default new TicketRatingController();
