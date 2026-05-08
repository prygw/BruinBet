const INITIAL_BALANCE = 1000;

const { getDb } = require("../server/db");
const express = require("express");
const bcrypt = require("bcrypt");
const { genToken } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
	try {
		//we take these to create the acct 
		const { email, password, username } = req.body;
		const hash = await bcrypt.hash(password, 10);
		const db = await getDb();

		// insert new user w/ default balance amt
		const balance = INITIAL_BALANCE;
		await db.run("INSERT INTO users (email, password_hash, username, balance) VALUES (?, ?, ?, ?)", [email, hash, username, balance]);

		//we can modify this based on what the frontend needs
		const user = await db.get("SELECT id, email, username, balance FROM users WHERE email = ?", [email]);

		// TODO: fix genToken
		const token = genToken(user);

		//created new resource, ret 201 along w their JWT from the middleware
		res.status(201).json({ token: genToken(user), user });
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
			return res.json({ token: genToken(user), user: user });
		}
		return res.status(401).json({ error: "Bad email or password" });
	} catch (err) {
		return res.status(500).json({ error: "Something went wrong with login. Please try again." });
	}
});

module.exports = router;


