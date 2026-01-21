import prisma from '../config/database';

export class DepartmentAccessService {
  /**
   * Obtiene los departamentos a los que un usuario puede crear tickets
   * Lógica:
   * 1. Si el departamento tiene isDefaultForRequesters = true, TODOS pueden crear tickets
   * 2. Si no, solo los usuarios en DepartmentUser pueden crear tickets
   */
  async getAccessibleDepartmentsForUser(userId: string) {
    // Obtener departamentos por defecto (todos pueden crear tickets)
    const defaultDepartments = await prisma.department.findMany({
      where: {
        isDefaultForRequesters: true,
        isActive: true,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        description: true,
        isDefaultForRequesters: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Obtener departamentos donde el usuario tiene acceso explícito
    const userDepartments = await prisma.departmentTicketAccess.findMany({
      where: {
        userId,
        department: {
          isActive: true,
          deletedAt: null
        }
      },
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
    });

    // Combinar ambos y eliminar duplicados
    const accessibleDepartments = [
      ...defaultDepartments,
      ...userDepartments.map((ud: any) => ud.department)
    ];

    // Eliminar duplicados por ID
    const uniqueDepartments = accessibleDepartments.filter(
      (dept, index, self) => index === self.findIndex(d => d.id === dept.id)
    );

    return uniqueDepartments;
  }

  /**
   * Verifica si un usuario puede crear tickets en un departamento específico
   */
  async canUserCreateTicketInDepartment(userId: string, departmentId: string): Promise<boolean> {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: {
        isDefaultForRequesters: true,
        isActive: true,
        deletedAt: true
      }
    });

    if (!department || !department.isActive || department.deletedAt) {
      return false;
    }

    // Si es departamento por defecto, todos pueden
    if (department.isDefaultForRequesters) {
      return true;
    }

    // Verificar si el usuario tiene acceso explícito
    const userAccess = await prisma.departmentTicketAccess.findFirst({
      where: {
        userId,
        departmentId
      }
    });

    return !!userAccess;
  }

  /**
   * Asigna acceso a un usuario para crear tickets en un departamento
   */
  async grantUserAccessToDepartment(userId: string, departmentId: string) {
    // Verificar si ya existe
    const existing = await prisma.departmentTicketAccess.findFirst({
      where: {
        userId,
        departmentId
      }
    });

    if (existing) {
      return existing;
    }

    // Crear nuevo acceso
    return await prisma.departmentTicketAccess.create({
      data: {
        userId,
        departmentId
      }
    });
  }

  /**
   * Revoca el acceso de un usuario a un departamento
   */
  async revokeUserAccessFromDepartment(userId: string, departmentId: string) {
    const ticketAccess = await prisma.departmentTicketAccess.findFirst({
      where: {
        userId,
        departmentId
      }
    });

    if (!ticketAccess) {
      throw new Error('Usuario no tiene acceso a este departamento');
    }

    await prisma.departmentTicketAccess.delete({
      where: { id: ticketAccess.id }
    });

    return { message: 'Acceso revocado exitosamente' };
  }

  /**
   * Obtiene todos los usuarios con acceso a un departamento
   */
  async getUsersWithAccessToDepartment(departmentId: string) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: {
        isDefaultForRequesters: true
      }
    });

    if (!department) {
      throw new Error('Departamento no encontrado');
    }

    // Si es por defecto, retornar info especial
    if (department.isDefaultForRequesters) {
      return {
        isDefault: true,
        users: []
      };
    }

    // Obtener usuarios con acceso explícito
    const ticketAccessUsers = await prisma.departmentTicketAccess.findMany({
      where: { departmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true
          }
        }
      }
    });

    return {
      isDefault: false,
      users: ticketAccessUsers.map((ta: any) => ({
        id: ta.user.id,
        name: ta.user.name,
        email: ta.user.email,
        profilePicture: ta.user.profilePicture
      }))
    };
  }

  /**
   * Marca un departamento como por defecto (todos pueden crear tickets)
   */
  async setDepartmentAsDefault(departmentId: string, isDefault: boolean) {
    return await prisma.department.update({
      where: { id: departmentId },
      data: {
        isDefaultForRequesters: isDefault
      }
    });
  }
}

export default new DepartmentAccessService();
