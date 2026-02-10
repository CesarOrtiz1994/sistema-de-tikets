# PLAN DE DESARROLLO COMPLETO

## Sistema de Tickets PWA con Formularios Dinámicos

**Duración total:** 25 semanas (6 meses aprox.)  
**Desarrollador:** 1 Full-Stack  
**Stack:** React + TypeScript + Node.js + PostgreSQL + Redis + Almacenamiento Local

---

## FASE 1: FUNDACIÓN (5 semanas)

### SEMANA 1: Setup Inicial del Proyecto

**Objetivo:** Tener el proyecto base configurado y funcionando

#### Backend
- [x] Crear repositorio backend con estructura inicial
- [x] Configurar TypeScript + ESLint + Prettier
- [x] Setup Express.js con estructura modular
- [x] Configurar variables de entorno (.env + .env.example)
- [x] Configurar seguridad:
  - [x] Instalar y configurar Helmet.js
  - [x] Configurar CORS (origins permitidos)
  - [x] Instalar express-rate-limit
  - [x] Configurar límites de request body
- [x] Setup de logging:
  - [x] Instalar Winston o Pino
  - [x] Configurar niveles de log (error, warn, info, debug)
  - [x] Logs a archivo y consola
- [x] Middleware de manejo de errores:
  - [x] Clase de errores personalizados
  - [x] Middleware global de errores
  - [x] Logger de errores
- [x] Setup PostgreSQL (local o Docker)
- [x] Inicializar Prisma ORM
- [x] Crear schema inicial de Prisma
- [x] Primera migración de BD

#### Frontend
- [x] Crear proyecto React con Vite + TypeScript
- [x] Configurar Tailwind CSS
- [ ] Instalar shadcn/ui
- [x] Configurar React Router
- [x] Setup de ESLint + Prettier
- [x] Estructura de carpetas base

#### DevOps
- [x] Configurar Git (main, develop branches)
- [x] Setup de scripts npm útiles
- [x] Documentación básica (README)

**Entregable:** Proyecto corriendo en local (frontend + backend)

---

### SEMANA 2: Autenticación con Google OAuth

**Objetivo:** Login funcional con Google

#### Backend
- [x] Instalar Passport.js + Passport-Google-OAuth20
- [x] Configurar Google OAuth en Google Console
- [x] Crear strategy de Passport
- [x] Endpoints de autenticación:
  - `GET /api/auth/google` - Iniciar OAuth
  - `GET /api/auth/google/callback` - Callback
  - `POST /api/auth/refresh` - Refresh token
  - `POST /api/auth/logout` - Cerrar sesión
  - `GET /api/auth/me` - Usuario actual
- [x] Implementar JWT (access + refresh tokens)
- [x] Middleware de autenticación (verificar JWT)
- [x] Tabla users completa en BD
- [x] Tabla user_sessions para gestión de sesiones
- [x] Lógica para revocar sesiones
- [x] Endpoint para ver sesiones activas
- [x] Endpoint para cerrar sesión en todos los dispositivos

#### Frontend
- [x] Página de Login
- [x] Componente GoogleLoginButton
- [x] Servicio de autenticación (API calls)
- [x] Store de autenticación (Zustand)
- [x] Hook useAuth
- [x] Guardar tokens en localStorage
- [x] Rutas protegidas (ProtectedRoute component)
- [x] Redirect automático si no está autenticado

**Entregable:** Login funcional con Google, tokens, rutas protegidas

---

### SEMANA 3: Sistema de Roles y Permisos

**Objetivo:** RBAC (Role-Based Access Control) funcional

#### Backend
- [x] Enum de roles en Prisma
- [x] Middleware checkPermission(role)
- [x] Middleware checkDepartmentAccess(action)
- [x] Endpoint para obtener permisos del usuario
- [x] Lógica para verificar acceso a departamentos
- [x] Tabla audit_logs para auditoría
- [x] Middleware para registrar acciones críticas
- [x] Endpoint para consultar logs de auditoría (Super Admin)

#### Frontend
- [x] Componente que muestra contenido según rol
- [x] Hook usePermissions
- [x] Utilidades para verificar permisos
- [x] Navbar diferente según rol

**Entregable:** Sistema de roles funcionando, cada rol ve lo que debe

---

### SEMANA 4: Gestión de Usuarios (Super Admin)

**Objetivo:** CRUD completo de usuarios

#### Backend
- [x] Endpoints de usuarios:
  - `GET /api/users` - Listar (Super Admin)
  - `POST /api/users` - Crear (Super Admin)
  - `GET /api/users/:id` - Obtener
  - `PUT /api/users/:id` - Actualizar
  - `DELETE /api/users/:id` - Soft delete (Super Admin)
  - `PUT /api/users/:id/restore` - Restaurar usuario eliminado
  - `PUT /api/users/:id/role` - Cambiar rol
  - `PUT /api/users/:id/activate` - Activar/desactivar
- [x] Implementar soft delete (campo deleted_at)
- [x] Filtrar usuarios eliminados en queries
- [x] Validaciones con Zod
- [x] Registrar cambios en audit_logs
- [ ] Tests básicos

