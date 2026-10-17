# A3 Team Contributions — Charity Events

**Unit:** PROG2002 Web Development 2
**Repository:** https://github.com/lbyyy139/PROG2002-A3-Charity-Events

## Team Members

| Name | Student ID | GitHub |
|---|---|---|
| Boyu Liu | 24832407 | `lbyyy139` |
| Xiang Hu | — | `xiang-123-art` |

The work is split **50 / 50**. Each member owns a full vertical slice of the
application: they designed, coded, documented and are able to explain their own
modules end to end. Both members deploy the complete system (database, API and
both front ends) to their **own** SCU cPanel account, as required by the brief.

## Boyu Liu — Data layer & public website

**Database (`A3-api/charityevents_db.sql`)**

- Schema for the four tables: `organisations`, `categories`, `events`, `registrations`
- Foreign keys and data types for each relationship

**API (`A3-api/server.js`, `A3-api/event_db.js`)**

- Express server and all REST routes under `/api`
- MySQL connection pool shared by every route
- Parameterised queries (`?` placeholders) to prevent SQL injection
- Business rules, e.g. blocking the deletion of an event that still has registrations

**Client-side Angular app (`A3-clientside/`)**

- `home` — upcoming events list
- `search` — filter by date, location and category
- `event-detail` — single event page, including the Open-Meteo weather forecast
- `register` — volunteer registration form
- `shared/event-card` — reusable event summary card
- `services/api.service.ts`, `services/weather.service.ts`

## Xiang Hu — Administration back end & quality assurance

**Admin-side Angular app (`A3-adminside/`)**

- `dashboard` — full list of every event with its registration count, plus
  edit and delete actions (two-click delete confirmation)
- `event-new` — create an event
- `event-edit` — update an existing event
- `shared/event-form` — template-driven form (`[(ngModel)]`) shared by create and
  edit, with client-side validation and server-side error handling
- `services/api.service.ts`, `models.ts`, `formatters.ts`

**Testing and quality assurance**

- Manual testing of every route on the deployed cPanel site
- Verifying that error states are reported clearly in the user interface
  (API unreachable, validation failures, blocked deletions)

**Deployment**

- Database creation and SQL import on cPanel
- Node.js application registration and `npm install`
- Building and publishing both Angular front ends, including the `.htaccess`
  rules needed for client-side routing

## Shared artefacts

- GitHub repository: both members commit their own work to the same repository
- Written report submitted by each member with their own student details
- Demonstration video recorded individually by each member, covering the
  architecture of the whole system and focusing on their own modules
- Peer evaluation submitted individually and confidentially to the tutor
