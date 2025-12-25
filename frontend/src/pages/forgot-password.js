//pages/forgot-password.js
import { useState, useEffect } from 'react';
import api from "../services/api";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import { useNotification } from '../components/NotificationPopup';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('email'); // 'email', 'verify', 'reset'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { showNotification } = useNotification();
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  // Get email from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Password validation
  useEffect(() => {
    if (newPassword) {
      setPasswordValidation({
        minLength: newPassword.length >= 8,
        hasUpperCase: /[A-Z]/.test(newPassword),
        hasLowerCase: /[a-z]/.test(newPassword),
        hasNumber: /\d/.test(newPassword),
        hasSpecialChar: /[!@#$%^&*(),.?\":{}|<>]/.test(newPassword)
      });
    }
  }, [newPassword]);

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isPasswordValid = () => {
    return Object.values(passwordValidation).every(valid => valid);
  };

  const handleSendResetCode = async () => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      showNotification('warning', 'Please enter a valid email address!');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(response.data.message);
      showNotification('success', 'Reset code sent to your email successfully!');
      setStep('verify');
      setResendCooldown(60);
    } catch (err) {
      console.error('Send reset code error:', err);
      setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
      showNotification('error', 'Failed to send reset code. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!resetCode || resetCode.length !== 6) {
      setError('Please enter the 6-digit reset code');
      showNotification('warning', 'Please enter the complete 6-digit reset code!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-reset-code', {
        email: email.trim(),
        code: resetCode
      });
      
      setSuccess('Code verified! Please set your new password.');
      showNotification('success', 'Reset code verified successfully!');
      setStep('reset');
    } catch (err) {
      console.error('Verify code error:', err);
      setError(err.response?.data?.message || 'Failed to verify code. Please try again.');
      showNotification('error', 'Invalid or expired reset code. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      showNotification('warning', 'Please fill in both password fields!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      showNotification('warning', 'Passwords do not match!');
      return;
    }

    if (!isPasswordValid()) {
      setError('Password does not meet all requirements');
      showNotification('warning', 'Password does not meet security requirements!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/reset-password', {
        email: email.trim(),
        code: resetCode,
        newPassword,
        confirmPassword
      });
      
      setSuccess(response.data.message);
      showNotification('success', 'Password reset successfully! Redirecting to login...');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.join('. '));
        showNotification('error', 'Password reset failed. Please check requirements!');
      } else {
        setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        showNotification('error', 'Failed to reset password. Please try again!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/resend-reset-code', { email: email.trim() });
      setSuccess('New reset code sent to your email');
      showNotification('success', 'New reset code sent to your email!');
      setResendCooldown(60);
    } catch (err) {
      console.error('Resend code error:', err);
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
      showNotification('error', 'Failed to resend reset code. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (step === 'email' && isValidEmail(email)) {
        handleSendResetCode();
      } else if (step === 'verify' && resetCode.length === 6) {
        handleVerifyCode();
      } else if (step === 'reset' && newPassword && confirmPassword && isPasswordValid()) {
        handleResetPassword();
      }
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'email':
        return 'Reset your password';
      case 'verify':
        return 'Enter reset code';
      case 'reset':
        return 'Create new password';
      default:
        return 'Reset your password';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'email':
        return 'Enter your email address and we\'ll send you a reset code';
      case 'verify':
        return `We've sent a 6-digit code to ${email}`;
      case 'reset':
        return 'Choose a strong password for your account';
      default:
        return '';
    }
  };
  
  // return (
  //   <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
  //     <div className="max-w-md w-full">
  //       {/* Main Card */}
  //       <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
  //         {/* Header */}
  //         <div className="text-center mb-8">
  //           <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
  //             <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  //             </svg>
  //           </div>
  //           <h1 className="text-3xl font-bold text-gray-900 mb-2">
  //             {getStepTitle()}
  //           </h1>
  //           <p className="text-gray-500">{getStepDescription()}</p>
  //         </div>

  //         {/* Success Message */}
  //         {success && (
  //           <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
  //             <div className="flex">
  //               <div className="flex-shrink-0">
  //                 <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
  //                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  //                 </svg>
  //               </div>
  //               <div className="ml-3">
  //                 <p className="text-sm text-green-800">{success}</p>
  //                 {step === 'reset' && success.includes('successful') && (
  //                   <p className="text-xs text-green-600 mt-1">Redirecting to login page...</p>
  //                 )}
  //               </div>
  //             </div>
  //           </div>
  //         )}

  //         {/* Error Message */}
  //         {error && (
  //           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
  //             <div className="flex">
  //               <div className="flex-shrink-0">
  //                 <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
  //                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
  //                 </svg>
  //               </div>
  //               <div className="ml-3">
  //                 <p className="text-sm text-red-800">{error}</p>
  //               </div>
  //             </div>
  //           </div>
  //         )}

  //         {/* Step 1: Email Input */}
  //         {step === 'email' && (
  //           <div className="space-y-6">
  //             <div>
  //               <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                 Email address
  //               </label>
  //               <input
  //                 type="email"
  //                 value={email}
  //                 onChange={(e) => setEmail(e.target.value)}
  //                 onKeyPress={handleKeyPress}
  //                 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
  //                 placeholder="Enter your email address"
  //                 autoFocus
  //               />
  //             </div>

  //             <button
  //               onClick={handleSendResetCode}
  //               disabled={isLoading || !isValidEmail(email)}
  //               className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //             >
  //               {isLoading ? (
  //                 <>
  //                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
  //                   Sending code...
  //                 </>
  //               ) : (
  //                 <>
  //                   Send reset code
  //                   <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  //                   </svg>
  //                 </>
  //               )}
  //             </button>
  //           </div>
  //         )}

  //         {/* Step 2: Verify Code */}
  //         {step === 'verify' && (
  //           <div className="space-y-6">
  //             <div>
  //               <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                 Reset Code
  //               </label>
  //               <input
  //                 type="text"
  //                 value={resetCode}
  //                 onChange={(e) => {
  //                   const value = e.target.value.replace(/\D/g, "").slice(0, 6);
  //                   setResetCode(value);
  //                 }}
  //                 onKeyPress={handleKeyPress}
  //                 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
  //                 placeholder="123456"
  //                 maxLength="6"
  //                 autoFocus
  //               />
  //               <p className="text-xs text-gray-500 mt-2 text-center">
  //                 Enter the 6-digit code sent to your email
  //               </p>
  //             </div>

  //             {/* Resend Section */}
  //             <div className="text-center">
  //               <p className="text-sm text-gray-600 mb-2">
  //                 Didn't receive the code?
  //               </p>
  //               <button
  //                 onClick={handleResendCode}
  //                 disabled={resendCooldown > 0 || isLoading}
  //                 className="text-orange-600 hover:text-orange-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
  //               >
  //                 {resendCooldown > 0
  //                   ? `Resend code in ${resendCooldown}s`
  //                   : "Resend reset code"}
  //               </button>
  //             </div>

  //             <button
  //               onClick={handleVerifyCode}
  //               disabled={isLoading || resetCode.length !== 6}
  //               className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //             >
  //               {isLoading ? (
  //                 <>
  //                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
  //                   Verifying...
  //                 </>
  //               ) : (
  //                 <>
  //                   Verify code
  //                   <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  //                   </svg>
  //                 </>
  //               )}
  //             </button>
  //           </div>
  //         )}

  //         {/* Step 3: Reset Password */}
  //         {step === 'reset' && (
  //           <div className="space-y-6">
  //             {/* New Password */}
  //             <div>
  //               <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                 New Password
  //               </label>
  //               <div className="relative">
  //                 <input
  //                   type={showPassword ? "text" : "password"}
  //                   value={newPassword}
  //                   onChange={(e) => setNewPassword(e.target.value)}
  //                   onKeyPress={handleKeyPress}
  //                   className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
  //                   placeholder="Enter new password"
  //                   autoFocus
  //                 />
  //                 <button
  //                   type="button"
  //                   onClick={() => setShowPassword(!showPassword)}
  //                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
  //                 >
  //                   {showPassword ? (
  //                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
  //                     </svg>
  //                   ) : (
  //                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.639 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.639 0-8.573-3.007-9.963-7.178z" />
  //                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  //                     </svg>
  //                   )}
  //                 </button>
  //               </div>
  //             </div>

  //             {/* Password Requirements */}
  //             {newPassword && (
  //               <div className="bg-gray-50 rounded-lg p-4">
  //                 <p className="text-sm font-medium text-gray-700 mb-2">Password requirements:</p>
  //                 <div className="space-y-1">
  //                   <div className={`flex items-center text-xs ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
  //                     <svg className={`w-3 h-3 mr-2 ${passwordValidation.minLength ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
  //                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  //                     </svg>
  //                     At least 8 characters
  //                   </div>
  //                   <div className={`flex items-center text-xs ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
  //                     <svg className={`w-3 h-3 mr-2 ${passwordValidation.hasUpperCase ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
  //                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  //                     </svg>
  //                     One uppercase letter
  //                   </div>
  //                   <div className={`flex items-center text-xs ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
  //                     <svg className={`w-3 h-3 mr-2 ${passwordValidation.hasLowerCase ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
  //                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  //                     </svg>
  //                     One lowercase letter
  //                   </div>
  //                   <div className={`flex items-center text-xs ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
  //                     <svg className={`w-3 h-3 mr-2 ${passwordValidation.hasNumber ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
  //                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  //                     </svg>
  //                     One number
  //                   </div>
  //                   <div className={`flex items-center text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
  //                     <svg className={`w-3 h-3 mr-2 ${passwordValidation.hasSpecialChar ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
  //                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  //                     </svg>
  //                     One special character
  //                   </div>
  //                 </div>
  //               </div>
  //             )}

  //             {/* Confirm Password */}
  //             <div>
  //               <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                 Confirm New Password
  //               </label>
  //               <div className="relative">
  //                 <input
  //                   type={showConfirmPassword ? "text" : "password"}
  //                   value={confirmPassword}
  //                   onChange={(e) => setConfirmPassword(e.target.value)}
  //                   onKeyPress={handleKeyPress}
  //                   className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
  //                   placeholder="Confirm new password"
  //                 />
  //                 <button
  //                   type="button"
  //                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
  //                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
  //                 >
  //                   {showConfirmPassword ? (
  //                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
  //                     </svg>
  //                   ) : (
  //                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.639 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.639 0-8.573-3.007-9.963-7.178z" />
  //                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  //                     </svg>
  //                   )}
  //                 </button>
  //               </div>
  //               {confirmPassword && newPassword !== confirmPassword && (
  //                 <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
  //               )}
  //             </div>

  //             <button
  //               onClick={handleResetPassword}
  //               disabled={isLoading || !newPassword || !confirmPassword || !isPasswordValid() || newPassword !== confirmPassword}
  //               className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //             >
  //               {isLoading ? (
  //                 <>
  //                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
  //                   Resetting password...
  //                 </>
  //               ) : (
  //                 <>
  //                   Reset password
  //                   <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  //                   </svg>
  //                 </>
  //               )}
  //             </button>
  //           </div>
  //         )}

  //         {/* Back to Login */}
  //         <div className="mt-8 text-center">
  //           <p className="text-gray-500">
  //             Remember your password?{' '}
  //             <a 
  //               href="/login"
  //               className="text-gray-900 font-semibold hover:underline transition-colors duration-200"
  //             >
  //               Sign in
  //             </a>
  //           </p>
  //         </div>
  //       </div>

  //       {/* Bottom Links */}
  //       <div className="mt-6 text-center space-x-4 text-sm">
  //         <a href="#" className="text-gray-500 hover:text-gray-700">Privacy Policy</a>
  //         <span className="text-gray-300">•</span>
  //         <a href="#" className="text-gray-500 hover:text-gray-700">Terms of Service</a>
  //       </div>
  //     </div>
  //   </div>
  // );