#### Frontend
- [x] Página de gestión de usuarios
- [x] Tabla de usuarios con búsqueda y filtros
- [x] Modal para crear/editar usuario
- [x] Formulario con validación
- [x] Confirmaciones de eliminación
- [x] Paginación de usuarios

**Entregable:** Super Admin puede gestionar usuarios completamente

---

### SEMANA 5: Gestión de Departamentos

**Objetivo:** CRUD de departamentos y asignación de usuarios

#### Backend
- [x] Endpoints de departamentos:
  - `GET /api/departments` - Listar
  - `POST /api/departments` - Crear (Super Admin)
  - `GET /api/departments/:id` - Obtener
  - `PUT /api/departments/:id` - Actualizar
  - `DELETE /api/departments/:id` - Soft delete
  - `GET /api/departments/:id/users` - Usuarios del dept
  - `POST /api/departments/:id/users` - Agregar usuario
  - `DELETE /api/departments/:id/users/:userId` - Remover
- [x] Validar prefijo único del departamento (ej: IT, RRHH, FIN)
- [x] Lógica de is_default_for_requesters
- [x] Tabla department_users
- [x] Tabla department_access
- [x] Tabla system_settings
- [x] Endpoints de configuración:
  - `GET /api/settings` - Obtener configuraciones
  - `PUT /api/settings/:key` - Actualizar configuración (Super Admin)
- [x] Seed de configuraciones iniciales

#### Frontend
- [x] Página de gestión de departamentos
- [x] CRUD visual de departamentos
- [x] Asignación de admins y subordinados
- [x] Configurar accesos de solicitantes
- [x] Checkbox "visible por defecto"

**Entregable:** Gestión completa de departamentos y permisos

---

## FASE 2: FORMULARIOS DINÁMICOS (6 semanas)

### SEMANA 6: Catálogo de Tipos de Campos y SLA

**Objetivo:** Base del sistema de formularios y configuración de SLA

#### Backend
- [x] Crear tablas en Prisma:
  - field_types
  - validation_rules_catalog
  - sla_configurations
- [x] Script de seed para field_types (~25 tipos):
  - Categoría TEXTO: TEXT, TEXTAREA, EMAIL, PHONE, URL
  - Categoría NÚMEROS: NUMBER, RATING, CURRENCY
  - Categoría SELECCIÓN: SELECT, MULTISELECT, RADIO, CHECKBOX, TOGGLE
  - Categoría FECHA: DATE, TIME, DATETIME, DATERANGE
  - Categoría ARCHIVOS: FILE, FILE_MULTIPLE, IMAGE
  - Categoría ESPECIALES: LOCATION, TAGS, SIGNATURE, COLOR, SCALE
- [x] Script de seed para validation_rules_catalog
- [x] Endpoints:
  - `GET /api/field-types` - Obtener todos los tipos
  - [x] `GET /api/field-types/:id/validations` - Validaciones disponibles
- [x] Endpoints de SLA:
  - `GET /api/departments/:id/sla` - Obtener configuración SLA
  - `POST /api/departments/:id/sla` - Crear/actualizar SLA
  - `DELETE /api/departments/:id/sla/:priority` - Eliminar config
- [x] Servicio para calcular SLA deadline
- [x] Seed de SLA por defecto (LOW: 72h, MEDIUM: 24h, HIGH: 8h, URGENT: 2h)

#### Frontend
- [x] Types de TypeScript para tipos de campos
- [x] Componentes base para cada tipo de campo:
  - TextField.tsx
  - TextAreaField.tsx
  - SelectField.tsx
  - RadioField.tsx
  - CheckboxField.tsx
  - DateField.tsx
  - FileField.tsx
  - NumberField.tsx
- [x] Sistema de validación con Zod

**Entregable:** Catálogo de tipos de campos creado, componentes base

---

### SEMANA 7: Form Builder - Parte 1 (UI Base)

**Objetivo:** Interfaz drag & drop del constructor

#### Backend
- [x] Crear tablas en Prisma:
  - ticket_forms
  - form_fields
  - field_options
- [x] Endpoints básicos:
  - `GET /api/departments/:id/forms` - Formularios del dept
  - `POST /api/forms` - Crear formulario vacío
  - `GET /api/forms/:id` - Obtener formulario completo

#### Frontend
- [x] Página FormBuilderPage
- [x] Componente FormBuilder principal
- [x] Componente FieldPalette (paleta de tipos):
  - Organizada por categorías
  - Cards con icono y nombre de cada tipo
- [x] Componente BuilderCanvas (área de construcción):
  - Zona de drop para campos
  - Lista de campos agregados
- [x] Implementar drag & drop con @dnd-kit:
  - Arrastrar desde paleta a canvas
  - Reordenar campos en canvas
  - Eliminar campos
- [x] Estado local del builder con Zustand (IGNORADO - no necesario)
- [x] Botones: Vista Previa, Guardar Borrador

**Entregable:** Interfaz drag & drop funcional, sin guardar aún

---

### SEMANA 8: Form Builder - Parte 2 (Configuración de Campos)

**Objetivo:** Configurar cada campo en detalle

#### Frontend
- [x] Componente FieldEditor (panel lateral):
  - Input para label
  - Input para placeholder
  - Input para help_text
  - Checkbox "es obligatorio"
  - Checkbox "campo visible"
  - Tipo de campo mostrado en título
