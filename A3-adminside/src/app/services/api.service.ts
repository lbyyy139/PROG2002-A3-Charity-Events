import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category, CharityEvent, Organisation } from '../models';

/**
 * Central service that talks to the RESTful API (admin-side website).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly base = environment.apiUrl;

    constructor(private http: HttpClient) {}

    /** GET /api/events/all - every event regardless of status. */
    getAllEvents(): Observable<CharityEvent[]> {
        return this.http.get<CharityEvent[]>(`${this.base}/api/events/all`)
            .pipe(catchError(this.handleError));
    }

    /** GET /api/events/:id - one event including its registrations. */
    getEvent(id: number | string): Observable<CharityEvent> {
        return this.http.get<CharityEvent>(`${this.base}/api/events/${encodeURIComponent(String(id))}`)
            .pipe(catchError(this.handleError));
    }

    /** POST /api/events - insert a new event. */
    createEvent(data: Partial<CharityEvent>): Observable<{ message: string; event_id: number }> {
        return this.http.post<{ message: string; event_id: number }>(`${this.base}/api/events`, data)
            .pipe(catchError(this.handleError));
    }

    /** PUT /api/events/:id - update an existing event. */
    updateEvent(id: number | string, data: Partial<CharityEvent>): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.base}/api/events/${encodeURIComponent(String(id))}`, data)
            .pipe(catchError(this.handleError));
    }

    /** DELETE /api/events/:id - blocked with 409 when registrations exist. */
    deleteEvent(id: number | string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.base}/api/events/${encodeURIComponent(String(id))}`)
            .pipe(catchError(this.handleError));
    }

    /** GET /api/categories - for the category dropdown. */
    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.base}/api/categories`)
            .pipe(catchError(this.handleError));
    }

    /** GET /api/organisations - for the organisation dropdown. */
    getOrganisations(): Observable<Organisation[]> {
        return this.http.get<Organisation[]>(`${this.base}/api/organisations`)
            .pipe(catchError(this.handleError));
    }

    /** Converts an API error response into a readable Error. */
    private handleError(err: HttpErrorResponse) {
        const message = err?.error?.error || `Request failed (${err.status})`;
        return throwError(() => new Error(message));
    }
}
