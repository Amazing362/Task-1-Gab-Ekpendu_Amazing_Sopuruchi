const mongoose = require("mongoose");

const eventRsvpSchema = new mongoose.Schema(
  {
    eventTitle: {
      type: String,
      required: [true, "Event title is required"],
      trim: true
    },
    attendeeName: {
      type: String,
      trim: true,
      default: "Guest"
    },
    attendeeEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EventRsvp", eventRsvpSchema);
