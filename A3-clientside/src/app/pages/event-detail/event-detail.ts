import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { WeatherService } from '../../services/weather.service';
import { CharityEvent } from '../../models';
import { formatDate, formatMoney, raisedPercent } from '../../formatters';

/** One day of the Open-Meteo forecast, prepared for display. */
interface WeatherDay {
  description: string;
  icon: string;
  max: number;
  min: number;
}

/**
 * Event details page (A3): shows the full event information, the fundraising
 * progress, the weather forecast for the event day (Open-Meteo API) and the
 * complete list of registrations sorted by the latest purchase first.
 */
@Component({
  selector: 'app-event-detail',
  imports: [RouterLink],
  templateUrl: './event-detail.html',
  styleUrl: './event-detail.css'
})
export class EventDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly weatherApi = inject(WeatherService);

  protected readonly event = signal<CharityEvent | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  protected readonly weather = signal<WeatherDay | null>(null);
  protected readonly weatherNote = signal('');

  protected readonly progress = computed(() => {
    const e = this.event();
    return e ? raisedPercent(e.raised_amount, e.goal_amount) : 0;
  });

  protected readonly totalTickets = computed(() => {
    const regs = this.event()?.registrations ?? [];
    return regs.reduce((sum, r) => sum + r.ticket_count, 0);
  });

  protected readonly fmtDate = formatDate;
  protected readonly fmtMoney = formatMoney;

  /** True when the event is free entry (ticket price 0). */
  protected isFree(price: number): boolean {
    return Number(price) === 0;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';

    if (!id || !/^\d+$/.test(id)) {
      this.error.set('No valid event was selected. Please choose an event from the Home or Search page.');
      this.loading.set(false);
      return;
    }

    this.api.getEvent(id).subscribe({
      next: (event) => {
        this.event.set(event);
        this.loading.set(false);
        this.loadWeather(event);
      },
      error: (err: Error) => {
        this.error.set(err.message || 'The event could not be loaded.');
        this.loading.set(false);
      }
    });
  }

  /** Optional A3 feature: weather forecast for the event day via Open-Meteo. */
  private loadWeather(event: CharityEvent): void {
    if (event.latitude === null || event.longitude === null) {
      this.weatherNote.set('Weather is not available for this event location.');
      return;
    }

    this.weatherApi.getForecast(event.latitude, event.longitude).subscribe({
      next: (forecast) => {
        const day = event.event_date.slice(0, 10);
        const index = forecast.daily.time.indexOf(day);
        if (index === -1) {
          this.weatherNote.set('The forecast for this date is not available yet (Open-Meteo provides 16 days).');
          return;
        }
        this.weather.set({
          description: this.weatherApi.describeCode(forecast.daily.weather_code[index]),
          icon: this.weatherApi.iconForCode(forecast.daily.weather_code[index]),
          max: Math.round(forecast.daily.temperature_2m_max[index]),
          min: Math.round(forecast.daily.temperature_2m_min[index])
        });
      },
      error: () => this.weatherNote.set('Weather forecast could not be loaded right now.')
    });
  }
}