// return (
//   <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-20">
//     <div className="max-w-md w-full">
//       {/* Main Card */}
//       <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(90, 51, 255, 0.1)" }}>
//             <svg className="w-8 h-8" style={{ color: "#5A33FF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//             </svg>
//           </div>
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">
            
//           </h1>
//           <p className="text-gray-500">{getStepDescription()}</p>
//         </div>

//         {/* Success Message */}
//         {success && (
//           <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
//             <div className="flex">
//               <div className="flex-shrink-0">
//                 <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                 </svg>
//               </div>
//               <div className="ml-3">
//                 <p className="text-sm text-green-800">{success}</p>
//                 {step === 'reset' && success.includes('successful') && (
//                   <p className="text-xs text-green-600 mt-1">Redirecting to login page...</p>
//                 )}
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Error Message */}
//         {error && (
//           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
//             <div className="flex">
//               <div className="flex-shrink-0">
//                 <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
//                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                 </svg>
//               </div>
//               <div className="ml-3">
//                 <p className="text-sm text-red-800">{error}</p>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Step 1: Email Input */}
//         {step === 'email' && (
//           <div className="space-y-6">
//             <div>
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 Email address
//               </label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 onKeyPress={handleKeyPress}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                 placeholder="Enter your email address"
//                 autoFocus
//               />
//             </div>

