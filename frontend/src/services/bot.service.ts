import api from './api';

interface BotResponse {
  success: boolean;
  respuesta: string;
  message?: string;
  error?: string;
}

class BotService {
  /**
   * Envía una pregunta al chatbot de ayuda
   * @param pregunta - La pregunta del usuario
   * @returns La respuesta del bot
   */
  async enviarPregunta(pregunta: string): Promise<string> {
    const response = await api.post<BotResponse>('/api/bot', { pregunta });
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al obtener respuesta del bot');
    }
    
    return response.data.respuesta;
  }
}

export default new BotService();