- [x] Editor de opciones (para SELECT, RADIO, CHECKBOX, MULTISELECT, TOGGLE):
  - Agregar opción
  - Editar opción
  - Eliminar opción
  - Reordenar opciones (visual)
  - Marcar opción por defecto
- [x] Configurador de validaciones:
  - Mostrar validaciones disponibles según tipo
  - Inputs para configurar cada validación (TEXT, NUMBER, FILE)
  - ~~Preview del error que se mostraría~~ (no implementado)
- [x] Sistema de lógica condicional básica:
  - Checkbox "activar condicional"
  - Select de campo a evaluar
  - Select de operador (equals, not_equals)
  - Input de valor
- [x] Vista previa en tiempo real
  - Renderiza el campo según su tipo
  - Actualiza en tiempo real al cambiar propiedades
  - Muestra label, placeholder, help text, required
  - Soporta todos los 23 tipos de campos

**Entregable:** Configuración completa de campos

---

### SEMANA 9: Form Builder - Parte 3 (Guardar y Gestionar)

**Objetivo:** Persistir formularios en BD

#### Backend
- [x] Endpoints para guardar:
  - `POST /api/forms/fields` - Agregar campo (body: formId, fieldTypeId, label, etc.)
  - `PUT /api/forms/fields/:id` - Actualizar campo
  - `DELETE /api/forms/fields/:id` - Eliminar campo
  - `POST /api/forms/fields/options` - Agregar opción (body: fieldId, label, value, etc.)
  - `PUT /api/forms/fields/options/:id` - Actualizar opción
  - `DELETE /api/forms/fields/options/:id` - Eliminar opción
  - `PUT /api/forms/:id/activate` - Activar formulario (body: incrementVersion)
  - `PUT /api/forms/:formId/fields/reorder` - Reordenar campos
  - `POST /api/forms/:id/duplicate` - Duplicar formulario
- [x] Lógica de versionado:
  - Al activar, verificar que no haya otro activo (archiva el anterior automáticamente)
  - Incrementar versión si es edición (parámetro incrementVersion)
  - Campo version agregado al modelo TicketForm
- [x] Validación de formulario en backend (Zod en todos los endpoints)

#### Frontend
- [x] Botón "Guardar y Activar"
  - Botón verde con icono FiCheck
  - Deshabilitado si no hay campos
  - Muestra "Activando..." durante el proceso
- [x] Función para serializar estado del builder (los campos se guardan automáticamente al editar)
- [x] Llamadas API para guardar todo
  - formsService.activateForm() implementado
  - formsService.updateField() para guardar campos
  - formsService.addField() para agregar campos
- [x] Confirmaciones y mensajes de éxito/error
  - ConfirmDialog para confirmar activación
  - Toast messages para éxito/error
  - Mensaje de advertencia sobre archivado automático
- [x] Lista de formularios del departamento (en FormsManagementPage)
  - DataTable con columnas: Formulario, Campos, Versión, Estado, Acciones
  - Búsqueda por nombre y descripción
  - Badges para estado y predeterminado
  - Botones: Editar, Duplicar, Historial, Eliminar
- [x] Clonar formulario existente
  - Botón de duplicar (FiCopy) en cada formulario
  - Prompt para ingresar nombre del duplicado
  - Usa formsService.duplicateForm()
- [x] Ver historial de versiones
  - Botón de historial (FiClock) en cada formulario
  - Modal mostrando versión actual
  - Información: versión, estado, campos, fecha
  - Nota: historial completo pendiente para futuro

**Entregable:** Formularios se guardan y activan correctamente

---

### SEMANA 10: Renderizado Dinámico de Formularios

**Objetivo:** Mostrar formularios a usuarios finales

#### Backend
- [x] Endpoint:
  - `GET /api/forms/departments/:id/active-form` - Form activo del dept
  - Retorna formulario con status ACTIVE
  - Incluye department info (id, name, description)
  - Incluye fields ordenados por order (solo visibles)
  - Incluye fieldType de cada campo
  - Incluye options ordenadas por order
  - Error 404 si no hay formulario activo
- [x] Incluir fields y options en response
  - Service: `getActiveDepartmentForm(departmentId)`
  - Controller: `getActiveDepartmentForm(req, res)`
  - Ruta pública con autenticación

#### Frontend
- [x] Componente DynamicFormRenderer:
  - Lee estructura del formulario
  - Renderiza campos en orden
  - Aplica validaciones en tiempo real con Zod
  - Implementa lógica condicional (show/hide)
  - Maneja archivos
  - Ubicación: `frontend/src/components/DynamicForm/DynamicFormRenderer.tsx`
- [x] Hook useFormValidation
  - Validación en tiempo real con Zod
  - Gestión de errores por campo
  - Cálculo de progreso del formulario
  - Ubicación: `frontend/src/hooks/useFormValidation.ts`
- [x] Componente para mostrar errores de validación
  - ValidationError component con iconos
  - Ubicación: `frontend/src/components/common/ValidationError.tsx`
- [x] Indicadores de campo obligatorio
  - Implementado en cada campo con prop `required`
- [x] Progress bar de completitud del formulario
  - FormProgress component con porcentaje visual
  - Ubicación: `frontend/src/components/common/FormProgress.tsx`
