import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CharityEvent } from '../../models';
import { EventCard } from '../../shared/event-card/event-card';

/**
 * Home page: static organisation info plus the current & upcoming events,
 * loaded live from GET /api/events.
 */
@Component({
  selector: 'app-home',
  imports: [EventCard, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  private readonly api = inject(ApiService);

  protected readonly events = signal<CharityEvent[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(
          'Sorry, the events could not be loaded. Please make sure the API server is running. (' +
          err.message + ')'
        );
        this.loading.set(false);
      }
    });
  }
}
