const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = 3002;

const paymentServer = "https://ibrpay.com/api/PayoutLive.aspx"
const APIID = "API1022"
const Token = ""

function print(...msg) {
    console.log(...msg);
}

const validatePayoutTransferRequest = require('./validations');

app.use(bodyParser.json());

app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Endpoint for payout transfer
app.post('/payout-transfer', async (req, res) => {
    print(`post request at /payment-transfer: `);
    print(`req.body = `, req.body);
    const err = validatePayoutTransferRequest(req.body);
    if (err != null) {
        console.error(err);
        res.status(400).json({ error: err });
        return;
    }
    req.body.APIID = APIID;
    req.body.Token = Token;
    req.body.MethodName = "payout";
    try {
        const response = await axios.post(paymentServer, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});

app.post('/callback', async (req, res) => {
    print(`post request at /callback: `);
    print(`req.body = `, req.body);
    try {
        // TODO: handle the callback here
        res.status(200).json({
            status: 'success',
            message: 'Callback handled successfully',
        });
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});

app.post('/payout-status', async (req, res) => {
    print(`post request at /payout-status: `);
    print(`req.body = `, req.body);
    const err = !req.body.OrderID ? "OrderID is required" : null;
    if (err != null) {
        console.error(err);
        res.status(400).json({ error: err });
        return;
    }
    req.body.APIID = APIID;
    req.body.Token = Token;
    req.body.MethodName = "checkstatus";
    try {
        const response = await axios.post(paymentServer, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});

app.listen(port, () => {
    print(`Server is running on port ${port}`);
});
