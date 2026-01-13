# ESTRUCTURA COMPLETA DE BASE DE DATOS

## Sistema de Tickets con Formularios Dinámicos

---

## MÓDULO DE USUARIOS

### users
```sql
id                  UUID PRIMARY KEY
email               VARCHAR(255) UNIQUE NOT NULL
google_id           VARCHAR(255) UNIQUE
name                VARCHAR(255) NOT NULL
profile_picture     TEXT
role_type           ENUM('SUPER_ADMIN', 'DEPT_ADMIN', 'SUBORDINATE', 'REQUESTER')
language            VARCHAR(5) DEFAULT 'es'
                    -- Idioma preferido: 'es', 'en'
is_active           BOOLEAN DEFAULT true
deleted_at          TIMESTAMP NULL
                    -- Soft delete
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

---

## MÓDULO DE DEPARTAMENTOS

### departments
```sql
id                          UUID PRIMARY KEY
name                        VARCHAR(255) NOT NULL
prefix                      VARCHAR(10) UNIQUE NOT NULL
                            -- Prefijo para números de ticket: "IT", "RRHH", "FIN"
description                 TEXT
is_default_for_requesters   BOOLEAN DEFAULT false
created_by                  UUID REFERENCES users(id)
deleted_at                  TIMESTAMP NULL
                            -- Soft delete
created_at                  TIMESTAMP DEFAULT NOW()
updated_at                  TIMESTAMP DEFAULT NOW()
```

### department_users
```sql
id              UUID PRIMARY KEY
department_id   UUID REFERENCES departments(id) ON DELETE CASCADE
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
role            ENUM('ADMIN', 'SUBORDINATE')
created_at      TIMESTAMP DEFAULT NOW()

UNIQUE(department_id, user_id)
```

### department_access
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
department_id   UUID REFERENCES departments(id) ON DELETE CASCADE
access_type     ENUM('CAN_CREATE_TICKETS', 'CAN_VIEW_TICKETS', 'CAN_MANAGE')
created_at      TIMESTAMP DEFAULT NOW()

UNIQUE(user_id, department_id, access_type)
```

---

## MÓDULO DE FORMULARIOS DINÁMICOS

### field_types (CATÁLOGO - SE LLENA AL INSTALAR)
```sql
id                          UUID PRIMARY KEY
name                        VARCHAR(50) UNIQUE NOT NULL
                            -- TEXT, TEXTAREA, EMAIL, PHONE, URL, NUMBER, RATING, 
                            -- CURRENCY, SELECT, MULTISELECT, RADIO, CHECKBOX, 
                            -- TOGGLE, DATE, TIME, DATETIME, DATERANGE, FILE, 
                            -- FILE_MULTIPLE, IMAGE, LOCATION, TAGS, SIGNATURE, 
                            -- COLOR, SCALE
display_name                VARCHAR(100) NOT NULL
description                 TEXT
icon                        VARCHAR(50)
category                    ENUM('TEXT', 'NUMBER', 'SELECTION', 'DATE', 'FILE', 'SPECIAL')
has_options                 BOOLEAN DEFAULT false
supports_validation         BOOLEAN DEFAULT true
supports_conditional_logic  BOOLEAN DEFAULT true
template_config             JSONB
                            -- {
                            --   "component": "TextInput",
                            --   "default_props": {...},
                            --   "available_validations": [...]
                            -- }
example_preview             JSONB
is_active                   BOOLEAN DEFAULT true
created_at                  TIMESTAMP DEFAULT NOW()
```

### validation_rules_catalog (CATÁLOGO - SE LLENA AL INSTALAR)
```sql
id                      UUID PRIMARY KEY
field_type_id           UUID REFERENCES field_types(id) ON DELETE CASCADE
rule_name               VARCHAR(50) NOT NULL
                        -- required, minLength, maxLength, pattern, min, max,
                        -- minSelections, maxSelections, minDate, maxDate, etc.
display_name            VARCHAR(100) NOT NULL
description             TEXT
parameter_type          ENUM('NUMBER', 'STRING', 'BOOLEAN', 'REGEX')
default_value           TEXT
example_value           TEXT
error_message_template  TEXT
created_at              TIMESTAMP DEFAULT NOW()

UNIQUE(field_type_id, rule_name)
```

