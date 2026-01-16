import { Router } from 'express';
import departmentSLAController from '../controllers/departmentSLA.controller';
import { authenticate } from '../middlewares/auth';
import { isSuperAdmin, isDeptAdmin } from '../middlewares/permissions.middleware';

const router = Router();

// Obtener configuraciones SLA de un departamento
router.get(
  '/:id/sla',
  authenticate,
  isDeptAdmin(),
  departmentSLAController.getDepartmentSLAs
);

// Obtener SLA por defecto de un departamento
router.get(
  '/:id/sla/default',
  authenticate,
  isDeptAdmin(),
  departmentSLAController.getDefaultSLA
);

// Asignar/actualizar SLA a un departamento
router.post(
  '/:id/sla',
  authenticate,
  isSuperAdmin(),
  departmentSLAController.assignSLAToDepartment
);

// Eliminar SLA de un departamento
router.delete(
  '/:id/sla/:priority',
  authenticate,
  isSuperAdmin(),
  departmentSLAController.removeSLAFromDepartment
);

export default router;