//             <button
//               onClick={handleSendResetCode}
//               disabled={isLoading || !isValidEmail(email)}
//               className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//               style={{ backgroundColor: "#5A33FF" }}
//             >
//               {isLoading ? (
//                 <>
//                   <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
//                   Sending code...
//                 </>
//               ) : (
//                 "Send reset code"
//               )}
//             </button>
//           </div>
//         )}

//         {/* Step 2: Verify Code */}
//         {step === 'verify' && (
//           <div className="space-y-6">
//             <div>
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 Reset Code
//               </label>
//               <input
//                 type="text"
//                 value={resetCode}
//                 onChange={(e) => {
//                   const value = e.target.value.replace(/\D/g, "").slice(0, 6);
//                   setResetCode(value);
//                 }}
//                 onKeyPress={handleKeyPress}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
//                 placeholder="123456"
//                 maxLength="6"
//                 autoFocus
//               />
//               <p className="text-xs text-gray-500 mt-2 text-center">
//                 Enter the 6-digit code sent to your email
//               </p>
//             </div>

//             {/* Resend Section */}
//             <div className="text-center">
//               <p className="text-sm text-gray-600 mb-2">
//                 Didn't receive the code?
//               </p>
//               <button
//                 onClick={handleResendCode}
//                 disabled={resendCooldown > 0 || isLoading}
//                 className="text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
//                 style={{ color: "#5A33FF" }}
//               >
//                 {resendCooldown > 0
//                   ? `Resend code in ${resendCooldown}s`
//                   : "Resend reset code"}
//               </button>
//             </div>

