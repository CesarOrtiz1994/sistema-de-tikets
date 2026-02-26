export interface MensajeChat {
  tipo: 'user' | 'bot';
  texto: string;
}

export interface BotResponse {
  respuesta: string;
}
