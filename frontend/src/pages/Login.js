// import { useState, useEffect } from 'react';
// import api from "../services/api";

// export default function Login() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [verificationCode, setVerificationCode] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showPasswordText, setShowPasswordText] = useState(false);
//   const [step, setStep] = useState('email'); // 'email', 'password', 'verify'
//   const [error, setError] = useState('');
//   const [resendCooldown, setResendCooldown] = useState(0);

//   // Countdown timer for resend button
//   useEffect(() => {
//     let timer;
//     if (resendCooldown > 0) {
//       timer = setInterval(() => {
//         setResendCooldown((prev) => prev - 1);
//       }, 1000);
//     }
//     return () => clearInterval(timer);
//   }, [resendCooldown]);

//   const isValidEmail = (email) => {
//     return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
//   };

//   const handleEmailContinue = () => {
//     if (isValidEmail(email)) {
//       setError('');
//       setStep('password');
//       setShowPassword(true);
//     } else {
//       setError('Please enter a valid email address');
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter') {
//       if (step === 'email' && isValidEmail(email)) {
//         handleEmailContinue();
//       } else if (step === 'password' && password) {
//         handleLogin();
//       } else if (step === 'verify' && verificationCode.length === 6) {
//         handleVerifyEmail();
//       }
//     }
//   };

//   // Updated redirect function with better logic
//   // Updated redirect function with role-based logic
// const redirectAfterLogin = (user) => {
//   // Check user role first
//   if (user.role === 2) {
//     // Admin user - redirect to admin page
//     window.location.href = '/admin';
//     return;
//   }

//   // Regular user (role 1) - check if profile is complete
//   const isProfileComplete = user.name && user.isOnboardingComplete;

//   if (isProfileComplete) {
//     // Profile is complete - go to dashboard
//     window.location.href = '/dashboard';
//   } else {
//     // Profile is incomplete - go to onboarding
//     window.location.href = '/onboarding';
//   }
// };

//   const handleLogin = async () => {
//     if (!password) {
//       setError('Please enter your password');
//       return;
//     }

//     if (!isValidEmail(email)) {
//       setError('Please enter a valid email address');
//       return;
//     }

//     setIsLoading(true);
//     setError('');

//     try {
//       const response = await api.post('/auth/login', {
//         email: email.trim(),
//         password: password
//       });

//       console.log('Login successful:', response.data);

//       // Store the JWT token
//       const { token, user } = response.data;
//       localStorage.setItem('token', token);
//       localStorage.setItem('user', JSON.stringify(user));

//       // Redirect based on user profile status
//       redirectAfterLogin(user);

//     } catch (err) {
//       console.error('Login error:', err);

//       // Handle different types of errors
//       if (err.response?.status === 400) {
//         const errorData = err.response?.data;
//         const errorMessage = errorData?.message;

