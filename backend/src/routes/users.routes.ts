import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticate } from '../middlewares/auth';
import { isSuperAdmin } from '../middlewares/permissions.middleware';
import { auditAction } from '../middlewares/audit.middleware';

const router = Router();

router.get(
  '/',
  authenticate,
  isSuperAdmin(),
  usersController.listUsers as any
);

router.get(
  '/stats',
  authenticate,
  isSuperAdmin(),
  usersController.getUserStats as any
);

router.get(
  '/:id',
  authenticate,
  usersController.getUserById as any
);

router.post(
  '/',
  authenticate,
  isSuperAdmin(),
  auditAction('CREATE_USER', 'user') as any,
  usersController.createUser as any
);

router.put(
  '/:id',
  authenticate,
  auditAction('UPDATE_USER', 'user') as any,
  usersController.updateUser as any
);

router.delete(
  '/:id',
  authenticate,
  isSuperAdmin(),
  auditAction('DELETE_USER', 'user') as any,
  usersController.deleteUser as any
);

router.put(
  '/:id/restore',
  authenticate,
  isSuperAdmin(),
  auditAction('RESTORE_USER', 'user') as any,
  usersController.restoreUser as any
);

router.put(
  '/:id/role',
  authenticate,
  isSuperAdmin(),
  auditAction('CHANGE_USER_ROLE', 'user') as any,
  usersController.changeUserRole as any
);

router.put(
  '/:id/activate',
  authenticate,
  isSuperAdmin(),
  auditAction('TOGGLE_USER_ACTIVATION', 'user') as any,
  usersController.toggleUserActivation as any
);

export default router;
