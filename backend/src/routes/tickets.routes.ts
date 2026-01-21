import { Router } from 'express';
import ticketsController from '../controllers/tickets.controller';
import { authenticate } from '../middlewares/auth';
import { validateBody } from '../middlewares/validateZod';
import { auditAction } from '../middlewares/audit.middleware';
import {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
  changeStatusSchema,
  changePrioritySchema
} from '../validators/tickets.validator';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * @route   POST /api/tickets
 * @desc    Crear un nuevo ticket
 * @access  Private (Authenticated users)
 */
router.post(
  '/',
  validateBody(createTicketSchema),
  auditAction('CREATE_TICKET', 'ticket') as any,
  ticketsController.createTicket
);

/**
 * @route   GET /api/tickets
 * @desc    Listar tickets con filtros
 * @access  Private
 */
router.get(
  '/',
  ticketsController.listTickets
);

/**
 * @route   GET /api/tickets/:id
 * @desc    Obtener un ticket por ID
 * @access  Private
 */
router.get(
  '/:id',
  ticketsController.getTicketById
);

/**
 * @route   PUT /api/tickets/:id
 * @desc    Actualizar un ticket
 * @access  Private
 */
router.put(
  '/:id',
  validateBody(updateTicketSchema),
  auditAction('UPDATE_TICKET', 'ticket') as any,
  ticketsController.updateTicket
);

/**
 * @route   PUT /api/tickets/:id/assign
 * @desc    Asignar ticket a un usuario
 * @access  Private (Dept Admin or Subordinate)
 */
router.put(
  '/:id/assign',
  validateBody(assignTicketSchema),
  auditAction('ASSIGN_TICKET', 'ticket') as any,
  ticketsController.assignTicket
);

/**
 * @route   PUT /api/tickets/:id/status
 * @desc    Cambiar estado del ticket
 * @access  Private
 */
router.put(
  '/:id/status',
  validateBody(changeStatusSchema),
  auditAction('CHANGE_TICKET_STATUS', 'ticket') as any,
  ticketsController.changeStatus
);

/**
 * @route   PUT /api/tickets/:id/priority
 * @desc    Cambiar prioridad del ticket
 * @access  Private (Dept Admin)
 */
router.put(
  '/:id/priority',
  validateBody(changePrioritySchema),
  auditAction('CHANGE_TICKET_PRIORITY', 'ticket') as any,
  ticketsController.changePriority
);

export default router;
