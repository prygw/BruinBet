const { getDb } = require("../db");

async function requireAdmin(req, res, next)
{
    try {
        if (req.userId)
        {
            const db = await getDb();
            const user = await db.get("SELECT is_admin from users WHERE id=?", [req.userId]);
            if (!user || !user.is_admin)
            {
                return res.status(403).json({error: "Admin Access required."})
            }
            next();
        }
    }
    catch(err) {
        return res.status(500).json({error: "Not admin."});
    }
}

module.exports = { requireAdmin };
