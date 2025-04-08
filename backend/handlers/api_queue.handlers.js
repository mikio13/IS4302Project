const {
    addToQueue,
    getQueueList,
    advanceQueue
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

module.exports = {
    enqueueUser,
    getQueue,
    advanceQueueDemo
};