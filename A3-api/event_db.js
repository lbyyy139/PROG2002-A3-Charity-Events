/**
 * event_db.js - MySQL connection module for charityevents_db (PROG2002 A2)
 * Author: Boyu Liu (24832407)
 * Creates a reusable connection pool shared by every API route.
 * Credentials are read from db-config.js (git-ignored, never committed);
 * the placeholder values below are used as a fallback if that file is absent.
 */

const mysql = require('mysql2/promise');

const defaultConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'your_password',    // <-- change this to your MySQL password
    database: 'charityevents_db', // created from charityevents_db.sql
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let localConfig = {};
try {
    localConfig = require('./db-config.js');
} catch (err) {
    // No local config file - fall back to the placeholder configuration above
}

// Event DATETIME values are wall-clock times in Queensland (AEST, UTC+10).
// Force the same interpretation regardless of the Node host's local timezone.
const dbConfig = Object.assign({}, defaultConfig, localConfig, {
    timezone: '+10:00',
    dateStrings: false
});

// A pool serves several API requests without opening a new connection each time.
const pool = mysql.createPool(dbConfig);

/**
 * Runs a SQL query using the pool.
 * Values are bound with ? placeholders, so this is safe from SQL injection.
 */
async function query(sql, params) {
    const connection = await pool.getConnection();
    try {
        // Align NOW() and TIMESTAMP values with the driver's DATETIME handling.
        // Set this on the checked-out connection, including newly created ones.
        await connection.query("SET time_zone = '+10:00'");
        const [rows] = await connection.execute(sql, params || []);
        return rows;
    } finally {
        connection.release();
    }
}

module.exports = { pool, query };
