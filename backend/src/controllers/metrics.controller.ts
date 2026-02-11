import { Request, Response } from 'express';
import { metricsService } from '../services/metrics.service';
import { metricsValidators } from '../validators/metrics.validator';
import { cacheService } from '../services/cache.service';
import logger from '../config/logger';

class MetricsController {
  /**
   * GET /api/metrics/dashboard
   */
  async getDashboard(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const parsed = metricsValidators.dashboardFilters.parse(req.query);

      const cacheKey = `dashboard:${user.id}:${JSON.stringify(parsed)}`;
      const cached = await cacheService.getMetrics(cacheKey);
      if (cached) return res.json({ success: true, data: cached });

      const data = await metricsService.getDashboard(user.id, user.roleType, parsed);
      await cacheService.setMetrics(cacheKey, data);

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error getting dashboard metrics:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener métricas del dashboard' });
    }
  }

  /**
   * GET /api/metrics/tickets-by-status
   */
  async getTicketsByStatus(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const parsed = metricsValidators.ticketsByStatus.parse(req.query);

      const cacheKey = `by-status:${user.id}:${JSON.stringify(parsed)}`;
      const cached = await cacheService.getMetrics(cacheKey);
      if (cached) return res.json({ success: true, data: cached });

      const data = await metricsService.getTicketsByStatus(user.id, user.roleType, parsed);
      await cacheService.setMetrics(cacheKey, data);

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error getting tickets by status:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener tickets por estado' });
    }
  }

  /**
   * GET /api/metrics/tickets-by-department
   */
  async getTicketsByDepartment(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const parsed = metricsValidators.ticketsByDepartment.parse(req.query);

      const cacheKey = `by-dept:${user.id}:${JSON.stringify(parsed)}`;
      const cached = await cacheService.getMetrics(cacheKey);
      if (cached) return res.json({ success: true, data: cached });

      const data = await metricsService.getTicketsByDepartment(user.id, user.roleType, parsed);
      await cacheService.setMetrics(cacheKey, data);

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error getting tickets by department:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener tickets por departamento' });
    }
  }

  /**
   * GET /api/metrics/avg-resolution-time
   */
  async getAvgResolutionTime(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const parsed = metricsValidators.avgResolutionTime.parse(req.query);

      const cacheKey = `avg-res:${user.id}:${JSON.stringify(parsed)}`;
      const cached = await cacheService.getMetrics(cacheKey);
      if (cached) return res.json({ success: true, data: cached });

      const data = await metricsService.getAvgResolutionTime(user.id, user.roleType, parsed);
      await cacheService.setMetrics(cacheKey, data);

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error getting avg resolution time:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener tiempo promedio de resolución' });
    }
  }

  /**
   * GET /api/metrics/satisfaction
   */
  async getSatisfaction(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const parsed = metricsValidators.satisfaction.parse(req.query);

      const cacheKey = `satisfaction:${user.id}:${JSON.stringify(parsed)}`;
      const cached = await cacheService.getMetrics(cacheKey);
      if (cached) return res.json({ success: true, data: cached });

      const data = await metricsService.getSatisfaction(user.id, user.roleType, parsed);
      await cacheService.setMetrics(cacheKey, data);

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error getting satisfaction metrics:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener métricas de satisfacción' });
    }
  }

  /**
   * GET /api/metrics/sla-compliance
   */
  async getSlaCompliance(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const parsed = metricsValidators.slaCompliance.parse(req.query);

      const cacheKey = `sla-comp:${user.id}:${JSON.stringify(parsed)}`;
      const cached = await cacheService.getMetrics(cacheKey);
      if (cached) return res.json({ success: true, data: cached });

      const data = await metricsService.getSlaCompliance(user.id, user.roleType, parsed);
      await cacheService.setMetrics(cacheKey, data);

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error getting SLA compliance:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener cumplimiento SLA' });
    }
  }

  /**
   * GET /api/metrics/tickets-trend
   */
  async getTicketsTrend(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const parsed = metricsValidators.ticketsTrend.parse(req.query);

      const cacheKey = `trend:${user.id}:${JSON.stringify(parsed)}`;
      const cached = await cacheService.getMetrics(cacheKey);
      if (cached) return res.json({ success: true, data: cached });

      const data = await metricsService.getTicketsTrend(user.id, user.roleType, parsed);
      await cacheService.setMetrics(cacheKey, data);

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error getting tickets trend:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener tendencia de tickets' });
    }
  }

  /**
   * GET /api/metrics/departments - Departamentos accesibles para filtro
   */
  async getUserDepartments(req: Request, res: Response) {
    try {
      const user = req.user as any;
      const data = await metricsService.getUserDepartments(user.id, user.roleType);

      return res.json({ success: true, data });
    } catch (error: any) {
      logger.error('Error getting user departments:', error);
      return res.status(500).json({ success: false, error: 'Error al obtener departamentos' });
    }
  }
}

export const metricsController = new MetricsController();
