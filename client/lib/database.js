const { MongoClient, ObjectId } = require("mongodb");

let client = null;
let collectionUsers = null;

// Connect to MongoDB if not already connected
async function initDBIfNecessary() {
    if (!client) {
        client = await MongoClient.connect("mongodb://localhost:27017");
        const db = client.db("Authentix");
        collectionUsers = db.collection("users");
    }
}

// Disconnect from MongoDB
async function disconnect() {
    if (client) {
        await client.close();
        client = null;
    }
}

// Insert a new user
async function insertUser(user) {
    await initDBIfNecessary();
    user.created = new Date();
    await collectionUsers.insertOne(user);
}

// Retrieve all users
async function getAllUsers() {
    await initDBIfNecessary();
    return collectionUsers.find().toArray();
}

// Retrieve a single user by its MongoDB ObjectId
async function getUserById(id) {
    await initDBIfNecessary();
    return collectionUsers.findOne({ _id: new ObjectId(id) });
}

// Export the functions
module.exports = {
    insertUser,
    getAllUsers,
    getUserById,
    disconnect
};