### ticket_forms
```sql
id              UUID PRIMARY KEY
department_id   UUID REFERENCES departments(id) ON DELETE CASCADE
name            VARCHAR(255) NOT NULL
description     TEXT
is_active       BOOLEAN DEFAULT false
version         INTEGER DEFAULT 1
created_by      UUID REFERENCES users(id)
deleted_at      TIMESTAMP NULL
                -- Soft delete
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()

-- Solo puede haber un formulario activo por departamento
CONSTRAINT unique_active_form_per_dept 
    UNIQUE(department_id, is_active) 
    WHERE is_active = true AND deleted_at IS NULL
```

### form_fields
```sql
id                  UUID PRIMARY KEY
form_id             UUID REFERENCES ticket_forms(id) ON DELETE CASCADE
field_type_id       UUID REFERENCES field_types(id)
field_key           VARCHAR(100) NOT NULL
                    -- Identificador único: "sistema_afectado", "tipo_problema"
label               VARCHAR(255) NOT NULL
placeholder         TEXT
help_text           TEXT
is_required         BOOLEAN DEFAULT false
order_index         INTEGER NOT NULL
validation_rules    JSONB
                    -- {
                    --   "minLength": 10,
                    --   "maxLength": 100,
                    --   "pattern": "^[A-Za-z]+$"
                    -- }
conditional_logic   JSONB
                    -- {
                    --   "show_if": {
                    --     "logic": "AND",
                    --     "conditions": [
                    --       {
                    --         "field_key": "urgencia",
                    --         "operator": "equals",
                    --         "value": "critica"
                    --       }
                    --     ]
                    --   }
                    -- }
default_value       TEXT
field_config        JSONB
                    -- Configuración específica del campo
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

UNIQUE(form_id, field_key)
```

### field_options
```sql
id          UUID PRIMARY KEY
field_id    UUID REFERENCES form_fields(id) ON DELETE CASCADE
label       VARCHAR(255) NOT NULL
value       VARCHAR(255) NOT NULL
order_index INTEGER NOT NULL
is_default  BOOLEAN DEFAULT false
is_active   BOOLEAN DEFAULT true
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()

UNIQUE(field_id, value)
```

---

## MÓDULO DE TICKETS

### tickets
```sql
id              UUID PRIMARY KEY
ticket_number   VARCHAR(50) UNIQUE NOT NULL
                -- Formato: DEPT_PREFIX-YYYY-NNN (ej: IT-2024-001)
form_id         UUID REFERENCES ticket_forms(id)
                -- Versión del formulario que se usó
department_id   UUID REFERENCES departments(id)
created_by      UUID REFERENCES users(id)
assigned_to     UUID REFERENCES users(id) NULL
title           VARCHAR(255) NOT NULL
description     TEXT
priority        ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM'
status          ENUM('NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 
                     'ESCALATED', 'PAUSED', 'RESOLVED', 'REOPENED', 
                     'CLOSED', 'CANCELLED') DEFAULT 'NEW'
form_data       JSONB NOT NULL
                -- Respuestas del formulario dinámico:
                -- {
                --   "titulo_problema": "No puedo acceder",
                --   "sistema_afectado": "ventas",
                --   "descripcion": "...",
                --   "archivos": ["url1", "url2"]
                -- }
sla_deadline    TIMESTAMP NULL
resolved_at     TIMESTAMP NULL
closed_at       TIMESTAMP NULL
deleted_at      TIMESTAMP NULL
                -- Soft delete
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()

INDEX idx_tickets_status (status)
INDEX idx_tickets_department (department_id)
INDEX idx_tickets_assigned (assigned_to)
INDEX idx_tickets_created_by (created_by)
INDEX idx_tickets_created_at (created_at DESC)
INDEX idx_tickets_number (ticket_number)
INDEX idx_tickets_search USING GIN(to_tsvector('spanish', title || ' ' || description))
INDEX idx_tickets_form_data USING GIN(form_data)
```

