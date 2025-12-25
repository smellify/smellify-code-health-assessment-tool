// //components/Paymentmodal.js
// import React, { useState, useEffect } from "react";
// import { Check, X, Lock } from "lucide-react";
// import api from "../services/api";

// export default function PaymentModal({ isOpen, onClose, plan }) {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     country: "",
//     zip: "",
//     cardNumber: "",
//     expiry: "",
//     cvc: "",
//     quantity: 1,
//   });

//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});

//   // Fetch user profile
//   useEffect(() => {
//     const fetchUserProfile = async () => {
//       try {
//         const response = await api.get("/users/profile");
//         const userData = response.data;

//         setFormData((prev) => ({
//           ...prev,
//           name: userData.name || "",
//           email: userData.email || "",
//         }));
//       } catch (error) {
//         console.error("Failed to fetch user profile:", error);
//       }
//     };

//     fetchUserProfile();
//   }, []);

//   // Lock body scroll when modal is open
//   useEffect(() => {
//     document.body.style.overflow = isOpen ? "hidden" : "unset";
//     return () => {
//       document.body.style.overflow = "unset";
//     };
//   }, [isOpen]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
    
//     // Clear error for this field when user starts typing
//     if (errors[name]) {
//       setErrors((prev) => ({
//         ...prev,
//         [name]: "",
//       }));
//     }

//     // Handle card number - only allow digits and auto-format
//     if (name === "cardNumber") {
//       const numericValue = value.replace(/\D/g, "");
      
//       // Limit to 16 digits
//       if (numericValue.length <= 16) {
//         // Format as groups of 4
//         const formatted = numericValue.replace(/(\d{4})/g, "$1 ").trim();
//         setFormData((prev) => ({
//           ...prev,
//           [name]: formatted,
//         }));
//       }
//       return;
//     }

//     // Handle CVC - only allow digits
//     if (name === "cvc") {
//       const numericValue = value.replace(/\D/g, "");
      
//       // Limit to 4 digits
//       if (numericValue.length <= 4) {
//         setFormData((prev) => ({
//           ...prev,
//           [name]: numericValue,
//         }));
//       }
//       return;
//     }

//     // Auto-format expiry date
//     if (name === "expiry") {
//       let formattedValue = value.replace(/\D/g, "");
      
//       if (formattedValue.length >= 1) {
//         let month = formattedValue.slice(0, 2);
//         if (formattedValue.length === 1 && parseInt(formattedValue) > 1) {
//           month = "0" + formattedValue[0];
//           formattedValue = month + formattedValue.slice(1);
//         } else if (formattedValue.length >= 2) {
//           let monthNum = parseInt(month);
//           if (monthNum > 12) {
//             month = "12";
//           } else if (monthNum < 1) {
//             month = "01";
//           }
//           formattedValue = month + formattedValue.slice(2);
//         }
//       }
      
//       if (formattedValue.length >= 2) {
//         formattedValue = formattedValue.slice(0, 2) + "/" + formattedValue.slice(2, 4);
//       }
      
//       setFormData((prev) => ({
//         ...prev,
//         [name]: formattedValue,
//       }));
//       return;
//     }

//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleSubmit = async () => {
//     // Validate all required fields
//     const newErrors = {};

//     if (!formData.name.trim()) {
//       newErrors.name = "Full name is required";
//     }
//     if (!formData.email.trim()) {
//       newErrors.email = "Email address is required";
//     }
//     if (!formData.country.trim()) {
//       newErrors.country = "Country is required";
//     }
//     if (!formData.zip.trim()) {
//       newErrors.zip = "ZIP / Postal code is required";
//     }
    
//     // Validate card number
//     const cardDigits = formData.cardNumber.replace(/\D/g, "");
//     if (!cardDigits) {
//       newErrors.cardNumber = "Card number is required";
//     } else if (cardDigits.length < 13 || cardDigits.length > 16) {
//       newErrors.cardNumber = "Card number must be 13-16 digits";
//     }
    
//     if (!formData.expiry.trim()) {
//       newErrors.expiry = "Expiry date is required";
//     } else if (formData.expiry.length < 5) {
//       newErrors.expiry = "Invalid expiry date format (MM/YY)";
//     }
    
//     // Validate CVC
//     if (!formData.cvc.trim()) {
//       newErrors.cvc = "CVC is required";
//     } else if (formData.cvc.length < 3 || formData.cvc.length > 4) {
//       newErrors.cvc = "CVC must be 3-4 digits";
//     }

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       return;
//     }

//     setLoading(true);

