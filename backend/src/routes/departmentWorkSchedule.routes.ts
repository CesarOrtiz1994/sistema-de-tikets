import { Router } from 'express';
import departmentWorkScheduleController from '../controllers/departmentWorkSchedule.controller';
import { authenticate } from '../middlewares/auth';
import { isDeptAdmin } from '../middlewares/permissions.middleware';
import { validateBody, validateParams } from '../middlewares/validateZod';
import { workScheduleValidators } from '../validators/departmentWorkSchedule.validator';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener horario laboral de un departamento (cualquier usuario autenticado)
router.get(
  '/:id/work-schedule',
  departmentWorkScheduleController.getDepartmentSchedule
);

// Verificar si tiene horario personalizado
router.get(
  '/:id/work-schedule/custom',
  departmentWorkScheduleController.hasCustomSchedule
);

// Configurar horario completo (solo DEPT_ADMIN del departamento)
router.post(
  '/:id/work-schedule',
  isDeptAdmin(),
  validateBody(workScheduleValidators.setSchedule),
  departmentWorkScheduleController.setDepartmentSchedule
);

// Actualizar horario de un día específico (solo DEPT_ADMIN)
router.put(
  '/:id/work-schedule/:day',
  isDeptAdmin(),
  validateParams(workScheduleValidators.dayParam),
  validateBody(workScheduleValidators.updateDay),
  departmentWorkScheduleController.updateDaySchedule
);

// Resetear a horario por defecto (solo DEPT_ADMIN)
router.delete(
  '/:id/work-schedule',
  isDeptAdmin(),
  departmentWorkScheduleController.resetToDefaultSchedule
);

export default router;
