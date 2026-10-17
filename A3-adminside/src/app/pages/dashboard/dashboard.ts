import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CharityEvent } from '../../models';
import { formatDate, formatMoney } from '../../formatters';

/** Available orderings for the events table. */
export type SortKey = 'date-desc' | 'date-asc' | 'name-asc' | 'registrations-desc';

/**
 * Admin dashboard: complete list of all events regardless of status
 * (Upcoming / Past / Suspended), with edit and delete actions.
 */
@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, FormsModule],
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

  /** Free-text search typed by the user (matches name, location, category, organisation). */
  protected readonly searchTerm = signal('');
  /** Current ordering of the table. */
  protected readonly sortKey = signal<SortKey>('date-desc');

  /**
   * The rows actually shown. Filtering and sorting happen entirely in memory,
   * so typing in the search box never triggers another HTTP request - the list
   * is only fetched once when the page loads.
   */
  protected readonly visibleEvents = computed<CharityEvent[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();

    const matching = term
      ? this.events().filter((e) =>
        e.event_name.toLowerCase().includes(term) ||
        e.location.toLowerCase().includes(term) ||
        e.category_name.toLowerCase().includes(term) ||
        (e.org_name ?? '').toLowerCase().includes(term))
      : this.events();

    const sorted = [...matching];
    switch (this.sortKey()) {
      case 'name-asc':
        sorted.sort((a, b) => a.event_name.localeCompare(b.event_name));
        break;
      case 'date-asc':
        sorted.sort((a, b) => this.timeOf(a) - this.timeOf(b));
        break;
      case 'registrations-desc':
        sorted.sort((a, b) => (b.registration_count ?? 0) - (a.registration_count ?? 0));
        break;
      default:
        sorted.sort((a, b) => this.timeOf(b) - this.timeOf(a));
        break;
    }
    return sorted;
  });

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

  /** Resets the search box and puts the order back to newest first. */
  clearFilters(): void {
    this.searchTerm.set('');
    this.sortKey.set('date-desc');
  }

  /** True when the user has narrowed the list in any way. */
  protected hasFilters(): boolean {
    return this.searchTerm().trim() !== '' || this.sortKey() !== 'date-desc';
  }

  /** Timestamp used for the date orderings. */
  private timeOf(event: CharityEvent): number {
    return new Date(event.event_date).getTime();
  }

  private showNotice(text: string, type: 'info' | 'error' | 'success'): void {
    this.notice.set(text);
    this.noticeType.set(type);
  }
}