//     try {
//       const response = await api.post("/billing/purchase", {
//         packageId: plan.id,
//         quantity: formData.quantity,
//         cardNumber: formData.cardNumber.replace(/\s/g, ""), // Remove spaces before sending
//         country: formData.country,
//         zip: formData.zip,
//       });

//       alert(
//         `Payment of $${(plan.price * formData.quantity).toFixed(2)} processed successfully!\n` +
//         `${response.data.transaction.creditsAdded} credits added to your account.\n` +
//         `Transaction ID: ${response.data.transaction.transactionId}`
//       );

//       onClose();
      
//       // Reset form
//       setFormData((prev) => ({
//         ...prev,
//         country: "",
//         zip: "",
//         cardNumber: "",
//         expiry: "",
//         cvc: "",
//         quantity: 1,
//       }));
//       setErrors({});

//       // Optionally refresh the page or update user data
//       window.location.reload();
//     } catch (error) {
//       console.error("Payment error:", error);
//       alert(
//         error.response?.data?.error || 
//         "Payment failed. Please try again."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
//       <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-[95vw] sm:w-[90vw] max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative flex flex-col lg:flex-row">
//         {/* Close Button */}
//         <button
//           onClick={onClose}
//           className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-lg transition z-10 bg-white lg:bg-transparent"
//         >
//           <X className="w-5 h-5 sm:w-6 sm:h-6" />
//         </button>

//         {/* Hide Scrollbar */}
//         <style>{`
//           .hide-scrollbar {
//             -ms-overflow-style: none;
//             scrollbar-width: none;
//           }
//           .hide-scrollbar::-webkit-scrollbar {
//             display: none;
//           }
//           input[type="number"]::-webkit-outer-spin-button,
//           input[type="number"]::-webkit-inner-spin-button {
//             -webkit-appearance: none;
//             margin: 0;
//           }
//           input[type="number"] {
//             -moz-appearance: textfield;
//           }
//         `}</style>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col lg:flex-row">
//           {/* Left Side - Form */}
//           <div className="flex-1 p-4 sm:p-6 lg:p-8">
//             <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
//               Billing Details
//             </h2>

//             <div className="space-y-4">
//               {[
//                 { label: "Full Name", name: "name", placeholder: "John Doe", disabled: true },
//                 {
//                   label: "Email Address",
//                   name: "email",
//                   placeholder: "john@example.com",
//                   type: "email",
//                   disabled: true,
//                 },
//                 {
//                   label: "Country",
//                   name: "country",
//                   placeholder: "United States",
//                 },
//                 {
//                   label: "ZIP / Postal Code",
//                   name: "zip",
//                   placeholder: "12345",
//                 },
//                 {
//                   label: "Card Number",
//                   name: "cardNumber",
//                   placeholder: "1234 5678 9012 3456",
//                 },
//               ].map((field, i) => (
//                 <div key={i}>
//                   <label className="block text-sm font-semibold text-gray-700 mb-1">
//                     {field.label}
//                   </label>
//                   <input
//                     type={field.type || "text"}
//                     name={field.name}
//                     value={formData[field.name]}
//                     onChange={handleChange}
//                     placeholder={field.placeholder}
//                     disabled={field.disabled}
//                     className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
//                       field.disabled 
//                         ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300" 
//                         : errors[field.name]
//                         ? "border-red-500"
//                         : "border-gray-300"
//                     }`}
//                   />
//                   {errors[field.name] && (
//                     <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
//                   )}
//                 </div>
//               ))}

//               {/* Expiry and CVC */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-1">
//                     Expiry Date
//                   </label>
//                   <input
//                     type="text"
//                     name="expiry"
//                     value={formData.expiry}
//                     onChange={handleChange}
//                     maxLength="5"
//                     className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
//                       errors.expiry ? "border-red-500" : "border-gray-300"
//                     }`}
//                     placeholder="MM/YY"
//                   />
//                   {errors.expiry && (
//                     <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>
//                   )}
//                 </div>
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-1">
//                     CVC
//                   </label>
//                   <input
//                     type="text"
//                     name="cvc"
//                     value={formData.cvc}
//                     onChange={handleChange}
//                     maxLength="4"
//                     className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
//                       errors.cvc ? "border-red-500" : "border-gray-300"
//                     }`}
//                     placeholder="123"
//                   />
//                   {errors.cvc && (
//                     <p className="text-red-500 text-xs mt-1">{errors.cvc}</p>
//                   )}
//                 </div>
//               </div>