- [x] Botón de submit con validación
  - Validación completa antes de enviar
  - Loading state durante envío
  - Toast notifications con sonner
- [x] Página de prueba: `DynamicFormTestPage.tsx`
- [x] Service actualizado: `getActiveDepartmentForm()` en `forms.service.ts`

**Entregable:** ✅ Formularios se renderizan dinámicamente y validan con Zod

---

### SEMANA 11: Sistema de Archivos

**Objetivo:** Upload de archivos funcional

#### Backend
- [x] Configurar almacenamiento local en servidor:
  - [x] Crear directorio `/uploads` con subdirectorios por tipo (images, documents, temp)
  - [x] Configurar permisos adecuados (755)
  - [x] Estructura: `/uploads/{type}/{year}/{month}/{uuid}.ext`
- [x] Instalar Multer + Sharp
  - [x] multer, sharp, uuid, @types/multer, @types/uuid
- [x] Endpoints implementados:
  - [x] `POST /api/upload/single` - Subir un archivo
  - [x] `POST /api/upload/multiple` - Subir múltiples archivos (máx 10)
  - [x] `DELETE /api/upload` - Eliminar archivo
  - [x] Validar tipo y tamaño con Zod
  - [x] Redimensionar imágenes con Sharp (1920x1080, calidad 85%)
  - [x] Crear thumbnails (200x200)
  - [x] Guardar en disco local con UUID
  - [x] Retornar URL completa del archivo
- [x] Servir archivos estáticos:
  - [x] `GET /uploads/*` - Servir archivos estáticos con express.static
- [x] Middleware de límites de archivo
  - [x] Validación de tamaño según tipo (5MB imágenes, 10MB documentos)
  - [x] Validación de tipos MIME permitidos
- [x] Job programado para limpieza de archivos huérfanos
  - [x] Limpieza de archivos temporales (cada hora)
  - [x] Limpieza de archivos huérfanos (diario a las 2 AM)
  - [x] Limpieza de directorios vacíos (semanal)
  - [x] Reporte de estadísticas (diario a las 6 AM)
  - [x] Endpoints de administración manual
- [ ] Sistema de respaldo de archivos (backup)

#### Frontend
- [x] Componente FileUpload con drag & drop
  - [x] Drag & drop funcional con feedback visual
  - [x] Soporte para múltiples archivos
- [x] Preview de imágenes
  - [x] Preview automático al seleccionar
  - [x] Thumbnails de archivos subidos
- [x] Lista de archivos subidos
  - [x] Visualización con iconos y tamaños
  - [x] Estado de carga con indicadores
- [x] Progress bar de upload
  - [x] Barra de progreso animada
  - [x] Porcentaje en tiempo real
- [x] Validación de tipo y tamaño en frontend
  - [x] Validación con Zod
  - [x] Mensajes de error descriptivos
- [x] Manejo de errores de upload
  - [x] Errores por archivo individual
  - [x] Feedback visual de éxito/error
- [x] Caché de previews de imágenes
  - [x] Previews en memoria durante upload

**Entregable:** Upload de archivos funcional y seguro con almacenamiento local

---

## FASE 3: SISTEMA DE TICKETS (4 semanas)

### SEMANA 12: Creación de Tickets

**Objetivo:** Flujo completo de crear ticket

#### Backend
- [x] Tabla tickets completa
- [x] Lógica de generación de ticket_number (IT-2024-001)
- [x] Endpoints:
  - `POST /api/tickets` - Crear ticket
  - Validar form_data contra formulario
  - Calcular SLA deadline según prioridad
- [x] ~~Tabla ticket_history para auditoría~~ (Usando audit_logs existente)
- [x] Registrar creación en audit_logs

#### Frontend
- [x] Página "Crear Ticket"
- [x] Select de departamento (según accesos del usuario)
- [x] Cargar formulario dinámico del departamento
- [x] Renderizar formulario con DynamicFormRenderer
- [x] Select de prioridad
- [x] Submit del ticket
- [x] Mensaje de confirmación con número de ticket
- [x] Redirect a vista del ticket

**Entregable:** Solicitantes pueden crear tickets con formularios dinámicos

---

### SEMANA 13: Vista y Gestión de Tickets

**Objetivo:** Ver, filtrar y gestionar tickets

#### Backend
- [x] Endpoints:
  - `GET /api/tickets` - Listar (con filtros y paginación)
  - `GET /api/tickets/:id` - Ver detalle completo
  - `PUT /api/tickets/:id` - Actualizar
  - `PUT /api/tickets/:id/assign` - Asignar a subordinado
  - `PUT /api/tickets/:id/status` - Cambiar estado
  - `PUT /api/tickets/:id/priority` - Cambiar prioridad
- [x] Lógica de permisos según rol
- [x] Registrar cambios en audit_logs

#### Frontend
- [x] Página "Mis Tickets" (Solicitante)
- [x] Página "Tickets del Departamento" (Admin/Subordinado)
- [x] Tabla de tickets con columnas:
  - Número, Título, Estado, Prioridad, Asignado, Fecha
- [x] Filtros:
  - Por estado
  - Por prioridad
  - Por asignado
  - Por fecha