//             <button
//               onClick={handleVerifyCode}
//               disabled={isLoading || resetCode.length !== 6}
//               className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//               style={{ backgroundColor: "#5A33FF" }}
//             >
//               {isLoading ? (
//                 <>
//                   <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
//                   Verifying...
//                 </>
//               ) : (
//                 "Verify code"
//               )}
//             </button>
//           </div>
//         )}

//         {/* Step 3: Reset Password */}
//         {step === 'reset' && (
//           <div className="space-y-6">
//             {/* New Password */}
//             <div>
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 New Password
//               </label>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   value={newPassword}
//                   onChange={(e) => setNewPassword(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                   placeholder="Enter new password"
//                   autoFocus
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
//                 >
//                   {showPassword ? (
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                     </svg>
//                   ) : (
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                     </svg>
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* Password Requirements */}
//             {newPassword && (
//               <div className="bg-gray-50 rounded-lg p-4">
//                 <p className="text-sm font-medium text-gray-700 mb-2">Password requirements:</p>
//                 <div className="space-y-1">
//                   <div className={`flex items-center text-xs ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
//                     <svg className={`w-3 h-3 mr-2 ${passwordValidation.minLength ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                     </svg>
//                     At least 8 characters
//                   </div>
//                   <div className={`flex items-center text-xs ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
//                     <svg className={`w-3 h-3 mr-2 ${passwordValidation.hasUpperCase ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                     </svg>
//                     One uppercase letter
//                   </div>
//                   <div className={`flex items-center text-xs ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
//                     <svg className={`w-3 h-3 mr-2 ${passwordValidation.hasLowerCase ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                     </svg>
//                     One lowercase letter
//                   </div>
//                   <div className={`flex items-center text-xs ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
//                     <svg className={`w-3 h-3 mr-2 ${passwordValidation.hasNumber ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                     </svg>
//                     One number
//                   </div>
//                   <div className={`flex items-center text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
//                     <svg className={`w-3 h-3 mr-2 ${passwordValidation.hasSpecialChar ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
//                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                     </svg>
//                     One special character
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Confirm Password */}
//             <div>
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 Confirm New Password
//               </label>
//               <div className="relative">
//                 <input
//                   type={showConfirmPassword ? "text" : "password"}
//                   value={confirmPassword}
//                   onChange={(e) => setConfirmPassword(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                   placeholder="Confirm new password"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
//                 >
//                   {showConfirmPassword ? (
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                     </svg>
//                   ) : (
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                     </svg>
//                   )}
//                 </button>
//               </div>
//               {confirmPassword && newPassword !== confirmPassword && (
//                 <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
//               )}
//             </div>

