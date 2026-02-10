import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import { metricsController } from '../controllers/metrics.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/metrics/dashboard - Métricas generales según rol
router.get('/dashboard', metricsController.getDashboard as any);

// GET /api/metrics/departments - Departamentos accesibles (para filtro)
router.get('/departments', metricsController.getUserDepartments as any);

// GET /api/metrics/tickets-by-status
router.get('/tickets-by-status', metricsController.getTicketsByStatus as any);

// GET /api/metrics/tickets-by-department
router.get('/tickets-by-department', metricsController.getTicketsByDepartment as any);

// GET /api/metrics/avg-resolution-time
router.get('/avg-resolution-time', metricsController.getAvgResolutionTime as any);

// GET /api/metrics/satisfaction
router.get('/satisfaction', metricsController.getSatisfaction as any);

// GET /api/metrics/sla-compliance
router.get('/sla-compliance', metricsController.getSlaCompliance as any);

// GET /api/metrics/tickets-trend
router.get('/tickets-trend', metricsController.getTicketsTrend as any);

export default router;
