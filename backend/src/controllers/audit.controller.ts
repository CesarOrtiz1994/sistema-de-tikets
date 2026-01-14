import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';

const auditService = new AuditService();

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
      status,
      page,
      limit
    } = req.query;

    const filters = {
      userId: userId as string,
      action: action as string,
      resource: resource as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      status: status as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined
    };

    const result = await auditService.getAuditLogs(filters);

    return res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error al obtener logs de auditoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener logs de auditoría',
      error: error.message
    });
  }
};

export const getAuditLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const log = await auditService.getAuditLogById(id);

    return res.json({
      success: true,
      data: log
    });
  } catch (error: any) {
    console.error('Error al obtener log de auditoría:', error);
    
    if (error.message === 'Log de auditoría no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al obtener log de auditoría',
      error: error.message
    });
  }
};

export const getMyAuditLogs = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { page, limit } = req.query;

    const result = await auditService.getUserAuditLogs(
      (req.user as any).id,
      page ? parseInt(page as string) : undefined,
      limit ? parseInt(limit as string) : undefined
    );

    return res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error al obtener mis logs de auditoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener mis logs de auditoría',
      error: error.message
    });
  }
};

export const getAuditStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await auditService.getAuditStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas de auditoría:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de auditoría',
      error: error.message
    });
  }
};
