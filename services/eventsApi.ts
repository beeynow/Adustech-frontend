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

export interface EventTicket {
  id: string;
  quantity: number;
  amountCents: number;
  currency: string;
  status: string;
  ticketCode: string;
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

export const eventsAPI = {
  list: async (): Promise<{ events: EventRecord[] }> => {
    const res = await api.get('/events');
    return res.data;
  },
  create: async (payload: CreateEventPayload): Promise<{ message: string; event: EventRecord }> => {
    const res = await api.post('/events', payload);
    return res.data;
  },
  get: async (id: string): Promise<{ event: EventRecord }> => {
    const res = await api.get(`/events/${id}`);
    return res.data;
  },
  purchase: async (id: string, payload: { quantity?: number }): Promise<{ message: string; event: EventRecord; ticket: EventTicket }> => {
    const res = await api.post(`/events/${id}/purchase`, payload);
    return res.data;
  },
};
