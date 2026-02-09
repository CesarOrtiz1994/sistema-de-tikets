import prisma from '../config/database';
import { TicketStatus } from '@prisma/client';
import logger from '../config/logger';
import { notifySLAExceeded, notifySLAWarning } from '../services/notificationTriggers.service';

/**
 * Worker que verifica el estado de los SLA de los tickets
 * Debe ejecutarse periódicamente (cada 5-10 minutos)
 */
class SLACheckerWorker {
  /**
   * Verifica y actualiza tickets que han excedido su SLA
   */
  async checkSLABreaches(): Promise<void> {
    try {
      const now = new Date();
      
      logger.info('Iniciando verificación de SLA...');

      // Buscar tickets que excedieron el SLA
      const breachedTickets = await prisma.ticket.findMany({
        where: {
          slaDeadline: { lt: now },
          slaExceeded: false,
          status: { 
            notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.CANCELLED] 
          },
          // No contar tickets que están pausados (WAITING)
          NOT: {
            status: TicketStatus.WAITING
          }
        },
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          assignedToId: true,
          departmentId: true,
          slaDeadline: true,
          department: {
            select: { name: true }
          },
          assignedTo: {
            select: { name: true, email: true }
          }
        }
      });

      if (breachedTickets.length > 0) {
        logger.warn(`${breachedTickets.length} tickets han excedido su SLA`);

        // Actualizar todos los tickets que excedieron el SLA
        await prisma.ticket.updateMany({
          where: {
            id: { in: breachedTickets.map(t => t.id) }
          },
          data: {
            slaExceeded: true
          }
        });

        // Registrar en audit log
        for (const ticket of breachedTickets) {
          await prisma.auditLog.create({
            data: {
              userId: null, // Sistema automático
              action: 'SLA_BREACHED',
              resource: 'ticket',
              resourceId: ticket.id,
              details: {
                ticketNumber: ticket.ticketNumber,
                slaDeadline: ticket.slaDeadline,
                department: ticket.department.name,
                assignedTo: ticket.assignedTo?.name || 'Sin asignar'
              },
              status: 'success'
            }
          });

          logger.warn(`Ticket ${ticket.ticketNumber} excedió SLA - Deadline: ${ticket.slaDeadline}`);

          // Enviar notificaciones de SLA excedido
          notifySLAExceeded(ticket).catch(err =>
            logger.error(`Error sending SLA breach notification for ${ticket.ticketNumber}:`, err)
          );
        }
      } else {
        logger.info('No hay tickets con SLA excedido');
      }

      // Verificar tickets cerca de exceder el SLA (próximos 30 minutos)
      await this.checkUpcomingSLABreaches(now);

      logger.info('Verificación de SLA completada');
    } catch (error) {
      logger.error('Error en verificación de SLA:', error);
      throw error;
    }
  }

  /**
   * Verifica tickets que están cerca de exceder su SLA
   * y envía notificaciones preventivas
   */
  private async checkUpcomingSLABreaches(now: Date): Promise<void> {
    const warningThreshold = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutos

    const upcomingBreaches = await prisma.ticket.findMany({
      where: {
        slaDeadline: {
          gte: now,
          lte: warningThreshold
        },
        slaExceeded: false,
        status: {
          notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.CANCELLED, TicketStatus.WAITING]
        }
      },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        assignedToId: true,
        departmentId: true,
        slaDeadline: true,
        priority: true,
        department: {
          select: { name: true }
        },
        assignedTo: {
          select: { name: true, email: true }
        }
      }
    });

    if (upcomingBreaches.length > 0) {
      logger.warn(`⏰ ${upcomingBreaches.length} tickets cerca de exceder SLA (próximos 30 min)`);

      for (const ticket of upcomingBreaches) {
        const minutesRemaining = Math.floor(
          (new Date(ticket.slaDeadline!).getTime() - now.getTime()) / (1000 * 60)
        );

        logger.warn(
          `⏰ Ticket ${ticket.ticketNumber} excederá SLA en ${minutesRemaining} minutos - ` +
          `Asignado a: ${ticket.assignedTo?.name || 'Sin asignar'}`
        );

        // Enviar notificación preventiva de SLA
        notifySLAWarning(ticket).catch(err =>
          logger.error(`Error sending SLA warning notification for ${ticket.ticketNumber}:`, err)
        );
      }
    }
  }

  /**
   * Ejecuta el worker manualmente (para testing)
   */
  async runOnce(): Promise<void> {
    logger.info('Ejecutando worker de SLA manualmente...');
    await this.checkSLABreaches();
  }

  /**
   * Inicia el worker en modo continuo (ejecuta cada X minutos)
   */
  startScheduled(intervalMinutes: number = 5): void {
    logger.info(`Iniciando worker de SLA (cada ${intervalMinutes} minutos)...`);
    
    // Ejecutar inmediatamente
    this.checkSLABreaches();

    // Programar ejecuciones periódicas
    setInterval(() => {
      this.checkSLABreaches();
    }, intervalMinutes * 60 * 1000);
  }
}

export default new SLACheckerWorker();
