//models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  preferences: {
    dashboardNotifications: { type: Boolean, default: true },
    popupNotifications: { type: Boolean, default: true },
    newsletterEmails: { type: Boolean, default: false },
  },


  notifications: [
    {
      type: {
        type: String,
        enum: ["info", "warning", "success", "error", "marketing"],
        default: "info",
      },
      message: { type: String, required: true },
      read: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
