/**
 * event.js - Event details page logic (PROG2002 A2, Boyu Liu 24832407)
 * Reads the event id from the URL query string (?id=...), calls
 * GET /api/events/:id, renders the details, goal-vs-progress bar and
 * ticket info. The Register button opens a modal (registration is A3).
 */

(function () {
    'use strict';

    const detail = document.getElementById('event-detail');
    const messageBox = document.getElementById('event-message');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');

    // 1. Get the event id from the URL query string
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('id');

    function showMessage(text, isError) {
        messageBox.textContent = text;
        messageBox.className = isError ? 'message error' : 'message info';
        messageBox.hidden = false;
    }

    // 2 + 3. Fetch the event and render it
    function loadEvent() {
        // The id must be numeric before it is sent to the API.
        if (!eventId || !/^\d+$/.test(eventId)) {
            showMessage('No valid event was selected. Please choose an event from the Home or Search page.', true);
            return;
        }

        showMessage('Loading event details...', false);

        fetchJSON(API_BASE + '/api/events/' + encodeURIComponent(eventId))
            .then(function (event) {
                renderEvent(event);
            })
            .catch(function (err) {
                console.error(err);
                showMessage(err.message || 'The event could not be loaded.', true);
            });
    }

    function renderEvent(event) {
        messageBox.hidden = true;

        const goal = Number(event.goal_amount);
        const raised = Number(event.raised_amount);
        const percent = goal > 0 ? Math.min(100, Math.round(raised / goal * 100)) : 0;

        detail.innerHTML =
            '<nav class="breadcrumb"><a href="index.html">Home</a> / <a href="search.html">Search</a> / ' +
            escapeHTML(event.event_name) + '</nav>' +

            '<div class="detail-hero">' +
            '  <img src="' + escapeHTML(event.image_url || 'images/festival.svg') + '" alt="' + escapeHTML(event.event_name) + '">' +
            '  <div class="detail-hero-text">' +
            '    <span class="badge badge-large">' + escapeHTML(event.category_name) + '</span>' +
            '    <h1>' + escapeHTML(event.event_name) + '</h1>' +
            '    <p class="detail-org">Hosted by <strong>' + escapeHTML(event.org_name) + '</strong></p>' +
            '  </div>' +
            '</div>' +

            '<div class="detail-layout">' +
            '  <div class="detail-main">' +
            '    <h2>About this event</h2>' +
            '    <p>' + escapeHTML(event.description) + '</p>' +
            '    <h2>The cause we support</h2>' +
            '    <p class="purpose-box">' + escapeHTML(event.purpose) + '</p>' +
            '  </div>' +

            '  <aside class="detail-side">' +
            '    <h2>When &amp; where</h2>' +
            '    <ul class="info-list">' +
            '      <li><span class="icon">&#128197;</span><div><strong>Starts</strong>' + formatDate(event.event_date) + '</div></li>' +
            (event.end_date
                ? '<li><span class="icon">&#9203;</span><div><strong>Ends</strong>' + formatDate(event.end_date) + '</div></li>'
                : '') +
            '      <li><span class="icon">&#128205;</span><div><strong>Venue</strong>' + escapeHTML(event.venue) + '<br>' + escapeHTML(event.location) + '</div></li>' +
            '      <li><span class="icon">&#127915;</span><div><strong>Ticket</strong>' + formatMoney(event.ticket_price) +
            (Number(event.ticket_price) === 0 ? ' <small>(donations welcome)</small>' : '') + '</div></li>' +
            '    </ul>' +

            '    <div class="goal-card">' +
            '      <h2>Fundraising goal</h2>' +
            '      <div class="progress-track progress-large"><div class="progress-fill" style="width:' + percent + '%"></div></div>' +
            '      <p class="goal-figures"><strong>' + formatMoney(raised) + '</strong> raised of ' + formatMoney(goal) + ' goal</p>' +
            '      <p class="goal-percent">' + percent + '% funded</p>' +
            '    </div>' +

            '    <button type="button" id="register-btn" class="btn btn-primary btn-block">Register for this event</button>' +
            '    <p class="ticket-note">Your ticket purchase is a donation to the cause.</p>' +
            '  </aside>' +
            '</div>';

        detail.hidden = false;

        // Register button opens the "under construction" modal
        document.getElementById('register-btn').addEventListener('click', openModal);
    }

    // Modal helpers
    function openModal() {
        modalOverlay.hidden = false;
        modalClose.focus();
    }

    function closeModal() {
        modalOverlay.hidden = true;
    }

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function (event) {
        if (event.target === modalOverlay) closeModal(); // click on the dark backdrop
    });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeModal();
    });

    // Keep the footer copyright year up to date automatically.
    document.getElementById('footer-year').textContent = new Date().getFullYear();

    loadEvent();
})();
