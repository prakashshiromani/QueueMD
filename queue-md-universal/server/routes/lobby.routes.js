const express = require("express");
const router = express.Router();
const { getLiveLobbyStatus } = require("../controllers/lobby.controller");
const rateLimit = require('express-rate-limit');

// Strict Rate Limiting (Public Endpoint)
const lobbyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs (relaxed for shared lobby networks)
    message: { success: false, message: "Too many tracking requests, please try again later." }
});

router.post("/:facilityId/status", lobbyLimiter, getLiveLobbyStatus);

module.exports = router;