### ticket_messages
```sql
id              UUID PRIMARY KEY
ticket_id       UUID REFERENCES tickets(id) ON DELETE CASCADE
user_id         UUID REFERENCES users(id)
message_type    ENUM('TEXT', 'FILE', 'SYSTEM') DEFAULT 'TEXT'
content         TEXT
file_url        TEXT NULL
file_name       VARCHAR(255) NULL
is_internal     BOOLEAN DEFAULT false
                -- true = solo visible para equipo del departamento
                -- false = visible para solicitante también
created_at      TIMESTAMP DEFAULT NOW()

INDEX idx_messages_ticket (ticket_id, created_at DESC)
```

### ticket_attachments
```sql
id              UUID PRIMARY KEY
ticket_id       UUID REFERENCES tickets(id) ON DELETE CASCADE
uploaded_by     UUID REFERENCES users(id)
file_name       VARCHAR(255) NOT NULL
file_url        TEXT NOT NULL
file_size       BIGINT
                -- Tamaño en bytes
mime_type       VARCHAR(100)
uploaded_from   ENUM('FORM', 'CHAT', 'UPDATE') DEFAULT 'FORM'
created_at      TIMESTAMP DEFAULT NOW()

INDEX idx_attachments_ticket (ticket_id)
```

### ticket_history
```sql
id          UUID PRIMARY KEY
ticket_id   UUID REFERENCES tickets(id) ON DELETE CASCADE
user_id     UUID REFERENCES users(id)
action      VARCHAR(100) NOT NULL
            -- CREATED, ASSIGNED, STATUS_CHANGED, PRIORITY_CHANGED,
            -- REASSIGNED, ESCALATED, RESOLVED, CLOSED, REOPENED, etc.
old_value   TEXT NULL
new_value   TEXT NULL
metadata    JSONB
            -- Información adicional sobre el cambio
created_at  TIMESTAMP DEFAULT NOW()

INDEX idx_history_ticket (ticket_id, created_at DESC)
```

### ticket_ratings
```sql
id          UUID PRIMARY KEY
ticket_id   UUID REFERENCES tickets(id) ON DELETE CASCADE UNIQUE
rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5)
comment     TEXT NULL
created_at  TIMESTAMP DEFAULT NOW()

INDEX idx_ratings_ticket (ticket_id)
```

---

## MÓDULO DE NOTIFICACIONES

### notifications
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
type            VARCHAR(100) NOT NULL
                -- TICKET_CREATED, TICKET_ASSIGNED, STATUS_CHANGED,
                -- NEW_MESSAGE, TICKET_RESOLVED, TICKET_CLOSED,
                -- SLA_WARNING, SLA_EXCEEDED, etc.
ticket_id       UUID REFERENCES tickets(id) ON DELETE CASCADE NULL
title           VARCHAR(255) NOT NULL
message         TEXT NOT NULL
metadata        JSONB
                -- Información adicional (enlaces, datos específicos)
is_read         BOOLEAN DEFAULT false
created_at      TIMESTAMP DEFAULT NOW()

INDEX idx_notifications_user (user_id, is_read, created_at DESC)
```

### fcm_tokens
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id) ON DELETE CASCADE
token       TEXT NOT NULL UNIQUE
device_type ENUM('WEB', 'ANDROID', 'IOS') DEFAULT 'WEB'
is_active   BOOLEAN DEFAULT true
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()

INDEX idx_fcm_user (user_id)
```

---

## MÓDULO DE CONFIGURACIÓN Y SEGURIDAD

