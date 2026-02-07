export enum DeliverableStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Deliverable {
  id: string;
  ticketId: string;
  uploadedById: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: DeliverableStatus;
  rejectionReason?: string;
  reviewedById?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: {
    id: string;
    name: string;
    email: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DeliverableRejectResult {
  deliverable: Deliverable;
  ticket: any;
  followUpTicket?: {
    id: string;
    ticketNumber: string;
    title: string;
  };
  exceededLimit: boolean;
  rejectionCount: number;
  maxRejections: number;
}
