# Charity Events Administration Website

PROG2002 A3. Team: Boyu Liu (24832407) and Xiang Hu (24832203).
Angular 22 and TypeScript source; Node 22.22.3 was used for builds.

## Run locally

Start the API on http://localhost:3000. Set `apiUrl` to that address in
`src/environments/environment.ts`, then run:

```sh
npm ci
npm start -- --port 4201
```

## Build for cPanel

Restore `apiUrl: ''` so the app uses its own domain's `/api` endpoints, then run:

```sh
npm run build -- --base-href /admin/
```

Upload the contents of `dist/A3-adminside/browser/` to
`public_html/admin/`. Configure SPA fallback routing and
preserve the cPanel Node `/api` mapping. The ZIP contains source, not node_modules
or compiled deployment files.

## Features

The dashboard lists all statuses, supports search and sorting, and provides create,
edit and delete actions. The edit page uses GET /api/admin/events/:id so suspended
events remain editable. Both forms validate before submission. Existing registrations
are shown on the edit page; the API blocks deletion when registrations exist.
All event dates are displayed and edited in Brisbane / AEST time.
Authentication is not required by the assessment brief.
