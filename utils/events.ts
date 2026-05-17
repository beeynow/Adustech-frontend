import type { EventAudience, EventCategory, EventFormat, EventRecord, EventTicket } from '../services/eventsApi';

export const EVENT_CATEGORY_OPTIONS: Array<{ label: string; value: EventCategory }> = [
  { label: 'Conference', value: 'conference' },
  { label: 'Workshop', value: 'workshop' },
  { label: 'Seminar', value: 'seminar' },
  { label: 'Orientation', value: 'orientation' },
  { label: 'Sports', value: 'sports' },
  { label: 'Career', value: 'career' },
  { label: 'Cultural', value: 'cultural' },
  { label: 'Social', value: 'social' },
  { label: 'Academic', value: 'academic' },
  { label: 'General', value: 'general' },
];

export const EVENT_AUDIENCE_OPTIONS: Array<{ label: string; value: EventAudience }> = [
  { label: 'Open to everyone', value: 'all' },
  { label: 'Students', value: 'students' },
  { label: 'Staff', value: 'staff' },
  { label: 'Freshers', value: 'freshers' },
  { label: 'Finalists', value: 'finalists' },
  { label: 'Faculty community', value: 'faculty' },
];

export const EVENT_FORMAT_OPTIONS: Array<{ label: string; value: EventFormat }> = [
  { label: 'In person', value: 'in-person' },
  { label: 'Virtual', value: 'virtual' },
  { label: 'Hybrid', value: 'hybrid' },
];

export const getEventCategoryLabel = (value?: string) => {
  return EVENT_CATEGORY_OPTIONS.find((option) => option.value === value)?.label || 'General';
};

export const getEventAudienceLabel = (value?: string) => {
  return EVENT_AUDIENCE_OPTIONS.find((option) => option.value === value)?.label || 'Open to everyone';
};

export const getEventFormatLabel = (value?: string) => {
  return EVENT_FORMAT_OPTIONS.find((option) => option.value === value)?.label || 'In person';
};

export const formatEventCurrency = (amountCents = 0, currency = 'NGN') => {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 2,
    }).format(amountCents / 100);
  } catch {
    return `${currency || 'NGN'} ${(amountCents / 100).toFixed(2)}`;
  }
};

export const formatEventDate = (value?: string) => {
  if (!value) {
    return 'Date pending';
  }

  const date = new Date(value);
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatEventDateTime = (value?: string) => {
  if (!value) {
    return 'Time pending';
  }

  return new Date(value).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatEventTimeRange = (startsAt?: string, endsAt?: string) => {
  if (!startsAt) {
    return 'Time pending';
  }

  const start = new Date(startsAt);
  if (!endsAt) {
    return start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  const end = new Date(endsAt);
  return `${start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
};

export const getEventCountdown = (startsAt?: string) => {
  if (!startsAt) {
    return 'Schedule coming soon';
  }

  const diff = new Date(startsAt).getTime() - Date.now();
  if (diff <= 0) {
    return 'Live or already started';
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `Starts in ${days} day${days === 1 ? '' : 's'}`;
  }

  if (hours > 0) {
    return `Starts in ${hours} hour${hours === 1 ? '' : 's'}`;
  }

  const minutes = Math.max(1, Math.floor(diff / (1000 * 60)));
  return `Starts in ${minutes} minute${minutes === 1 ? '' : 's'}`;
};

export const getEventAdmissionLabel = (event: Pick<EventRecord, 'isFree' | 'ticketPriceCents' | 'currency'>) => {
  return event.isFree ? 'Free entry' : formatEventCurrency(event.ticketPriceCents, event.currency);
};

const RETRYABLE_PAID_TICKET_STATUSES = new Set([
  'payment-failed',
  'payment-cancelled',
  'payment-expired',
]);

const SECURE_PAID_TICKET_STATUSES = new Set([
  'pending',
  'paid',
  'checked-in',
]);

export const isRetryablePaidTicketStatus = (status?: string | null) => {
  return Boolean(status && RETRYABLE_PAID_TICKET_STATUSES.has(status));
};

export const canAccessSecurePaidTicket = (ticket?: Pick<EventTicket, 'status'> | null) => {
  return Boolean(ticket?.status && SECURE_PAID_TICKET_STATUSES.has(ticket.status));
};

export const getEventSeatLabel = (event: Pick<EventRecord, 'capacity' | 'ticketsSold' | 'ticketsRemaining' | 'isSoldOut'>) => {
  if (event.isSoldOut) {
    return 'Sold out';
  }

  if (typeof event.capacity !== 'number') {
    return `${event.ticketsSold} booked`;
  }

  const remaining = typeof event.ticketsRemaining === 'number'
    ? event.ticketsRemaining
    : Math.max(event.capacity - event.ticketsSold, 0);

  return `${remaining} of ${event.capacity} left`;
};

export const getEventTicketStatusLabel = (ticket?: Pick<EventTicket, 'displayStatus' | 'status'> | null) => {
  if (!ticket) {
    return 'No ticket';
  }

  if (ticket.displayStatus) {
    return ticket.displayStatus;
  }

  switch (ticket.status) {
    case 'registered':
      return 'Reserved';
    case 'pending':
      return 'Payment pending';
    case 'paid':
      return 'Paid';
    case 'checked-in':
      return 'Expired after gate verification';
    case 'payment-failed':
      return 'Payment failed';
    case 'payment-cancelled':
      return 'Payment cancelled';
    case 'payment-expired':
      return 'Payment expired';
    default:
      return 'Pending';
  }
};

export const getEventTicketStatusTone = (ticket?: Pick<EventTicket, 'status'> | null) => {
  switch (ticket?.status) {
    case 'registered':
      return {
        accent: '#0F9D58',
        background: 'rgba(15, 157, 88, 0.12)',
      };
    case 'paid':
      return {
        accent: '#1976D2',
        background: 'rgba(25, 118, 210, 0.12)',
      };
    case 'checked-in':
      return {
        accent: '#7B5C00',
        background: 'rgba(245, 189, 2, 0.18)',
      };
    case 'pending':
      return {
        accent: '#8A4B00',
        background: 'rgba(255, 145, 0, 0.16)',
      };
    case 'payment-failed':
    case 'payment-cancelled':
    case 'payment-expired':
      return {
        accent: '#C62828',
        background: 'rgba(198, 40, 40, 0.12)',
      };
    default:
      return {
        accent: '#5F748A',
        background: 'rgba(95, 116, 138, 0.14)',
      };
  }
};

export const getEventTicketSupportText = (ticket?: EventTicket | null) => {
  if (!ticket) {
    return '';
  }

  if (ticket.status === 'pending') {
    return 'Complete payment to activate your QR entry pass.';
  }

  if (ticket.status === 'checked-in') {
    return 'This paid pass has already been verified at the event gate and is no longer usable.';
  }

  if (ticket.status === 'payment-expired') {
    return 'This checkout session expired. Start a fresh payment to reactivate the ticket.';
  }

  if (ticket.status === 'payment-cancelled') {
    return 'This payment was cancelled before completion.';
  }

  if (ticket.status === 'payment-failed') {
    return 'The previous payment attempt did not complete successfully.';
  }

  if (ticket.status === 'registered') {
    return 'Your reserved pass is ready to scan at the venue.';
  }

  if (ticket.status === 'paid') {
    return 'Your paid ticket is active and ready for verification.';
  }

  return '';
};
