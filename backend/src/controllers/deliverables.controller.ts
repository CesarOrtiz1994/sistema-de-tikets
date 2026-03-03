import { Request, Response } from 'express';
import { deliverablesService } from '../services/deliverables.service';
import prisma from '../config/database';
import {
  notifyDeliverableUploaded,
  notifyDeliverableApproved,
  notifyDeliverableRejected
} from '../services/notificationTriggers.service';
import logger from '../config/logger';

export class DeliverablesController {
  /**
   * POST /api/tickets/:ticketId/deliverables
   * Subir un entregable
   */
  async uploadDeliverable(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { ticketId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No se proporcionó ningún archivo'
        });
      }

      const deliverable = await deliverablesService.uploadDeliverable(
        ticketId,
        userId,
        file
      );

      // Notificar al solicitante
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, ticketNumber: true, title: true, requesterId: true }
      });
      if (ticket) {
        notifyDeliverableUploaded(
          ticket,
          deliverable.fileName,
          deliverable.uploadedBy.name,
          deliverable.fileUrl
        ).catch(err => logger.error('Error sending deliverable uploaded notification:', err));
      }

      return res.json({
        success: true,
        message: 'Entregable subido exitosamente',
        data: deliverable
      });
    } catch (error: any) {
      logger.error('Error en uploadDeliverable:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al subir el entregable'
      });
    }
  }

  /**
   * POST /api/deliverables/:id/approve
   * Aprobar un entregable
   */
  async approveDeliverable(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const deliverable = await deliverablesService.approveDeliverable(id, userId);

      // Notificar al subordinado asignado
      const approvedTicket = await prisma.ticket.findFirst({
        where: { deliverables: { some: { id } } },
        select: { id: true, ticketNumber: true, assignedToId: true }
      });
      if (approvedTicket) {
        notifyDeliverableApproved(approvedTicket).catch(err =>
          logger.error('Error sending deliverable approved notification:', err)
        );
      }

      return res.json({
        success: true,
        message: 'Entregable aprobado exitosamente',
        data: deliverable
      });
    } catch (error: any) {
      logger.error('Error en approveDeliverable:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al aprobar el entregable'
      });
    }
  }

  /**
   * POST /api/deliverables/:id/reject
   * Rechazar un entregable
   */
  async rejectDeliverable(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason || rejectionReason.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Debes proporcionar una razón para el rechazo'
        });
      }

      const result = await deliverablesService.rejectDeliverable(
        id,
        userId,
        rejectionReason
      );

      // Notificar al subordinado asignado
      const rejectedTicket = await prisma.ticket.findFirst({
        where: { deliverables: { some: { id } } },
        select: { id: true, ticketNumber: true, title: true, assignedToId: true }
      });
      if (rejectedTicket) {
        notifyDeliverableRejected(
          rejectedTicket,
          rejectionReason,
          result.maxRejections - result.rejectionCount
        ).catch(err => logger.error('Error sending deliverable rejected notification:', err));
      }

      return res.json({
        success: true,
        message: result.exceededLimit
          ? `Entregable rechazado. Se ha excedido el límite de ${result.maxRejections} rechazos. El ticket se ha cerrado y se creó un nuevo ticket de seguimiento: ${result.followUpTicket?.ticketNumber}`
          : `Entregable rechazado. El ticket ha regresado a En Progreso. Rechazos: ${result.rejectionCount}/${result.maxRejections}`,
        data: result
      });
    } catch (error: any) {
      logger.error('Error en rejectDeliverable:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al rechazar el entregable'
      });
    }
  }

  /**
   * GET /api/tickets/:ticketId/deliverables
   * Obtener entregables de un ticket
   */
  async getTicketDeliverables(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { ticketId } = req.params;

      const deliverables = await deliverablesService.getTicketDeliverables(
        ticketId,
        userId
      );

      return res.json({
        success: true,
        data: deliverables
      });
    } catch (error: any) {
      logger.error('Error en getTicketDeliverables:', error);
      return res.status(400).json({
        success: false,
        error: error.message || 'Error al obtener los entregables'
      });
    }
  }
}

export const deliverablesController = new DeliverablesController();
