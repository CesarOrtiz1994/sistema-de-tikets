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
- [ ] Endpoints para guardar:
  - `POST /api/forms/:id/fields` - Agregar campo
  - `PUT /api/forms/:id/fields/:fieldId` - Actualizar campo
  - `DELETE /api/forms/:id/fields/:fieldId` - Eliminar campo
  - `POST /api/forms/:id/fields/:fieldId/options` - Agregar opción
  - `PUT /api/forms/:id/activate` - Activar formulario
- [ ] Lógica de versionado:
  - Al activar, verificar que no haya otro activo
  - Incrementar versión si es edición
- [ ] Validación de formulario en backend

#### Frontend
- [ ] Botón "Guardar y Activar"
- [ ] Función para serializar estado del builder
- [ ] Llamadas API para guardar todo
- [ ] Confirmaciones y mensajes de éxito/error
- [ ] Lista de formularios del departamento
- [ ] Clonar formulario existente
- [ ] Ver historial de versiones

**Entregable:** Formularios se guardan y activan correctamente

---

### SEMANA 10: Renderizado Dinámico de Formularios

**Objetivo:** Mostrar formularios a usuarios finales

#### Backend
- [ ] Endpoint:
  - `GET /api/departments/:id/active-form` - Form activo del dept
- [ ] Incluir fields y options en response

#### Frontend
- [ ] Componente DynamicFormRenderer:
  - Lee estructura del formulario
  - Renderiza campos en orden
  - Aplica validaciones en tiempo real
  - Implementa lógica condicional (show/hide)
  - Maneja archivos
- [ ] Hook useFormValidation
- [ ] Componente para mostrar errores de validación
- [ ] Indicadores de campo obligatorio
- [ ] Progress bar de completitud del formulario
- [ ] Botón de submit con validación

**Entregable:** Formularios se renderizan dinámicamente y validan

---

### SEMANA 11: Sistema de Archivos

**Objetivo:** Upload de archivos funcional

#### Backend
- [ ] Configurar almacenamiento local en servidor:
  - Crear directorio `/uploads` con subdirectorios por tipo
  - Configurar permisos adecuados (755)
  - Estructura: `/uploads/{year}/{month}/{uuid}-{filename}`
- [ ] Instalar Multer + Sharp
- [ ] Endpoint:
  - `POST /api/upload` - Subir archivo
  - Validar tipo y tamaño
  - Redimensionar imágenes si aplica
  - Guardar en disco local
  - Retornar URL relativa del archivo
- [ ] Endpoint para servir archivos:
  - `GET /api/files/:year/:month/:filename` - Servir archivo
  - Verificar permisos de acceso
  - Stream de archivos grandes
- [ ] Middleware de límites de archivo
- [ ] Job programado para limpieza de archivos huérfanos
- [ ] Sistema de respaldo de archivos (backup)

#### Frontend
- [ ] Componente FileUpload con drag & drop
- [ ] Preview de imágenes
- [ ] Lista de archivos subidos
- [ ] Progress bar de upload
- [ ] Validación de tipo y tamaño en frontend
- [ ] Manejo de errores de upload
- [ ] Caché de previews de imágenes

**Entregable:** Upload de archivos funcional y seguro con almacenamiento local

---

## FASE 3: SISTEMA DE TICKETS (4 semanas)

### SEMANA 12: Creación de Tickets

**Objetivo:** Flujo completo de crear ticket

#### Backend
- [ ] Tabla tickets completa
- [ ] Lógica de generación de ticket_number (IT-2024-001)
- [ ] Endpoints:
  - `POST /api/tickets` - Crear ticket
  - Validar form_data contra formulario
  - Calcular SLA deadline según prioridad
- [ ] Tabla ticket_history para auditoría
- [ ] Registrar creación en history

#### Frontend
- [ ] Página "Crear Ticket"
- [ ] Select de departamento (según accesos del usuario)
- [ ] Cargar formulario dinámico del departamento
- [ ] Renderizar formulario con DynamicFormRenderer
- [ ] Select de prioridad
- [ ] Submit del ticket
- [ ] Mensaje de confirmación con número de ticket
- [ ] Redirect a vista del ticket

**Entregable:** Solicitantes pueden crear tickets con formularios dinámicos

---

### SEMANA 13: Vista y Gestión de Tickets

**Objetivo:** Ver, filtrar y gestionar tickets

#### Backend
- [ ] Endpoints:
  - `GET /api/tickets` - Listar (con filtros y paginación)
  - `GET /api/tickets/:id` - Ver detalle completo
  - `PUT /api/tickets/:id` - Actualizar
  - `PUT /api/tickets/:id/assign` - Asignar a subordinado
  - `PUT /api/tickets/:id/status` - Cambiar estado
  - `PUT /api/tickets/:id/priority` - Cambiar prioridad
