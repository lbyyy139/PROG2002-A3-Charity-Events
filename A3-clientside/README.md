# Charity Events Public Website

PROG2002 A3. Team: Boyu Liu (24832407) and Xiang Hu (24832203).
Angular 22 and TypeScript source; Node 22.22.3 was used for builds.

## Run locally

Start the API on http://localhost:3000. Set `apiUrl` to that address in
`src/environments/environment.ts`, then run:

```sh
npm ci
npm start -- --port 4200
```

## Build for cPanel

Restore `apiUrl: ''` so the app uses its own domain's `/api` endpoints, then run:

```sh
npm run build
```

Upload the contents of `dist/A3-clientside/browser/` to
`public_html/`. Configure SPA fallback routing and
preserve the cPanel Node `/api` mapping. The ZIP contains source, not node_modules
or compiled deployment files.

## Features

The home, search and detail pages load event data through the API. The detail page
shows registrations newest first and the Open-Meteo event-day weather. The dedicated
registration page validates contact details and ticket count, submits through the API,
and displays confirmation with return navigation. Closed events cannot be registered.
Event display and weather-date selection use Brisbane / AEST time.
