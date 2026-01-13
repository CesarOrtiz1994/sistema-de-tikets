# Sistema de Tickets con Formularios Dinámicos

Sistema completo de gestión de tickets con formularios personalizables, diseñado para empresas que necesitan un helpdesk flexible y escalable.

## Tabla de Contenidos

- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Documentación](#documentación)
- [Contribuir](#contribuir)

## Características

### Formularios Dinámicos
- **Form Builder** con drag & drop
- 25+ tipos de campos personalizables
- Validaciones configurables
- Lógica condicional entre campos
- Versionamiento de formularios

### Gestión de Usuarios y Departamentos
- 4 roles: Super Admin, Admin de Departamento, Subordinado, Solicitante
- Control de acceso basado en roles (RBAC)
- Departamentos con prefijos personalizados
- Asignación flexible de usuarios

### Sistema de Tickets
- Números de ticket automáticos por departamento
- Estados personalizables (NEW, ASSIGNED, IN_PROGRESS, etc.)
- Prioridades (LOW, MEDIUM, HIGH, URGENT)
- SLA configurable por departamento y prioridad
- Soft delete para recuperación de datos

### Comunicación en Tiempo Real
- Chat integrado en tickets (Socket.io)
- Notificaciones in-app
- Emails automáticos
- Push notifications (FCM)

### Métricas y Reportes
- Dashboard con métricas en tiempo real
- Reportes por departamento, usuario, período
- Gráficos interactivos (Recharts)
- Exportación de datos

### Seguridad
- Autenticación con Google OAuth 2.0
- JWT (access + refresh tokens)
- Helmet.js para headers seguros
- Rate limiting
- Auditoría completa de acciones
- Gestión de sesiones

### Características Adicionales
- PWA (Progressive Web App)
- Internacionalización (i18n)
- Webhooks para integraciones
- Email templates personalizables
- Sistema de archivos local
- API documentada con Swagger

## Stack Tecnológico

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Lenguaje:** TypeScript
- **Base de Datos:** PostgreSQL 14+
- **ORM:** Prisma
- **Cache:** Redis
- **Autenticación:** Passport.js + Google OAuth
- **Validación:** Zod
- **Logging:** Winston
- **Jobs:** Bull
- **Email:** Nodemailer
- **WebSockets:** Socket.io
- **Archivos:** Multer + Sharp

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Routing:** React Router v7
- **Estado:** Zustand
- **Forms:** React Hook Form
- **Drag & Drop:** @dnd-kit
- **Gráficos:** Recharts
- **HTTP:** Axios
- **Notificaciones:** react-hot-toast

### DevOps
- **Control de Versiones:** Git
- **CI/CD:** GitHub Actions
- **Servidor:** Ubuntu Server
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt
- **Process Manager:** PM2
- **Monitoreo:** Sentry, Grafana (opcional)

## Requisitos Previos

- **Node.js:** v20.x o superior
- **npm:** v10.x o superior
- **PostgreSQL:** v14.x o superior
- **Redis:** v7.x o superior (opcional para desarrollo)
- **Git:** v2.x o superior

## Instalación

### 1. Clonar el repositorio

```bash
git clone git@github.com:CesarOrtiz1994/sistema-de-tikets.git
cd sistema-de-tikets
```

### 2. Instalar dependencias

```bash
# Instalar todas las dependencias (backend + frontend)
npm run install:all

# O instalar por separado
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example backend/.env

# Editar con tus credenciales
nano backend/.env
```

### 4. Configurar base de datos

```bash
# Crear base de datos en PostgreSQL
createdb tiket_db

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Generar cliente de Prisma
npm run prisma:generate
```

## Configuración

### Variables de Entorno Principales

```env
# Base de Datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/tiket_db"

# Redis (opcional en desarrollo)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="tu-secret-super-seguro"
JWT_REFRESH_SECRET="tu-refresh-secret"

# Google OAuth
GOOGLE_CLIENT_ID="tu-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="tu-client-secret"

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="tu-email@gmail.com"
SMTP_PASSWORD="tu-app-password"

# Frontend URL
FRONTEND_URL="http://localhost:5173"
```

Ver `.env.example` para la lista completa de variables.

## Uso

### Desarrollo

```bash
# Iniciar backend y frontend simultáneamente
npm run dev

# O iniciar por separado
npm run dev:backend   # Backend en http://localhost:3000
npm run dev:frontend  # Frontend en http://localhost:5173
```

### Producción

```bash
# Build de ambos proyectos
npm run build

# Iniciar servidor de producción
npm start
```

### Base de Datos

```bash
# Abrir Prisma Studio (GUI para BD)
npm run prisma:studio

# Crear nueva migración
npm run prisma:migrate

# Generar cliente de Prisma
npm run prisma:generate
```

## Scripts Disponibles

### Scripts Principales

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia backend y frontend en modo desarrollo |
| `npm run build` | Compila backend y frontend para producción |
| `npm start` | Inicia el servidor de producción |
| `npm run install:all` | Instala todas las dependencias |

### Scripts de Backend

| Script | Descripción |
|--------|-------------|
| `npm run dev:backend` | Inicia backend en modo desarrollo |
| `npm run build:backend` | Compila backend |
| `npm run lint:backend` | Ejecuta ESLint en backend |
| `npm run format:backend` | Formatea código del backend |

### Scripts de Frontend

| Script | Descripción |
|--------|-------------|
| `npm run dev:frontend` | Inicia frontend en modo desarrollo |
| `npm run build:frontend` | Compila frontend |
| `npm run lint:frontend` | Ejecuta ESLint en frontend |
| `npm run format:frontend` | Formatea código del frontend |

### Scripts de Base de Datos

| Script | Descripción |
|--------|-------------|
| `npm run prisma:generate` | Genera cliente de Prisma |
| `npm run prisma:migrate` | Ejecuta migraciones |
| `npm run prisma:studio` | Abre Prisma Studio |

### Scripts de Utilidad

| Script | Descripción |
|--------|-------------|
| `npm run clean` | Limpia node_modules y dist |
| `npm run lint` | Ejecuta linting en todo el proyecto |
| `npm run format` | Formatea todo el código |
| `npm test` | Ejecuta tests |

## Estructura del Proyecto

```
tiket/
├── backend/                 # Servidor Node.js + Express
│   ├── prisma/             # Schema y migraciones de Prisma
│   ├── src/
│   │   ├── config/         # Configuraciones (DB, logger, etc.)
│   │   ├── controllers/    # Controladores de rutas
│   │   ├── middlewares/    # Middlewares personalizados
│   │   ├── routes/         # Definición de rutas
│   │   ├── services/       # Lógica de negocio
│   │   ├── utils/          # Utilidades y helpers
│   │   ├── types/          # Tipos de TypeScript
│   │   ├── app.ts          # Configuración de Express
│   │   └── index.ts        # Punto de entrada
│   ├── logs/               # Archivos de log
│   └── uploads/            # Archivos subidos (dev)
│
├── frontend/               # Aplicación React
│   ├── public/            # Archivos estáticos
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas/vistas
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # Servicios API
│   │   ├── store/         # Estado global (Zustand)
│   │   ├── utils/         # Utilidades
│   │   ├── types/         # Tipos TypeScript
│   │   ├── assets/        # Imágenes, iconos
│   │   ├── layouts/       # Layouts de página
│   │   ├── App.tsx        # Componente principal
│   │   └── main.tsx       # Punto de entrada
│   └── index.html
│
├── .env.example           # Plantilla de variables de entorno
├── .gitignore            # Archivos ignorados por Git
├── package.json          # Scripts y dependencias raíz
├── README.md             # Este archivo
├── database_structure.md # Documentación de BD
└── development_plan.md   # Plan de desarrollo
```

## Documentación

- **[Plan de Desarrollo](./development_plan.md)** - Roadmap completo del proyecto (25 semanas)
- **[Estructura de Base de Datos](./database_structure.md)** - Schema detallado y relaciones
- **[API Documentation](http://localhost:3000/api-docs)** - Swagger/OpenAPI (en desarrollo)
- **Backend README** - `./backend/README.md`
- **Frontend README** - `./frontend/README.md`

## Seguridad

- Nunca subas el archivo `.env` al repositorio
- Usa variables de entorno para credenciales
- Cambia los secrets por defecto en producción
- Mantén las dependencias actualizadas
- Revisa los logs de auditoría regularmente

## Testing

```bash
# Ejecutar todos los tests
npm test

# Tests de backend
npm run test:backend

# Tests de frontend
npm run test:frontend
```

## Deployment

Ver `development_plan.md` Semana 25 para instrucciones completas de deployment.

### Checklist de Producción

- [ ] Configurar variables de entorno de producción
- [ ] Configurar PostgreSQL en servidor
- [ ] Configurar Redis (opcional)
- [ ] Setup de Nginx como reverse proxy
- [ ] Configurar SSL con Let's Encrypt
- [ ] Configurar PM2 para process management
- [ ] Setup de backups automáticos
- [ ] Configurar monitoreo (Sentry, logs)
- [ ] Configurar dominio y DNS

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

ISC

## Autores

- **Desarrollo Inicial** - Sistema de Tickets UMx

## Agradecimientos

- Equipo de desarrollo
- Comunidad de código abierto
- Todos los contribuidores

---

**Desarrollado usando React + TypeScript + Node.js + PostgreSQL**
