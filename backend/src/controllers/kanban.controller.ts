import { Request, Response } from 'express';
import { z } from 'zod';
import kanbanService from '../services/kanban.service';
import prisma from '../config/database';
import { notifyTicketAssigned } from '../services/notificationTriggers.service';
import logger from '../config/logger';

// Validación Zod para filtros del Kanban
const kanbanFiltersSchema = z.object({
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedToId: z.string().uuid().optional(),
  onlyMine: z.string().transform(val => val === 'true').optional()
});

// Validación Zod para asignación rápida
const quickAssignSchema = z.object({
  assignedToId: z.string().uuid().nullable()
});

/**
 * Obtiene el tablero Kanban de un departamento
 * GET /api/departments/:id/kanban
 */
export const getDepartmentKanban = async (req: Request, res: Response) => {
  try {
    const { id: departmentId } = req.params;
    const userId = (req as any).user.id;

    // Validar UUID del departamento
    const uuidSchema = z.string().uuid();
    const validatedDepartmentId = uuidSchema.parse(departmentId);

    // Validar filtros
    const filters = kanbanFiltersSchema.parse(req.query);

    const kanbanData = await kanbanService.getDepartmentKanban(
      validatedDepartmentId,
      userId,
      filters
    );

    return res.json({
      success: true,
      data: kanbanData
    });
  } catch (error: any) {
    logger.error('Error getting kanban board:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.issues
      });
    }

    if (error.message.includes('permisos')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al obtener el tablero Kanban',
      error: error.message
    });
  }
};

/**
 * Obtiene el tablero Kanban de todos los departamentos del usuario
 * GET /api/kanban/all
 */
export const getAllDepartmentsKanban = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const filters = kanbanFiltersSchema.parse(req.query);

    const kanbanData = await kanbanService.getAllDepartmentsKanban(
      userId,
      filters
    );

    return res.json({
      success: true,
      data: kanbanData
    });
  } catch (error: any) {
    logger.error('Error getting all departments kanban:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.issues
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al obtener el tablero Kanban',
      error: error.message
    });
  }
};

/**
 * Asignación rápida de ticket desde el Kanban
 * PUT /api/tickets/:id/quick-assign
 */
export const quickAssignTicket = async (req: Request, res: Response) => {
  try {
    const { id: ticketId } = req.params;
    const userId = (req as any).user.id;

    // Validar UUID del ticket
    const uuidSchema = z.string().uuid();
    const validatedTicketId = uuidSchema.parse(ticketId);

    // Validar datos de asignación
    const { assignedToId } = quickAssignSchema.parse(req.body);

    await kanbanService.quickAssignTicket(
      validatedTicketId,
      assignedToId,
      userId
    );

    // Notificar al subordinado asignado
    if (assignedToId) {
      const ticket = await prisma.ticket.findUnique({
        where: { id: validatedTicketId },
        select: {
          id: true, ticketNumber: true, title: true, priority: true,
          assignedToId: true, departmentId: true,
          department: { select: { name: true } },
          requester: { select: { name: true } }
        }
      });
      if (ticket) {
        notifyTicketAssigned(ticket).catch(err =>
          logger.error('Error sending quick-assign notification:', err)
        );
      }
    }

    return res.json({
      success: true,
      message: assignedToId 
        ? 'Ticket asignado exitosamente' 
        : 'Asignación removida exitosamente'
    });
  } catch (error: any) {
    logger.error('Error in quick assign:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.issues
      });
    }

    if (error.message.includes('permisos')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al asignar ticket',
      error: error.message
    });
  }
};