//             <button
//               onClick={handleResetPassword}
//               disabled={isLoading || !newPassword || !confirmPassword || !isPasswordValid() || newPassword !== confirmPassword}
//               className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//               style={{ backgroundColor: "#5A33FF" }}
//             >
//               {isLoading ? (
//                 <>
//                   <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
//                   Resetting password...
//                 </>
//               ) : (
//                 "Reset password"
//               )}
//             </button>
//           </div>
//         )}

//         {/* Back to Login */}
//         <div className="mt-8 text-center">
//           <p className="text-gray-600 text-sm">
//             Remember your password?{' '}
//             <a 
//               href="/login"
//               className="font-semibold hover:underline transition-colors duration-200"
//               style={{ color: "#5A33FF" }}
//             >
//               Sign in
//             </a>
//           </p>
//         </div>
//       </div>

//       {/* Bottom Links */}
//       <div className="mt-6 text-center space-x-4 text-sm">
//         <a href="#" className="text-gray-500 hover:text-gray-700">Privacy Policy</a>
//         <span className="text-gray-300">•</span>
//         <a href="#" className="text-gray-500 hover:text-gray-700">Terms of Service</a>
//       </div>
//     </div>
//   </div>
// );

// return (
//   <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-20">
//     <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
//       {/* Left Side - Form */}
//       <div className="w-full lg:w-1/2 max-w-md order-2 lg:order-1">
//         <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
//           <div className="text-center mb-8">
//           <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(90, 51, 255, 0.1)" }}>
//             <svg className="w-8 h-8" style={{ color: "#5A33FF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//             </svg>
//           </div>
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">
//             {getStepTitle()}
//           </h1>
//         </div>
//           {/* Success Message */}
//           {success && (
//             <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
//               <div className="flex">
//                 <div className="flex-shrink-0">
//                   <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                   </svg>
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm text-green-800">{success}</p>
//                   {step === 'reset' && success.includes('successful') && (
//                     <p className="text-xs text-green-600 mt-1">Redirecting to login page...</p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Error Message */}
//           {error && (
//             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
//               <div className="flex">
//                 <div className="flex-shrink-0">
//                   <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
//                     <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
//                   </svg>
//                 </div>
//                 <div className="ml-3">
//                   <p className="text-sm text-red-800">{error}</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Step 1: Email Input */}
//           {step === 'email' && (
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-semibold text-gray-900 mb-2">
//                   Email address
//                 </label>
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                   placeholder="Enter your email address"
//                   autoFocus
//                 />
//               </div>

//               <button
//                 onClick={handleSendResetCode}
//                 disabled={isLoading || !isValidEmail(email)}
//                 className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//                 style={{ backgroundColor: "#5A33FF" }}
//               >
//                 {isLoading ? (
//                   <>
//                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
//                     Sending code...
//                   </>
//                 ) : (
//                   "Send reset code"
//                 )}
//               </button>
//             </div>
//           )}

