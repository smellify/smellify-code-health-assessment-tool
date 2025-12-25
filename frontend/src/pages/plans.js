//pages/plans.js
import React, { useState } from "react";
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  X,
  CreditCard,
  Code,
  TrendingUp,
  Lock,
} from "lucide-react";
import PaymentModal from "../components/Paymentmodal";

export default function PlansPage() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [hoveredPlan, setHoveredPlan] = useState(null);

  const plans = [
    {
      id: "starter",
      name: "Starter Pack",
      price: 0.99,
      icon: Zap,
      color: "from-yellow-400 to-yellow-500",
      bgColor: "bg-yellow-400",
      description: "Perfect for getting started with code analysis",
      features: [
        "10 Analysis Credits",
        "Cloud-based Analysis",
        "Standard Reports (PDF)",
        "Email Support",
        "Credits Never Expire",
      ],
    },
    {
      id: "premium",
      name: "Premium Pack",
      price: 99,
      icon: Crown,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-white",
      description: "Complete source code access",
      features: [
        "Complete Source Code Access",
        "5000 Analysis Credits",
        "Credits Never Expire",
        "Self-Host Anywhere",
        "Lifetime Updates",
        "Email Support",
        "Standard Reports (PDF)",
      ],
      popular: true,
    },
  ];

  const handlePlanClick = (plan) => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-8 pt-20 pb-16 text-center">
        <div className="inline-block mb-4">
          <span
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: "#E8E0FF", color: "#5A33FF" }}
          >
            Simple, Transparent Pricing
          </span>
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Choose Your Perfect Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Whether you're just starting out or ready to level up your development
          game, we've got the perfect solution for you.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className={`rounded-3xl p-10 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 relative overflow-hidden transform hover:-translate-y-2 ${
                plan.popular ? "lg:scale-105" : ""
              }`}
              style={{
                backgroundColor:
                  plan.popular && hoveredPlan === plan.id
                    ? "#4B21CC"
                    : plan.popular
                    ? "#5A33FF"
                    : "white",
                borderColor: plan.popular ? "#7C5AFF" : "#E5E7EB",
              }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-6 right-6">
                  <div
                    className="bg-yellow-400 px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-1"
                    style={{ color: "#5A33FF" }}
                  >
                    <Sparkles className="w-4 h-4" />
                    BEST VALUE
                  </div>
                </div>
              )}

              {/* Decorative Elements */}
              {plan.popular ? (
                <>
                  <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full opacity-10 -ml-20 -mt-20" />
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full opacity-10 -mr-16 -mb-16" />
                </>
              ) : (
                <>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-full opacity-20 -mr-16 -mt-16" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200 to-blue-300 rounded-full opacity-20 -ml-12 -mb-12" />
                </>
              )}

              <div className="relative z-10">
                {/* Icon */}
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 shadow-lg ${
                    plan.popular
                      ? "bg-white"
                      : `bg-gradient-to-br ${plan.color}`
                  }`}
                >
                  <plan.icon
                    className="w-8 h-8"
                    style={{ color: plan.popular ? "#5A33FF" : "white" }}
                    strokeWidth={2.5}
                  />
                </div>

                {/* Plan Name */}
                <h3
                  className={`text-3xl font-bold mb-2 ${
                    plan.popular ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mb-6 ${
                    plan.popular ? "text-purple-100" : "text-gray-600"
                  }`}
                >
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-5xl font-bold ${
                        plan.popular ? "text-white" : "text-gray-900"
                      }`}
                    >
                      ${plan.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-lg ${
                        plan.popular ? "text-purple-100" : "text-gray-500"
                      }`}
                    >
                      one-time
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                          plan.popular ? "bg-yellow-400" : "bg-green-100"
                        }`}
                      >
                        <Check
                          className="w-4 h-4"
                          style={{
                            color: plan.popular ? "#5A33FF" : "#16A34A",
                          }}
                          strokeWidth={3}
                        />
                      </div>
                      <span
                        className={`font-medium ${
                          plan.popular ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanClick(plan)}
                  className={`w-full py-4 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    plan.popular
                      ? "bg-white hover:bg-gray-50"
                      : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600"
                  }`}
                  style={plan.popular ? { color: "#5A33FF" } : {}}
                >
                  {plan.popular ? "Get Premium" : "Get Starter"}
                </button>

                {plan.popular && (
                  <p className="text-center text-sm mt-4 text-purple-100 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> 30-day money-back guarantee
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      {/* Comparison Table */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16 sm:pb-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
          Compare Plans
        </h2>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className="text-white"
                  style={{
                    background: "linear-gradient(to right, #5A33FF, #7C3AED)",
                  }}
                >
                  <th className="text-left py-5 sm:py-6 px-4 sm:px-6 text-white font-bold text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
                      Feature
                    </div>
                  </th>
                  <th className="text-center py-5 sm:py-6 px-4 sm:px-6 text-white font-bold text-sm sm:text-base">
                    Starter Pack
                  </th>
                  <th className="text-center py-5 sm:py-6 px-4 sm:px-6 text-white font-bold text-sm sm:text-base">
                    Premium Pack
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-purple-50 transition-all duration-200">
                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-gray-700 font-medium text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      Analysis Credits
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-center">
                    <span className="inline-block px-2.5 sm:px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-semibold text-xs sm:text-sm">
                      10 Credits
                    </span>
                  </td>
                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-center">
                    <span className="inline-block px-2.5 sm:px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold text-xs sm:text-sm">
                      5000 Credits
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-purple-50 transition-all duration-200">
                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-gray-700 font-medium text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      Source Code Access
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-center text-gray-400 font-semibold">
                    —
                  </td>
                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-center">
                    <div className="flex justify-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Check
                          className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                          strokeWidth={3}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-purple-50 transition-all duration-200">
                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-gray-700 font-medium text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      Credits Expiry
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-center">
                    <span className="inline-block px-2.5 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-xs sm:text-sm">
                      Never Expires
                    </span>
                  </td>
                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-center">
                    <span className="inline-block px-2.5 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-xs sm:text-sm">
                      Never Expires
                    </span>
                  </td>
                </tr>
                {/* <tr className="hover:bg-purple-50 transition-all duration-200">
                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-gray-700 font-medium text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      Self-Hosting
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-center text-gray-400 font-semibold">
                    —
                  </td>
                  <td className="py-4 sm:py-5 px-4 sm:px-6 text-center">
                    <div className="flex justify-center">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Check
                          className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                          strokeWidth={3}
                        />
                      </div>
                    </div>
                  </td>
                </tr> */}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      {/* FAQ Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 text-center mb-16 text-lg">
            Everything you need to know about CV Analyzer
          </p>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    What happens after I use my 10 credits?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    You can purchase more credits or upgrade to the Premium Pack
                    for unlimited analyses.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Can I upgrade from Starter to Premium later?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Absolutely! You can upgrade at any time, and we'll credit
                    your initial purchase toward the Premium Pack.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    What do I get with the source code?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    You get the complete codebase to self-host, customize, and
                    modify as needed. Perfect for teams wanting full control.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div
        className="py-20"
        style={{ background: "linear-gradient(to right, #5A33FF, #7C5AFF)" }}
      >
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Still Have Questions?
          </h2>
          <p
            className="text-xl mb-8 leading-relaxed"
            style={{ color: "#E8E0FF" }}
          >
            Our team is here to help you choose the perfect plan for your needs.
          </p>
          <button
            className="bg-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
            style={{ color: "#5A33FF" }}
          >
            Contact Sales
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handleCloseModal}
          plan={selectedPlan}
        />
      )}
    </div>
  );
}