- [x] Búsqueda por texto
- [x] Paginación
- [x] Click en ticket abre detalle

**Entregable:** Usuarios ven sus tickets según rol

---

### SEMANA 14: Vista Detallada de Ticket

**Objetivo:** Página completa de un ticket

#### Frontend
- [x] Página TicketDetails
- [x] Header con:
  - Número de ticket
  - Estado (badge colorido)
  - Prioridad
  - Botones de acción según rol
- [x] Sección de información:
  - Solicitante
  - Departamento
  - Asignado a
  - Fechas (creación, cierre)
  - SLA countdown
- [x] Sección de formulario:
  - Renderizar respuestas del form_data
  - Mostrar etiquetas y valores
  - Preview de archivos adjuntos
- [x] Sección de historial:
  - Timeline de cambios
  - Quién, qué, cuándo
- [x] Acciones según rol:
  - Admin: Asignar, Cambiar estado, Cambiar prioridad
  - Subordinado: Cambiar estado, Marcar resuelto
  - Solicitante: Cancelar (si está en NEW)

**Entregable:** Vista detallada completa de tickets

---

### SEMANA 15: Tablero Kanban

**Objetivo:** Vista de tablero para admins

#### Backend
- [x] Endpoint:
  - `GET /api/departments/:id/kanban` - Tickets agrupados por estado
  - `PUT /api/tickets/:id/quick-assign` - Asignación rápida desde Kanban

#### Frontend
- [x] Página KanbanBoard
- [x] Componente Board con columnas:
  - NUEVO, ASIGNADO, EN PROCESO, ESPERANDO, RESUELTO
- [x] Drag & drop de tickets entre columnas con @dnd-kit:
  - Cambiar estado al mover
  - Asignar al arrastrar a subordinado
- [x] Componente TicketCard:
  - Número, título
  - Prioridad (indicador colorido)
  - Avatar del asignado
  - Tiempo en ese estado
- [x] Filtros rápidos:
  - Por prioridad
  - Por asignado
  - Solo míos
- [x] Contador de tickets por columna
- [x] Animaciones suaves

**Entregable:** Tablero Kanban funcional con drag & drop

---

## FASE 4: CHAT Y TIEMPO REAL (3 semanas)

### SEMANA 16: Setup de Socket.io

**Objetivo:** Infraestructura de tiempo real

#### Backend
- [x] Instalar Socket.io
- [x] Configurar Socket.io server
- [x] Implementar rooms por ticket
- [x] Events:
  - `join-ticket` - Usuario se une a room
  - `leave-ticket` - Usuario sale de room
  - `send-message` - Enviar mensaje
  - `typing` - Usuario escribiendo
- [x] Autenticación de sockets (JWT)
- [x] Middleware de permisos para sockets
- [x] Validaciones Zod para todos los eventos
- [x] Auditoría completa (audit_logs) para eventos críticos

#### Frontend
- [x] Instalar socket.io-client
- [x] Servicio socket.ts para manejar conexión
- [x] Hook useSocket
- [x] Conectar al servidor
- [x] Join automático al abrir ticket
- [x] Validaciones Zod para eventos del cliente
- [x] Componentes de Chat (ChatWindow, ChatMessageList, ChatInput, ChatTypingIndicator)
- [x] Integración en TicketDetailPage (panel lateral para solicitantes)
- [x] Integración en TicketDetailModal (tabs para subordinados/agentes)

**Entregable:** Infraestructura de WebSockets lista ✅

---

### SEMANA 17: Chat de Tickets

**Objetivo:** Chat en tiempo real funcional

#### Backend
- [x] Tabla ticket_messages
- [x] Endpoints REST (fallback si socket falla):
  - `GET /api/tickets/:id/messages` - Historial
  - `POST /api/tickets/:id/messages` - Enviar mensaje
- [x] Guardar mensajes en BD cuando se envían
- [x] Broadcast a todos en el room
- [x] Validaciones Zod en todos los endpoints
- [x] Logs de errores (auditoría solo para intentos denegados)

#### Frontend
- [x] Componente ChatWindow en vista de ticket
- [x] Lista de mensajes:
  - [x] Scroll automático al nuevo mensaje
  - [x] Diferentes estilos según quien envía
  - [x] Mostrar fecha/hora
  - [x] Avatar del usuario
- [x] Input de mensaje:
  - [x] Textarea con auto-grow
  - [x] Botón enviar
  - [x] Indicador "escribiendo..."
  - [x] Upload de archivos en chat (PNG, JPG, JPEG, SVG, PDF - máx 10MB)
- [x] Cargar historial de mensajes al abrir chat
- [x] Validaciones Zod en cliente
- [x] Alertas con toast para errores
- [x] Badge de mensajes no leídos (backend + frontend + UI)
- [x] Reconexión automática del socket (con banner de estado)
- [x] Indicador de estado de mensaje (SENDING, SENT, ERROR con reintentar)
- [x] Notificación visual de nuevo mensaje (toast + navegador + permisos)
- [x] Paginación infinita en historial

**Entregable:** Chat en tiempo real completamente funcional

---

### SEMANA 18: Sistema de Notificaciones y Email Templates

**Objetivo:** Notificaciones in-app, emails y webhooks

