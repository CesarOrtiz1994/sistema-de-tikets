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
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
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
    console.log(' Join ticket:', validated.ticketId);
  }

  leaveTicket(data: LeaveTicketData): void {
    if (!this.socket?.connected) {
      throw new Error('Socket no conectado');
    }

    const validated = leaveTicketSchema.parse(data);
    this.socket.emit('leave-ticket', validated);
    console.log(' Leave ticket:', validated.ticketId);
  }

  sendMessage(ticketId: string, message: string, attachment?: { url: string; name: string; type: string; size: number }): void {
    console.log('[SocketService] sendMessage called', { ticketId, messageLength: message.length, hasAttachment: !!attachment });
    
    if (!this.socket) {
      console.error('[SocketService] Socket not connected');
      throw new Error('Socket not connected');
    }

    console.log('[SocketService] Socket connected:', this.socket.connected);

    const payload = { ticketId, message, attachment };
    console.log('[SocketService] Payload:', payload);
    
    const validation = sendMessageSchema.safeParse(payload);
    
    if (!validation.success) {
      console.error('[SocketService] Validation failed:', validation.error);
      throw new Error(`Invalid message data: ${validation.error.message}`);
    }

    console.log('[SocketService] Validation passed, emitting event');
    this.socket.emit('send-message', { ...validation.data, attachment });
    console.log('[SocketService] Event emitted successfully');
  }

  sendTyping(data: TypingData): void {
    if (!this.socket?.connected) {
      return;
    }

    const validated = typingSchema.parse(data);
    this.socket.emit('typing', validated);
  }

  onMessageReceived(callback: (message: MessageReceived) => void): void {
    if (!this.socket) {
      throw new Error('Socket no inicializado');
    }

    this.socket.on('new-message', (data: unknown) => {
      try {
        const validated = messageReceivedSchema.parse(data);
        callback(validated);
      } catch (error) {
        console.error(' Error validando mensaje recibido:', error);
      }
    });
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
}

export const socketService = new SocketService();
export default socketService;
