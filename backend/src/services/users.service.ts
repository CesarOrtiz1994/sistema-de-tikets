import prisma from '../config/database';
import { RoleType } from '@prisma/client';

interface CreateUserData {
  email: string;
  name: string;
  roleType?: RoleType;
  language?: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  language?: string;
  profilePicture?: string;
}

interface ListUsersFilters {
  search?: string;
  roleType?: RoleType;
  isActive?: boolean;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

export class UsersService {
  async listUsers(filters: ListUsersFilters = {}) {
    const {
      search,
      roleType,
      isActive,
      includeDeleted = false,
      page = 1,
      limit = 10
    } = filters;

    const where: any = {};

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (roleType) {
      where.roleType = roleType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          roleType: true,
          isActive: true,
          language: true,
          profilePicture: true,
          googleId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        roleType: true,
        isActive: true,
        language: true,
        profilePicture: true,
        googleId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        departmentUsers: {
          include: {
            department: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  async createUser(data: CreateUserData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        roleType: data.roleType || RoleType.REQUESTER,
        language: data.language || 'es',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        roleType: true,
        isActive: true,
        language: true,
        createdAt: true
      }
    });

    return user;
  }

  async updateUser(userId: string, data: UpdateUserData) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.deletedAt) {
      throw new Error('No se puede actualizar un usuario eliminado');
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        throw new Error('El email ya está registrado');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        roleType: true,
        isActive: true,
        language: true,
        profilePicture: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.deletedAt) {
      throw new Error('El usuario ya está eliminado');
    }

    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        deletedAt: true
      }
    });

    return deletedUser;
  }

  async restoreUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (!user.deletedAt) {
      throw new Error('El usuario no está eliminado');
    }

    const restoredUser = await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true
      }
    });

    return restoredUser;
  }

  async changeUserRole(userId: string, newRole: RoleType) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.deletedAt) {
      throw new Error('No se puede cambiar el rol de un usuario eliminado');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roleType: newRole,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        roleType: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  async toggleUserActivation(userId: string, isActive: boolean) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.deletedAt) {
      throw new Error('No se puede activar/desactivar un usuario eliminado');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        updatedAt: true
      }
    });

    return updatedUser;
  }

  async getUserStats() {
    const [total, active, inactive, byRole] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, isActive: true } }),
      prisma.user.count({ where: { deletedAt: null, isActive: false } }),
      prisma.user.groupBy({
        by: ['roleType'],
        where: { deletedAt: null },
        _count: true
      })
    ]);

    return {
      total,
      active,
      inactive,
      byRole: byRole.map(r => ({
        role: r.roleType,
        count: r._count
      }))
    };
  }

  async getUserAdminDepartments(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        departmentUsers: {
          where: { role: 'ADMIN' },
          select: {
            role: true,
            department: {
              select: {
                id: true,
                name: true,
                prefix: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const departments = user.departmentUsers.map(du => {
      return du.department;
    });

    return departments;
  }
}

export default new UsersService();
