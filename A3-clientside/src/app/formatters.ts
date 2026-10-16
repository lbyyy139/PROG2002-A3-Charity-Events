/**
 * Display helpers shared across the pages (date, money, progress).
 */
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

/** Percentage of the fundraising goal already raised (capped at 100). */
export function raisedPercent(raised: number, goal: number): number {
    return Number(goal) > 0
        ? Math.min(100, Math.round(Number(raised) / Number(goal) * 100))
        : 0;
}
