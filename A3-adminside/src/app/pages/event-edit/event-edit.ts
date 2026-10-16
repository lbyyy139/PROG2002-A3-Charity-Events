import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CharityEvent } from '../../models';
import { EventForm } from '../../shared/event-form/event-form';
import { formatDate, toDatetimeLocal } from '../../formatters';

/**
 * Admin "Edit event" page: the same form as "New", pre-filled with the
 * stored event, plus the registrations recorded for that event.
 */
@Component({
  selector: 'app-event-edit',
  imports: [EventForm, RouterLink],
  templateUrl: './event-edit.html',
  styleUrl: './event-edit.css'
})
export class EventEdit implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly eventId = signal<number | null>(null);
  protected readonly model = signal<Partial<CharityEvent> | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly saving = signal(false);
  protected readonly error = signal('');

  protected readonly fmtDate = formatDate;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!/^\d+$/.test(id)) {
      this.loadError.set('Invalid event id.');
      this.loading.set(false);
      return;
    }

    this.api.getEvent(id).subscribe({
      next: (event) => {
        this.eventId.set(event.event_id);
        // datetime-local inputs need the YYYY-MM-DDTHH:MM value format.
        this.model.set({
          event_id: event.event_id,
          event_name: event.event_name,
          event_date: toDatetimeLocal(event.event_date),
          end_date: event.end_date ? toDatetimeLocal(event.end_date) : '',
          location: event.location,
          venue: event.venue,
          description: event.description,
          purpose: event.purpose,
          ticket_price: event.ticket_price,
          goal_amount: event.goal_amount,
          raised_amount: event.raised_amount,
          image_url: event.image_url,
          latitude: event.latitude,
          longitude: event.longitude,
          org_id: event.org_id,
          category_id: event.category_id,
          is_suspended: event.is_suspended,
          registrations: event.registrations
        });
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message || 'The event could not be loaded.');
        this.loading.set(false);
      }
    });
  }

  save(data: Partial<CharityEvent>): void {
    this.error.set('');

    const required: Array<keyof CharityEvent> =
      ['event_name', 'event_date', 'location', 'venue', 'description', 'purpose'];
    const missing = required.filter((f) => {
      const v = data[f];
      return v === undefined || v === null || String(v).trim() === '';
    });
    if (missing.length > 0) {
      this.error.set('Please fill in all the required fields: ' + missing.join(', '));
      return;
    }

    this.saving.set(true);
    this.api.updateEvent(this.eventId()!, data).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/']);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.saving.set(false);
      }
    });
  }
}
