/**
 * server.js - RESTful API for the Charity Events website (PROG2002 A2)
 * Author: Boyu Liu (24832407)
 * Endpoints: GET /api/events, /api/events/search, /api/events/:id, /api/categories
 */

const express = require('express');
const { query } = require('./event_db');

const app = express();
const PORT = 3000;

// CORS: the client-side pages come from a different origin (opened as static
// HTML files), so cross-origin GET requests must be allowed explicitly.
// Implemented manually - no third-party CORS package is used.
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
        e.is_suspended,
        o.org_id,
        o.org_name,
        c.category_id,
        c.category_name
    FROM events e
    INNER JOIN organisations o ON e.org_id = o.org_id
    INNER JOIN categories c    ON e.category_id = c.category_id
`;

// GET /api/events - current & upcoming events for the home page.
// Suspended events are never shown to the public.
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

// GET /api/events/search?date=YYYY-MM-DD&location=...&categoryId=...
// Filters active (non-suspended) events by any combination of the criteria.
app.get('/api/events/search', async (req, res) => {
    try {
        const { date, location, categoryId } = req.query;

        // Server-side input validation: invalid input -> 400, no query runs.
        const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
        if (date && !DATE_PATTERN.test(date)) {
            return res.status(400).json({
                error: 'Invalid date format. Expected YYYY-MM-DD.'
            });
        }
        if (location && location.length > 100) {
            return res.status(400).json({
                error: 'Location text is too long (maximum 100 characters).'
            });
        }
        if (categoryId && !/^\d+$/.test(categoryId)) {
            return res.status(400).json({
                error: 'Invalid category. Category must be a number.'
            });
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

// GET /api/events/:id - full details of one event (404 if missing/suspended).
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
            return res.status(404).json({
                error: 'Event not found or no longer available.'
            });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('GET /api/events/:id failed:', err.message);
        res.status(500).json({ error: 'Failed to retrieve the event.' });
    }
});

// GET /api/categories - category list for the search page dropdown.
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

app.listen(PORT, () => {
    console.log(`Charity Events API is running at http://localhost:${PORT}`);
});
