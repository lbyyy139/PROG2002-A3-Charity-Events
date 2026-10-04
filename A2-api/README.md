# Charity Events RESTful API
PROG2002 Assignment 2 - Boyu Liu (24832407)

A Node.js + Express RESTful API that serves charity event data from a MySQL
database (`charityevents_db`) to the client-side website (see `A2-clientside`).

## How to run
1. Install MySQL 8.x if you do not have it.
2. Import the database: run the SQL file `charityevents_db.sql` in your MySQL
   server (e.g. `mysql -u root -p < charityevents_db.sql`, or use MySQL
   Workbench > Server > Data Import).
3. Set your MySQL credentials. Either edit the `password` (and `user`) in the
   `defaultConfig` object inside `event_db.js`, **or** (recommended) create a
   file named `db-config.js` next to it:
   ```js
   module.exports = {
       host: 'localhost',
       user: 'root',
       password: 'your_password',
       database: 'charityevents_db'
   };
   ```
   `db-config.js` is ignored by git, so real passwords are never committed.
4. Install the dependencies and start the server:
   ```
   npm install
   npm start        (or: node server.js)
   ```
5. The API now runs at `http://localhost:3000`.

## Endpoints (all GET - POST/PUT/DELETE are part of Assignment 3)
| Endpoint                      | Purpose                                        |
|-------------------------------|------------------------------------------------|
| `GET /api/events`            | All current & upcoming, non-suspended events   |
| `GET /api/events/search?date=YYYY-MM-DD&location=...&categoryId=...` | Search events by any combination of criteria |
| `GET /api/events/:id`        | Full details of one event (404 if suspended/not found) |
| `GET /api/categories`        | All event categories (for the search dropdown) |

## Structure
```
A2-api/
  server.js            - Express app with all API routes
  event_db.js          - MySQL connection pool (required connection file)
  charityevents_db.sql - database schema + sample data (8+ events)
  package.json
```
