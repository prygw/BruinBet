const { getDb } = require('../db');

async function getPositionsByUser(userId) {
    const db = await getDb();
    return db.all(`SELECT bets.id as id_bet, bets.amount, bets.created_at, markets.id as id_market, markets.market_name, markets.description, markets.status, markets.closes_at, markets.winning_option_id, market_options.id as id_option, market_options.label as option_label FROM bets JOIN markets on markets.id = bets.market_id JOIN market_options on market_options.id = bets.option_id WHERE bets.user_id = ? ORDER BY bets.created_at DESC`, [userId]);
}

module.exports = { getPositionsByUser };
