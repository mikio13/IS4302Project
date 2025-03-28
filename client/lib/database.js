const { MongoClient } = require("mongodb");
let client = null;
//this is the collection object for querying the users collection in the database
let collectionUsers = null;

//function to connect to db and get the collection object
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
    await collectionUsers.insertOne(user);
}

//export the functions so they can be used in other files
module.exports = {
    insertUser,
    disconnect,
};