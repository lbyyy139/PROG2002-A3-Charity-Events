# Hearts United Admin Console (A3 admin-side website)

PROG2002 Assignment 3 - admin-side website built with **Angular 22 + TypeScript**.
Group project - Boyu Liu (24832407). Authentication is not required (per the brief).

## Features
- **List**: every event regardless of status (Upcoming / Past / Suspended) with
  registration counts (`GET /api/events/all`)
- **New**: form that creates an event (`POST /api/events`), with validation
- **Edit**: form pre-filled from `GET /api/events/:id`, showing the registrations
  recorded for the event; saves via `PUT /api/events/:id`
- **Delete**: two-click confirmation; the API blocks deletion with HTTP 409 when
  registrations exist and the reason is shown to the staff member

## How to run
1. Start the API first (see `A3-api/README.md`) at http://localhost:3000.
2. `npm install`
3. `npm start` - the admin site runs at http://localhost:4201
   (`ng serve --port 4201`)

The API address is configured in `src/environments/environment.ts`.
