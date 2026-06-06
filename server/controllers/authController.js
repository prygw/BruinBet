const { getDb } = require('../db');

async function createUser(email, hash, username, balance) {
    const db = await getDb();
    return db.run(
        'INSERT INTO users (email, password_hash, username, balance) VALUES (?, ?, ?, ?)',
        [email, hash, username, balance],
    );
}

async function getUserByEmail(email) {
    const db = await getDb();
    return db.get('SELECT * FROM users WHERE email = ?', [email]);
}

async function getSafeUserByEmail(email) {
    const db = await getDb();
    return db.get('SELECT id, email, username, balance, is_admin FROM users WHERE email = ?', [email]);
}

async function getSafeUserById(id) {
    const db = await getDb();
    return db.get('SELECT id, email, username, balance, is_admin FROM users WHERE id = ?', [id]);
}

async function deleteUserAccount(id) {
    const db = await getDb();
    let transactionStarted = false;

    try {
        const user = await db.get('SELECT id, is_admin FROM users WHERE id = ?', [id]);
        if (!user) {
            return null;
        }

        if (user.is_admin) {
            return { blocked: true };
        }

        await db.run('BEGIN');
        transactionStarted = true;

        const comments = await db.run('DELETE FROM comments WHERE user_id = ?', [id]);
        const bets = await db.run('DELETE FROM bets WHERE user_id = ?', [id]);
        const users = await db.run('DELETE FROM users WHERE id = ?', [id]);

        await db.run('COMMIT');
        transactionStarted = false;

        return {
            deleted_user_id: id,
            deleted_comments: comments.changes || 0,
            deleted_bets: bets.changes || 0,
            deleted_users: users.changes || 0,
        };
    } catch (err) {
        if (transactionStarted) {
            await db.run('ROLLBACK');
        }

        throw err;
    }
}

module.exports = { createUser, getUserByEmail, getSafeUserByEmail, getSafeUserById, deleteUserAccount };
