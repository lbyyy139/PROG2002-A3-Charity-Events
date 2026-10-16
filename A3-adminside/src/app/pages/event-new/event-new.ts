import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CharityEvent } from '../../models';
import { EventForm } from '../../shared/event-form/event-form';

/** Admin "New event" page: form that calls POST /api/events. */
@Component({
  selector: 'app-event-new',
  imports: [EventForm, RouterLink],
  templateUrl: './event-new.html',
  styleUrl: './event-new.css'
})
export class EventNew {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly saving = signal(false);
  protected readonly error = signal('');

  /** Empty starting values for a new event. */
  protected model: Partial<CharityEvent> = {
    event_name: '',
    event_date: '',
    end_date: '',
    location: '',
    venue: '',
    description: '',
    purpose: '',
    ticket_price: 0,
    goal_amount: 0,
    raised_amount: 0,
    image_url: '',
    latitude: null,
    longitude: null,
    org_id: undefined,
    category_id: undefined,
    is_suspended: 0
  };

  /** Client-side validation, then POST to the API. */
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
    if (!data.org_id || !data.category_id) {
      this.error.set('Please choose an organisation and a category.');
      return;
    }

    this.saving.set(true);
    this.api.createEvent(data).subscribe({
      next: (res) => {
        this.saving.set(false);
        // Back to the list, which now shows the new event.
        this.router.navigate(['/'], { queryParams: { created: res.event_id } });
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.saving.set(false);
      }
    });
  }
}
