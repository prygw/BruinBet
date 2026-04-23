const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/api/health', (req, res) => {
	res.json({message: 'healthy'});
});

app.listen(port, () => {
console.log(`server running on localhost:${port}`);
});
