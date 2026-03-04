# Socket.IO - Documentación de Eventos

## Configuración

Socket.IO está configurado con autenticación JWT obligatoria. Todos los sockets deben enviar un token válido al conectarse.

### Conexión

```typescript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## Eventos del Cliente → Servidor

### 1. `join-ticket`
Usuario se une a un room de ticket para recibir actualizaciones en tiempo real.

**Payload:**
```typescript
{
  ticketId: string
}
```

**Respuestas:**
- `joined-ticket` - Confirmación de unión exitosa
- `error` - Si no tiene permisos o el ticket no existe

**Broadcast a otros usuarios:**
- `user-joined` - Notifica que un usuario se unió al room

---

### 2. `leave-ticket`
Usuario sale de un room de ticket.

**Payload:**
```typescript
{
  ticketId: string
}
```

**Respuestas:**
- `left-ticket` - Confirmación de salida exitosa
- `error` - Si ocurre un error

**Broadcast a otros usuarios:**
- `user-left` - Notifica que un usuario salió del room

---

### 3. `send-message`
Enviar un mensaje en el chat del ticket.

**Payload:**
```typescript
{
  ticketId: string,
  message: string
}
```

**Respuestas:**
- `new-message` - Mensaje enviado exitosamente (broadcast a todos en el room)
- `error` - Si no tiene permisos o faltan datos

**Estructura del mensaje:**
```typescript
{
  id: string,
  ticketId: string,
  userId: string,
  message: string,
  createdAt: string (ISO 8601)
}
```

---

### 4. `typing`
Indicar que el usuario está escribiendo.

**Payload:**
```typescript
{
  ticketId: string,
  isTyping: boolean
}
```

**Broadcast a otros usuarios:**
- `user-typing` - Notifica que un usuario está escribiendo

---

## Eventos del Servidor → Cliente

### 1. `joined-ticket`
Confirmación de que el usuario se unió exitosamente al room.

**Payload:**
```typescript
{
  ticketId: string
}
```

---

### 2. `user-joined`
Notificación de que otro usuario se unió al room.

**Payload:**
```typescript
{
  userId: string,
  ticketId: string
}
```

---

### 3. `left-ticket`
Confirmación de que el usuario salió exitosamente del room.

**Payload:**
```typescript
{
  ticketId: string
}
```

---

### 4. `user-left`
Notificación de que otro usuario salió del room.

**Payload:**
```typescript
{
  userId: string,
  ticketId: string
}
```

---

### 5. `new-message`
Nuevo mensaje en el chat del ticket.

**Payload:**
```typescript
{
  id: string,
  ticketId: string,
  userId: string,
  message: string,
  createdAt: string
}
```

---

### 6. `user-typing`
Notificación de que un usuario está escribiendo.

**Payload:**
```typescript
{
  userId: string,
  ticketId: string,
  isTyping: boolean
}
```

---

### 7. `error`
Error en la operación solicitada.

**Payload:**
```typescript
{
  message: string
}
```

---

## Permisos

### Acceso a Tickets

Un usuario puede acceder a un ticket si:
- Es SUPER_ADMIN
- Es el solicitante del ticket (`requesterId`)
- Es el usuario asignado (`assignedToId`)
- Pertenece al departamento del ticket
- Tiene acceso especial al departamento del ticket

### Enviar Mensajes

Por ahora, si un usuario tiene acceso al ticket, puede enviar mensajes.

---

## Rooms

Los tickets utilizan rooms con el formato: `ticket:{ticketId}`

Ejemplo: `ticket:123e4567-e89b-12d3-a456-426614174000`

---

## Ejemplo de Uso

```typescript
import io from 'socket.io-client';

// Conectar con autenticación
const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

// Escuchar eventos de conexión
socket.on('connect', () => {

// Unirse a un ticket
  socket.emit('join-ticket', { ticketId: 'ticket-id' });
});

// Confirmación de unión
socket.on('joined-ticket', (data) => {
});

// Escuchar nuevos mensajes
socket.on('new-message', (message) => {
  // Actualizar UI con el nuevo mensaje
});

// Escuchar cuando alguien está escribiendo
socket.on('user-typing', (data) => {
  // Mostrar indicador de "escribiendo..."
});

// Enviar mensaje
const sendMessage = (ticketId: string, message: string) => {
  socket.emit('send-message', { ticketId, message });
};

// Indicar que estás escribiendo
const setTyping = (ticketId: string, isTyping: boolean) => {
  socket.emit('typing', { ticketId, isTyping });
};

// Salir del ticket
const leaveTicket = (ticketId: string) => {
  socket.emit('leave-ticket', { ticketId });
};

// Manejo de errores
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

---

## Notas Importantes

1. **Autenticación Obligatoria**: Todos los sockets deben autenticarse con un JWT válido.
2. **Permisos por Ticket**: Los permisos se verifican en cada operación.
3. **Rooms Automáticos**: Al unirse a un ticket, el usuario se une automáticamente al room.
4. **Mensajes Temporales**: Por ahora, los mensajes tienen IDs temporales hasta que se implemente la persistencia en BD.
5. **Desconexión Automática**: Al desconectarse, el usuario sale automáticamente de todos los rooms.
