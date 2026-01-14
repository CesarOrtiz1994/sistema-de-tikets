import { Request, Response } from 'express';
import usersService from '../services/users.service';
import { RoleType } from '@prisma/client';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  roleType: z.nativeEnum(RoleType).optional(),
  language: z.string().optional()
});

const updateUserSchema = z.object({
  roleType: z.nativeEnum(RoleType).optional(),
  language: z.string().optional()
});

const changeRoleSchema = z.object({
  roleType: z.nativeEnum(RoleType)
});

const toggleActivationSchema = z.object({
  isActive: z.boolean()
});

export const listUsers = async (req: Request, res: Response) => {
  try {
    console.log('listUsers - query params:', req.query);
    const { search, roleType, isActive, includeDeleted, page, limit } = req.query;

    const filters = {
      search: search as string,
      roleType: roleType as RoleType,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      includeDeleted: includeDeleted === 'true',
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10
    };

    console.log('listUsers - filters:', filters);
    const result = await usersService.listUsers(filters);
    console.log('listUsers - result:', { usersCount: result.users.length, total: result.pagination.total });

    return res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al listar usuarios',
      error: error.message
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await usersService.getUserById(id);

    return res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Error al obtener usuario:', error);
    return res.status(error.message === 'Usuario no encontrado' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);
    const user = await usersService.createUser(validatedData);

    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: user
    });
  } catch (error: any) {
    console.error('Error al crear usuario:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación inválidos',
        errors: error.issues
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);
    
    const user = await usersService.updateUser(id, validatedData);

    return res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: user
    });
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación inválidos',
        errors: error.issues
      });
    }

    return res.status(error.message === 'Usuario no encontrado' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await usersService.deleteUser(id);

    return res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: user
    });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    return res.status(error.message === 'Usuario no encontrado' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

export const restoreUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await usersService.restoreUser(id);

    return res.json({
      success: true,
      message: 'Usuario restaurado exitosamente',
      data: user
    });
  } catch (error: any) {
    console.error('Error al restaurar usuario:', error);
    return res.status(error.message === 'Usuario no encontrado' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

export const changeUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = changeRoleSchema.parse(req.body);
    
    const user = await usersService.changeUserRole(id, validatedData.roleType);

    return res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: user
    });
  } catch (error: any) {
    console.error('Error al cambiar rol:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación inválidos',
        errors: error.issues
      });
    }

    return res.status(error.message === 'Usuario no encontrado' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

export const toggleUserActivation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = toggleActivationSchema.parse(req.body);
    
    const user = await usersService.toggleUserActivation(id, validatedData.isActive);

    return res.json({
      success: true,
      message: `Usuario ${validatedData.isActive ? 'activado' : 'desactivado'} exitosamente`,
      data: user
    });
  } catch (error: any) {
    console.error('Error al cambiar estado:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de validación inválidos',
        errors: error.issues
      });
    }

    return res.status(error.message === 'Usuario no encontrado' ? 404 : 400).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserStats = async (_req: Request, res: Response) => {
  try {
    const stats = await usersService.getUserStats();

    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};
