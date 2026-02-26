import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { env } from '../config/env';
import logger from '../config/logger';

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

// Variable global para almacenar el contexto del código
let codeContext: string = '';

/**
 * Lee recursivamente archivos .ts/.tsx de rutas, controladores, páginas del frontend y schema.prisma
 * Limita cada archivo a 150 líneas y retorna todo como string
 */
function loadCodeContext(): string {
  const context: string[] = [];
  const controllersPath = path.join(__dirname, '../controllers');
  const routesPath = path.join(__dirname, '../routes');
  const frontendPagesPath = path.join(__dirname, '../../../frontend/src/pages');
  const formBuilderPath = path.join(__dirname, '../../../frontend/src/components/FormBuilder');
  const fieldsPath = path.join(__dirname, '../../../frontend/src/components/fields');
  const ticketsComponentsPath = path.join(__dirname, '../../../frontend/src/components/Tickets');
  const chatComponentsPath = path.join(__dirname, '../../../frontend/src/components/Chat');
  const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');

  const readDirectory = (dirPath: string, label: string, lineLimit: number = 150) => {
    try {
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const filePath = path.join(dirPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n').slice(0, lineLimit);
          
          context.push(`\n=== ${label}/${file} ===\n${lines.join('\n')}`);
        }
      });
    } catch (error) {
      logger.warn(`No se pudo leer directorio ${dirPath}:`, error);
    }
  };

  const readFile = (filePath: string, label: string, lineLimit: number = 200) => {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').slice(0, lineLimit);
        context.push(`\n=== ${label} ===\n${lines.join('\n')}`);
      }
    } catch (error) {
      logger.warn(`No se pudo leer archivo ${filePath}:`, error);
    }
  };

  // Leer backend
  readDirectory(controllersPath, 'backend/controllers');
  readDirectory(routesPath, 'backend/routes');
  
  // Leer frontend pages (módulos del sistema)
  readDirectory(frontendPagesPath, 'frontend/pages');
  
  // Leer FormBuilder components (constructor de formularios)
  readDirectory(formBuilderPath, 'frontend/FormBuilder', 200);
  
  // Leer tipos de campos disponibles
  readDirectory(fieldsPath, 'frontend/fields');
  
  // Leer componentes de Tickets (vistas por rol)
  readDirectory(ticketsComponentsPath, 'frontend/Tickets', 180);
  
  // Leer componentes de Chat (seguimiento y comunicación)
  readDirectory(chatComponentsPath, 'frontend/Chat', 180);
  
  // Leer schema de base de datos
  readFile(schemaPath, 'database/schema.prisma', 250);

  return context.join('\n\n');
}

/**
 * Construye el prompt del sistema basado en el rol del usuario
 */