//               {/* Quantity for Starter */}
//               {plan.id === "starter" && (
//                 <div>
//                   <label className="block text-sm font-semibold text-gray-700 mb-1">
//                     Quantity
//                   </label>
//                   <div className="flex items-center gap-3">
//                     <button
//                       type="button"
//                       onClick={() =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           quantity: Math.max(1, prev.quantity - 1),
//                         }))
//                       }
//                       className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//                     >
//                       −
//                     </button>
//                     <input
//                       type="number"
//                       value={formData.quantity}
//                       onChange={(e) =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           quantity: Math.max(1, parseInt(e.target.value) || 1),
//                         }))
//                       }
//                       min="1"
//                       className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//                     />
//                     <button
//                       type="button"
//                       onClick={() =>
//                         setFormData((prev) => ({
//                           ...prev,
//                           quantity: prev.quantity + 1,
//                         }))
//                       }
//                       className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//                     >
//                       +
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Right Side - Summary */}
//           <div className="w-full lg:w-96 bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 lg:p-8 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200">
//             <h3 className="font-bold text-gray-900 mb-6 sm:mb-8 text-base sm:text-lg">
//               Order Summary
//             </h3>

//             {/* Plan Info */}
//             <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-purple-200">
//               <div
//                 className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg mb-3 sm:mb-4"
//                 style={{ backgroundColor: "#5A33FF" }}
//               >
//                 <plan.icon
//                   className="w-5 h-5 sm:w-6 sm:h-6 text-white"
//                   strokeWidth={2.5}
//                 />
//               </div>
//               <h4 className="font-bold text-gray-900 mb-1 text-base sm:text-lg">
//                 {plan.name}
//               </h4>
//               <p className="text-xs sm:text-sm text-gray-600">
//                 {plan.description}
//               </p>
//             </div>

//             {/* Price Summary */}
//             <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-purple-200">
//               <div className="flex justify-between text-sm sm:text-base">
//                 <span className="text-gray-700">{plan.name}</span>
//                 <span className="font-semibold text-gray-900">
//                   ${plan.price.toFixed(2)}
//                 </span>
//               </div>
//               {plan.id === "starter" && (
//                 <div className="flex justify-between text-sm sm:text-base">
//                   <span className="text-gray-700">Quantity</span>
//                   <span className="font-semibold text-gray-900">
//                     x{formData.quantity}
//                   </span>
//                 </div>
//               )}
//             </div>

//             {/* Total */}
//             <div className="mb-6 sm:mb-8">
//               <div className="flex justify-between items-center">
//                 <span className="font-bold text-gray-900 text-sm sm:text-base">
//                   Total
//                 </span>
//                 <span
//                   className="text-2xl sm:text-3xl font-bold"
//                   style={{ color: "#5A33FF" }}
//                 >
//                   ${(plan.price * formData.quantity).toFixed(2)}
//                 </span>
//               </div>
//             </div>

//             {/* Features */}
//             <div className="mb-6 sm:mb-8 flex-1">
//               <p className="text-xs font-semibold text-gray-600 mb-2 sm:mb-3 uppercase">
//                 Includes
//               </p>
//               <div className="space-y-1.5 sm:space-y-2">
//                 {plan.features.slice(0, 4).map((feature, idx) => (
//                   <div key={idx} className="flex items-start gap-2">
//                     <Check
//                       className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5"
//                       style={{ color: "#5A33FF" }}
//                       strokeWidth={3}
//                     />
//                     <span className="text-xs sm:text-sm text-gray-700">
//                       {feature}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Pay Button */}
//             <button
//               onClick={handleSubmit}
//               disabled={loading}
//               className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-2 sm:mb-3 text-sm sm:text-base"
//             >
//               {loading
//                 ? "Processing..."
//                 : `Pay $${(plan.price * formData.quantity).toFixed(2)}`}
//             </button>

//             <p className="text-xs text-gray-600 text-center mb-2 sm:mb-3 flex items-center justify-center gap-1">
//               <Lock className="w-3 h-3" />
//               Your payment information is secure and encrypted.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// //components/Paymentmodal.js
// import React, { useState, useEffect } from "react";
// import { Check, X, Lock } from "lucide-react";
// import { loadStripe } from '@stripe/stripe-js';
// import {
//   Elements,
//   CardNumberElement,
//   CardExpiryElement,
//   CardCvcElement,
//   useStripe,
//   useElements,
// } from "@stripe/react-stripe-js";
// import api from "../services/api";
// import { useNotification } from '../components/NotificationPopup';

// const stripePromise = loadStripe("pk_test_51Rwee1HLu4gv9DOKE5NyYIn7nOdmDWmeo0AW3Y0j8u4W17AdU6pt1tgSaEg2HnuNohZuuZ9nwasjT0OaiTovSwqH00CCl4WOFm");

