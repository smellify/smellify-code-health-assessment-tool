const express = require("express");
const router = express.Router();
const Billing = require("../models/billing");
const User = require("../models/User");
const auth = require("../middleware/auth");
const stripe = require("stripe")
(process.env.STRIPE_SECRET_KEY);
const crypto = require("crypto");

// Package configuration
const PACKAGES = {
  starter: {
    name: "Starter Pack",
    price: 0.99,
    credits: 10,
  },
  premium: {
    name: "Premium Pack",
    price: 99,
    credits: 5000,
  },
};

// Generate unique transaction ID
const generateTransactionId = () => {
  return `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
};

// POST /api/billing/create-payment-intent - Create Stripe PaymentIntent
router.post("/create-payment-intent", auth, async (req, res) => {
  try {
    const { packageId, quantity = 1, country, zip } = req.body;

    // Validate package
    if (!PACKAGES[packageId]) {
      return res.status(400).json({ error: "Invalid package selected" });
    }

    // Validate required fields
    if (!country || !zip) {
      return res.status(400).json({ error: "Country and ZIP code are required" });
    }

    const pkg = PACKAGES[packageId];
    const totalAmount = Math.round(pkg.price * quantity * 100); // Convert to cents

    // Create payment intent with custom amount (no product needed)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "usd",
      description: `${quantity}x ${pkg.name}`,
      metadata: {
        packageId,
        quantity: quantity.toString(),
        userId: req.user.userId,
        country,
        zip,
        credits: (pkg.credits * quantity).toString(),
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// // POST /api/billing/confirm-payment - Confirm payment and process purchase
// router.post("/confirm-payment", auth, async (req, res) => {
//   try {
//     const { paymentIntentId, packageId, quantity = 1, country, zip } = req.body;

//     // Validate package
//     if (!PACKAGES[packageId]) {
//       return res.status(400).json({ error: "Invalid package selected" });
//     }

//     // Retrieve payment intent from Stripe with charges expanded
//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
//       expand: ['charges.data.payment_method_details']
//     });

//     // Verify payment succeeded
//     if (paymentIntent.status !== "succeeded") {
//       return res.status(400).json({ error: "Payment was not successful" });
//     }

//     // Verify metadata matches
//     if (
//       paymentIntent.metadata.userId !== req.user.userId ||
//       paymentIntent.metadata.packageId !== packageId
//     ) {
//       return res.status(400).json({ error: "Payment intent mismatch" });
//     }

//     const pkg = PACKAGES[packageId];
//     const totalAmount = pkg.price * quantity;
//     const totalCredits = pkg.credits * quantity;

//     // Create transaction
//     const transactionId = generateTransactionId();
    
//     // Safely extract charge data
//     let cardBrand = "card";
//     let cardLastFour = "****";
    
//     if (paymentIntent.charges && paymentIntent.charges.data && paymentIntent.charges.data.length > 0) {
//       const chargeData = paymentIntent.charges.data[0];
//       if (chargeData.payment_method_details && chargeData.payment_method_details.card) {
//         cardBrand = chargeData.payment_method_details.card.brand || "card";
//         cardLastFour = chargeData.payment_method_details.card.last4 || "****";
//       }
//     }
    
//     const transaction = {
//       transactionId,
//       stripePaymentIntentId: paymentIntentId,
//       packageId,
//       packageName: pkg.name,
//       amount: totalAmount,
//       quantity,
//       creditsAdded: totalCredits,
//       status: "completed",
//       paymentMethod: {
//         type: "stripe",
//         cardBrand: cardBrand,
//         cardLastFour: cardLastFour,
//       },
//       billingDetails: {
//         country,
//         zip,
//       },
//     };

//     // Find or create billing record
//     let billing = await Billing.findOne({ userId: req.user.userId });

//     if (!billing) {
//       billing = new Billing({
//         userId: req.user.userId,
//         totalSpent: 0,
//         totalCreditsEarned: 0,
//         transactions: [],
//       });
//     }

//     // Update billing record
//     billing.totalSpent += totalAmount;
//     billing.totalCreditsEarned += totalCredits;
//     billing.transactions.push(transaction);
//     billing.currentPackage = {
//       packageId,
//       packageName: pkg.name,
//       purchasedAt: new Date(),
//     };
//     billing.lastPaymentMethod = {
//       type: "stripe",
//       cardBrand: transaction.paymentMethod.cardBrand,
//       cardLastFour: transaction.paymentMethod.cardLastFour,
//     };
//     billing.lastBillingAddress = {
//       country,
//       zip,
//     };

//     await billing.save();

//     // Update user's remaining scans
//     const user = await User.findById(req.user.userId);
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     user.remainingScans = (user.remainingScans || 0) + totalCredits;
//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: "Purchase successful",
//       transaction: {
//         transactionId,
//         packageName: pkg.name,
//         amount: totalAmount,
//         creditsAdded: totalCredits,
//       },
//       user: {
//         remainingScans: user.remainingScans,
//       },
//     });
//   } catch (error) {
//     console.error("Payment confirmation error:", error);
//     res.status(500).json({ error: "Failed to confirm payment" });
//   }
// });
// POST /api/billing/confirm-payment - Confirm payment and process purchase
router.post("/confirm-payment", auth, async (req, res) => {
  try {
    const { paymentIntentId, packageId, quantity = 1, country, zip } = req.body;

    // Validate package
    if (!PACKAGES[packageId]) {
      return res.status(400).json({ error: "Invalid package selected" });
    }

    // Retrieve payment intent from Stripe with proper expansion
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge.payment_method_details', 'payment_method']
    });

    // Verify payment succeeded
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment was not successful" });
    }

    // Verify metadata matches
    if (
      paymentIntent.metadata.userId !== req.user.userId ||
      paymentIntent.metadata.packageId !== packageId
    ) {
      return res.status(400).json({ error: "Payment intent mismatch" });
    }

    const pkg = PACKAGES[packageId];
    const totalAmount = pkg.price * quantity;
    const totalCredits = pkg.credits * quantity;

    // Create transaction
    const transactionId = generateTransactionId();
    
    // Extract card details from latest_charge
    let cardBrand = "card";
    let cardLastFour = "****";
    
    if (paymentIntent.latest_charge && 
        paymentIntent.latest_charge.payment_method_details && 
        paymentIntent.latest_charge.payment_method_details.card) {
      const cardDetails = paymentIntent.latest_charge.payment_method_details.card;
      cardBrand = cardDetails.brand || "card";
      cardLastFour = cardDetails.last4 || "****";
    }
    // Fallback: try to get from payment_method if available
    else if (paymentIntent.payment_method) {
      try {
        const paymentMethod = typeof paymentIntent.payment_method === 'string' 
          ? await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
          : paymentIntent.payment_method;
        
        if (paymentMethod && paymentMethod.card) {
          cardBrand = paymentMethod.card.brand || "card";
          cardLastFour = paymentMethod.card.last4 || "****";
        }
      } catch (err) {
        console.error("Error retrieving payment method:", err);
      }
    }
    
    console.log("Card details extracted:", { cardBrand, cardLastFour }); // Debug log
    
    const transaction = {
      transactionId,
      stripePaymentIntentId: paymentIntentId,
      packageId,
      packageName: pkg.name,
      amount: totalAmount,
      quantity,
      creditsAdded: totalCredits,
      status: "completed",
      paymentMethod: {
        type: "stripe",
        cardBrand: cardBrand,
        cardLastFour: cardLastFour,
      },
      billingDetails: {
        country,
        zip,
      },
    };

    // Find or create billing record
    let billing = await Billing.findOne({ userId: req.user.userId });

    if (!billing) {
      billing = new Billing({
        userId: req.user.userId,
        totalSpent: 0,
        totalCreditsEarned: 0,
        transactions: [],
      });
    }

    // Update billing record
    billing.totalSpent += totalAmount;
    billing.totalCreditsEarned += totalCredits;
    billing.transactions.push(transaction);
    billing.currentPackage = {
      packageId,
      packageName: pkg.name,
      purchasedAt: new Date(),
    };
    billing.lastPaymentMethod = {
      type: "stripe",
      cardBrand: transaction.paymentMethod.cardBrand,
      cardLastFour: transaction.paymentMethod.cardLastFour,
    };
    billing.lastBillingAddress = {
      country,
      zip,
    };

    await billing.save();

    // Update user's remaining scans
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.remainingScans = (user.remainingScans || 0) + totalCredits;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Purchase successful",
      transaction: {
        transactionId,
        packageName: pkg.name,
        amount: totalAmount,
        creditsAdded: totalCredits,
      },
      user: {
        remainingScans: user.remainingScans,
      },
    });
  } catch (error) {
    console.error("Payment confirmation error:", error);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
});
// GET /api/billing/history - Get transaction history
router.get("/history", auth, async (req, res) => {
  try {
    const billing = await Billing.findOne({ userId: req.user.userId });

    if (!billing) {
      return res.status(200).json({
        transactions: [],
        totalSpent: 0,
        totalCreditsEarned: 0,
      });
    }

    res.status(200).json({
      transactions: billing.transactions.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
      totalSpent: billing.totalSpent,
      totalCreditsEarned: billing.totalCreditsEarned,
      currentPackage: billing.currentPackage,
    });
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ error: "Failed to fetch transaction history" });
  }
});

// GET /api/billing/current - Get current billing info
router.get("/current", auth, async (req, res) => {
  try {
    const billing = await Billing.findOne({ userId: req.user.userId });
    const user = await User.findById(req.user.userId).select("remainingScans");

    if (!billing) {
      return res.status(200).json({
        currentPackage: { packageId: "none" },
        totalSpent: 0,
        totalCreditsEarned: 0,
        remainingScans: user?.remainingScans || 0,
        lastPaymentMethod: null,
        lastBillingAddress: null,
      });
    }

    res.status(200).json({
      currentPackage: billing.currentPackage,
      totalSpent: billing.totalSpent,
      totalCreditsEarned: billing.totalCreditsEarned,
      remainingScans: user?.remainingScans || 0,
      lastPaymentMethod: billing.lastPaymentMethod,
      lastBillingAddress: billing.lastBillingAddress,
    });
  } catch (error) {
    console.error("Current billing error:", error);
    res.status(500).json({ error: "Failed to fetch billing information" });
  }
});

// POST /api/billing/refund/:transactionId - Request refund
router.post("/refund/:transactionId", auth, async (req, res) => {
  try {
    const billing = await Billing.findOne({ userId: req.user.userId });

    if (!billing) {
      return res.status(404).json({ error: "No billing records found" });
    }

    const transaction = billing.transactions.find(
      (t) => t.transactionId === req.params.transactionId
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.status === "refunded") {
      return res.status(400).json({ error: "Transaction already refunded" });
    }

    // Check if refund is within 30 days
    const daysSincePurchase = Math.floor(
      (Date.now() - new Date(transaction.createdAt)) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePurchase > 30) {
      return res.status(400).json({ error: "Refund period expired (30 days)" });
    }

    // Process refund with Stripe
    if (transaction.stripePaymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: transaction.stripePaymentIntentId,
      });

      if (refund.status !== "succeeded") {
        return res.status(400).json({ error: "Stripe refund failed" });
      }
    }

    // Update transaction status
    transaction.status = "refunded";

    // Update totals
    billing.totalSpent -= transaction.amount;
    billing.totalCreditsEarned -= transaction.creditsAdded;

    await billing.save();

    // Deduct credits from user
    const user = await User.findById(req.user.userId);
    user.remainingScans = Math.max(
      0,
      user.remainingScans - transaction.creditsAdded
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      refundAmount: transaction.amount,
      creditsDeducted: transaction.creditsAdded,
      remainingScans: user.remainingScans,
    });
  } catch (error) {
    console.error("Refund error:", error);
    res.status(500).json({ error: "Failed to process refund" });
  }
});

// GET /api/billing/stats - Get billing statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const billing = await Billing.findOne({ userId: req.user.userId });
    const user = await User.findById(req.user.userId).select("remainingScans");

    if (!billing) {
      return res.status(200).json({
        totalTransactions: 0,
        totalSpent: 0,
        totalCreditsEarned: 0,
        remainingScans: user?.remainingScans || 0,
        averageTransactionValue: 0,
      });
    }

    const completedTransactions = billing.transactions.filter(
      (t) => t.status === "completed"
    );

    const averageTransactionValue =
      completedTransactions.length > 0
        ? billing.totalSpent / completedTransactions.length
        : 0;

    res.status(200).json({
      totalTransactions: billing.transactions.length,
      completedTransactions: completedTransactions.length,
      totalSpent: billing.totalSpent,
      totalCreditsEarned: billing.totalCreditsEarned,
      remainingScans: user?.remainingScans || 0,
      averageTransactionValue: parseFloat(
        averageTransactionValue.toFixed(2)
      ),
      currentPackage: billing.currentPackage,
    });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ error: "Failed to fetch billing statistics" });
  }
});

module.exports = router;