function buildSystemPrompt(rol: string, nombre: string): string {
  const basePrompt = `Eres un asistente de ayuda para el sistema de tickets SCOT. 
Tu nombre es SCOT Assistant y estás ayudando a ${nombre}.

REGLAS ESTRICTAS:
1. SOLO responde preguntas relacionadas con el sistema de tickets SCOT
2. NO respondas preguntas sobre temas generales, programación externa, matemáticas, historia, cultura, etc.
3. Si la pregunta NO está relacionada con el sistema de tickets, responde: "Lo siento, solo puedo ayudarte con preguntas sobre el sistema de tickets SCOT. ¿Tienes alguna duda sobre cómo usar el sistema?"
4. Responde SIEMPRE en español de forma clara y concisa
5. Usa el contexto del código proporcionado para dar respuestas precisas

TEMAS VÁLIDOS:
- Cómo crear, editar o gestionar tickets
- Funcionalidades del sistema (SLA, formularios, departamentos, usuarios)
- Permisos y roles
- Cómo usar las diferentes secciones del sistema
- Resolución de problemas dentro del sistema
- Configuraciones y personalizaciones del sistema

CONSTRUCTOR DE FORMULARIOS (FormBuilder):
Cuando te pregunten sobre el constructor de formularios, debes explicar:
- Tipos de campos disponibles: TextField, TextArea, Number, Select, MultiSelect, Radio, CheckboxGroup, Checkbox, Toggle, Date, File, Color, Rating, Signature
- Configuración de cada campo: label, placeholder, required, defaultValue, validation, options (para select/radio/checkbox)
- Cómo agregar campos: Arrastrar desde la paleta (FieldPalette) al canvas (BuilderCanvas)
- Cómo editar campos: Click en el campo abre el modal de edición (FieldEditor) con todas las opciones específicas del tipo
- Cómo previsualizar: El componente FieldPreview muestra cómo se verá el campo en tiempo real
- Validaciones disponibles: required, minLength, maxLength, min, max, pattern (regex)
- Opciones avanzadas: helpText, conditional logic, field dependencies
- Cómo guardar y publicar formularios
- Cómo duplicar formularios existentes
- Cómo asignar formularios a departamentos

VISTAS DE TICKETS POR ROL:
Cuando te pregunten sobre cómo ver o gestionar tickets según el rol, explica las diferencias:

SOLICITANTE (REQUESTER):
- Vista: TicketDetailPage muestra solo sus propios tickets creados
- Secciones visibles: Información básica, descripción, archivos adjuntos, historial de cambios
- Acciones permitidas: Ver detalles, agregar comentarios en el chat, subir archivos, ver estado actual
- NO puede: Cambiar estado, reasignar, modificar prioridad, cerrar tickets
- Seguimiento: A través del chat (ChatWindow) puede comunicarse con agentes y ver actualizaciones en tiempo real

AGENTE/SUBORDINADO (SUBORDINATE):
- Vista: TicketDetailPage con más opciones de gestión para tickets asignados
- Secciones visibles: Toda la información del ticket + controles de gestión
- Acciones permitidas:
  * Cambiar estado del ticket (OPEN, IN_PROGRESS, PENDING, RESOLVED)
  * Cambiar prioridad (LOW, MEDIUM, HIGH, URGENT)
  * Agregar comentarios internos y públicos en el chat
  * Subir archivos y entregables (Deliverables)
  * Solicitar cierre de ticket (CloseTicketModal)
  * Ver y responder en tiempo real vía ChatWindow
- NO puede: Reasignar a otros agentes, eliminar tickets, modificar configuraciones del departamento
- Seguimiento: Chat en tiempo real, notificaciones, historial completo de cambios

ADMINISTRADOR DE DEPARTAMENTO (DEPT_ADMIN):
- Vista: TicketDetailPage con control total sobre tickets de su departamento
- Secciones visibles: Toda la información + panel de administración
- Acciones permitidas:
  * Todas las acciones del SUBORDINATE
  * Reasignar tickets a otros agentes del departamento
  * Cerrar tickets directamente (CloseTicketModal)
  * Reabrir tickets cerrados (ReopenTicketModal)
  * Gestionar relaciones entre tickets (TicketRelationship)
  * Ver información de horarios laborales (WorkScheduleInfo)
  * Acceso completo al chat y archivos
- Seguimiento: Dashboard con métricas, vista Kanban, chat en tiempo real, historial completo

COMPONENTES CLAVE:
- ChatWindow: Comunicación en tiempo real entre solicitante y agentes
- CloseTicketModal: Modal para cerrar tickets con resolución y comentarios
- ReopenTicketModal: Modal para reabrir tickets cerrados
- TicketRelationship: Gestión de tickets relacionados (duplicados, bloqueados, etc.)
- ChatMessageList: Historial completo de mensajes y cambios
- FileHistory: Historial de archivos subidos al ticket

`;

  let rolePermissions = '';

  switch (rol) {
    case 'SUPER_ADMIN':
      rolePermissions = `El usuario es SUPER_ADMIN con acceso total al sistema.

PUEDE REALIZAR:
- Crear, editar y eliminar usuarios
- Gestionar todos los departamentos
- Configurar SLA globales
- Administrar formularios de tickets
- Ver y gestionar todos los tickets del sistema
- Configurar tipos de campo
- Acceder a auditoría completa
- Gestionar plantillas de email
- Configurar personalización (branding)
- Ver métricas y dashboards completos

NO TIENE RESTRICCIONES en el sistema.`;
      break;

    case 'DEPT_ADMIN':
      rolePermissions = `El usuario es DEPT_ADMIN (Administrador de Departamento).

PUEDE REALIZAR:
- Gestionar tickets de su departamento
- Asignar tickets a subordinados
- Ver tickets de su departamento
- Configurar formularios de su departamento
- Gestionar usuarios de su departamento
- Configurar SLA de su departamento
- Ver métricas de su departamento

NO PUEDE:
- Crear o eliminar usuarios del sistema
- Gestionar departamentos que no administra
- Modificar configuraciones globales de SLA
- Acceder a auditoría completa del sistema
- Ver tickets de otros departamentos`;
      break;

    case 'SUBORDINATE':
      rolePermissions = `El usuario es SUBORDINATE (Agente/Técnico).

PUEDE REALIZAR:
- Ver tickets asignados a él
- Actualizar estado de sus tickets asignados
- Responder mensajes en sus tickets
- Subir entregables en sus tickets
- Cambiar prioridad de tickets asignados
- Ver tablero Kanban de sus tickets

NO PUEDE:
- Crear usuarios
- Gestionar departamentos
- Ver tickets no asignados a él
- Modificar formularios
- Configurar SLA
- Asignar tickets a otros usuarios
- Acceder a configuraciones del sistema`;
      break;

    case 'REQUESTER':
    default:
      rolePermissions = `El usuario es REQUESTER (Solicitante).

PUEDE REALIZAR:
- Crear tickets en departamentos públicos
- Ver sus propios tickets
- Responder mensajes en sus tickets
- Calificar tickets resueltos
- Ver estado de sus solicitudes

NO PUEDE:
- Crear usuarios
- Ver tickets de otros usuarios
- Gestionar departamentos
- Asignar tickets
- Modificar configuraciones
- Acceder a formularios o SLA
- Ver métricas del sistema`;
      break;
  }

  return basePrompt + rolePermissions + `

Cuando el usuario pregunte algo que NO puede hacer según su rol, explícale amablemente que no tiene permisos para esa acción y sugiere alternativas dentro de sus capacidades.

Usa el contexto del código proporcionado para dar respuestas precisas sobre cómo usar el sistema.`;
}

