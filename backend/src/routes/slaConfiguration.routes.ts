import { Router } from 'express';
import slaConfigurationController from '../controllers/slaConfiguration.controller';
import { authenticate } from '../middlewares/auth';
import { isSuperAdmin } from '../middlewares/permissions.middleware';

const router = Router();

router.get(
  '/',
  authenticate,
  slaConfigurationController.getAllSLAConfigurations
);

router.get(
  '/default',
  authenticate,
  slaConfigurationController.getDefaultSLAConfiguration
);

router.get(
  '/stats',
  authenticate,
  isSuperAdmin(),
  slaConfigurationController.getSLAStats
);

router.get(
  '/:id',
  authenticate,
  slaConfigurationController.getSLAConfigurationById
);

router.post(
  '/',
  authenticate,
  isSuperAdmin(),
  slaConfigurationController.createSLAConfiguration
);

router.put(
  '/:id',
  authenticate,
  isSuperAdmin(),
  slaConfigurationController.updateSLAConfiguration
);

router.delete(
  '/:id',
  authenticate,
  isSuperAdmin(),
  slaConfigurationController.deleteSLAConfiguration
);

export default router;
