//src/components/featured.js
import { useEffect } from "react";
import {
  Copy,
  Ruler,
  Activity,
  Crown,
  Skull,
  Zap,
  Code2,
  Bug,
  Users,
} from "lucide-react";

export default function CommonIssuesAndStats() {
  const pills = [
    { label: "Code Duplication", icon: Copy },
    { label: "Long Methods", icon: Ruler },
    { label: "React Hooks Issues", icon: Activity, iconClass: "text-purple-600" },
    { label: "Express Middleware", icon: Bug },
    { label: "Prop Drilling", icon: Crown },
  ];

  const stats = [
    { value: "50K+", label: "Lines Analyzed", icon: Code2, iconClass: "text-blue-600" },
    { value: "12K+", label: "Smells Detected", icon: Bug, iconClass: "text-amber-600" },
    { value: "<5s", label: "Avg Analysis Time", icon: Zap, iconClass: "text-green-600" },
    { value: "1.5K+", label: "Happy Developers", icon: Users, iconClass: "text-purple-600" },
  ];

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

    document.querySelectorAll('.scroll-fade').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:py-20">
        {/* Top label */}
        <div className="text-center scroll-fade opacity-0 translate-y-10">
          <p className="text-xs sm:text-sm font-bold tracking-[0.18em] text-gray-500 uppercase">
            Detects common issues
          </p>
        </div>

        {/* Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          {pills.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={p.label}
                className="flex items-center gap-3 rounded-full bg-white px-6 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.08)] border border-gray-100 pill-item opacity-0 transform scale-95 hover:scale-105 hover:shadow-xl transition-all duration-300"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 border border-gray-100">
                  <Icon className={`h-4.5 w-4.5 ${p.iconClass || "text-gray-600"}`} />
                </span>
                <span className="text-sm sm:text-base font-medium text-gray-900">
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mt-12 scroll-fade opacity-0">
          <div className="border-t border-gray-200/70 divider-line" />
        </div>

        {/* Stats */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-3xl bg-white border border-gray-100 shadow-[0_16px_34px_rgba(0,0,0,0.10)] px-10 py-10 text-center stat-card opacity-0 transform translate-y-10 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center icon-container">
                  <Icon className={`h-10 w-10 ${s.iconClass}`} />
                </div>

                <div className="text-4xl font-semibold tracking-tight text-gray-900 stat-value">
                  {s.value}
                </div>
                <div className="mt-2 text-base text-gray-500">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
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

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            width: 0;
          }
          to {
            opacity: 1;
            width: 100%;
          }
        }

        @keyframes bounceIcon {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes countUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pill-item {
          animation: scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .scroll-fade {
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .scroll-fade.animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .divider-line {
          animation: slideIn 1s ease-out forwards;
        }

        .stat-card {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .scroll-fade.animate-in .stat-card {
          opacity: 1;
          transform: translateY(0);
        }

        .icon-container {
          animation: bounceIcon 2s ease-in-out infinite;
        }

        .stat-value {
          animation: countUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </section>
  );
}