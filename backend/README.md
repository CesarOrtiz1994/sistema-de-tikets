# Tiket Backend - Sistema de Tickets con Formularios Dinámicos

Backend del sistema de gestión de tickets con formularios dinámicos.

## Tecnologías

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **PostgreSQL** - Base de datos
- **Prisma** - ORM
- **Redis** - Cache y colas
- **JWT** - Autenticación
- **Winston** - Logging

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env

# Configurar variables en .env
```

## Scripts Disponibles

```bash
# Desarrollo (con hot reload)
npm run dev

# Build para producción
npm run build

# Iniciar en producción
npm start

# Linting
npm run lint
npm run lint:fix

# Formateo de código
npm run format
npm run format:check
```

## Seguridad

El proyecto incluye las siguientes medidas de seguridad:

- **Helmet.js** - Headers HTTP seguros
- **CORS** - Configuración de orígenes permitidos
- **Rate Limiting** - Protección contra ataques de fuerza bruta
- **Body Size Limits** - Límite de 10MB en requests
- **Input Validation** - Validación con Zod (próximamente)

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuraciones
│   ├── controllers/     # Controladores
│   ├── middlewares/     # Middlewares
│   ├── routes/          # Rutas
│   ├── services/        # Lógica de negocio
│   ├── utils/           # Utilidades
│   ├── types/           # Tipos TypeScript
│   ├── app.ts           # Configuración Express
│   └── index.ts         # Punto de entrada
├── prisma/              # Schemas y migraciones
├── logs/                # Archivos de log
└── uploads/             # Archivos subidos (dev)
```

## Endpoints

### Health Check
```
GET /api/health
```

Respuesta:
```json
{
  "status": "ok",
  "message": "Tiket API is running",
  "timestamp": "2024-01-13T20:00:00.000Z",
  "environment": "development"
}
```

## Variables de Entorno

Ver archivo `.env.example` para la lista completa de variables requeridas.

## Desarrollo

1. El servidor corre en `http://localhost:3000`
2. Hot reload activado con `tsx watch`
3. ESLint y Prettier configurados
4. TypeScript en modo estricto

## Testing

```bash
# Tests unitarios (próximamente)
npm test

# Tests de integración (próximamente)
npm run test:integration
```

## Licencia

ISC
