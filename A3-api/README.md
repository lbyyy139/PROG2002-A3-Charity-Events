# Hearts United Foundation - Charity Events API (A3)

PROG2002 Assignment 3 - RESTful API for the charity events website.
Built with Node.js, Express and MySQL (mysql2). Team: Boyu Liu (24832407) and Xiang Hu (24832203).

## New in Assignment 3
- `registrations` table (event registrations, one registration per email per event)
- `GET /api/events/:id` now returns the event **plus its registrations** (latest first)
- `GET /api/events/all` - every event regardless of status, with registration counts (admin)
- `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id` (full C.R.U.D.;
  deletion is blocked with HTTP 409 when registrations exist)
- `POST /api/events/:id/registrations` - register a user for an event
- `GET /api/organisations` - organisation list for the admin form

## How to run
1. Import `charityevents_db.sql` into MySQL:
   mysql -u root -p < charityevents_db.sql
2. Create `db-config.js` (copy `db-config.example.js`) with your MySQL password.
3. `npm install`
4. `node server.js` - the API runs at http://localhost:3000

## Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/events | current & upcoming events (client home page) |
| GET | /api/events/all | all events + registration counts (admin) |
| GET | /api/events/search?date=&location=&categoryId= | filter active events |
| GET | /api/events/:id | one event + registrations (latest first) |
| GET | /api/admin/events/:id | admin details including suspended events and registrations |
| POST | /api/events | create an event (admin) |
| PUT | /api/events/:id | update an event (admin) |
| DELETE | /api/events/:id | delete an event (409 if registrations exist) |
| POST | /api/events/:id/registrations | create a registration |
| GET | /api/categories | category list for dropdowns |
| GET | /api/organisations | organisation list for the admin form |

## cPanel and time handling

Select an empty database in phpMyAdmin and import `charityevents_db_cpanel.sql`.
The SQL scripts drop and recreate tables; use a fresh database or back up existing data.
Both SQL variants contain the full schema and 10 initial registrations.
The real `db-config.js` must remain private and is not included in source ZIPs.
The server uses `PORT` or 3000, and MySQL connections use Brisbane UTC+10.
Use `server.js` as the Node startup file and restart after uploading changed API files.
