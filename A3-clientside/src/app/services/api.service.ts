import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category, CharityEvent, RegistrationPayload } from '../models';

/**
 * Central service that talks to the RESTful API.
 * Every page uses this service instead of calling fetch() directly.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly base = environment.apiUrl;

    constructor(private http: HttpClient) {}

    /** GET /api/events - current & upcoming events (home page). */
    getEvents(): Observable<CharityEvent[]> {
        return this.http.get<CharityEvent[]>(`${this.base}/api/events`)
            .pipe(catchError(this.handleError));
    }

    /** GET /api/events/all - every event regardless of status (admin list). */
    getAllEvents(): Observable<CharityEvent[]> {
        return this.http.get<CharityEvent[]>(`${this.base}/api/events/all`)
            .pipe(catchError(this.handleError));
    }

    /** GET /api/events/search?date=&location=&categoryId= */
    searchEvents(date: string, location: string, categoryId: string): Observable<CharityEvent[]> {
        const params: Record<string, string> = {};
        if (date) params['date'] = date;
        if (location) params['location'] = location;
        if (categoryId) params['categoryId'] = categoryId;
        return this.http.get<CharityEvent[]>(`${this.base}/api/events/search`, { params })
            .pipe(catchError(this.handleError));
    }

    /** GET /api/events/:id - one event including its registrations list. */
    getEvent(id: number | string): Observable<CharityEvent> {
        return this.http.get<CharityEvent>(`${this.base}/api/events/${encodeURIComponent(String(id))}`)
            .pipe(catchError(this.handleError));
    }

    /** POST /api/events - create a new event (admin). */
    createEvent(data: Partial<CharityEvent>): Observable<{ message: string; event_id: number }> {
        return this.http.post<{ message: string; event_id: number }>(`${this.base}/api/events`, data)
            .pipe(catchError(this.handleError));
    }

    /** PUT /api/events/:id - update an existing event (admin). */
    updateEvent(id: number | string, data: Partial<CharityEvent>): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.base}/api/events/${encodeURIComponent(String(id))}`, data)
            .pipe(catchError(this.handleError));
    }

    /** DELETE /api/events/:id - delete an event (blocked when registrations exist). */
    deleteEvent(id: number | string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.base}/api/events/${encodeURIComponent(String(id))}`)
            .pipe(catchError(this.handleError));
    }

    /** POST /api/events/:id/registrations - register a user for an event. */
    registerForEvent(id: number | string, payload: RegistrationPayload): Observable<{ message: string; registration_id: number }> {
        return this.http.post<{ message: string; registration_id: number }>(
            `${this.base}/api/events/${encodeURIComponent(String(id))}/registrations`, payload)
            .pipe(catchError(this.handleError));
    }

    /** GET /api/categories - category list for dropdowns. */
    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.base}/api/categories`)
            .pipe(catchError(this.handleError));
    }

    /** Converts an API error response into a readable Error. */
    private handleError(err: HttpErrorResponse) {
        const message = err?.error?.error || `Request failed (${err.status})`;
        return throwError(() => new Error(message));
    }
}