### sla_configurations
```sql
id                              UUID PRIMARY KEY
department_id                   UUID REFERENCES departments(id) ON DELETE CASCADE
priority                        ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL
resolution_time_hours           INTEGER NOT NULL
                                -- Tiempo en horas para resolver: 72, 24, 8, 2
warning_threshold_percentage    INTEGER DEFAULT 80
                                -- % del tiempo para enviar alerta (80% = alerta al 80%)
is_active                       BOOLEAN DEFAULT true
created_by                      UUID REFERENCES users(id)
created_at                      TIMESTAMP DEFAULT NOW()
updated_at                      TIMESTAMP DEFAULT NOW()

UNIQUE(department_id, priority)
INDEX idx_sla_department (department_id)
```

### system_settings
```sql
id              UUID PRIMARY KEY
key             VARCHAR(100) UNIQUE NOT NULL
                -- MAX_FILE_SIZE, AUTO_CLOSE_DAYS, SESSION_TIMEOUT, etc.
value           JSONB NOT NULL
                -- Valor flexible en JSON
category        VARCHAR(50)
                -- FILES, SECURITY, NOTIFICATIONS, TICKETS
description     TEXT
is_public       BOOLEAN DEFAULT false
                -- Si es visible para usuarios no admin
updated_by      UUID REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()

INDEX idx_settings_category (category)
```

### audit_logs
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id) ON DELETE SET NULL
action          VARCHAR(100) NOT NULL
                -- USER_CREATED, USER_DELETED, ROLE_CHANGED, FORM_ACTIVATED,
                -- DEPARTMENT_CREATED, SETTINGS_CHANGED, etc.
entity_type     VARCHAR(50) NOT NULL
                -- USER, DEPARTMENT, FORM, TICKET, SETTINGS
entity_id       UUID
old_data        JSONB
                -- Estado anterior del registro
new_data        JSONB
                -- Estado nuevo del registro
ip_address      VARCHAR(45)
user_agent      TEXT
created_at      TIMESTAMP DEFAULT NOW()

INDEX idx_audit_user (user_id, created_at DESC)
INDEX idx_audit_entity (entity_type, entity_id)
INDEX idx_audit_action (action)
INDEX idx_audit_created (created_at DESC)
```

### user_sessions
```sql
id                  UUID PRIMARY KEY
user_id             UUID REFERENCES users(id) ON DELETE CASCADE
refresh_token_hash  VARCHAR(255) NOT NULL
device_info         TEXT
                    -- User agent, browser, OS
ip_address          VARCHAR(45)
last_activity       TIMESTAMP DEFAULT NOW()
expires_at          TIMESTAMP NOT NULL
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMP DEFAULT NOW()

INDEX idx_sessions_user (user_id)
INDEX idx_sessions_token (refresh_token_hash)
INDEX idx_sessions_expires (expires_at)
```

### email_templates
```sql
id                  UUID PRIMARY KEY
name                VARCHAR(100) NOT NULL
event_type          VARCHAR(50) UNIQUE NOT NULL
                    -- TICKET_CREATED, TICKET_ASSIGNED, TICKET_RESOLVED,
                    -- TICKET_CLOSED, SLA_WARNING, SLA_EXCEEDED, etc.
subject_template    VARCHAR(255) NOT NULL
                    -- "Ticket {{ticket_number}} creado"
body_template       TEXT NOT NULL
                    -- HTML con variables: {{user_name}}, {{ticket_number}}, etc.
variables           JSONB
                    -- Lista de variables disponibles
language            VARCHAR(5) DEFAULT 'es'
is_active           BOOLEAN DEFAULT true
created_by          UUID REFERENCES users(id)
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

INDEX idx_email_event (event_type)
```

### webhooks
```sql
id                  UUID PRIMARY KEY
department_id       UUID REFERENCES departments(id) ON DELETE CASCADE
name                VARCHAR(100) NOT NULL
url                 TEXT NOT NULL
events              JSONB NOT NULL
                    -- ["TICKET_CREATED", "TICKET_RESOLVED"]
secret_key          VARCHAR(255)
                    -- Para firmar requests
is_active           BOOLEAN DEFAULT true
last_triggered_at   TIMESTAMP NULL
last_status_code    INTEGER NULL
last_error          TEXT NULL
created_by          UUID REFERENCES users(id)
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()

