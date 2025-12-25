//src/components/difference.js
import { useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";

export default function SeeTheDifference() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.diff-animate').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
        {/* Heading */}
        <div className="text-center diff-animate opacity-0 translate-y-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            See the{" "}
            <span style={{ color: "#5A33FF" }} className="gradient-text">Difference</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-600">
            Watch your code transform from problematic patterns to clean,
            maintainable solutions.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Before */}
          <div className="relative rounded-3xl border border-red-200 bg-red-50/20 shadow-[0_18px_40px_rgba(0,0,0,0.10)] overflow-visible code-card-before diff-animate opacity-0 -translate-x-10 hover:shadow-2xl transition-all duration-500">
            {/* badge */}
            <div className="absolute left-7 top-0 -translate-y-1/2 z-10">
              <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-4 py-1 text-sm font-semibold text-red-700 shadow-sm">
                Before
              </span>
            </div>

            <div className="px-8 py-8 sm:px-10 sm:py-10">
              <div className="font-mono text-sm sm:text-base leading-7 text-gray-800">
                <div className="code-line">
                  <span className="text-[#6366f1]">function</span>{" "}
                  <span className="text-gray-800">getUserData</span>(id) {"{"}
                </div>

                <div className="mt-3 flex items-center gap-3 pl-6 text-gray-500 code-line">
                  <Circle className="h-4 w-4 fill-red-400 text-red-400 pulse-dot" />
                  <span>// Long method smell</span>
                </div>

                <div className="mt-2 pl-6 code-line">
                  <span className="text-[#6366f1]">let</span>{" "}
                  <span className="text-gray-800">result</span>{" "}
                  <span className="text-gray-500">=</span>{" "}
                  <span className="text-gray-500">null</span>;
                </div>
                <div className="pl-6 code-line">
                  <span className="text-[#6366f1]">let</span>{" "}
                  <span className="text-gray-800">user</span>{" "}
                  <span className="text-gray-500">=</span>{" "}
                  <span className="text-gray-800">db</span>.
                  <span className="text-gray-800">query</span>(
                  <span className="text-[#10b981]">"SELECT * FROM users"</span>);
                </div>
                <div className="pl-6 code-line">
                  <span className="text-[#6366f1]">for</span> (
                  <span className="text-[#6366f1]">let</span>{" "}
                  <span className="text-gray-800">i</span>{" "}
                  <span className="text-gray-500">=</span>{" "}
                  <span className="text-[#f59e0b]">0</span>; i{" "}
                  <span className="text-gray-500">&lt;</span>{" "}
                  <span className="text-gray-800">user</span>.length; i
                  <span className="text-gray-500">++</span>) {"{"}
                </div>
                <div className="pl-12 code-line">
                  <span className="text-[#6366f1]">if</span>{" "}
                  (<span className="text-gray-800">user</span>[i].id{" "}
                  <span className="text-[#f59e0b]">===</span>{" "}
                  <span className="text-gray-800">id</span>) {"{"}
                </div>
                <div className="pl-16 code-line">
                  <span className="text-gray-800">result</span>{" "}
                  <span className="text-gray-500">=</span>{" "}
                  <span className="text-gray-800">user</span>[i];
                </div>
                <div className="pl-16 code-line">
                  <span className="text-[#6366f1]">break</span>;
                </div>
                <div className="pl-12 code-line">{"}"}</div>
                <div className="pl-6 code-line">{"}"}</div>

                <div className="mt-2 pl-6 code-line">
                  <span className="text-[#6366f1]">return</span>{" "}
                  <span className="text-gray-800">result</span>;
                </div>
                <div className="code-line">{"}"}</div>
              </div>
            </div>
          </div>

          {/* After */}
          <div className="relative rounded-3xl border border-green-200 bg-green-50/20 shadow-[0_18px_40px_rgba(0,0,0,0.10)] overflow-visible code-card-after diff-animate opacity-0 translate-x-10 hover:shadow-2xl transition-all duration-500">
            {/* badge */}
            <div className="absolute left-7 top-0 -translate-y-1/2 z-10">
              <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-4 py-1 text-sm font-semibold text-green-700 shadow-sm">
                After Smellify
              </span>
            </div>

            <div className="px-8 py-8 sm:px-10 sm:py-10">
              <div className="font-mono text-sm sm:text-base leading-7 text-gray-800">
                <div className="code-line">
                  <span className="text-[#6366f1]">function</span>{" "}
                  <span className="text-gray-800">getUserById</span>(id:{" "}
                  <span className="text-gray-800">string</span>): User {"{"}
                </div>

                <div className="mt-3 flex items-center gap-3 pl-6 text-gray-500 code-line">
                  <CheckCircle2 className="h-4 w-4 text-green-500 check-icon" />
                  <span>// Clean &amp; efficient</span>
                </div>

                <div className="mt-2 pl-6 code-line">
                  <span className="text-[#6366f1]">return</span>{" "}
                  <span className="text-gray-800">db</span>.users.
                  <span className="text-[#a855f7]">findUnique</span>({"{"}
                </div>
                <div className="pl-12 code-line">
                  where: {"{"} id {"}"}
                </div>
                <div className="pl-6 code-line">{"}"});</div>

                <div className="code-line">{"}"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typingEffect {
          from {
            opacity: 0;
            transform: translateX(-5px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes pulseDot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }

        @keyframes checkPop {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        .gradient-text {
          background: linear-gradient(135deg, #5A33FF 0%, #7C5CFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .diff-animate {
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .diff-animate.animate-in {
          opacity: 1 !important;
          transform: translateX(0) translateY(0) !important;
        }

        .code-card-before.animate-in .code-line,
        .code-card-after.animate-in .code-line {
          animation: typingEffect 0.3s ease-out forwards;
          opacity: 0;
        }

        .code-card-before.animate-in .code-line:nth-child(1) { animation-delay: 0.1s; }
        .code-card-before.animate-in .code-line:nth-child(2) { animation-delay: 0.15s; }
        .code-card-before.animate-in .code-line:nth-child(3) { animation-delay: 0.2s; }
        .code-card-before.animate-in .code-line:nth-child(4) { animation-delay: 0.25s; }
        .code-card-before.animate-in .code-line:nth-child(5) { animation-delay: 0.3s; }
        .code-card-before.animate-in .code-line:nth-child(6) { animation-delay: 0.35s; }
        .code-card-before.animate-in .code-line:nth-child(7) { animation-delay: 0.4s; }
        .code-card-before.animate-in .code-line:nth-child(8) { animation-delay: 0.45s; }
        .code-card-before.animate-in .code-line:nth-child(9) { animation-delay: 0.5s; }
        .code-card-before.animate-in .code-line:nth-child(10) { animation-delay: 0.55s; }
        .code-card-before.animate-in .code-line:nth-child(11) { animation-delay: 0.6s; }
        .code-card-before.animate-in .code-line:nth-child(12) { animation-delay: 0.65s; }

        .code-card-after.animate-in .code-line:nth-child(1) { animation-delay: 0.2s; }
        .code-card-after.animate-in .code-line:nth-child(2) { animation-delay: 0.25s; }
        .code-card-after.animate-in .code-line:nth-child(3) { animation-delay: 0.3s; }
        .code-card-after.animate-in .code-line:nth-child(4) { animation-delay: 0.35s; }
        .code-card-after.animate-in .code-line:nth-child(5) { animation-delay: 0.4s; }
        .code-card-after.animate-in .code-line:nth-child(6) { animation-delay: 0.45s; }

        .pulse-dot {
          animation: pulseDot 2s ease-in-out infinite;
        }

        .check-icon {
          animation: checkPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards;
          transform: scale(0);
        }
      `}</style>
    </section>
  );
}