import { Request, Response } from 'express';
import departmentAccessService from '../services/departmentAccess.service';
import { z } from 'zod';

const grantAccessSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER')
});

const setDefaultSchema = z.object({
  isDefault: z.boolean()
});

export class DepartmentAccessController {
  /**
   * GET /api/departments/accessible
   * Obtiene los departamentos a los que el usuario puede crear tickets
   */
  async getAccessibleDepartments(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const departments = await departmentAccessService.getAccessibleDepartmentsForUser(userId);

      return res.json({
        success: true,
        data: departments
      });
    } catch (error) {
      console.error('Error getting accessible departments:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener departamentos accesibles'
      });
    }
  }

  /**
   * GET /api/departments/:departmentId/users-with-access
   * Obtiene los usuarios con acceso a un departamento
   */
  async getUsersWithAccess(req: Request, res: Response) {
    try {
      const { departmentId } = req.params;
      const user = (req as any).user;

      // Si es DEPT_ADMIN, verificar que sea administrador de este departamento
      if (user.roleType === 'DEPT_ADMIN') {
        const prisma = (await import('../config/database')).default;
        const isAdmin = await prisma.departmentUser.findFirst({
          where: {
            userId: user.id,
            departmentId: departmentId,
            role: 'ADMIN'
          }
        });

        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para gestionar este departamento'
          });
        }
      }

      const result = await departmentAccessService.getUsersWithAccessToDepartment(departmentId);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting users with access:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al obtener usuarios con acceso'
      });
    }
  }

  /**
   * POST /api/departments/:departmentId/grant-access
   * Otorga acceso a un usuario para crear tickets en un departamento
   */
  async grantAccess(req: Request, res: Response) {
    try {
      const { departmentId } = req.params;
      const user = (req as any).user;
      const validatedData = grantAccessSchema.parse(req.body);

      // Si es DEPT_ADMIN, verificar que sea administrador de este departamento
      if (user.roleType === 'DEPT_ADMIN') {
        const prisma = (await import('../config/database')).default;
        const isAdmin = await prisma.departmentUser.findFirst({
          where: {
            userId: user.id,
            departmentId: departmentId,
            role: 'ADMIN'
          }
        });

        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para gestionar este departamento'
          });
        }
      }

      const result = await departmentAccessService.grantUserAccessToDepartment(
        validatedData.userId,
        departmentId
      );

      return res.json({
        success: true,
        message: 'Acceso otorgado exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error granting access:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Datos de validación inválidos',
          errors: error.issues
        });
      }

      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al otorgar acceso'
      });
    }
  }

  /**
   * DELETE /api/departments/:departmentId/revoke-access/:userId
   * Revoca el acceso de un usuario a un departamento
   */
  async revokeAccess(req: Request, res: Response) {
    try {
      const { departmentId, userId } = req.params;
      const user = (req as any).user;

      // Si es DEPT_ADMIN, verificar que sea administrador de este departamento
      if (user.roleType === 'DEPT_ADMIN') {
        const prisma = (await import('../config/database')).default;
        const isAdmin = await prisma.departmentUser.findFirst({
          where: {
            userId: user.id,
            departmentId: departmentId,
            role: 'ADMIN'
          }
        });

        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para gestionar este departamento'
          });
        }
      }

      await departmentAccessService.revokeUserAccessFromDepartment(userId, departmentId);

      return res.json({
        success: true,
        message: 'Acceso revocado exitosamente'
      });
    } catch (error) {
      console.error('Error revoking access:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al revocar acceso'
      });
    }
  }

  /**
   * PUT /api/departments/:departmentId/set-default
   * Marca un departamento como por defecto (todos pueden crear tickets)
   */
  async setAsDefault(req: Request, res: Response) {
    try {
      const { departmentId } = req.params;
      const user = (req as any).user;
      const validatedData = setDefaultSchema.parse(req.body);

      // Si es DEPT_ADMIN, verificar que sea administrador de este departamento
      if (user.roleType === 'DEPT_ADMIN') {
        const prisma = (await import('../config/database')).default;
        const isAdmin = await prisma.departmentUser.findFirst({
          where: {
            userId: user.id,
            departmentId: departmentId,
            role: 'ADMIN'
          }
        });

        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para gestionar este departamento'
          });
        }
      }

      const department = await departmentAccessService.setDepartmentAsDefault(
        departmentId,
        validatedData.isDefault
      );

      return res.json({
        success: true,
        message: validatedData.isDefault 
          ? 'Departamento marcado como accesible para todos'
          : 'Departamento marcado como restringido',
        data: department
      });
    } catch (error) {
      console.error('Error setting department as default:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Datos de validación inválidos',
          errors: error.issues
        });
      }

      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error al actualizar departamento'
      });
    }
  }
}

export default new DepartmentAccessController();
