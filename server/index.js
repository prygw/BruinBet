const express = require('express');
const cors = require('cors');
const apiRouter = require('../routes');
require('dotenv').config()

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

//verify ucla email address
function validateEmail(email) {
	const regex = /^[a-zA-Z0-9._%+-]+@ucla\.edu$/i;
	return regex.test(email);
}

app.get('/', (req, res) => {
	res.send('API is running!');
});

app.use('/api', apiRouter);

app.listen(port, () => {
	console.log(`server running on localhost:${port}`);
});
