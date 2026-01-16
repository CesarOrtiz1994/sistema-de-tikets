import { Router } from 'express';
import ticketFormController from '../controllers/ticketForm.controller';
import { authenticate } from '../middlewares/auth';
import { isDeptAdmin } from '../middlewares/permissions.middleware';
import { validateBody } from '../middlewares/validateZod';
import {
  createFormSchema,
  updateFormSchema,
  addFieldSchema,
  updateFieldSchema,
  addFieldOptionSchema,
  updateFieldOptionSchema,
  reorderFieldsSchema,
  duplicateFormSchema,
  bulkCreateOptionsSchema
} from '../validators/ticketForm.validator';

const router = Router();

// ============================================
// TICKET FORMS
// ============================================

// Obtener formularios de un departamento
router.get(
  '/departments/:id/forms',
  authenticate,
  isDeptAdmin(),
  ticketFormController.getDepartmentForms
);

// Obtener un formulario por ID
router.get(
  '/:id',
  authenticate,
  ticketFormController.getFormById
);

// Crear formulario vacío
router.post(
  '/',
  authenticate,
  isDeptAdmin(),
  validateBody(createFormSchema),
  ticketFormController.createForm
);

// Actualizar formulario
router.put(
  '/:id',
  authenticate,
  isDeptAdmin(),
  validateBody(updateFormSchema),
  ticketFormController.updateForm
);

// Eliminar formulario (soft delete)
router.delete(
  '/:id',
  authenticate,
  isDeptAdmin(),
  ticketFormController.deleteForm
);

// Establecer formulario como predeterminado
router.put(
  '/departments/:departmentId/forms/:formId/default',
  authenticate,
  isDeptAdmin(),
  ticketFormController.setDefaultForm
);

// Duplicar formulario
router.post(
  '/:id/duplicate',
  authenticate,
  isDeptAdmin(),
  validateBody(duplicateFormSchema),
  ticketFormController.duplicateForm
);

// Obtener estadísticas de formularios
router.get(
  '/departments/:departmentId/stats',
  authenticate,
  isDeptAdmin(),
  ticketFormController.getFormStats
);

// ============================================
// FORM FIELDS
// ============================================

// Agregar campo a formulario
router.post(
  '/fields',
  authenticate,
  isDeptAdmin(),
  validateBody(addFieldSchema),
  ticketFormController.addFieldToForm
);

// Actualizar campo
router.put(
  '/fields/:id',
  authenticate,
  isDeptAdmin(),
  validateBody(updateFieldSchema),
  ticketFormController.updateFormField
);

// Eliminar campo
router.delete(
  '/fields/:id',
  authenticate,
  isDeptAdmin(),
  ticketFormController.deleteFormField
);

// Reordenar campos
router.put(
  '/:formId/fields/reorder',
  authenticate,
  isDeptAdmin(),
  validateBody(reorderFieldsSchema),
  ticketFormController.reorderFormFields
);

// ============================================
// FIELD OPTIONS
// ============================================

// Agregar opción a campo
router.post(
  '/fields/options',
  authenticate,
  isDeptAdmin(),
  validateBody(addFieldOptionSchema),
  ticketFormController.addFieldOption
);

// Actualizar opción
router.put(
  '/fields/options/:id',
  authenticate,
  isDeptAdmin(),
  validateBody(updateFieldOptionSchema),
  ticketFormController.updateFieldOption
);

// Eliminar opción
router.delete(
  '/fields/options/:id',
  authenticate,
  isDeptAdmin(),
  ticketFormController.deleteFieldOption
);

// Crear múltiples opciones
router.post(
  '/fields/:fieldId/options/bulk',
  authenticate,
  isDeptAdmin(),
  validateBody(bulkCreateOptionsSchema),
  ticketFormController.bulkCreateFieldOptions
);

export default router;
