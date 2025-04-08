const express = require("express");
const router = express.Router();
const {
    enqueueUser,
    getQueue,
    advanceQueueDemo,
} = require("../handlers/api_queue.handlers");

router.post("/enqueue", enqueueUser);
router.get("/", getQueue);
router.post("/demo-advance", advanceQueueDemo);

module.exports = router;