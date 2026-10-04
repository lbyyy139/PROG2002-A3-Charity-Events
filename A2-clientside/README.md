# Hearts United Foundation - Charity Events Website (Client-side)
PROG2002 Assignment 2 - Boyu Liu (24832407)

A client-side website built with pure HTML, CSS and JavaScript (no frameworks).
All event data is retrieved dynamically from the RESTful API (see `A2-api`).

## Pages
- `index.html`  - Home page: organisation info (static) + current & upcoming events (from `GET /api/events`)
- `search.html` - Search page: filter events by date, location and category (from `GET /api/events/search` and `GET /api/categories`)
- `event.html`  - Event details page: full info, goal vs. progress, register modal (from `GET /api/events/:id`)

## How to run
1. Start the API server first (see the `A2-api` README) - it must run at `http://localhost:3000`.
2. Open `index.html` in your browser (double-click, or right-click > Open With > your browser).

## Structure
```
A2-clientside/
  index.html
  search.html
  event.html
  css/style.css      - hand-written CSS (no frameworks)
  js/api.js          - API base URL, fetch helper, shared render helpers
  js/home.js         - home page logic
  js/search.js       - search page logic (form, clear filters, validation)
  js/event.js        - event detail logic (query string, modal)
  images/*.svg       - local event images
```
