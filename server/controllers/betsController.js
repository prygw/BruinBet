const { getDb } = require('../db');

async function getMarketById(marketId) {
    const db = await getDb();
    return db.get('SELECT * FROM markets WHERE id = ?', [marketId]);
}

async function getMarketOption(optionId, marketId) {
    const db = await getDb();
    return db.get(
        'SELECT id, label FROM market_options WHERE id = ? AND market_id = ?',
        [optionId, marketId]
    );
}

async function getUserBalance(userId) {
    const db = await getDb();
    return db.get('SELECT balance, is_admin FROM users WHERE id = ?', [userId]);
}

async function beginTransaction() {
    const db = await getDb();
    return db.run('BEGIN');
}

async function deductBalance(userId, amount) {
    const db = await getDb();
    return db.run(
        'UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?',
        [amount, userId, amount]
    );
}

async function rollback() {
    const db = await getDb();
    return db.run('ROLLBACK');
}

async function insertBet(userId, marketId, optionId, amount) {
    const db = await getDb();
    return db.run(
        'INSERT INTO bets (user_id, market_id, option_id, amount) VALUES (?, ?, ?, ?)',
        [userId, marketId, optionId, amount]
    );
}

async function commit() {
    const db = await getDb();
    return db.run('COMMIT');
}

async function getPositionCount(userId, marketId) {
    const db = await getDb();
    return db.get(
        'SELECT COUNT(*) AS position_count FROM bets WHERE user_id = ? AND market_id = ?',
        [userId, marketId]
    );
}

module.exports = {
    getMarketById,
    getMarketOption,
    getUserBalance,
    beginTransaction,
    deductBalance,
    rollback,
    insertBet,
    commit,
    getPositionCount,
};
