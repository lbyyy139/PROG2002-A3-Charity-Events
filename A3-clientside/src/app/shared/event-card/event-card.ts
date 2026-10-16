import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharityEvent } from '../../models';
import { formatDate, formatMoney, raisedPercent } from '../../formatters';

/**
 * One event summary card, used by the Home and Search pages.
 * The card links to the event details page with the event id in the URL.
 */
@Component({
  selector: 'app-event-card',
  imports: [RouterLink],
  templateUrl: './event-card.html',
  styleUrl: './event-card.css'
})
export class EventCard {
  readonly event = input.required<CharityEvent>();

  readonly progress = computed(() =>
    raisedPercent(this.event().raised_amount, this.event().goal_amount));

  protected readonly fmtDate = formatDate;
  protected readonly fmtMoney = formatMoney;
}
