import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Sistema de Tickets API',
      version: '1.0.0',
      description: 'API REST del Sistema de Tickets PWA con Formularios Dinámicos',
      contact: {
        name: 'Soporte',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del flujo OAuth de Google',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Mensaje de error' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            profilePicture: { type: 'string', nullable: true },
            roleType: { type: 'string', enum: ['SUPER_ADMIN', 'DEPT_ADMIN', 'SUBORDINATE', 'REQUESTER'] },
            isActive: { type: 'boolean' },
            language: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Department: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            prefix: { type: 'string', example: 'IT' },
            isActive: { type: 'boolean' },
            isDefaultForRequesters: { type: 'boolean' },
            requireDeliverable: { type: 'boolean' },
            requireRating: { type: 'boolean' },
            maxDeliverableRejections: { type: 'integer' },
            autoCloseAfterDays: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ticketNumber: { type: 'string', example: 'IT-2026-001' },
            title: { type: 'string' },
            status: { type: 'string', enum: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'CANCELLED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            formData: { type: 'object' },
            waitingReason: { type: 'string', nullable: true },
            slaDeadline: { type: 'string', format: 'date-time', nullable: true },
            slaExceeded: { type: 'boolean' },
            departmentId: { type: 'string', format: 'uuid' },
            requesterId: { type: 'string', format: 'uuid' },
            assignedToId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            resolvedAt: { type: 'string', format: 'date-time', nullable: true },
            closedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        TicketForm: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'] },
            version: { type: 'integer' },
            departmentId: { type: 'string', format: 'uuid' },
            fields: { type: 'array', items: { $ref: '#/components/schemas/FormField' } },
          },
        },
        FormField: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            label: { type: 'string' },
            placeholder: { type: 'string', nullable: true },
            helpText: { type: 'string', nullable: true },
            isRequired: { type: 'boolean' },
            isVisible: { type: 'boolean' },
            order: { type: 'integer' },
            fieldTypeId: { type: 'string', format: 'uuid' },
            options: { type: 'array', items: { $ref: '#/components/schemas/FieldOption' } },
          },
        },
        FieldOption: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            label: { type: 'string' },
            value: { type: 'string' },
            order: { type: 'integer' },
            isDefault: { type: 'boolean' },
          },
        },
        TicketMessage: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            ticketId: { type: 'string', format: 'uuid' },
            senderId: { type: 'string', format: 'uuid' },
            attachment: { type: 'object', nullable: true },
            replyToId: { type: 'string', format: 'uuid', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            data: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        TicketRating: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ticketId: { type: 'string', format: 'uuid' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            comment: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Deliverable: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ticketId: { type: 'string', format: 'uuid' },
            fileName: { type: 'string' },
            filePath: { type: 'string' },
            fileSize: { type: 'integer' },
            mimeType: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
            rejectionReason: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        SLAConfiguration: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
            responseTimeMinutes: { type: 'integer' },
            resolutionTimeMinutes: { type: 'integer' },
            isDefault: { type: 'boolean' },
          },
        },
        DashboardMetrics: {
          type: 'object',
          properties: {
            totalTickets: { type: 'integer' },
            pendingTickets: { type: 'integer' },
            resolvedTickets: { type: 'integer' },
            slaExceeded: { type: 'integer' },
            ticketsByStatus: { type: 'object' },
            ticketsByPriority: { type: 'object' },
            recentTickets: { type: 'array', items: { $ref: '#/components/schemas/Ticket' } },
          },
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            action: { type: 'string' },
            entityType: { type: 'string' },
            entityId: { type: 'string' },
            userId: { type: 'string', format: 'uuid' },
            details: { type: 'object', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1 },
          description: 'Número de página',
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 20 },
          description: 'Elementos por página',
        },
        SearchParam: {
          in: 'query',
          name: 'search',
          schema: { type: 'string' },
          description: 'Texto de búsqueda',
        },
      },
      responses: {
        Unauthorized: {
          description: 'No autenticado',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        Forbidden: {
          description: 'Sin permisos',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFound: {
          description: 'Recurso no encontrado',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Autenticación con Google OAuth y gestión de sesiones' },
      { name: 'Users', description: 'Gestión de usuarios' },
      { name: 'Permissions', description: 'Permisos y accesos del usuario' },
      { name: 'Audit', description: 'Logs de auditoría' },
      { name: 'Departments', description: 'Gestión de departamentos' },
      { name: 'Department Access', description: 'Control de acceso a departamentos para solicitantes' },
      { name: 'Department SLA', description: 'Configuración de SLA por departamento' },
      { name: 'Department Work Schedule', description: 'Horarios laborales por departamento' },
      { name: 'SLA Configuration', description: 'Configuraciones globales de SLA' },
      { name: 'Field Types', description: 'Catálogo de tipos de campos para formularios' },
      { name: 'Forms', description: 'Gestión de formularios dinámicos (Form Builder)' },
      { name: 'Form Fields', description: 'Campos de formularios' },
      { name: 'Field Options', description: 'Opciones de campos (select, radio, checkbox)' },
      { name: 'Upload', description: 'Subida y gestión de archivos' },
      { name: 'File Cleanup', description: 'Limpieza y estadísticas de archivos (Super Admin)' },
      { name: 'Tickets', description: 'Gestión de tickets' },
      { name: 'Ticket Rating', description: 'Calificación, cierre y reapertura de tickets' },
      { name: 'Kanban', description: 'Tablero Kanban de tickets' },
      { name: 'Messages', description: 'Mensajes de chat en tickets' },
      { name: 'Chat Attachments', description: 'Adjuntos en mensajes de chat' },
      { name: 'Unread Messages', description: 'Conteo de mensajes no leídos' },
      { name: 'Ticket Attachments', description: 'Archivos adjuntos de tickets' },
      { name: 'Deliverables', description: 'Entregables de tickets' },
      { name: 'Notifications', description: 'Notificaciones in-app y push' },
      { name: 'Email Templates', description: 'Plantillas de email (Super Admin)' },
      { name: 'Metrics', description: 'Métricas y dashboards' },
      { name: 'Health', description: 'Estado del servidor' },
    ],
    paths: {
      // ==================== AUTH ====================
      '/api/auth/google': {
        get: {
          tags: ['Auth'],
          summary: 'Iniciar autenticación con Google',
          description: 'Redirige al usuario a la pantalla de login de Google OAuth',
          security: [],
          responses: {
            302: { description: 'Redirección a Google OAuth' },
          },
        },
      },
      '/api/auth/google/callback': {
        get: {
          tags: ['Auth'],
          summary: 'Callback de Google OAuth',
          description: 'Recibe el código de autorización de Google y genera tokens JWT',
          security: [],
          responses: {
            302: { description: 'Redirección al frontend con tokens' },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Renovar token de acceso',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] } } },
          },
          responses: {
            200: { description: 'Tokens renovados', content: { 'application/json': { schema: { type: 'object', properties: { accessToken: { type: 'string' }, refreshToken: { type: 'string' } } } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Cerrar sesión',
          security: [],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'Sesión cerrada' } },
        },
      },
      '/api/auth/logout-all': {
        post: {
          tags: ['Auth'],
          summary: 'Cerrar todas las sesiones',
          responses: { 200: { description: 'Todas las sesiones cerradas' } },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Obtener usuario actual',
          responses: {
            200: { description: 'Datos del usuario autenticado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/auth/sessions': {
        get: {
          tags: ['Auth'],
          summary: 'Obtener sesiones activas',
          responses: { 200: { description: 'Lista de sesiones activas del usuario' } },
        },
      },
      '/api/auth/health': {
        get: {
          tags: ['Auth'],
          summary: 'Health check de autenticación',
          security: [],
          responses: { 200: { description: 'Servicio de auth funcionando' } },
        },
      },

      // ==================== USERS ====================
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'Listar usuarios',
          description: 'Requiere rol DEPT_ADMIN o superior',
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
            { $ref: '#/components/parameters/SearchParam' },
            { in: 'query', name: 'roleType', schema: { type: 'string', enum: ['SUPER_ADMIN', 'DEPT_ADMIN', 'SUBORDINATE', 'REQUESTER'] } },
            { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
          ],
          responses: {
            200: { description: 'Lista paginada de usuarios' },
            403: { $ref: '#/components/responses/Forbidden' },
          },
        },
        post: {
          tags: ['Users'],
          summary: 'Crear usuario',
          description: 'Solo SUPER_ADMIN',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['email', 'name', 'roleType'], properties: { email: { type: 'string', format: 'email' }, name: { type: 'string' }, roleType: { type: 'string', enum: ['SUPER_ADMIN', 'DEPT_ADMIN', 'SUBORDINATE', 'REQUESTER'] } } } } },
          },
          responses: { 201: { description: 'Usuario creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } } },
        },
      },
      '/api/users/stats': {
        get: {
          tags: ['Users'],
          summary: 'Estadísticas de usuarios',
          description: 'Solo SUPER_ADMIN',
          responses: { 200: { description: 'Estadísticas de usuarios por rol y estado' } },
        },
      },
      '/api/users/me/admin-departments': {
        get: {
          tags: ['Users'],
          summary: 'Departamentos donde soy admin',
          responses: { 200: { description: 'Lista de departamentos administrados' } },
        },
      },
      '/api/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Obtener usuario por ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Datos del usuario', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        put: {
          tags: ['Users'],
          summary: 'Actualizar usuario',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, language: { type: 'string' } } } } } },
          responses: { 200: { description: 'Usuario actualizado' } },
        },
        delete: {
          tags: ['Users'],
          summary: 'Eliminar usuario (soft delete)',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Usuario eliminado' } },
        },
      },
      '/api/users/{id}/restore': {
        put: {
          tags: ['Users'],
          summary: 'Restaurar usuario eliminado',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Usuario restaurado' } },
        },
      },
      '/api/users/{id}/role': {
        put: {
          tags: ['Users'],
          summary: 'Cambiar rol de usuario',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['roleType'], properties: { roleType: { type: 'string', enum: ['SUPER_ADMIN', 'DEPT_ADMIN', 'SUBORDINATE', 'REQUESTER'] } } } } } },
          responses: { 200: { description: 'Rol actualizado' } },
        },
      },
      '/api/users/{id}/activate': {
        put: {
          tags: ['Users'],
          summary: 'Activar/desactivar usuario',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Estado de activación cambiado' } },
        },
      },

      // ==================== PERMISSIONS ====================
      '/api/permissions/me': {
        get: {
          tags: ['Permissions'],
          summary: 'Obtener mis permisos',
          responses: { 200: { description: 'Permisos del usuario autenticado' } },
        },
      },
      '/api/permissions/me/departments': {
        get: {
          tags: ['Permissions'],
          summary: 'Obtener mis departamentos',
          responses: { 200: { description: 'Departamentos accesibles' } },
        },
      },
      '/api/permissions/users/{userId}': {
        get: {
          tags: ['Permissions'],
          summary: 'Obtener permisos de un usuario',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'userId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Permisos del usuario' } },
        },
      },
      '/api/permissions/departments/{departmentId}/access': {
        get: {
          tags: ['Permissions'],
          summary: 'Verificar acceso a departamento',
          parameters: [{ in: 'path', name: 'departmentId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Información de acceso' } },
        },
      },

      // ==================== AUDIT ====================
      '/api/audit': {
        get: {
          tags: ['Audit'],
          summary: 'Listar logs de auditoría',
          description: 'Solo SUPER_ADMIN',
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
            { in: 'query', name: 'action', schema: { type: 'string' } },
            { in: 'query', name: 'userId', schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Lista paginada de logs' } },
        },
      },
      '/api/audit/me': {
        get: {
          tags: ['Audit'],
          summary: 'Mis logs de auditoría',
          responses: { 200: { description: 'Logs del usuario autenticado' } },
        },
      },
      '/api/audit/stats': {
        get: {
          tags: ['Audit'],
          summary: 'Estadísticas de auditoría',
          description: 'Solo SUPER_ADMIN',
          responses: { 200: { description: 'Estadísticas de acciones' } },
        },
      },
      '/api/audit/{id}': {
        get: {
          tags: ['Audit'],
          summary: 'Obtener log por ID',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Detalle del log', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuditLog' } } } } },
        },
      },

      // ==================== DEPARTMENTS ====================
      '/api/departments': {
        get: {
          tags: ['Departments'],
          summary: 'Listar departamentos',
          description: 'SUPER_ADMIN ve todos, DEPT_ADMIN solo el suyo',
          responses: { 200: { description: 'Lista de departamentos' } },
        },
        post: {
          tags: ['Departments'],
          summary: 'Crear departamento',
          description: 'Solo SUPER_ADMIN',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['name', 'prefix'], properties: { name: { type: 'string' }, description: { type: 'string' }, prefix: { type: 'string', example: 'IT' }, isDefaultForRequesters: { type: 'boolean' }, requireDeliverable: { type: 'boolean' }, requireRating: { type: 'boolean' } } } } },
          },
          responses: { 201: { description: 'Departamento creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Department' } } } } },
        },
      },
      '/api/departments/my-admin-departments': {
        get: {
          tags: ['Departments'],
          summary: 'Departamentos donde soy admin',
          responses: { 200: { description: 'Lista de departamentos administrados' } },
        },
      },
      '/api/departments/{id}': {
        get: {
          tags: ['Departments'],
          summary: 'Obtener departamento por ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Datos del departamento', content: { 'application/json': { schema: { $ref: '#/components/schemas/Department' } } } } },
        },
        put: {
          tags: ['Departments'],
          summary: 'Actualizar departamento',
          description: 'SUPER_ADMIN todos los campos, DEPT_ADMIN campos limitados de su departamento',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, isActive: { type: 'boolean' }, requireDeliverable: { type: 'boolean' }, requireRating: { type: 'boolean' }, autoCloseAfterDays: { type: 'integer' } } } } } },
          responses: { 200: { description: 'Departamento actualizado' } },
        },
        delete: {
          tags: ['Departments'],
          summary: 'Eliminar departamento (soft delete)',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Departamento eliminado' } },
        },
      },
      '/api/departments/{id}/users': {
        get: {
          tags: ['Departments'],
          summary: 'Obtener usuarios del departamento',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Lista de usuarios del departamento' } },
        },
        post: {
          tags: ['Departments'],
          summary: 'Asignar usuario a departamento',
          description: 'SUPER_ADMIN o DEPT_ADMIN de su departamento',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['userId', 'role'], properties: { userId: { type: 'string', format: 'uuid' }, role: { type: 'string', enum: ['ADMIN', 'MEMBER'] } } } } } },
          responses: { 200: { description: 'Usuario asignado' } },
        },
      },
      '/api/departments/{id}/users/{userId}': {
        delete: {
          tags: ['Departments'],
          summary: 'Remover usuario del departamento',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
            { in: 'path', name: 'userId', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Usuario removido' } },
        },
      },

      // ==================== DEPARTMENT ACCESS ====================
      '/api/departments/accessible': {
        get: {
          tags: ['Department Access'],
          summary: 'Departamentos accesibles para el usuario',
          responses: { 200: { description: 'Lista de departamentos accesibles' } },
        },
      },
      '/api/departments/{departmentId}/users-with-access': {
        get: {
          tags: ['Department Access'],
          summary: 'Usuarios con acceso a departamento',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'departmentId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Lista de usuarios con acceso' } },
        },
      },
      '/api/departments/{departmentId}/grant-access': {
        post: {
          tags: ['Department Access'],
          summary: 'Otorgar acceso a usuario',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'departmentId', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['userId'], properties: { userId: { type: 'string', format: 'uuid' } } } } } },
          responses: { 200: { description: 'Acceso otorgado' } },
        },
      },
      '/api/departments/{departmentId}/revoke-access/{userId}': {
        delete: {
          tags: ['Department Access'],
          summary: 'Revocar acceso de usuario',
          description: 'Solo SUPER_ADMIN',
          parameters: [
            { in: 'path', name: 'departmentId', required: true, schema: { type: 'string', format: 'uuid' } },
            { in: 'path', name: 'userId', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Acceso revocado' } },
        },
      },
      '/api/departments/{departmentId}/set-default': {
        put: {
          tags: ['Department Access'],
          summary: 'Marcar departamento como por defecto',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'departmentId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Departamento marcado como default' } },
        },
      },

      // ==================== DEPARTMENT SLA ====================
      '/api/departments/{id}/sla': {
        get: {
          tags: ['Department SLA'],
          summary: 'Obtener configuraciones SLA del departamento',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Lista de configuraciones SLA' } },
        },
        post: {
          tags: ['Department SLA'],
          summary: 'Asignar/actualizar SLA a departamento',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['slaConfigurationId', 'priority'], properties: { slaConfigurationId: { type: 'string', format: 'uuid' }, priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } } } } } },
          responses: { 200: { description: 'SLA asignado' } },
        },
      },
      '/api/departments/{id}/sla/default': {
        get: {
          tags: ['Department SLA'],
          summary: 'Obtener SLA por defecto del departamento',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'SLA por defecto' } },
        },
      },
      '/api/departments/{id}/sla/priority/{priority}': {
        get: {
          tags: ['Department SLA'],
          summary: 'Obtener SLA por prioridad',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
            { in: 'path', name: 'priority', required: true, schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } },
          ],
          responses: { 200: { description: 'Configuración SLA para la prioridad' } },
        },
      },
      '/api/departments/{id}/sla/{priority}': {
        delete: {
          tags: ['Department SLA'],
          summary: 'Eliminar SLA de departamento',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
            { in: 'path', name: 'priority', required: true, schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } },
          ],
          responses: { 200: { description: 'SLA eliminado' } },
        },
      },

      // ==================== DEPARTMENT WORK SCHEDULE ====================
      '/api/departments/{id}/work-schedule': {
        get: {
          tags: ['Department Work Schedule'],
          summary: 'Obtener horario laboral del departamento',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Horario laboral (7 días)' } },
        },
        post: {
          tags: ['Department Work Schedule'],
          summary: 'Configurar horario completo',
          description: 'Solo DEPT_ADMIN del departamento',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { schedule: { type: 'array', items: { type: 'object', properties: { dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 }, isWorkDay: { type: 'boolean' }, startTime: { type: 'string', example: '09:00' }, endTime: { type: 'string', example: '18:00' } } } } } } } } },
          responses: { 200: { description: 'Horario configurado' } },
        },
        delete: {
          tags: ['Department Work Schedule'],
          summary: 'Resetear a horario por defecto',
          description: 'Solo DEPT_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Horario reseteado' } },
        },
      },
      '/api/departments/{id}/work-schedule/custom': {
        get: {
          tags: ['Department Work Schedule'],
          summary: 'Verificar si tiene horario personalizado',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Estado del horario personalizado' } },
        },
      },
      '/api/departments/{id}/work-schedule/{day}': {
        put: {
          tags: ['Department Work Schedule'],
          summary: 'Actualizar horario de un día',
          description: 'Solo DEPT_ADMIN',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
            { in: 'path', name: 'day', required: true, schema: { type: 'integer', minimum: 0, maximum: 6 } },
          ],
          responses: { 200: { description: 'Día actualizado' } },
        },
      },

      // ==================== SLA CONFIGURATION ====================
      '/api/sla-configurations': {
        get: {
          tags: ['SLA Configuration'],
          summary: 'Listar configuraciones SLA',
          responses: { 200: { description: 'Lista de configuraciones SLA' } },
        },
        post: {
          tags: ['SLA Configuration'],
          summary: 'Crear configuración SLA',
          description: 'Solo SUPER_ADMIN',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'priority', 'responseTimeMinutes', 'resolutionTimeMinutes'], properties: { name: { type: 'string' }, priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] }, responseTimeMinutes: { type: 'integer' }, resolutionTimeMinutes: { type: 'integer' }, isDefault: { type: 'boolean' } } } } } },
          responses: { 201: { description: 'SLA creado' } },
        },
      },
      '/api/sla-configurations/default': {
        get: {
          tags: ['SLA Configuration'],
          summary: 'Obtener SLA por defecto',
          responses: { 200: { description: 'Configuración SLA por defecto' } },
        },
      },
      '/api/sla-configurations/stats': {
        get: {
          tags: ['SLA Configuration'],
          summary: 'Estadísticas de SLA',
          description: 'Solo SUPER_ADMIN',
          responses: { 200: { description: 'Estadísticas de uso de SLA' } },
        },
      },
      '/api/sla-configurations/{id}': {
        get: {
          tags: ['SLA Configuration'],
          summary: 'Obtener SLA por ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Configuración SLA', content: { 'application/json': { schema: { $ref: '#/components/schemas/SLAConfiguration' } } } } },
        },
        put: {
          tags: ['SLA Configuration'],
          summary: 'Actualizar SLA',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'SLA actualizado' } },
        },
        delete: {
          tags: ['SLA Configuration'],
          summary: 'Eliminar SLA',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'SLA eliminado' } },
        },
      },

      // ==================== FIELD TYPES ====================
      '/api/field-types': {
        get: {
          tags: ['Field Types'],
          summary: 'Listar tipos de campos',
          responses: { 200: { description: 'Lista de tipos de campos disponibles' } },
        },
        post: {
          tags: ['Field Types'],
          summary: 'Crear tipo de campo',
          description: 'Solo SUPER_ADMIN',
          responses: { 201: { description: 'Tipo de campo creado' } },
        },
      },
      '/api/field-types/stats': {
        get: {
          tags: ['Field Types'],
          summary: 'Estadísticas de tipos de campos',
          description: 'Solo SUPER_ADMIN',
          responses: { 200: { description: 'Estadísticas de uso' } },
        },
      },
      '/api/field-types/{id}': {
        get: {
          tags: ['Field Types'],
          summary: 'Obtener tipo de campo por ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Tipo de campo' } },
        },
        put: {
          tags: ['Field Types'],
          summary: 'Actualizar tipo de campo',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Tipo actualizado' } },
        },
        delete: {
          tags: ['Field Types'],
          summary: 'Eliminar tipo de campo',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Tipo eliminado' } },
        },
      },
      '/api/field-types/{id}/validations': {
        get: {
          tags: ['Field Types'],
          summary: 'Validaciones disponibles para un tipo de campo',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Lista de reglas de validación' } },
        },
      },

      // ==================== FORMS ====================
      '/api/forms': {
        post: {
          tags: ['Forms'],
          summary: 'Crear formulario vacío',
          description: 'Solo DEPT_ADMIN',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'departmentId'], properties: { name: { type: 'string' }, description: { type: 'string' }, departmentId: { type: 'string', format: 'uuid' } } } } } },
          responses: { 201: { description: 'Formulario creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/TicketForm' } } } } },
        },
      },
      '/api/forms/departments/{id}/forms': {
        get: {
          tags: ['Forms'],
          summary: 'Formularios de un departamento',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Lista de formularios' } },
        },
      },
      '/api/forms/departments/{id}/active-form': {
        get: {
          tags: ['Forms'],
          summary: 'Formulario activo del departamento',
          description: 'Retorna el formulario con status ACTIVE para renderizado dinámico',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Formulario activo con campos y opciones', content: { 'application/json': { schema: { $ref: '#/components/schemas/TicketForm' } } } },
            404: { description: 'No hay formulario activo' },
          },
        },
      },
      '/api/forms/departments/{departmentId}/stats': {
        get: {
          tags: ['Forms'],
          summary: 'Estadísticas de formularios del departamento',
          parameters: [{ in: 'path', name: 'departmentId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Estadísticas' } },
        },
      },
      '/api/forms/departments/{departmentId}/forms/{formId}/default': {
        put: {
          tags: ['Forms'],
          summary: 'Establecer formulario como predeterminado',
          parameters: [
            { in: 'path', name: 'departmentId', required: true, schema: { type: 'string', format: 'uuid' } },
            { in: 'path', name: 'formId', required: true, schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Formulario marcado como predeterminado' } },
        },
      },
      '/api/forms/{id}': {
        get: {
          tags: ['Forms'],
          summary: 'Obtener formulario por ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Formulario completo con campos y opciones' } },
        },
        put: {
          tags: ['Forms'],
          summary: 'Actualizar formulario',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Formulario actualizado' } },
        },
        delete: {
          tags: ['Forms'],
          summary: 'Eliminar formulario (soft delete)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Formulario eliminado' } },
        },
      },
      '/api/forms/{id}/duplicate': {
        post: {
          tags: ['Forms'],
          summary: 'Duplicar formulario',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } } } } },
          responses: { 201: { description: 'Formulario duplicado' } },
        },
      },
      '/api/forms/{id}/activate': {
        put: {
          tags: ['Forms'],
          summary: 'Activar formulario',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { incrementVersion: { type: 'boolean' } } } } } },
          responses: { 200: { description: 'Formulario activado' } },
        },
      },

      // ==================== FORM FIELDS ====================
      '/api/forms/fields': {
        post: {
          tags: ['Form Fields'],
          summary: 'Agregar campo a formulario',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['formId', 'fieldTypeId', 'label'], properties: { formId: { type: 'string', format: 'uuid' }, fieldTypeId: { type: 'string', format: 'uuid' }, label: { type: 'string' }, placeholder: { type: 'string' }, helpText: { type: 'string' }, isRequired: { type: 'boolean' }, isVisible: { type: 'boolean' } } } } } },
          responses: { 201: { description: 'Campo agregado' } },
        },
      },
      '/api/forms/fields/{id}': {
        put: {
          tags: ['Form Fields'],
          summary: 'Actualizar campo',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Campo actualizado' } },
        },
        delete: {
          tags: ['Form Fields'],
          summary: 'Eliminar campo',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Campo eliminado' } },
        },
      },
      '/api/forms/{formId}/fields/reorder': {
        put: {
          tags: ['Form Fields'],
          summary: 'Reordenar campos',
          parameters: [{ in: 'path', name: 'formId', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['fieldIds'], properties: { fieldIds: { type: 'array', items: { type: 'string', format: 'uuid' } } } } } } },
          responses: { 200: { description: 'Campos reordenados' } },
        },
      },

      // ==================== FIELD OPTIONS ====================
      '/api/forms/fields/options': {
        post: {
          tags: ['Field Options'],
          summary: 'Agregar opción a campo',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['fieldId', 'label', 'value'], properties: { fieldId: { type: 'string', format: 'uuid' }, label: { type: 'string' }, value: { type: 'string' }, isDefault: { type: 'boolean' } } } } } },
          responses: { 201: { description: 'Opción agregada' } },
        },
      },
      '/api/forms/fields/options/{id}': {
        put: {
          tags: ['Field Options'],
          summary: 'Actualizar opción',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Opción actualizada' } },
        },
        delete: {
          tags: ['Field Options'],
          summary: 'Eliminar opción',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Opción eliminada' } },
        },
      },
      '/api/forms/fields/{fieldId}/options/bulk': {
        post: {
          tags: ['Field Options'],
          summary: 'Crear múltiples opciones',
          parameters: [{ in: 'path', name: 'fieldId', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['options'], properties: { options: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' }, isDefault: { type: 'boolean' } } } } } } } } },
          responses: { 201: { description: 'Opciones creadas' } },
        },
      },

      // ==================== UPLOAD ====================
      '/api/upload/single': {
        post: {
          tags: ['Upload'],
          summary: 'Subir un archivo',
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Archivo subido', content: { 'application/json': { schema: { type: 'object', properties: { url: { type: 'string' }, fileName: { type: 'string' }, size: { type: 'integer' }, mimeType: { type: 'string' } } } } } } },
        },
      },
      '/api/upload/multiple': {
        post: {
          tags: ['Upload'],
          summary: 'Subir múltiples archivos (máx 10)',
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } } } },
          responses: { 200: { description: 'Archivos subidos' } },
        },
      },
      '/api/upload': {
        delete: {
          tags: ['Upload'],
          summary: 'Eliminar archivo',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['url'], properties: { url: { type: 'string' } } } } } },
          responses: { 200: { description: 'Archivo eliminado' } },
        },
      },

      // ==================== FILE CLEANUP ====================
      '/api/file-cleanup/manual': {
        post: {
          tags: ['File Cleanup'],
          summary: 'Ejecutar limpieza manual completa',
          description: 'Solo SUPER_ADMIN',
          responses: { 200: { description: 'Limpieza ejecutada' } },
        },
      },
      '/api/file-cleanup/stats': {
        get: {
          tags: ['File Cleanup'],
          summary: 'Estadísticas de almacenamiento',
          description: 'Solo SUPER_ADMIN',
          responses: { 200: { description: 'Estadísticas de archivos y espacio' } },
        },
      },
      '/api/file-cleanup/temp': {
        post: {
          tags: ['File Cleanup'],
          summary: 'Limpiar archivos temporales',
          description: 'Solo SUPER_ADMIN',
          responses: { 200: { description: 'Archivos temporales limpiados' } },
        },
      },
      '/api/file-cleanup/orphans': {
        post: {
          tags: ['File Cleanup'],
          summary: 'Limpiar archivos huérfanos',
          description: 'Solo SUPER_ADMIN',
          responses: { 200: { description: 'Archivos huérfanos limpiados' } },
        },
      },

      // ==================== TICKETS ====================
      '/api/tickets': {
        post: {
          tags: ['Tickets'],
          summary: 'Crear ticket',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['title', 'departmentId', 'formId', 'formData'], properties: { title: { type: 'string' }, departmentId: { type: 'string', format: 'uuid' }, formId: { type: 'string', format: 'uuid' }, formData: { type: 'object' }, priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } } } } },
          },
          responses: { 201: { description: 'Ticket creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } } } },
        },
        get: {
          tags: ['Tickets'],
          summary: 'Listar tickets con filtros',
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
            { $ref: '#/components/parameters/SearchParam' },
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'CANCELLED'] } },
            { in: 'query', name: 'priority', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } },
            { in: 'query', name: 'departmentId', schema: { type: 'string', format: 'uuid' } },
            { in: 'query', name: 'assignedToId', schema: { type: 'string', format: 'uuid' } },
          ],
          responses: { 200: { description: 'Lista paginada de tickets' } },
        },
      },
      '/api/tickets/{id}': {
        get: {
          tags: ['Tickets'],
          summary: 'Obtener ticket por ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Ticket completo con relaciones', content: { 'application/json': { schema: { $ref: '#/components/schemas/Ticket' } } } } },
        },
        put: {
          tags: ['Tickets'],
          summary: 'Actualizar ticket',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' }, priority: { type: 'string' } } } } } },
          responses: { 200: { description: 'Ticket actualizado' } },
        },
      },
      '/api/tickets/{id}/assign': {
        put: {
          tags: ['Tickets'],
          summary: 'Asignar ticket a usuario',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['assignedToId'], properties: { assignedToId: { type: 'string', format: 'uuid' } } } } } },
          responses: { 200: { description: 'Ticket asignado' } },
        },
      },
      '/api/tickets/{id}/status': {
        put: {
          tags: ['Tickets'],
          summary: 'Cambiar estado del ticket',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED', 'CANCELLED'] }, waitingReason: { type: 'string', maxLength: 500, description: 'Requerido cuando status es WAITING' } } } } } },
          responses: { 200: { description: 'Estado actualizado' } },
        },
      },
      '/api/tickets/{id}/priority': {
        put: {
          tags: ['Tickets'],
          summary: 'Cambiar prioridad del ticket',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['priority'], properties: { priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } } } } } },
          responses: { 200: { description: 'Prioridad actualizada' } },
        },
      },

      // ==================== TICKET RATING ====================
      '/api/tickets/{id}/resolve': {
        put: {
          tags: ['Ticket Rating'],
          summary: 'Marcar ticket como resuelto',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Ticket marcado como resuelto' } },
        },
      },
      '/api/tickets/{id}/rate': {
        post: {
          tags: ['Ticket Rating'],
          summary: 'Calificar ticket',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['rating'], properties: { rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string', maxLength: 500 } } } } } },
          responses: { 200: { description: 'Ticket calificado' } },
        },
      },
      '/api/tickets/{id}/close': {
        put: {
          tags: ['Ticket Rating'],
          summary: 'Cerrar ticket',
          description: 'Opcionalmente incluye calificación si el departamento lo requiere',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string' } } } } } },
          responses: { 200: { description: 'Ticket cerrado' } },
        },
      },
      '/api/tickets/{id}/reopen': {
        post: {
          tags: ['Ticket Rating'],
          summary: 'Reabrir ticket',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string', maxLength: 500 } } } } } },
          responses: { 200: { description: 'Ticket reabierto' } },
        },
      },

      // ==================== KANBAN ====================
      '/api/kanban/all': {
        get: {
          tags: ['Kanban'],
          summary: 'Kanban de todos los departamentos del usuario',
          responses: { 200: { description: 'Tickets agrupados por estado de todos los departamentos' } },
        },
      },
      '/api/departments/{id}/kanban': {
        get: {
          tags: ['Kanban'],
          summary: 'Kanban de un departamento',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } },
            { in: 'query', name: 'priority', schema: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] } },
            { in: 'query', name: 'assignedToId', schema: { type: 'string', format: 'uuid' } },
            { in: 'query', name: 'onlyMine', schema: { type: 'boolean' } },
          ],
          responses: { 200: { description: 'Tickets agrupados por estado' } },
        },
      },
      '/api/tickets/{id}/quick-assign': {
        put: {
          tags: ['Kanban'],
          summary: 'Asignación rápida desde Kanban',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { assignedToId: { type: 'string', format: 'uuid', nullable: true } } } } } },
          responses: { 200: { description: 'Ticket asignado' } },
        },
      },

      // ==================== MESSAGES ====================
      '/api/tickets/{ticketId}/messages': {
        get: {
          tags: ['Messages'],
          summary: 'Obtener mensajes del ticket',
          parameters: [
            { in: 'path', name: 'ticketId', required: true, schema: { type: 'string', format: 'uuid' } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 50 } },
            { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } },
          ],
          responses: { 200: { description: 'Lista de mensajes' } },
        },
        post: {
          tags: ['Messages'],
          summary: 'Enviar mensaje (REST fallback)',
          parameters: [{ in: 'path', name: 'ticketId', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['content'], properties: { content: { type: 'string' }, attachment: { type: 'object' }, replyToId: { type: 'string', format: 'uuid' } } } } } },
          responses: { 201: { description: 'Mensaje enviado' } },
        },
      },
      '/api/tickets/{ticketId}/messages/search': {
        get: {
          tags: ['Messages'],
          summary: 'Buscar mensajes en ticket',
          parameters: [
            { in: 'path', name: 'ticketId', required: true, schema: { type: 'string', format: 'uuid' } },
            { in: 'query', name: 'q', required: true, schema: { type: 'string' }, description: 'Texto a buscar' },
          ],
          responses: { 200: { description: 'Mensajes encontrados' } },
        },
      },
      '/api/messages/{messageId}': {
        delete: {
          tags: ['Messages'],
          summary: 'Eliminar mensaje',
          parameters: [{ in: 'path', name: 'messageId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Mensaje eliminado' } },
        },
      },

      // ==================== CHAT ATTACHMENTS ====================
      '/api/tickets/{ticketId}/messages/upload': {
        post: {
          tags: ['Chat Attachments'],
          summary: 'Subir adjunto de chat',
          parameters: [{ in: 'path', name: 'ticketId', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } } },
          responses: { 200: { description: 'Adjunto subido' } },
        },
      },

      // ==================== UNREAD MESSAGES ====================
      '/api/unread-messages/counts': {
        get: {
          tags: ['Unread Messages'],
          summary: 'Conteos de no leídos de todos los tickets',
          responses: { 200: { description: 'Mapa de ticketId → count' } },
        },
      },
      '/api/unread-messages/{ticketId}/count': {
        get: {
          tags: ['Unread Messages'],
          summary: 'Conteo de no leídos de un ticket',
          parameters: [{ in: 'path', name: 'ticketId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Conteo de mensajes no leídos' } },
        },
      },
      '/api/unread-messages/{ticketId}/mark-read': {
        post: {
          tags: ['Unread Messages'],
          summary: 'Marcar ticket como leído',
          parameters: [{ in: 'path', name: 'ticketId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Marcado como leído' } },
        },
      },

      // ==================== TICKET ATTACHMENTS ====================
      '/api/tickets/{ticketId}/attachments': {
        get: {
          tags: ['Ticket Attachments'],
          summary: 'Obtener archivos adjuntos del ticket',
          parameters: [{ in: 'path', name: 'ticketId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Lista de archivos adjuntos' } },
        },
      },
      '/api/tickets/{ticketId}/attachments/stats': {
        get: {
          tags: ['Ticket Attachments'],
          summary: 'Estadísticas de archivos del ticket',
          parameters: [{ in: 'path', name: 'ticketId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Estadísticas de archivos' } },
        },
      },

      // ==================== DELIVERABLES ====================
      '/api/tickets/{ticketId}/deliverables': {
        post: {
          tags: ['Deliverables'],
          summary: 'Subir entregable',
          parameters: [{ in: 'path', name: 'ticketId', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } } },
          responses: { 201: { description: 'Entregable subido', content: { 'application/json': { schema: { $ref: '#/components/schemas/Deliverable' } } } } },
        },
        get: {
          tags: ['Deliverables'],
          summary: 'Obtener entregables del ticket',
          parameters: [{ in: 'path', name: 'ticketId', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Lista de entregables' } },
        },
      },
      '/api/tickets/deliverables/{id}/approve': {
        post: {
          tags: ['Deliverables'],
          summary: 'Aprobar entregable',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Entregable aprobado' } },
        },
      },
      '/api/tickets/deliverables/{id}/reject': {
        post: {
          tags: ['Deliverables'],
          summary: 'Rechazar entregable',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['rejectionReason'], properties: { rejectionReason: { type: 'string' } } } } } },
          responses: { 200: { description: 'Entregable rechazado' } },
        },
      },

      // ==================== NOTIFICATIONS ====================
      '/api/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Listar notificaciones',
          parameters: [
            { $ref: '#/components/parameters/PageParam' },
            { $ref: '#/components/parameters/LimitParam' },
          ],
          responses: { 200: { description: 'Lista paginada de notificaciones' } },
        },
      },
      '/api/notifications/unread-count': {
        get: {
          tags: ['Notifications'],
          summary: 'Conteo de notificaciones no leídas',
          responses: { 200: { description: 'Conteo', content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'integer' } } } } } } },
        },
      },
      '/api/notifications/read-all': {
        put: {
          tags: ['Notifications'],
          summary: 'Marcar todas como leídas',
          responses: { 200: { description: 'Todas marcadas como leídas' } },
        },
      },
      '/api/notifications/{id}/read': {
        put: {
          tags: ['Notifications'],
          summary: 'Marcar notificación como leída',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Notificación marcada como leída' } },
        },
      },
      '/api/notifications/register-token': {
        post: {
          tags: ['Notifications'],
          summary: 'Registrar token FCM para push notifications',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } } } } },
          responses: { 200: { description: 'Token registrado' } },
        },
      },
      '/api/notifications/unregister-token': {
        delete: {
          tags: ['Notifications'],
          summary: 'Eliminar token FCM',
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } } } } },
          responses: { 200: { description: 'Token eliminado' } },
        },
      },

      // ==================== EMAIL TEMPLATES ====================
      '/api/email-templates': {
        get: {
          tags: ['Email Templates'],
          summary: 'Listar plantillas de email',
          description: 'Solo SUPER_ADMIN',
          responses: { 200: { description: 'Lista de plantillas' } },
        },
      },
      '/api/email-templates/{id}': {
        get: {
          tags: ['Email Templates'],
          summary: 'Obtener plantilla por ID',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Plantilla de email' } },
        },
        put: {
          tags: ['Email Templates'],
          summary: 'Actualizar plantilla',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Plantilla actualizada' } },
        },
      },
      '/api/email-templates/{id}/preview': {
        post: {
          tags: ['Email Templates'],
          summary: 'Preview de plantilla con variables',
          description: 'Solo SUPER_ADMIN',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { variables: { type: 'object', example: { ticket_number: 'IT-2026-001', user_name: 'Juan' } } } } } } },
          responses: { 200: { description: 'HTML renderizado de la plantilla' } },
        },
      },

      // ==================== METRICS ====================
      '/api/metrics/dashboard': {
        get: {
          tags: ['Metrics'],
          summary: 'Métricas generales del dashboard',
          description: 'Datos según rol: SUPER_ADMIN ve todo, DEPT_ADMIN/SUBORDINATE sus departamentos, REQUESTER sus tickets',
          parameters: [
            { in: 'query', name: 'departmentId', schema: { type: 'string', format: 'uuid' } },
            { in: 'query', name: 'period', schema: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] } },
          ],
          responses: { 200: { description: 'Métricas del dashboard', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardMetrics' } } } } },
        },
      },
      '/api/metrics/departments': {
        get: {
          tags: ['Metrics'],
          summary: 'Departamentos accesibles (para filtro)',
          responses: { 200: { description: 'Lista de departamentos para filtrar métricas' } },
        },
      },
      '/api/metrics/tickets-by-status': {
        get: {
          tags: ['Metrics'],
          summary: 'Tickets agrupados por estado',
          parameters: [
            { in: 'query', name: 'departmentId', schema: { type: 'string', format: 'uuid' } },
            { in: 'query', name: 'period', schema: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] } },
          ],
          responses: { 200: { description: 'Conteo por estado' } },
        },
      },
      '/api/metrics/tickets-by-department': {
        get: {
          tags: ['Metrics'],
          summary: 'Tickets agrupados por departamento',
          parameters: [{ in: 'query', name: 'period', schema: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] } }],
          responses: { 200: { description: 'Conteo por departamento' } },
        },
      },
      '/api/metrics/avg-resolution-time': {
        get: {
          tags: ['Metrics'],
          summary: 'Tiempo promedio de resolución',
          parameters: [
            { in: 'query', name: 'departmentId', schema: { type: 'string', format: 'uuid' } },
            { in: 'query', name: 'period', schema: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] } },
          ],
          responses: { 200: { description: 'Tiempo promedio en horas/minutos' } },
        },
      },
      '/api/metrics/satisfaction': {
        get: {
          tags: ['Metrics'],
          summary: 'Métricas de satisfacción',
          parameters: [
            { in: 'query', name: 'departmentId', schema: { type: 'string', format: 'uuid' } },
            { in: 'query', name: 'period', schema: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] } },
          ],
          responses: { 200: { description: 'Promedio de calificación y distribución' } },
        },
      },
      '/api/metrics/sla-compliance': {
        get: {
          tags: ['Metrics'],
          summary: 'Cumplimiento de SLA',
          parameters: [
            { in: 'query', name: 'departmentId', schema: { type: 'string', format: 'uuid' } },
            { in: 'query', name: 'period', schema: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] } },
          ],
          responses: { 200: { description: 'Porcentaje de cumplimiento SLA' } },
        },
      },
      '/api/metrics/tickets-trend': {
        get: {
          tags: ['Metrics'],
          summary: 'Tendencia de tickets (creados vs resueltos)',
          parameters: [
            { in: 'query', name: 'departmentId', schema: { type: 'string', format: 'uuid' } },
            { in: 'query', name: 'period', schema: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] } },
          ],
          responses: { 200: { description: 'Datos de tendencia por fecha' } },
        },
      },

      // ==================== HEALTH ====================
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check del servidor',
          security: [],
          responses: {
            200: {
              description: 'Servidor funcionando',
              content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' }, message: { type: 'string' }, timestamp: { type: 'string', format: 'date-time' }, environment: { type: 'string' } } } } },
            },
          },
        },
      },
    },
  },
  apis: [], // No usamos JSDoc en archivos, toda la spec está inline
};

export const swaggerSpec = swaggerJsdoc(options);
