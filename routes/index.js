const express = require('express');
const healthRouter = require('./health');

const app = express();
const port = 5001;

app.get('/', (req, res) => {
    res.send('Main page!');
});

app.use('/', healthRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

module.exports = app;