#### Backend
- [x] Tabla notifications
- [x] Tabla email_templates
- [ ] Tabla webhooks
- [x] Servicio de notificaciones:
  - Función para crear notificación
  - Lógica de a quién notificar según evento
- [x] Endpoints:
  - `GET /api/notifications` - Listar notificaciones
  - `PUT /api/notifications/:id/read` - Marcar leída
  - `PUT /api/notifications/read-all` - Marcar todas
- [x] Endpoints de email templates:
  - `GET /api/email-templates` - Listar templates
  - `GET /api/email-templates/:id` - Obtener template por ID
  - `PUT /api/email-templates/:id` - Actualizar template (Super Admin)
  - `POST /api/email-templates/:id/preview` - Preview de template
- [ ] Endpoints de webhooks:
  - `GET /api/departments/:id/webhooks` - Listar webhooks
  - `POST /api/departments/:id/webhooks` - Crear webhook
  - `PUT /api/webhooks/:id` - Actualizar webhook
  - `DELETE /api/webhooks/:id` - Eliminar webhook
  - `POST /api/webhooks/:id/test` - Probar webhook
- [ ] Setup de Bull + Redis para colas
- [x] Setup de Nodemailer
- [x] Seed de templates de emails:
  - TICKET_CREATED, TICKET_ASSIGNED, TICKET_RESOLVED
  - TICKET_CLOSED, SLA_WARNING, SLA_EXCEEDED
- [x] Sistema de variables en templates ({{ticket_number}}, {{user_name}})
- [x] Jobs para enviar emails:
  - Ticket creado
  - Ticket asignado
  - Ticket resuelto
  - SLA cerca de vencer
- [ ] Servicio para disparar webhooks
- [x] Emitir notificaciones via Socket.io

#### Frontend
- [x] Componente NotificationCenter (dropdown en navbar)
- [x] Badge con contador de no leídas
- [x] Lista de notificaciones con:
  - Icono según tipo
  - Título y mensaje
  - Tiempo relativo (hace 5 min)
  - Click lleva al ticket
- [x] Marcar como leída al hacer click
- [x] Botón "Marcar todas como leídas"
- [x] Toast notifications con sonner
- [x] Notificaciones en tiempo real via Socket.io

**Entregable:** Sistema completo de notificaciones

---

## FASE 5: PWA (3 semanas)

### SEMANA 19: Configuración PWA

**Objetivo:** App instalable

#### Frontend
- [ ] Crear manifest.json:
  - Nombre, descripción
  - Iconos de todos los tamaños
  - Theme colors
  - Display: standalone
  - Start URL
  - Shortcuts (crear ticket, mis tickets)
- [ ] Generar iconos PWA (72x72 hasta 512x512)
- [ ] Crear splash screens
- [ ] Configurar Workbox con Vite
- [ ] Service Worker básico:
  - Precache de assets estáticos
  - Runtime caching de API
- [ ] Registrar Service Worker
- [ ] Prompt de instalación (botón "Instalar App")
- [ ] Detectar si ya está instalado

**Entregable:** PWA instalable en dispositivos

---

### SEMANA 20: Push Notifications

**Objetivo:** Notificaciones push funcionando

#### Backend
- [x] Configurar Firebase Cloud Messaging
- [x] Tabla fcm_tokens
- [x] Endpoints:
  - `POST /api/notifications/register-token` - Guardar token FCM
  - `DELETE /api/notifications/unregister-token` - Eliminar token
- [x] Servicio para enviar push:
  - Usar Firebase Admin SDK
  - Enviar a tokens del usuario
- [x] Eventos que envían push:
  - Ticket asignado
  - Nuevo mensaje (si offline)
  - SLA warning

#### Frontend
- [x] Solicitar permisos de notificaciones
- [x] Obtener token FCM
- [x] Registrar token en backend
- [x] Escuchar mensajes push:
  - En foreground: mostrar toast
  - En background: manejado por service worker
- [x] Actions en push notifications:
  - "Ver ticket" - abre el ticket
  - "Marcar leída"

**Entregable:** Push notifications funcionando en móvil y desktop

---

### SEMANA 21: Offline Support

**Objetivo:** App funciona sin internet

#### Frontend
- [ ] Configurar estrategias de cache en Workbox:
  - NetworkFirst para API
  - CacheFirst para imágenes
  - StaleWhileRevalidate para assets
- [ ] Página offline fallback
- [ ] Indicador de estado de conexión (online/offline)
- [ ] Queue de acciones offline:
  - Guardar mensajes pendientes
  - Enviar cuando vuelva online
- [ ] Sincronización automática al reconectar
- [ ] Avisar al usuario si está offline

**Entregable:** App funciona offline básicamente

---

## FASE 6: FEATURES AVANZADAS (3 semanas)

### SEMANA 22: Métricas y Dashboards

**Objetivo:** Dashboards con métricas en tiempo real

#### Backend
- [x] Endpoints de métricas:
  - `GET /api/metrics/dashboard` - Según rol
  - `GET /api/metrics/tickets-by-status`
  - `GET /api/metrics/tickets-by-department`
  - `GET /api/metrics/avg-resolution-time`
  - `GET /api/metrics/satisfaction`
  - `GET /api/metrics/sla-compliance`
  - `GET /api/metrics/tickets-trend`
  - `GET /api/metrics/departments` - Departamentos accesibles (filtro)
