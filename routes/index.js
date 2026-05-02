const express = require('express');
const healthRouter = require('./health');
const marketsRouter = require('./markets');

const app = express();
const port = 5001;

app.get('/', (req, res) => {
    res.send('Main page!');
});

app.use('/', healthRouter);
app.use('/api/markets', marketsRouter);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

module.exports = app;
