const express = require("express");
const router = express.Router();
const { 
  createTicket, getTickets, getTicket, 
  addComment, updateTicketStatus, getProTickets 
} = require("../controllers/ticket.controller");
const { auth, authorize } = require("../middleware/auth.middleware");

router.use(auth); // All routes protected by JWT token auth

// Admin Dashboard - Pro support tickets filter route.
// MUST be before /:id route so it doesn't match :id = "pro"
router.get("/pro", authorize("admin"), getProTickets);

router.route("/")
  .post(createTicket)
  .get(getTickets);

router.route("/:id")
  .get(getTicket)
  .patch(updateTicketStatus);

router.route("/:id/comments")
  .post(addComment);

module.exports = router;
