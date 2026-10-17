# PROG2002 Assessment 3 — Hearts United Charity Events

A complete dynamic website for the *Hearts United* charity: a public **client-side** site where
visitors browse events and register to attend, plus a staff-only **admin-side** site where staff
create, update and delete events. Both front-ends are Angular single-page applications that talk to
a RESTful Node/Express API backed by a MySQL database.

**Team:** Boyu Liu (24832407) · Xiang Hu

---

## 1. Technology stack

| Layer | Technology |
|---|---|
| Database | MySQL |
| API | Node.js + Express |
| Front-ends | **Angular 22** with **TypeScript** (two separate apps) |
| Styling | HTML + CSS |
| Third-party service | **Open-Meteo weather API** (forecast shown on the event detail page) |

> Note: this project uses modern **Angular (v22)**, *not* the legacy **AngularJS (1.x)** framework.

---

## 2. Repository layout

| Folder | Contents |
|---|---|
| `A3-api/` | Node/Express RESTful API and the MySQL SQL dump |
| `A3-clientside/` | Public Angular app — browse, search, view details, register |
| `A3-adminside/` | Staff Angular app — list, create, edit and delete events |
| `A3-Submission/` | The three submission zip files |
| `a3-screenshots/` | Screenshots used in the project report |
| `PROG2002 A3 Report.docx` | The project report |

---

## 3. Prerequisites

- Node.js 18 or newer (includes npm)
- MySQL 8 or newer, with a database client (MySQL Workbench, phpMyAdmin, or the `mysql` CLI)

---

## 4. Database setup

1. Create an empty database, e.g. `charityevents_db`.
2. Import the schema **and** the sample data:

   ```
   mysql -u <user> -p charityevents_db < A3-api/charityevents_db.sql
   ```

   The dump creates the tables `events`, `categories`, `organisations` and `registrations`.

3. Configure the API credentials. A template is provided — **copy it and fill in your own values**:

   ```
   cd A3-api
   copy db-config.example.js db-config.js
   ```

   Then edit `db-config.js` with your host, user, password and database name.

> `db-config.js` holds real credentials, so it is intentionally excluded from version control via
> `.gitignore`. **Never commit it.**

---

## 5. Running the API

```
cd A3-api
npm install
npm start
```

The server listens on **port 3000**. To confirm it is up, open
<http://localhost:3000/api/events> — you should receive a JSON array.

---

## 6. Running the front-ends

Open two terminals:

```
cd A3-clientside        # public site
npm install
npm start
```

```
cd A3-adminside         # staff-only site
npm install
npm start
```

Each command prints the local URL Angular is serving on (by default port 4200; Angular picks the
next free port automatically if 4200 is already taken).

The **API must be running** for the front-ends to display data — all three must be up at once.

The API base URL is set per app in `src/environments/environment.ts`. Change `apiUrl` there to point
at your deployed API (for example when the site is running on the SCU cPanel server).

---

## 7. API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/events` | All events for the public list page |
| GET | `/api/events/all` | Every event regardless of status, with a registration count (admin list) |
| GET | `/api/events/search` | Search/filter events |
| GET | `/api/events/:id` | One event including its registrations |
| POST | `/api/events` | Create a new event |
| PUT | `/api/events/:id` | Update an existing event |
| DELETE | `/api/events/:id` | Delete an event (blocked with HTTP 409 if registrations exist) |
| POST | `/api/events/:id/registrations` | Register a visitor for an event |
| GET | `/api/categories` | Categories for dropdowns |
| GET | `/api/organisations` | Organisations for dropdowns |

**Why DELETE can fail:** an event that still has registrations cannot be removed — the API answers
`409 Conflict` so that booking data is never silently destroyed. The admin site shows this message
to the user. This protects referential integrity at the application level.

---

## 8. Deployment (SCU cPanel)

1. Deploy `A3-api/` as a Node.js application and run `npm install` then `npm start` on the server.
2. Build each front-end with `npm run build`, which produces a `dist/` folder.
3. Upload the contents of `dist/<app>/browser/` into the public web directory.
4. Update `apiUrl` in each app's `environment.ts` to the deployed API URL **before** building.

Each team member deploys to their own cPanel account, as required by the assessment brief.

---

## 9. Weather API

The event detail page calls the **Open-Meteo** forecast service using the event's stored
`latitude` and `longitude`. It needs no API key. See `A3-clientside/src/app/services/weather.service.ts`.

---

## 10. Assessment deliverables

| Deliverable | File |
|---|---|
| Source code zips | `A3-Submission/24832407A3-{api,clientside,adminside}.zip` |
| Project report | `PROG2002 A3 Report.docx` |
| Demo video | recorded separately (see `a3-video-script.md`) |
| Peer evaluation form | completed individually and emailed to the tutor |
