const express = require("express");
const router = express.Router();

const {
    insertUserJSON,
} = require("../handlers/api_users.handlers");

router.post("/", insertUserJSON);

module.exports = router;