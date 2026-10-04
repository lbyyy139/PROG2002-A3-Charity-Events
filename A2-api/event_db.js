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

const dbConfig = Object.assign({}, defaultConfig, localConfig);

// A pool serves several API requests without opening a new connection each time.
const pool = mysql.createPool(dbConfig);

/**
 * Runs a SQL query using the pool.
 * Values are bound with ? placeholders, so this is safe from SQL injection.
 */
async function query(sql, params) {
    const [rows] = await pool.execute(sql, params || []);
    return rows;
}

module.exports = { pool, query };
