const {
    addToQueue,
    getQueueList,
    advanceQueue,
    resetQueue,
    seedQueueWithFakeUsers,
    removeUserFromQueue
} = require("../lib/database");

// For the full Authentix implementation, this is the endpoint the frontend should call
// when a user joins the waiting room. In the demo, we use demoJoinHandler instead.
const enqueueUser = async (req, res) => {
    const { wallet, eventAddress } = req.body;
    const entry = await addToQueue(wallet, eventAddress);
    res.status(201).json(entry);
};

// Retrieves the full queue list for a specific event.
// The frontend polls this every 3 seconds so the user can see their queue position.
const getQueue = async (req, res) => {
    const { eventAddress } = req.query;
    const list = await getQueueList(eventAddress);
    res.status(200).json(list);
};

// Used during the demo to advance the queue by one position.
// This removes the current first user and marks the next as "ready".
const advanceQueueDemo = async (req, res) => {
    const { eventAddress } = req.body;
    await advanceQueue(eventAddress);
    res.status(200).json({ success: true });
};

// Resets the queue for a given event.
// This is useful for restarting a demo — alternative to manually dropping the collection in MongoDB.
const resetQueueHandler = async (req, res) => {
    const { eventAddress } = req.query;

    if (!eventAddress) {
        return res.status(400).json({ error: "eventAddress is required" });
    }

    await resetQueue(eventAddress);
    res.status(200).json({ success: true });
};

// Used in the demo when a user joins the queue.
// Automatically inserts 3 fake users ahead of the real user.
const demoJoinHandler = async (req, res) => {
    const { eventAddress, wallet } = req.body;
    if (!eventAddress || !wallet) {
        return res.status(400).json({ error: "Missing eventAddress or wallet" });
    }

    await seedQueueWithFakeUsers(eventAddress, wallet);
    res.status(201).json({ success: true });
};

// Called after a user successfully completes the ticket purchase.
// Removes the user from the queue to allow the next person to proceed.
const completePurchaseHandler = async (req, res) => {
    const { wallet, eventAddress } = req.body;

    if (!wallet || !eventAddress) {
        return res.status(400).json({ error: "Missing wallet or eventAddress" });
    }

    await removeUserFromQueue(wallet, eventAddress);
    res.status(200).json({ success: true });
};

module.exports = {
    enqueueUser,
    getQueue,
    advanceQueueDemo,
    resetQueueHandler,
    demoJoinHandler,
    completePurchaseHandler
};