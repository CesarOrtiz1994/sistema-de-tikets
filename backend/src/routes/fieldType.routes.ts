import { Router } from 'express';
import fieldTypeController from '../controllers/fieldType.controller';
import { authenticate } from '../middlewares/auth';
import { isSuperAdmin } from '../middlewares/permissions.middleware';

const router = Router();

router.get(
  '/',
  authenticate,
  fieldTypeController.getAllFieldTypes
);

router.get(
  '/stats',
  authenticate,
  isSuperAdmin(),
  fieldTypeController.getFieldTypeStats
);

router.get(
  '/:id',
  authenticate,
  fieldTypeController.getFieldTypeById
);

router.get(
  '/:id/validations',
  authenticate,
  fieldTypeController.getFieldTypeValidations
);

router.post(
  '/',
  authenticate,
  isSuperAdmin(),
  fieldTypeController.createFieldType
);

router.put(
  '/:id',
  authenticate,
  isSuperAdmin(),
  fieldTypeController.updateFieldType
);

router.delete(
  '/:id',
  authenticate,
  isSuperAdmin(),
  fieldTypeController.deleteFieldType
);

export default router;
