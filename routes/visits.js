const express = require("express");
const Visit = require("../models/Visit");
const { validateObjectId } = require("../middleware/errorHandler");

const router = express.Router();

// GET /api/visits — Retrieve all planned visits (optional ?status=pending)
router.get("/", async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const visits = await Visit.find(filter).sort({ createdAt: -1 });
  res.json({ ok: true, count: visits.length, data: visits });
});

// GET /api/visits/:id — Retrieve one planned visit
router.get("/:id", validateObjectId, async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  if (!visit) {
    return res.status(404).json({ ok: false, error: "Visit not found" });
  }
  return res.json({ ok: true, data: visit });
});

// POST /api/visits — Create a new planned visit
router.post("/", async (req, res) => {
  const { name, email, serviceTime, guests } = req.body;
  const visit = await Visit.create({ name, email, serviceTime, guests });
  res.status(201).json({ ok: true, data: visit });
});

// PATCH /api/visits/:id — Update visit status or details
router.patch("/:id", validateObjectId, async (req, res) => {
  const allowedFields = ["name", "email", "serviceTime", "guests", "status"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const visit = await Visit.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: "after",
    runValidators: true
  });

  if (!visit) {
    return res.status(404).json({ ok: false, error: "Visit not found" });
  }
  return res.json({ ok: true, data: visit });
});

// DELETE /api/visits/:id — Delete a planned visit
router.delete("/:id", validateObjectId, async (req, res) => {
  const deleted = await Visit.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ ok: false, error: "Visit not found" });
  }
  return res.json({ ok: true, message: "Visit deleted", data: deleted });
});

module.exports = router;
