const express = require("express");
const Message = require("../models/Message");
const { validateObjectId } = require("../middleware/errorHandler");

const router = express.Router();

// GET /api/messages — Retrieve all prayer requests & questions (optional ?mode=prayer)
router.get("/", async (req, res) => {
  const filter = req.query.mode ? { mode: req.query.mode } : {};
  const messages = await Message.find(filter).sort({ createdAt: -1 });
  res.json({ ok: true, count: messages.length, data: messages });
});

// POST /api/messages — Create a new prayer request or question
router.post("/", async (req, res) => {
  const { mode, name, email, message } = req.body;
  const created = await Message.create({ mode, name, email, message });
  res.status(201).json({ ok: true, data: created });
});

// PATCH /api/messages/:id — Toggle or update resolved state
router.patch("/:id", validateObjectId, async (req, res) => {
  const updates = {};
  if (typeof req.body.isResolved === "boolean") {
    updates.isResolved = req.body.isResolved;
  }
  if (req.body.message !== undefined) {
    updates.message = req.body.message;
  }

  const updated = await Message.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true
  });

  if (!updated) {
    return res.status(404).json({ ok: false, error: "Message not found" });
  }
  return res.json({ ok: true, data: updated });
});

// DELETE /api/messages/:id — Delete a prayer request or question
router.delete("/:id", validateObjectId, async (req, res) => {
  const deleted = await Message.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ ok: false, error: "Message not found" });
  }
  return res.json({ ok: true, message: "Message deleted", data: deleted });
});

module.exports = router;
