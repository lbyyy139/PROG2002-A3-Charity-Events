# PROG2002 Assessment 3 Charity Events

Hearts United is a charity events application with a public website, an event
administration website, and an Express REST API backed by MySQL.

Team: Boyu Liu (24832407) and Xiang Hu (24832203).
Shared repository: https://github.com/lbyyy139/PROG2002-A3-Charity-Events

## Source and documentation

| Path | Contents |
|---|---|
| A3-api/ | Express API, configuration template and SQL schema with seed data |
| A3-clientside/ | Angular public website source |
| A3-adminside/ | Angular administration website source |
| tests/a3-requirements.test.cjs | API and date-validation regression tests |
| docs/admin-side-architecture.md | Administration architecture |
| docs/test-plan.md | Manual integration test checklist |
| docs/release-notes-2026-10-18.md | Changes, validation and deployment notes |
| reports/24832203A3-report.docx | Xiang Hu's individual project report |
| PROG2002 A3 Report.docx | Boyu Liu's existing individual report |

The two students use the same repository and each deploys the complete system
to their own SCU cPanel account. GitHub is not a substitute for cPanel deployment.

## Requirements

- For frontend builds, use Node 22.22.3, or another version accepted by the locked
  Angular CLI (`^22.22.3 || ^24.15.0 || >=26.0.0`). Node 22.22.3 was used for validation.
- MySQL 8 or a compatible MySQL server, plus npm.
- Both frontends use modern Angular 22 and TypeScript, not AngularJS 1.x.
  Eligibility for the assessment's AngularJS bonus must be confirmed with the tutor.
- Authentication is outside the scope specified in the assessment brief.

## Database and API

For a fresh local database, import `A3-api/charityevents_db.sql`.
For cPanel, first select the empty database in phpMyAdmin and import
`A3-api/charityevents_db_cpanel.sql`. Each SQL file contains the complete schema
and seed data: 3 organisations, 5 categories, 11 events and 10 registrations.
The scripts drop and recreate application tables; do not import over data you need.

Copy `A3-api/db-config.example.js` to `A3-api/db-config.js` and enter your own
database settings. The real configuration is intentionally excluded from Git and
submission archives. Do not publish it.

```sh
cd A3-api
npm ci
npm start
```

The API uses `PORT` when supplied, otherwise 3000. Check
http://localhost:3000/api/events. Events use Brisbane local time; the database
connection and query session use UTC+10 consistently.

## Local frontend development

For local development, set `apiUrl: 'http://localhost:3000'` in each app's
`src/environments/environment.ts`. The committed empty value is intended for
same-origin cPanel hosting, where requests resolve to `/api/...`.

Run the public app in one terminal:

```sh
cd A3-clientside
npm ci
npm start -- --port 4200
```

Run the admin app in another:

```sh
cd A3-adminside
npm ci
npm start -- --port 4201
```

Visit http://localhost:4200 and http://localhost:4201 respectively.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/events | Upcoming, non-suspended events |
| GET | /api/events/all | Every event, with registration counts |
| GET | /api/events/search | Filter by date, location and categoryId |
| GET | /api/events/:id | Public event details and registrations |
| GET | /api/admin/events/:id | Admin details, including suspended events |
| POST | /api/events | Create an event |
| PUT | /api/events/:id | Update an event |
| DELETE | /api/events/:id | Delete an event only if it has no registrations |
| POST | /api/events/:id/registrations | Register once per email per event |
| GET | /api/categories | Categories for dropdowns |
| GET | /api/organisations | Organisations for dropdowns |

Registrations are ordered newest first. Duplicate registrations and deletion of
an event with registrations return HTTP 409. Invalid input returns HTTP 400.
The admin detail route is a data-selection route, not an authentication boundary.

## Production build and cPanel deployment

1. Set `apiUrl: ''` in both environment files when the API and frontends share
   the student's own domain. Do not copy another student's absolute API URL.
2. In `A3-clientside`, run `npm ci` and `npm run build`.
3. In `A3-adminside`, run `npm ci` and `npm run build -- --base-href /admin/`.
4. Upload the public build's `dist/A3-clientside/browser/` contents to
   `public_html/`; upload the admin build's `dist/A3-adminside/browser/` contents
   to `public_html/admin/`. Retain the server routing configuration.
5. Deploy the API to the Node application's directory, install dependencies,
   configure the student's own database credentials, use `server.js` as startup
   file, and restart the application. Keep the `/api` mapping managed by cPanel.
6. Verify the APIs return JSON and that refreshing `/admin/edit/11` loads the
   admin form. Source ZIP files are for assessment submission, not static upload.

See `a3-cpanel-full-guide.md` for the cPanel walkthrough. A Git push does not
automatically update either student's live website.

## Regression tests

Install the API and admin dependencies first, then run from the repository root:

```sh
node --test tests/a3-requirements.test.cjs
```

These tests exercise HTTP routes with a database test double and pure validation
and timezone helpers. They do not replace real MySQL write-operation testing.
Use `docs/test-plan.md` for the remaining manual integration checks.

## Assessment files

Each student submits their own three source archives, project documentation and
the shared GitHub link. Xiang Hu's prepared files use the `24832203A3-` prefix.
If the tutor uses a different institutional username convention, change only the
archive prefix before submission. Both complete SQL variants are in the API ZIP.

The demo video and confidential peer evaluation are prepared separately by each
student. They are not included in the generated submission folder.
