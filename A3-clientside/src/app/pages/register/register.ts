import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CharityEvent } from '../../models';
import { formatDate, formatMoney } from '../../formatters';

/**
 * Registration page (A3 new page): the user registers for a selected event.
 * The event id arrives via the URL (/event/:id/register). The form collects
 * the user details and the number of tickets, validates the input and calls
 * POST /api/events/:id/registrations.
 */
@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);

  protected readonly event = signal<CharityEvent | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal('');
  protected readonly submitting = signal(false);
  protected readonly submitError = signal('');
  protected readonly success = signal<{ name: string; tickets: number } | null>(null);

  // Form fields (template-driven with ngModel)
  protected fullName = '';
  protected email = '';
  protected phone = '';
  protected ticketCount = 1;

  protected readonly fmtDate = formatDate;
  protected readonly fmtMoney = formatMoney;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    if (!id || !/^\d+$/.test(id)) {
      this.loadError.set('No valid event was selected. Please choose an event from the Home or Search page.');
      this.loading.set(false);
      return;
    }

    this.api.getEvent(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message || 'The event could not be loaded.');
        this.loading.set(false);
      }
    });
  }

  /** Validates the form and submits the registration to the API. */
  submit(): void {
    this.submitError.set('');

    // Client-side validation (the API validates again - never trust the client).
    if (this.fullName.trim() === '') {
      this.submitError.set('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.submitError.set('Please enter a valid email address.');
      return;
    }
    if (this.phone.trim() === '') {
      this.submitError.set('Please enter your contact phone number.');
      return;
    }
    const tickets = Number(this.ticketCount);
    if (!Number.isInteger(tickets) || tickets < 1 || tickets > 20) {
      this.submitError.set('The number of tickets must be a whole number between 1 and 20.');
      return;
    }

    this.submitting.set(true);

    this.api.registerForEvent(this.event()!.event_id, {
      full_name: this.fullName.trim(),
      email: this.email.trim(),
      phone: this.phone.trim(),
      ticket_count: tickets
    }).subscribe({
      next: () => {
        this.success.set({ name: this.fullName.trim(), tickets });
        this.submitting.set(false);
      },
      error: (err: Error) => {
        this.submitError.set(err.message || 'The registration failed. Please try again later.');
        this.submitting.set(false);
      }
    });
  }
}