- [x] Queries optimizadas con agregaciones
- [x] Validadores Zod para filtros (departmentId, dateFrom, dateTo, period)
- [x] Filtros por rol (SUPER_ADMIN ve todo, DEPT_ADMIN/SUBORDINATE sus deptos, REQUESTER sus tickets)
- [ ] Cache de métricas con Redis (5 min)

#### Frontend
- [x] Página Dashboard rehecha con datos reales para cada rol
- [x] Componentes de métricas:
  - StatCards con números reales (Total, Pendientes, Resueltos, SLA Excedido, etc.)
  - Gráfica de dona (tickets por estado)
  - Gráfica de dona (tickets por prioridad)
  - Gráfica de barras (tickets por departamento)
  - Gráfica de área (tendencia creados vs resueltos)
  - Cards de Tiempo Prom. Resolución, Satisfacción, Cumplimiento SLA
  - Tickets recientes con navegación
  - Acciones rápidas por rol
- [x] Usar Recharts para visualizaciones
- [x] Filtros de departamento y período (semana, mes, trimestre, año)
- [ ] Auto-refresh cada 5 minutos
- [ ] Exportar a PDF/Excel

**Entregable:** Dashboards con métricas completas

---

### SEMANA 23: Calificaciones y Cierre

**Objetivo:** Flujo completo de cierre de ticket

#### Backend
- [x] Tabla ticket_ratings
- [x] Campo `requireRating` en departamentos para hacer calificación opcional/obligatoria
- [x] Endpoints:
  - [x] `PUT /api/tickets/:id/resolve` - Marcar resuelto
  - [x] `POST /api/tickets/:id/rate` - Calificar ticket
  - [x] `PUT /api/tickets/:id/close` - Cerrar ticket (con validación Zod)
  - [x] `POST /api/tickets/:id/reopen` - Reabrir (con validación Zod)
- [x] Validadores Zod para todos los endpoints de calificación
- [x] Incluir calificación en respuesta de getTicketById
- [x] Job programado para auto-cerrar tickets:
  - [x] Campo `autoCloseAfterDays` configurable por departamento (default: 8 días)
  - [x] Calcula días hábiles usando el horario laboral del departamento
  - [x] Si están en RESOLVED por X días hábiles, cambiar a CLOSED automáticamente
  - [x] Registra en audit log cada auto-cierre
  - [x] Worker ejecutándose cada 1 hora
  - [ ] Enviar email final (pendiente implementar EmailService)

#### Frontend
- [x] Modal de calificación (CloseTicketModal):
  - [x] Componente de estrellas (1-5) usando StarRating de common
  - [x] Textarea para comentario opcional
  - [x] Botón confirmar dinámico según requireRating
  - [x] Validación con Zod
  - [x] Toast notifications con sonner
  - [x] Dos flujos: con calificación obligatoria y sin calificación
- [x] Modal de confirmación de cierre (integrado en CloseTicketModal)
- [x] Modal para reabrir con justificación (ReopenTicketModal):
  - [x] Validación Zod
  - [x] Componentes de common (Modal, ModalButtons, ValidationError)
- [x] Visualización de calificación en tickets cerrados (TicketDetailPage)
- [x] Botón dinámico según requireRating ("Cerrar y Calificar" vs "Cerrar Ticket")
- [ ] Badge de calificación en tarjetas de tickets (KanbanBoard/TicketList)
- [ ] Encuesta de satisfacción (opcional)

**Entregable:** Ciclo completo de ticket hasta cierre

---

### SEMANA 24: Optimizaciones, Tests y Documentación de API

**Objetivo:** Código optimizado, testeado y documentado

#### Backend
- [ ] Documentación de API con Swagger/OpenAPI:
  - [ ] Instalar swagger-jsdoc y swagger-ui-express
  - [ ] Configurar Swagger en Express
  - [ ] Documentar todos los endpoints con JSDoc
  - [ ] Definir schemas de request/response
  - [ ] Ejemplos de uso para cada endpoint
  - [ ] Documentar códigos de error
  - [ ] Endpoint `/api-docs` para ver documentación
  - [ ] Exportar OpenAPI spec en JSON/YAML
- [ ] Implementar cache con Redis:
  - Formularios activos
  - Tipos de campos
  - Métricas
  - Configuraciones del sistema
- [ ] Optimizar queries lentas
- [ ] Agregar índices faltantes
- [ ] Implementar rate limiting por endpoint
- [ ] Tests unitarios de servicios críticos:
  - Permisos
  - Validación de formularios
  - Cálculo de SLA
  - Generación de números de ticket
  - Soft delete
- [ ] Tests de integración:
  - Crear ticket
  - Asignar ticket
  - Chat
  - Webhooks

#### Frontend
- [ ] Lazy loading de componentes pesados
- [ ] Code splitting por ruta
- [ ] Optimizar re-renders con React.memo
- [ ] Comprimir imágenes antes de upload
- [ ] Tests E2E con Playwright:
  - Login
  - Crear ticket
  - Asignar ticket
  - Chat básico
- [ ] Lighthouse audit (performance, PWA)

