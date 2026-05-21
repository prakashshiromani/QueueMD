const express = require("express");
const router = express.Router();
const { 
  createTicket, getTickets, getTicket, 
  addComment, updateTicketStatus 
} = require("../controllers/ticket.controller");
const { auth } = require("../middleware/auth.middleware");

router.use(auth); // All routes protected by JWT token auth

router.route("/")
  .post(createTicket)
  .get(getTickets);

router.route("/:id")
  .get(getTicket)
  .patch(updateTicketStatus);

router.route("/:id/comments")
  .post(addComment);

module.exports = router;