INDEX idx_webhooks_department (department_id)
```

---

## RESUMEN DE LA ESTRUCTURA

### Total de tablas: 23

#### Módulo de Usuarios (1 tabla)
- users

#### Módulo de Departamentos (3 tablas)
- departments
- department_users
- department_access

#### Módulo de Formularios Dinámicos (5 tablas)
- field_types (catálogo)
- validation_rules_catalog (catálogo)
- ticket_forms
- form_fields
- field_options

#### Módulo de Tickets (5 tablas)
- tickets
- ticket_messages
- ticket_attachments
- ticket_history
- ticket_ratings

#### Módulo de Notificaciones (2 tablas)
- notifications
- fcm_tokens

#### Módulo de Configuración y Seguridad (7 tablas)
- sla_configurations
- system_settings
- audit_logs
- user_sessions
- email_templates
- webhooks

---

## RELACIONES PRINCIPALES

```
users (1) ←→ (N) department_users
users (1) ←→ (N) department_access
users (1) ←→ (N) tickets (como created_by)
users (1) ←→ (N) tickets (como assigned_to)

departments (1) ←→ (N) department_users
departments (1) ←→ (N) department_access
departments (1) ←→ (N) ticket_forms
departments (1) ←→ (N) tickets

ticket_forms (1) ←→ (N) form_fields
ticket_forms (1) ←→ (N) tickets

form_fields (1) ←→ (N) field_options
field_types (1) ←→ (N) form_fields
field_types (1) ←→ (N) validation_rules_catalog

tickets (1) ←→ (N) ticket_messages
tickets (1) ←→ (N) ticket_attachments
tickets (1) ←→ (N) ticket_history
tickets (1) ←→ (1) ticket_ratings

users (1) ←→ (N) notifications
users (1) ←→ (N) fcm_tokens

departments (1) ←→ (N) sla_configurations
departments (1) ←→ (N) webhooks

