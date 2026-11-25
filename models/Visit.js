const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Visitor name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Visitor email is required"],
      trim: true,
      lowercase: true
    },
    serviceTime: {
      type: String,
      enum: ["9:00 AM", "11:00 AM"],
      default: "9:00 AM"
    },
    guests: {
      type: String,
      default: "1"
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "attended"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Visit", visitSchema);
