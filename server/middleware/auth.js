const jwt = require("jsonwebtoken");
//takes user id (string) as input and returns a signed jwt 
function genToken(userid) {
	return jwt.sign({id: userid}, process.env.JWT_SECRET);
}
function checkAuth(req, res, next) {
	//if a path requires auth, the api reqs must contain an auth header with a signed jwt
	const header = req.headers.authorization;
	if (!header || !header.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Authentication required. Log in and try again." });
	}
	//if it does exist, and is in proper format: "Bearer [jwt]", we process it
	try {
		const token = header.split(" ")[1];
		req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
		next();
	}
	catch (err) {
		return res.status(401).json({ error: "Authentication token is invalid or expired" });
	}
}

module.exports = { genToken, checkAuth };
