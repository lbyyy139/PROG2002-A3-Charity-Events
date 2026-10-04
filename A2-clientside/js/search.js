/**
 * search.js - Search page logic (PROG2002 A2, Boyu Liu 24832407)
 * 1. loads categories from GET /api/categories into the dropdown,
 * 2. on submit, builds a query string from the criteria and calls
 *    GET /api/events/search?...,
 * 3. renders the matching events or a friendly error message,
 * 4. the "Clear Filters" button resets every field (DOM manipulation).
 */

(function () {
    'use strict';

    const form = document.getElementById('search-form');
    const dateInput = document.getElementById('search-date');
    const locationInput = document.getElementById('search-location');
    const categorySelect = document.getElementById('search-category');
    const clearButton = document.getElementById('clear-filters');
    const searchButton = document.getElementById('search-button');
    const messageBox = document.getElementById('search-message');
    const resultsGrid = document.getElementById('search-results');
    const resultsTitle = document.getElementById('results-title');

    // Category dropdown - options are populated dynamically from the API
    function loadCategories() {
        fetchJSON(API_BASE + '/api/categories')
            .then(function (categories) {
                categories.forEach(function (category) {
                    const option = document.createElement('option');
                    option.value = category.category_id;
                    option.textContent = category.category_name;
                    categorySelect.appendChild(option);
                });
            })
            .catch(function (err) {
                console.error(err);
                showMessage('Could not load categories. Is the API server running?', true);
            });
    }

    // Message helpers (basic DOM manipulation)
    function showMessage(text, isError) {
        messageBox.textContent = text;
        messageBox.className = isError ? 'message error' : 'message info';
        messageBox.hidden = false;
    }

    function clearMessage() {
        messageBox.hidden = true;
        messageBox.textContent = '';
    }

    function clearResults() {
        while (resultsGrid.firstChild) {
            resultsGrid.removeChild(resultsGrid.firstChild);
        }
        resultsTitle.textContent = 'Results';
    }

    // Form submission -> search
    form.addEventListener('submit', function (event) {
        event.preventDefault(); // stay on this page - data comes from the API

        const date = dateInput.value.trim();
        const location = locationInput.value.trim();
        const categoryId = categorySelect.value;

        clearMessage();
        clearResults();

        // Client-side validation: at least one criterion must be selected.
        if (!date && !location && !categoryId) {
            showMessage('Please choose at least one search criterion (date, location or category).', true);
            return;
        }

        // Client-side validation: only current & upcoming events are shown,
        // so the date cannot be in the past.
        if (date) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const picked = new Date(date + 'T00:00:00');
            if (picked < today) {
                showMessage('The search date cannot be in the past. Please choose today or a later date.', true);
                return;
            }
        }

        // Build the query string from the criteria that were filled in.
        const params = new URLSearchParams();
        if (date) params.set('date', date);
        if (location) params.set('location', location);
        if (categoryId) params.set('categoryId', categoryId);

        showMessage('Searching events...', false);

        // Disable the button while the request is in flight (no duplicate submits).
        searchButton.disabled = true;
        searchButton.textContent = 'Searching...';

        fetchJSON(API_BASE + '/api/events/search?' + params.toString())
            .then(function (events) {
                searchButton.disabled = false;
                searchButton.textContent = 'Search';
                clearMessage();
                resultsTitle.textContent = events.length + ' event' + (events.length === 1 ? '' : 's') + ' found';

                if (events.length === 0) {
                    showMessage('No events match your search criteria. Try changing or clearing the filters.', false);
                    return;
                }

                events.forEach(function (ev) {
                    resultsGrid.insertAdjacentHTML('beforeend', buildEventCard(ev));
                });
            })
            .catch(function (err) {
                // Restore the button even if the request failed.
                searchButton.disabled = false;
                searchButton.textContent = 'Search';
                console.error(err);
                showMessage(err.message || 'The search failed. Please try again later.', true);
            });
    });

    // Clear Filters button - resets every field (DOM manipulation)
    clearButton.addEventListener('click', function () {
        form.reset();
        clearMessage();
        clearResults();
        dateInput.focus();
    });

    // Keep the footer copyright year up to date automatically.
    document.getElementById('footer-year').textContent = new Date().getFullYear();

    loadCategories();
})();
