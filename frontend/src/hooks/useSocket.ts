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

      console.log('[useSocket] Socket listeners configured');

      return () => {
        console.log('[useSocket] Cleaning up socket listeners');
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

  const sendMessage = useCallback((ticketId: string, message: string, attachment?: { url: string; name: string; type: string; size: number }) => {
    try {
      console.log('[useSocket] sendMessage called', { ticketId, message, hasAttachment: !!attachment });
      socketService.sendMessage(ticketId, message, attachment);
      console.log('[useSocket] sendMessage completed');
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
    socketService.onMessageReceived(callback);
  }, []);

  const onTyping = useCallback((callback: (data: TypingEvent) => void) => {
    socketService.onTyping(callback);
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setSocket(null);
    setIsConnected(false);
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
    disconnect
  };
};
