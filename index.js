const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const { WalletloadTransaction } = require('./models');
const { generateUniqueId } = require('./utils');

const app = express();
const port = 3002;

const paymentOutServer = "https://ibrpay.com/api/PayoutLive.aspx"
const walletLoadServer = "https://ibrpay.com/api/GetAmount.aspx";
const APIID = "API1022"
const Token = "77dcfb79-92a3-41c0-bb03-9ddd0b800130"
// const Token = "2317f71d-ebc6-4acd-85b7-1b00f52b90df"

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
    print(`post request at /payout-transfer: `);
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
        const response = await axios.post(paymentOutServer, req.body);
        console.log("response:", response);
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
        const response = await axios.post(paymentOutServer, req.body);
        console.log("response:", response);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});

// Wallet Load --------------------------------
// Endpoint for payout transfer
// WORKING....
app.post('/payment-transfer', async (req, res) => {
    print(`post request at /payment-transfer: `);
    print(`req.body = `, req.body);
    var err = req.body.amount ? null : "amount is required";
    err = err || req.body.redirect_url ? null : "redirect_url is required";
    err = err || req.body.email ? null : "email is required";
    if (err != null) {
        console.error(err);
        res.status(400).json({ error: err });
        return;
    }
    const email = req.body.email;
    req.body.APIID = APIID;
    req.body.Token = Token;
    req.body.MethodName = "collectionrequest";
    try {
        const response = await axios.post(walletLoadServer, req.body);
        // console.log("response:", response);
        var txnData = response.data["data"];
        txnData.OrderId = generateUniqueId();
        if (response.data.status == "success") {
            const transaction = new WalletloadTransaction({
                email: email,
                status: "pending",
                ...txnData
            });
            await transaction.save();
        }
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});

// WORKING....
app.post('/payment-callback', async (req, res) => {
    print(`post request at /payment-callback: `);
    print(`req.body = `, req.body);
    try {
        const updateData = req.body.data;
        const orderKeyId = updateData["OrderKeyId"];

        try {
            const foundTransaction = await WalletloadTransaction.findOne({ OrderKeyId: orderKeyId });
            if (!foundTransaction) {
                throw new Error('WalletloadTransaction not found');
            }
            updateData.status = req.body.status;
            updateData.OrderId = foundTransaction.OrderId;
            if (updateData.status == "success") {
                const amount = foundTransaction.OrderAmount;
                const email = foundTransaction.email;
                // update wallet amount onto firestore
            }
            Object.assign(foundTransaction, updateData);
            await foundTransaction.save();
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: `${error}` });
            return;
        }
        res.status(200).json({
            status: 'success',
            message: 'Payment Callback handled successfully',
        });
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});

// NOT - TESTED
app.post('/payment-status', async (req, res) => {
    print(`post request at /payment-status: `);
    print(`req.body = `, req.body);
    const err = !req.body.amount ? "amount is required" : null;
    err = err || !req.body.OrderKeyId ? "OrderKeyId is required" : null;
    if (err != null) {
        console.error(err);
        res.status(400).json({ error: err });
        return;
    }
    req.body.APIID = APIID;
    req.body.Token = Token;
    req.body.MethodName = "CheckStatus";
    try {
        const response = await axios.post(walletLoadServer, req.body);
        console.log("response:", response);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});

// Upi Transfer --------------------------------
const upiTransferServer = "https://ibrpay.com/api/UPITransferLive.aspx";

// Endpoint for UPI Transfer
app.post('/upi-transfer', async (req, res) => {
    print(`post request at /upi-transfer: `);
    print(`req.body = `, req.body);
    var err = req.body.OrderID ? null : "OrderID is required";
    err = err || req.body.Name ? null : "Name is required";
    err = err || req.body.Amount ? null : "Amount is required";
    err = err || req.body.vpa ? null : "vpa is required";
    if (err != null) {
        console.error(err);
        res.status(400).json({ error: err });
        return;
    }
    req.body.APIID = APIID;
    req.body.Token = Token;
    req.body.MethodName = "upitransfer";
    try {
        const response = await axios.post(upiTransferServer, req.body);
        console.log("response:", response);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});

app.post('/upi-callback', async (req, res) => {
    print(`post request at /upi-callback: `);
    print(`req.body = `, req.body);
    try {
        // TODO: handle the callback here
        res.status(200).json({
            status: 'success',
            message: 'Upi Callback handled successfully',
        });
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});


app.post('/upi-verification', async (req, res) => {
    print(`post request at /upi-verification: `);
    print(`req.body = `, req.body);
    const err = !req.body.OrderID ? "OrderID is required" : null;
    err = err || !req.body.vpa ? "vpa is required" : null;
    if (err != null) {
        console.error(err);
        res.status(400).json({ error: err });
        return;
    }
    req.body.APIID = APIID;
    req.body.Token = Token;
    req.body.MethodName = "verification";
    try {
        const response = await axios.post(upiTransferServer, req.body);
        console.log("response:", response);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});

// ========================================================
app.listen(port, () => {
    print(`Server is running on port ${port}`);
});
