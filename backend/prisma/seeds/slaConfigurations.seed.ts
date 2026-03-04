import { PrismaClient, SLAPriority } from '@prisma/client';

export const slaConfigurationsSeed = async (prisma: PrismaClient) => {

  const slaConfigurations = [
    {
      name: 'Crítico',
      description: 'Para incidentes críticos que afectan operaciones principales',
      priority: SLAPriority.CRITICAL,
      responseTime: 15,        // 15 minutos
      resolutionTime: 120,     // 2 horas
      escalationEnabled: true,
      escalationTime: 30,      // 30 minutos
      businessHoursOnly: false,
      notifyOnBreach: true,
      notifyBefore: 15,
      isActive: true,
      isDefault: false
    },
    {
      name: 'Alto',
      description: 'Para problemas importantes que requieren atención urgente',
      priority: SLAPriority.HIGH,
      responseTime: 60,        // 1 hora
      resolutionTime: 480,     // 8 horas
      escalationEnabled: true,
      escalationTime: 120,     // 2 horas
      businessHoursOnly: true,
      notifyOnBreach: true,
      notifyBefore: 30,
      isActive: true,
      isDefault: false
    },
    {
      name: 'Medio',
      description: 'Para solicitudes estándar de soporte',
      priority: SLAPriority.MEDIUM,
      responseTime: 240,       // 4 horas
      resolutionTime: 1440,    // 24 horas (1 día)
      escalationEnabled: true,
      escalationTime: 480,     // 8 horas
      businessHoursOnly: true,
      notifyOnBreach: true,
      notifyBefore: 60,
      isActive: true,
      isDefault: true          // SLA por defecto
    },
    {
      name: 'Bajo',
      description: 'Para consultas generales y solicitudes de baja prioridad',
      priority: SLAPriority.LOW,
      responseTime: 480,       // 8 horas
      resolutionTime: 4320,    // 72 horas (3 días)
      escalationEnabled: false,
      escalationTime: null,
      businessHoursOnly: true,
      notifyOnBreach: true,
      notifyBefore: 120,
      isActive: true,
      isDefault: false
    }
  ];

  for (const sla of slaConfigurations) {
    await prisma.sLAConfiguration.upsert({
      where: { name: sla.name },
      update: sla,
      create: sla
    });
  }

};
