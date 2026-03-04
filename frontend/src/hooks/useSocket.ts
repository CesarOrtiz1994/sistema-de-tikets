import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { toast } from 'sonner';
import socketService from '../services/socket.service';
import type { MessageReceived, TypingEvent } from '../validators/socket.validator';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      return;
    }

    try {
      const socketInstance = socketService.connect(token);
      setSocket(socketInstance);
      
      // Establecer estado inicial basado en si el socket ya está conectado
      setIsConnected(socketInstance.connected);

      const handleConnect = () => {
        setIsConnected(true);
        setError(null);
      };

      const handleDisconnect = () => {
        setIsConnected(false);
      };

      const handleConnectError = (err: Error) => {
        console.error('[useSocket] Socket connection error:', err);
        setError(err.message);
        setIsConnected(false);
        toast.error('Error de conexión en tiempo real');
      };

      socketInstance.on('connect', handleConnect);
      socketInstance.on('disconnect', handleDisconnect);
      socketInstance.on('connect_error', handleConnectError);


      return () => {
        socketInstance.off('connect', handleConnect);
        socketInstance.off('disconnect', handleDisconnect);
        socketInstance.off('connect_error', handleConnectError);
      };
    } catch (err) {
      console.error('[useSocket] Error setting up socket:', err);
      const message = err instanceof Error ? err.message : 'Error al conectar';
      setError(message);
      toast.error(message);
    }
  }, []);

  const joinTicket = useCallback((ticketId: string) => {
    try {
      socketService.joinTicket({ ticketId });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al unirse al ticket';
      toast.error(message);
    }
  }, []);

  const leaveTicket = useCallback((ticketId: string) => {
    try {
      socketService.leaveTicket({ ticketId });
    } catch (err) {
      console.error('Error leaving ticket:', err);
    }
  }, []);

  const sendMessage = useCallback(async (ticketId: string, message: string, attachment?: { url: string; name: string; type: string; size: number }, replyToId?: string) => {
    try {
      await socketService.sendMessage(ticketId, message, attachment, replyToId);
    } catch (err) {
      console.error('[useSocket] Error in sendMessage:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar mensaje';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const sendTyping = useCallback((ticketId: string, isTyping: boolean) => {
    try {
      socketService.sendTyping({ ticketId, isTyping });
    } catch (err) {
      console.error('Error sending typing:', err);
    }
  }, []);

  const onMessageReceived = useCallback((callback: (message: MessageReceived) => void) => {
    return socketService.onMessageReceived(callback);
  }, []);

  const onTyping = useCallback((callback: (data: TypingEvent) => void) => {
    socketService.onTyping(callback);
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setSocket(null);
    setIsConnected(false);
  }, []);

  const onConnectionChange = useCallback((callback: (connected: boolean) => void) => {
    return socketService.onConnectionChange(callback);
  }, []);

  const getReconnectAttempts = useCallback(() => {
    return socketService.getReconnectAttempts();
  }, []);

  return {
    socket,
    isConnected,
    error,
    joinTicket,
    leaveTicket,
    sendMessage,
    sendTyping,
    onMessageReceived,
    onTyping,
    disconnect,
    onConnectionChange,
    getReconnectAttempts
  };
};
