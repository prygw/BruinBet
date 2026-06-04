const { getDb } = require("../db");

async function createUser(email, hash, username, balance) {
    const db = await getDb();
    return db.run("INSERT INTO users (email, password_hash, username, balance) VALUES (?, ?, ?, ?)", [email, hash, username, balance]);
}

async function getUserByEmail(email) {
    const db = await getDb();
    return db.get("SELECT * FROM users WHERE email = ?", [email]);
}

async function getSafeUserByEmail(email) {
    const db = await getDb();
    return db.get("SELECT id, email, username, balance, is_admin FROM users WHERE email = ?", [email]);
}

async function getSafeUserById(id) {
    const db = await getDb();
    return db.get("SELECT id, email, username, balance, is_admin FROM users WHERE id = ?", [id]);
}

module.exports = { createUser, getUserByEmail, getSafeUserByEmail, getSafeUserById };
