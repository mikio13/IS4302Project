const express = require("express");
const router = express.Router();
const {
    enqueueUser,
    getQueue,
    advanceQueueDemo,
    resetQueueHandler,
    demoJoinHandler
} = require("../handlers/api_queue.handlers");

router.post("/enqueue", enqueueUser);
router.get("/", getQueue);
router.post("/demo-advance", advanceQueueDemo);
router.delete("/reset", resetQueueHandler);
router.post("/demo-join", demoJoinHandler); // new route for demo logic

module.exports = router;