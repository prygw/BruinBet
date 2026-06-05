const { getDb } = require('../db');

async function getLeaderboard() {
    const db = await getDb();
    return db.all(`SELECT users.id, users.username, users.balance, COALESCE(SUM(bets.amount), 0) as total_bet_amount, COUNT(bets.id) as bet_count FROM users LEFT JOIN bets on bets.user_id = users.id WHERE users.username != 'admin' GROUP BY users.id HAVING COUNT(bets.id) > 0 ORDER BY users.balance DESC, total_bet_amount DESC`);
}

module.exports = { getLeaderboard };