users (1) ←→ (N) user_sessions
users (1) ←→ (N) audit_logs
```

---

## DATOS SEMILLA (SEEDS) REQUERIDOS

### 1. field_types (~25 registros)
Tipos de campos predefinidos:
- TEXT, TEXTAREA, EMAIL, PHONE, URL
- NUMBER, RATING, CURRENCY
- SELECT, MULTISELECT, RADIO, CHECKBOX, TOGGLE
- DATE, TIME, DATETIME, DATERANGE
- FILE, FILE_MULTIPLE, IMAGE
- LOCATION, TAGS, SIGNATURE, COLOR, SCALE

### 2. validation_rules_catalog (~50-70 registros)
Reglas de validación por cada tipo de campo:
- Para TEXT: required, minLength, maxLength, pattern, etc.
- Para NUMBER: required, min, max, integer, positive, etc.
- Para DATE: required, minDate, maxDate, futureOnly, etc.
- Para FILE: required, maxSize, allowedTypes, maxFiles, etc.

### 3. sla_configurations (por departamento)
Configuración de SLA por departamento y prioridad:
- LOW: 72 horas (3 días)
- MEDIUM: 24 horas (1 día)
- HIGH: 8 horas
- URGENT: 2 horas

### 4. system_settings (~20-30 registros)
Configuraciones del sistema:
- MAX_FILE_SIZE: {"value": 10485760} (10 MB)
- AUTO_CLOSE_DAYS: {"value": 7}
- SESSION_TIMEOUT_HOURS: {"value": 24}
- REFRESH_TOKEN_DAYS: {"value": 30}
- MAX_LOGIN_ATTEMPTS: {"value": 5}
- TICKET_NUMBER_PADDING: {"value": 3}

### 5. email_templates (~10-15 registros)
Plantillas de email por evento:
- TICKET_CREATED
- TICKET_ASSIGNED
- TICKET_RESOLVED
- TICKET_CLOSED
- SLA_WARNING
- SLA_EXCEEDED
- PASSWORD_RESET (futuro)
- WELCOME_USER (futuro)

---

## ÍNDICES RECOMENDADOS

Ya incluidos en las definiciones de tablas arriba:

**Tickets:**
- idx_tickets_status
- idx_tickets_department
- idx_tickets_assigned
- idx_tickets_created_by
- idx_tickets_created_at
- idx_tickets_search (GIN para búsqueda full-text)

**Notificaciones:**
- idx_notifications_user (compuesto: user_id, is_read, created_at)

**Mensajes:**
- idx_messages_ticket (compuesto: ticket_id, created_at)

**Historial:**
- idx_history_ticket (compuesto: ticket_id, created_at)

**SLA:**
- idx_sla_department

**Auditoría:**
- idx_audit_user (compuesto: user_id, created_at)
- idx_audit_entity (compuesto: entity_type, entity_id)
- idx_audit_action
- idx_audit_created

**Sesiones:**
- idx_sessions_user
- idx_sessions_token
- idx_sessions_expires

**Configuración:**
- idx_settings_category

**Email Templates:**
- idx_email_event

**Webhooks:**
- idx_webhooks_department

---

## CONSIDERACIONES DE ALMACENAMIENTO

### Campos JSONB
Se usan en:
- `field_types.template_config` - Config de templates (~1-2 KB)
- `field_types.example_preview` - Preview data (~500 bytes)
- `form_fields.validation_rules` - Reglas (~200-500 bytes)
- `form_fields.conditional_logic` - Lógica (~200-1000 bytes)
- `form_fields.field_config` - Config específica (~200-500 bytes)
- `tickets.form_data` - Respuestas del formulario (~1-5 KB)
- `ticket_history.metadata` - Metadata del cambio (~100-500 bytes)
- `notifications.metadata` - Metadata (~100-300 bytes)

### Almacenamiento de Archivos (Disco Local)
Los archivos se almacenan en el servidor propio:
- **Ubicación:** `/var/www/tiket/uploads/`
- **Estructura:** `/uploads/{year}/{month}/{uuid}-{filename}`
- **URLs en BD:** Rutas relativas (ej: `/uploads/2024/01/abc123-documento.pdf`)
- **Permisos:** 755 para directorios, 644 para archivos
- **Límites recomendados:**
  - Tamaño máximo por archivo: 10 MB
  - Tipos permitidos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF
  - Imágenes se redimensionan automáticamente (max 1920x1080)

### Estimación de crecimiento anual
Con 100 usuarios activos y ~500 tickets/mes:
- **Base de Datos:**
  - Tickets: ~6,000 registros/año
  - Mensajes: ~24,000 registros/año
  - Notificaciones: ~60,000 registros/año
  - Attachments: ~12,000 registros/año
  - **Total BD:** ~2-3 GB de datos/año

- **Archivos en Disco:**
  - Promedio 2 archivos por ticket
  - Tamaño promedio: 2 MB por archivo
  - **Total archivos:** ~24 GB/año

**Espacio total requerido por año:** ~27 GB (BD + archivos)
**Recomendación:** Servidor con mínimo 100 GB de almacenamiento

### Sistema de Respaldo
- Backup diario de BD (PostgreSQL dump)
- Backup semanal de directorio `/uploads`
- Retención: 30 días para BD, 90 días para archivos
- Almacenar backups en ubicación separada o servidor secundario

---

## CONSTRAINTS IMPORTANTES

### Integridad Referencial
Todos los FOREIGN KEYS tienen:
- `ON DELETE CASCADE` donde corresponde (mensajes, attachments, etc)
- `ON DELETE SET NULL` donde se necesita mantener historial

### Unique Constraints
- `users.email` - Un email por usuario
- `users.google_id` - Un google_id por usuario
- `ticket_forms` - Solo un formulario activo por departamento
- `form_fields.field_key` - Keys únicos dentro de un formulario
- `tickets.ticket_number` - Números de ticket únicos globalmente

### Check Constraints
- `ticket_ratings.rating` - Entre 1 y 5
- Enums en múltiples tablas aseguran valores válidos

---

Esta es la estructura completa de la base de datos. ¿Necesitas que agregue algo más o profundice en alguna tabla específica?