//models/billing.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  packageId: {
    type: String,
    required: true,
    enum: ['starter', 'premium'],
  },
  packageName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  creditsAdded: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed',
  },
  paymentMethod: {
    cardLastFour: {
      type: String,
      required: true,
    },
  },
  billingDetails: {
    country: {
      type: String,
      required: true,
    },
    zip: {
      type: String,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const billingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    totalCreditsEarned: {
      type: Number,
      default: 0,
    },
    currentPackage: {
      packageId: {
        type: String,
        enum: ['starter', 'premium', 'none'],
        default: 'none',
      },
      packageName: String,
      purchasedAt: Date,
    },
    transactions: [transactionSchema],
    lastPaymentMethod: {
      cardLastFour: String,
    },
    lastBillingAddress: {
      country: String,
      zip: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
billingSchema.index({ userId: 1 });
billingSchema.index({ 'transactions.transactionId': 1 });

module.exports = mongoose.models.Billing || mongoose.model("Billing", billingSchema);