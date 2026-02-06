export enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  ERROR = 'error'
}

export interface TemporaryMessage {
  tempId: string;
  ticketId: string;
  userId: string;
  message: string;
  attachment?: {
    url: string;
    name: string;
    type: string;
    size: number;
  };
  status: MessageStatus;
  error?: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string | null;
  };
}
