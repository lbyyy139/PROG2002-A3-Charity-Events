/**
 * Shared TypeScript interfaces for the charity events website (PROG2002 A3).
 */
export interface Registration {
    registration_id: number;
    full_name: string;
    email: string;
    phone: string;
    ticket_count: number;
    registration_date: string;
}

export interface CharityEvent {
    event_id: number;
    event_name: string;
    event_date: string;
    end_date: string | null;
    location: string;
    venue: string;
    description: string;
    purpose: string;
    ticket_price: number;
    goal_amount: number;
    raised_amount: number;
    image_url: string | null;
    latitude: number | null;
    longitude: number | null;
    is_suspended: number;
    org_id: number;
    org_name: string;
    category_id: number;
    category_name: string;
    registrations?: Registration[];
}

export interface Category {
    category_id: number;
    category_name: string;
    description: string | null;
}

/** Payload sent to POST /api/events/:id/registrations. */
export interface RegistrationPayload {
    full_name: string;
    email: string;
    phone: string;
    ticket_count: number;
}
