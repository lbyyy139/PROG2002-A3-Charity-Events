# Manual Test Plan — Charity Events (A3)

**Owner: Xiang Hu** · Testing and quality assurance

Every case below is executed by hand against the deployed cPanel site. Run the
whole list before submitting, and again after any change to the API.

---

## 0. Pre-conditions

- [ ] The Node.js application is running on cPanel (status shows started)
- [ ] The database is imported and contains 4 tables, 11 events, 10 registrations
- [ ] `db-config.js` exists on the server with the correct credentials
- [ ] Both front ends are uploaded to `public_html` and `public_html/admin`
- [ ] `.htaccess` exists in both folders

---

## 1. REST API

| # | Request | Expected result | Pass |
|---|---|---|---|
| 1.1 | `GET /api/events` | 200, JSON array of upcoming, non-suspended events | ☐ |
| 1.2 | `GET /api/events/all` | 200, every event including past/suspended, each with `registration_count` | ☐ |
| 1.3 | `GET /api/events/1` | 200, one event plus its registrations | ☐ |
| 1.4 | `GET /api/events/abc` | 400 "Invalid event id." (no query executed) | ☐ |
| 1.5 | `GET /api/events/9999` | 404 "Event not found." | ☐ |
| 1.6 | `GET /api/events/search?date=2026-10-19` | 200, only events on that date | ☐ |
| 1.7 | `GET /api/events/search?date=not-a-date` | 400 "Invalid date format. Expected YYYY-MM-DD." | ☐ |
| 1.8 | `GET /api/events/search?categoryId=1` | 200, only events in category 1 | ☐ |
| 1.9 | `GET /api/events/search?categoryId=xyz` | 400 "Invalid category." | ☐ |
| 1.10 | `GET /api/events/search?location=gold` | 200, case-insensitive partial match | ☐ |
| 1.11 | `GET /api/categories` | 200, 5 categories | ☐ |
| 1.12 | `GET /api/organisations` | 200, 3 organisations | ☐ |

---

## 2. Public client-side website

| # | Action | Expected result | Pass |
|---|---|---|---|
| 2.1 | Open the home page | Event cards render from `GET /api/events`; no hard-coded cards | ☐ |
| 2.2 | Stop the API, reload the home page | Clear error message, page does not break | ☐ |
| 2.3 | Open the search page | Category dropdown populated from the API | ☐ |
| 2.4 | Search with all fields empty | Validation message, no request sent | ☐ |
| 2.5 | Filter by category | Only matching events appear | ☐ |
| 2.6 | Filter by date | Only events on that date appear | ☐ |
| 2.7 | Filter by location | Partial, case-insensitive matching works | ☐ |
| 2.8 | Combine date + category | Both conditions applied together | ☐ |
| 2.9 | Search with no matches | Empty-state message shown | ☐ |
| 2.10 | Open event details | Event data, registration list and weather forecast render | ☐ |
| 2.11 | Open details for a bad id in the URL | Clear error message | ☐ |
| 2.12 | Submit registration with an empty name | "Please enter your full name." | ☐ |
| 2.13 | Submit with an invalid email | "Please enter a valid email address." | ☐ |
| 2.14 | Submit with an empty phone | "Please enter your contact phone number." | ☐ |
| 2.15 | Submit with 0 tickets | Tickets must be between 1 and 20 | ☐ |
| 2.16 | Submit with 99 tickets | Same validation message | ☐ |
| 2.17 | Submit valid data | Confirmation message with name and ticket count | ☐ |
| 2.18 | Register the same email for the same event again | API rejects it as a duplicate | ☐ |

---

## 3. Admin-side website

| # | Action | Expected result | Pass |
|---|---|---|---|
| 3.1 | Open `/admin/` | All events listed with their registration count | ☐ |
| 3.2 | Check a past event | Status shown as Past | ☐ |
| 3.3 | Check a suspended event | Status shown as Suspended | ☐ |
| 3.4 | Press Save on an empty new-event form | Missing required fields are listed, nothing is sent | ☐ |
| 3.5 | Fill everything except organisation/category | "Please choose an organisation and a category." | ☐ |
| 3.6 | Create a valid event | Success, redirect to list, new event visible | ☐ |
| 3.7 | Open the edit page of an event | Form pre-filled with the stored values | ☐ |
| 3.8 | Check the date field | Shows the stored date and time correctly (`datetime-local` format) | ☐ |
| 3.9 | Edit and save | Success, redirect to list, change visible | ☐ |
| 3.10 | Press Delete once | Button changes to ask for confirmation, nothing deleted | ☐ |
| 3.11 | Press Delete twice on an event with **no** registrations | Event removed from the list | ☐ |
| 3.12 | Press Delete twice on an event **with** registrations | Blocked, 409 message shown, event remains | ☐ |
| 3.13 | Open `/admin/edit/abc` | "Invalid event id." — no request sent | ☐ |
| 3.14 | Type "run" in the dashboard search | Only events whose name/location/category/organisation contains it remain | ☐ |
| 3.15 | Search is case-insensitive ("RUN" gives the same result) | Same rows as 3.14 | ☐ |
| 3.16 | Type a term with no match | "No event matches the current search." message, no table | ☐ |
| 3.17 | Check the counter next to the toolbar | Reads `Showing X of 11` | ☐ |
| 3.18 | Sort by "Name (A-Z)" | Rows ordered alphabetically | ☐ |
| 3.19 | Sort by "Oldest first" | Earliest event first | ☐ |
| 3.20 | Sort by "Most registrations" | Highest registration count first | ☐ |
| 3.21 | Combine a search term with a sort order | Both applied together | ☐ |
| 3.22 | Press Clear | Filter and sort reset to newest-first, all events shown | ☐ |
| 3.23 | Type in the search box, watch the Network tab | **No** additional HTTP request is made (filtering is in memory) | ☐ |
| 3.24 | Delete a row while a filter is active | Row disappears, filter term is kept | ☐ |

---

## 4. Routing and deployment

| # | Action | Expected result | Pass |
|---|---|---|---|
| 4.1 | Refresh `/` | Loads normally | ☐ |
| 4.2 | Refresh `/search` | Loads normally (not a 404) | ☐ |
| 4.3 | Refresh `/event/3` | Loads normally | ☐ |
| 4.4 | Refresh `/admin/edit/3` | Loads normally | ☐ |
| 4.5 | Request `/api/events` while the front end is loaded | Not rewritten by `.htaccess`, still returns JSON | ☐ |

---

## 5. Security checks

| # | Check | Expected result | Pass |
|---|---|---|---|
| 5.1 | Search with `' OR 1=1 --` in location | Treated as literal text, no injection, no rows leaked | ☐ |
| 5.2 | Inspect `db-config.js` in the published folders | Not present; credentials are never served to browsers | ☐ |
| 5.3 | Confirm `db-config.js` is absent from the GitHub repository | Git-ignored, never committed | ☐ |

---

## Regression notes

Re-run sections 1 and 3 after any of these changes:

- Any edit to `server.js`
- Changing `db-config.js`
- Rebuilding either front end
- Importing a different SQL file