**Entregable:** Sistema optimizado y con tests

---

## FASE 7: DEPLOY Y LANZAMIENTO (1 semana)

### SEMANA 25: Deploy a Producción

**Objetivo:** Sistema en producción

#### DevOps
- [ ] Contratar servidor (VPS o Cloud)
- [ ] Configurar Ubuntu Server
- [ ] Instalar PostgreSQL en servidor
- [ ] Instalar Redis en servidor
- [ ] Instalar Nginx como reverse proxy
- [ ] Configurar SSL con Let's Encrypt
- [ ] Instalar PM2 para process management
- [ ] Configurar almacenamiento de archivos:
  - Crear directorio `/var/www/tiket/uploads`
  - Configurar permisos (755 para dirs, 644 para archivos)
  - Configurar Nginx para servir archivos estáticos
  - Configurar límites de tamaño en Nginx (client_max_body_size 10M)
- [ ] Configurar variables de entorno de producción
- [ ] Deploy de backend:
  - Build de TypeScript
  - Correr migraciones
  - Ejecutar seeds
  - Iniciar con PM2
- [ ] Deploy de frontend:
  - Build de producción
  - Copiar a servidor
  - Configurar Nginx para servir archivos
- [ ] Configurar CI/CD con GitHub Actions:
  - Auto-deploy en push a main
  - Correr tests antes de deploy
- [ ] Setup de backups automáticos:
  - Script de backup de BD (PostgreSQL dump diario)
  - Script de backup de `/uploads` (semanal)
  - Cron jobs configurados
  - Guardar backups en ubicación separada
  - Retención: 30 días BD, 90 días archivos
- [ ] Setup de monitoreo avanzado:
  - [ ] PM2 monitoring básico
  - [ ] Configurar Sentry para tracking de errores
  - [ ] Setup de UptimeRobot o similar (monitoreo de uptime)
  - [ ] Configurar Grafana + Prometheus (opcional):
    - Métricas de servidor (CPU, RAM, disco)
    - Métricas de aplicación (requests, response time)
    - Métricas de BD (queries lentas, conexiones)
  - [ ] Logs centralizados con Winston
  - [ ] Rotación de logs (daily, max 30 días)
  - [ ] Alertas por email/Slack:
    - Servidor caído
    - Espacio en disco < 20%
    - Errores críticos
    - SLA excedidos
  - [ ] Dashboard de métricas en tiempo real
- [ ] Configurar dominio y DNS
- [ ] Smoke tests en producción
- [ ] Health check endpoint: `GET /api/health`
- [ ] Documentación de deployment

#### Documentación
- [ ] Guía de usuario (solicitante)
- [ ] Guía de admin de departamento
- [ ] Guía del Form Builder
- [ ] Video tutorial básico
- [ ] FAQ

**Entregable:** Sistema en producción, estable y documentado

---

## 📋 RESUMEN DE ENTREGABLES POR FASE

### FASE 1 (5 semanas): FUNDACIÓN
- Proyecto configurado
- Login con Google funcional
- Sistema de roles y permisos
- Gestión de usuarios
- Gestión de departamentos

### FASE 2 (6 semanas): FORMULARIOS DINÁMICOS
- Catálogo de 25 tipos de campos
- Form Builder drag & drop completo
- Configuración avanzada de campos
- Renderizado dinámico de formularios
- Sistema de archivos

### FASE 3 (4 semanas): SISTEMA DE TICKETS
- Crear tickets con formularios
- Vista y gestión de tickets
- Vista detallada completa
- Tablero Kanban

### FASE 4 (3 semanas): CHAT Y TIEMPO REAL
- Socket.io configurado
- Chat en tiempo real
- Notificaciones in-app y email

### FASE 5 (3 semanas): PWA
- PWA instalable
- Push notifications
- Offline support

### FASE 6 (3 semanas): FEATURES AVANZADAS
- Dashboards con métricas
- Sistema de calificaciones
- Optimizaciones y tests

### FASE 7 (1 semana): DEPLOY
- Sistema en producción
- Documentación completa

---

## HITOS IMPORTANTES

**Semana 5:** Gestión de usuarios y departamentos funcional  
**Semana 11:** Formularios dinámicos completamente funcionales  
**Semana 15:** Sistema de tickets operativo  
**Semana 18:** Chat y notificaciones en tiempo real  
**Semana 21:** PWA instalable con push notifications  
**Semana 25:** Sistema en producción

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgo 1: Form Builder muy complejo
**Mitigación:** Empezar simple, agregar features incrementalmente

### Riesgo 2: Problemas con WebSockets en producción
**Mitigación:** Implementar fallback a polling, tener endpoints REST

### Riesgo 3: Performance con muchos tickets
**Mitigación:** Implementar paginación, índices en BD, cache con Redis

### Riesgo 4: Bugs en lógica condicional de formularios
**Mitigación:** Tests exhaustivos, empezar con condicionales simples

---

## 💡 RECOMENDACIONES

1. **Desarrollar en sprints semanales** - Review al final de cada semana
2. **Commits frecuentes** - Al menos 3-5 commits por día
3. **Testing continuo** - No dejar tests para el final
4. **Deploy temprano** - Tener ambiente de staging desde semana 10
5. **Document