//           {/* Step 2: Verify Code */}
//           {step === 'verify' && (
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-semibold text-gray-900 mb-2">
//                   Reset Code
//                 </label>
//                 <input
//                   type="text"
//                   value={resetCode}
//                   onChange={(e) => {
//                     const value = e.target.value.replace(/\D/g, "").slice(0, 6);
//                     setResetCode(value);
//                   }}
//                   onKeyPress={handleKeyPress}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
//                   placeholder="123456"
//                   maxLength="6"
//                   autoFocus
//                 />
//                 <p className="text-xs text-gray-500 mt-2 text-center">
//                   Enter the 6-digit code sent to your email
//                 </p>
//               </div>

//               {/* Resend Section */}
//               <div className="text-center">
//                 <p className="text-sm text-gray-600 mb-2">
//                   Didn't receive the code?
//                 </p>
//                 <button
//                   onClick={handleResendCode}
//                   disabled={resendCooldown > 0 || isLoading}
//                   className="text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
//                   style={{ color: "#5A33FF" }}
//                 >
//                   {resendCooldown > 0
//                     ? `Resend code in ${resendCooldown}s`
//                     : "Resend reset code"}
//                 </button>
//               </div>

//               <button
//                 onClick={handleVerifyCode}
//                 disabled={isLoading || resetCode.length !== 6}
//                 className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//                 style={{ backgroundColor: "#5A33FF" }}
//               >
//                 {isLoading ? (
//                   <>
//                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
//                     Verifying...
//                   </>
//                 ) : (
//                   "Verify code"
//                 )}
//               </button>
//             </div>
//           )}

//           {/* Step 3: Reset Password */}
//           {step === 'reset' && (
//             <div className="space-y-6">
//               {/* New Password */}
//               <div>
//                 <label className="block text-sm font-semibold text-gray-900 mb-2">
//                   New Password
//                 </label>
//                 <div className="relative">
//                   <input
//                     type={showPassword ? "text" : "password"}
//                     value={newPassword}
//                     onChange={(e) => setNewPassword(e.target.value)}
//                     onKeyPress={handleKeyPress}
//                     className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                     placeholder="Enter new password"
//                     autoFocus
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
//                   >
//                     {showPassword ? (
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                       </svg>
//                     ) : (
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                       </svg>
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {/* Password Requirements */}
//               {newPassword && (
//                 <div className="bg-gray-50 rounded-lg p-4">
//                   <p className="text-sm font-medium text-gray-700 mb-2">Password requirements:</p>
//                   <div className="space-y-1">
//                     <div className={`flex items-center text-xs ${passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}`}>
//                       <svg className={`w-3 h-3 mr-2 ${passwordValidation.minLength ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                       </svg>
//                       At least 8 characters
//                     </div>
//                     <div className={`flex items-center text-xs ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
//                       <svg className={`w-3 h-3 mr-2 ${passwordValidation.hasUpperCase ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                       </svg>
//                       One uppercase letter
//                     </div>
//                     <div className={`flex items-center text-xs ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
//                       <svg className={`w-3 h-3 mr-2 ${passwordValidation.hasLowerCase ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                       </svg>
//                       One lowercase letter
//                     </div>
//                     <div className={`flex items-center text-xs ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
//                       <svg className={`w-3 h-3 mr-2 ${passwordValidation.hasNumber ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                       </svg>
//                       One number
//                     </div>
//                     <div className={`flex items-center text-xs ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
//                       <svg className={`w-3 h-3 mr-2 ${passwordValidation.hasSpecialChar ? 'text-green-500' : 'text-red-500'}`} fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                       </svg>
//                       One special character
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Confirm Password */}
//               <div>
//                 <label className="block text-sm font-semibold text-gray-900 mb-2">
//                   Confirm New Password
//                 </label>
//                 <div className="relative">
//                   <input
//                     type={showConfirmPassword ? "text" : "password"}
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                     onKeyPress={handleKeyPress}
//                     className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                     placeholder="Confirm new password"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
//                   >
//                     {showConfirmPassword ? (
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                       </svg>
//                     ) : (
//                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                       </svg>
//                     )}
//                   </button>
//                 </div>
//                 {confirmPassword && newPassword !== confirmPassword && (
//                   <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
//                 )}
//               </div>

