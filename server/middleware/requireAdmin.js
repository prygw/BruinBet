const { getDb } = require("../db");

const requireAdmin = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const db = await getDb();
        const user = await db.get("SELECT is_admin FROM users WHERE id = ?", [req.userId]);

        if (!user || !user.is_admin) {
            return res.status(403).json({ error: "Admin access required" });
        }

        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error with admin verification" });
    }
};

module.exports = { requireAdmin };
