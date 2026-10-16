import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Category, CharityEvent } from '../../models';
import { EventCard } from '../../shared/event-card/event-card';

/**
 * Search page: filter active events by date, location and category.
 * The category dropdown is populated dynamically from GET /api/categories.
 */
@Component({
  selector: 'app-search',
  imports: [FormsModule, EventCard],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class Search implements OnInit {
  private readonly api = inject(ApiService);

  // Form fields (template-driven with ngModel)
  protected readonly date = signal('');
  protected readonly location = signal('');
  protected readonly categoryId = signal('');

  protected readonly categories = signal<Category[]>([]);
  protected readonly results = signal<CharityEvent[]>([]);
  protected readonly searching = signal(false);
  protected readonly message = signal('');
  protected readonly messageType = signal<'info' | 'error' | 'success'>('info');
  protected readonly hasSearched = signal(false);

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err: Error) =>
        this.showMessage('Could not load categories. Is the API server running?', 'error')
    });
  }

  /** Runs when the form is submitted. */
  submit(): void {
    this.clearMessage();
    this.results.set([]);
    this.hasSearched.set(false);

    const date = this.date();
    const location = this.location().trim();
    const categoryId = this.categoryId();

    // Client-side validation: at least one criterion must be selected.
    if (!date && !location && !categoryId) {
      this.showMessage('Please choose at least one search criterion (date, location or category).', 'error');
      return;
    }

    // Client-side validation: only current & upcoming events are shown,
    // so the date cannot be in the past.
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const picked = new Date(date + 'T00:00:00');
      if (picked < today) {
        this.showMessage('The search date cannot be in the past. Please choose today or a later date.', 'error');
        return;
      }
    }

    this.showMessage('Searching events...', 'info');
    this.searching.set(true);

    this.api.searchEvents(date, location, categoryId).subscribe({
      next: (events) => {
        this.searching.set(false);
        this.clearMessage();
        this.hasSearched.set(true);
        this.results.set(events);
        if (events.length === 0) {
          this.showMessage('No events match your search criteria. Try changing or clearing the filters.', 'info');
        }
      },
      error: (err: Error) => {
        this.searching.set(false);
        this.showMessage(err.message || 'The search failed. Please try again later.', 'error');
      }
    });
  }

  /** Resets every field and removes the previous results (DOM manipulation). */
  clearFilters(): void {
    this.date.set('');
    this.location.set('');
    this.categoryId.set('');
    this.results.set([]);
    this.hasSearched.set(false);
    this.clearMessage();
  }

  protected showMessage(text: string, type: 'info' | 'error' | 'success'): void {
    this.message.set(text);
    this.messageType.set(type);
  }

  protected clearMessage(): void {
    this.message.set('');
  }
}
