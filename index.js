const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const { WalletloadTransaction, PayoutTransaction } = require('./models');
const { generateUniqueId } = require('./utils');
var admin = require("firebase-admin");
var serviceAccount = require(__dirname + "/garuda-matka-firebase-adminsdk-2j4af-0448bc81f6.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

const app = express();
const port = 3002;

const paymentOutServer = "https://ibrpay.com/api/PayoutLive.aspx";
const walletLoadServer = "https://ibrpay.com/api/GetAmount.aspx";
const APIID = "API1022"
const Token = "90c9e9ca-8762-41af-8ed9-cd78873d01eb"
// const Token = "2317f71d-ebc6-4acd-85b7-1b00f52b90df"

function print(...msg) {
    console.log(...msg);
}
function updateWallet(amountString, email, negate) {
    console.log(`updating wallet ${email}: ${amountString}`);
    var amount = parseFloat(amountString);
    if (negate) {
        amount = -amount;
    }
    if (isNaN(amount)) {
        console.error('Invalid amount:', amountString);
        return;
    }
    const userRef = firestore.collection('users').where('email', '==', email);
    userRef.get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const currentWallet = doc.data().wallet || 0;
                const newWallet = currentWallet + amount;
                doc.ref.update({ wallet: newWallet, updatedAt: new Date().toISOString() });
            });
        })
        .catch((error) => {
            console.error('Error updating wallet:', error);
        });
}

async function getWalletAmount(email) {
    const db = admin.firestore();
    try {
        const userRef = db.collection('users').where('email', '==', email);
        const querySnapshot = await userRef.get();
        if (querySnapshot.empty) {
            return 0;
        }
        const userDoc = querySnapshot.docs[0];
        const walletAmount = userDoc.data().wallet || 0;
        return walletAmount;
    } catch (error) {
        console.error('Error getting wallet amount:', error);
        throw error;
    }
}

async function checkPendingTransactionExists(email) {
    try {
        const existingTransaction = await PayoutTransaction.findOne({
            email: email,
            status: 'pending'
        });
        if (existingTransaction) {
            throw new Error('Pending transaction already exists for this email');
        }
    } catch (error) {
        console.error('Error checking pending transaction:', error);
        return false;
    }
    return true;
}

const validatePayoutTransferRequest = require('./validations');

app.use(bodyParser.json());

app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/redirect', async (req, res) => {
    res.sendFile(__dirname + '/redirect_page.html');
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
    const Amount = req.body.Amount;
    const email = req.body.email;
    const balance = await getWalletAmount(email);
    if (balance < Amount) {
        res.status(400).json({ error: "Insufficient Balance" });
        return;
    }
    req.body.APIID = APIID;
    req.body.Token = Token;
    req.body.MethodName = "payout";
    req.body.OrderID = generateUniqueId();
    if (!await checkPendingTransactionExists(email)) {
        res.status(400).json({ error: "Pending transaction already exists for this email" });
        return;
    }
    try {
        const response = await axios.post(paymentOutServer, req.body);
        // const response = {
        //     "data": {
        //         "code": "TXN",
        //         "status": "success",
        //         "mess": "success",
        //         "data": {
        //             "OrderID": req.body.OrderID,
        //             "Name": req.body.Name,
        //             "Amount": req.body.Amount,
        //             "Number": req.body.Number,
        //             "IFSC": req.body.IFSC,
        //             "Surcharge": req.body.Surcharge,
        //             "Status": "success",
        //             "STID": "Bank",
        //             "Message": "Bank",
        //             "RRN": "Bank"
        //         }
        //     }
        // };
        // console.log("response:", response);
        if (response.data.status == "success") {
            var txnData = response.data["data"];
            const transaction = new PayoutTransaction({
                email: email,
                status: "pending",
                ...txnData
            });
            await transaction.save();
        } else {
            console.log("payout not successful:", response.data);
        }
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
        const updateData = req.body.data;
        const OrderID = updateData["OrderID"];
        try {
            const foundTransaction = await PayoutTransaction.findOne({ OrderID: OrderID });
            if (!foundTransaction) {
                throw new Error('PayoutTransaction not found');
            }
            updateData.status = req.body.status;
            updateData.OrderID = foundTransaction.OrderID;
            if (updateData.status == "success" && foundTransaction.status != "success") {
                const amount = foundTransaction.Amount;
                const email = foundTransaction.email;
                updateWallet(amount, email, true);
            } else {
                console.error("Payout not successful:", updateData);
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
        if (response.data.status == "success") {
            const transaction = new WalletloadTransaction({
                email: email,
                status: "pending",
                ...txnData,
                OrderId: generateUniqueId(),
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
            if (updateData.status == "success" && foundTransaction.status != "success") {
                const amount = foundTransaction.OrderAmount;
                const email = foundTransaction.email;
                updateWallet(amount, email, false);
            } else {
                console.error("Payment not successful:", updateData);
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
