const express = require("express");
const router = express.Router();
const {
    enqueueUser,
    getQueue,
    advanceQueueDemo,
    resetQueueHandler,
    demoJoinHandler,
    completePurchaseHandler
} = require("../handlers/api_queue.handlers");

router.post("/enqueue", enqueueUser);
router.get("/", getQueue);
router.post("/demo-advance", advanceQueueDemo);
router.delete("/reset", resetQueueHandler);
router.post("/demo-join", demoJoinHandler);
router.post("/complete", completePurchaseHandler); // <- new route

module.exports = router;