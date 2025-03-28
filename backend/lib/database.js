const { MongoClient, ObjectId } = require("mongodb");
let client = null;

let collectionUsers = null;

async function initDBIfNecessary() {
    if (!client) {
        //only connect to the database if we are not already connected
        client = await MongoClient.connect("mongodb://localhost:27017");
        const db = client.db("Authentix");
        collectionUsers = db.collection("users");
    }
}

//function to disconnect from the database
async function disconnect() {
    if (client) {
        await client.close();
        client = null;
    }
}

async function insertUser(user) {
    await initDBIfNecessary();
    user.created = new Date();

    const result = await collectionUsers.insertOne(user);

    return user;
}

module.exports = {
    disconnect,
    insertUser,
};