/**
 * Controlador para manejar preguntas al chatbot
 */
class BotController {
  async askQuestion(req: Request, res: Response) {
    try {
      const { pregunta } = req.body;
      const user = (req as any).user;

      if (!pregunta || typeof pregunta !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'La pregunta es requerida',
        });
      }

      if (!user || !user.roleType || !user.name) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado correctamente',
        });
      }

      // Construir el system prompt basado en el rol
      const systemPrompt = buildSystemPrompt(user.roleType, user.name);

      // Combinar contexto del código con el system prompt
      const fullSystemPrompt = `${systemPrompt}\n\n=== CONTEXTO DEL CÓDIGO ===\n${codeContext}`;

      logger.info(`[Bot] Pregunta de ${user.name} (${user.roleType}): ${pregunta.substring(0, 100)}...`);

      // Llamar a OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: fullSystemPrompt },
          { role: 'user', content: pregunta },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const respuesta = completion.choices[0]?.message?.content || 'Lo siento, no pude generar una respuesta.';

      logger.info(`[Bot] Respuesta generada para ${user.name}`);

      return res.json({
        success: true,
        respuesta,
      });
    } catch (error: any) {
      logger.error('[Bot] Error al procesar pregunta:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error al procesar tu pregunta',
        error: error.message || 'Error desconocido',
      });
    }
  }
}

// Cargar contexto del código al iniciar el servidor (una sola vez)
logger.info('[Bot] Cargando contexto del código...');
codeContext = loadCodeContext();
logger.info(`[Bot] Contexto cargado: ${codeContext.length} caracteres`);

export default new BotController();