// const CARD_ELEMENT_OPTIONS = {
//   style: {
//     base: {
//       fontSize: '16px',
//       color: '#1f2937',
//       '::placeholder': {
//         color: '#9ca3af',
//       },
//       fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
//     },
//     invalid: {
//       color: '#ef4444',
//     },
//   },
// };

// // Inner form component that uses Stripe hooks
// function PaymentForm({ plan, onClose, formData, setFormData }) {
//   const stripe = useStripe();
//   const elements = useElements();
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [cardErrors, setCardErrors] = useState({});
//   const { showNotification } = useNotification();

//   const handleChange = (e) => {
//     const { name, value } = e.target;
    
//     if (errors[name]) {
//       setErrors((prev) => ({
//         ...prev,
//         [name]: "",
//       }));
//     }

//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const handleCardElementChange = (elementType) => (event) => {
//     if (event.error) {
//       setCardErrors((prev) => ({
//         ...prev,
//         [elementType]: event.error.message,
//       }));
//     } else {
//       setCardErrors((prev) => ({
//         ...prev,
//         [elementType]: "",
//       }));
//     }
//   };

//   const handleSubmit = async () => {
//     const newErrors = {};

//     if (!formData.name.trim()) {
//       newErrors.name = "Full name is required";
//     }
//     if (!formData.email.trim()) {
//       newErrors.email = "Email address is required";
//     }
//     if (!formData.country.trim()) {
//       newErrors.country = "Country is required";
//     }
//     if (!formData.zip.trim()) {
//       newErrors.zip = "ZIP / Postal code is required";
//     }

//     if (Object.keys(newErrors).length > 0) {
//       setErrors(newErrors);
//       showNotification('warning', 'Please fill in all required fields');
//       return;
//     }

//     if (!stripe || !elements) {
//       showNotification('error', 'Stripe has not loaded yet. Please try again.');
//       return;
//     }

//     setLoading(true);

//     try {
//       // Create payment intent
//       const intentResponse = await api.post("/billing/create-payment-intent", {
//         packageId: plan.id,
//         quantity: formData.quantity,
//         country: formData.country,
//         zip: formData.zip,
//       });

//       const { clientSecret } = intentResponse.data;

//       // Confirm payment with Stripe
//       const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
//         payment_method: {
//           card: elements.getElement(CardNumberElement),
//           billing_details: {
//             name: formData.name,
//             email: formData.email,
//             address: {
//               country: formData.country,
//               postal_code: formData.zip,
//             },
//           },
//         },
//       });

//       if (error) {
//         showNotification('error', error.message);
//         setLoading(false);
//         return;
//       }

//       if (paymentIntent.status === "succeeded") {
//         // Confirm payment on backend
//         const confirmResponse = await api.post("/billing/confirm-payment", {
//           paymentIntentId: paymentIntent.id,
//           packageId: plan.id,
//           quantity: formData.quantity,
//           country: formData.country,
//           zip: formData.zip,
//         });

//         showNotification(
//           'success',
//           `Payment of $${(plan.price * formData.quantity).toFixed(2)} processed successfully! ${confirmResponse.data.transaction.creditsAdded} credits added to your account.`
//         );

//         onClose();
        
//         // Reset form
//         setFormData((prev) => ({
//           ...prev,
//           country: "",
//           zip: "",
//           quantity: 1,
//         }));
//         setErrors({});

//         window.location.reload();
//       }
//     } catch (error) {
//       showNotification(
//         'error',
//         error.response?.data?.error || 'Payment failed. Please try again.'
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col lg:flex-row flex-1">
//       {/* Left Side - Form */}
//       <div className="flex-1 p-4 sm:p-6 lg:p-8">
//         <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
//           Billing Details
//         </h2>

//         <div className="space-y-4">
//           {[
//             { label: "Full Name", name: "name", placeholder: "John Doe", disabled: true },
//             {
//               label: "Email Address",
//               name: "email",
//               placeholder: "john@example.com",
//               type: "email",
//               disabled: true,
//             },
//             {
//               label: "Country",
//               name: "country",
//               placeholder: "United States",
//             },
//             {
//               label: "ZIP / Postal Code",
//               name: "zip",
//               placeholder: "12345",
//             },
//           ].map((field, i) => (
//             <div key={i}>
//               <label className="block text-sm font-semibold text-gray-700 mb-1">
//                 {field.label}
//               </label>
//               <input
//                 type={field.type || "text"}
//                 name={field.name}
//                 value={formData[field.name]}
//                 onChange={handleChange}
//                 placeholder={field.placeholder}
//                 disabled={field.disabled}
//                 className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
//                   field.disabled 
//                     ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300" 
//                     : errors[field.name]
//                     ? "border-red-500"
//                     : "border-gray-300"
//                 }`}
//               />
//               {errors[field.name] && (
//                 <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
//               )}
//             </div>
//           ))}

