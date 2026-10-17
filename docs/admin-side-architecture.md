# Admin-side Website — Architecture and Implementation

**Author: Xiang Hu** · PROG2002 Web Development 2 · Assessment 3

This document describes the admin-side website, the part of the system I own.
The public client-side website, the REST API and the database are documented
separately by Boyu Liu.

---

## 1. Purpose and audience

The admin site is a dedicated Angular application for staff. Its job is to give
full control over the core event data through the CRUD endpoints the API
exposes. It is deliberately separated from the public site because the two have
different audiences, different access needs and can be deployed independently.

| Site | URL (example) | Users |
|---|---|---|
| Public client-side | `https://<id>.it.scu.edu.au/` | Visitors and volunteers |
| Admin-side | `https://<id>.it.scu.edu.au/admin/` | Staff maintaining event data |

---

## 2. Technology

| Concern | Choice | Reason |
|---|---|---|
| Framework | Angular 22.2 (standalone components) | Component reuse, TypeScript type safety |
| Language | TypeScript 6 | Compile-time checking of API models |
| HTTP | Angular `HttpClient` + RxJS Observables | Built-in async handling, operators such as `catchError` |
| State | Angular signals | Updating state re-renders the view automatically |
| Forms | Template-driven (`ngModel`) via `FormsModule` | One shared component serves both create and edit |
| Routing | `provideRouter` with `withComponentInputBinding` | Clean URLs, route parameters read from the URL |

---

## 3. Routes

Defined in `src/app/app.routes.ts`:

| URL | Component | Purpose |
|---|---|---|
| `/` | `Dashboard` | Full event list with registration counts |
| `/new` | `EventNew` | Create an event |
| `/edit/:id` | `EventEdit` | Update an existing event |
| `**` | redirect to `/` | Any unknown URL returns to the list |

---

## 4. Modules I built

| File | Responsibility |
|---|---|
| `pages/dashboard/dashboard.*` | Lists every event including past and suspended ones, with the registration count, edit link and delete action |
| `pages/event-new/event-new.*` | Creates an event; validates then POSTs |
| `pages/event-edit/event-edit.*` | Loads an existing event, pre-fills the form, validates then PUTs |
| `shared/event-form/event-form.*` | The form itself, shared by create and edit |
| `services/api.service.ts` | Every HTTP call the admin site makes |
| `models.ts` | TypeScript interfaces mirroring the API responses |
| `formatters.ts` | Date and currency display helpers |

---

## 5. API endpoints used

| Method | Endpoint | Used by | Notes |
|---|---|---|---|
| GET | `/api/events/all` | Dashboard | Returns **all** events plus `registration_count` |
| GET | `/api/events/:id` | Edit page | Includes the event's registrations |
| POST | `/api/events` | New event page | Returns the new event id |
| PUT | `/api/events/:id` | Edit page | Full replacement of the mutable fields |
| DELETE | `/api/events/:id` | Dashboard delete | Returns 409 if registrations exist |
| GET | `/api/categories` | Event form | Category dropdown |
| GET | `/api/organisations` | Event form | Organisation dropdown |

Two list endpoints exist on purpose. The public site uses `GET /api/events`,
which filters to upcoming and non-suspended events only. The dashboard uses
`GET /api/events/all` so staff can see everything, including historic events.

---

## 6. Create / update flow

```
User types in the shared form
        |
        v
[(ngModel)] updates the model object
        |
        v
EventForm.submit() emits the values to the parent page
        |
        v
Parent validates required fields (name, date, location, venue,
description, purpose, organisation, category)
        |
        +-- invalid --> show an inline message, send nothing
        |
        +-- valid --> ApiService.createEvent() / updateEvent()
                              |
                              v
                        HttpClient POST or PUT
                              |
                              v
                        Express validates again, then
                        INSERT or UPDATE in MySQL
                              |
                              v
                        Response --> Router.navigate(['/'])
                              |
                              v
                        Dashboard reloads the list, new data visible
```

Validation runs twice on purpose. The client-side check exists to give the user
immediate feedback; the server-side check exists because anyone can call the API
directly and skip the interface entirely.

---

## 7. Delete flow and the 409 rule

Deletion needs two clicks. The first click stores the event id in `confirmId`
and changes the button label; the second click sends the request. This prevents
a single mis-click from destroying data.

```
first click  -> confirmId = event_id, button becomes "Confirm?"
second click -> DELETE /api/events/:id

200 -> success notice, list reloads
409 -> error notice with the reason from the API
```

The API returns **409 Conflict** when the event still has registrations, because
those registrations reference it through a foreign key. Deleting the event would
orphan them, so both layers refuse.

---

## 8. Error handling

`ApiService.handleError` converts any failed response into a plain `Error` whose
message comes from the API's `error` field, falling back to `Request failed
(<status>)`. Pages subscribe to the `error` callback and store the message in a
signal, which the template renders as a notice. No page breaks silently: a failed
request always produces a visible message.

Cases covered explicitly:

- API unreachable — "Could not load the events. Is the API server running?"
- Invalid id in the URL — the regular expression `^\d+$` rejects it before any request
- Validation failure — the missing field names are listed
- Deletion blocked — the API's 409 message is shown

---

## 9. Deployment notes

The admin site is a production build published to a subfolder:

```bash
npx ng build --base-href /admin/     # assets resolve under /admin/
```

`--base-href /admin/` is required. Without it the browser requests the bundles
from the site root and the page renders blank.

The published folder also contains an `.htaccess` file with rewrite rules, so
refreshing a client-side route such as `/admin/edit/3` is rewritten to
`index.html` instead of returning 404 from Apache.
