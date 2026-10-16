/**
 * server.js - RESTful API for the Charity Events website (PROG2002 A3)
 * Authors: Boyu Liu (24832407) + team member
 * A3 adds the full C.R.U.D. cycle for events and event registrations:
 *   GET    /api/events                      - current & upcoming events
 *   GET    /api/events/all                  - every event (admin list)
 *   GET    /api/events/search               - filter by date/location/category
 *   GET    /api/events/:id                  - one event + its registrations
 *   POST   /api/events                      - create an event (admin)
 *   PUT    /api/events/:id                  - update an event (admin)
 *   DELETE /api/events/:id                  - delete an event (blocked if registrations exist)
 *   POST   /api/events/:id/registrations    - register for an event
 *   GET    /api/categories                  - category list for dropdowns
 */

const express = require('express');
const { query } = require('./event_db');

const app = express();
const PORT = 3000;

// Parse JSON request bodies (POST / PUT).
app.use(express.json());

// CORS: the client-side and admin-side websites come from different origins
// (static files / another port), so cross-origin requests must be allowed.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    // Reply to the browser's preflight OPTIONS check.
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// Shared SQL fragment: event data joined with its category and organisation.
const EVENT_SELECT = `
    SELECT
        e.event_id,
        e.event_name,
        e.event_date,
        e.end_date,
        e.location,
        e.venue,
        e.description,
        e.purpose,
        e.ticket_price,
        e.goal_amount,
        e.raised_amount,
        e.image_url,
        e.latitude,
        e.longitude,
        e.is_suspended,
        o.org_id,
        o.org_name,
        c.category_id,
        c.category_name
    FROM events e
    INNER JOIN organisations o ON e.org_id = o.org_id
    INNER JOIN categories c    ON e.category_id = c.category_id
`;

// ---------------------------------------------------------------------------
// Validation helpers - shared by the create / update endpoints.
// ---------------------------------------------------------------------------

const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2})?)?$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates the request body of an event create/update call.
 *  Returns an array of error messages (empty = valid). */
function validateEvent(body) {
    const errors = [];
    const required = ['event_name', 'event_date', 'location', 'venue', 'description', 'purpose', 'org_id', 'category_id'];
    for (const field of required) {
        if (body[field] === undefined || body[field] === null || String(body[field]).trim() === '') {
            errors.push(`Field "${field}" is required.`);
        }
    }
    if (body.event_date && !DATE_TIME_PATTERN.test(String(body.event_date))) {
        errors.push('Field "event_date" must be a date in YYYY-MM-DD or YYYY-MM-DD HH:MM format.');
    }
    if (body.end_date && body.end_date !== '' && !DATE_TIME_PATTERN.test(String(body.end_date))) {
        errors.push('Field "end_date" must be a date in YYYY-MM-DD or YYYY-MM-DD HH:MM format.');
    }
    for (const field of ['ticket_price', 'goal_amount', 'raised_amount']) {
        const value = body[field];
        if (value !== undefined && value !== '' && (isNaN(Number(value)) || Number(value) < 0)) {
            errors.push(`Field "${field}" must be a non-negative number.`);
        }
    }
    for (const field of ['org_id', 'category_id']) {
        if (body[field] !== undefined && !/^\d+$/.test(String(body[field]))) {
            errors.push(`Field "${field}" must be a number.`);
        }
    }
    if (body.latitude !== undefined && body.latitude !== '' && isNaN(Number(body.latitude))) {
        errors.push('Field "latitude" must be a number.');
    }
    if (body.longitude !== undefined && body.longitude !== '' && isNaN(Number(body.longitude))) {
        errors.push('Field "longitude" must be a number.');
    }
    return errors;
}

/** Builds the column/value arrays for an INSERT or UPDATE from the body. */
function eventColumns(body) {
    return {
        columns: ['event_name', 'event_date', 'end_date', 'location', 'venue', 'description', 'purpose',
                  'ticket_price', 'goal_amount', 'raised_amount', 'image_url', 'latitude', 'longitude',
                  'org_id', 'category_id', 'is_suspended'],
        values: [
            String(body.event_name).trim(),
            body.event_date,
            body.end_date ? body.end_date : null,
            String(body.location).trim(),
            String(body.venue).trim(),
            String(body.description).trim(),
            String(body.purpose).trim(),
            body.ticket_price !== undefined && body.ticket_price !== '' ? Number(body.ticket_price) : 0.00,
            body.goal_amount !== undefined && body.goal_amount !== '' ? Number(body.goal_amount) : 0.00,
            body.raised_amount !== undefined && body.raised_amount !== '' ? Number(body.raised_amount) : 0.00,
            body.image_url ? String(body.image_url).trim() : null,
            body.latitude !== undefined && body.latitude !== '' ? Number(body.latitude) : null,
            body.longitude !== undefined && body.longitude !== '' ? Number(body.longitude) : null,
            Number(body.org_id),
            Number(body.category_id),
            body.is_suspended !== undefined ? (body.is_suspended ? 1 : 0) : 0
        ]
    };
}

