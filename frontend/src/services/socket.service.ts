import { io, Socket } from 'socket.io-client';
import { 
  joinTicketSchema, 
  leaveTicketSchema, 
  sendMessageSchema, 
  typingSchema,
  messageReceivedSchema,
  typingEventSchema,
  errorEventSchema,
  type JoinTicketData,
  type LeaveTicketData,
  type TypingData,
  type MessageReceived,
  type TypingEvent,
  type ErrorEvent
} from '../validators/socket.validator';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private activeRooms: Set<string> = new Set();
  private reconnectAttempts = 0;
  private connectionListeners: Array<(connected: boolean) => void> = [];

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 20000,
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.notifyConnectionListeners(true);
      this.rejoinActiveRooms();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.notifyConnectionListeners(false);
      
      // Si el servidor desconectó, intentar reconectar manualmente
      if (reason === 'io server disconnect') {
        console.log('[Socket] Server disconnected, attempting manual reconnect');
        setTimeout(() => {
          this.socket?.connect();
        }, 1000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      this.reconnectAttempts++;
      console.log(`[Socket] Reconnect attempt ${this.reconnectAttempts}`);
    });

    // Manejar errores del servidor (incluyendo rate limiting)
    this.socket.on('error', (error: any) => {
      console.error('[Socket] Server error:', error);
      
      // Si es un error de rate limiting, mostrar mensaje específico
      if (error.retryAfter) {
        console.warn(`[Socket] Rate limit exceeded. Retry after ${error.retryAfter} seconds`);
      }
    });

    // Capturar TODOS los eventos para debugging
    this.socket.onAny((eventName, ...args) => {
      console.log('[Socket] Event received:', eventName, args);
    });

    // Capturar eventos salientes
    this.socket.onAnyOutgoing((eventName, ...args) => {
      console.log('[Socket] Event sent:', eventName, args);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket desconectado manualmente');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinTicket(data: JoinTicketData): void {
    if (!this.socket?.connected) {
      throw new Error('Socket no conectado');
    }

    const validated = joinTicketSchema.parse(data);
    this.socket.emit('join-ticket', validated);
    this.activeRooms.add(validated.ticketId);
    console.log('✅ Join ticket:', validated.ticketId);
  }

  leaveTicket(data: LeaveTicketData): void {
    if (!this.socket?.connected) {
      throw new Error('Socket no conectado');
    }

    const validated = leaveTicketSchema.parse(data);
    this.socket.emit('leave-ticket', validated);
    this.activeRooms.delete(validated.ticketId);
    console.log('❌ Leave ticket:', validated.ticketId);
  }

  sendMessage(ticketId: string, message: string, attachment?: { url: string; name: string; type: string; size: number }, replyToId?: string): Promise<void> {
    console.log('[SocketService] sendMessage called', { ticketId, messageLength: message.length, hasAttachment: !!attachment, replyToId });
    
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        console.error('[SocketService] Socket not connected');
        reject(new Error('Socket not connected'));
        return;
      }

      console.log('[SocketService] Socket connected:', this.socket.connected);

      const payload = { ticketId, message, attachment, replyToId };
      console.log('[SocketService] Payload:', payload);
      
      const validation = sendMessageSchema.safeParse(payload);
      
      if (!validation.success) {
        console.error('[SocketService] Validation failed:', validation.error);
        reject(new Error(`Invalid message data: ${validation.error.message}`));
        return;
      }

      // Timeout de 10 segundos para detectar errores
      const timeout = setTimeout(() => {
        reject(new Error('Timeout: El mensaje no pudo ser enviado'));
      }, 10000);

      // Escuchar confirmación del servidor (el mensaje se recibe de vuelta)
      const messageHandler = (data: unknown) => {
        try {
          const validated = messageReceivedSchema.parse(data);
          // Si el mensaje recibido es del mismo ticket y tiene el mismo contenido
          if (validated.ticketId === ticketId && validated.message === message) {
            clearTimeout(timeout);
            this.socket?.off('new-message', messageHandler);
            resolve();
          }
        } catch (error) {
          // Ignorar errores de validación en este listener
        }
      };

      this.socket.on('new-message', messageHandler);

      console.log('[SocketService] Validation passed, emitting event');
      this.socket.emit('send-message', { ...validation.data, attachment });
      console.log('[SocketService] Event emitted successfully');
    });
  }

  sendTyping(data: TypingData): void {
    if (!this.socket?.connected) {
      return;
    }

    const validated = typingSchema.parse(data);
    this.socket.emit('typing', validated);
  }

  onMessageReceived(callback: (message: MessageReceived) => void): () => void {
    if (!this.socket) {
      throw new Error('Socket no inicializado');
    }

    const handler = (data: unknown) => {
      console.log('[SocketService] new-message event received:', data);
      try {
        const validated = messageReceivedSchema.parse(data);
        console.log('[SocketService] Message validated successfully:', validated);
        callback(validated);
      } catch (error) {
        console.error('❌ Error validando mensaje recibido:', error, 'Data:', data);
      }
    };

    this.socket.on('new-message', handler);

    // Retornar función de cleanup
    return () => {
      if (this.socket) {
        this.socket.off('new-message', handler);
      }
    };
  }

  onTyping(callback: (data: TypingEvent) => void): void {
    if (!this.socket) {
      throw new Error('Socket no inicializado');
    }

    this.socket.on('user-typing', (data: unknown) => {
      try {
        const validated = typingEventSchema.parse(data);
        callback(validated);
      } catch (error) {
        console.error(' Error validando evento typing:', error);
      }
    });
  }

  onError(callback: (error: ErrorEvent) => void): void {
    if (!this.socket) {
      throw new Error('Socket no inicializado');
    }

    this.socket.on('error', (data: unknown) => {
      try {
        const validated = errorEventSchema.parse(data);
        callback(validated);
      } catch (error) {
        console.error(' Error validando evento de error:', error);
      }
    });
  }

  offMessageReceived(): void {
    this.socket?.off('new-message');
  }

  offTyping(): void {
    this.socket?.off('user-typing');
  }

  offError(): void {
    this.socket?.off('error');
  }

  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  // Métodos para reconexión automática
  private notifyConnectionListeners(connected: boolean): void {
    this.connectionListeners.forEach(listener => listener(connected));
  }

  private rejoinActiveRooms(): void {
    console.log('[Socket] Rejoining active rooms:', Array.from(this.activeRooms));
    this.activeRooms.forEach(ticketId => {
      try {
        this.joinTicket({ ticketId });
      } catch (error) {
        console.error(`[Socket] Error rejoining room ${ticketId}:`, error);
      }
    });
  }

  onConnectionChange(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.push(callback);
    
    // Retornar función para desuscribirse
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  getActiveRooms(): string[] {
    return Array.from(this.activeRooms);
  }
}

export const socketService = new SocketService();
export default socketService;
