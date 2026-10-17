// Run: node --test tests/a3-requirements.test.cjs
// Real Express requests, with an isolated database test double (no live writes).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const ts = require(path.join(root, 'A3-adminside/node_modules/typescript'));

function loadTs(relativePath) {
    const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const exports = {};
    vm.runInNewContext(output, { exports, Date, Intl, Number, String, Math });
    return exports;
}

const adminDates = loadTs('A3-adminside/src/app/formatters.ts');
const clientDates = loadTs('A3-clientside/src/app/formatters.ts');
const { validateEventForm } = loadTs('A3-adminside/src/app/event-validation.ts');
const valid = {
    event_name: 'Test event', event_date: '2026-11-20T08:00:37', end_date: '2026-11-20T11:00:00',
    location: 'Gold Coast', venue: 'Test venue', description: 'Test description', purpose: 'Test cause',
    ticket_price: 20, goal_amount: 100, raised_amount: 0, org_id: 1, category_id: 1,
    latitude: null, longitude: null, is_suspended: 0
};

let queryImpl;
const dbPath = require.resolve(path.join(root, 'A3-api/event_db.js'));
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: {
    query: (...args) => queryImpl(...args)
} };
const originalNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = 'test';
const app = require(path.join(root, 'A3-api/server.js'));
if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
else process.env.NODE_ENV = originalNodeEnv;
let server, base;
before(async () => {
    await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
    base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
});
async function request(url, method = 'GET', body) {
    const response = await fetch(base + url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    return { status: response.status, body: await response.json() };
}

test('Suspended details are editable by admin but hidden on public details', async () => {
    queryImpl = async (sql) => {
        if (sql.includes('FROM registrations')) return [];
        return sql.includes('AND e.is_suspended = 0') ? [] : [{ event_id: 11, is_suspended: 1 }];
    };
    assert.equal((await request('/api/events/11')).status, 404);
    const admin = await request('/api/admin/events/11');
    assert.equal(admin.status, 200);
    assert.equal(admin.body.is_suspended, 1);
    assert.deepEqual(admin.body.registrations, []);
});

test('Public search always applies time and suspension filters, with bound user input', async () => {
    queryImpl = async (sql, params) => {
        assert.match(sql, /e\.is_suspended = 0 AND e\.event_date >= NOW\(\)/);
        assert.deepEqual(params, ['%Southport%', '%Southport%']);
        assert.ok(!sql.includes('Southport'));
        return [];
    };
    assert.equal((await request('/api/events/search?location=Southport')).status, 200);
});

for (const [label, changes] of [
    ['end before start', { end_date: '2026-11-19T08:00' }],
    ['end equal to start', { end_date: valid.event_date }],
    ['invalid calendar date', { event_date: '2026-02-30T08:00' }],
    ['invalid leap day', { event_date: '2027-02-29T08:00' }],
    ['invalid hour', { event_date: '2026-11-20T25:00' }],
    ['negative price', { ticket_price: -1 }],
    ['out-of-range latitude', { latitude: 91, longitude: 153 }],
    ['out-of-range longitude', { latitude: -28, longitude: -181 }],
    ['unpaired coordinates', { latitude: -28, longitude: null }],
    ['invalid organisation', { org_id: 0 }],
    ['missing required field', { purpose: '  ' }],
    ['overlong event name', { event_name: 'x'.repeat(151) }]
]) {
    test(`New and Edit reject ${label} before reaching the database`, async () => {
        const body = { ...valid, ...changes };
        assert.ok(validateEventForm(body).length > 0, 'client should reject the value');
        let calls = 0;
        queryImpl = async () => { calls++; throw new Error('Unexpected database access'); };
        assert.equal((await request('/api/events', 'POST', body)).status, 400);
        assert.equal((await request('/api/events/1', 'PUT', body)).status, 400);
        assert.equal(calls, 0);
    });
}

test('Valid event creation preserves null coordinates and second precision', async () => {
    assert.equal(validateEventForm(valid).length, 0);
    queryImpl = async (sql, params) => {
        assert.match(sql, /INSERT INTO events/);
        assert.equal(params[1], '2026-11-20 08:00:37');
        assert.equal(params[11], null);
        assert.equal(params[12], null);
        return { insertId: 25 };
    };
    assert.equal((await request('/api/events', 'POST', valid)).body.event_id, 25);
});

test('Zero is a valid coordinate, not an absent coordinate', async () => {
    const body = { ...valid, latitude: 0, longitude: 0 };
    assert.equal(validateEventForm(body).length, 0);
    queryImpl = async (sql, params) => {
        assert.equal(params[11], 0); assert.equal(params[12], 0);
        return { insertId: 26 };
    };
    assert.equal((await request('/api/events', 'POST', body)).status, 201);
});

test('Reading and saving an unchanged event preserves its Brisbane date and seconds in three host timezones', async () => {
    const previous = process.env.TZ;
    const iso = '2026-11-19T22:00:37.000Z';
    try {
        for (const zone of ['Asia/Shanghai', 'America/Los_Angeles', 'Australia/Sydney']) {
            process.env.TZ = zone;
            const local = adminDates.toDatetimeLocal(iso);
            assert.equal(local, '2026-11-20T08:00:37');
            assert.equal(clientDates.eventDateKey(iso), '2026-11-20');
            assert.match(clientDates.formatDate(iso), /8:00 am AEST/);
            queryImpl = async (sql, params) => {
                assert.match(sql, /UPDATE events/);
                assert.equal(params[1], '2026-11-20 08:00:37');
                assert.equal(new Date(params[1].replace(' ', 'T') + '+10:00').toISOString(), iso);
                return { affectedRows: 1 };
            };
            assert.equal((await request('/api/events/1', 'PUT', { ...valid, event_date: local })).status, 200);
        }
    } finally {
        if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
    }
});

test('Weather day uses Brisbane calendar date across UTC midnight', () => {
    assert.equal(clientDates.eventDateKey('2026-10-19T20:00:00.000Z'), '2026-10-20');
    assert.equal(adminDates.toDatetimeLocal('2026-10-19T14:00:00.000Z'), '2026-10-20T00:00:00');
});

test('Past and suspended events cannot show an open registration state', () => {
    assert.equal(clientDates.registrationOpen({ event_date: '2000-01-01T00:00:00Z', is_suspended: 0 }), false);
    const future = new Date(Date.now() + 86400000).toISOString();
    assert.equal(clientDates.registrationOpen({ event_date: future, is_suspended: 1 }), false);
    assert.equal(clientDates.registrationOpen({ event_date: future, is_suspended: 0 }), true);
});

test('Duplicate registration still returns 409 and preserves the unique-key rule', async () => {
    queryImpl = async (sql) => {
        if (sql.includes('INSERT INTO registrations')) throw Object.assign(new Error('Duplicate'), { code: 'ER_DUP_ENTRY' });
        return [{ event_id: 1 }];
    };
    const result = await request('/api/events/1/registrations', 'POST', {
        full_name: 'Test User', email: 'test@example.com', phone: '0400000000', ticket_count: 2
    });
    assert.equal(result.status, 409);
});

test('Registered events cannot be deleted, empty events can', async () => {
    let count = 2, deletes = 0;
    queryImpl = async (sql) => {
        if (sql.startsWith('DELETE')) { deletes++; return { affectedRows: 1 }; }
        if (sql.includes('COUNT(*)')) return [{ total: count }];
        return [{ event_id: 1 }];
    };
    assert.equal((await request('/api/events/1', 'DELETE')).status, 409);
    assert.equal(deletes, 0);
    count = 0;
    assert.equal((await request('/api/events/1', 'DELETE')).status, 200);
    assert.equal(deletes, 1);
});

test('MySQL driver and each query session use the same timezone; connections release on failure', async () => {
    let config, released = 0, fail = false;
    const calls = [];
    const connection = {
        query: async (sql) => calls.push(sql),
        execute: async () => { if (fail) throw new Error('query failed'); return [[{ ok: true }]]; },
        release: () => released++
    };
    const context = { module: { exports: {} }, require: (name) => {
        if (name === 'mysql2/promise') return { createPool: (input) => {
            config = input; return { getConnection: async () => connection };
        } };
        if (name === './db-config.js') return { timezone: 'local', dateStrings: true };
        throw new Error(name);
    } };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'A3-api/event_db.js'), 'utf8'), context);
    const db = context.module.exports;
    assert.equal(config.timezone, '+10:00');
    assert.equal(config.dateStrings, false);
    await db.query('SELECT 1');
    fail = true;
    await assert.rejects(db.query('SELECT 2'), /query failed/);
    assert.deepEqual(calls, ["SET time_zone = '+10:00'", "SET time_zone = '+10:00'"]);
    assert.equal(released, 2);
});
