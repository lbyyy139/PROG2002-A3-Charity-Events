import { CharityEvent } from './models';

const blank = (value: unknown): boolean => value == null || String(value).trim() === '';

/** Validate calendar values without interpreting them in the browser's timezone. */
function dateValue(value: unknown): number | null {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return null;
    const full = value.length === 16 ? value + ':00' : value;
    const date = new Date(full + 'Z');
    return Number(full.slice(0, 4)) >= 1000 && Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 19) === full ? date.getTime() : null;
}

/** Shared by New and Edit; return messages before making any write request. */
export function validateEventForm(model: Partial<CharityEvent>): string[] {
    const errors: string[] = [];
    for (const [field, label, max] of [
        ['event_name', 'Event name', 150], ['location', 'Location', 100],
        ['venue', 'Venue', 150], ['description', 'Description', Infinity],
        ['purpose', 'Purpose', Infinity]
    ] as const) {
        if (blank(model[field])) errors.push(`${label} is required.`);
        else if (String(model[field]).trim().length > max) errors.push(`${label} must be at most ${max} characters.`);
    }
    const start = dateValue(model.event_date);
    const end = blank(model.end_date) ? null : dateValue(model.end_date);
    if (start === null) errors.push('Please provide a valid event start date and time.');
    if (!blank(model.end_date) && end === null) errors.push('Please provide a valid event end date and time.');
    if (start !== null && end !== null && end <= start) errors.push('The end must be after the start.');
    for (const [field, label, max] of [
        ['ticket_price', 'Ticket price', 99999999.99],
        ['goal_amount', 'Fundraising goal', 9999999999.99],
        ['raised_amount', 'Raised amount', 9999999999.99]
    ] as const) {
        const value = model[field];
        if (!blank(value) && (!Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > max)) {
            errors.push(`${label} must be a number between 0 and ${max}.`);
        }
    }
    for (const field of ['org_id', 'category_id'] as const) {
        if (!Number.isSafeInteger(Number(model[field])) || Number(model[field]) < 1) {
            errors.push(field === 'org_id' ? 'Please choose an organisation.' : 'Please choose a category.');
        }
    }
    for (const [field, max] of [['latitude', 90], ['longitude', 180]] as const) {
        const value = model[field];
        if (!blank(value) && (!Number.isFinite(Number(value)) || Math.abs(Number(value)) > max)) {
            errors.push(`${field} must be a number between -${max} and ${max}.`);
        }
    }
    if (blank(model.latitude) !== blank(model.longitude)) errors.push('Provide both coordinates, or leave both empty.');
    if (model.image_url && model.image_url.length > 255) errors.push('Image URL must be at most 255 characters.');
    return errors;
}
