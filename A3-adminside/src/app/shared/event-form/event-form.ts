import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Category, CharityEvent, Organisation } from '../../models';

/**
 * Shared event form used by both the "New event" and "Edit event" pages.
 * The parent page fills [model] and handles the (save) output.
 */
@Component({
  selector: 'app-event-form',
  imports: [FormsModule],
  templateUrl: './event-form.html',
  styleUrl: './event-form.css'
})
export class EventForm implements OnInit {
  private readonly api = inject(ApiService);

  /** The event being created/edited (empty fields for "new"). */
  readonly model = input.required<Partial<CharityEvent>>();
  /** True on the edit page (shows a different heading/saving text). */
  readonly isEdit = input(false);
  readonly saving = input(false);
  readonly error = input('');

  /** Emitted with the form values when the user presses Save. */
  readonly save = output<Partial<CharityEvent>>();

  protected readonly categories = signal<Category[]>([]);
  protected readonly organisations = signal<Organisation[]>([]);

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (list) => this.categories.set(list),
      error: () => {} // the dropdown simply stays empty if the API is down
    });
    this.api.getOrganisations().subscribe({
      next: (list) => this.organisations.set(list),
      error: () => {}
    });
  }

  submit(): void {
    this.save.emit({
      event_name: this.model().event_name,
      event_date: this.model().event_date,
      end_date: this.model().end_date || '',
      location: this.model().location,
      venue: this.model().venue,
      description: this.model().description,
      purpose: this.model().purpose,
      ticket_price: this.model().ticket_price,
      goal_amount: this.model().goal_amount,
      raised_amount: this.model().raised_amount,
      image_url: this.model().image_url,
      latitude: this.model().latitude,
      longitude: this.model().longitude,
      org_id: this.model().org_id,
      category_id: this.model().category_id,
      is_suspended: this.model().is_suspended ? 1 : 0
    });
  }
}
