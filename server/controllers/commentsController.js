const { getDb } = require('../db')

async function getCommentsByMarket(marketId) {
    const db = await getDb();
    return db.all(`SELECT comments.id, comments.body, comments.created_at, users.username FROM comments JOIN users ON users.id = comments.user_id WHERE comments.market_id = ? ORDER by comments.created_at DESC`, [marketId]);
}

async function getMarketById(marketId) {
    const db = await getDb();
    return db.get(`SELECT id FROM markets WHERE id = ?`, [marketId]);
}

async function insertComment(marketId, userId, body) {
    const db = await getDb();
    return db.run(`INSERT INTO comments (market_id, user_id, body) VALUES (?, ?, ?)`, [marketId, userId, body]);
}

async function getCommentById(id) {
    const db = await getDb();
    return db.get(`SELECT comments.id, comments.body, comments.created_at, users.username FROM comments JOIN users ON users.id = comments.user_id WHERE comments.id = ?`, [id]);
}

module.exports = { getCommentsByMarket, getMarketById, insertComment, getCommentById };
