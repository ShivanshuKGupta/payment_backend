const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/matka', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).catch((error) => console.log("Mongoose Error:", error));

const walletloadTransactionSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    OrderKeyId: {
        type: String,
        required: true
    },
    OrderAmount: {
        type: String,
        required: true
    },
    OrderId: {
        type: String,
        required: true
    },
    OrderStatus: {
        type: String,
        required: false
    },
    OrderPaymentStatus: {
        type: String,
        required: false
    },
    OrderPaymentStatusText: {
        type: String,
        required: false
    },
    PaymentStatus: {
        type: String,
        required: false
    },
    PaymentTransactionId: {
        type: String,
        required: false
    },
    PaymentResponseCode: {
        type: String,
        required: false
    },
    PaymentTransactionRefNo: {
        type: String,
        required: false
    },
    PaymentResponseText: {
        type: String,
        required: false
    },
    PaymentMethod: {
        type: String,
        required: false
    },
    PaymentAccount: {
        type: String,
        required: false
    },
    PaymentDateTime: {
        type: String,
        required: false
    },
    UpdatedDateTime: {
        type: String,
        required: false
    },
    OrderPaymentTransactionDetail: {
        type: String,
        required: false
    },
    PaymentProcessUrl: {
        type: String,
        required: true
    }
});

const WalletloadTransaction = mongoose.model('WalletloadTransaction', walletloadTransactionSchema);

module.exports = { WalletloadTransaction };
