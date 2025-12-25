//src/components/faqs.js
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      q: "What is Smellify?",
      a: "Smellify is an AI-powered static code analysis tool that detects code smells, patterns in your code that may indicate deeper problems. It analyzes your code for issues like duplication, long methods, improper React hooks usage, and Express middleware problems, then provides actionable suggestions to improve code quality.",
    },
    {
      q: "Which programming languages are supported?",
      a: "Smellify currently supports JavaScript, TypeScript, Python, and popular frameworks like React, Vue, Angular, Node.js, and Express. We are continuously expanding our language support based on community feedback.",
    },
    {
      q: "Is my code stored or shared?",
      a: "No. Your code is analyzed in real-time and is never stored on our servers. We prioritize your privacy and security, all analysis happens during your session and nothing is retained after you leave.",
    },
    {
      q: "How accurate is the code smell detection?",
      a: "Our AI-powered analysis has been trained on millions of code patterns and achieves high accuracy in detecting common code smells. However, we recommend using Smellify as a helpful guide alongside your own code review practices.",
    },
    {
      q: "Is Smellify free to use?",
      a: "Yes. Smellify is completely free to use. Simply paste your code or upload files and get instant analysis with suggestions for improvement. No signup or credit card required.",
    },
    {
      q: "Can I integrate Smellify into my CI/CD pipeline?",
      a: "We are working on API access and CLI tools for CI/CD integration. Join our waitlist to be notified when these features become available. For now, you can use our web interface for manual code analysis.",
    },
  ];

  const [openIndex, setOpenIndex] = useState(-1); // Changed from 0 to -1 so first FAQ is closed

  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Frequently Asked{" "}
            <span style={{ color: "#5A33FF" }}>Questions</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-600">
            Everything you need to know about Smellify and how it can help
            improve your code.
          </p>
        </div>

        {/* FAQ list */}
        <div className="mt-12 sm:mt-14 mx-auto max-w-3xl space-y-4">
          {faqs.map((item, idx) => {
            const isOpen = idx === openIndex;

            return (
              <div
                key={item.q}
                className="rounded-2xl bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden animate-fade-in-up"
                style={{ 
                  animationDelay: `${idx * 100}ms`,
                  opacity: 0,
                  animationFillMode: 'forwards'
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex((prev) => (prev === idx ? -1 : idx))}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-4.5 text-left hover:bg-gray-50 transition-colors duration-200"
                >
                  <span className="text-sm sm:text-base font-semibold text-gray-900">
                    {item.q}
                  </span>

                  <ChevronDown 
                    className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-all duration-300 ease-out ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>

                {/* Animated answer */}
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-5 sm:px-6 pb-4 sm:pb-4.5 pt-0">
                    <p className="text-sm sm:text-base leading-relaxed text-gray-600">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </section>
  );
}