- [ ] Lógica de permisos según rol
- [ ] Registrar cambios en history

#### Frontend
- [ ] Página "Mis Tickets" (Solicitante)
- [ ] Página "Tickets del Departamento" (Admin/Subordinado)
- [ ] Tabla de tickets con columnas:
  - Número, Título, Estado, Prioridad, Asignado, Fecha
- [ ] Filtros:
  - Por estado
  - Por prioridad
  - Por asignado
  - Por fecha
- [ ] Búsqueda por texto
- [ ] Paginación
- [ ] Click en ticket abre detalle

**Entregable:** Usuarios ven sus tickets según rol

---

### SEMANA 14: Vista Detallada de Ticket

**Objetivo:** Página completa de un ticket

#### Frontend
- [ ] Página TicketDetails
- [ ] Header con:
  - Número de ticket
  - Estado (badge colorido)
  - Prioridad
  - Botones de acción según rol
- [ ] Sección de información:
  - Solicitante
  - Departamento
  - Asignado a
  - Fechas (creación, cierre)
  - SLA countdown
- [ ] Sección de formulario:
  - Renderizar respuestas del form_data
  - Mostrar etiquetas y valores
  - Preview de archivos adjuntos
- [ ] Sección de historial:
  - Timeline de cambios
  - Quién, qué, cuándo
- [ ] Acciones según rol:
  - Admin: Asignar, Cambiar estado, Cambiar prioridad
  - Subordinado: Cambiar estado, Marcar resuelto
  - Solicitante: Cancelar (si está en NEW)

**Entregable:** Vista detallada completa de tickets

---

### SEMANA 15: Tablero Kanban

**Objetivo:** Vista de tablero para admins

#### Backend
- [ ] Endpoint:
  - `GET /api/departments/:id/kanban` - Tickets agrupados por estado
  - `PUT /api/tickets/:id/quick-assign` - Asignación rápida desde Kanban

#### Frontend
- [ ] Página KanbanBoard
- [ ] Componente Board con columnas:
  - NUEVO, ASIGNADO, EN PROCESO, ESPERANDO, RESUELTO
- [ ] Drag & drop de tickets entre columnas con @dnd-kit:
  - Cambiar estado al mover
  - Asignar al arrastrar a subordinado
- [ ] Componente TicketCard:
  - Número, título
  - Prioridad (indicador colorido)
  - Avatar del asignado
  - Tiempo en ese estado
- [ ] Filtros rápidos:
  - Por prioridad
  - Por asignado
  - Solo míos
- [ ] Contador de tickets por columna
- [ ] Animaciones suaves

**Entregable:** Tablero Kanban funcional con drag & drop

---

## FASE 4: CHAT Y TIEMPO REAL (3 semanas)

### SEMANA 16: Setup de Socket.io

**Objetivo:** Infraestructura de tiempo real

#### Backend
- [ ] Instalar Socket.io
- [ ] Configurar Socket.io server
- [ ] Implementar rooms por ticket
- [ ] Events:
  - `join-ticket` - Usuario se une a room
  - `leave-ticket` - Usuario sale de room
  - `send-message` - Enviar mensaje
  - `typing` - Usuario escribiendo
- [ ] Autenticación de sockets (JWT)
- [ ] Middleware de permisos para sockets

#### Frontend
- [ ] Instalar socket.io-client
- [ ] Servicio socket.ts para manejar conexión
- [ ] Hook useSocket
- [ ] Conectar al servidor
- [ ] Join automático al abrir ticket

**Entregable:** Infraestructura de WebSockets lista

---

### SEMANA 17: Chat de Tickets

**Objetivo:** Chat en tiempo real funcional

#### Backend
- [ ] Tabla ticket_messages
- [ ] Endpoints REST (fallback si socket falla):
  - `GET /api/tickets/:id/messages` - Historial
  - `POST /api/tickets/:id/messages` - Enviar mensaje
- [ ] Guardar mensajes en BD cuando se envían
- [ ] Broadcast a todos en el room

#### Frontend
- [ ] Componente ChatWindow en vista de ticket
- [ ] Lista de mensajes:
  - Scroll automático al nuevo mensaje
  - Diferentes estilos según quien envía
  - Mostrar fecha/hora
  - Avatar del usuario
- [ ] Input de mensaje:
  - Textarea con auto-grow
  - Botón enviar
  - Indicador "escribiendo..."
  - Upload de archivos en chat
- [ ] Notificación visual de nuevo mensaje
- [ ] Badge de mensajes no leídos
- [ ] Paginación infinita en historial (scroll up)

**Entregable:** Chat en tiempo real completamente funcional

---

### SEMANA 18: Sistema de Notificaciones y Email Templates

**Objetivo:** Notificaciones in-app, emails y webhooks

#### Backend
- [ ] Tabla notifications
- [ ] Tabla email_templates
- [ ] Tabla webhooks
- [ ] Servicio de notificaciones:
  - Función para crear notificación
  - Lógica de a quién notificar según evento
