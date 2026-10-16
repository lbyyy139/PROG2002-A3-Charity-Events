# Hearts United Foundation - Charity Events Website (A3 client-side)

PROG2002 Assignment 3 - client-side website built with **Angular 22 + TypeScript**.
Group project - Boyu Liu (24832407).

## Pages
- `/` - Home: organisation info + current & upcoming events (`GET /api/events`)
- `/search` - Search: filter by date / location / category (`GET /api/events/search`, `/api/categories`)
- `/event/:id` - Details: full info, goal progress, **registrations list (latest first)**,
  **weather forecast for the event day** (Open-Meteo external API), Register button
- `/event/:id/register` - **New registration page**: form + validation + confirmation
  (`POST /api/events/:id/registrations`)

## How to run
1. Start the API first (see `A3-api/README.md`) at http://localhost:3000.
2. `npm install`
3. `npm start` - the site runs at http://localhost:4200

The API address is configured in `src/environments/environment.ts`.