// ---------------------------------------------------------------------------
// GET /api/events - current & upcoming events for the client-side home page.
// ---------------------------------------------------------------------------
app.get('/api/events', async (req, res) => {
    try {
        const rows = await query(
            EVENT_SELECT + `
            WHERE e.is_suspended = 0
              AND e.event_date >= NOW()
            ORDER BY e.event_date ASC`,
            []
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/events failed:', err.message);
        res.status(500).json({ error: 'Failed to retrieve events.' });
    }
});

// ---------------------------------------------------------------------------
// GET /api/events/all - every event regardless of status (admin-side list),
// including the number of registrations of each event.
// ---------------------------------------------------------------------------
app.get('/api/events/all', async (req, res) => {
    try {
        const rows = await query(
            `SELECT admin_events.*,
                    (SELECT COUNT(*) FROM registrations r
                     WHERE r.event_id = admin_events.event_id) AS registration_count
             FROM (
             ` + EVENT_SELECT + `
             ) AS admin_events
             ORDER BY admin_events.event_date DESC`,
            []
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/events/all failed:', err.message);
        res.status(500).json({ error: 'Failed to retrieve events.' });
    }
});

// ---------------------------------------------------------------------------
// GET /api/events/search?date=YYYY-MM-DD&location=...&categoryId=...
// ---------------------------------------------------------------------------
app.get('/api/events/search', async (req, res) => {
    try {
        const { date, location, categoryId } = req.query;

        // Server-side input validation: invalid input -> 400, no query runs.
        const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
        if (date && !DATE_PATTERN.test(date)) {
            return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
        }
        if (location && location.length > 100) {
            return res.status(400).json({ error: 'Location text is too long (maximum 100 characters).' });
        }
        if (categoryId && !/^\d+$/.test(categoryId)) {
            return res.status(400).json({ error: 'Invalid category. Category must be a number.' });
        }

        // Dynamic WHERE clause: all criteria are optional, combined with AND.
        let sql = EVENT_SELECT + ' WHERE e.is_suspended = 0';
        const params = [];

        if (date) {
            sql += ' AND DATE(e.event_date) = ?';
            params.push(date);
        }
        if (location) {
            // Case-insensitive partial match on city / venue.
            sql += ' AND (e.location LIKE ? OR e.venue LIKE ?)';
            const pattern = `%${location}%`;
            params.push(pattern, pattern);
        }
        if (categoryId) {
            sql += ' AND e.category_id = ?';
            params.push(categoryId);
        }

        sql += ' ORDER BY e.event_date ASC';

        // Parameterised statement: user input is never concatenated into SQL.
        const rows = await query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('GET /api/events/search failed:', err.message);
        res.status(500).json({ error: 'Failed to search events.' });
    }
});

// ---------------------------------------------------------------------------
// GET /api/events/:id - full details of one event + its registrations,
// sorted by the latest registration date first (A3 requirement).
// ---------------------------------------------------------------------------
app.get('/api/events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;

        if (!/^\d+$/.test(eventId)) {
            return res.status(400).json({ error: 'Invalid event id.' });
        }

        const rows = await query(
            EVENT_SELECT + `
            WHERE e.event_id = ?
              AND e.is_suspended = 0`,
            [eventId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Event not found or no longer available.' });
        }

        const event = rows[0];

        // Complete list of registrations for this event, latest purchase first.
        event.registrations = await query(
            `SELECT registration_id, full_name, email, phone, ticket_count, registration_date
             FROM registrations
             WHERE event_id = ?
             ORDER BY registration_date DESC, registration_id DESC`,
            [eventId]
        );

        res.json(event);
    } catch (err) {
        console.error('GET /api/events/:id failed:', err.message);
        res.status(500).json({ error: 'Failed to retrieve the event.' });
    }
});

// ---------------------------------------------------------------------------
// POST /api/events - insert a new charity event (admin-side "New" form).
// ---------------------------------------------------------------------------
app.post('/api/events', async (req, res) => {
    try {
        const errors = validateEvent(req.body || {});
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(' ') });
        }

        const { columns, values } = eventColumns(req.body);
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO events (${columns.join(', ')}) VALUES (${placeholders})`;

        const result = await query(sql, values);
        res.status(201).json({ message: 'Event created.', event_id: result.insertId });
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Unknown organisation or category.' });
        }
        console.error('POST /api/events failed:', err.message);
        res.status(500).json({ error: 'Failed to create the event.' });
    }
});

// ---------------------------------------------------------------------------
// PUT /api/events/:id - update an existing charity event (admin-side edit).
// ---------------------------------------------------------------------------
app.put('/api/events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        if (!/^\d+$/.test(eventId)) {
            return res.status(400).json({ error: 'Invalid event id.' });
        }

        const errors = validateEvent(req.body || {});
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(' ') });
        }

        const { columns, values } = eventColumns(req.body);
        const assignments = columns.map((c) => `${c} = ?`).join(', ');
        const sql = `UPDATE events SET ${assignments} WHERE event_id = ?`;

        const result = await query(sql, [...values, Number(eventId)]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found.' });
        }
        res.json({ message: 'Event updated.' });
    } catch (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: 'Unknown organisation or category.' });
        }
        console.error('PUT /api/events/:id failed:', err.message);
        res.status(500).json({ error: 'Failed to update the event.' });
    }
});

// ---------------------------------------------------------------------------
// DELETE /api/events/:id - remove an event. Data integrity rule: the event
// can only be deleted when it has no registrations yet.
// ---------------------------------------------------------------------------
app.delete('/api/events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        if (!/^\d+$/.test(eventId)) {
            return res.status(400).json({ error: 'Invalid event id.' });
        }

        const existing = await query('SELECT event_id FROM events WHERE event_id = ?', [eventId]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Event not found.' });
        }

        const regs = await query('SELECT COUNT(*) AS total FROM registrations WHERE event_id = ?', [eventId]);
        if (regs[0].total > 0) {
            // Block the deletion - registrations must be preserved.
            return res.status(409).json({
                error: `This event cannot be deleted because it already has ${regs[0].total} registration(s).`
            });
        }

        await query('DELETE FROM events WHERE event_id = ?', [eventId]);
        res.json({ message: 'Event deleted.' });
    } catch (err) {
        console.error('DELETE /api/events/:id failed:', err.message);
        res.status(500).json({ error: 'Failed to delete the event.' });
    }
});

// ---------------------------------------------------------------------------
// POST /api/events/:id/registrations - register a user for an event.
// The registration date is set by the server (DEFAULT CURRENT_TIMESTAMP).
// A user (identified by email) may register for many events but only once
// per event - enforced by the UNIQUE (event_id, email) constraint.
// ---------------------------------------------------------------------------
app.post('/api/events/:id/registrations', async (req, res) => {
    try {
        const eventId = req.params.id;
        if (!/^\d+$/.test(eventId)) {
            return res.status(400).json({ error: 'Invalid event id.' });
        }

        const body = req.body || {};
        const errors = [];

        if (!body.full_name || String(body.full_name).trim() === '') {
            errors.push('Field "full_name" is required.');
        }
        if (!body.email || !EMAIL_PATTERN.test(String(body.email))) {
            errors.push('A valid "email" address is required.');
        }
        if (!body.phone || String(body.phone).trim() === '') {
            errors.push('Field "phone" is required.');
        }
        const tickets = Number(body.ticket_count);
        if (!Number.isInteger(tickets) || tickets < 1 || tickets > 20) {
            errors.push('Field "ticket_count" must be a whole number between 1 and 20.');
        }
        if (errors.length > 0) {
            return res.status(400).json({ error: errors.join(' ') });
        }

        // The event must exist, be active and still upcoming.
        const events = await query(
            'SELECT event_id FROM events WHERE event_id = ? AND is_suspended = 0 AND event_date >= NOW()',
            [eventId]
        );
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found or no longer available for registration.' });
        }

        const result = await query(
            `INSERT INTO registrations (event_id, full_name, email, phone, ticket_count)
             VALUES (?, ?, ?, ?, ?)`,
            [eventId, String(body.full_name).trim(), String(body.email).trim().toLowerCase(),
             String(body.phone).trim(), tickets]
        );

        res.status(201).json({
            message: 'Registration successful.',
            registration_id: result.insertId
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            // UNIQUE (event_id, email) violated - this email already registered.
            return res.status(409).json({ error: 'This email address has already registered for this event.' });
        }
        console.error('POST /api/events/:id/registrations failed:', err.message);
        res.status(500).json({ error: 'Failed to create the registration.' });
    }
});

// ---------------------------------------------------------------------------
// GET /api/categories - category list for the search page dropdown.
// ---------------------------------------------------------------------------
app.get('/api/categories', async (req, res) => {
    try {
        const rows = await query(
            `SELECT category_id, category_name, description
             FROM categories
             ORDER BY category_name ASC`,
            []
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/categories failed:', err.message);
        res.status(500).json({ error: 'Failed to retrieve categories.' });
    }
});

// ---------------------------------------------------------------------------
// GET /api/organisations - organisation list for the admin event form.
// ---------------------------------------------------------------------------
app.get('/api/organisations', async (req, res) => {
    try {
        const rows = await query(
            `SELECT org_id, org_name FROM organisations ORDER BY org_name ASC`,
            []
        );
        res.json(rows);
    } catch (err) {
        console.error('GET /api/organisations failed:', err.message);
        res.status(500).json({ error: 'Failed to retrieve organisations.' });
    }
});

app.listen(PORT, () => {
    console.log(`Charity Events API is running at http://localhost:${PORT}`);
});
