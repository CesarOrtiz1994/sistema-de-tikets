import { useState, useRef, useEffect } from 'react';
import { FiMessageCircle, FiX, FiSend } from 'react-icons/fi';
import { toast } from 'sonner';
import botService from '../services/bot.service';
import { MensajeChat } from '../types/bot.types';

export default function BotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      tipo: 'bot',
      texto: '¡Hola! Soy SCOT Assistant, tu asistente de ayuda. ¿En qué puedo ayudarte hoy?',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const pregunta = inputValue.trim();
    setInputValue('');

    // Agregar mensaje del usuario
    const userMessage: MensajeChat = { tipo: 'user', texto: pregunta };
    setMensajes((prev) => [...prev, userMessage]);

    // Mostrar indicador de "escribiendo..."
    setIsLoading(true);

    try {
      const respuesta = await botService.enviarPregunta(pregunta);
      
      // Agregar respuesta del bot
      const botMessage: MensajeChat = { tipo: 'bot', texto: respuesta };
      setMensajes((prev) => [...prev, botMessage]);
    } catch (error: any) {
      toast.error(error.message || 'Error al obtener respuesta del bot');
      
      // Agregar mensaje de error del bot
      const errorMessage: MensajeChat = {
        tipo: 'bot',
        texto: 'Lo siento, hubo un error al procesar tu pregunta. Por favor, intenta de nuevo.',
      };
      setMensajes((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
          aria-label="Abrir chat de ayuda"
        >
          <FiMessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-2xl">
            <div className="flex items-center gap-2">
              <FiMessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">SCOT Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-lg p-1 transition-colors"
              aria-label="Cerrar chat"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensajes.map((mensaje, index) => (
              <div
                key={index}
                className={`flex ${mensaje.tipo === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    mensaje.tipo === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{mensaje.texto}</p>
                </div>
              </div>
            ))}

            {/* Indicador de "escribiendo..." */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu pregunta..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Enviar mensaje"
              >
                <FiSend className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
