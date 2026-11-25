const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["prayer", "question"],
      default: "prayer"
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true
    },
    message: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      minlength: [5, "Message must be at least 5 characters"]
    },
    isResolved: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
