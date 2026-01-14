import { Router } from 'express';
import * as auditController from '../controllers/audit.controller';
import { authenticate } from '../middlewares/auth';
import { isSuperAdmin, isAuthenticated } from '../middlewares/permissions.middleware';
import { auditAction } from '../middlewares/audit.middleware';

const router = Router();

router.get(
  '/',
  authenticate as any,
  isSuperAdmin() as any,
  auditController.getAuditLogs
);

router.get(
  '/me',
  authenticate as any,
  isAuthenticated() as any,
  auditController.getMyAuditLogs
);

router.get(
  '/stats',
  authenticate as any,
  isSuperAdmin() as any,
  auditController.getAuditStats
);

router.get(
  '/:id',
  authenticate as any,
  isSuperAdmin() as any,
  auditAction('view_audit_log', 'audit_log') as any,
  auditController.getAuditLogById
);

export default router;
