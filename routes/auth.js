const INITIAL_BALANCE = 1000;

const { getDb } = require("../server/db");
const express = require("express");
const bcrypt = require("bcrypt");
const { genToken } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
	try {
		const { email, password, username } = req.body;
		const hash = await bcrypt.hash(password, 10);
		const db = await getDb();

		// insert new user w/ default balance amt
		const balance = INITIAL_BALANCE;
		try {
			await db.run("INSERT INTO users (email, password_hash, username, balance) VALUES (?, ?, ?, ?)", [email, hash, username, balance]);
		} catch (err) {
			if (err && err.code === "SQLITE_CONSTRAINT") {
				return res.status(409).json({ error: "An account with that email already exists." });
			}
			throw err;
		}

		const user = await db.get("SELECT id, email, username, balance FROM users WHERE email = ?", [email]);

		//created new resource, ret 201 along w their JWT from the middleware
		res.status(201).json({ token: genToken(user.id), user });
	} catch (err) {
		res.status(500).json({ error: "Something went wrong with registration. Please try again." });
	}
});

router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;
		const db = await getDb();
		const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
		//if no user w this email has been created we ret a generic message to avoid leaking information
		if (!user) {
			return res.status(401).json({ error: "Bad email or password" });
		}
		//check whether password is correct
		const pwCheck = await bcrypt.compare(password, user.password_hash);
		if (pwCheck) {
			const safeUser = { id: user.id, email: user.email, username: user.username, balance: user.balance };
			return res.json({ token: genToken(user.id), user: safeUser });
		}
		return res.status(401).json({ error: "Bad email or password" });
	} catch (err) {
		return res.status(500).json({ error: "Something went wrong with login. Please try again." });
	}
});

module.exports = router;


