// // routes/notifications.js
// const express = require("express");
// const router = express.Router();
// const Notification = require("../models/Notification");
// const auth = require("../middleware/auth"); // Your auth middleware

// // GET - Fetch user notification preferences
// router.get("/preferences", auth, async (req, res) => {
//   try {
//     let notification = await Notification.findOne({ userId: req.user.userId });
    
//     if (!notification) {
//       // Create and store default preferences in database
//       notification = new Notification({
//         userId: req.user.userId,
//         preferences: {
//           dashboardNotifications: true,
//           popupNotifications: true,
//           newsletterEmails: false,
//         }
//       });
//       await notification.save();
//     }
    
//     res.json(notification.preferences);
//   } catch (error) {
//     console.error("Error fetching preferences:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // PUT - Update user notification preferences
// router.put("/preferences", auth, async (req, res) => {
//   try {
//     const { dashboardNotifications, popupNotifications, newsletterEmails } = req.body;
    
//     let notification = await Notification.findOne({ userId: req.user.userId });
    
//     if (!notification) {
//       // Create new document if doesn't exist
//       notification = new Notification({
//         userId: req.user.userId,
//         preferences: {
//           dashboardNotifications,
//           popupNotifications,
//           newsletterEmails,
//         }
//       });
//     } else {
//       // Update existing preferences
//       notification.preferences = {
//         dashboardNotifications,
//         popupNotifications,
//         newsletterEmails,
//       };
//     }
    
//     await notification.save();
//     res.json({ message: "Preferences updated successfully", preferences: notification.preferences });
//   } catch (error) {
//     console.error("Error updating preferences:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;


// routes/notifications.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/auth"); // Your auth middleware

// GET - Fetch user notification preferences
router.get("/preferences", auth, async (req, res) => {
  try {
    let notification = await Notification.findOne({ userId: req.user.userId });
    
    if (!notification) {
      // Create and store default preferences in database
      notification = new Notification({
        userId: req.user.userId,
        preferences: {
          dashboardNotifications: true,
          popupNotifications: true,
          newsletterEmails: false,
        }
      });
      await notification.save();
    }
    
    res.json(notification.preferences);
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT - Update user notification preferences
router.put("/preferences", auth, async (req, res) => {
  try {
    const { dashboardNotifications, popupNotifications, newsletterEmails } = req.body;
    
    let notification = await Notification.findOne({ userId: req.user.userId });
    
    if (!notification) {
      // Create new document if doesn't exist
      notification = new Notification({
        userId: req.user.userId,
        preferences: {
          dashboardNotifications,
          popupNotifications,
          newsletterEmails,
        }
      });
    } else {
      // Update existing preferences
      notification.preferences = {
        dashboardNotifications,
        popupNotifications,
        newsletterEmails,
      };
    }
    
    await notification.save();
    res.json({ message: "Preferences updated successfully", preferences: notification.preferences });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST - Store notification in database
router.post("/store", auth, async (req, res) => {
  try {
    const { type, message } = req.body;
    
    if (!type || !message) {
      return res.status(400).json({ message: "Type and message are required" });
    }
    
    let notification = await Notification.findOne({ userId: req.user.userId });
    
    if (!notification) {
      // Create new document if doesn't exist
      notification = new Notification({
        userId: req.user.userId,
        preferences: {
          dashboardNotifications: true,
          popupNotifications: true,
          newsletterEmails: false,
        },
        notifications: []
      });
    }
    
    // Add new notification to the array
    notification.notifications.push({
      type,
      message,
      read: false,
      createdAt: new Date()
    });
    
    await notification.save();
    
    res.json({ 
      message: "Notification stored successfully",
      notificationId: notification.notifications[notification.notifications.length - 1]._id
    });
    
  } catch (error) {
    console.error("Error storing notification:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET - Fetch user's stored notifications
router.get("/dashboard", auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, unread = false } = req.query;
    
    let notification = await Notification.findOne({ userId: req.user.userId });
    
    if (!notification) {
      return res.json({ notifications: [], total: 0, hasMore: false });
    }
    
    let notifications = [...notification.notifications];
    
    // Filter for unread only if requested
    if (unread === 'true') {
      notifications = notifications.filter(n => !n.read);
    }
    
    // Sort by creation date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedNotifications = notifications.slice(skip, skip + parseInt(limit));
    
    res.json({
      notifications: paginatedNotifications,
      total: notifications.length,
      hasMore: skip + parseInt(limit) < notifications.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(notifications.length / parseInt(limit))
    });
    
  } catch (error) {
    console.error("Error fetching dashboard notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH - Mark notification as read
router.patch("/read/:notificationId", auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOne({ userId: req.user.userId });
    
    if (!notification) {
      return res.status(404).json({ message: "Notification document not found" });
    }
    
    const notificationItem = notification.notifications.id(notificationId);
    
    if (!notificationItem) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    notificationItem.read = true;
    await notification.save();
    
    res.json({ message: "Notification marked as read" });
    
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH - Mark all notifications as read
router.patch("/read-all", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({ userId: req.user.userId });
    
    if (!notification) {
      return res.status(404).json({ message: "Notification document not found" });
    }
    
    notification.notifications.forEach(n => {
      n.read = true;
    });
    
    await notification.save();
    
    res.json({ message: "All notifications marked as read" });
    
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE - Delete a specific notification
router.delete("/:notificationId", auth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOne({ userId: req.user.userId });
    
    if (!notification) {
      return res.status(404).json({ message: "Notification document not found" });
    }
    
    const notificationItem = notification.notifications.id(notificationId);
    
    if (!notificationItem) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    notification.notifications.pull(notificationId);
    await notification.save();
    
    res.json({ message: "Notification deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;