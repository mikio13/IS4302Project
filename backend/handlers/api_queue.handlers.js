const {
    addToQueue,
    getQueueList,
    advanceQueue,
    resetQueue,
    seedQueueWithFakeUsers
} = require("../lib/database");

const enqueueUser = async (req, res) => {
    const { wallet, eventAddress } = req.body;
    const entry = await addToQueue(wallet, eventAddress);
    res.status(201).json(entry);
};

const getQueue = async (req, res) => {
    const { eventAddress } = req.query;
    const list = await getQueueList(eventAddress);
    res.status(200).json(list);
};

const advanceQueueDemo = async (req, res) => {
    const { eventAddress } = req.body;
    await advanceQueue(eventAddress);
    res.status(200).json({ success: true });
};

const resetQueueHandler = async (req, res) => {
    const { eventAddress } = req.query;

    if (!eventAddress) {
        return res.status(400).json({ error: "eventAddress is required" });
    }

    await resetQueue(eventAddress);
    res.status(200).json({ success: true, message: `Queue for event ${eventAddress} reset.` });
};

const demoJoinHandler = async (req, res) => {
    const { eventAddress, wallet } = req.body;
    if (!eventAddress || !wallet) {
        return res.status(400).json({ error: "Missing eventAddress or wallet" });
    }

    await seedQueueWithFakeUsers(eventAddress, wallet);
    res.status(201).json({ success: true });
};

module.exports = {
    enqueueUser,
    getQueue,
    advanceQueueDemo,
    resetQueueHandler,
    demoJoinHandler
};