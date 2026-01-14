import { RoleType } from '@prisma/client';
import prisma from '../config/database';

export class PermissionsService {
  async getUserPermissions(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        roleType: true,
        isActive: true,
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

    const permissions = this.getRolePermissions(user.roleType);
    const departments = user.departmentUsers.map((du: any) => ({
      id: du.department.id,
      name: du.department.name,
      role: du.role
    }));

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleType: user.roleType,
        isActive: user.isActive
      },
      permissions,
      departments
    };
  }

  getRolePermissions(role: RoleType) {
    const basePermissions = {
      canViewOwnProfile: true,
      canUpdateOwnProfile: true
    };

    switch (role) {
      case RoleType.SUPER_ADMIN:
        return {
          ...basePermissions,
          canManageUsers: true,
          canManageDepartments: true,
          canManageTickets: true,
          canViewAllTickets: true,
          canViewAuditLogs: true,
          canManageRoles: true,
          canDeleteUsers: true,
          canRestoreUsers: true,
          canViewAllDepartments: true,
          canCreateDepartments: true,
          canDeleteDepartments: true
        };

      case RoleType.DEPT_ADMIN:
        return {
          ...basePermissions,
          canManageDepartmentUsers: true,
          canManageDepartmentTickets: true,
          canViewDepartmentTickets: true,
          canAssignTickets: true,
          canViewDepartmentStats: true,
          canManageSubordinates: true
        };

      case RoleType.SUBORDINATE:
        return {
          ...basePermissions,
          canViewAssignedTickets: true,
          canUpdateAssignedTickets: true,
          canCommentOnTickets: true,
          canViewDepartmentTickets: true
        };

      case RoleType.REQUESTER:
        return {
          ...basePermissions,
          canCreateTickets: true,
          canViewOwnTickets: true,
          canCommentOnOwnTickets: true,
          canCloseOwnTickets: true
        };

      default:
        return basePermissions;
    }
  }

  async checkUserDepartmentAccess(userId: string, departmentId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roleType: true }
    });

    if (!user) {
      return { hasAccess: false, reason: 'Usuario no encontrado' };
    }

    if (user.roleType === RoleType.SUPER_ADMIN) {
      return { hasAccess: true, role: 'SUPER_ADMIN' };
    }

    const departmentUser = await prisma.departmentUser.findFirst({
      where: {
        userId,
        departmentId
      },
      include: {
        department: true
      }
    });

    if (!departmentUser) {
      return { hasAccess: false, reason: 'No pertenece al departamento' };
    }

    return {
      hasAccess: true,
      role: departmentUser.role,
      department: {
        id: departmentUser.department.id,
        name: departmentUser.department.name
      }
    };
  }

  async getUserDepartments(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        roleType: true,
        departmentUsers: {
          include: {
            department: {
              select: {
                id: true,
                name: true,
                prefix: true,
                description: true,
                isDefaultForRequesters: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (user.roleType === RoleType.SUPER_ADMIN) {
      const allDepartments = await prisma.department.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          prefix: true,
          description: true,
          isDefaultForRequesters: true
        }
      });

      return allDepartments.map((dept: any) => ({
        ...dept,
        role: 'SUPER_ADMIN',
        userRole: user.roleType
      }));
    }

    return user.departmentUsers.map((du: any) => ({
      ...du.department,
      role: du.role,
      userRole: user.roleType
    }));
  }
}
