import { Request, Response } from 'express';
import { PermissionsService } from '../services/permissions.service';

const permissionsService = new PermissionsService();

export const getMyPermissions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!(req.user as any).id) {
      return res.status(500).json({
        success: false,
        message: 'Usuario sin ID'
      });
    }

    const permissions = await permissionsService.getUserPermissions((req.user as any).id);

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

export const getUserPermissions = async (req: Request, res: Response) => {
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

export const getMyDepartments = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const departments = await permissionsService.getUserDepartments((req.user as any).id);

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

export const checkDepartmentAccess = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const { departmentId } = req.params;

    const access = await permissionsService.checkUserDepartmentAccess(
      (req.user as any).id,
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
