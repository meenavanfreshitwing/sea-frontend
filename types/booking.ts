// Delivery booking calendar (see backend /api/booking/availability)

export type DateUnavailableReason =
  | 'past'
  | 'same_day'
  | 'beyond_window'
  | 'booking_closed'
  | 'blocked'
  | 'cutoff_passed'
  | 'no_slots';

export interface DeliverySlot {
  slotId: string;
  label: string;
  startTime: string;
  endTime: string;
  available?: boolean;
}

export interface BookingDate {
  date: string; // 'YYYY-MM-DD' (India time)
  available: boolean;
  reason: DateUnavailableReason | null;
  message: string;
  cutoffDate: string;
  cutoffTime: string; // 'HH:mm'
  slots: DeliverySlot[];
}

export interface BookingNotice {
  date: string;
  title: string;
  message: string;
  reason: string;
  isBlocked: boolean;
  updatedAt: string;
}

export interface BookingAvailability {
  today: string;
  serverTime: string;
  timezone: string;
  earliestDate: string | null;
  config: {
    bookingEnabled: boolean;
    cutoffTime: string;
    maxAdvanceDays: number;
    closedMessage: string;
    timeSlotsEnabled: boolean;
    slots: DeliverySlot[];
  };
  dates: BookingDate[];
  notices: BookingNotice[];
}
