const { getDb } = require('./index');

async function seed() {
    const db = await getDb();

    const adminEmail = 'admin@ucla.edu';
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [adminEmail]);

    let adminId;
    if (existing) {
        adminId = existing.id;
    } else {
        const result = await db.run(
            'INSERT INTO users (email, password_hash, username, balance, is_admin) VALUES (?, ?, ?, ?, ?)',
            [adminEmail, 'seedhash', 'admin', 10000, 1]
        );
        adminId = result.lastID;
    }

    const markets = [
        {
            market_name: 'UCLA beats USC this season',
            description: 'Will UCLA defeat USC in their next matchup?',
            category: 'Sports',
            closes_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            options: ['Yes', 'No'],
        },
        {
            market_name: 'Ackerman lines under 20 min on Friday',
            description: 'Will the Ackerman dining hall lines stay under 20 minutes this Friday?',
            category: 'Campus',
            closes_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            options: ['Yes', 'No'],
        },
        {
            market_name: 'Bruins finish top 3 in the conference',
            description: 'Will the Bruins finish in the top 3 of their conference this season?',
            category: 'Sports',
            closes_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            options: ['Yes', 'No'],
        },
        {
            market_name: 'CS35L final project avg grade above 90',
            description: 'Will the class average on the CS35L final project exceed 90?',
            category: 'Academics',
            closes_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            options: ['Yes', 'No'],
        },
        {
            market_name: 'Powell Library open past midnight during finals',
            description: 'Will Powell Library extend hours past midnight during finals week?',
            category: 'Campus',
            closes_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
            options: ['Yes', 'No'],
        },
        {
            market_name: 'UCLA ranked top 10 public university this year',
            description: 'Will UCLA maintain a top 10 ranking among US public universities?',
            category: 'Academics',
            closes_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            options: ['Yes', 'No'],
        },
        {
            market_name: 'It rains in LA before end of May',
            description: 'Will there be measurable rainfall in Los Angeles before June 1st?',
            category: 'Weather',
            closes_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            options: ['Yes', 'No'],
        },
        {
            market_name: 'Bruin Plate adds a new cuisine this quarter',
            description: 'Will Bruin Plate introduce a new cuisine station this quarter?',
            category: 'Campus',
            closes_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            options: ['Yes', 'No'],
        },
        {
            market_name: 'UCLA mens basketball makes the tournament next season',
            description: 'Will UCLA mens basketball qualify for March Madness next season?',
            category: 'Sports',
            closes_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            options: ['Yes', 'No'],
        },
    ];

    for (const market of markets) {
        const exists = await db.get('SELECT id FROM markets WHERE market_name = ?', [market.market_name]);
        if (exists) continue;

        const result = await db.run(
            'INSERT INTO markets (market_name, description, category, closes_at, created_by) VALUES (?, ?, ?, ?, ?)',
            [market.market_name, market.description, market.category, market.closes_at, adminId]
        );

        for (const label of market.options) {
            await db.run(
                'INSERT INTO market_options (market_id, label) VALUES (?, ?)',
                [result.lastID, label]
            );
        }
    }

    console.log('Seed complete.');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
