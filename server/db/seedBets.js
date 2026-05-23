const { getDb } = require('./index');

const DEFAULT_BALANCE = 10000;

async function seedBets() {
    const db = await getDb();

    const emailArg = process.argv.find((arg) => arg.startsWith('--email='));
    const email = emailArg ? emailArg.split('=')[1] : 'admin@ucla.edu';

    const user = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
        console.error(`No user found for email: ${email}`);
        process.exit(1);
    }

    const markets = await db.all(`
        SELECT id, market_name FROM markets
        ORDER BY id ASC
        LIMIT 4
    `);

    const outcomes = ['open', 'open', 'won', 'lost'];

    const plans = [];
    let totalDebit = 0;

    for (let i = 0; i < markets.length; i++) {
        const market = markets[i];
        const options = await db.all(
            'SELECT id, label FROM market_options WHERE market_id = ? ORDER BY id ASC',
            [market.id]
        );
        if (options.length < 2) continue;

        const pick = options[i % options.length];
        const other = options.find((o) => o.id !== pick.id);
        const amount = 100 * (i + 1);
        const outcome = outcomes[i] || 'open';

        plans.push({ market, pick, other, amount, outcome });
        totalDebit += amount;
    }

    await db.run('BEGIN');
    try {
        // Reset bets and balance when script is run
        await db.run('DELETE FROM bets WHERE user_id = ?', [user.id]);
        await db.run('UPDATE users SET balance = ? WHERE id = ?', [DEFAULT_BALANCE, user.id]);

        const DAY = 24 * 60 * 60 * 1000;

        for (const plan of plans) {
            if (plan.outcome === 'open') {
                const future = new Date(Date.now() + 7 * DAY).toISOString();
                await db.run(
                    "UPDATE markets SET status = 'open', winning_option_id = NULL, closes_at = ? WHERE id = ?",
                    [future, plan.market.id]
                );

                await db.run(
                    'INSERT INTO bets (user_id, market_id, option_id, amount) VALUES (?, ?, ?, ?)',
                    [user.id, plan.market.id, plan.pick.id, plan.amount]
                );
            } else {
                // Settled: placed 3 days ago, market closed 1 day ago.
                const placedAt = new Date(Date.now() - 3 * DAY).toISOString();
                const closedAt = new Date(Date.now() - 1 * DAY).toISOString();
                const winningId = plan.outcome === 'won' ? plan.pick.id : plan.other.id;

                await db.run(
                    'INSERT INTO bets (user_id, market_id, option_id, amount, created_at) VALUES (?, ?, ?, ?, ?)',
                    [user.id, plan.market.id, plan.pick.id, plan.amount, placedAt]
                );

                await db.run(
                    "UPDATE markets SET status = 'closed', winning_option_id = ?, closes_at = ? WHERE id = ?",
                    [winningId, closedAt, plan.market.id]
                );
            }
        }

        await db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [totalDebit, user.id]);
        await db.run('COMMIT');
    } catch (err) {
        await db.run('ROLLBACK');
        throw err;
    }

    const summary = plans.map((p) => `${p.market.market_name} (${p.outcome})`).join(', ');
    console.log(`Reset & inserted ${plans.length} bets for ${email} (debited $${totalDebit}): ${summary}`);
    process.exit(0);
}

seedBets().catch((err) => {
    console.error('Seed bets failed:', err);
    process.exit(1);
});
