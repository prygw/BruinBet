const { getDb } = require('../db');

async function expireClosedMarkets() {
    const db = await getDb();

    // markets that are closed but not yet counted as expired
    const closedMarkets = await db.all(
        `SELECT m.id, m.winning_id 
     FROM markets m 
     WHERE m.closes_at <= datetime('now') 
     AND m.expired = 0`
    );

    console.log(`found ${closedMarkets.length} markets to expire`);

    for (const market of closedMarkets) {
        await expireMarket(db, market);
    }
}

async function expireMarket(db, market) {
    const { id: marketId, winning_id } = market;

    const bets = await db.all(
        `SELECT * FROM bets WHERE market_id = ?`,
        [marketId]
    );

    // get winning bets and all money spent on bets
    const winningBets = bets.filter(bet => bet.option_id === winning_id);
    const sumWinningBets = winningBets.reduce((sum, bet) => sum + bet.amount, 0);
    const sumAllBets = bets.reduce((sum, bet) => sum + bet.amount, 0);

    // logic:
    // winning bets get money proportional to how much money they put in
    // per dollar, calculate payout as (total money spent on bets) / (total money spent on winning bets)
    for (const bet of winningBets) {
        const proportion = bet.amount / sumWinningBets;
        const payout = Math.floor(sumAllBets * proportion);

        await db.run(
            `UPDATE users SET balance = balance + ? WHERE id = ?`,
            [payout, bet.user_id]
        );

        console.log(`User ${bet.user_id}: bet ${bet.amount}, won ${payout}`);
    }

    // money added for expired market, so mark market as expired
    await db.run(
        `UPDATE markets SET expired = 1, expired_at = datetime('now') WHERE id = ?`,
        [marketId]
    );

    console.log(`market ${marketId} expired`);
}

module.exports = { expireClosedMarkets, expireMarket };
