const express = require("express");
const router = express.Router();
const {
    storeUser,
    getUserByHashedNRIC
} = require("../handlers/api_users.handlers");

// POST /users/store → Save hashedNRIC → real data mapping
router.post("/store", storeUser);

// GET /users/:hashedNRIC → Retrieve original NRIC/name
router.get("/:hashedNRIC", getUserByHashedNRIC);

module.exports = router;