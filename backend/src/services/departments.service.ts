import prisma from '../config/database';

export interface CreateDepartmentData {
  name: string;
  prefix: string;
  description?: string;
  isDefaultForRequesters?: boolean;
  createdById?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  prefix?: string;
  description?: string;
  isDefaultForRequesters?: boolean;
}

export interface DepartmentFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class DepartmentsService {
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
              users: true
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

    // Si se marca como default, desmarcar otros
    if (data.isDefaultForRequesters) {
      await prisma.department.updateMany({
        where: {
          isDefaultForRequesters: true,
          deletedAt: null
        },
        data: {
          isDefaultForRequesters: false
        }
      });
    }

    const department = await prisma.department.create({
      data: {
        name: data.name,
        prefix: data.prefix,
        description: data.description,
        isDefaultForRequesters: data.isDefaultForRequesters || false,
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

    // Si se marca como default, desmarcar otros
    if (data.isDefaultForRequesters) {
      await prisma.department.updateMany({
        where: {
          isDefaultForRequesters: true,
          deletedAt: null,
          id: { not: id }
        },
        data: {
          isDefaultForRequesters: false
        }
      });
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        prefix: data.prefix,
        description: data.description,
        isDefaultForRequesters: data.isDefaultForRequesters
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

    // Verificar que el usuario no esté ya asignado a OTRO departamento
    const existingAssignment = await prisma.departmentUser.findFirst({
      where: {
        userId
      }
    });

    if (existingAssignment) {
      if (existingAssignment.departmentId === departmentId) {
        throw new Error('El usuario ya está asignado a este departamento');
      } else {
        throw new Error('El usuario ya pertenece a otro departamento. Primero debes removerlo de su departamento actual.');
      }
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
