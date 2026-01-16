import prisma from '../config/database';
import { SLAPriority } from '@prisma/client';

interface CreateDepartmentSLAData {
  departmentId: string;
  slaConfigurationId: string;
  priority: SLAPriority;
  isDefault?: boolean;
}

class DepartmentSLAService {
  async getDepartmentSLAConfigurations(departmentId: string) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    });

    if (!department) {
      throw new Error('Department not found');
    }

    // Obtener configuraciones SLA del departamento
    const departmentSLAs = await prisma.$queryRaw`
      SELECT 
        ds.id,
        ds.department_id,
        ds.sla_configuration_id,
        ds.priority,
        ds.is_default,
        ds.created_at,
        s.name,
        s.description,
        s.response_time,
        s.resolution_time,
        s.escalation_enabled,
        s.escalation_time,
        s.business_hours_only,
        s.notify_on_breach,
        s.notify_before,
        s.is_active
      FROM department_sla ds
      INNER JOIN sla_configurations s ON ds.sla_configuration_id = s.id
      WHERE ds.department_id = ${departmentId}
      ORDER BY ds.priority ASC
    `;

    return departmentSLAs;
  }

  async assignSLAToDepartment(data: CreateDepartmentSLAData) {
    const { departmentId, slaConfigurationId, priority, isDefault = false } = data;

    // Verificar que el departamento existe
    const department = await prisma.department.findUnique({
      where: { id: departmentId }
    });

    if (!department) {
      throw new Error('Department not found');
    }

    // Verificar que la configuración SLA existe
    const slaConfig = await prisma.sLAConfiguration.findUnique({
      where: { id: slaConfigurationId }
    });

    if (!slaConfig) {
      throw new Error('SLA Configuration not found');
    }

    // Si se marca como default, desmarcar otros defaults del mismo departamento
    if (isDefault) {
      await prisma.$executeRaw`
        UPDATE department_sla 
        SET is_default = false 
        WHERE department_id = ${departmentId}
      `;
    }

    // Verificar si ya existe una asignación para esta prioridad
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM department_sla 
      WHERE department_id = ${departmentId} 
      AND priority = ${priority}
    `;

    if (existing.length > 0) {
      // Actualizar la existente
      await prisma.$executeRaw`
        UPDATE department_sla 
        SET sla_configuration_id = ${slaConfigurationId},
            is_default = ${isDefault}
        WHERE department_id = ${departmentId} 
        AND priority = ${priority}
      `;

      return await this.getDepartmentSLAByPriority(departmentId, priority);
    } else {
      // Crear nueva asignación
      await prisma.$executeRaw`
        INSERT INTO department_sla (department_id, sla_configuration_id, priority, is_default)
        VALUES (${departmentId}, ${slaConfigurationId}, ${priority}, ${isDefault})
      `;

      return await this.getDepartmentSLAByPriority(departmentId, priority);
    }
  }

  async getDepartmentSLAByPriority(departmentId: string, priority: SLAPriority) {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        ds.id,
        ds.department_id,
        ds.sla_configuration_id,
        ds.priority,
        ds.is_default,
        s.name,
        s.description,
        s.response_time,
        s.resolution_time,
        s.escalation_enabled,
        s.escalation_time,
        s.business_hours_only,
        s.notify_on_breach,
        s.notify_before
      FROM department_sla ds
      INNER JOIN sla_configurations s ON ds.sla_configuration_id = s.id
      WHERE ds.department_id = ${departmentId}
      AND ds.priority = ${priority}
    `;

    return result[0] || null;
  }

  async removeSLAFromDepartment(departmentId: string, priority: SLAPriority) {
    const result = await prisma.$executeRaw`
      DELETE FROM department_sla 
      WHERE department_id = ${departmentId} 
      AND priority = ${priority}
    `;

    if (result === 0) {
      throw new Error('SLA configuration not found for this department and priority');
    }

    return { success: true, message: 'SLA configuration removed from department' };
  }

  async getDefaultSLAForDepartment(departmentId: string) {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        ds.id,
        ds.sla_configuration_id,
        ds.priority,
        s.name,
        s.response_time,
        s.resolution_time
      FROM department_sla ds
      INNER JOIN sla_configurations s ON ds.sla_configuration_id = s.id
      WHERE ds.department_id = ${departmentId}
      AND ds.is_default = true
      LIMIT 1
    `;

    // Si no hay default del departamento, buscar el default global
    if (result.length === 0) {
      const globalDefault = await prisma.sLAConfiguration.findFirst({
        where: { isDefault: true, isActive: true }
      });

      return globalDefault;
    }

    return result[0];
  }
}

export default new DepartmentSLAService();
