import { PrismaClient } from '@prisma/client';

export const emailTemplatesSeed = async (prisma: PrismaClient) => {
  console.log('🌱 Seeding email templates...');

  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 24px 32px; text-align: center; }
      .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; }
      .header p { color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px; }
      .body { padding: 32px; }
      .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
      .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
      .info-box .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
      .info-box .value { font-size: 16px; color: #1e293b; font-weight: 600; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
      .badge-info { background: #dbeafe; color: #1d4ed8; }
      .badge-success { background: #dcfce7; color: #15803d; }
      .badge-warning { background: #fef3c7; color: #b45309; }
      .badge-danger { background: #fee2e2; color: #dc2626; }
      .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
      .footer { background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
      .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
    </style>
  `;

  const wrapTemplate = (content: string) => `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${baseStyles}</head>
    <body>
      <div style="padding: 20px;">
        <div class="container">
          <div class="header">
            <h1>Sistema de Tickets</h1>
            <p>Notificación automática</p>
          </div>
          ${content}
          <div class="footer">
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
            <p style="margin-top: 8px;">© {{year}} Sistema de Tickets</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const templates = [
    {
      code: 'TICKET_CREATED',
      name: 'Ticket Creado',
      subject: '[Ticket {{ticket_number}}] Nuevo ticket creado: {{ticket_title}}',
      htmlBody: wrapTemplate(`
        <div class="body">
          <p>Hola <strong>{{user_name}}</strong>,</p>
          <p>Se ha creado un nuevo ticket en el departamento <strong>{{department_name}}</strong>.</p>
          <div class="info-box">
            <div class="label">Número de Ticket</div>
            <div class="value">{{ticket_number}}</div>
          </div>
          <div class="info-box">
            <div class="label">Título</div>
            <div class="value">{{ticket_title}}</div>
          </div>
          <div class="info-box">
            <div class="label">Prioridad</div>
            <div class="value">{{ticket_priority}}</div>
          </div>
          <p>Solicitante: <strong>{{requester_name}}</strong></p>
          <p style="text-align: center; margin-top: 24px;">
            <a href="{{ticket_url}}" class="btn">Ver Ticket</a>
          </p>
        </div>
      `),
      textBody: 'Nuevo ticket {{ticket_number}}: {{ticket_title}} - Departamento: {{department_name}} - Prioridad: {{ticket_priority}} - Solicitante: {{requester_name}}',
      variables: ['user_name', 'ticket_number', 'ticket_title', 'department_name', 'ticket_priority', 'requester_name', 'ticket_url', 'year']
    },
    {
      code: 'TICKET_ASSIGNED',
      name: 'Ticket Asignado',
      subject: '[Ticket {{ticket_number}}] Te han asignado un ticket: {{ticket_title}}',
      htmlBody: wrapTemplate(`
        <div class="body">
          <p>Hola <strong>{{user_name}}</strong>,</p>
          <p>Se te ha asignado el siguiente ticket:</p>
          <div class="info-box">
            <div class="label">Número de Ticket</div>
            <div class="value">{{ticket_number}}</div>
          </div>
          <div class="info-box">
            <div class="label">Título</div>
            <div class="value">{{ticket_title}}</div>
          </div>
          <div class="info-box">
            <div class="label">Prioridad</div>
            <div class="value"><span class="badge badge-warning">{{ticket_priority}}</span></div>
          </div>
          <p>Departamento: <strong>{{department_name}}</strong></p>
          <p>Solicitante: <strong>{{requester_name}}</strong></p>
          <p style="text-align: center; margin-top: 24px;">
            <a href="{{ticket_url}}" class="btn">Ver Ticket</a>
          </p>
        </div>
      `),
      textBody: 'Te han asignado el ticket {{ticket_number}}: {{ticket_title}} - Prioridad: {{ticket_priority}} - Solicitante: {{requester_name}}',
      variables: ['user_name', 'ticket_number', 'ticket_title', 'department_name', 'ticket_priority', 'requester_name', 'ticket_url', 'year']
    },
    {
      code: 'TICKET_RESOLVED',
      name: 'Ticket Resuelto',
      subject: '[Ticket {{ticket_number}}] Tu ticket ha sido resuelto: {{ticket_title}}',
      htmlBody: wrapTemplate(`
        <div class="body">
          <p>Hola <strong>{{user_name}}</strong>,</p>
          <p>Tu ticket ha sido marcado como <span class="badge badge-success">Resuelto</span>.</p>
          <div class="info-box">
            <div class="label">Número de Ticket</div>
            <div class="value">{{ticket_number}}</div>
          </div>
          <div class="info-box">
            <div class="label">Título</div>
            <div class="value">{{ticket_title}}</div>
          </div>
          <p>Resuelto por: <strong>{{resolved_by}}</strong></p>
          <p>Por favor revisa la solución y cierra el ticket si estás satisfecho.</p>
          <p style="text-align: center; margin-top: 24px;">
            <a href="{{ticket_url}}" class="btn">Revisar y Cerrar</a>
          </p>
        </div>
      `),
      textBody: 'Tu ticket {{ticket_number}} ha sido resuelto: {{ticket_title}} - Resuelto por: {{resolved_by}}. Por favor revisa y cierra el ticket.',
      variables: ['user_name', 'ticket_number', 'ticket_title', 'resolved_by', 'ticket_url', 'year']
    },
    {
      code: 'TICKET_CLOSED',
      name: 'Ticket Cerrado',
      subject: '[Ticket {{ticket_number}}] Ticket cerrado: {{ticket_title}}',
      htmlBody: wrapTemplate(`
        <div class="body">
          <p>Hola <strong>{{user_name}}</strong>,</p>
          <p>El ticket ha sido <span class="badge badge-info">Cerrado</span>.</p>
          <div class="info-box">
            <div class="label">Número de Ticket</div>
            <div class="value">{{ticket_number}}</div>
          </div>
          <div class="info-box">
            <div class="label">Título</div>
            <div class="value">{{ticket_title}}</div>
          </div>
          <p>Cerrado por: <strong>{{closed_by}}</strong></p>
          <p style="text-align: center; margin-top: 24px;">
            <a href="{{ticket_url}}" class="btn">Ver Ticket</a>
          </p>
        </div>
      `),
      textBody: 'El ticket {{ticket_number}} ha sido cerrado: {{ticket_title}} - Cerrado por: {{closed_by}}',
      variables: ['user_name', 'ticket_number', 'ticket_title', 'closed_by', 'ticket_url', 'year']
    },
    {
      code: 'TICKET_REOPENED',
      name: 'Ticket Reabierto',
      subject: '[Ticket {{ticket_number}}] Ticket reabierto: {{ticket_title}}',
      htmlBody: wrapTemplate(`
        <div class="body">
          <p>Hola <strong>{{user_name}}</strong>,</p>
          <p>El ticket ha sido <span class="badge badge-warning">Reabierto</span>.</p>
          <div class="info-box">
            <div class="label">Número de Ticket</div>
            <div class="value">{{ticket_number}}</div>
          </div>
          <div class="info-box">
            <div class="label">Título</div>
            <div class="value">{{ticket_title}}</div>
          </div>
          <div class="info-box">
            <div class="label">Razón</div>
            <div class="value">{{reopen_reason}}</div>
          </div>
          <p>Reabierto por: <strong>{{reopened_by}}</strong></p>
          <p style="text-align: center; margin-top: 24px;">
            <a href="{{ticket_url}}" class="btn">Ver Ticket</a>
          </p>
        </div>
      `),
      textBody: 'El ticket {{ticket_number}} ha sido reabierto: {{ticket_title}} - Razón: {{reopen_reason}} - Por: {{reopened_by}}',
      variables: ['user_name', 'ticket_number', 'ticket_title', 'reopen_reason', 'reopened_by', 'ticket_url', 'year']
    },
    {
      code: 'TICKET_AUTO_CLOSED',
      name: 'Ticket Cerrado Automáticamente',
      subject: '[Ticket {{ticket_number}}] Ticket cerrado automáticamente: {{ticket_title}}',
      htmlBody: wrapTemplate(`
        <div class="body">
          <p>Hola <strong>{{user_name}}</strong>,</p>
          <p>Tu ticket ha sido cerrado automáticamente por inactividad después de <strong>{{days}}</strong> días hábiles sin respuesta.</p>
          <div class="info-box">
            <div class="label">Número de Ticket</div>
            <div class="value">{{ticket_number}}</div>
          </div>
          <div class="info-box">
            <div class="label">Título</div>
            <div class="value">{{ticket_title}}</div>
          </div>
          <p>Si necesitas reabrir este ticket, puedes hacerlo desde la plataforma.</p>
          <p style="text-align: center; margin-top: 24px;">
            <a href="{{ticket_url}}" class="btn">Ver Ticket</a>
          </p>
        </div>
      `),
      textBody: 'Tu ticket {{ticket_number}} ha sido cerrado automáticamente por inactividad: {{ticket_title}}',
      variables: ['user_name', 'ticket_number', 'ticket_title', 'days', 'ticket_url', 'year']
    },
    {
      code: 'DELIVERABLE_UPLOADED',
      name: 'Entregable Subido',
      subject: '[Ticket {{ticket_number}}] Nuevo entregable subido: {{ticket_title}}',
      htmlBody: wrapTemplate(`
        <div class="body">
          <p>Hola <strong>{{user_name}}</strong>,</p>
          <p>Se ha subido un nuevo entregable para tu ticket.</p>
          <div class="info-box">
            <div class="label">Número de Ticket</div>
            <div class="value">{{ticket_number}}</div>
          </div>
          <div class="info-box">
            <div class="label">Archivo</div>
            <div class="value">{{file_name}}</div>
          </div>
          <p>Subido por: <strong>{{uploaded_by}}</strong></p>
          <p>Por favor revisa el entregable y decide si lo apruebas o rechazas.</p>
          <p style="text-align: center; margin-top: 24px;">
            <a href="{{ticket_url}}" class="btn">Revisar Entregable</a>
          </p>
        </div>
      `),
      textBody: 'Nuevo entregable subido en el ticket {{ticket_number}}: {{file_name}} - Subido por: {{uploaded_by}}',
      variables: ['user_name', 'ticket_number', 'ticket_title', 'file_name', 'uploaded_by', 'ticket_url', 'year']
    },
    {
      code: 'DELIVERABLE_REJECTED',
      name: 'Entregable Rechazado',
      subject: '[Ticket {{ticket_number}}] Entregable rechazado: {{ticket_title}}',
      htmlBody: wrapTemplate(`
        <div class="body">
          <p>Hola <strong>{{user_name}}</strong>,</p>
          <p>Tu entregable ha sido <span class="badge badge-danger">Rechazado</span>.</p>
          <div class="info-box">
            <div class="label">Número de Ticket</div>
            <div class="value">{{ticket_number}}</div>
          </div>
          <div class="info-box">
            <div class="label">Motivo del Rechazo</div>
            <div class="value">{{rejection_reason}}</div>
          </div>
          <div class="info-box">
            <div class="label">Intentos Restantes</div>
            <div class="value">{{remaining_attempts}}</div>
          </div>
          <p>Por favor sube un nuevo entregable corrigiendo los problemas señalados.</p>
          <p style="text-align: center; margin-top: 24px;">
            <a href="{{ticket_url}}" class="btn">Subir Nuevo Entregable</a>
          </p>
        </div>
      `),
      textBody: 'Tu entregable del ticket {{ticket_number}} fue rechazado. Motivo: {{rejection_reason}}. Intentos restantes: {{remaining_attempts}}',
      variables: ['user_name', 'ticket_number', 'ticket_title', 'rejection_reason', 'remaining_attempts', 'ticket_url', 'year']
    },
    {
      code: 'SLA_WARNING',
      name: 'Advertencia de SLA',
      subject: '[URGENTE] Ticket {{ticket_number}} próximo a vencer SLA',
      htmlBody: wrapTemplate(`
        <div class="body">
          <p>Hola <strong>{{user_name}}</strong>,</p>
          <p>⚠️ El siguiente ticket está <span class="badge badge-warning">próximo a exceder su SLA</span>:</p>
          <div class="info-box">
            <div class="label">Número de Ticket</div>
            <div class="value">{{ticket_number}}</div>
          </div>
          <div class="info-box">
            <div class="label">Título</div>
            <div class="value">{{ticket_title}}</div>
          </div>
          <div class="info-box">
            <div class="label">Fecha Límite SLA</div>
            <div class="value">{{sla_deadline}}</div>
          </div>
          <p>Por favor atiende este ticket lo antes posible.</p>
          <p style="text-align: center; margin-top: 24px;">
            <a href="{{ticket_url}}" class="btn">Atender Ticket</a>
          </p>
        </div>
      `),
      textBody: 'URGENTE: El ticket {{ticket_number}} está próximo a exceder su SLA. Fecha límite: {{sla_deadline}}. Título: {{ticket_title}}',
      variables: ['user_name', 'ticket_number', 'ticket_title', 'sla_deadline', 'ticket_url', 'year']
    },
    {
      code: 'SLA_EXCEEDED',
      name: 'SLA Excedido',
      subject: '[CRÍTICO] Ticket {{ticket_number}} ha excedido su SLA',
      htmlBody: wrapTemplate(`
        <div class="body">
          <p>Hola <strong>{{user_name}}</strong>,</p>
          <p>🚨 El siguiente ticket ha <span class="badge badge-danger">excedido su SLA</span>:</p>
          <div class="info-box">
            <div class="label">Número de Ticket</div>
            <div class="value">{{ticket_number}}</div>
          </div>
          <div class="info-box">
            <div class="label">Título</div>
            <div class="value">{{ticket_title}}</div>
          </div>
          <div class="info-box">
            <div class="label">Fecha Límite SLA</div>
            <div class="value">{{sla_deadline}}</div>
          </div>
          <p>Este ticket requiere atención inmediata.</p>
          <p style="text-align: center; margin-top: 24px;">
            <a href="{{ticket_url}}" class="btn">Atender Ahora</a>
          </p>
        </div>
      `),
      textBody: 'CRÍTICO: El ticket {{ticket_number}} ha excedido su SLA. Fecha límite: {{sla_deadline}}. Título: {{ticket_title}}',
      variables: ['user_name', 'ticket_number', 'ticket_title', 'sla_deadline', 'ticket_url', 'year']
    }
  ];

  for (const template of templates) {
    await prisma.emailTemplate.upsert({
      where: { code: template.code },
      update: {
        name: template.name,
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
        variables: template.variables
      },
      create: {
        code: template.code,
        name: template.name,
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
        variables: template.variables
      }
    });
  }

  console.log(`✅ Created ${templates.length} email templates`);
};
