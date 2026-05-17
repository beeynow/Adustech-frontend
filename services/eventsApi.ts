import api from './api';

export type EventCategory =
  | 'conference'
  | 'workshop'
  | 'seminar'
  | 'orientation'
  | 'sports'
  | 'career'
  | 'cultural'
  | 'social'
  | 'academic'
  | 'general';

export type EventAudience =
  | 'all'
  | 'students'
  | 'staff'
  | 'freshers'
  | 'finalists'
  | 'faculty';

export type EventFormat = 'in-person' | 'virtual' | 'hybrid';

export interface EventTicketPayment {
  txRef: string;
  provider?: string;
  status: string;
  flutterwaveTransactionId: string;
  paystackTransactionId?: string;
  gatewayTransactionId?: string;
  checkoutUrl: string;
  paidAt: string | null;
  expiresAt: string | null;
  paymentMethod: string;
  failureReason: string;
  gatewayResponse: string;
  paystackSignal?: string;
  paystackVerifiedAt?: string | null;
  paystackWebhookReceivedAt?: string | null;
  isExpired: boolean;
}

export interface EventTicketVerification {
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedByUserId: string;
  verifiedByName: string;
  verifiedByEmail: string;
  method: string;
  notes: string;
}

export interface EventTicket {
  id: string;
  ticketId: string;
  quantity: number;
  amountCents: number;
  currency: string;
  status: string;
  displayStatus: string;
  ticketCode: string;
  isEntryReady: boolean;
  qrPayload: string;
  payment: EventTicketPayment | null;
  verification: EventTicketVerification;
  createdAt: string;
  updatedAt: string;
}

export interface EventCreator {
  id: string;
  name: string;
  email: string;
}

export interface EventRecord {
  id: string;
  title: string;
  summary: string;
  details: string;
  category: EventCategory;
  audience: EventAudience;
  format: EventFormat;
  location: string;
  streamUrl: string;
  timezone: string;
  startsAt: string;
  endsAt: string;
  registrationClosesAt?: string | null;
  imageUrl: string;
  imageBase64?: string;
  pdfUrl?: string;
  organizerName: string;
  contactEmail: string;
  contactPhone: string;
  ticketInstructions: string;
  isFree: boolean;
  ticketPriceCents: number;
  currency: string;
  capacity?: number | null;
  ticketsSold: number;
  ticketsRemaining?: number | null;
  maxTicketsPerUser: number;
  isFeatured: boolean;
  status: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  User: EventCreator;
  viewerTicket?: EventTicket | null;
  isSoldOut?: boolean;
}

export interface EventPaymentConfig {
  webhookUrl: string;
}

export interface CreateEventPayload {
  title: string;
  summary?: string;
  details?: string;
  category?: EventCategory;
  audience?: EventAudience;
  format?: EventFormat;
  location?: string;
  streamUrl?: string;
  startsAt: string;
  endsAt: string;
  registrationClosesAt?: string;
  imageBase64?: string;
  organizerName?: string;
  contactEmail?: string;
  contactPhone?: string;
  ticketInstructions?: string;
  isFree?: boolean;
  ticketPriceCents?: number;
  currency?: string;
  capacity?: number | null;
  maxTicketsPerUser?: number;
  isFeatured?: boolean;
  timezone?: string;
}

export interface PurchaseEventTicketPayload {
  quantity?: number;
  redirectUrl?: string;
}

export interface PurchaseEventTicketResponse {
  message: string;
  event: EventRecord;
  ticket: EventTicket;
  requiresPayment: boolean;
  checkoutUrl?: string;
  txRef?: string;
}

export interface ConfirmPaystackPaymentPayload {
  reference?: string;
  transactionId?: string;
  txRef?: string;
  status?: string;
}

export interface ConfirmPaystackPaymentResponse {
  message: string;
  event: EventRecord;
  ticket: EventTicket;
  requiresPayment: boolean;
}

export interface VerifyEventTicketPayload {
  ticketCode?: string;
  qrPayload?: string;
  method?: 'scanner' | 'manual';
}

export interface VerifyEventTicketResponse {
  message: string;
  alreadyVerified: boolean;
  ticket: EventTicket;
  holder: EventCreator;
  event?: EventRecord;
}

export const eventsAPI = {
  list: async (): Promise<{ events: EventRecord[] }> => {
    const res = await api.get('/events');
    return res.data;
  },
  create: async (payload: CreateEventPayload): Promise<{ message: string; event: EventRecord }> => {
    const res = await api.post('/events', payload);
    return res.data;
  },
  get: async (id: string): Promise<{ event: EventRecord; paymentConfig?: EventPaymentConfig }> => {
    const res = await api.get(`/events/${id}`);
    return res.data;
  },
  purchase: async (id: string, payload: PurchaseEventTicketPayload): Promise<PurchaseEventTicketResponse> => {
    const res = await api.post(`/events/${id}/purchase`, payload);
    return res.data;
  },
  confirmPaystackPayment: async (payload: ConfirmPaystackPaymentPayload): Promise<ConfirmPaystackPaymentResponse> => {
    const res = await api.post('/events/payments/paystack/confirm', payload);
    return res.data;
  },
  verifyTicket: async (payload: VerifyEventTicketPayload): Promise<VerifyEventTicketResponse> => {
    const res = await api.post('/events/tickets/verify', payload);
    return res.data;
  },
};
