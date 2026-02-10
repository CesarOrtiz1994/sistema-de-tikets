import { Request, Response } from 'express';
import { DepartmentsService } from '../services/departments.service';
import { z } from 'zod';
import prisma from '../config/database';

const departmentsService = new DepartmentsService();

// Schemas de validación
const createDepartmentSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  prefix: z.string().min(2, 'El prefijo debe tener al menos 2 caracteres').max(10, 'El prefijo no puede tener más de 10 caracteres'),
  description: z.string().optional(),
  isDefaultForRequesters: z.boolean().optional(),
  requireRating: z.boolean().optional(),
  requireDeliverable: z.boolean().optional(),
  maxDeliverableRejections: z.number().int().min(1).max(10).optional()
});

const updateDepartmentSchema = z.object({
  name: z.string().min(2).optional(),
  prefix: z.string().min(2).max(10).optional(),
  description: z.string().optional(),
  isDefaultForRequesters: z.boolean().optional(),
  requireRating: z.boolean().optional(),
  autoCloseAfterDays: z.number().int().min(1).max(90).optional(),
  requireDeliverable: z.boolean().optional(),
  maxDeliverableRejections: z.number().int().min(1).max(10).optional()
});

const assignUserSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  role: z.enum(['ADMIN', 'MEMBER'], { message: 'El rol debe ser ADMIN o MEMBER' })
});

export const getMyAdminDepartments = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    
    const departments = await departmentsService.getUserAdminDepartments(userId);

    return res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('Error al obtener departamentos del administrador:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener departamentos'
    });
  }
};

export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const { search, isActive, page, limit } = req.query;

    const filters = {
      search: search as string,
      isActive: isActive === 'false' ? false : true,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10
    };

    const userId = (req.user as any)?.id;
    const userRole = (req.user as any)?.roleType;

    const result = await departmentsService.getAllDepartments(filters, userId, userRole);

    return res.json({
      success: true,
      data: result.departments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error al obtener departamentos:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al obtener departamentos'
    });
  }
};

export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const department = await departmentsService.getDepartmentById(id);

    return res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error al obtener departamento:', error);
    const statusCode = error instanceof Error && error.message === 'Departamento no encontrado' ? 404 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al obtener departamento'
    });
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const validatedData = createDepartmentSchema.parse(req.body);
    
    const userId = (req.user as any)?.id;

    const department = await departmentsService.createDepartment({
      ...validatedData,
      createdById: userId
    });

    return res.status(201).json({
      success: true,
      message: 'Departamento creado exitosamente',
      data: department
    });
  } catch (error) {
    console.error('Error al crear departamento:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación inválidos',
        errors: error.issues
      });
    }

    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al crear departamento'
    });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any)?.id;
    const userRole = (req.user as any)?.roleType;
    
    let validatedData = updateDepartmentSchema.parse(req.body);

    // Si es DEPT_ADMIN, verificar que sea su departamento y limitar campos editables
    if (userRole === 'DEPT_ADMIN') {
      // Verificar que el usuario sea admin de este departamento
      const isAdmin = await departmentsService.isUserAdminOfDepartment(userId, id);
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para actualizar este departamento'
        });
      }

      // DEPT_ADMIN puede actualizar la mayoría de campos de su departamento
      const allowedFields = [
        'name',
        'prefix',
        'description',
        'isDefaultForRequesters',
        'requireRating',
        'autoCloseAfterDays'
      ];
      const filteredData: any = {};
      
      for (const key of allowedFields) {
        if (key in validatedData) {
          filteredData[key] = (validatedData as any)[key];
        }
      }
      
      // Validar unicidad de name si se está actualizando
      if (filteredData.name) {
        const existingByName = await prisma.department.findFirst({
          where: {
            name: filteredData.name,
            id: { not: id },
            deletedAt: null
          }
        });
        
        if (existingByName) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un departamento con ese nombre'
          });
        }
      }
      
      // Validar unicidad de prefix si se está actualizando
      if (filteredData.prefix) {
        const existingByPrefix = await prisma.department.findFirst({
          where: {
            prefix: filteredData.prefix,
            id: { not: id },
            deletedAt: null
          }
        });
        
        if (existingByPrefix) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un departamento con ese prefijo'
          });
        }
      }
      
      validatedData = filteredData;
    }

    const department = await departmentsService.updateDepartment(id, validatedData);

    return res.json({
      success: true,
      message: 'Departamento actualizado exitosamente',
      data: department
    });
  } catch (error) {
    console.error('Error al actualizar departamento:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación inválidos',
        errors: error.issues
      });
    }

    const statusCode = error instanceof Error && error.message === 'Departamento no encontrado' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al actualizar departamento'
    });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await departmentsService.deleteDepartment(id);

    return res.json({
      success: true,
      message: 'Departamento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar departamento:', error);
    const statusCode = error instanceof Error && error.message === 'Departamento no encontrado' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al eliminar departamento'
    });
  }
};

export const assignUserToDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = assignUserSchema.parse(req.body);

    const assignment = await departmentsService.assignUserToDepartment(
      id,
      validatedData.userId,
      validatedData.role
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario asignado exitosamente',
      data: assignment
    });
  } catch (error) {
    console.error('Error al asignar usuario:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación inválidos',
        errors: error.issues
      });
    }

    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al asignar usuario'
    });
  }
};

export const removeUserFromDepartment = async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;

    await departmentsService.removeUserFromDepartment(id, userId);

    return res.json({
      success: true,
      message: 'Usuario removido exitosamente'
    });
  } catch (error) {
    console.error('Error al remover usuario:', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al remover usuario'
    });
  }
};

export const getDepartmentUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const users = await departmentsService.getDepartmentUsers(id);

    return res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error al obtener usuarios del departamento:', error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error al obtener usuarios'
    });
  }
};
