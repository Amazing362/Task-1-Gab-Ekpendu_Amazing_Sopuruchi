const mongoose = require("mongoose");

function validateObjectId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ ok: false, error: "Invalid ID format" });
  }
  return next();
}

function errorHandler(err, req, res, next) {
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ ok: false, error: messages.join(", ") });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ ok: false, error: "Invalid resource identifier" });
  }

  console.error("Server error:", err);
  return res.status(500).json({ ok: false, error: "Internal server error" });
}

module.exports = { validateObjectId, errorHandler };
