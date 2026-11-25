const express = require("express");
const EventRsvp = require("../models/EventRsvp");
const { validateObjectId } = require("../middleware/errorHandler");

const router = express.Router();

// GET /api/events/rsvps — Retrieve all event RSVPs
router.get("/", async (req, res) => {
  const filter = req.query.eventTitle ? { eventTitle: req.query.eventTitle } : {};
  const rsvps = await EventRsvp.find(filter).sort({ createdAt: -1 });
  res.json({ ok: true, count: rsvps.length, data: rsvps });
});

// POST /api/events/rsvps — Create an event RSVP
router.post("/", async (req, res) => {
  const { eventTitle, attendeeName, attendeeEmail } = req.body;
  const rsvp = await EventRsvp.create({ eventTitle, attendeeName, attendeeEmail });
  res.status(201).json({ ok: true, data: rsvp });
});

// DELETE /api/events/rsvps/:id — Cancel/delete an event RSVP
router.delete("/:id", validateObjectId, async (req, res) => {
  const deleted = await EventRsvp.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ ok: false, error: "RSVP not found" });
  }
  return res.json({ ok: true, message: "RSVP deleted", data: deleted });
});

module.exports = router;
