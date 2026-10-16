import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CharityEvent } from '../../models';
import { formatDate, formatMoney } from '../../formatters';

/**
 * Admin dashboard: complete list of all events regardless of status
 * (Upcoming / Past / Suspended), with edit and delete actions.
 */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly events = signal<CharityEvent[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly notice = signal('');
  protected readonly noticeType = signal<'info' | 'error' | 'success'>('info');
  /** id of the event pending a second-click confirmation for deletion. */
  protected readonly confirmId = signal<number | null>(null);

  protected readonly fmtDate = formatDate;
  protected readonly fmtMoney = formatMoney;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getAllEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'Could not load the events. Is the API server running?');
        this.loading.set(false);
      }
    });
  }

  /** Derives the display status of an event from its data. */
  statusOf(event: CharityEvent): 'Upcoming' | 'Past' | 'Suspended' {
    if (event.is_suspended) return 'Suspended';
    return new Date(event.event_date) >= new Date() ? 'Upcoming' : 'Past';
  }

  /** First click arms the confirmation, second click really deletes. */
  deleteRequest(event: CharityEvent): void {
    if (this.confirmId() !== event.event_id) {
      this.confirmId.set(event.event_id);
      return;
    }
    this.confirmId.set(null);
    this.api.deleteEvent(event.event_id).subscribe({
      next: (res) => {
        this.showNotice(res.message || 'Event deleted.', 'success');
        this.load();
      },
      error: (err: Error) => {
        // The API answers 409 when the event still has registrations.
        this.showNotice(err.message, 'error');
      }
    });
  }

  cancelDelete(): void {
    this.confirmId.set(null);
  }

  private showNotice(text: string, type: 'info' | 'error' | 'success'): void {
    this.notice.set(text);
    this.noticeType.set(type);
  }
}
