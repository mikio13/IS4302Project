const express = require("express");
const router = express.Router();
const {
    createUser,
    getUserByHashedNRIC
} = require("../handlers/api_users.handlers");

// POST /users/ → Creates a user, storing the original NRIC and full name
router.post("/", createUser);

// GET /users/:hashedNRIC → Retrieve original NRIC and full name
router.get("/:hashedNRIC", getUserByHashedNRIC);

module.exports = router;