const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const DB_PATH = path.join(__dirname, '..', 'bruinbet.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let dbPromise = null;

function getDb() {
    if (!dbPromise) {
        dbPromise = (async() => {
            const db = await sqlite.open({
                filename: DB_PATH,
                driver: sqlite3.Database
            });
            await db.exec('PRAGMA foreign_keys = ON');
            const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
            await db.exec(schema);
            return db;
        })();
    }
    return dbPromise;
}

module.exports = { getDb };