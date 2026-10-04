/**
 * home.js - Home page logic (PROG2002 A2, Boyu Liu 24832407)
 * Calls GET /api/events and renders each event as a card via the DOM API.
 */

(function () {
    'use strict';

    const grid = document.getElementById('event-grid');
    const messageBox = document.getElementById('home-message');

    /** Shows a loading / error message inside the page (DOM manipulation). */
    function showMessage(text, isError) {
        messageBox.textContent = text;
        messageBox.className = isError ? 'message error' : 'message info';
        messageBox.hidden = false;
    }

    function hideMessage() {
        messageBox.hidden = true;
    }

    /** Renders the list of events returned by the API. */
    function renderEvents(events) {
        // Remove the loading placeholder / previous cards
        while (grid.firstChild) {
            grid.removeChild(grid.firstChild);
        }

        if (!events || events.length === 0) {
            showMessage('No current or upcoming events at the moment. Please check back soon!', false);
            return;
        }
        hideMessage();

        events.forEach(function (event) {
            grid.insertAdjacentHTML('beforeend', buildEventCard(event));
        });
    }

    // Load the events as soon as the page is ready
    showMessage('Loading events...', false);

    fetchJSON(API_BASE + '/api/events')
        .then(function (events) {
            renderEvents(events);
        })
        .catch(function (err) {
            console.error(err);
            showMessage(
                'Sorry, the events could not be loaded. Please make sure the API server is running.',
                true
            );
        });

    // Keep the footer copyright year up to date automatically.
    document.getElementById('footer-year').textContent = new Date().getFullYear();
})();
