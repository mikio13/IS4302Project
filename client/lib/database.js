const { MongoClient, ObjectId } = require("mongodb");

let client = null;
let collectionUsers = null;
let collectionTickets = null;

async function initDBIfNecessary() {
    if (!client) {
        client = await MongoClient.connect("mongodb://localhost:27017");
        const db = client.db("Authentix");
        collectionUsers = db.collection("users");
        collectionTickets = db.collection("tickets");
    }
}

async function disconnect() {
    if (client) {
        await client.close();
        client = null;
    }
}

/* USER FUNCTIONS */

// Insert a new user.
async function insertUser(user) {
    await initDBIfNecessary();
    user.created = new Date();
    await collectionUsers.insertOne(user);
}

// Retrieve all users.
async function getAllUsers() {
    await initDBIfNecessary();
    return collectionUsers.find().toArray();
}

// Retrieve a user by their MongoDB ObjectId.
async function getUserById(id) {
    await initDBIfNecessary();
    return collectionUsers.findOne({ _id: new ObjectId(id) });
}

/* TICKET FUNCTIONS */

// Called when a ticket is minted on-chain.
async function insertTicketPurchase(ticket) {
    await initDBIfNecessary();
    ticket.created = new Date();
    ticket.status = "purchased";
    await collectionTickets.insertOne(ticket);
}

// Called when a ticket is transferred on-chain.
async function updateTicketTransfer({ ticketId, from, to, price, blockNumber, timestamp }) {
    await initDBIfNecessary();
    await collectionTickets.updateOne(
        { ticketId },
        { $set: { buyer: to, status: "transferred", blockNumber, timestamp } }
    );
}

// Retrieve all ticket records.
async function getAllTickets() {
    await initDBIfNecessary();
    return collectionTickets.find().toArray();
}

module.exports = {
    initDBIfNecessary,
    disconnect,
    insertUser,
    getAllUsers,
    getUserById,
    insertTicketPurchase,
    updateTicketTransfer,
    getAllTickets,
};