//           {/* Card Number */}
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-1">
//               Card Number
//             </label>
//             <div className={`w-full px-4 py-2 border rounded-lg ${
//               cardErrors.cardNumber ? "border-red-500" : "border-gray-300"
//             }`}>
//               <CardNumberElement 
//                 options={CARD_ELEMENT_OPTIONS}
//                 onChange={handleCardElementChange('cardNumber')}
//               />
//             </div>
//             {cardErrors.cardNumber && (
//               <p className="text-red-500 text-xs mt-1">{cardErrors.cardNumber}</p>
//             )}
//           </div>

//           {/* Expiry and CVC */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-1">
//                 Expiry Date
//               </label>
//               <div className={`w-full px-4 py-2 border rounded-lg ${
//                 cardErrors.expiry ? "border-red-500" : "border-gray-300"
//               }`}>
//                 <CardExpiryElement 
//                   options={CARD_ELEMENT_OPTIONS}
//                   onChange={handleCardElementChange('expiry')}
//                 />
//               </div>
//               {cardErrors.expiry && (
//                 <p className="text-red-500 text-xs mt-1">{cardErrors.expiry}</p>
//               )}
//             </div>
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-1">
//                 CVC
//               </label>
//               <div className={`w-full px-4 py-2 border rounded-lg ${
//                 cardErrors.cvc ? "border-red-500" : "border-gray-300"
//               }`}>
//                 <CardCvcElement 
//                   options={CARD_ELEMENT_OPTIONS}
//                   onChange={handleCardElementChange('cvc')}
//                 />
//               </div>
//               {cardErrors.cvc && (
//                 <p className="text-red-500 text-xs mt-1">{cardErrors.cvc}</p>
//               )}
//             </div>
//           </div>

