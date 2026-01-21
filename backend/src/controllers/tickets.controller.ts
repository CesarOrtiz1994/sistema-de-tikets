import { Request, Response, NextFunction } from 'express';
import { ticketsService } from '../services/tickets.service';
import logger from '../config/logger';

class TicketsController {
  /**
   * POST /api/tickets
   * Crear un nuevo ticket
   */
  async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { departmentId, formId, title, priority, formData } = req.body;

      const ticket = await ticketsService.createTicket({
        departmentId,
        formId,
        requesterId: userId,
        title,
        priority,
        formData
      });

      res.status(201).json({
        success: true,
        message: 'Ticket creado exitosamente',
        data: ticket
      });
    } catch (error: any) {
      logger.error('Error en createTicket:', error);
      next(error);
    }
  }

  /**
   * GET /api/tickets/:id
   * Obtener un ticket por ID
   */
  async getTicketById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const ticket = await ticketsService.getTicketById(id, userId);

      res.json({
        success: true,
        data: ticket
      });
    } catch (error: any) {
      logger.error('Error en getTicketById:', error);
      next(error);
    }
  }

  /**
   * GET /api/tickets
   * Listar tickets con filtros
   */
  async listTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const {
        departmentId,
        status,
        priority,
        assignedToId,
        requesterId,
        search,
        page,
        limit
      } = req.query;

      const result = await ticketsService.listTickets({
        userId,
        departmentId: departmentId as string,
        status: status as any,
        priority: priority as any,
        assignedToId: assignedToId as string,
        requesterId: requesterId as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({
        success: true,
        data: result.tickets,
        pagination: result.pagination
      });
    } catch (error: any) {
      logger.error('Error en listTickets:', error);
      next(error);
    }
  }

  /**
   * PUT /api/tickets/:id
   * Actualizar un ticket
   */
  async updateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const updateData = req.body;

      const ticket = await ticketsService.updateTicket(id, userId, updateData);

      res.json({
        success: true,
        message: 'Ticket actualizado exitosamente',
        data: ticket
      });
    } catch (error: any) {
      logger.error('Error en updateTicket:', error);
      next(error);
    }
  }

  /**
   * PUT /api/tickets/:id/assign
   * Asignar ticket a un usuario
   */
  async assignTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { assignedToId } = req.body;

      const ticket = await ticketsService.updateTicket(id, userId, {
        assignedToId
      });

      res.json({
        success: true,
        message: 'Ticket asignado exitosamente',
        data: ticket
      });
    } catch (error: any) {
      logger.error('Error en assignTicket:', error);
      next(error);
    }
  }

  /**
   * PUT /api/tickets/:id/status
   * Cambiar estado del ticket
   */
  async changeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { status } = req.body;

      const ticket = await ticketsService.updateTicket(id, userId, {
        status
      });

      res.json({
        success: true,
        message: 'Estado del ticket actualizado',
        data: ticket
      });
    } catch (error: any) {
      logger.error('Error en changeStatus:', error);
      next(error);
    }
  }

  /**
   * PUT /api/tickets/:id/priority
   * Cambiar prioridad del ticket
   */
  async changePriority(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { priority } = req.body;

      const ticket = await ticketsService.updateTicket(id, userId, {
        priority
      });

      res.json({
        success: true,
        message: 'Prioridad del ticket actualizada',
        data: ticket
      });
    } catch (error: any) {
      logger.error('Error en changePriority:', error);
      next(error);
    }
  }
}

export default new TicketsController();
