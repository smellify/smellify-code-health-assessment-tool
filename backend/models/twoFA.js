//models/twoFA.js
const mongoose = require("mongoose");

const twoFASchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      sparse: true,
    },
    twoFactorBackupCodes: [
      {
        code: {
          type: String,
          required: true,
        },
        used: {
          type: Boolean,
          default: false,
        },
        usedAt: {
          type: Date,
        },
      },
    ],
    twoFactorEnabledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.TwoFA || mongoose.model("TwoFA", twoFASchema);
