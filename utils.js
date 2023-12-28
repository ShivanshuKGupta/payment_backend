function generateUniqueId() {
    const timestamp = new Date().getTime();
    const uniqueId = Math.floor(Math.random() * 1000000);
    const orderId = `${timestamp}${uniqueId}`;
    console.log("generated id", orderId);
    return orderId;
}


module.exports = { generateUniqueId };