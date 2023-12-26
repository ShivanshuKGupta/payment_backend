function validatePayoutTransferRequest(data) {
    requiredFields = [];
    if (!data) {
        return 'No data provided';
    } else if (!data.OrderID) {
        requiredFields.push('OrderID');
    } else if (!data.Name) {
        requiredFields.push('Name');
    }
    else if (!data.Amount) {
        requiredFields.push('Amount');
    }
    else if (!data.number) {
        requiredFields.push('number');
    }
    else if (!data.ifsc) {
        requiredFields.push('ifsc');
    }
    else if (!data.PaymentType) {
        requiredFields.push('PaymentType');
    }
    else if (!data.CustomerMobileNo) {
        requiredFields.push('CustomerMobileNo');
    }

    if (requiredFields.length > 0) {
        const errorMessage = `Missing required fields: ${requiredFields.join(', ')}`;
        return errorMessage;
    }

    extraFields = [];
    if (data.APIID) {
        extraFields.push('APIID');
    } else if (data.Token) {
        extraFields.push('Token');
    } else if (data.MethodName) {
        extraFields.push('MethodName');
    }

    if (extraFields.length > 0) {
        console.warn(`Extra fields found in the request: ${extraFields.join(', ')}`);
    }

    return null; // No missing required fields
}

module.exports = validatePayoutTransferRequest;
