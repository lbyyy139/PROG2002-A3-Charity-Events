/** Display helpers shared across the admin pages. */
export function formatDate(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-AU', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Brisbane'
    }) + ', ' + d.toLocaleTimeString('en-AU', {
        hour: 'numeric', minute: '2-digit', timeZone: 'Australia/Brisbane'
    }) + ' AEST';
}

export function formatMoney(amount: number, freeLabel = true): string {
    const value = Number(amount);
    if (value === 0 && freeLabel) return 'Free';
    return '$' + value.toLocaleString('en-AU', {
        minimumFractionDigits: 0, maximumFractionDigits: 2
    });
}

/**
 * Converts a stored event date (ISO string) into the value format required
 * by the form: Brisbane local time, independent of the administrator's browser.
 * Preserve seconds so an unchanged form does not silently round the time.
 */
export function toDatetimeLocal(iso: string | null): string {
    if (!iso) return '';
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Australia/Brisbane', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date(iso));
    const value = (type: string) => parts.find((p) => p.type === type)!.value;
    return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}:${value('second')}`;
}
