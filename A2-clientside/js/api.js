/**
 * api.js - Shared helpers used by every page (PROG2002 A2, Boyu Liu 24832407)
 * API_BASE, fetchJSON (promise-based GET helper), format/date-money helpers,
 * escapeHTML and buildEventCard.
 */

// The Express API server runs on port 3000.
const API_BASE = 'http://localhost:3000';

/**
 * Sends a GET request to the API and returns the parsed JSON data.
 * Rejects with an Error when the server cannot be reached or answers
 * with a non-OK HTTP status.
 */
function fetchJSON(url) {
    return fetch(url)
        .then(function (response) {
            if (!response.ok) {
                // API replied with an error status (400 / 404 / 500 ...)
                return response.json().then(function (body) {
                    throw new Error(body.error || 'Request failed (' + response.status + ')');
                });
            }
            return response.json();
        });
}

/** Formats an ISO date-time string as e.g. "Sat, 11 Oct 2026, 8:00 AM". */
function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-AU', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    }) + ', ' + d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
}

/** Formats a number as Australian dollars; $0 is displayed as "Free". */
function formatMoney(amount) {
    const value = Number(amount);
    if (value === 0) return 'Free';
    return '$' + value.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Escapes HTML characters so database content is displayed safely. */
function escapeHTML(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Builds the HTML for one event card (Home and Search pages).
 * Each card links to event.html?id=... - the id travels in the query string.
 */
function buildEventCard(event) {
    const progress = Number(event.goal_amount) > 0
        ? Math.min(100, Math.round(Number(event.raised_amount) / Number(event.goal_amount) * 100))
        : 0;

    return (
        '<article class="event-card">' +
        '  <a class="card-image" href="event.html?id=' + encodeURIComponent(event.event_id) + '">' +
        '    <img src="' + escapeHTML(event.image_url || 'images/festival.svg') + '" alt="' + escapeHTML(event.event_name) + '">' +
        '    <span class="badge">' + escapeHTML(event.category_name) + '</span>' +
        '  </a>' +
        '  <div class="card-body">' +
        '    <h3><a href="event.html?id=' + encodeURIComponent(event.event_id) + '">' + escapeHTML(event.event_name) + '</a></h3>' +
        '    <p class="card-meta"><span class="icon" aria-hidden="true">&#128197;</span> ' + formatDate(event.event_date) + '</p>' +
        '    <p class="card-meta"><span class="icon" aria-hidden="true">&#128205;</span> ' + escapeHTML(event.location) + ' &middot; ' + escapeHTML(event.venue) + '</p>' +
        '    <div class="card-progress">' +
        '      <div class="progress-track"><div class="progress-fill" style="width:' + progress + '%"></div></div>' +
        '      <p class="progress-text">' + progress + '% of ' + formatMoney(event.goal_amount) + ' goal raised</p>' +
        '    </div>' +
        '    <div class="card-footer">' +
        '      <span class="price">' + formatMoney(event.ticket_price) + '</span>' +
        '      <a class="btn btn-small" href="event.html?id=' + encodeURIComponent(event.event_id) + '">View details &rarr;</a>' +
        '    </div>' +
        '  </div>' +
        '</article>'
    );
}
