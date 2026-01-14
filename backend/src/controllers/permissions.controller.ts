import { Response } from 'express';
import { PermissionsService } from '../services/permissions.service';
import { AuthRequest } from '../middlewares/permissions.middleware';

const permissionsService = new PermissionsService();

export const getMyPermissions = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const permissions = await permissionsService.getUserPermissions(req.user.id);

    return res.json({
      success: true,
      data: permissions
    });
  } catch (error: any) {
    console.error('Error al obtener permisos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener permisos',
      error: error.message
    });
  }
};

export const getUserPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const permissions = await permissionsService.getUserPermissions(userId);

    return res.json({
      success: true,
      data: permissions
    });
  } catch (error: any) {
    console.error('Error al obtener permisos del usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener permisos del usuario',
      error: error.message
    });
  }
};

export const getMyDepartments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const departments = await permissionsService.getUserDepartments(req.user.id);

    return res.json({
      success: true,
      data: departments
    });
  } catch (error: any) {
    console.error('Error al obtener departamentos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener departamentos',
      error: error.message
    });
  }
};

export const checkDepartmentAccess = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { departmentId } = req.params;

    const access = await permissionsService.checkUserDepartmentAccess(
      req.user.id,
      departmentId
    );

    return res.json({
      success: true,
      data: access
    });
  } catch (error: any) {
    console.error('Error al verificar acceso al departamento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar acceso al departamento',
      error: error.message
    });
  }
};
