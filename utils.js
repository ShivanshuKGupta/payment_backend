function generateUniqueId() {
    // Get the current timestamp
    const timestamp = new Date().getTime();

    // Generate a random unique identifier (in this case, a random number)
    const uniqueId = Math.floor(Math.random() * 1000000);

    // Concatenate timestamp and uniqueId to create the OrderId
    const orderId = `${timestamp}${uniqueId}`;

    return orderId;
}


module.exports = { generateUniqueId };