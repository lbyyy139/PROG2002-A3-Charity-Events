/**
 * Display helpers shared across the pages (date, money, progress).
 */
export function formatDate(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-AU', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Brisbane'
    }) + ', ' + d.toLocaleTimeString('en-AU', {
        hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Brisbane'
    }) + ' AEST';
}

/** Calendar date at the event location, used for search and weather matching. */
export function eventDateKey(iso: string): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date(iso));
    const value = (type: string) => parts.find((p) => p.type === type)!.value;
    return `${value('year')}-${value('month')}-${value('day')}`;
}

export function registrationOpen(event: { event_date: string; is_suspended: number }): boolean {
    return !event.is_suspended && new Date(event.event_date).getTime() >= Date.now();
}

export function formatMoney(amount: number): string {
    const value = Number(amount);
    if (value === 0) return 'Free';
    return '$' + value.toLocaleString('en-AU', {
        minimumFractionDigits: 0, maximumFractionDigits: 2
    });
}

/** Percentage of the fundraising goal already raised (capped at 100). */
export function raisedPercent(raised: number, goal: number): number {
    return Number(goal) > 0
        ? Math.min(100, Math.round(Number(raised) / Number(goal) * 100))
        : 0;
}