//               <button
//                 onClick={handleResetPassword}
//                 disabled={isLoading || !newPassword || !confirmPassword || !isPasswordValid() || newPassword !== confirmPassword}
//                 className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//                 style={{ backgroundColor: "#5A33FF" }}
//               >
//                 {isLoading ? (
//                   <>
//                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
//                     Resetting password...
//                   </>
//                 ) : (
//                   "Reset password"
//                 )}
//               </button>
//             </div>
//           )}

//           {/* Back to Login */}
//           <div className="mt-8 text-center">
//             <p className="text-gray-600 text-sm">
//               Remember your password?{' '}
//               <a 
//                 href="/login"
//                 className="font-semibold hover:underline transition-colors duration-200"
//                 style={{ color: "#5A33FF" }}
//               >
//                 Sign in
//               </a>
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Right Side - Branding (Hidden on mobile) */}
//       <div className="hidden lg:flex w-full lg:w-1/2 flex-col items-center text-center order-1 lg:order-2 pl-16">
//         <div
//           className="w-40 h-40 rounded-full flex items-center justify-center mb-6"
//           style={{ backgroundColor: "#5A33FF" }}
//         >
//           <img
//             src="/bug.png"
//             alt="BugTracker Logo"
//             className="w-24 h-24 object-contain"
//             onError={(e) => {
//               e.target.style.display = "none";
//               e.target.parentElement.innerHTML =
//                 '<svg class="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>';
//             }}
//           />
//         </div>
//         <h1 className="text-5xl font-bold text-gray-900 mb-3">Smellify</h1>
//         <p className="text-xl text-gray-600">
//           {step === 'email' ? 'Reset Your Password' : 
//            step === 'verify' ? 'Verify Your Email' : 
//            step === 'reset' ? 'Create New Password' : 
//            'Reset Your Password'}
//         </p>
//       </div>
//     </div>
//   </div>
// );



