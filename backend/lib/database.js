const { MongoClient, ObjectId } = require("mongodb");
let client = null;
let collectionQueue = null;

async function initDBIfNecessary() {
    if (!client) {
        client = await MongoClient.connect("mongodb://localhost:27017");
        const db = client.db("Authentix");
        collectionQueue = db.collection("waiting_queue");
    }
}

async function addToQueue(wallet, eventAddress) {
    await initDBIfNecessary();
    const queue = await collectionQueue.find({ eventAddress }).sort({ joinedAt: 1 }).toArray();

    const alreadyInQueue = queue.find(entry => entry.wallet === wallet);
    if (alreadyInQueue) return alreadyInQueue;

    const entry = {
        wallet,
        eventAddress,
        joinedAt: new Date(),
        status: queue.length === 0 ? "ready" : "waiting"
    };

    await collectionQueue.insertOne(entry);
    return entry;
}

async function getQueueList(eventAddress) {
    await initDBIfNecessary();
    return await collectionQueue.find({ eventAddress }).sort({ joinedAt: 1 }).toArray();
}

async function advanceQueue(eventAddress) {
    await initDBIfNecessary();

    // Get current queue
    const queue = await collectionQueue.find({ eventAddress }).sort({ joinedAt: 1 }).toArray();

    if (queue.length > 0) {
        // Remove the first
        await collectionQueue.deleteOne({ _id: queue[0]._id });

        // Mark next as ready if exists
        if (queue[1]) {
            await collectionQueue.updateOne(
                { _id: queue[1]._id },
                { $set: { status: "ready" } }
            );
        }
    }
}

module.exports = {
    addToQueue,
    getQueueList,
    advanceQueue
};