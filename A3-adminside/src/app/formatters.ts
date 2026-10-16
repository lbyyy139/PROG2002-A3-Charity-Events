/** Display helpers shared across the admin pages. */
export function formatDate(isoString: string): string {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-AU', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    }) + ', ' + d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
}

export function formatMoney(amount: number): string {
    const value = Number(amount);
    if (value === 0) return 'Free';
    return '$' + value.toLocaleString('en-AU', {
        minimumFractionDigits: 0, maximumFractionDigits: 2
    });
}

/**
 * Converts a stored event date (ISO string) into the value format required
 * by <input type="datetime-local">: YYYY-MM-DDTHH:MM.
 */
export function toDatetimeLocal(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
