import { Router } from 'express';
import departmentSLAController from '../controllers/departmentSLA.controller';
import { authenticate } from '../middlewares/auth';
import { isDeptAdmin } from '../middlewares/permissions.middleware';

const router = Router();

// Obtener configuraciones SLA de un departamento
router.get(
  '/:id/sla',
  authenticate,
  isDeptAdmin(),
  departmentSLAController.getDepartmentSLAs
);

router.get(
  '/:id/sla/priority/:priority',
  authenticate,
  isDeptAdmin(),
  departmentSLAController.getSLAForDepartmentAndPriority
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
  isDeptAdmin(),
  departmentSLAController.assignSLAToDepartment
);

// Eliminar SLA de un departamento
router.delete(
  '/:id/sla/:priority',
  authenticate,
  isDeptAdmin(),
  departmentSLAController.removeSLAFromDepartment
);

export default router;
