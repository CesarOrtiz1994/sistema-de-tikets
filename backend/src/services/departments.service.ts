import prisma from '../config/database';

export interface CreateDepartmentData {
  name: string;
  prefix: string;
  description?: string;
  isDefaultForRequesters?: boolean;
  requireRating?: boolean;
  autoCloseAfterDays?: number;
  requireDeliverable?: boolean;
  maxDeliverableRejections?: number;
  createdById?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  prefix?: string;
  description?: string;
  isDefaultForRequesters?: boolean;
  requireRating?: boolean;
  autoCloseAfterDays?: number;
  requireDeliverable?: boolean;
  maxDeliverableRejections?: number;
}

export interface DepartmentFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class DepartmentsService {
  /**
   * Obtiene todos los departamentos donde el usuario es administrador
   */
  async getUserAdminDepartments(userId: string) {
    const departments = await prisma.department.findMany({
      where: {
        deletedAt: null,
        users: {
          some: {
            userId,
            role: 'ADMIN'
          }
        }
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        description: true,
        isDefaultForRequesters: true,
        requireRating: true,
        autoCloseAfterDays: true,
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return departments;
  }

  /**
   * Verifica si un usuario es administrador de un departamento específico
   */
  async isUserAdminOfDepartment(userId: string, departmentId: string): Promise<boolean> {
    const departmentUser = await prisma.departmentUser.findFirst({
      where: {
        userId,
        departmentId,
        role: 'ADMIN'
      }
    });

    return !!departmentUser;
  }

  async getAllDepartments(filters: DepartmentFilters = {}, userId?: string, userRole?: string) {
    const {
      search,
      isActive = true,
      page = 1,
      limit = 10
    } = filters;

    const where: any = {};

    // Solo mostrar departamentos activos (no eliminados)
    if (isActive) {
      where.deletedAt = null;
    }

    // Si es DEPT_ADMIN, solo mostrar su departamento
    if (userRole === 'DEPT_ADMIN' && userId) {
      const userDepartment = await prisma.departmentUser.findFirst({
        where: {
          userId,
          role: 'ADMIN'
        }
      });

      if (userDepartment) {
        where.id = userDepartment.departmentId;
      } else {
        // Si no tiene departamento asignado, no mostrar ninguno
        where.id = 'none';
      }
    }

    // Búsqueda por nombre o prefijo
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { prefix: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              users: true,
              ticketAccess: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.department.count({ where })
    ]);

    return {
      departments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getDepartmentById(id: string) {
    const department = await prisma.department.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                roleType: true
              }
            }
          }
        }
      }
    });

    if (!department) {
      throw new Error('Departamento no encontrado');
    }

    return department;
  }

  async createDepartment(data: CreateDepartmentData) {
    // Verificar que el prefijo no exista
    const existingDepartment = await prisma.department.findFirst({
      where: {
        prefix: data.prefix,
        deletedAt: null
      }
    });

    if (existingDepartment) {
      throw new Error('Ya existe un departamento con ese prefijo');
    }

    const department = await prisma.department.create({
      data: {
        name: data.name,
        prefix: data.prefix,
        description: data.description,
        isDefaultForRequesters: data.isDefaultForRequesters || false,
        requireRating: data.requireRating ?? true,
        requireDeliverable: data.requireDeliverable ?? false,
        maxDeliverableRejections: data.maxDeliverableRejections ?? 3,
        createdBy: {
          connect: { id: data.createdById }
        }
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return department;
  }

  async updateDepartment(id: string, data: UpdateDepartmentData) {
    // Verificar que el departamento existe
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!existingDepartment) {
      throw new Error('Departamento no encontrado');
    }

    // Si se cambia el prefijo, verificar que no exista
    if (data.prefix && data.prefix !== existingDepartment.prefix) {
      const prefixExists = await prisma.department.findFirst({
        where: {
          prefix: data.prefix,
          deletedAt: null,
          id: { not: id }
        }
      });

      if (prefixExists) {
        throw new Error('Ya existe un departamento con ese prefijo');
      }
    }

    // Filtrar campos undefined para no sobrescribir datos existentes
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.prefix !== undefined) updateData.prefix = data.prefix;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isDefaultForRequesters !== undefined) updateData.isDefaultForRequesters = data.isDefaultForRequesters;
    if (data.requireRating !== undefined) updateData.requireRating = data.requireRating;
    if (data.autoCloseAfterDays !== undefined) updateData.autoCloseAfterDays = data.autoCloseAfterDays;
    if (data.requireDeliverable !== undefined) updateData.requireDeliverable = data.requireDeliverable;
    if (data.maxDeliverableRejections !== undefined) updateData.maxDeliverableRejections = data.maxDeliverableRejections;

    console.log('UPDATE DEPARTMENT SERVICE - Datos a guardar:', {
      id,
      data: updateData
    });

    const department = await prisma.department.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return department;
  }

  async deleteDepartment(id: string) {
    // Verificar que el departamento existe
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });

    if (!existingDepartment) {
      throw new Error('Departamento no encontrado');
    }

    // Verificar que no tenga usuarios asignados
    const usersCount = await prisma.departmentUser.count({
      where: {
        departmentId: id
      }
    });

    if (usersCount > 0) {
      throw new Error('No se puede eliminar un departamento con usuarios asignados');
    }

    // Soft delete
    const department = await prisma.department.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });

    return department;
  }

  async assignUserToDepartment(departmentId: string, userId: string, role: 'ADMIN' | 'MEMBER') {
    // Verificar que el departamento existe
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        deletedAt: null
      }
    });

    if (!department) {
      throw new Error('Departamento no encontrado');
    }

    // Verificar que el usuario existe
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar si el usuario ya está asignado a ESTE departamento específico
    const existingAssignment = await prisma.departmentUser.findFirst({
      where: { 
        userId,
        departmentId 
      }
    });

    if (existingAssignment) {
      throw new Error('El usuario ya está asignado a este departamento');
    }

    const assignment = await prisma.departmentUser.create({
      data: {
        departmentId,
        userId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roleType: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            prefix: true
          }
        }
      }
    });

    return assignment;
  }

  async removeUserFromDepartment(departmentId: string, userId: string) {
    const assignment = await prisma.departmentUser.findFirst({
      where: {
        departmentId,
        userId
      }
    });

    if (!assignment) {
      throw new Error('Asignación no encontrada');
    }

    await prisma.departmentUser.delete({
      where: {
        id: assignment.id
      }
    });

    return { success: true };
  }

  async getDepartmentUsers(departmentId: string) {
    const users = await prisma.departmentUser.findMany({
      where: {
        departmentId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            roleType: true,
            profilePicture: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users;
  }
}
