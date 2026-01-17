import { Router } from 'express';
import ticketFormController from '../controllers/ticketForm.controller';
import { authenticate } from '../middlewares/auth';
import { isDeptAdmin } from '../middlewares/permissions.middleware';
import { validateBody } from '../middlewares/validateZod';
import { auditAction } from '../middlewares/audit.middleware';
import {
  createFormSchema,
  updateFormSchema,
  addFieldSchema,
  updateFieldSchema,
  addFieldOptionSchema,
  updateFieldOptionSchema,
  reorderFieldsSchema,
  duplicateFormSchema,
  bulkCreateOptionsSchema,
  activateFormSchema
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
  auditAction('CREATE_FORM', 'ticket_form') as any,
  ticketFormController.createForm
);

// Actualizar formulario
router.put(
  '/:id',
  authenticate,
  isDeptAdmin(),
  validateBody(updateFormSchema),
  auditAction('UPDATE_FORM', 'ticket_form') as any,
  ticketFormController.updateForm
);

// Eliminar formulario (soft delete)
router.delete(
  '/:id',
  authenticate,
  isDeptAdmin(),
  auditAction('DELETE_FORM', 'ticket_form') as any,
  ticketFormController.deleteForm
);

// Establecer formulario como predeterminado
router.put(
  '/departments/:departmentId/forms/:formId/default',
  authenticate,
  isDeptAdmin(),
  auditAction('SET_DEFAULT_FORM', 'ticket_form') as any,
  ticketFormController.setDefaultForm
);

// Duplicar formulario
router.post(
  '/:id/duplicate',
  authenticate,
  isDeptAdmin(),
  validateBody(duplicateFormSchema),
  auditAction('DUPLICATE_FORM', 'ticket_form') as any,
  ticketFormController.duplicateForm
);

// Activar formulario
router.put(
  '/:id/activate',
  authenticate,
  isDeptAdmin(),
  validateBody(activateFormSchema),
  auditAction('ACTIVATE_FORM', 'ticket_form') as any,
  ticketFormController.activateForm
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
  auditAction('ADD_FORM_FIELD', 'form_field') as any,
  ticketFormController.addFieldToForm
);

// Actualizar campo
router.put(
  '/fields/:id',
  authenticate,
  isDeptAdmin(),
  validateBody(updateFieldSchema),
  auditAction('UPDATE_FORM_FIELD', 'form_field') as any,
  ticketFormController.updateFormField
);

// Eliminar campo
router.delete(
  '/fields/:id',
  authenticate,
  isDeptAdmin(),
  auditAction('DELETE_FORM_FIELD', 'form_field') as any,
  ticketFormController.deleteFormField
);

// Reordenar campos
router.put(
  '/:formId/fields/reorder',
  authenticate,
  isDeptAdmin(),
  validateBody(reorderFieldsSchema),
  auditAction('REORDER_FORM_FIELDS', 'form_field') as any,
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
  auditAction('ADD_FIELD_OPTION', 'field_option') as any,
  ticketFormController.addFieldOption
);

// Actualizar opción
router.put(
  '/fields/options/:id',
  authenticate,
  isDeptAdmin(),
  validateBody(updateFieldOptionSchema),
  auditAction('UPDATE_FIELD_OPTION', 'field_option') as any,
  ticketFormController.updateFieldOption
);

// Eliminar opción
router.delete(
  '/fields/options/:id',
  authenticate,
  isDeptAdmin(),
  auditAction('DELETE_FIELD_OPTION', 'field_option') as any,
  ticketFormController.deleteFieldOption
);

// Crear múltiples opciones
router.post(
  '/fields/:fieldId/options/bulk',
  authenticate,
  isDeptAdmin(),
  validateBody(bulkCreateOptionsSchema),
  auditAction('BULK_CREATE_FIELD_OPTIONS', 'field_option') as any,
  ticketFormController.bulkCreateFieldOptions
);

export default router;