//           {/* Quantity for Starter */}
//           {plan.id === "starter" && (
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-1">
//                 Quantity
//               </label>
//               <div className="flex items-center gap-3">
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       quantity: Math.max(1, prev.quantity - 1),
//                     }))
//                   }
//                   className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//                 >
//                   −
//                 </button>
//                 <input
//                   type="number"
//                   value={formData.quantity}
//                   onChange={(e) =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       quantity: Math.max(1, parseInt(e.target.value) || 1),
//                     }))
//                   }
//                   min="1"
//                   className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
//                 />
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setFormData((prev) => ({
//                       ...prev,
//                       quantity: prev.quantity + 1,
//                     }))
//                   }
//                   className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//                 >
//                   +
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Right Side - Summary */}
//       <div className="w-full lg:w-96 bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 lg:p-8 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200">
//         <h3 className="font-bold text-gray-900 mb-6 sm:mb-8 text-base sm:text-lg">
//           Order Summary
//         </h3>

//         {/* Plan Info */}
//         <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-purple-200">
//           <div
//             className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg mb-3 sm:mb-4"
//             style={{ backgroundColor: "#5A33FF" }}
//           >
//             <plan.icon
//               className="w-5 h-5 sm:w-6 sm:h-6 text-white"
//               strokeWidth={2.5}
//             />
//           </div>
//           <h4 className="font-bold text-gray-900 mb-1 text-base sm:text-lg">
//             {plan.name}
//           </h4>
//           <p className="text-xs sm:text-sm text-gray-600">
//             {plan.description}
//           </p>
//         </div>

//         {/* Price Summary */}
//         <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-purple-200">
//           <div className="flex justify-between text-sm sm:text-base">
//             <span className="text-gray-700">{plan.name}</span>
//             <span className="font-semibold text-gray-900">
//               ${plan.price.toFixed(2)}
//             </span>
//           </div>
//           {plan.id === "starter" && (
//             <div className="flex justify-between text-sm sm:text-base">
//               <span className="text-gray-700">Quantity</span>
//               <span className="font-semibold text-gray-900">
//                 x{formData.quantity}
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Total */}
//         <div className="mb-6 sm:mb-8">
//           <div className="flex justify-between items-center">
//             <span className="font-bold text-gray-900 text-sm sm:text-base">
//               Total
//             </span>
//             <span
//               className="text-2xl sm:text-3xl font-bold"
//               style={{ color: "#5A33FF" }}
//             >
//               ${(plan.price * formData.quantity).toFixed(2)}
//             </span>
//           </div>
//         </div>

//         {/* Features */}
//         <div className="mb-6 sm:mb-8 flex-1">
//           <p className="text-xs font-semibold text-gray-600 mb-2 sm:mb-3 uppercase">
//             Includes
//           </p>
//           <div className="space-y-1.5 sm:space-y-2">
//             {plan.features.slice(0, 4).map((feature, idx) => (
//               <div key={idx} className="flex items-start gap-2">
//                 <Check
//                   className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5"
//                   style={{ color: "#5A33FF" }}
//                   strokeWidth={3}
//                 />
//                 <span className="text-xs sm:text-sm text-gray-700">
//                   {feature}
//                 </span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Pay Button */}
//         <button
//           onClick={handleSubmit}
//           disabled={loading}
//           className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-2 sm:mb-3 text-sm sm:text-base"
//         >
//           {loading
//             ? "Processing..."
//             : `Pay $${(plan.price * formData.quantity).toFixed(2)}`}
//         </button>

//         <p className="text-xs text-gray-600 text-center mb-2 sm:mb-3 flex items-center justify-center gap-1">
//           <Lock className="w-3 h-3" />
//           Your payment information is secure and encrypted.
//         </p>
//       </div>
//     </div>
//   );
// }

// // Main Modal Component
// export default function PaymentModal({ isOpen, onClose, plan }) {
//   const { showNotification } = useNotification();
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     country: "",
//     zip: "",
//     quantity: 1,
//   });

//   // Fetch user profile
//   useEffect(() => {
//     const fetchUserProfile = async () => {
//       try {
//         const response = await api.get("/users/profile");
//         const userData = response.data;

//         setFormData((prev) => ({
//           ...prev,
//           name: userData.name || "",
//           email: userData.email || "",
//         }));
//       } catch (error) {
//         showNotification('error', 'Failed to fetch user profile');
//       }
//     };

//     if (isOpen) {
//       fetchUserProfile();
//     }
//   }, [isOpen, showNotification]);

//   // Lock body scroll when modal is open
//   useEffect(() => {
//     document.body.style.overflow = isOpen ? "hidden" : "unset";
//     return () => {
//       document.body.style.overflow = "unset";
//     };
//   }, [isOpen]);

//   const handleCloseModal = () => {
//     setFormData((prev) => ({
//       ...prev,
//       country: "",
//       zip: "",
//       quantity: 1,
//     }));
//     onClose();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
//       <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-[95vw] sm:w-[90vw] max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative flex flex-col lg:flex-row">
//         {/* Close Button */}
//         <button
//           onClick={handleCloseModal}
//           className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-lg transition z-10 bg-white lg:bg-transparent"
//         >
//           <X className="w-5 h-5 sm:w-6 sm:h-6" />
//         </button>

//         {/* Hide Scrollbar */}
//         <style>{`
//           .hide-scrollbar {
//             -ms-overflow-style: none;
//             scrollbar-width: none;
//           }
//           .hide-scrollbar::-webkit-scrollbar {
//             display: none;
//           }
//           input[type="number"]::-webkit-outer-spin-button,
//           input[type="number"]::-webkit-inner-spin-button {
//             -webkit-appearance: none;
//             margin: 0;
//           }
//           input[type="number"] {
//             -moz-appearance: textfield;
//           }
//         `}</style>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto hide-scrollbar">
//           <Elements stripe={stripePromise}>
//             <PaymentForm
//               plan={plan}
//               onClose={handleCloseModal}
//               formData={formData}
//               setFormData={setFormData}
//               showNotification={showNotification}
//             />
//           </Elements>
//         </div>
//       </div>
//     </div>
//   );
// }




import React, { useState, useEffect } from "react";
import { Check, X, Lock, CheckCircle } from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import api from "../services/api";
import { useNotification } from '../components/NotificationPopup';

const stripePromise = loadStripe("pk_test_51Rwee1HLu4gv9DOKE5NyYIn7nOdmDWmeo0AW3Y0j8u4W17AdU6pt1tgSaEg2HnuNohZuuZ9nwasjT0OaiTovSwqH00CCl4WOFm");

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1f2937',
      '::placeholder': {
        color: '#9ca3af',
      },
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

// Success Animation Component
function SuccessScreen({ plan, amount, credits }) {
  return (
    <div className="flex items-center justify-center min-h-[500px] p-8">
      <div className="text-center">
        {/* Animated Check Circle */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute w-32 h-32 bg-green-100 rounded-full animate-ping opacity-75"></div>
          <div className="relative w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
            <CheckCircle className="w-16 h-16 text-white animate-bounce" strokeWidth={2.5} />
          </div>
        </div>

        {/* Success Message */}
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          Payment Successful! 🎉
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Your payment has been processed successfully
        </p>

        {/* Payment Details */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 max-w-md mx-auto border-2 border-green-200">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Plan:</span>
              <span className="font-bold text-gray-900">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Amount Paid:</span>
              <span className="font-bold text-green-600 text-xl">${amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Credits Added:</span>
              <span className="font-bold text-purple-600 text-xl">{credits}</span>
            </div>
          </div>
        </div>

        {/* Redirect Message */}
        <p className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          Redirecting to dashboard...
        </p>
      </div>
    </div>
  );
}

// Inner form component that uses Stripe hooks
function PaymentForm({ plan, onClose, formData, setFormData }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [cardErrors, setCardErrors] = useState({});
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const { showNotification } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCardElementChange = (elementType) => (event) => {
    if (event.error) {
      setCardErrors((prev) => ({
        ...prev,
        [elementType]: event.error.message,
      }));
    } else {
      setCardErrors((prev) => ({
        ...prev,
        [elementType]: "",
      }));
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    }
    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }
    if (!formData.zip.trim()) {
      newErrors.zip = "ZIP / Postal code is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showNotification('warning', 'Please fill in all required fields');
      return;
    }

    if (!stripe || !elements) {
      showNotification('error', 'Stripe has not loaded yet. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Create payment intent
      const intentResponse = await api.post("/billing/create-payment-intent", {
        packageId: plan.id,
        quantity: formData.quantity,
        country: formData.country,
        zip: formData.zip,
      });

      const { clientSecret } = intentResponse.data;

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: formData.name,
            email: formData.email,
            address: {
              country: formData.country,
              postal_code: formData.zip,
            },
          },
        },
      });

      if (error) {
        showNotification('error', error.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // Confirm payment on backend
        const confirmResponse = await api.post("/billing/confirm-payment", {
          paymentIntentId: paymentIntent.id,
          packageId: plan.id,
          quantity: formData.quantity,
          country: formData.country,
          zip: formData.zip,
        });

        // Set success data
        setSuccessData({
          amount: (plan.price * formData.quantity).toFixed(2),
          credits: confirmResponse.data.transaction.creditsAdded,
        });

        // Show success state
        setPaymentSuccess(true);
        setLoading(false);

        showNotification(
          'success',
          `Payment of $${(plan.price * formData.quantity).toFixed(2)} processed successfully! ${confirmResponse.data.transaction.creditsAdded} credits added to your account.`
        );
      
        // Redirect to dashboard after 5 seconds
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 5000);
      }
    } catch (error) {
      showNotification(
        'error',
        error.response?.data?.error || 'Payment failed. Please try again.'
      );
      setLoading(false);
    }
  };

  // Show success screen if payment succeeded
  if (paymentSuccess && successData) {
    return (
      <SuccessScreen 
        plan={plan}
        amount={successData.amount}
        credits={successData.credits}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row flex-1">
      {/* Left Side - Form */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          Billing Details
        </h2>

        <div className="space-y-4">
          {[
            { label: "Full Name", name: "name", placeholder: "John Doe", disabled: true },
            {
              label: "Email Address",
              name: "email",
              placeholder: "john@example.com",
              type: "email",
              disabled: true,
            },
            {
              label: "Country",
              name: "country",
              placeholder: "United States",
            },
            {
              label: "ZIP / Postal Code",
              name: "zip",
              placeholder: "12345",
            },
          ].map((field, i) => (
            <div key={i}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type={field.type || "text"}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                disabled={field.disabled}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${
                  field.disabled 
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300" 
                    : errors[field.name]
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              />
              {errors[field.name] && (
                <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
              )}
            </div>
          ))}

          {/* Card Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Card Number
            </label>
            <div className={`w-full px-4 py-2 border rounded-lg ${
              cardErrors.cardNumber ? "border-red-500" : "border-gray-300"
            }`}>
              <CardNumberElement 
                options={CARD_ELEMENT_OPTIONS}
                onChange={handleCardElementChange('cardNumber')}
              />
            </div>
            {cardErrors.cardNumber && (
              <p className="text-red-500 text-xs mt-1">{cardErrors.cardNumber}</p>
            )}
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Expiry Date
              </label>
              <div className={`w-full px-4 py-2 border rounded-lg ${
                cardErrors.expiry ? "border-red-500" : "border-gray-300"
              }`}>
                <CardExpiryElement 
                  options={CARD_ELEMENT_OPTIONS}
                  onChange={handleCardElementChange('expiry')}
                />
              </div>
              {cardErrors.expiry && (
                <p className="text-red-500 text-xs mt-1">{cardErrors.expiry}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                CVC
              </label>
              <div className={`w-full px-4 py-2 border rounded-lg ${
                cardErrors.cvc ? "border-red-500" : "border-gray-300"
              }`}>
                <CardCvcElement 
                  options={CARD_ELEMENT_OPTIONS}
                  onChange={handleCardElementChange('cvc')}
                />
              </div>
              {cardErrors.cvc && (
                <p className="text-red-500 text-xs mt-1">{cardErrors.cvc}</p>
              )}
            </div>
          </div>

          {/* Quantity for Starter */}
          {plan.id === "starter" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: Math.max(1, prev.quantity - 1),
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  −
                </button>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  min="1"
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: prev.quantity + 1,
                    }))
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Summary */}
      <div className="w-full lg:w-96 bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 lg:p-8 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200">
        <h3 className="font-bold text-gray-900 mb-6 sm:mb-8 text-base sm:text-lg">
          Order Summary
        </h3>

        {/* Plan Info */}
        <div className="mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-purple-200">
          <div
            className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg mb-3 sm:mb-4"
            style={{ backgroundColor: "#5A33FF" }}
          >
            <plan.icon
              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
              strokeWidth={2.5}
            />
          </div>
          <h4 className="font-bold text-gray-900 mb-1 text-base sm:text-lg">
            {plan.name}
          </h4>
          <p className="text-xs sm:text-sm text-gray-600">
            {plan.description}
          </p>
        </div>

        {/* Price Summary */}
        <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-purple-200">
          <div className="flex justify-between text-sm sm:text-base">
            <span className="text-gray-700">{plan.name}</span>
            <span className="font-semibold text-gray-900">
              ${plan.price.toFixed(2)}
            </span>
          </div>
          {plan.id === "starter" && (
            <div className="flex justify-between text-sm sm:text-base">
              <span className="text-gray-700">Quantity</span>
              <span className="font-semibold text-gray-900">
                x{formData.quantity}
              </span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900 text-sm sm:text-base">
              Total
            </span>
            <span
              className="text-2xl sm:text-3xl font-bold"
              style={{ color: "#5A33FF" }}
            >
              ${(plan.price * formData.quantity).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6 sm:mb-8 flex-1">
          <p className="text-xs font-semibold text-gray-600 mb-2 sm:mb-3 uppercase">
            Includes
          </p>
          <div className="space-y-1.5 sm:space-y-2">
            {plan.features.slice(0, 4).map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <Check
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5"
                  style={{ color: "#5A33FF" }}
                  strokeWidth={3}
                />
                <span className="text-xs sm:text-sm text-gray-700">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mb-2 sm:mb-3 text-sm sm:text-base"
        >
          {loading
            ? "Processing..."
            : `Pay $${(plan.price * formData.quantity).toFixed(2)}`}
        </button>

        <p className="text-xs text-gray-600 text-center mb-2 sm:mb-3 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" />
          Your payment information is secure and encrypted.
        </p>
      </div>
    </div>
  );
}

// Main Modal Component
export default function PaymentModal({ isOpen, onClose, plan }) {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "",
    zip: "",
    quantity: 1,
  });

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get("/users/profile");
        const userData = response.data;

        setFormData((prev) => ({
          ...prev,
          name: userData.name || "",
          email: userData.email || "",
        }));
      } catch (error) {
        showNotification('error', 'Failed to fetch user profile');
      }
    };

    if (isOpen) {
      fetchUserProfile();
    }
  }, [isOpen, showNotification]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleCloseModal = () => {
    setFormData((prev) => ({
      ...prev,
      country: "",
      zip: "",
      quantity: 1,
    }));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-[95vw] sm:w-[90vw] max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative flex flex-col lg:flex-row">
        {/* Close Button */}
        <button
          onClick={handleCloseModal}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-gray-100 rounded-lg transition z-10 bg-white lg:bg-transparent"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Hide Scrollbar */}
        <style>{`
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          input[type="number"] {
            -moz-appearance: textfield;
          }
          @keyframes ping {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          @keyframes bounce {
            0%, 100% {
              transform: translateY(-25%);
              animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
            }
            50% {
              transform: translateY(0);
              animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
            }
          }
          .animate-ping {
            animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          .animate-bounce {
            animation: bounce 1s infinite;
          }
        `}</style>

        {/* Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <Elements stripe={stripePromise}>
            <PaymentForm
              plan={plan}
              onClose={handleCloseModal}
              formData={formData}
              setFormData={setFormData}
              showNotification={showNotification}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}