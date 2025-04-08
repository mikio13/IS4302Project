const express = require("express");
const router = express.Router();

// Import all the handler functions for queue management
const {
    enqueueUser,
    getQueue,
    advanceQueueDemo,
    resetQueueHandler,
    demoJoinHandler,
    completePurchaseHandler
} = require("../handlers/api_queue.handlers");

// Standard endpoint to join the queue (not used in demo)
router.post("/enqueue", enqueueUser);

// Gets the current queue list for a specific event
router.get("/", getQueue);

// Advances the queue by removing the first person and marking the next as "ready" (used in demo)
router.post("/demo-advance", advanceQueueDemo);

// Resets the queue for a specific event (used to restart a demo run)
router.delete("/reset", resetQueueHandler);

// Demo-only endpoint that seeds 3 fake users + the real user into the queue
router.post("/demo-join", demoJoinHandler);

// Called after a successful purchase to remove the user from the queue
router.post("/complete", completePurchaseHandler);

module.exports = router;