return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16">
        <div className="flex flex-col items-center justify-center gap-10 lg:flex-row lg:items-stretch lg:gap-40">
          {/* Left marketing panel (hidden on mobile) */}
          <div className="hidden w-full max-w-xl lg:block">
            <div 
              className="flex h-full flex-col justify-center px-2 text-center lg:px-0 lg:text-left animate-slide-in-left"
              style={{ 
                opacity: 0,
                animationFillMode: 'forwards'
              }}
            >
              <div className="mx-auto mb-8 flex items-center gap-3 lg:mx-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5a33ff] text-white shadow-sm">
                  <img src="/bug.png" alt="Bug" className="h-8 w-8" />
                </div>
                <span className="text-3xl font-bold text-[#5a33ff]">Smellify</span>
              </div>

              <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Forgot your
                <br />
                <span className="bg-gradient-to-r from-[#5a33ff] to-indigo-500 bg-clip-text text-transparent">
                  password?
                </span>
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600">
                No worries! We'll help you reset it and get you back to writing cleaner code in no time.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  "Secure password reset process",
                  "Quick email verification",
                  "Back to coding in minutes",
                ].map((t, index) => (
                  <div 
                    key={t} 
                    className="flex items-center gap-3 text-gray-600 animate-fade-in-up"
                    style={{ 
                      animationDelay: `${index * 150}ms`,
                      opacity: 0,
                      animationFillMode: 'forwards'
                    }}
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#5a33ff] text-white">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right form card */}
          <div className="w-full max-w-md">
            <div 
              className="rounded-[32px] border border-gray-100 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-9 animate-slide-in-right"
              style={{ 
                opacity: 0,
                animationFillMode: 'forwards'
              }}
            >
              {/* Header */}
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-50">
                  <KeyRound className="h-7 w-7 text-[#5a33ff]" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {getStepTitle()}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {getStepDescription()}
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm text-green-800">{success}</p>
                      {step === "reset" && success.includes("successful") && (
                        <p className="mt-1 text-xs text-green-600">
                          Redirecting to login page...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Step 1: Email Input */}
              {step === "email" && (
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-[#7d5aff] focus:ring-4 focus:ring-[#b89fff]"
                        placeholder="name@example.com"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSendResetCode}
                    disabled={isLoading || !isValidEmail(email)}
                    className="group flex h-12 w-full items-center justify-center rounded-full bg-[#5a33ff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4a29cc] focus:outline-none focus:ring-4 focus:ring-[#9d7fff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      "Sending code..."
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Send reset code
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Step 2: Verify Code */}
              {step === "verify" && (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-[#5a33ff]">
                      <Shield className="h-7 w-7" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      Reset Code
                    </label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setResetCode(value);
                      }}
                      onKeyPress={handleKeyPress}
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-center text-xl tracking-[0.35em] text-gray-900 outline-none transition focus:border-[#7d5aff] focus:ring-4 focus:ring-[#b89fff]"
                      placeholder="123456"
                      maxLength="6"
                      autoFocus
                    />
                    <p className="mt-2 text-center text-xs text-gray-500">
                      Enter the 6-digit code sent to your email
                    </p>
                  </div>

                  <button
                    onClick={handleVerifyCode}
                    disabled={isLoading || resetCode.length !== 6}
                    className="h-12 w-full rounded-full bg-[#5a33ff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4a29cc] focus:outline-none focus:ring-4 focus:ring-[#9d7fff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Verifying..." : "Verify code"}
                  </button>

                  <div className="text-center">
                    <p className="mb-2 text-sm text-gray-600">Didn't receive the code?</p>
                    <button
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || isLoading}
                      className="text-sm font-semibold text-[#5a33ff] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Resend reset code"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Reset Password */}
              {step === "reset" && (
                <div className="space-y-5">
                  {/* New Password */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-12 text-sm text-gray-900 outline-none transition focus:border-[#7d5aff] focus:ring-4 focus:ring-[#b89fff]"
                        placeholder="••••••••"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  {newPassword && (
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-out ${
                        newPassword
                          ? "max-h-40 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {[
                          {
                            label: "At least 8 characters",
                            ok: passwordValidation.minLength,
                          },
                          {
                            label: "One uppercase letter",
                            ok: passwordValidation.hasUpperCase,
                          },
                          {
                            label: "One lowercase letter",
                            ok: passwordValidation.hasLowerCase,
                          },
                          {
                            label: "One number",
                            ok: passwordValidation.hasNumber,
                          },
                          {
                            label: "One special character",
                            ok: passwordValidation.hasSpecialChar,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-2 text-xs transition-transform duration-300"
                          >
                            <span
                              className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                                item.ok
                                  ? "border-green-200 bg-green-50 text-green-600"
                                  : "border-gray-200 bg-white text-gray-400"
                              }`}
                            >
                              {item.ok ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                              )}
                            </span>
                            <span
                              className={
                                item.ok ? "text-green-600" : "text-gray-500"
                              }
                            >
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirm Password */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-12 text-sm text-gray-900 outline-none transition focus:border-[#7d5aff] focus:ring-4 focus:ring-[#b89fff]"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                        aria-label={
                          showConfirmPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-2 text-xs text-red-600">
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleResetPassword}
                    disabled={
                      isLoading ||
                      !newPassword ||
                      !confirmPassword ||
                      !isPasswordValid() ||
                      newPassword !== confirmPassword
                    }
                    className="group flex h-12 w-full items-center justify-center rounded-full bg-[#5a33ff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4a29cc] focus:outline-none focus:ring-4 focus:ring-[#9d7fff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      "Resetting password..."
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Reset password
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Back to Login */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Remember your password?{" "}
                  <a
                    href="/login"
                    className="font-semibold text-[#5a33ff] hover:underline"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Hide browser password toggle */}
          <style jsx>{`
            input[type="password"]::-ms-reveal,
            input[type="password"]::-ms-clear {
              display: none;
            }
            input[type="password"]::-webkit-credentials-auto-fill-button,
            input[type="password"]::-webkit-strong-password-auto-fill-button {
              display: none !important;
            }

            @keyframes fade-in-up {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .animate-fade-in-up {
              animation: fade-in-up 0.6s ease-out;
            }

            @keyframes slide-in-left {
              from {
                opacity: 0;
                transform: translateX(-50px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }

            .animate-slide-in-left {
              animation: slide-in-left 0.8s ease-out;
            }

            @keyframes slide-in-right {
              from {
                opacity: 0;
                transform: translateX(50px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }

            .animate-slide-in-right {
              animation: slide-in-right 0.8s ease-out;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}