//         // Check if this is an email verification issue
//         if (errorData?.needsVerification || errorMessage?.includes('Email not verified')) {
//           // User exists but email not verified - move to verification step
//           setStep('verify');
//           setResendCooldown(60);
//           setError(''); // Clear any error since we're moving to verification step
//           return; // Exit early, don't set other errors
//         } else if (errorMessage === 'Invalid email or password') {
//           setError('Invalid email or password. Please try again.');
//         } else {
//           setError(errorMessage || 'Login failed. Please try again.');
//         }
//       } else if (err.response?.status === 401) {
//         setError('Invalid email or password. Please try again.');
//       } else if (err.response?.status === 404) {
//         setError('No account found with this email address.');
//       } else if (err.response?.status === 403) {
//         setError('Your account has been suspended. Please contact support.');
//       } else if (err.response?.status >= 500) {
//         setError('Server error. Please try again later.');
//       } else {
//         setError('Login failed. Please check your internet connection and try again.');
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleVerifyEmail = async () => {
//     if (!verificationCode || verificationCode.length !== 6) {
//       setError('Please enter the 6-digit verification code');
//       return;
//     }

//     setIsLoading(true);
//     setError('');

//     try {
//       const response = await api.post('/auth/verify-email', {
//         email: email.trim(),
//         code: verificationCode,
//       });

//       console.log('Verification successful:', response.data);

//       // After successful verification, automatically log the user in
//       try {
//         const loginResponse = await api.post('/auth/login', {
//           email: email.trim(),
//           password: password
//         });

//         // Store the JWT token
//         const { token, user } = loginResponse.data;
//         localStorage.setItem('token', token);
//         localStorage.setItem('user', JSON.stringify(user));

//         // Redirect based on user profile status
//         redirectAfterLogin(user);

//       } catch (loginErr) {
//         console.error('Auto-login after verification failed:', loginErr);
//         setError('Email verified! Please try logging in again.');
//         setStep('password'); // Go back to password step
//       }

//     } catch (err) {
//       console.error('Verification error:', err);

//       if (err.response?.data?.message) {
//         setError(err.response.data.message);
//       } else if (err.message === 'Invalid verification code') {
//         setError('Invalid verification code. Please try again.');
//       } else {
//         setError('Verification failed. Please try again.');
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResendCode = async () => {
//     if (resendCooldown > 0) return;

//     setIsLoading(true);
//     setError('');

//     try {
//       await api.post('/auth/resend-verification', {
//         email: email.trim(),
//       });

//       setResendCooldown(60);
//       setError(''); // Clear any existing errors

//     } catch (err) {
//       console.error('Resend error:', err);

//       if (err.response?.data?.message) {
//         setError(err.response.data.message);
//       } else {
//         setError('Failed to resend verification code. Please try again.');
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleBackToEmail = () => {
//     setStep('email');
//     setShowPassword(false);
//     setPassword('');
//     setError('');
//   };

//   const handleBackToPassword = () => {
//     setStep('password');
//     setVerificationCode('');
//     setError('');
//   };

//   const handleGitHubLogin = () => {
//     // Redirect to GitHub OAuth endpoint
//     window.location.href = `http://localhost:5000/api/github/login`;
//   };

//   const handleForgotPassword = () => {
//     if (email && isValidEmail(email)) {
//       window.location.href = `/forgot-password?email=${encodeURIComponent(email)}`;
//     } else {
//       window.location.href = '/forgot-password';
//     }
//   };

//   const getStepTitle = () => {
//     switch (step) {
//       case 'email':
//         return 'Sign in to Smellify';
//       case 'password':
//         return 'Sign in to Smellify';
//       case 'verify':
//         return 'Verify your email';
//       default:
//         return 'Sign in to Smellify';
//     }
//   };

//   const getStepDescription = () => {
//     switch (step) {
//       case 'email':
//         return 'Welcome back! Please sign in to continue';
//       case 'password':
//         return 'Welcome back! Please sign in to continue';
//       case 'verify':
//         return `We've sent a verification code to ${email}`;
//       default:
//         return 'Welcome back! Please sign in to continue';
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
//       <div className="max-w-md w-full">
//         {/* Main Card */}
//         <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
//           {/* Header */}
//           <div className="text-center mb-8">
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">
//               {getStepTitle()}
//             </h1>
//             <p className="text-gray-500">{getStepDescription()}</p>
//           </div>

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

//           {/* Email Verification Step */}
//           {step === 'verify' && (
//             <div className="space-y-6">
//               {/* Email Icon */}
//               <div className="flex justify-center">
//                 <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
//                   <svg
//                     className="w-8 h-8 text-blue-600"
//                     fill="none"
//                     stroke="currentColor"
//                     viewBox="0 0 24 24"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={2}
//                       d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
//                     />
//                   </svg>
//                 </div>
//               </div>

//               {/* Verification Input */}
//               <div>
//                 <label className="block text-sm font-semibold text-gray-900 mb-2">
//                   Verification Code
//                 </label>
//                 <input
//                   type="text"
//                   value={verificationCode}
//                   onChange={(e) => {
//                     const value = e.target.value.replace(/\D/g, "").slice(0, 6);
//                     setVerificationCode(value);
//                   }}
//                   onKeyPress={handleKeyPress}
//                   className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
//                   placeholder="123456"
//                   maxLength="6"
//                   autoFocus
//                 />
//                 <p className="text-xs text-gray-500 mt-2 text-center">
//                   Enter the 6-digit code we sent to your email
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
//                   className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
//                 >
//                   {resendCooldown > 0
//                     ? `Resend code in ${resendCooldown}s`
//                     : "Resend verification code"}
//                 </button>
//               </div>

//               {/* Verify Button */}
//               <button
//                 onClick={handleVerifyEmail}
//                 disabled={isLoading || verificationCode.length !== 6}
//                 className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//               >
//                 {isLoading ? (
//                   <>
//                     <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
//                     Verifying...
//                   </>
//                 ) : (
//                   <>
//                     Verify & Sign in
//                     <svg
//                       className="w-4 h-4 ml-2"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M9 5l7 7-7 7"
//                       />
//                     </svg>
//                   </>
//                 )}
//               </button>
//             </div>
//           )}

//           {/* Email/Password Steps */}
//           {(step === 'email' || step === 'password') && (
//             <>
//               {/* OAuth Button */}
//               <button
//                 onClick={handleGitHubLogin}
//                 className="w-full mb-6 bg-white border-2 border-gray-200 rounded-xl py-3 px-4 flex items-center justify-center hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
//               >
//                 <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
//                   <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
//                 </svg>
//                 <span className="font-semibold text-gray-700">Continue with GitHub</span>
//               </button>

//               {/* Divider */}
//               <div className="relative mb-6">
//                 <div className="absolute inset-0 flex items-center">
//                   <div className="w-full border-t border-gray-200"></div>
//                 </div>
//                 <div className="relative flex justify-center text-sm">
//                   <span className="px-4 bg-white text-gray-500">or</span>
//                 </div>
//               </div>

//               {/* Progressive Form */}
//               <div className="space-y-4">
//                 {/* Email Field */}
//                 <div className={`transition-all duration-300 ${step === 'password' ? 'opacity-60' : ''}`}>
//                   <label className="block text-sm font-semibold text-gray-900 mb-2">
//                     Email address
//                   </label>
//                   <div className="relative">
//                     <input
//                       type="email"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       onKeyPress={handleKeyPress}
//                       disabled={step === 'password'}
//                       className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
//                       placeholder="Enter your email address"
//                     />
//                     {step === 'password' && (
//                       <button
//                         onClick={handleBackToEmail}
//                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700 font-medium text-sm"
//                       >
//                         Edit
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 {/* Password Field - Animated */}
//                 <div className={`transition-all duration-500 transform ${
//                   showPassword ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 h-0 overflow-hidden'
//                 }`}>
//                   {showPassword && (
//                     <div>
//                       <label className="block text-sm font-semibold text-gray-900 mb-2">
//                         Password
//                       </label>
//                       <div className="relative">
//                         <input
//                           type={showPasswordText ? "text" : "password"}
//                           value={password}
//                           onChange={(e) => setPassword(e.target.value)}
//                           onKeyPress={handleKeyPress}
//                           className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
//                           placeholder="Enter your password"
//                           autoFocus
//                           autoComplete="current-password"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setShowPasswordText(!showPasswordText)}
//                           className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 flex items-center justify-center w-5 h-5"
//                         >
//                           {showPasswordText ? (
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
//                             </svg>
//                           ) : (
//                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.639 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.639 0-8.573-3.007-9.963-7.178z" />
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                             </svg>
//                           )}
//                         </button>
//                       </div>

//                       {/* Forgot Password Link */}
//                       <div className="mt-2 text-right">
//                         <button
//                           onClick={handleForgotPassword}
//                           className="text-sm text-blue-600 hover:text-blue-700 font-medium"
//                         >
//                           Forgot password?
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* Continue/Login Button */}
//                 <button
//                   onClick={step === 'email' ? handleEmailContinue : handleLogin}
//                   disabled={
//                     isLoading ||
//                     (step === 'email' && !isValidEmail(email)) ||
//                     (step === 'password' && !password)
//                   }
//                   className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//                 >
//                   {isLoading ? (
//                     <>
//                       <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
//                       Signing in...
//                     </>
//                   ) : (
//                     <>
//                       {step === 'email' ? 'Continue' : 'Sign in'}
//                       <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
//                       </svg>
//                     </>
//                   )}
//                 </button>
//               </div>

//               {/* Footer */}
//               <div className="mt-8 text-center">
//                 <p className="text-gray-500">
//                   Don't have an account?{' '}
//                   <a
//                     href="/signup"
//                     className="text-gray-900 font-semibold hover:underline transition-colors duration-200"
//                   >
//                     Sign up
//                   </a>
//                 </p>
//               </div>
//             </>
//           )}
//         </div>

//         {/* Bottom Links */}
//         {step !== 'verify' && (
//           <div className="mt-6 text-center space-x-4 text-sm">
//             <a href="#" className="text-gray-500 hover:text-gray-700">Privacy Policy</a>
//             <span className="text-gray-300">•</span>
//             <a href="#" className="text-gray-500 hover:text-gray-700">Terms of Service</a>
//           </div>
//         )}
//       </div>

//       {/* CSS to hide browser password toggle */}
//       <style jsx>{`
//         input[type="password"]::-ms-reveal,
//         input[type="password"]::-ms-clear {
//           display: none;
//         }
//         input[type="password"]::-webkit-credentials-auto-fill-button,
//         input[type="password"]::-webkit-strong-password-auto-fill-button {
//           display: none !important;
//         }
//       `}</style>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import api from "../services/api";
import { useNotification } from "../components/NotificationPopup";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  CircleCheck,
} from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [step, setStep] = useState("email"); // 'email', 'password', 'verify', '2fa'
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  // ... your other state variables

  // Check for OAuth session messages on component mount
  useEffect(() => {
    const checkOAuthSessionMessages = async () => {
      try {
        // Use axios without authentication since this is login page
        const response = await api.get(`/github/session-message`);
        const { oauthError } = response.data;

        if (oauthError) {
          // Show error popup notification
          showNotification("error", oauthError);
          // OR if you have a custom error display function:
          // showError(oauthError);
        }
      } catch (error) {
        console.error("Failed to check OAuth session messages:", error);
        // Silently fail - don't show error to user as this is just checking for messages
      }
    };

    checkOAuthSessionMessages();
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

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailContinue = () => {
    if (isValidEmail(email)) {
      setError("");
      setStep("password");
      setShowPassword(true);
    } else {
      setError("Please enter a valid email address");
      showNotification("error", "Please enter a valid email address!");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (step === "email" && isValidEmail(email)) {
        handleEmailContinue();
      } else if (step === "password" && password) {
        handleLogin();
      } else if (step === "verify" && verificationCode.length === 6) {
        handleVerifyEmail();
      } else if (step === "2fa" && twoFactorCode.length === 6) {
        handle2FAVerification();
      }
    }
  };

  // Updated redirect function with role-based logic
  const redirectAfterLogin = (user) => {
    // Check user role first
    if (user.role === 2) {
      // Admin user - redirect to admin page
      showNotification("success", "Welcome back, Admin!");
      window.location.href = "/admin";
      return;
    }

    // Regular user (role 1) - check if profile is complete
    const isProfileComplete = user.name && user.isOnboardingComplete;

    if (isProfileComplete) {
      // Profile is complete - go to dashboard
      showNotification("success", "Login successful! Welcome back!");
      window.location.href = "/dashboard";
    } else {
      // Profile is incomplete - go to onboarding
      showNotification("warning", "Please complete your profile setup!");
      window.location.href = "/onboarding";
    }
  };

  const handleLogin = async () => {
    if (!password) {
      setError("Please enter your password");
      showNotification("error", "Please enter your password!");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      showNotification("error", "Please enter a valid email address!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password: password,
      });

      // Check if 2FA is required
      if (response.data.requires2FA) {
        setStep("2fa");
        setError("");
        showNotification("warning", "Two-factor authentication required!");
        return;
      }

      // Login successful - store token and redirect
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      redirectAfterLogin(user);
    } catch (err) {
      console.error("Login error:", err);

      // Handle different types of errors
      if (err.response?.status === 400) {
        const errorData = err.response?.data;
        const errorMessage = errorData?.message;

        // Check if this is an email verification issue
        if (
          errorData?.needsVerification ||
          errorMessage?.includes("Email not verified")
        ) {
          setStep("verify");
          setResendCooldown(60);
          setError("");
          showNotification("warning", "Please verify your email to continue!");
          return;
        } else if (errorMessage === "Invalid email or password") {
          setError("Invalid email or password. Please try again.");
          showNotification("error", "Invalid email or password!");
        } else {
          setError(errorMessage || "Login failed. Please try again.");
          showNotification("error", errorMessage || "Login failed!");
        }
      } else if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
        showNotification("error", "Invalid credentials! Please try again.");
      } else if (err.response?.status === 404) {
        setError("No account found with this email address.");
        showNotification("error", "No account found with this email!");
      } else if (err.response?.status === 403) {
        setError("Your account has been suspended. Please contact support.");
        showNotification("error", "Account suspended! Contact support.");
      } else if (err.response?.status >= 500) {
        setError("Server error. Please try again later.");
        showNotification(
          "error",
          "Server error occurred! Please try again later."
        );
      } else {
        setError(
          "Login failed. Please check your internet connection and try again."
        );
        showNotification(
          "error",
          "Login failed! Check your internet connection."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerification = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setError("Please enter the 6-digit authentication code");
      showNotification("error", "Please enter a valid 6-digit code!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password: password,
        twoFactorCode: twoFactorCode,
      });

      console.log("2FA verification successful:", response.data);

      // Store the JWT token
      const { token, user, usedBackupCode } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Show backup code usage notification if applicable
      if (usedBackupCode) {
        console.log(`Backup code ${usedBackupCode} was used`);
        showNotification(
          "warning",
          "Backup code used! Consider regenerating backup codes."
        );
      }

      showNotification("success", "2FA verification successful!");

      // Redirect based on user profile status
      redirectAfterLogin(user);
    } catch (err) {
      console.error("2FA verification error:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
        showNotification("error", err.response.data.message);
      } else {
        setError("Invalid authentication code. Please try again.");
        showNotification("error", "Invalid authentication code!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter the 6-digit verification code");
      showNotification(
        "error",
        "Please enter a valid 6-digit verification code!"
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/verify-email", {
        email: email.trim(),
        code: verificationCode,
      });

      console.log("Verification successful:", response.data);
      showNotification("success", "Email verified successfully!");

      // After successful verification, automatically log the user in
      try {
        const loginResponse = await api.post("/auth/login", {
          email: email.trim(),
          password: password,
        });

        // Check if 2FA is required after verification
        if (loginResponse.data.requires2FA) {
          setStep("2fa");
          setError("");
          showNotification("warning", "Two-factor authentication required!");
          return;
        }

        // Store the JWT token
        const { token, user } = loginResponse.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        // Redirect based on user profile status
        redirectAfterLogin(user);
      } catch (loginErr) {
        console.error("Auto-login after verification failed:", loginErr);
        setError("Email verified! Please try logging in again.");
        showNotification("warning", "Email verified! Please login again.");
        setStep("password");
      }
    } catch (err) {
      console.error("Verification error:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
        showNotification("error", err.response.data.message);
      } else {
        setError("Verification failed. Please try again.");
        showNotification("error", "Email verification failed!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setError("");

    try {
      await api.post("/auth/resend-verification", {
        email: email.trim(),
      });

      setResendCooldown(60);
      setError("");
      showNotification("success", "Verification code sent successfully!");
    } catch (err) {
      console.error("Resend error:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
        showNotification("error", err.response.data.message);
      } else {
        setError("Failed to resend verification code. Please try again.");
        showNotification("error", "Failed to resend verification code!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setShowPassword(false);
    setPassword("");
    setError("");
  };

  const handleBackToPassword = () => {
    if (step === "2fa") {
      setStep("password");
      setTwoFactorCode("");
    } else {
      setStep("password");
      setVerificationCode("");
    }
    setError("");
  };

  const handleGitHubLogin = () => {
    window.location.href = `http://localhost:5000/api/github/login`;
  };

  const handleForgotPassword = () => {
    if (email && isValidEmail(email)) {
      window.location.href = `/forgot-password?email=${encodeURIComponent(
        email
      )}`;
    } else {
      window.location.href = "/forgot-password";
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "email":
        return "Sign in to Smellify";
      case "password":
        return "Sign in to Smellify";
      case "verify":
        return "Verify your email";
      case "2fa":
        return "Two-Factor Authentication";
      default:
        return "Sign in to Smellify";
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "email":
        return "Welcome back! Please sign in to continue";
      case "password":
        return "Welcome back! Please sign in to continue";
      case "verify":
        return `We've sent a verification code to ${email}`;
      case "2fa":
        return "Enter the 6-digit code from your authenticator app or use a backup code";
      default:
        return "Welcome back! Please sign in to continue";
    }
  };

  // return (
  //   <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
  //     <div className="max-w-md w-full">
  //       {/* Main Card */}
  //       <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
  //         {/* Header */}
  //         <div className="text-center mb-8">
  //           <h1 className="text-3xl font-bold text-gray-900 mb-2">
  //             {getStepTitle()}
  //           </h1>
  //           <p className="text-gray-500">{getStepDescription()}</p>
  //         </div>

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

  //         {/* Two-Factor Authentication Step */}
  //         {step === '2fa' && (
  //           <div className="space-y-6">
  //             {/* 2FA Icon */}
  //             <div className="flex justify-center">
  //               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
  //                 <svg
  //                   className="w-8 h-8 text-green-600"
  //                   fill="none"
  //                   stroke="currentColor"
  //                   viewBox="0 0 24 24"
  //                 >
  //                   <path
  //                     strokeLinecap="round"
  //                     strokeLinejoin="round"
  //                     strokeWidth={2}
  //                     d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
  //                   />
  //                 </svg>
  //               </div>
  //             </div>

  //             {/* 2FA Input */}
  //             <div>
  //               <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                 Authentication Code
  //               </label>
  //               <input
  //                 type="text"
  //                 value={twoFactorCode}
  //                 onChange={(e) => {
  //                   const value = e.target.value.replace(/[^A-Z0-9]/g, "").slice(0, 6);
  //                   setTwoFactorCode(value);
  //                 }}
  //                 onKeyPress={handleKeyPress}
  //                 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
  //                 placeholder="123456"
  //                 maxLength="6"
  //                 autoFocus
  //               />
  //               <p className="text-xs text-gray-500 mt-2 text-center">
  //                 Enter the 6-digit code from your authenticator app or backup code
  //               </p>
  //             </div>

  //             {/* Back to Password Button */}
  //             <div className="text-center">
  //               <button
  //                 onClick={handleBackToPassword}
  //                 className="text-blue-600 hover:text-blue-700 font-medium text-sm"
  //               >
  //                 ← Back to password
  //               </button>
  //             </div>

  //             {/* Verify 2FA Button */}
  //             <button
  //               onClick={handle2FAVerification}
  //               disabled={isLoading || twoFactorCode.length !== 6}
  //               className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //             >
  //               {isLoading ? (
  //                 <>
  //                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
  //                   Verifying...
  //                 </>
  //               ) : (
  //                 <>
  //                   Verify & Sign in
  //                   <svg
  //                     className="w-4 h-4 ml-2"
  //                     fill="none"
  //                     stroke="currentColor"
  //                     viewBox="0 0 24 24"
  //                   >
  //                     <path
  //                       strokeLinecap="round"
  //                       strokeLinejoin="round"
  //                       strokeWidth={2}
  //                       d="M9 5l7 7-7 7"
  //                     />
  //                   </svg>
  //                 </>
  //               )}
  //             </button>
  //           </div>
  //         )}

  //         {/* Email Verification Step */}
  //         {step === 'verify' && (
  //           <div className="space-y-6">
  //             {/* Email Icon */}
  //             <div className="flex justify-center">
  //               <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
  //                 <svg
  //                   className="w-8 h-8 text-blue-600"
  //                   fill="none"
  //                   stroke="currentColor"
  //                   viewBox="0 0 24 24"
  //                 >
  //                   <path
  //                     strokeLinecap="round"
  //                     strokeLinejoin="round"
  //                     strokeWidth={2}
  //                     d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
  //                   />
  //                 </svg>
  //               </div>
  //             </div>

  //             {/* Verification Input */}
  //             <div>
  //               <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                 Verification Code
  //               </label>
  //               <input
  //                 type="text"
  //                 value={verificationCode}
  //                 onChange={(e) => {
  //                   const value = e.target.value.replace(/\D/g, "").slice(0, 6);
  //                   setVerificationCode(value);
  //                 }}
  //                 onKeyPress={handleKeyPress}
  //                 className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
  //                 placeholder="123456"
  //                 maxLength="6"
  //                 autoFocus
  //               />
  //               <p className="text-xs text-gray-500 mt-2 text-center">
  //                 Enter the 6-digit code we sent to your email
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
  //                 className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
  //               >
  //                 {resendCooldown > 0
  //                   ? `Resend code in ${resendCooldown}s`
  //                   : "Resend verification code"}
  //               </button>
  //             </div>

  //             {/* Verify Button */}
  //             <button
  //               onClick={handleVerifyEmail}
  //               disabled={isLoading || verificationCode.length !== 6}
  //               className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //             >
  //               {isLoading ? (
  //                 <>
  //                   <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
  //                   Verifying...
  //                 </>
  //               ) : (
  //                 <>
  //                   Verify & Sign in
  //                   <svg
  //                     className="w-4 h-4 ml-2"
  //                     fill="none"
  //                     stroke="currentColor"
  //                     viewBox="0 0 24 24"
  //                   >
  //                     <path
  //                       strokeLinecap="round"
  //                       strokeLinejoin="round"
  //                       strokeWidth={2}
  //                       d="M9 5l7 7-7 7"
  //                     />
  //                   </svg>
  //                 </>
  //               )}
  //             </button>
  //           </div>
  //         )}

  //         {/* Email/Password Steps */}
  //         {(step === 'email' || step === 'password') && (
  //           <>
  //             {/* OAuth Button */}
  //             <button
  //               onClick={handleGitHubLogin}
  //               className="w-full mb-6 bg-white border-2 border-gray-200 rounded-xl py-3 px-4 flex items-center justify-center hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
  //             >
  //               <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
  //                 <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  //               </svg>
  //               <span className="font-semibold text-gray-700">Continue with GitHub</span>
  //             </button>

  //             {/* Divider */}
  //             <div className="relative mb-6">
  //               <div className="absolute inset-0 flex items-center">
  //                 <div className="w-full border-t border-gray-200"></div>
  //               </div>
  //               <div className="relative flex justify-center text-sm">
  //                 <span className="px-4 bg-white text-gray-500">or</span>
  //               </div>
  //             </div>

  //             {/* Progressive Form */}
  //             <div className="space-y-4">
  //               {/* Email Field */}
  //               <div className={`transition-all duration-300 ${step === 'password' ? 'opacity-60' : ''}`}>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Email address
  //                 </label>
  //                 <div className="relative">
  //                   <input
  //                     type="email"
  //                     value={email}
  //                     onChange={(e) => setEmail(e.target.value)}
  //                     onKeyPress={handleKeyPress}
  //                     disabled={step === 'password'}
  //                     className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50"
  //                     placeholder="Enter your email address"
  //                   />
  //                   {step === 'password' && (
  //                     <button
  //                       onClick={handleBackToEmail}
  //                       className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700 font-medium text-sm"
  //                     >
  //                       Edit
  //                     </button>
  //                   )}
  //                 </div>
  //               </div>

  //               {/* Password Field - Animated */}
  //               <div className={`transition-all duration-500 transform ${
  //                 showPassword ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 h-0 overflow-hidden'
  //               }`}>
  //                 {showPassword && (
  //                   <div>
  //                     <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                       Password
  //                     </label>
  //                     <div className="relative">
  //                       <input
  //                         type={showPasswordText ? "text" : "password"}
  //                         value={password}
  //                         onChange={(e) => setPassword(e.target.value)}
  //                         onKeyPress={handleKeyPress}
  //                         className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
  //                         placeholder="Enter your password"
  //                         autoFocus
  //                         autoComplete="current-password"
  //                       />
  //                       <button
  //                         type="button"
  //                         onClick={() => setShowPasswordText(!showPasswordText)}
  //                         className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 flex items-center justify-center w-5 h-5"
  //                       >
  //                         {showPasswordText ? (
  //                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
  //                           </svg>
  //                         ) : (
  //                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.639 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.639 0-8.573-3.007-9.963-7.178z" />
  //                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  //                           </svg>
  //                         )}
  //                       </button>
  //                     </div>

  //                     {/* Forgot Password Link */}
  //                     <div className="mt-2 text-right">
  //                       <button
  //                         onClick={handleForgotPassword}
  //                         className="text-sm text-blue-600 hover:text-blue-700 font-medium"
  //                       >
  //                         Forgot password?
  //                       </button>
  //                     </div>
  //                   </div>
  //                 )}
  //               </div>

  //               {/* Continue/Login Button */}
  //               <button
  //                 onClick={step === 'email' ? handleEmailContinue : handleLogin}
  //                 disabled={
  //                   isLoading ||
  //                   (step === 'email' && !isValidEmail(email)) ||
  //                   (step === 'password' && !password)
  //                 }
  //                 className="w-full bg-gray-800 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //               >
  //                 {isLoading ? (
  //                   <>
  //                     <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
  //                     Signing in...
  //                   </>
  //                 ) : (
  //                   <>
  //                     {step === 'email' ? 'Continue' : 'Sign in'}
  //                     <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  //                     </svg>
  //                   </>
  //                 )}
  //               </button>
  //             </div>

  //             {/* Footer */}
  //             <div className="mt-8 text-center">
  //               <p className="text-gray-500">
  //                 Don't have an account?{' '}
  //                 <a
  //                   href="/signup"
  //                   className="text-gray-900 font-semibold hover:underline transition-colors duration-200"
  //                 >
  //                   Sign up
  //                 </a>
  //               </p>
  //             </div>
  //           </>
  //         )}
  //       </div>

  //       {/* Bottom Links */}
  //       {step !== 'verify' && step !== '2fa' && (
  //         <div className="mt-6 text-center space-x-4 text-sm">
  //           <a href="#" className="text-gray-500 hover:text-gray-700">Privacy Policy</a>
  //           <span className="text-gray-300">•</span>
  //           <a href="#" className="text-gray-500 hover:text-gray-700">Terms of Service</a>
  //         </div>
  //       )}
  //     </div>

  //     {/* CSS to hide browser password toggle */}
  //     <style jsx>{`
  //       input[type="password"]::-ms-reveal,
  //       input[type="password"]::-ms-clear {
  //         display: none;
  //       }
  //       input[type="password"]::-webkit-credentials-auto-fill-button,
  //       input[type="password"]::-webkit-strong-password-auto-fill-button {
  //         display: none !important;
  //       }
  //     `}</style>
  //   </div>
  // );

  // return (
  //   <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  //     <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
  //       {/* Left Side - Branding */}
  //       <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left order-2 lg:order-1">
  //         <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#5A33FF' }}>
  //           <img
  //             src="/bug.png"
  //             alt="BugTracker Logo"
  //             className="w-20 h-20 lg:w-24 lg:h-24 object-contain"
  //             onError={(e) => {
  //               e.target.style.display = 'none';
  //               e.target.parentElement.innerHTML = '<svg class="w-20 h-20 lg:w-24 lg:h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>';
  //             }}
  //           />
  //         </div>
  //         <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
  //           Smellify
  //         </h1>
  //         <p className="text-lg lg:text-xl text-gray-600">
  //           {step === '2fa' ? 'Two-Factor Authentication' :
  //            step === 'verify' ? 'Verify Your Email' :
  //            'Sign in to your account'}
  //         </p>
  //       </div>

  //       {/* Right Side - Login Form */}
  //       <div className="w-full lg:w-1/2 max-w-md order-1 lg:order-2">
  //         <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
  //           {/* Error Message */}
  //           {error && (
  //             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
  //               <p className="text-sm text-red-800">{error}</p>
  //             </div>
  //           )}

  //           {/* Two-Factor Authentication Step */}
  //           {step === '2fa' && (
  //             <div className="space-y-6">
  //               <div className="flex justify-center">
  //                 <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(90, 51, 255, 0.1)' }}>
  //                   <svg className="w-8 h-8" style={{ color: '#5A33FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  //                   </svg>
  //                 </div>
  //               </div>

  //               <div>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Authentication Code
  //                 </label>
  //                 <input
  //                   type="text"
  //                   value={twoFactorCode}
  //                   onChange={(e) => {
  //                     const value = e.target.value.replace(/[^A-Z0-9]/g, "").slice(0, 6);
  //                     setTwoFactorCode(value);
  //                   }}
  //                   onKeyPress={handleKeyPress}
  //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
  //                   placeholder="123456"
  //                   maxLength="6"
  //                   autoFocus
  //                 />
  //                 <p className="text-xs text-gray-500 mt-2 text-center">
  //                   Enter the 6-digit code from your authenticator app
  //                 </p>
  //               </div>

  //               <div className="text-center">
  //                 <button
  //                   onClick={handleBackToPassword}
  //                   className="text-sm font-medium hover:underline"
  //                   style={{ color: '#5A33FF' }}
  //                 >
  //                   ← Back to password
  //                 </button>
  //               </div>

  //               <button
  //                 onClick={handle2FAVerification}
  //                 disabled={isLoading || twoFactorCode.length !== 6}
  //                 className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //                 style={{ backgroundColor: '#5A33FF' }}
  //               >
  //                 {isLoading ? (
  //                   <>
  //                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
  //                     Verifying...
  //                   </>
  //                 ) : (
  //                   'Verify & Sign in'
  //                 )}
  //               </button>
  //             </div>
  //           )}

  //           {/* Email Verification Step */}
  //           {step === 'verify' && (
  //             <div className="space-y-6">
  //               <div className="flex justify-center">
  //                 <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(90, 51, 255, 0.1)' }}>
  //                   <svg className="w-8 h-8" style={{ color: '#5A33FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  //                   </svg>
  //                 </div>
  //               </div>

  //               <div>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Verification Code
  //                 </label>
  //                 <input
  //                   type="text"
  //                   value={verificationCode}
  //                   onChange={(e) => {
  //                     const value = e.target.value.replace(/\D/g, "").slice(0, 6);
  //                     setVerificationCode(value);
  //                   }}
  //                   onKeyPress={handleKeyPress}
  //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
  //                   placeholder="123456"
  //                   maxLength="6"
  //                   autoFocus
  //                 />
  //                 <p className="text-xs text-gray-500 mt-2 text-center">
  //                   Enter the 6-digit code we sent to your email
  //                 </p>
  //               </div>

  //               <div className="text-center">
  //                 <p className="text-sm text-gray-600 mb-2">
  //                   Didn't receive the code?
  //                 </p>
  //                 <button
  //                   onClick={handleResendCode}
  //                   disabled={resendCooldown > 0 || isLoading}
  //                   className="text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
  //                   style={{ color: '#5A33FF' }}
  //                 >
  //                   {resendCooldown > 0
  //                     ? `Resend code in ${resendCooldown}s`
  //                     : "Resend verification code"}
  //                 </button>
  //               </div>

  //               <button
  //                 onClick={handleVerifyEmail}
  //                 disabled={isLoading || verificationCode.length !== 6}
  //                 className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //                 style={{ backgroundColor: '#5A33FF' }}
  //               >
  //                 {isLoading ? (
  //                   <>
  //                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
  //                     Verifying...
  //                   </>
  //                 ) : (
  //                   'Verify & Sign in'
  //                 )}
  //               </button>
  //             </div>
  //           )}

  //           {/* Normal Login Form */}
  //           {step !== '2fa' && step !== 'verify' && (
  //             <div className="space-y-5">
  //               {/* Email Field */}
  //               <div>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Email Address
  //                 </label>
  //                 <input
  //                   type="email"
  //                   value={email}
  //                   onChange={(e) => setEmail(e.target.value)}
  //                   onKeyPress={handleKeyPress}
  //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
  //                   placeholder="Enter your email"
  //                 />
  //               </div>

  //               {/* Password Field */}
  //               <div>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Password
  //                 </label>
  //                 <div className="relative">
  //                   <input
  //                     type={showPasswordText ? "text" : "password"}
  //                     value={password}
  //                     onChange={(e) => setPassword(e.target.value)}
  //                     onKeyPress={handleKeyPress}
  //                     className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
  //                     placeholder="Enter your password"
  //                     autoComplete="current-password"
  //                   />
  //                   <button
  //                     type="button"
  //                     onClick={() => setShowPasswordText(!showPasswordText)}
  //                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
  //                   >
  //                     {showPasswordText ? (
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

  //               {/* Sign In Button */}
  //               <button
  //                 onClick={handleLogin}
  //                 disabled={isLoading || !email || !password}
  //                 className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //                 style={{ backgroundColor: '#5A33FF' }}
  //               >
  //                 {isLoading ? (
  //                   <>
  //                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
  //                     Signing in...
  //                   </>
  //                 ) : (
  //                   'Sign In'
  //                 )}
  //               </button>

  //               {/* Forgot Password */}
  //               <div className="text-center">
  //                 <button
  //                   onClick={handleForgotPassword}
  //                   className="text-sm font-medium hover:underline transition-colors duration-200"
  //                   style={{ color: '#5A33FF' }}
  //                 >
  //                   Forgot password?
  //                 </button>
  //               </div>

  //               {/* Divider */}
  //               <div className="relative my-6">
  //                 <div className="absolute inset-0 flex items-center">
  //                   <div className="w-full border-t border-gray-200"></div>
  //                 </div>
  //                 <div className="relative flex justify-center text-sm">
  //                   <span className="px-4 bg-white text-gray-500">or continue with</span>
  //                 </div>
  //               </div>

  //               {/* GitHub Button */}
  //               <button
  //                 onClick={handleGitHubLogin}
  //                 className="w-full bg-white border-2 border-gray-200 rounded-lg py-3 px-4 flex items-center justify-center hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
  //               >
  //                 <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
  //                   <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  //                 </svg>
  //                 <span className="font-semibold text-gray-700">Continue with GitHub</span>
  //               </button>

  //               {/* Sign Up Link */}
  //               <div className="text-center pt-4">
  //                 <p className="text-gray-600 text-sm">
  //                   New to Smellify?{' '}
  //                   <a
  //                     href="/signup"
  //                     className="font-semibold hover:underline transition-colors duration-200"
  //                     style={{ color: '#5A33FF' }}
  //                   >
  //                     Create an account
  //                   </a>
  //                 </p>
  //               </div>
  //             </div>
  //           )}
  //         </div>
  //       </div>
  //     </div>

  //     {/* Hide browser password toggle */}
  //     <style jsx>{`
  //       input[type="password"]::-ms-reveal,
  //       input[type="password"]::-ms-clear {
  //         display: none;
  //       }
  //       input[type="password"]::-webkit-credentials-auto-fill-button,
  //       input[type="password"]::-webkit-strong-password-auto-fill-button {
  //         display: none !important;
  //       }
  //     `}</style>
  //   </div>
  // );

  // return (
  //   <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
  //     <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
  //       {/* Left Side - Login Form */}
  //       <div className="w-full lg:w-1/2 max-w-md order-2 lg:order-1">
  //         <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
  //           {/* Error Message */}
  //           {error && (
  //             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
  //               <p className="text-sm text-red-800">{error}</p>
  //             </div>
  //           )}

  //           {/* Two-Factor Authentication Step */}
  //           {step === '2fa' && (
  //             <div className="space-y-6">
  //               <div className="flex justify-center">
  //                 <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(90, 51, 255, 0.1)' }}>
  //                   <svg className="w-8 h-8" style={{ color: '#5A33FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  //                   </svg>
  //                 </div>
  //               </div>

  //               <div>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Authentication Code
  //                 </label>
  //                 <input
  //                   type="text"
  //                   value={twoFactorCode}
  //                   onChange={(e) => {
  //                     const value = e.target.value.replace(/[^A-Z0-9]/g, "").slice(0, 6);
  //                     setTwoFactorCode(value);
  //                   }}
  //                   onKeyPress={handleKeyPress}
  //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
  //                   placeholder="123456"
  //                   maxLength="6"
  //                   autoFocus
  //                 />
  //                 <p className="text-xs text-gray-500 mt-2 text-center">
  //                   Enter the 6-digit code from your authenticator app
  //                 </p>
  //               </div>

  //               <div className="text-center">
  //                 <button
  //                   onClick={handleBackToPassword}
  //                   className="text-sm font-medium hover:underline"
  //                   style={{ color: '#5A33FF' }}
  //                 >
  //                   ← Back to password
  //                 </button>
  //               </div>

  //               <button
  //                 onClick={handle2FAVerification}
  //                 disabled={isLoading || twoFactorCode.length !== 6}
  //                 className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //                 style={{ backgroundColor: '#5A33FF' }}
  //               >
  //                 {isLoading ? (
  //                   <>
  //                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
  //                     Verifying...
  //                   </>
  //                 ) : (
  //                   'Verify & Sign in'
  //                 )}
  //               </button>
  //             </div>
  //           )}

  //           {/* Email Verification Step */}
  //           {step === 'verify' && (
  //             <div className="space-y-6">
  //               <div className="flex justify-center">
  //                 <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(90, 51, 255, 0.1)' }}>
  //                   <svg className="w-8 h-8" style={{ color: '#5A33FF' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  //                   </svg>
  //                 </div>
  //               </div>

  //               <div>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Verification Code
  //                 </label>
  //                 <input
  //                   type="text"
  //                   value={verificationCode}
  //                   onChange={(e) => {
  //                     const value = e.target.value.replace(/\D/g, "").slice(0, 6);
  //                     setVerificationCode(value);
  //                   }}
  //                   onKeyPress={handleKeyPress}
  //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
  //                   placeholder="123456"
  //                   maxLength="6"
  //                   autoFocus
  //                 />
  //                 <p className="text-xs text-gray-500 mt-2 text-center">
  //                   Enter the 6-digit code we sent to your email
  //                 </p>
  //               </div>

  //               <div className="text-center">
  //                 <p className="text-sm text-gray-600 mb-2">
  //                   Didn't receive the code?
  //                 </p>
  //                 <button
  //                   onClick={handleResendCode}
  //                   disabled={resendCooldown > 0 || isLoading}
  //                   className="text-sm font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
  //                   style={{ color: '#5A33FF' }}
  //                 >
  //                   {resendCooldown > 0
  //                     ? `Resend code in ${resendCooldown}s`
  //                     : "Resend verification code"}
  //                 </button>
  //               </div>

  //               <button
  //                 onClick={handleVerifyEmail}
  //                 disabled={isLoading || verificationCode.length !== 6}
  //                 className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //                 style={{ backgroundColor: '#5A33FF' }}
  //               >
  //                 {isLoading ? (
  //                   <>
  //                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
  //                     Verifying...
  //                   </>
  //                 ) : (
  //                   'Verify & Sign in'
  //                 )}
  //               </button>
  //             </div>
  //           )}

  //           {/* Normal Login Form */}
  //           {step !== '2fa' && step !== 'verify' && (
  //             <div className="space-y-5">
  //               {/* Email Field */}
  //               <div>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Email Address
  //                 </label>
  //                 <input
  //                   type="email"
  //                   value={email}
  //                   onChange={(e) => setEmail(e.target.value)}
  //                   onKeyPress={handleKeyPress}
  //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
  //                   placeholder="Enter your email"
  //                 />
  //               </div>

  //               {/* Password Field */}
  //               <div>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Password
  //                 </label>
  //                 <div className="relative">
  //                   <input
  //                     type={showPasswordText ? "text" : "password"}
  //                     value={password}
  //                     onChange={(e) => setPassword(e.target.value)}
  //                     onKeyPress={handleKeyPress}
  //                     className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
  //                     placeholder="Enter your password"
  //                     autoComplete="current-password"
  //                   />
  //                   <button
  //                     type="button"
  //                     onClick={() => setShowPasswordText(!showPasswordText)}
  //                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
  //                   >
  //                     {showPasswordText ? (
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

  //               {/* Sign In Button */}
  //               <button
  //                 onClick={handleLogin}
  //                 disabled={isLoading || !email || !password}
  //                 className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //                 style={{ backgroundColor: '#5A33FF' }}
  //               >
  //                 {isLoading ? (
  //                   <>
  //                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
  //                     Signing in...
  //                   </>
  //                 ) : (
  //                   'Sign In'
  //                 )}
  //               </button>

  //               {/* Forgot Password */}
  //               <div className="text-center">
  //                 <button
  //                   onClick={handleForgotPassword}
  //                   className="text-sm font-medium hover:underline transition-colors duration-200"
  //                   style={{ color: '#5A33FF' }}
  //                 >
  //                   Forgot password?
  //                 </button>
  //               </div>

  //               {/* Divider */}
  //               <div className="relative my-6">
  //                 <div className="absolute inset-0 flex items-center">
  //                   <div className="w-full border-t border-gray-200"></div>
  //                 </div>
  //                 <div className="relative flex justify-center text-sm">
  //                   <span className="px-4 bg-white text-gray-500">or continue with</span>
  //                 </div>
  //               </div>

  //               {/* GitHub Button */}
  //               <button
  //                 onClick={handleGitHubLogin}
  //                 className="w-full bg-white border-2 border-gray-200 rounded-lg py-3 px-4 flex items-center justify-center hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
  //               >
  //                 <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
  //                   <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  //                 </svg>
  //                 <span className="font-semibold text-gray-700">Continue with GitHub</span>
  //               </button>

  //               {/* Sign Up Link */}
  //               <div className="text-center pt-4">
  //                 <p className="text-gray-600 text-sm">
  //                   New to Smellify?{' '}
  //                   <a
  //                     href="/signup"
  //                     className="font-semibold hover:underline transition-colors duration-200"
  //                     style={{ color: '#5A33FF' }}
  //                   >
  //                     Create an account
  //                   </a>
  //                 </p>
  //               </div>
  //             </div>
  //           )}
  //         </div>
  //       </div>

  //       {/* Right Side - Branding */}
  //       <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left order-1 lg:order-2">
  //         <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#5A33FF' }}>
  //           <img
  //             src="/bug.png"
  //             alt="BugTracker Logo"
  //             className="w-20 h-20 lg:w-24 lg:h-24 object-contain"
  //             onError={(e) => {
  //               e.target.style.display = 'none';
  //               e.target.parentElement.innerHTML = '<svg class="w-20 h-20 lg:w-24 lg:h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/></svg>';
  //             }}
  //           />
  //         </div>
  //         <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
  //           Smellify
  //         </h1>
  //         <p className="text-lg lg:text-xl text-gray-600">
  //           {step === '2fa' ? 'Two-Factor Authentication' :
  //            step === 'verify' ? 'Verify Your Email' :
  //            'Sign in to your account'}
  //         </p>
  //       </div>
  //     </div>

  //     {/* Hide browser password toggle */}
  //     <style jsx>{`
  //       input[type="password"]::-ms-reveal,
  //       input[type="password"]::-ms-clear {
  //         display: none;
  //       }
  //       input[type="password"]::-webkit-credentials-auto-fill-button,
  //       input[type="password"]::-webkit-strong-password-auto-fill-button {
  //         display: none !important;
  //       }
  //     `}</style>
  //   </div>
  // );

  // return (
  //   <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 pt-20">
  //     <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
  //       {/* Left Side - Login Form */}
  //       <div className="w-full lg:w-1/2 max-w-md order-2 lg:order-1">
  //         <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
  //           {/* Error Message */}
  //           {error && (
  //             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
  //               <p className="text-sm text-red-800">{error}</p>
  //             </div>
  //           )}

  //           {/* Two-Factor Authentication Step */}
  //           {step === "2fa" && (
  //             <div className="space-y-6">
  //               <div className="flex justify-center">
  //                 <div
  //                   className="w-16 h-16 rounded-full flex items-center justify-center"
  //                   style={{ backgroundColor: "rgba(90, 51, 255, 0.1)" }}
  //                 >
  //                   <svg
  //                     className="w-8 h-8"
  //                     style={{ color: "#5A33FF" }}
  //                     fill="none"
  //                     stroke="currentColor"
  //                     viewBox="0 0 24 24"
  //                   >
  //                     <path
  //                       strokeLinecap="round"
  //                       strokeLinejoin="round"
  //                       strokeWidth={2}
  //                       d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
  //                     />
  //                   </svg>
  //                 </div>
  //               </div>

  //               <div>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Authentication Code
  //                 </label>
  //                 <input
  //                   type="text"
  //                   value={twoFactorCode}
  //                   onChange={(e) => {
  //                     const value = e.target.value
  //                       .replace(/[^A-Z0-9]/g, "")
  //                       .slice(0, 6);
  //                     setTwoFactorCode(value);
  //                   }}
  //                   onKeyPress={handleKeyPress}
  //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
  //                   placeholder="123456"
  //                   maxLength="6"
  //                   autoFocus
  //                 />
  //                 <p className="text-xs text-gray-500 mt-2 text-center">
  //                   Enter the 6-digit code from your authenticator app
  //                 </p>
  //               </div>

  //               <div className="text-center">
  //                 <button
  //                   onClick={handleBackToPassword}
  //                   className="text-sm font-medium hover:underline"
  //                   style={{ color: "#5A33FF" }}
  //                 >
  //                   ← Back to password
  //                 </button>
  //               </div>

  //               <button
  //                 onClick={handle2FAVerification}
  //                 disabled={isLoading || twoFactorCode.length !== 6}
  //                 className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //                 style={{ backgroundColor: "#5A33FF" }}
  //               >
  //                 {isLoading ? (
  //                   <>
  //                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
  //                     Verifying...
  //                   </>
  //                 ) : (
  //                   "Verify & Sign in"
  //                 )}
  //               </button>
  //             </div>
  //           )}

  //           {/* Email Verification Step */}
  //           {step === "verify" && (
  //             <div className="space-y-6">
  //               <div className="flex justify-center">
  //                 <div
  //                   className="w-16 h-16 rounded-full flex items-center justify-center"
  //                   style={{ backgroundColor: "rgba(90, 51, 255, 0.1)" }}
  //                 >
  //                   <svg
  //                     className="w-8 h-8"
  //                     style={{ color: "#5A33FF" }}
  //                     fill="none"
  //                     stroke="currentColor"
  //                     viewBox="0 0 24 24"
  //                   >
  //                     <path
  //                       strokeLinecap="round"
  //                       strokeLinejoin="round"
  //                       strokeWidth={2}
  //                       d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
  //                     />
  //                   </svg>
  //                 </div>
  //               </div>

  //               <div>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Verification Code
  //                 </label>
  //                 <input
  //                   type="text"
  //                   value={verificationCode}
  //                   onChange={(e) => {
  //                     const value = e.target.value
  //                       .replace(/\D/g, "")
  //                       .slice(0, 6);
  //                     setVerificationCode(value);
  //                   }}
  //                   onKeyPress={handleKeyPress}
  //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest font-mono"
  //                   placeholder="123456"
  //                   maxLength="6"
  //                   autoFocus
  //                 />
  //                 <p className="text-xs text-gray-500 mt-2 text-center">
  //                   Enter the 6-digit code we sent to your email
  //                 </p>
  //               </div>

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
  //                     : "Resend verification code"}
  //                 </button>
  //               </div>

  //               <button
  //                 onClick={handleVerifyEmail}
  //                 disabled={isLoading || verificationCode.length !== 6}
  //                 className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //                 style={{ backgroundColor: "#5A33FF" }}
  //               >
  //                 {isLoading ? (
  //                   <>
  //                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
  //                     Verifying...
  //                   </>
  //                 ) : (
  //                   "Verify & Sign in"
  //                 )}
  //               </button>
  //             </div>
  //           )}

  //           {/* Normal Login Form */}
  //           {step !== "2fa" && step !== "verify" && (
  //             <div className="space-y-5">
  //               {/* Email Field */}
  //               <div>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Email Address
  //                 </label>
  //                 <input
  //                   type="email"
  //                   value={email}
  //                   onChange={(e) => setEmail(e.target.value)}
  //                   onKeyPress={handleKeyPress}
  //                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
  //                   placeholder="Enter your email"
  //                 />
  //               </div>

  //               {/* Password Field */}
  //               <div>
  //                 <label className="block text-sm font-semibold text-gray-900 mb-2">
  //                   Password
  //                 </label>
  //                 <div className="relative">
  //                   <input
  //                     type={showPasswordText ? "text" : "password"}
  //                     value={password}
  //                     onChange={(e) => setPassword(e.target.value)}
  //                     onKeyPress={handleKeyPress}
  //                     className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
  //                     placeholder="Enter your password"
  //                     autoComplete="current-password"
  //                   />
  //                   <button
  //                     type="button"
  //                     onClick={() => setShowPasswordText(!showPasswordText)}
  //                     className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
  //                   >
  //                     {showPasswordText ? (
  //                       <svg
  //                         className="w-5 h-5"
  //                         fill="none"
  //                         stroke="currentColor"
  //                         viewBox="0 0 24 24"
  //                       >
  //                         <path
  //                           strokeLinecap="round"
  //                           strokeLinejoin="round"
  //                           strokeWidth={2}
  //                           d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
  //                         />
  //                       </svg>
  //                     ) : (
  //                       <svg
  //                         className="w-5 h-5"
  //                         fill="none"
  //                         stroke="currentColor"
  //                         viewBox="0 0 24 24"
  //                       >
  //                         <path
  //                           strokeLinecap="round"
  //                           strokeLinejoin="round"
  //                           strokeWidth={2}
  //                           d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  //                         />
  //                         <path
  //                           strokeLinecap="round"
  //                           strokeLinejoin="round"
  //                           strokeWidth={2}
  //                           d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
  //                         />
  //                       </svg>
  //                     )}
  //                   </button>
  //                 </div>
  //               </div>

  //               {/* Sign In Button */}
  //               <button
  //                 onClick={handleLogin}
  //                 disabled={isLoading || !email || !password}
  //                 className="w-full text-white font-semibold py-3 px-4 rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
  //                 style={{ backgroundColor: "#5A33FF" }}
  //               >
  //                 {isLoading ? (
  //                   <>
  //                     <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
  //                     Signing in...
  //                   </>
  //                 ) : (
  //                   "Sign In"
  //                 )}
  //               </button>

  //               {/* Forgot Password */}
  //               <div className="text-center">
  //                 <button
  //                   onClick={handleForgotPassword}
  //                   className="text-sm font-medium hover:underline transition-colors duration-200"
  //                   style={{ color: "#5A33FF" }}
  //                 >
  //                   Forgot password?
  //                 </button>
  //               </div>

  //               {/* Divider */}
  //               <div className="relative my-6">
  //                 <div className="absolute inset-0 flex items-center">
  //                   <div className="w-full border-t border-gray-200"></div>
  //                 </div>
  //                 <div className="relative flex justify-center text-sm">
  //                   <span className="px-4 bg-white text-gray-500">
  //                     or continue with
  //                   </span>
  //                 </div>
  //               </div>

  //               {/* GitHub Button */}
  //               <button
  //                 onClick={handleGitHubLogin}
  //                 className="w-full bg-white border-2 border-gray-200 rounded-lg py-3 px-4 flex items-center justify-center hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
  //               >
  //                 <svg
  //                   className="w-5 h-5 mr-3"
  //                   fill="currentColor"
  //                   viewBox="0 0 24 24"
  //                 >
  //                   <path
  //                     fillRule="evenodd"
  //                     d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
  //                     clipRule="evenodd"
  //                   />
  //                 </svg>
  //                 <span className="font-semibold text-gray-700">
  //                   Continue with GitHub
  //                 </span>
  //               </button>

  //               {/* Sign Up Link */}
  //               <div className="text-center pt-4">
  //                 <p className="text-gray-600 text-sm">
  //                   New to Smellify?{" "}
  //                   <a
  //                     href="/register"
  //                     className="font-semibold hover:underline transition-colors duration-200"
  //                     style={{ color: "#5A33FF" }}
  //                   >
  //                     Create an account
  //                   </a>
  //                 </p>
  //               </div>
  //             </div>
  //           )}
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
  //           {step === "2fa"
  //             ? "Two-Factor Authentication"
  //             : step === "verify"
  //             ? "Verify Your Email"
  //             : "Sign in to your account"}
  //         </p>
  //       </div>
  //     </div>

  //     {/* Hide browser password toggle */}
  //     <style jsx>{`
  //       input[type="password"]::-ms-reveal,
  //       input[type="password"]::-ms-clear {
  //         display: none;
  //       }
  //       input[type="password"]::-webkit-credentials-auto-fill-button,
  //       input[type="password"]::-webkit-strong-password-auto-fill-button {
  //         display: none !important;
  //       }
  //     `}</style>
  //   </div>
  // );

// return (
//   <div className="min-h-screen bg-gray-50">
//     <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16">
//       <div className="flex flex-col items-center justify-center gap-10 lg:flex-row lg:items-stretch lg:gap-20">
//         {/* Left marketing panel (hidden on mobile) */}
//         <div className="hidden w-full max-w-xl lg:block">
//           <div className="flex h-full flex-col justify-center px-2 text-center lg:px-0 lg:text-left">
//             <div className="mx-auto mb-8 flex items-center gap-3 lg:mx-0">
//               <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm">
//                 <Sparkles className="h-6 w-6" />
//               </div>
//               <span className="text-xl font-bold text-sky-600">CodeSmell</span>
//             </div>

//             <h2 className="text-5xl font-extrabold tracking-tight text-gray-900">
//               Welcome back to
//               <br />
//               <span className="text-sky-600">cleaner code</span>
//             </h2>

//             <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600">
//               Continue your journey to write better, more maintainable code with AI-powered analysis.
//             </p>

//             <div className="mt-10 space-y-4">
//               {[
//                 "Instant code smell detection",
//                 "Personalized improvement suggestions",
//                 "Track your code quality over time",
//               ].map((t) => (
//                 <div key={t} className="flex items-center gap-3 text-gray-600">
//                   <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white">
//                     <ArrowRight className="h-4 w-4" />
//                   </span>
//                   <span className="text-sm font-medium">{t}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Right form card */}
//         <div className="w-full max-w-md">
//           <div className="rounded-[32px] border border-gray-100 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-9">
//             {/* Header */}
//             <div className="mb-7 text-center">
//               <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
//                 {step === "2fa" ? "Two-factor verification" : step === "verify" ? "Verify email" : "Sign in"}
//               </h1>
//               <p className="mt-2 text-sm text-gray-500">
//                 {step === "2fa"
//                   ? "Enter the 6-digit code from your authenticator app"
//                   : step === "verify"
//                     ? "Enter the 6-digit code we sent to your email"
//                     : "Enter your credentials to access your account"}
//               </p>
//             </div>

//             {/* Error */}
//             {error && (
//               <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
//                 <p className="text-sm text-red-800">{error}</p>
//               </div>
//             )}

//             {/* 2FA Step */}
//             {step === "2fa" && (
//               <div className="space-y-6">
//                 <div className="flex justify-center">
//                   <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-600">
//                     <Shield className="h-7 w-7" />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-gray-900">
//                     Authentication Code
//                   </label>
//                   <input
//                     type="text"
//                     value={twoFactorCode}
//                     onChange={(e) => {
//                       const value = e.target.value.replace(/[^A-Z0-9]/g, "").slice(0, 6);
//                       setTwoFactorCode(value);
//                     }}
//                     onKeyPress={handleKeyPress}
//                     className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-center text-xl tracking-[0.35em] text-gray-900 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
//                     placeholder="123456"
//                     maxLength="6"
//                     autoFocus
//                   />
//                   <p className="mt-2 text-xs text-gray-500 text-center">
//                     Enter the 6-digit code from your authenticator app
//                   </p>
//                 </div>

//                 <button
//                   onClick={handle2FAVerification}
//                   disabled={isLoading || twoFactorCode.length !== 6}
//                   className="h-12 w-full rounded-full bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {isLoading ? "Verifying..." : "Verify & Sign in"}
//                 </button>

//                 <div className="text-center">
//                   <button
//                     onClick={handleBackToPassword}
//                     className="text-sm font-semibold text-sky-600 hover:underline"
//                   >
//                     Back to password
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* Email Verification Step */}
//             {step === "verify" && (
//               <div className="space-y-6">
//                 <div className="flex justify-center">
//                   <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-600">
//                     <CircleCheck className="h-7 w-7" />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-gray-900">
//                     Verification Code
//                   </label>
//                   <input
//                     type="text"
//                     value={verificationCode}
//                     onChange={(e) => {
//                       const value = e.target.value.replace(/\D/g, "").slice(0, 6);
//                       setVerificationCode(value);
//                     }}
//                     onKeyPress={handleKeyPress}
//                     className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-center text-xl tracking-[0.35em] text-gray-900 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
//                     placeholder="123456"
//                     maxLength="6"
//                     autoFocus
//                   />
//                   <p className="mt-2 text-xs text-gray-500 text-center">
//                     Enter the 6 digit code we sent to your email
//                   </p>
//                 </div>

//                 <button
//                   onClick={handleVerifyEmail}
//                   disabled={isLoading || verificationCode.length !== 6}
//                   className="h-12 w-full rounded-full bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {isLoading ? "Verifying..." : "Verify & Sign in"}
//                 </button>

//                 <div className="text-center">
//                   <p className="mb-2 text-sm text-gray-600">Didn’t receive the code?</p>
//                   <button
//                     onClick={handleResendCode}
//                     disabled={resendCooldown > 0 || isLoading}
//                     className="text-sm font-semibold text-sky-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
//                   >
//                     {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend verification code"}
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* Normal Login Form */}
//             {step !== "2fa" && step !== "verify" && (
//               <div className="space-y-5">
//                 {/* Email */}
//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-gray-900">
//                     Email
//                   </label>
//                   <div className="relative">
//                     <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="email"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       onKeyPress={handleKeyPress}
//                       className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
//                       placeholder="name@example.com"
//                     />
//                   </div>
//                 </div>

//                 {/* Password */}
//                 <div>
//                   <label className="mb-2 block text-sm font-semibold text-gray-900">
//                     Password
//                   </label>
//                   <div className="relative">
//                     <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
//                     <input
//                       type={showPasswordText ? "text" : "password"}
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       onKeyPress={handleKeyPress}
//                       className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-12 text-sm text-gray-900 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
//                       placeholder="••••••••"
//                       autoComplete="current-password"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => setShowPasswordText(!showPasswordText)}
//                       className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
//                       aria-label={showPasswordText ? "Hide password" : "Show password"}
//                     >
//                       {showPasswordText ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
//                     </button>
//                   </div>
//                 </div>

//                 {/* Remember + Forgot row (visual only unless you have state) */}
//                 <div className="flex items-center justify-between pt-1">
                  

//                   <button
//                     onClick={handleForgotPassword}
//                     className="text-sm font-semibold text-sky-600"
//                   >
//                     Forgot password?
//                   </button>
//                 </div>

//                 {/* Sign in button */}
//                 <button
//                   onClick={handleLogin}
//                   disabled={isLoading || !email || !password}
//                   className="group flex h-12 w-full items-center justify-center rounded-full bg-sky-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {isLoading ? (
//                     "Signing in..."
//                   ) : (
//                     <span className="inline-flex items-center gap-2">
//                       Sign In
//                       <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
//                     </span>
//                   )}
//                 </button>

//                 {/* Divider */}
//                 <div className="relative py-2">
//                   <div className="absolute inset-0 flex items-center">
//                     <div className="w-full border-t border-gray-200" />
//                   </div>
//                   <div className="relative flex justify-center">
//                     <span className="bg-white px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
//                       or continue with
//                     </span>
//                   </div>
//                 </div>

//                 {/* GitHub */}
//                 <button
//                   onClick={handleGitHubLogin}
//                   className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
//                 >
//                   <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
//                     <path
//                       fillRule="evenodd"
//                       d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                   GitHub
//                 </button>

//                 {/* Sign up link */}
//                 <p className="pt-2 text-center text-sm text-gray-600">
//                   Don’t have an account?{" "}
//                   <a href="/register" className="font-semibold text-sky-600 hover:underline">
//                     Sign up
//                   </a>
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Hide browser password toggle */}
//         <style jsx>{`
//           input[type="password"]::-ms-reveal,
//           input[type="password"]::-ms-clear {
//             display: none;
//           }
//           input[type="password"]::-webkit-credentials-auto-fill-button,
//           input[type="password"]::-webkit-strong-password-auto-fill-button {
//             display: none !important;
//           }
//         `}</style>
//       </div>
//     </div>
//   </div>
// );


  // return (
  //   <div className="min-h-screen bg-gray-50">
  //     <div className="mx-auto max-w-6xl px-4 py-10 lg:py-16">
  //       <div className="flex flex-col items-center justify-center gap-10 lg:flex-row lg:items-stretch lg:gap-40">
  //         {/* Left marketing panel (hidden on mobile) */}
  //         <div className="hidden w-full max-w-xl lg:block">
  //           <div className="flex h-full flex-col justify-center px-2 text-center lg:px-0 lg:text-left">
  //             <div className="mx-auto mb-8 flex items-center gap-3 lg:mx-0">
  //               <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5a33ff] text-white shadow-sm">
  //                 <img src="/bug.png" alt="Bug" className="h-8 w-8" />
  //               </div>
  //               <span className="text-3xl font-bold text-[#5a33ff]">Smellify</span>
  //             </div>

  //             <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
  //               Welcome back to
  //               <br />
  //               <span className="bg-gradient-to-r from-[#5a33ff] to-indigo-500 bg-clip-text text-transparent">
  //                 cleaner code
  //               </span>
  //             </h2>

  //             <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600">
  //               Continue your journey to write better, more maintainable code with AI-powered analysis.
  //             </p>

  //             <div className="mt-10 space-y-4">
  //               {[
  //                 "Instant code smell detection",
  //                 "Personalized improvement suggestions",
  //                 "Track your code quality over time",
  //               ].map((t, index) => (
  //                 <div 
  //                   key={t} 
  //                   className="flex items-center gap-3 text-gray-600 animate-fade-in-up"
  //                   style={{ 
  //                     animationDelay: `${index * 150}ms`,
  //                     opacity: 0,
  //                     animationFillMode: 'forwards'
  //                   }}
  //                 >
  //                   <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#5a33ff] text-white">
  //                     <ArrowRight className="h-4 w-4" />
  //                   </span>
  //                   <span className="text-sm font-medium">{t}</span>
  //                 </div>
  //               ))}
  //             </div>
  //           </div>
  //         </div>

  //         {/* Right form card */}
  //         <div className="w-full max-w-md">
  //           <div className="rounded-[32px] border border-gray-100 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-9">
  //             {/* Header */}
  //             <div className="mb-7 text-center">
  //               <h1 className="text-3xl font-bold tracking-tight text-gray-900">
  //                 {step === "2fa" ? "Two-factor verification" : step === "verify" ? "Verify email" : "Sign in"}
  //               </h1>
  //               <p className="mt-2 text-sm text-gray-500">
  //                 {step === "2fa"
  //                   ? "Enter the 6-digit code from your authenticator app"
  //                   : step === "verify"
  //                     ? "Enter the 6-digit code we sent to your email"
  //                     : "Enter your credentials to access your account"}
  //               </p>
  //             </div>

  //             {/* Error */}
  //             {error && (
  //               <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
  //                 <p className="text-sm text-red-800">{error}</p>
  //               </div>
  //             )}

  //             {/* 2FA Step */}
  //             {step === "2fa" && (
  //               <div className="space-y-6">
  //                 <div className="flex justify-center">
  //                   <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-[#5a33ff]">
  //                     <Shield className="h-7 w-7" />
  //                   </div>
  //                 </div>

  //                 <div>
  //                   <label className="mb-2 block text-sm font-semibold text-gray-900">
  //                     Authentication Code
  //                   </label>
  //                   <input
  //                     type="text"
  //                     value={twoFactorCode}
  //                     onChange={(e) => {
  //                       const value = e.target.value.replace(/[^A-Z0-9]/g, "").slice(0, 6);
  //                       setTwoFactorCode(value);
  //                     }}
  //                     onKeyPress={handleKeyPress}
  //                     className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-center text-xl tracking-[0.35em] text-gray-900 outline-none transition focus:border-[#7d5aff] focus:ring-4 focus:ring-[#b89fff]"
  //                     placeholder="123456"
  //                     maxLength="6"
  //                     autoFocus
  //                   />
  //                   <p className="mt-2 text-center text-xs text-gray-500">
  //                     Enter the 6-digit code from your authenticator app
  //                   </p>
  //                 </div>

  //                 <button
  //                   onClick={handle2FAVerification}
  //                   disabled={isLoading || twoFactorCode.length !== 6}
  //                   className="h-12 w-full rounded-full bg-[#5a33ff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4a29cc] focus:outline-none focus:ring-4 focus:ring-[#9d7fff] disabled:cursor-not-allowed disabled:opacity-60"
  //                 >
  //                   {isLoading ? "Verifying..." : "Verify & Sign in"}
  //                 </button>

  //                 <div className="text-center">
  //                   <button
  //                     onClick={handleBackToPassword}
  //                     className="text-sm font-semibold text-[#5a33ff] hover:underline"
  //                   >
  //                     Back to password
  //                   </button>
  //                 </div>
  //               </div>
  //             )}

  //             {/* Email Verification Step */}
  //             {step === "verify" && (
  //               <div className="space-y-6">
  //                 <div className="flex justify-center">
  //                   <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-[#5a33ff]">
  //                     <CircleCheck className="h-7 w-7" />
  //                   </div>
  //                 </div>

  //                 <div>
  //                   <label className="mb-2 block text-sm font-semibold text-gray-900">
  //                     Verification Code
  //                   </label>
  //                   <input
  //                     type="text"
  //                     value={verificationCode}
  //                     onChange={(e) => {
  //                       const value = e.target.value.replace(/\D/g, "").slice(0, 6);
  //                       setVerificationCode(value);
  //                     }}
  //                     onKeyPress={handleKeyPress}
  //                     className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-center text-xl tracking-[0.35em] text-gray-900 outline-none transition focus:border-[#7d5aff] focus:ring-4 focus:ring-[#b89fff]"
  //                     placeholder="123456"
  //                     maxLength="6"
  //                     autoFocus
  //                   />
  //                   <p className="mt-2 text-center text-xs text-gray-500">
  //                     Enter the 6 digit code we sent to your email
  //                   </p>
  //                 </div>

  //                 <button
  //                   onClick={handleVerifyEmail}
  //                   disabled={isLoading || verificationCode.length !== 6}
  //                   className="h-12 w-full rounded-full bg-[#5a33ff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4a29cc] focus:outline-none focus:ring-4 focus:ring-[#9d7fff] disabled:cursor-not-allowed disabled:opacity-60"
  //                 >
  //                   {isLoading ? "Verifying..." : "Verify & Sign in"}
  //                 </button>

  //                 <div className="text-center">
  //                   <p className="mb-2 text-sm text-gray-600">Didn't receive the code?</p>
  //                   <button
  //                     onClick={handleResendCode}
  //                     disabled={resendCooldown > 0 || isLoading}
  //                     className="text-sm font-semibold text-[#5a33ff] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
  //                   >
  //                     {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend verification code"}
  //                   </button>
  //                 </div>
  //               </div>
  //             )}

  //             {/* Normal Login Form */}
  //             {step !== "2fa" && step !== "verify" && (
  //               <div className="space-y-5">
  //                 {/* Email */}
  //                 <div>
  //                   <label className="mb-2 block text-sm font-semibold text-gray-900">
  //                     Email
  //                   </label>
  //                   <div className="relative">
  //                     <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
  //                     <input
  //                       type="email"
  //                       value={email}
  //                       onChange={(e) => setEmail(e.target.value)}
  //                       onKeyPress={handleKeyPress}
  //                       className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-sm text-gray-900 outline-none transition focus:border-[#7d5aff] focus:ring-4 focus:ring-[#b89fff]"
  //                       placeholder="name@example.com"
  //                     />
  //                   </div>
  //                 </div>

  //                 {/* Password */}
  //                 <div>
  //                   <label className="mb-2 block text-sm font-semibold text-gray-900">
  //                     Password
  //                   </label>
  //                   <div className="relative">
  //                     <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
  //                     <input
  //                       type={showPasswordText ? "text" : "password"}
  //                       value={password}
  //                       onChange={(e) => setPassword(e.target.value)}
  //                       onKeyPress={handleKeyPress}
  //                       className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-12 text-sm text-gray-900 outline-none transition focus:border-[#7d5aff] focus:ring-4 focus:ring-[#b89fff]"
  //                       placeholder="••••••••"
  //                       autoComplete="current-password"
  //                     />
  //                     <button
  //                       type="button"
  //                       onClick={() => setShowPasswordText(!showPasswordText)}
  //                       className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
  //                       aria-label={showPasswordText ? "Hide password" : "Show password"}
  //                     >
  //                       {showPasswordText ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
  //                     </button>
  //                   </div>
  //                 </div>

  //                 {/* Remember + Forgot row */}
  //                 <div className="flex items-center justify-between pt-1">
  //                   <div></div>
  //                   <button
  //                     onClick={handleForgotPassword}
  //                     className="text-sm font-semibold text-[#5a33ff] hover:underline"
  //                   >
  //                     Forgot password?
  //                   </button>
  //                 </div>

  //                 {/* Sign in button */}
  //                 <button
  //                   onClick={handleLogin}
  //                   disabled={isLoading || !email || !password}
  //                   className="group flex h-12 w-full items-center justify-center rounded-full bg-[#5a33ff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4a29cc] focus:outline-none focus:ring-4 focus:ring-[#9d7fff] disabled:cursor-not-allowed disabled:opacity-60"
  //                 >
  //                   {isLoading ? (
  //                     "Signing in..."
  //                   ) : (
  //                     <span className="inline-flex items-center gap-2">
  //                       Sign In
  //                       <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
  //                     </span>
  //                   )}
  //                 </button>

  //                 {/* Divider */}
  //                 <div className="relative py-2">
  //                   <div className="absolute inset-0 flex items-center">
  //                     <div className="w-full border-t border-gray-200" />
  //                   </div>
  //                   <div className="relative flex justify-center">
  //                     <span className="bg-white px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
  //                       or continue with
  //                     </span>
  //                   </div>
  //                 </div>

  //                 {/* GitHub */}
  //                 <button
  //                   onClick={handleGitHubLogin}
  //                   className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
  //                 >
  //                   <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
  //                     <path
  //                       fillRule="evenodd"
  //                       d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
  //                       clipRule="evenodd"
  //                     />
  //                   </svg>
  //                   GitHub
  //                 </button>

  //                 {/* Sign up link */}
  //                 <p className="pt-2 text-center text-sm text-gray-600">
  //                   Don't have an account?{" "}
  //                   <a href="/register" className="font-semibold text-[#5a33ff] hover:underline">
  //                     Sign up
  //                   </a>
  //                 </p>
  //               </div>
  //             )}
  //           </div>
  //         </div>

  //         {/* Hide browser password toggle */}
  //         <style jsx>{`
  //           input[type="password"]::-ms-reveal,
  //           input[type="password"]::-ms-clear {
  //             display: none;
  //           }
  //           input[type="password"]::-webkit-credentials-auto-fill-button,
  //           input[type="password"]::-webkit-strong-password-auto-fill-button {
  //             display: none !important;
  //           }

  //           @keyframes fade-in-up {
  //             from {
  //               opacity: 0;
  //               transform: translateY(20px);
  //             }
  //             to {
  //               opacity: 1;
  //               transform: translateY(0);
  //             }
  //           }

  //           .animate-fade-in-up {
  //             animation: fade-in-up 0.6s ease-out;
  //           }
  //         `}</style>
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
                Welcome back to
                <div className="h-2"> </div>
                <span className="bg-gradient-to-r from-[#5a33ff] to-indigo-500 bg-clip-text text-transparent">
                  Smellify
                </span>
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-gray-600">
                Continue your journey to write better, more maintainable code with AI-powered analysis.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  "Instant code smell detection",
                  "Personalized improvement suggestions",
                  "Track your code quality over time",
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
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {step === "2fa" ? "Two-factor verification" : step === "verify" ? "Verify email" : "Sign in"}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {step === "2fa"
                    ? "Enter the 6-digit code from your authenticator app"
                    : step === "verify"
                      ? "Enter the 6-digit code we sent to your email"
                      : "Enter your credentials to access your account"}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* 2FA Step */}
              {step === "2fa" && (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-[#5a33ff]">
                      <Shield className="h-7 w-7" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      Authentication Code
                    </label>
                    <input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Z0-9]/g, "").slice(0, 6);
                        setTwoFactorCode(value);
                      }}
                      onKeyPress={handleKeyPress}
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-center text-xl tracking-[0.35em] text-gray-900 outline-none transition focus:border-[#7d5aff] focus:ring-4 focus:ring-[#b89fff]"
                      placeholder="123456"
                      maxLength="6"
                      autoFocus
                    />
                    <p className="mt-2 text-center text-xs text-gray-500">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>

                  <button
                    onClick={handle2FAVerification}
                    disabled={isLoading || twoFactorCode.length !== 6}
                    className="h-12 w-full rounded-full bg-[#5a33ff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4a29cc] focus:outline-none focus:ring-4 focus:ring-[#9d7fff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Verifying..." : "Verify & Sign in"}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={handleBackToPassword}
                      className="text-sm font-semibold text-[#5a33ff] hover:underline"
                    >
                      Back to password
                    </button>
                  </div>
                </div>
              )}

              {/* Email Verification Step */}
              {step === "verify" && (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-[#5a33ff]">
                      <CircleCheck className="h-7 w-7" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setVerificationCode(value);
                      }}
                      onKeyPress={handleKeyPress}
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-center text-xl tracking-[0.35em] text-gray-900 outline-none transition focus:border-[#7d5aff] focus:ring-4 focus:ring-[#b89fff]"
                      placeholder="123456"
                      maxLength="6"
                      autoFocus
                    />
                    <p className="mt-2 text-center text-xs text-gray-500">
                      Enter the 6 digit code we sent to your email
                    </p>
                  </div>

                  <button
                    onClick={handleVerifyEmail}
                    disabled={isLoading || verificationCode.length !== 6}
                    className="h-12 w-full rounded-full bg-[#5a33ff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4a29cc] focus:outline-none focus:ring-4 focus:ring-[#9d7fff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Verifying..." : "Verify & Sign in"}
                  </button>

                  <div className="text-center">
                    <p className="mb-2 text-sm text-gray-600">Didn't receive the code?</p>
                    <button
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0 || isLoading}
                      className="text-sm font-semibold text-[#5a33ff] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend verification code"}
                    </button>
                  </div>
                </div>
              )}

              {/* Normal Login Form */}
              {step !== "2fa" && step !== "verify" && (
                <div className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      Email
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
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type={showPasswordText ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-12 text-sm text-gray-900 outline-none transition focus:border-[#7d5aff] focus:ring-4 focus:ring-[#b89fff]"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                        aria-label={showPasswordText ? "Hide password" : "Show password"}
                      >
                        {showPasswordText ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember + Forgot row */}
                  <div className="flex items-center justify-between pt-1">
                    <div></div>
                    <button
                      onClick={handleForgotPassword}
                      className="text-sm font-semibold text-[#5a33ff] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Sign in button */}
                  <button
                    onClick={handleLogin}
                    disabled={isLoading || !email || !password}
                    className="group flex h-12 w-full items-center justify-center rounded-full bg-[#5a33ff] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4a29cc] focus:outline-none focus:ring-4 focus:ring-[#9d7fff] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      "Signing in..."
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        Sign In
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                      </span>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
                        or continue with
                      </span>
                    </div>
                  </div>

                  {/* GitHub */}
                  <button
                    onClick={handleGitHubLogin}
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    GitHub
                  </button>

                  {/* Sign up link */}
                  <p className="pt-2 text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <a href="/register" className="font-semibold text-[#5a33ff] hover:underline">
                      Sign up
                    </a>
                  </p>
                </div>
              )}
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
