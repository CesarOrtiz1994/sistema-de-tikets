import prisma from '../config/database';
import { TicketStatus } from '@prisma/client';
import logger from '../config/logger';
import { notifyTicketAutoClosed } from '../services/notificationTriggers.service';

/**
 * Worker que auto-cierra tickets en estado RESOLVED después de X días hábiles
 * Debe ejecutarse periódicamente (cada 1 hora o diariamente)
 */
class AutoCloseTicketsWorker {

  /**
   * Calcula si han pasado suficientes días hábiles desde la resolución
   * tomando en cuenta el horario laboral del departamento
   */
  private async hasPassedBusinessDays(
    resolvedAt: Date,
    autoCloseAfterDays: number,
    departmentId: string
  ): Promise<boolean> {
    const now = new Date();
    
    // Obtener horario laboral del departamento
    const workSchedules = await prisma.departmentWorkSchedule.findMany({
      where: { departmentId },
      orderBy: { dayOfWeek: 'asc' }
    });

    if (workSchedules.length === 0) {
      // Si no hay horario configurado, usar días calendario
      const daysPassed = Math.floor((now.getTime() - resolvedAt.getTime()) / (1000 * 60 * 60 * 24));
      return daysPassed >= autoCloseAfterDays;
    }

    // Contar días hábiles desde la resolución
    let businessDaysPassed = 0;
    let currentDate = new Date(resolvedAt);
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate < now && businessDaysPassed < autoCloseAfterDays) {
      const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 6 = Sábado
      
      // Verificar si este día tiene horario laboral
      const hasWorkSchedule = workSchedules.some(ws => ws.dayOfWeek === dayOfWeek);
      
      if (hasWorkSchedule) {
        businessDaysPassed++;
      }

      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return businessDaysPassed >= autoCloseAfterDays;
  }

  /**
   * Verifica y cierra automáticamente tickets resueltos después de X días hábiles
   */
  async autoCloseResolvedTickets(): Promise<void> {
    try {
      logger.info('Iniciando verificación de tickets para auto-cierre...');

      // Buscar todos los tickets en estado RESOLVED
      const resolvedTickets = await prisma.ticket.findMany({
        where: {
          status: TicketStatus.RESOLVED,
          resolvedAt: { not: null },
          deletedAt: null
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
              autoCloseAfterDays: true
            }
          },
          requester: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
        }
      });

      if (resolvedTickets.length === 0) {
        logger.info('No hay tickets resueltos pendientes de auto-cierre');
        return;
      }

      logger.info(`Verificando ${resolvedTickets.length} tickets resueltos...`);

      let closedCount = 0;

      for (const ticket of resolvedTickets) {
        const department = await prisma.department.findUnique({
          where: { id: ticket.departmentId },
          select: { autoCloseAfterDays: true, name: true }
        });
        
        if (!department) continue;
        
        const autoCloseAfterDays = department.autoCloseAfterDays;
        
        // Verificar si han pasado suficientes días hábiles
        const shouldClose = await this.hasPassedBusinessDays(
          ticket.resolvedAt!,
          autoCloseAfterDays,
          ticket.departmentId
        );

        if (shouldClose) {
          // Cerrar el ticket automáticamente
          await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
              status: TicketStatus.CLOSED,
              closedAt: new Date()
            }
          });

          // Registrar en audit log
          await prisma.auditLog.create({
            data: {
              userId: null, // Sistema automático
              action: 'AUTO_CLOSE_TICKET',
              resource: 'ticket',
              resourceId: ticket.id,
              details: {
                ticketNumber: ticket.ticketNumber,
                resolvedAt: ticket.resolvedAt,
                autoClosedAfterDays: autoCloseAfterDays,
                department: department.name,
                reason: `Auto-cerrado después de ${autoCloseAfterDays} días hábiles desde la resolución`
              },
              status: 'success'
            }
          });

          closedCount++;

          logger.info(
            `✅ Ticket ${ticket.ticketNumber} auto-cerrado - ` +
            `Resuelto: ${ticket.resolvedAt?.toISOString()} - ` +
            `Días configurados: ${autoCloseAfterDays}`
          );

          // Notificar al solicitante del auto-cierre
          notifyTicketAutoClosed(
            { id: ticket.id, ticketNumber: ticket.ticketNumber, title: ticket.title, requesterId: ticket.requesterId },
            autoCloseAfterDays
          ).catch(err => logger.error(`Error sending auto-close notification for ${ticket.ticketNumber}:`, err));
        }
      }

      if (closedCount > 0) {
        logger.info(`${closedCount} tickets auto-cerrados exitosamente`);
      } else {
        logger.info('No hay tickets que cumplan los criterios para auto-cierre');
      }

      logger.info('Verificación de auto-cierre completada');
    } catch (error) {
      logger.error('Error en verificación de auto-cierre:', error);
      throw error;
    }
  }

  /**
   * Ejecuta el worker manualmente (para testing)
   */
  async runOnce(): Promise<void> {
    logger.info('Ejecutando worker de auto-cierre manualmente...');
    await this.autoCloseResolvedTickets();
  }

  /**
   * Inicia el worker en modo continuo (ejecuta cada X horas)
   */
  startScheduled(intervalHours: number = 1): void {
    logger.info(`Iniciando worker de auto-cierre (cada ${intervalHours} hora(s))...`);
    
    // Ejecutar inmediatamente
    this.autoCloseResolvedTickets();

    // Programar ejecuciones periódicas
    setInterval(() => {
      this.autoCloseResolvedTickets();
    }, intervalHours * 60 * 60 * 1000);
  }
}

export default new AutoCloseTicketsWorker();
