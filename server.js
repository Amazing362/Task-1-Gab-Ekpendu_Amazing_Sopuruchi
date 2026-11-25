require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const visitsRouter = require("./routes/visits");
const messagesRouter = require("./routes/messages");
const eventsRouter = require("./routes/events");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (index.html, css/, js/, assets/)
app.use(express.static(path.join(__dirname)));

// Health & DB Status Route
app.get("/api/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    ok: true,
    message: "Grace Harbor Church backend is running",
    database: states[mongoose.connection.readyState] || "unknown",
    timestamp: new Date().toISOString()
  });
});

// REST API Routes (GET, POST, PATCH, DELETE)
app.use("/api/visits", visitsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/events/rsvps", eventsRouter);

// API 404 Fallback
app.use("/api", (req, res) => {
  res.status(404).json({ ok: false, error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Central Error Handler
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
  } catch (err) {
    console.warn(`MongoDB not connected yet: ${err.message}`);
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
