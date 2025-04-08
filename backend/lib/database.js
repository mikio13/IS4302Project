const { MongoClient } = require("mongodb");
let client = null;
let collectionQueue = null;

// Connects to MongoDB and sets up the "waitingRoom" collection if not already connected
async function initDBIfNecessary() {
    if (!client) {
        client = await MongoClient.connect("mongodb://localhost:27017");
        const db = client.db("Authentix");
        collectionQueue = db.collection("waitingRoom");
    }
}

// Adds a wallet address to the queue for a specific event
// If the wallet is already in the queue, it will return the existing entry
async function addToQueue(wallet, eventAddress) {
    await initDBIfNecessary();
    const queue = await collectionQueue.find({ eventAddress }).sort({ joinedAt: 1 }).toArray();

    const alreadyInQueue = queue.find(entry => entry.wallet === wallet);
    if (alreadyInQueue) return alreadyInQueue;

    const entry = {
        wallet,
        eventAddress,
        joinedAt: new Date(),
        status: "waiting"
    };

    await collectionQueue.insertOne(entry);
    return entry;
}

// Returns the full queue list for a specific event, sorted by joined time
async function getQueueList(eventAddress) {
    await initDBIfNecessary();
    return await collectionQueue.find({ eventAddress }).sort({ joinedAt: 1 }).toArray();
}

// Advances the queue for a specific event by removing the first user and marking the next as "ready"
async function advanceQueue(eventAddress) {
    await initDBIfNecessary();
    const queue = await collectionQueue.find({ eventAddress }).sort({ joinedAt: 1 }).toArray();

    if (queue.length > 0) {
        await collectionQueue.deleteOne({ _id: queue[0]._id });

        if (queue[1]) {
            await collectionQueue.updateOne(
                { _id: queue[1]._id },
                { $set: { status: "ready" } }
            );
        }
    }
}

// Deletes all queue entries for a specific event — used to reset the queue
async function resetQueue(eventAddress) {
    await initDBIfNecessary();
    await collectionQueue.deleteMany({ eventAddress });
}

// Inserts 3 fake users ahead of the real wallet, then inserts the real user
// Also marks the first person in the resulting queue as "ready"
async function seedQueueWithFakeUsers(eventAddress, realWallet, numFake = 3) {
    await initDBIfNecessary();

    const existing = await collectionQueue.find({ eventAddress }).toArray();
    const alreadyInQueue = existing.some(e => e.wallet === realWallet);
    if (alreadyInQueue) return;

    const now = new Date();

    const fakeUsers = Array.from({ length: numFake }).map((_, i) => ({
        wallet: `0xfake${i.toString().padStart(38, "0")}`,
        eventAddress,
        joinedAt: new Date(now.getTime() + i),
        status: "waiting"
    }));

    const realUser = {
        wallet: realWallet,
        eventAddress,
        joinedAt: new Date(now.getTime() + numFake),
        status: "waiting"
    };

    await collectionQueue.insertMany([...fakeUsers, realUser]);

    const updatedQueue = await collectionQueue.find({ eventAddress }).sort({ joinedAt: 1 }).toArray();
    if (updatedQueue[0]) {
        await collectionQueue.updateOne(
            { _id: updatedQueue[0]._id },
            { $set: { status: "ready" } }
        );
    }
}

// Removes a specific user from the queue after successful purchase
async function removeUserFromQueue(wallet, eventAddress) {
    await initDBIfNecessary();
    await collectionQueue.deleteOne({ wallet, eventAddress });
}

module.exports = {
    addToQueue,
    getQueueList,
    advanceQueue,
    resetQueue,
    seedQueueWithFakeUsers,
    removeUserFromQueue
};