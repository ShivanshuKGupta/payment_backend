const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const port = 3002;

const paymentOutServer = "https://ibrpay.com/api/PayoutLive.aspx"
const APIID = "API1022"
const Token = "2317f71d-ebc6-4acd-85b7-1b00f52b90df"

function print(...msg) {
    console.log(...msg);
}

const validatePayoutTransferRequest = require('./validations');

app.use(bodyParser.json());

app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// // Endpoint for payout transfer
// app.post('/payout-transfer', async (req, res) => {
//     print(`post request at /payout-transfer: `);
//     print(`req.body = `, req.body);
//     const err = validatePayoutTransferRequest(req.body);
//     if (err != null) {
//         console.error(err);
//         res.status(400).json({ error: err });
//         return;
//     }
//     req.body.APIID = APIID;
//     req.body.Token = Token;
//     req.body.MethodName = "payout";
//     try {
//         const response = await axios.post(paymentOutServer, req.body);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ error: `${error}` });
//         print("Error: ", error);
//     }
// });

// app.post('/callback', async (req, res) => {
//     print(`post request at /callback: `);
//     print(`req.body = `, req.body);
//     try {
//         // TODO: handle the callback here
//         res.status(200).json({
//             status: 'success',
//             message: 'Callback handled successfully',
//         });
//     } catch (error) {
//         res.status(500).json({ error: `${error}` });
//         print("Error: ", error);
//     }
// });

// app.post('/payout-status', async (req, res) => {
//     print(`post request at /payout-status: `);
//     print(`req.body = `, req.body);
//     const err = !req.body.OrderID ? "OrderID is required" : null;
//     if (err != null) {
//         console.error(err);
//         res.status(400).json({ error: err });
//         return;
//     }
//     req.body.APIID = APIID;
//     req.body.Token = Token;
//     req.body.MethodName = "checkstatus";
//     try {
//         const response = await axios.post(paymentOutServer, req.body);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ error: `${error}` });
//         print("Error: ", error);
//     }
// });

// Wallet Load --------------------------------

const walletLoadServer = "https://ibrpay.com/api/GetAmount.aspx";

// Endpoint for payout transfer
app.post('/payment-transfer', async (req, res) => {
    print(`post request at /payment-transfer: `);
    print(`req.body = `, req.body);
    var err = req.body.amount ? null : "amount is required";
    err = err || req.body.redirect_url ? null : "redirect_url is required";
    if (err != null) {
        console.error(err);
        res.status(400).json({ error: err });
        return;
    }
    req.body.APIID = APIID;
    req.body.Token = Token;
    req.body.MethodName = "collectionrequest";
    try {
        const response = await axios.post(walletLoadServer, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});

app.post('/payment-callback', async (req, res) => {
    print(`post request at /callback: `);
    print(`req.body = `, req.body);
    try {
        // TODO: handle the callback here
        res.status(200).json({
            status: 'success',
            message: 'Payment Callback handled successfully',
        });
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});

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
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: `${error}` });
        print("Error: ", error);
    }
});

// // Wallet Load --------------------------------

// const upiTransferServer = "https://ibrpay.com/api/UPITransferLive.aspx";

// // Endpoint for UPI Transfer
// app.post('/upi-transfer', async (req, res) => {
//     print(`post request at /upi-transfer: `);
//     print(`req.body = `, req.body);
//     var err = req.body.OrderID ? null : "OrderID is required";
//     err = err || req.body.Name ? null : "Name is required";
//     err = err || req.body.Amount ? null : "Amount is required";
//     err = err || req.body.vpa ? null : "vpa is required";
//     if (err != null) {
//         console.error(err);
//         res.status(400).json({ error: err });
//         return;
//     }
//     req.body.APIID = APIID;
//     req.body.Token = Token;
//     req.body.MethodName = "upitransfer";
//     try {
//         const response = await axios.post(upiTransferServer, req.body);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ error: `${error}` });
//         print("Error: ", error);
//     }
// });

// app.post('/upi-verification', async (req, res) => {
//     print(`post request at /upi-verification: `);
//     print(`req.body = `, req.body);
//     const err = !req.body.OrderID ? "OrderID is required" : null;
//     err = err || !req.body.vpa ? "vpa is required" : null;
//     if (err != null) {
//         console.error(err);
//         res.status(400).json({ error: err });
//         return;
//     }
//     req.body.APIID = APIID;
//     req.body.Token = Token;
//     req.body.MethodName = "verification";
//     try {
//         const response = await axios.post(upiTransferServer, req.body);
//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ error: `${error}` });
//         print("Error: ", error);
//     }
// });

// ========================================================
app.listen(port, () => {
    print(`Server is running on port ${port}`);
});
