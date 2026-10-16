import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Daily forecast for one location, from the free Open-Meteo API. */
export interface WeatherForecast {
    daily: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
    };
}

/**
 * Weather service using the external Open-Meteo API (optional A3 feature).
 * https://api.open-meteo.com - free, no registration required.
 */
@Injectable({ providedIn: 'root' })
export class WeatherService {
    constructor(private http: HttpClient) {}

    /** Fetches the daily forecast for the event location. */
    getForecast(latitude: number, longitude: number): Observable<WeatherForecast> {
        const params = {
            latitude: String(latitude),
            longitude: String(longitude),
            daily: 'weather_code,temperature_2m_max,temperature_2m_min',
            timezone: 'Australia/Brisbane'
        };
        return this.http.get<WeatherForecast>('https://api.open-meteo.com/v1/forecast', { params });
    }

    /** Translates an Open-Meteo weather code into a readable description. */
    describeCode(code: number): string {
        const descriptions: Record<number, string> = {
            0: 'Clear sky',
            1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
            45: 'Fog', 48: 'Depositing rime fog',
            51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
            61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
            80: 'Light rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
            95: 'Thunderstorm'
        };
        return descriptions[code] || 'Unknown conditions';
    }

    /** An emoji icon for each weather code, for a friendlier display. */
    iconForCode(code: number): string {
        if (code === 0) return '☀️';
        if (code <= 3) return '🌤️';
        if (code <= 48) return '🌫️';
        if (code <= 55) return '🌦️';
        if (code <= 65 || (code >= 80 && code <= 82)) return '🌧️';
        if (code === 95) return '⛈️';
        return '🌡️';
    }
}