- [ ] Endpoints:
  - `GET /api/notifications` - Listar notificaciones
  - `PUT /api/notifications/:id/read` - Marcar leída
  - `PUT /api/notifications/read-all` - Marcar todas
- [ ] Endpoints de email templates:
  - `GET /api/email-templates` - Listar templates
  - `PUT /api/email-templates/:id` - Actualizar template (Super Admin)
  - `POST /api/email-templates/preview` - Preview de template
- [ ] Endpoints de webhooks:
  - `GET /api/departments/:id/webhooks` - Listar webhooks
  - `POST /api/departments/:id/webhooks` - Crear webhook
  - `PUT /api/webhooks/:id` - Actualizar webhook
  - `DELETE /api/webhooks/:id` - Eliminar webhook
  - `POST /api/webhooks/:id/test` - Probar webhook
- [ ] Setup de Bull + Redis para colas
- [ ] Setup de Nodemailer
- [ ] Seed de templates de emails:
  - TICKET_CREATED, TICKET_ASSIGNED, TICKET_RESOLVED
  - TICKET_CLOSED, SLA_WARNING, SLA_EXCEEDED
- [ ] Sistema de variables en templates ({{ticket_number}}, {{user_name}})
- [ ] Jobs para enviar emails:
  - Ticket creado
  - Ticket asignado
  - Ticket resuelto
  - SLA cerca de vencer
- [ ] Servicio para disparar webhooks
- [ ] Emitir notificaciones via Socket.io

#### Frontend
- [ ] Componente NotificationCenter (dropdown en navbar)
- [ ] Badge con contador de no leídas
- [ ] Lista de notificaciones con:
  - Icono según tipo
  - Título y mensaje
  - Tiempo relativo (hace 5 min)
  - Click lleva al ticket
- [ ] Marcar como leída al hacer click
- [ ] Botón "Marcar todas como leídas"
- [ ] Toast notifications con react-hot-toast
- [ ] Notificaciones en tiempo real via Socket.io

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
- [ ] Configurar Firebase Cloud Messaging
- [ ] Tabla fcm_tokens
- [ ] Endpoints:
  - `POST /api/notifications/register-token` - Guardar token FCM
  - `DELETE /api/notifications/unregister-token` - Eliminar token
- [ ] Servicio para enviar push:
  - Usar Firebase Admin SDK
  - Enviar a tokens del usuario
- [ ] Eventos que envían push:
  - Ticket asignado
  - Nuevo mensaje (si offline)
  - SLA warning

#### Frontend
- [ ] Solicitar permisos de notificaciones
- [ ] Obtener token FCM
- [ ] Registrar token en backend
- [ ] Escuchar mensajes push:
  - En foreground: mostrar toast
  - En background: manejado por service worker
- [ ] Actions en push notifications:
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
- [ ] Endpoints de métricas:
  - `GET /api/metrics/dashboard` - Según rol
  - `GET /api/metrics/tickets-by-status`
  - `GET /api/metrics/tickets-by-department`
  - `GET /api/metrics/avg-resolution-time`
  - `GET /api/metrics/satisfaction`
  - `GET /api/metrics/sla-compliance`
- [ ] Queries optimizadas con agregaciones
- [ ] Cache de métricas con Redis (5 min)

#### Frontend
- [ ] Página Dashboard para cada rol
- [ ] Componentes de métricas:
  - Cards con números grandes
  - Gráfica de dona (tickets por estado)
  - Gráfica de barras (tickets por dept)
  - Gráfica de línea (tendencia)
  - Lista de top performers
- [ ] Usar Recharts para visualizaciones
- [ ] Filtros de período (hoy, semana, mes, año)
- [ ] Auto-refresh cada 5 minutos
- [ ] Exportar a PDF/Excel

**Entregable:** Dashboards con métricas completas

---

### SEMANA 23: Calificaciones y Cierre

**Objetivo:** Flujo completo de cierre de ticket

#### Backend
- [ ] Tabla ticket_ratings
- [ ] Endpoints:
  - `PUT /api/tickets/:id/resolve` - Marcar resuelto
  - `POST /api/tickets/:id/rate` - Calificar ticket
  - `PUT /api/tickets/:id/close` - Cerrar ticket
  - `POST /api/tickets/:id/reopen` - Reabrir
- [ ] Job programado para auto-cerrar tickets:
  - Si están en RESOLVED por X días
  - Cambiar a CLOSED automáticamente
  - Enviar email final

#### Frontend
- [ ] Modal de calificación:
  - Componente de estrellas (1-5)
  - Textarea para comentario opcional
  - Botón confirmar
- [ ] Modal de confirmación de cierre
- [ ] Modal para reabrir con justificación
- [ ] Badge de calificación en tickets cerrados
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