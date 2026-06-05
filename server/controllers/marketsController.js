const { getDb } = require('../db');

async function getMarketSummary(marketId) {
    const db = await getDb();
    return db.get(`
        SELECT
            markets.*,
            (
                SELECT COALESCE(SUM(amount), 0)
                FROM bets
                WHERE bets.market_id = markets.id
            ) AS total_liquidity,
            (
                SELECT COUNT(*)
                FROM bets
                WHERE bets.market_id = markets.id
            ) AS bet_count
        FROM markets
        WHERE markets.id = ?
    `, [marketId]);
}

async function getMarketOptionsWithLiquidity(marketId) {
    const db = await getDb();
    return db.all(`
        SELECT
            market_options.*,
            COALESCE(SUM(bets.amount), 0) AS total_liquidity,
            COUNT(bets.id) AS bet_count
        FROM market_options
        LEFT JOIN bets ON bets.option_id = market_options.id
        WHERE market_options.market_id = ?
        GROUP BY market_options.id
        ORDER BY market_options.id ASC
    `, [marketId]);
}

async function getMarketCreatedAt(marketId) {
    const db = await getDb();
    return db.get("SELECT id, created_at FROM markets WHERE id = ?", [marketId]);
}

async function getMarketOptions(marketId) {
    const db = await getDb();
    return db.all(
        "SELECT id, label FROM market_options WHERE market_id = ? ORDER BY id ASC",
        [marketId]
    );
}

async function getMarketBets(marketId) {
    const db = await getDb();
    return db.all(`
        SELECT option_id, amount, created_at
        FROM bets
        WHERE market_id = ?
        ORDER BY datetime(created_at) ASC, id ASC
    `, [marketId]);
}

async function getAllMarketsSummary() {
    const db = await getDb();
    return db.all(`
            SELECT
                markets.*,
                (
                    SELECT COUNT(*)
                    FROM market_options
                    WHERE market_options.market_id = markets.id
                ) AS option_count,
                (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM bets
                    WHERE bets.market_id = markets.id
                ) AS total_liquidity,
                (
                    SELECT COUNT(*)
                    FROM bets
                    WHERE bets.market_id = markets.id
                ) AS bet_count
            FROM markets
            ORDER BY created_at DESC
        `);
}

async function getOptionsWithLiquidityForMarkets(marketIds) {
    const db = await getDb();
    const questonMarks = marketIds.map(() => '?').join(',');
    return db.all(
        `SELECT
                market_options.id,
                market_options.market_id,
                market_options.label,
                COALESCE(SUM(bets.amount), 0) AS total_liquidity,
                COUNT(bets.id) AS bet_count
            FROM market_options
            LEFT JOIN bets ON bets.option_id = market_options.id
            WHERE market_options.market_id IN (${questonMarks})
            GROUP BY market_options.id
            ORDER BY market_options.id ASC`,
        marketIds
    );
}

async function getMarketById(marketId) {
    const db = await getDb();
    return db.get("SELECT * FROM markets WHERE id = ?", [marketId]);
}

async function getBetCount(marketId) {
    const db = await getDb();
    return db.get("SELECT COUNT(*) AS bet_count FROM bets WHERE market_id = ?", [marketId]);
}

async function getRefundsByUser(marketId) {
    const db = await getDb();
    return db.all(
        `SELECT user_id, SUM(amount) AS amount
             FROM bets
             WHERE market_id = ?
             GROUP BY user_id
             ORDER BY user_id ASC`,
        [marketId]
    );
}

async function getMarketOptionById(optionId, marketId) {
    const db = await getDb();
    return db.get(
        "SELECT id, label FROM market_options WHERE id = ? AND market_id = ?",
        [optionId, marketId]
    );
}

async function getMarketPool(marketId) {
    const db = await getDb();
    return db.get(
        `SELECT COALESCE(SUM(amount), 0) AS total_pool
             FROM bets
             WHERE market_id = ?`,
        [marketId]
    );
}

async function getWinningBets(marketId, winningOptionId) {
    const db = await getDb();
    return db.all(
        `SELECT user_id, SUM(amount) AS amount
             FROM bets
             WHERE market_id = ? AND option_id = ?
             GROUP BY user_id
             ORDER BY user_id ASC`,
        [marketId, winningOptionId]
    );
}

async function beginTransaction() {
    const db = await getDb();
    return db.run("BEGIN");
}

async function commit() {
    const db = await getDb();
    return db.run("COMMIT");
}

async function rollback() {
    const db = await getDb();
    return db.run("ROLLBACK");
}

async function insertMarket(marketName, description, category, closesAt, createdBy) {
    const db = await getDb();
    return db.run(
        `
                INSERT INTO markets (market_name, description, category, closes_at, created_by)
                VALUES (?, ?, ?, ?, ?)
            `,
        [marketName, description, category, closesAt, createdBy]
    );
}

async function insertMarketOption(marketId, label) {
    const db = await getDb();
    return db.run(
        "INSERT INTO market_options (market_id, label) VALUES (?, ?)",
        [marketId, label]
    );
}

async function updateMarket(marketName, description, category, closesAt, marketId) {
    const db = await getDb();
    return db.run(
        `UPDATE markets
             SET market_name = ?, description = ?, category = ?, closes_at = ?
             WHERE id = ?`,
        [marketName, description, category, closesAt, marketId]
    );
}

async function updateMarketOptionLabel(label, optionId, marketId) {
    const db = await getDb();
    return db.run(
        "UPDATE market_options SET label = ? WHERE id = ? AND market_id = ?",
        [label, optionId, marketId]
    );
}

async function deleteMarketOptions(marketId) {
    const db = await getDb();
    return db.run("DELETE FROM market_options WHERE market_id = ?", [marketId]);
}

async function addToUserBalance(amount, userId) {
    const db = await getDb();
    return db.run(
        "UPDATE users SET balance = balance + ? WHERE id = ?",
        [amount, userId]
    );
}

async function deleteBetsByMarket(marketId) {
    const db = await getDb();
    return db.run("DELETE FROM bets WHERE market_id = ?", [marketId]);
}

async function clearWinningOption(marketId) {
    const db = await getDb();
    return db.run("UPDATE markets SET winning_option_id = NULL WHERE id = ?", [marketId]);
}

async function deleteMarket(marketId) {
    const db = await getDb();
    return db.run("DELETE FROM markets WHERE id = ?", [marketId]);
}

async function resolveMarket(winningOptionId, marketId) {
    const db = await getDb();
    return db.run(
        "UPDATE markets SET status = 'closed', winning_option_id = ? WHERE id = ?",
        [winningOptionId, marketId]
    );
}

module.exports = {
    getMarketSummary,
    getMarketOptionsWithLiquidity,
    getMarketCreatedAt,
    getMarketOptions,
    getMarketBets,
    getAllMarketsSummary,
    getOptionsWithLiquidityForMarkets,
    getMarketById,
    getBetCount,
    getRefundsByUser,
    getMarketOptionById,
    getMarketPool,
    getWinningBets,
    beginTransaction,
    commit,
    rollback,
    insertMarket,
    insertMarketOption,
    updateMarket,
    updateMarketOptionLabel,
    deleteMarketOptions,
    addToUserBalance,
    deleteBetsByMarket,
    clearWinningOption,
    deleteMarket,
    resolveMarket,
};
