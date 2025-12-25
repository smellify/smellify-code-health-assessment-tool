import { useState, useEffect } from "react";
import api from "../services/api";
import SessionManagement from "../components/SessionManagement";
import TwoFactorAuth from "../components/TwoFactorAuth";
import { useNotification } from "../components/NotificationPopup";
import { updateNotificationPreferences } from "../components/NotificationPopup";

export default function Settings() {
  // Add these state variables
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const { showNotification } = useNotification();

  // Add the timer useEffect
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Add the resend function
  const handleResendCode = async () => {
    if (!canResend) return;

    setEmailEdit((prev) => ({ ...prev, isLoading: true }));

    try {
      await api.post("/users/request-email-change", {
        newEmail: emailEdit.newEmail,
        password: emailEdit.currentPassword,
      });

      setProfileUpdate({
        isLoading: false,
        message: `New verification code sent to ${emailEdit.newEmail}`,
        type: "success",
      });

      // SUCCESS NOTIFICATION
      showNotification("success", "Verification code sent successfully!");

      // Reset timer
      setResendTimer(60);
      setCanResend(false);
      setEmailEdit((prev) => ({ ...prev, isLoading: false }));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setProfileUpdate({ isLoading: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Resend code failed:", error);
      setEmailEdit((prev) => ({ ...prev, isLoading: false }));
      setProfileUpdate({
        isLoading: false,
        message:
          error.response?.data?.message ||
          "Failed to resend code. Please try again.",
        type: "error",
      });

      // ERROR NOTIFICATION
      showNotification(
        "error",
        "Failed to resend verification code. Please try again."
      );
    }
  };

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    company: "",
  });

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
  });

  const [emailEdit, setEmailEdit] = useState({
    isEditing: false,
    newEmail: "",
    currentPassword: "",
    verificationCode: "",
    showPasswordPrompt: false,
    showVerification: false,
    isLoading: false,
    oldEmail: "",
    error: "",
    errorType: "",
  });

  const [changePasswordModal, setChangePasswordModal] = useState({
    isOpen: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    isLoading: false,
    error: "",
    errorType: "",
  });

  const [profileUpdate, setProfileUpdate] = useState({
    isLoading: false,
    message: "",
    type: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // GitHub state - Updated to include full GitHub profile data
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubProfile, setGithubProfile] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => {
    const checkSessionMessages = async () => {
      try {
        const response = await api.get("/github/session-message");
        const { error, success } = response.data;

        if (error) {
          showNotification("error", error);
        } else if (success) {
          showNotification("success", success);
          // Refresh GitHub status after successful linking
          fetchGithubStatus();
        }
      } catch (error) {
        console.error("Failed to check session messages:", error);
      }
    };

    checkSessionMessages();
  }, []);
  const fetchGithubStatus = async () => {
    try {
      const response = await api.get("/github/status");
      setGithubConnected(response.data.isLinked);
      setGithubProfile(response.data.github);
    } catch (error) {
      console.error("Failed to fetch GitHub status:", error);
    }
  };
  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
    loadGithubStatus(); // Add this to load GitHub status on component mount
  }, []);

  // Check for GitHub linking success from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubLinked = params.get("github");
    const success = params.get("success");

    if (githubLinked === "linked" && success === "true") {
      showNotification("success", "GitHub account linked successfully!");
      loadGithubStatus(); // Refresh GitHub status
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (githubLinked === "already-linked" && success === "true") {
      showNotification(
        "info",
        "GitHub account is already linked to your account."
      );
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/users/profile");
      const userData = response.data;

      setProfile({
        name: userData.name || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        company: userData.company || "",
      });

      // Enhanced password detection with fallbacks
      let hasPassword = false;

      if (userData.hasPassword !== undefined) {
        hasPassword = userData.hasPassword;
      } else if (userData.passwordDebugInfo) {
        // Use debug info if available
        hasPassword =
          userData.passwordDebugInfo.fieldExists &&
          !userData.passwordDebugInfo.isNull &&
          !userData.passwordDebugInfo.isUndefined &&
          !userData.passwordDebugInfo.isEmpty;
      }

      setUser({
        ...userData,
        hasPassword: hasPassword,
      });
    } catch (error) {
      console.error("Failed to load user profile:", error);
      setProfileUpdate({
        isLoading: false,
        message: "Failed to load profile data",
        type: "error",
      });

      showNotification(
        "error",
        "Failed to load profile data. Please refresh the page."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // New function to load GitHub connection status
  const loadGithubStatus = async () => {
    try {
      const response = await api.get("/github/status");
      const { isLinked, github } = response.data;

      setGithubConnected(isLinked);
      setGithubProfile(isLinked ? github : null);

      console.log("GitHub status loaded:", { isLinked, github });
    } catch (error) {
      console.error("Failed to load GitHub status:", error);
      // Don't show error notification for this as it's not critical
      setGithubConnected(false);
      setGithubProfile(null);
    }
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Enhanced password validation function
  const validatePassword = (password) => {
    const validations = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    const isValid = Object.values(validations).every(Boolean);
    return { isValid, validations };
  };

  const handleProfileUpdate = async () => {
    setProfileUpdate({ isLoading: true, message: "", type: "" });

    try {
      const updateData = {
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        company: profile.company,
      };

      const response = await api.put("/users/profile", updateData);

      setProfileUpdate({
        isLoading: false,
        message: "Profile updated successfully!",
        type: "success",
      });

      // SUCCESS NOTIFICATION
      showNotification("success", "Profile updated successfully!");

      setTimeout(() => {
        setProfileUpdate({ isLoading: false, message: "", type: "" });
      }, 3000);
    } catch (error) {
      console.error("Profile update error:", error);
      setProfileUpdate({
        isLoading: false,
        message: error.response?.data?.message || "Failed to update profile",
        type: "error",
      });

      // ERROR NOTIFICATION
      showNotification("error", "Failed to update profile. Please try again.");
    }
  };

  // Updated GitHub connect/disconnect function
  // Updated handleConnectGithub function for your Settings component

  // const handleConnectGithub = async () => {
  //   if (githubConnected) {
  //     // Disconnect GitHub
  //     setGithubLoading(true);
  //     try {
  //       await api.delete('/github/unlink');
  //       setGithubConnected(false);
  //       setGithubProfile(null);
  //       showNotification('success', 'GitHub account disconnected successfully!');
  //     } catch (error) {
  //       console.error('Failed to disconnect GitHub:', error);
  //       showNotification('error', 'Failed to disconnect GitHub account. Please try again.');
  //     } finally {
  //       setGithubLoading(false);
  //     }
  //   } else {
  //     // Connect GitHub - First get the auth URL from backend
  //     setGithubLoading(true);
  //     try {
  //       showNotification('warning', 'You will be redirected to GitHub for authentication.');

  //       // Make authenticated API call to get GitHub auth URL
  //       const response = await api.get('/github/link');

  //       // The backend should return the auth URL instead of redirecting
  //       if (response.data.authUrl) {
  //         setTimeout(() => {
  //           window.location.href = response.data.authUrl;
  //         }, 2000);
  //       }
  //     } catch (error) {
  //       console.error('Failed to get GitHub auth URL:', error);
  //       showNotification('error', 'Failed to initiate GitHub connection. Please try again.');
  //       setGithubLoading(false);
  //     }
  //   }
  // };

  const handleConnectGithub = async () => {
    if (githubConnected) {
      // Disconnect GitHub
      setGithubLoading(true);
      try {
        const response = await api.delete("/github/unlink");
        setGithubConnected(false);
        setGithubProfile(null);

        if (response.data.preservedInHistory) {
          showNotification(
            "success",
            "GitHub account disconnected successfully! Account history preserved for security."
          );
        } else {
          showNotification(
            "success",
            "GitHub account disconnected successfully!"
          );
        }
      } catch (error) {
        console.error("Failed to disconnect GitHub:", error);
        showNotification(
          "error",
          "Failed to disconnect GitHub account. Please try again."
        );
      } finally {
        setGithubLoading(false);
      }
    } else {
      // Connect GitHub - Get auth URL from backend first
      setGithubLoading(true);
      try {
        showNotification(
          "warning",
          "You will be redirected to GitHub for authentication."
        );

        // Make authenticated API call to get GitHub auth URL
        const response = await api.get("/github/link");
        console.log("GitHub link URL:", response.data.authUrl);
        if (response.data.authUrl) {
          setTimeout(() => {
            window.location.href = response.data.authUrl;
          }, 2000);
          
        } else {
          throw new Error("No auth URL received from server");
        }
      } catch (error) {
        console.error("Failed to get GitHub auth URL:", error);
        setGithubLoading(false);

        if (error.response?.status === 401) {
          showNotification(
            "error",
            "Authentication required. Please refresh the page and try again."
          );
        } else {
          showNotification(
            "error",
            "Failed to initiate GitHub connection. Please try again."
          );
        }
      }
    }
  };

  const [notifications, setNotifications] = useState({
    dashboardNotifications: true,
    popupNotifications: true,
    newsletterEmails: false,
  });

  const [loading, setLoading] = useState(true);

  // Load preferences when component mounts
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get("/notifications/preferences");
      setNotifications(response.data);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      // ERROR NOTIFICATION
      showNotification("error", "Failed to load notification preferences.");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (key) => {
    const updatedNotifications = {
      ...notifications,
      [key]: !notifications[key],
    };

    // Update UI immediately
    setNotifications(updatedNotifications);

    try {
      // Save to database
      await api.put("/notifications/preferences", updatedNotifications);
      updateNotificationPreferences(updatedNotifications);
      showNotification("success", "Notification preferences updated!");
    } catch (error) {
      console.error("Error updating preferences:", error);
      // Revert on error
      setNotifications(notifications);
      // ERROR NOTIFICATION
      showNotification("error", "Failed to update notification preferences.");
    }
  };

  const handleTwoFactorSetup = () => {
    console.log("Setting up 2FA...");
    // WARNING NOTIFICATION
    showNotification(
      "warning",
      "Two-factor authentication setup will require your phone number."
    );
  };

  // Change Password Modal Functions
  const openChangePasswordModal = () => {
    setChangePasswordModal({
      isOpen: true,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      isLoading: false,
      error: "",
      errorType: "",
    });
  };

  const closeChangePasswordModal = () => {
    setChangePasswordModal({
      isOpen: false,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      isLoading: false,
      error: "",
      errorType: "",
    });
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } =
      changePasswordModal;

    // Clear previous errors
    setChangePasswordModal((prev) => ({
      ...prev,
      error: "",
      errorType: "",
    }));

    // Validation - only check current password if user has existing password
    if (user?.hasPassword && !currentPassword.trim()) {
      setChangePasswordModal((prev) => ({
        ...prev,
        error: "Current password is required",
        errorType: "error",
      }));
      // WARNING NOTIFICATION
      showNotification("warning", "Please enter your current password.");
      return;
    }

    if (!newPassword.trim()) {
      setChangePasswordModal((prev) => ({
        ...prev,
        error: "New password is required",
        errorType: "error",
      }));
      // WARNING NOTIFICATION
      showNotification("warning", "Please enter a new password.");
      return;
    }

    // Enhanced password validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setChangePasswordModal((prev) => ({
        ...prev,
        error: "Password does not meet the security requirements",
        errorType: "error",
      }));
      // WARNING NOTIFICATION
      showNotification(
        "warning",
        "Password must meet all security requirements."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangePasswordModal((prev) => ({
        ...prev,
        error: "New password and confirmation do not match",
        errorType: "error",
      }));
      // WARNING NOTIFICATION
      showNotification("warning", "Password confirmation does not match.");
      return;
    }

    // Only check if new password equals current password for users with existing passwords
    if (user?.hasPassword && currentPassword === newPassword) {
      setChangePasswordModal((prev) => ({
        ...prev,
        error: "New password must be different from current password",
        errorType: "error",
      }));
      // WARNING NOTIFICATION
      showNotification(
        "warning",
        "New password must be different from your current password."
      );
      return;
    }

    setChangePasswordModal((prev) => ({
      ...prev,
      isLoading: true,
      error: "",
      errorType: "",
    }));

    try {
      // Conditional request body - only include currentPassword if user has existing password
      const requestBody = {
        newPassword,
        confirmPassword,
        ...(user?.hasPassword && { currentPassword }),
      };

      const response = await api.post("/users/change-password", requestBody);
      setUser(prevUser => ({
  ...prevUser,
  hasPassword: true, // or any other fields that changed
  lastPasswordChange: new Date().toISOString()
}));

      setChangePasswordModal((prev) => ({
        ...prev,
        isLoading: false,
        error: user?.hasPassword
          ? "Password changed successfully!"
          : "Password set up successfully!",
        errorType: "success",
      }));

      // SUCCESS NOTIFICATION
      showNotification(
        "success",
        user?.hasPassword
          ? "Password changed successfully!"
          : "Password set up successfully!"
      );

      // Close modal after success
      setTimeout(() => {
        closeChangePasswordModal();
        setProfileUpdate({
          isLoading: false,
          message: user?.hasPassword
            ? "Password changed successfully!"
            : "Password set up successfully!",
          type: "success",
        });

        // Clear main success message after 3 seconds
        setTimeout(() => {
          setProfileUpdate({ isLoading: false, message: "", type: "" });
        }, 3000);
      }, 500);
    } catch (error) {
      console.error("Password change error:", error);
      setChangePasswordModal((prev) => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || "Failed to change password",
        errorType: "error",
      }));

      // ERROR NOTIFICATION
      showNotification(
        "error",
        error.response?.data?.message ||
          "Failed to update password. Please try again."
      );
    }
  };

  // Email Edit Functions
  const handleEmailEdit = () => {
    setEmailEdit((prev) => ({
      ...prev,
      isEditing: true,
      newEmail: "",
      showPasswordPrompt: true,
      oldEmail: profile.email,
      currentPassword: "",
      error: "",
      errorType: "",
    }));
    setProfileUpdate({ isLoading: false, message: "", type: "" });

    // WARNING NOTIFICATION
    showNotification(
      "warning",
      "Changing your email will require verification."
    );
  };

  const handlePasswordVerification = async () => {
    if (!emailEdit.currentPassword.trim()) {
      setEmailEdit((prev) => ({
        ...prev,
        error: "Password is required",
        errorType: "error",
      }));
      // WARNING NOTIFICATION
      showNotification("warning", "Please enter your password to continue.");
      return;
    }

    if (!emailEdit.newEmail.trim()) {
      setEmailEdit((prev) => ({
        ...prev,
        error: "New email is required",
        errorType: "error",
      }));
      // WARNING NOTIFICATION
      showNotification("warning", "Please enter a new email address.");
      return;
    }

    if (emailEdit.newEmail.toLowerCase() === profile.email.toLowerCase()) {
      setEmailEdit((prev) => ({
        ...prev,
        error: "New email cannot be the same as your current email",
        errorType: "error",
      }));
      // WARNING NOTIFICATION
      showNotification("warning", "Please enter a different email address.");
      return;
    }

    if (!isValidEmail(emailEdit.newEmail)) {
      setEmailEdit((prev) => ({
        ...prev,
        error: "Please enter a valid email address",
        errorType: "error",
      }));
      // WARNING NOTIFICATION
      showNotification("warning", "Please enter a valid email address.");
      return;
    }

    setEmailEdit((prev) => ({
      ...prev,
      isLoading: true,
      error: "",
      errorType: "",
    }));

    try {
      const passwordResponse = await api.post("/users/verify-password", {
        password: emailEdit.currentPassword,
      });

      if (passwordResponse.data.valid) {
        await api.post("/users/request-email-change", {
          newEmail: emailEdit.newEmail,
          password: emailEdit.currentPassword,
        });

        setEmailEdit((prev) => ({
          ...prev,
          showPasswordPrompt: false,
          showVerification: true,
          isLoading: false,
          error: "",
          errorType: "",
        }));

        setProfileUpdate({
          isLoading: false,
          message: `Verification code sent to ${emailEdit.newEmail}`,
          type: "success",
        });

        // SUCCESS NOTIFICATION
        showNotification(
          "success",
          `Verification code sent to ${emailEdit.newEmail}!`
        );
      }
    } catch (error) {
      console.error(
        "Password verification or email change request failed:",
        error
      );
      setEmailEdit((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error.response?.data?.message ||
          "Invalid password. Please try again.",
        errorType: "error",
      }));

      // ERROR NOTIFICATION
      showNotification(
        "error",
        "Password verification failed. Please try again."
      );
    }
    setResendTimer(60);
    setCanResend(false);
  };

  const handleEmailCancel = async () => {
    try {
      // Cancel pending email change in backend
      if (emailEdit.showVerification || emailEdit.showPasswordPrompt) {
        await api.post("/users/cancel-email-change");
      }

      // SUCCESS NOTIFICATION
      showNotification("success", "Email change cancelled successfully.");
    } catch (error) {
      console.error("Error cancelling email change:", error);
      // ERROR NOTIFICATION
      showNotification("error", "Failed to cancel email change.");
    }

    // Reset all email edit states
    setEmailEdit({
      isEditing: false,
      newEmail: "",
      currentPassword: "",
      verificationCode: "",
      showPasswordPrompt: false,
      showVerification: false,
      isLoading: false,
      oldEmail: "",
      error: "",
      errorType: "",
    });
    setProfileUpdate({ isLoading: false, message: "", type: "" });
    setResendTimer(0);
    setCanResend(false);
  };

  const handleEmailVerification = async () => {
    if (emailEdit.verificationCode.length !== 6) {
      // WARNING NOTIFICATION
      showNotification("warning", "Please enter a 6-digit verification code.");
      return;
    }

    setEmailEdit((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await api.post("/users/verify-email-change", {
        verificationCode: emailEdit.verificationCode,
        newEmail: emailEdit.newEmail,
      });

      setProfile((prev) => ({ ...prev, email: emailEdit.newEmail }));

      setProfileUpdate({
        isLoading: false,
        message: `Email successfully changed to ${emailEdit.newEmail}. A confirmation has been sent to your old email address.`,
        type: "success",
      });

      // SUCCESS NOTIFICATION
      showNotification(
        "success",
        `Email successfully changed to ${emailEdit.newEmail}!`
      );

      setEmailEdit({
        isEditing: false,
        newEmail: "",
        currentPassword: "",
        verificationCode: "",
        showPasswordPrompt: false,
        showVerification: false,
        isLoading: false,
        oldEmail: "",
        error: "",
        errorType: "",
      });

      setTimeout(() => {
        setProfileUpdate({ isLoading: false, message: "", type: "" });
      }, 5000);
    } catch (error) {
      console.error("Email verification failed:", error);
      setEmailEdit((prev) => ({ ...prev, isLoading: false }));
      setProfileUpdate({
        isLoading: false,
        message: error.response?.data?.message || "Invalid verification code",
        type: "error",
      });

      // ERROR NOTIFICATION
      showNotification(
        "error",
        "Email verification failed. Please check your verification code."
      );
    }
    setResendTimer(0);
    setCanResend(false);
  };

  // Delete Account Functions
  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteConfirmText("");
    setDeletePassword("");
    setDeleteError("");
    setDeleteLoading(false);

    // WARNING NOTIFICATION
    showNotification(
      "warning",
      "Account deletion is permanent and cannot be undone!"
    );
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText("");
    setDeletePassword("");
    setDeleteError("");
    setDeleteLoading(false);
  };

  const handleDeleteAccount = async () => {
    // Validation
    if (!deletePassword.trim()) {
      setDeleteError("Password is required to delete your account");
      // WARNING NOTIFICATION
      showNotification(
        "warning",
        "Please enter your password to confirm deletion."
      );
      return;
    }

    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type 'DELETE' to confirm account deletion");
      // WARNING NOTIFICATION
      showNotification(
        "warning",
        'Please type "DELETE" to confirm account deletion.'
      );
      return;
    }

    setDeleteLoading(true);
    setDeleteError("");

    try {
      await api.delete("/users/account", {
        data: {
          password: deletePassword,
          confirmText: deleteConfirmText,
        },
      });

      // SUCCESS NOTIFICATION
      showNotification(
        "success",
        "Account deleted successfully. You will be redirected shortly."
      );

      // Redirect to login after successful deletion
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      console.error("Account deletion failed:", error);
      setDeleteError(
        error.response?.data?.message ||
          "Failed to delete account. Please try again."
      );
      setDeleteLoading(false);

      // ERROR NOTIFICATION
      showNotification(
        "error",
        "Failed to delete account. Please verify your password."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your account, preferences, and integrations.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Success/Error Messages */}
        {profileUpdate.message && (
          <div
            className={`p-4 rounded-xl ${
              profileUpdate.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {profileUpdate.message}
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">Profile</h2>
              <p className="text-gray-600">
                Update your personal information and preferences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="email"
                  value={profile.email}
                  disabled={true}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed transition-all duration-200"
                  placeholder="Enter your email"
                />
                <button
                  onClick={handleEmailEdit}
                  disabled={emailEdit.isEditing}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium disabled:opacity-50"
                >
                  Change Email
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Phone Number{" "}
                <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="tel"
                value={profile.phoneNumber}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    phoneNumber: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Company{" "}
                <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, company: e.target.value }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your company name"
              />
            </div>
          </div>

          <button
            onClick={handleProfileUpdate}
            disabled={profileUpdate.isLoading || !profile.name.trim()}
            className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {profileUpdate.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Saving Changes...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* GitHub Integration - Enhanced with profile display */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">
                GitHub Integration
              </h2>
              <p className="text-gray-600">
                Manage your GitHub connection and repository access
              </p>
            </div>
          </div>

          {githubConnected && githubProfile ? (
            // Connected State - Show GitHub Profile
            <div className="space-y-6">
              <div className="flex items-start justify-between p-6 bg-green-50 border border-green-200 rounded-2xl">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={githubProfile.avatarUrl}
                      alt={`${githubProfile.username}'s avatar`}
                      className="w-16 h-16 rounded-full border-2 border-green-200"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center mb-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                      <p className="font-semibold text-gray-900">
                        GitHub Account Connected
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Username:</strong>
                      <a
                        href={githubProfile.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 ml-1"
                      >
                        @{githubProfile.username}
                      </a>
                    </p>
                    {githubProfile.name &&
                      githubProfile.name !== githubProfile.username && (
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Name:</strong> {githubProfile.name}
                        </p>
                      )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>
                        <strong>Repos:</strong> {githubProfile.publicRepos || 0}
                      </span>
                      <span>
                        <strong>Followers:</strong>{" "}
                        {githubProfile.followers || 0}
                      </span>
                      <span>
                        <strong>Following:</strong>{" "}
                        {githubProfile.following || 0}
                      </span>
                    </div>
                    {githubProfile.lastSynced && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last synced:{" "}
                        {new Date(
                          githubProfile.lastSynced
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleConnectGithub}
                  disabled={githubLoading}
                  className="flex-shrink-0 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors duration-200 font-medium disabled:opacity-50 flex items-center"
                >
                  {githubLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent mr-2"></div>
                      Disconnecting...
                    </>
                  ) : (
                    "Disconnect"
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Disconnected State - Show Connect Option
            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-gray-400 mr-3"></div>
                <div>
                  <p className="font-semibold text-gray-900">
                    GitHub Account Not Connected
                  </p>
                  <p className="text-sm text-gray-600">
                    Connect your GitHub account to sync repositories and enable
                    Git integration
                  </p>
                </div>
              </div>
              <button
                onClick={handleConnectGithub}
                disabled={githubLoading}
                className="px-6 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors duration-200 font-medium disabled:opacity-50 flex items-center"
              >
                {githubLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  "Connect GitHub"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v6m0 0l3 3m-3-3l-3 3"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <p className="text-gray-600">
                Configure how you receive updates and alerts
              </p>
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                {
                  key: "dashboardNotifications",
                  label: "Dashboard Notifications",
                  description: "Show notifications in the app dashboard",
                },
                {
                  key: "popupNotifications",
                  label: "Popup Alerts",
                  description: "Show popup notifications",
                },
                {
                  key: "newsletterEmails",
                  label: "Newsletter",
                  description: "Receive newsletters and product updates",
                },
              ].map((notification) => (
                <div
                  key={notification.key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {notification.label}
                    </p>
                    <p className="text-sm text-gray-600">
                      {notification.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle(notification.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      notifications[notification.key]
                        ? "bg-blue-600"
                        : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications[notification.key]
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">Security</h2>
              <p className="text-gray-600">
                Manage your account security settings
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <TwoFactorAuth />

            <div className="p-4 bg-gray-50 rounded-2xl">
              <p className="font-semibold text-gray-900 mb-2">
                Change Password
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Update your account password
              </p>
              <button
                onClick={openChangePasswordModal}
                className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-gray-900 transition-colors duration-200"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        <SessionManagement />

        {/* Danger Zone */}
        <div className="bg-white rounded-3xl shadow-lg border border-red-200 p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
              <p className="text-gray-600">
                Irreversible and destructive actions
              </p>
            </div>
          </div>

          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Delete Account
            </h3>
            <p className="text-red-700 text-sm mb-4">
              Once you delete your account, there is no going back. Please be
              certain.
            </p>
            <button
              onClick={openDeleteModal}
              className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors duration-200"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal with Enhanced Validation */}
      {changePasswordModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {user?.hasPassword ? "Change Password" : "Set Up Password"}
              </h3>
              <p className="text-gray-600">
                {user?.hasPassword
                  ? "Update your account password for better security"
                  : "Create a password for your account to enhance security"}
              </p>
            </div>

            {/* Error/Success message in modal */}
            {changePasswordModal.error && (
              <div
                className={`mb-4 p-3 rounded-xl text-sm ${
                  changePasswordModal.errorType === "success"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {changePasswordModal.error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              {/* Current Password field - only show if user has existing password */}
              {user?.hasPassword && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={changePasswordModal.currentPassword}
                    onChange={(e) =>
                      setChangePasswordModal((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter current password"
                    autoFocus
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {user?.hasPassword ? "New Password" : "Password"}
                </label>
                <input
                  type="password"
                  value={changePasswordModal.newPassword}
                  onChange={(e) =>
                    setChangePasswordModal((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    user?.hasPassword ? "Enter new password" : "Enter password"
                  }
                  autoFocus={!user?.hasPassword}
                />

                {/* Password Requirements Display */}
                {changePasswordModal.newPassword && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Password Requirements:
                    </p>
                    {(() => {
                      const validation = validatePassword(
                        changePasswordModal.newPassword
                      );
                      return (
                        <div className="space-y-1">
                          <div
                            className={`flex items-center text-xs ${
                              validation.validations.length
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {validation.validations.length ? "✓" : "○"} At least
                            8 characters
                          </div>
                          <div
                            className={`flex items-center text-xs ${
                              validation.validations.uppercase
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {validation.validations.uppercase ? "✓" : "○"} One
                            uppercase letter (A-Z)
                          </div>
                          <div
                            className={`flex items-center text-xs ${
                              validation.validations.lowercase
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {validation.validations.lowercase ? "✓" : "○"} One
                            lowercase letter (a-z)
                          </div>
                          <div
                            className={`flex items-center text-xs ${
                              validation.validations.digit
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {validation.validations.digit ? "✓" : "○"} One
                            number (0-9)
                          </div>
                          <div
                            className={`flex items-center text-xs ${
                              validation.validations.special
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {validation.validations.special ? "✓" : "○"} One
                            special character (!@#$%^&*...)
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {user?.hasPassword
                    ? "Confirm New Password"
                    : "Confirm Password"}
                </label>
                <input
                  type="password"
                  value={changePasswordModal.confirmPassword}
                  onChange={(e) =>
                    setChangePasswordModal((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    user?.hasPassword
                      ? "Confirm new password"
                      : "Confirm password"
                  }
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleChangePassword()
                  }
                />

                {/* Password Match Indicator */}
                {changePasswordModal.confirmPassword && (
                  <div className="mt-2">
                    {changePasswordModal.newPassword ===
                    changePasswordModal.confirmPassword ? (
                      <p className="text-xs text-green-600 flex items-center">
                        Passwords match
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 flex items-center">
                        Passwords do not match
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeChangePasswordModal}
                disabled={changePasswordModal.isLoading}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={
                  // For users with existing password, require current password
                  (user?.hasPassword &&
                    !changePasswordModal.currentPassword.trim()) ||
                  !changePasswordModal.newPassword.trim() ||
                  !changePasswordModal.confirmPassword.trim() ||
                  changePasswordModal.isLoading ||
                  !validatePassword(changePasswordModal.newPassword).isValid ||
                  changePasswordModal.newPassword !==
                    changePasswordModal.confirmPassword
                }
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {changePasswordModal.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    {user?.hasPassword ? "Updating..." : "Setting up..."}
                  </>
                ) : user?.hasPassword ? (
                  "Update Password"
                ) : (
                  "Set Up Password"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Verification Modal (for email change) */}
      {emailEdit.showPasswordPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Verify Your Password
              </h3>
              <p className="text-gray-600">
                Enter your current password to proceed with email change
              </p>
            </div>

            {/* Error message in modal */}
            {emailEdit.error && (
              <div
                className={`mb-4 p-3 rounded-xl text-sm ${
                  emailEdit.errorType === "success"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {emailEdit.error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={emailEdit.currentPassword}
                onChange={(e) =>
                  setEmailEdit((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                autoFocus
                onKeyPress={(e) =>
                  e.key === "Enter" && handlePasswordVerification()
                }
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                New Email Address
              </label>
              <input
                type="email"
                value={emailEdit.newEmail}
                onChange={(e) =>
                  setEmailEdit((prev) => ({
                    ...prev,
                    newEmail: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new email"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleEmailCancel}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordVerification}
                disabled={
                  !emailEdit.currentPassword.trim() ||
                  !emailEdit.newEmail.trim() ||
                  emailEdit.isLoading
                }
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {emailEdit.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Verification Modal */}
      {emailEdit.showVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Verify Email Change
              </h3>
              <p className="text-gray-600">
                We've sent a verification code to <br />
                <span className="font-semibold">{emailEdit.newEmail}</span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={emailEdit.verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setEmailEdit((prev) => ({
                    ...prev,
                    verificationCode: value,
                  }));
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                placeholder="123456"
                maxLength="6"
                autoFocus
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  emailEdit.verificationCode.length === 6 &&
                  handleEmailVerification()
                }
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter the 6-digit code we sent to your email
              </p>
            </div>

            {/* Resend Code Section */}
            <div className="mb-6 text-center">
              <p className="text-sm text-gray-600 mb-3">
                Didn't receive the code?
              </p>
              {resendTimer > 0 ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-500">
                    Resend code in{" "}
                    <span className="font-bold text-blue-600">
                      {resendTimer}s
                    </span>
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={emailEdit.isLoading || !canResend}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {emailEdit.isLoading ? "Sending..." : "Resend Code"}
                </button>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleEmailCancel}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEmailVerification}
                disabled={
                  emailEdit.verificationCode.length !== 6 || emailEdit.isLoading
                }
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {emailEdit.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  "Verify & Change Email"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete Account
              </h3>
              <p className="text-gray-600">
                This action cannot be undone. All your data will be permanently
                deleted.
              </p>
            </div>

            {/* Error message in delete modal */}
            {deleteError && (
              <div className="mb-4 p-3 rounded-xl text-sm bg-red-50 border border-red-200 text-red-800">
                {deleteError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your password"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Type "DELETE" to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="DELETE"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={
                  deleteConfirmText !== "DELETE" ||
                  !deletePassword.trim() ||
                  deleteLoading
                }
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
