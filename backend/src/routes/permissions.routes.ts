import { Router } from 'express';
import * as permissionsController from '../controllers/permissions.controller';
import { authenticate } from '../middlewares/auth';
import { isSuperAdmin, isAuthenticated } from '../middlewares/permissions.middleware';

const router = Router();

router.get(
  '/me',
  authenticate as any,
  isAuthenticated() as any,
  permissionsController.getMyPermissions
);

router.get(
  '/me/departments',
  authenticate as any,
  isAuthenticated() as any,
  permissionsController.getMyDepartments
);

router.get(
  '/users/:userId',
  authenticate as any,
  isSuperAdmin() as any,
  permissionsController.getUserPermissions
);

router.get(
  '/departments/:departmentId/access',
  authenticate as any,
  isAuthenticated() as any,
  permissionsController.checkDepartmentAccess
);

export default router;
