import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { auditAction } from '../middlewares/audit.middleware';
import * as kanbanController from '../controllers/kanban.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

/**
 * GET /api/kanban/all
 * Obtiene el tablero Kanban de todos los departamentos del usuario
 */
router.get(
  '/kanban/all',
  kanbanController.getAllDepartmentsKanban as any
);

/**
 * GET /api/departments/:id/kanban
 * Obtiene el tablero Kanban de un departamento
 * Query params:
 *   - priority: LOW | MEDIUM | HIGH | CRITICAL (opcional)
 *   - assignedToId: UUID del usuario asignado (opcional)
 *   - onlyMine: true | false (opcional)
 */
router.get(
  '/departments/:id/kanban',
  kanbanController.getDepartmentKanban as any
);

/**
 * PUT /api/tickets/:id/quick-assign
 * Asignación rápida de ticket desde el Kanban
 * Body:
 *   - assignedToId: UUID del usuario | null
 */
router.put(
  '/tickets/:id/quick-assign',
  auditAction('QUICK_ASSIGN_TICKET', 'ticket') as any,
  kanbanController.quickAssignTicket as any
);

export default router;
