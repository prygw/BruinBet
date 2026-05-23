const INITIAL_BALANCE = 10000;

const { getDb } = require("../db");
const express = require("express");
const bcrypt = require("bcrypt");
const { genToken } = require("../middleware/auth");

const router = express.Router();
const EMAIL_PATTERN = /^[^@\s]+@(?:g\.)?ucla\.edu$/i;
const USERNAME_PATTERN = /^[A-Z0-9a-z_.-]{3,20}$/;
const PASSWORD_MIN_LEN = 8;
const PASSWORD_MAX_LEN = 128;

function validateRegisterReqBody(body)
{
	const {email, password, username} = body;
	if (!email.trim()||!password||!username.trim())
		return "Email, username, and password, are all required.";
	if (email.length > 254)
		return "Email too large";
	//use ucla email
	if (!EMAIL_PATTERN.test(email.trim()))
		return "Email must be a UCLA email";
	if (password.length < PASSWORD_MIN_LEN || password.length > PASSWORD_MAX_LEN)
		return `Password must be between ${PASSWORD_MIN_LEN} and ${PASSWORD_MAX_LEN}`; 
	if (!USERNAME_PATTERN.test(username.trim()))
	{
		return "Username must be 3-20 characters that are, letters, numbers, _, ., or -";
	}
	return null;
}
function validateLoginReqBody(body)
{
	const {email,password} = body;
	if (!email || !password) return "Email and Password are required.";
	if (!EMAIL_PATTERN.test(email.trim())) return "Email must be a UCLA email";
	return null;
}

router.post("/register", async (req, res) => {
	try {
		if (validateRegisterReqBody(req.body))
			return res.status(400).json({error: "there is an error"});
		const { email, password, username } = req.body;
		if (!email || !password || !username) {
			return res.status(400).json({ error: "Email, password, and username are required." });
		}
		if (!EMAIL_PATTERN.test(email || "")) {
			return res.status(400).json({ error: "Use a UCLA email ending in @ucla.edu or @g.ucla.edu." });
		}
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

		const user = await db.get("SELECT id, email, username, balance, is_admin FROM users WHERE email = ?", [email]);

		//created new resource, ret 201 along w their JWT from the middleware
		res.status(201).json({ token: genToken(user.id), user });
	} catch (err) {
		res.status(500).json({ error: "Something went wrong with registration. Please try again." });
	}
});

router.post("/login", async (req, res) => {
	try {
		if (validateLoginReqBody(req.body))
			return res.status(400).json({error: "there is an error"});
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ error: "Email and password are required." });
		}
		const db = await getDb();
		const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
		//if no user w this email has been created we ret a generic message to avoid leaking information
		if (!user) {
			return res.status(401).json({ error: "Bad email or password" });
		}
		//check whether password is correct
		const pwCheck = await bcrypt.compare(password, user.password_hash);
		if (pwCheck) {
			const safeUser = { id: user.id, email: user.email, username: user.username, balance: user.balance, is_admin: user.is_admin };
			return res.json({ token: genToken(user.id), user: safeUser });
		}
		return res.status(401).json({ error: "Bad email or password" });
	} catch (err) {
		console.error("LOGIN ROUTE CRASH DETAILED ERROR:", err);
		return res.status(500).json({ error: "Something went wrong with login. Please try again." });
	}
});

module.exports = router;
