//src/pages/home.js
import { Video, TrendingUp, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import FAQs from '../components/faqs';
import CommonIssuesAndStats from '../components/featured';
import SeeTheDifference from '../components/difference';

export default function BugTrackingHero() {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Intersection Observer for scroll animations
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

    // Observe all elements with scroll-animation class
    document.querySelectorAll('.scroll-animate').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white overflow-hidden">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-8 pt-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left Content */}
          <div className="space-y-8 hero-content">
            <h1 className="text-6xl font-bold leading-tight text-gray-900 hero-title">
              We help MERN devs{' '}
              <span style={{ color: '#5A33FF' }} className="gradient-text">
                detect code smells faster
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-xl hero-description">
              Track, manage, and squash MERN stack code smells with ease so your code stays rock solid and your users stay happy.
            </p>
            
            <div className="flex gap-4 items-center pt-4 hero-buttons">
              <button 
                onClick={() => handleNavigation('/register')}
                style={{ backgroundColor: '#5A33FF' }}
                className="px-8 py-4 text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-105"
              >
                Get Started
              </button>
              
              <button className="px-6 py-4 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 border border-gray-200 hover:border-gray-300 hover:shadow-md">
                <Video size={20} />
                Watch Video
              </button>
            </div>
          </div>
          
          {/* Right Illustration */}
          <div className="relative h-[500px] flex items-center justify-center hero-illustration">
            {/* Floating Decorative Elements */}
            <div 
              style={{ backgroundColor: '#5A33FF' }}
              className="absolute top-12 right-20 w-16 h-16 rounded-full opacity-80 animate-pulse-slow float-1"
            />
            <div className="absolute top-4 right-4 w-8 h-8 bg-yellow-400 rounded-full animate-bounce-slow float-2" />
            <div className="absolute top-32 left-8 w-6 h-6 bg-yellow-300 rounded-full float-3" />
            <div className="absolute bottom-32 left-4 w-5 h-5 border-2 border-gray-300 rounded-full float-4" />
            <div className="absolute bottom-20 right-32 w-10 h-10 border-2 border-gray-200 rounded-full float-5" />
            <div 
              style={{ borderColor: '#5A33FF' }}
              className="absolute bottom-48 right-4 w-8 h-8 border-3 rounded-full float-6"
            />
            
            {/* Main Laptop Mockup */}
            <div className="relative z-10 transform hover:scale-105 transition-transform duration-500 laptop-mockup">
              {/* Screen */}
              <div className="bg-white rounded-t-xl shadow-2xl p-3 w-[380px] h-64 border-8 border-gray-800">
                {/* Browser Chrome */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                  </div>
                </div>
                
                {/* Content Area */}
                <div className="space-y-4 px-2">
                  {/* Color Dots Row 1 */}
                  <div className="flex gap-2 items-center code-dots-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5A33FF' }} />
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-pink-400 rounded-full" />
                    <div className="w-3 h-3 bg-blue-400 rounded-full" />
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                  </div>
                  
                  {/* Content Lines */}
                  <div className="space-y-2.5 pt-2">
                    <div className="h-2 bg-gray-200 rounded-full w-5/6 code-line-1" />
                    <div className="h-2 bg-gray-200 rounded-full w-3/4 code-line-2" />
                    <div className="h-2 bg-gray-200 rounded-full w-4/5 code-line-3" />
                  </div>
                  
                  {/* Color Dots Row 2 */}
                  <div className="flex gap-2 justify-end pt-4 code-dots-2">
                    <div className="w-3 h-3 bg-blue-400 rounded-full" />
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                    <div className="w-3 h-3 bg-purple-400 rounded-full" />
                  </div>
                </div>
              </div>
              
              {/* Laptop Base */}
              <div className="h-4 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-xl shadow-lg" />
              <div className="h-2.5 bg-gradient-to-b from-gray-600 via-gray-700 to-gray-800 mx-auto" 
                   style={{ width: '450px', borderRadius: '0 0 8px 8px' }} 
              />
            </div>
            
            {/* Trending Badge */}
            <div 
              className="absolute bottom-8 right-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-5 shadow-2xl z-20 transform hover:scale-110 transition-transform trending-badge"
              style={{ width: '90px', height: '90px' }}
            >
              <TrendingUp className="text-white w-full h-full" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
      
      <CommonIssuesAndStats />
      <SeeTheDifference />
      
      {/* Key Features Section */}
      <div className="py-20 bg-gradient-to-b from-white to-gray-50 scroll-animate opacity-0">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-5xl font-bold text-center text-gray-900 mb-4">
            Key Features
          </h2>
          <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            Powerful tools to help you write cleaner, more maintainable code
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Bug Tracking */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 feature-card transform hover:-translate-y-2"
                 style={{ animationDelay: '0ms' }}>
              <div className="mb-6 transform transition-transform duration-300 hover:scale-110">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <svg 
                    style={{ color: '#5A33FF' }}
                    className="w-8 h-8" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Code Smells Detection
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Efficiently detect code smells with our advanced AI-powered analysis engine.
              </p>
            </div>

            {/* Real-time Alerts */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 feature-card transform hover:-translate-y-2"
                 style={{ animationDelay: '150ms' }}>
              <div className="mb-6 transform transition-transform duration-300 hover:scale-110">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <svg 
                    style={{ color: '#5A33FF' }}
                    className="w-8 h-8" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Real-time Alerts
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Stay updated with instant dashboard notifications on smells status.
              </p>
            </div>

            {/* Comprehensive Reports */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 feature-card transform hover:-translate-y-2"
                 style={{ animationDelay: '300ms' }}>
              <div className="mb-6 transform transition-transform duration-300 hover:scale-110">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
                  <svg 
                    style={{ color: '#5A33FF' }}
                    className="w-8 h-8" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Comprehensive Reports
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Generate detailed code smells reports for better analysis and insights.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-white scroll-animate opacity-0">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-5xl font-bold text-center text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 text-center mb-20 max-w-2xl mx-auto">
            Get started in three simple steps
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-10 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent" 
                 style={{ top: '40px' }} />
            
            {/* Step 1 */}
            <div className="text-center step-card relative" style={{ animationDelay: '0ms' }}>
              <div 
                style={{ backgroundColor: '#5A33FF' }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-110 transition-all duration-300 relative z-10"
              >
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Upload
              </h3>
              <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                Upload your MERN stack project quickly and securely
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center step-card relative" style={{ animationDelay: '150ms' }}>
              <div 
                style={{ backgroundColor: '#5A33FF' }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-110 transition-all duration-300 relative z-10"
              >
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Analysis
              </h3>
              <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                A detailed static analysis is done to detect code smells
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center step-card relative" style={{ animationDelay: '300ms' }}>
              <div 
                style={{ backgroundColor: '#5A33FF' }}
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-110 transition-all duration-300 relative z-10"
              >
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Reports
              </h3>
              <p className="text-gray-600 leading-relaxed max-w-sm mx-auto">
                Comprehensive reports with steps to fix are shown to you
              </p>
            </div>
          </div>
        </div>
      </div>

      <FAQs />
      
      {/* CTA Section */}
      <div 
        style={{ backgroundColor: '#5A33FF' }}
        className="py-24 scroll-animate opacity-0 relative overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
          <h2 className="text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-10 leading-relaxed">
            Experience seamless code smell tracking and management with our platform.
          </p>
          <button 
            onClick={() => handleNavigation('/register')}
            className="bg-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
            style={{ color: '#5A33FF' }}
          >
            Sign Up Now
          </button>
        </div>
      </div>

      <style jsx>{`
        /* Hero Animations */
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

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

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

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .hero-title {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .hero-description {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
          opacity: 0;
        }

        .hero-buttons {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards;
          opacity: 0;
        }

        .hero-illustration {
          animation: fadeIn 1s ease-out 0.3s forwards;
          opacity: 0;
        }

        .laptop-mockup {
          animation: scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards;
          opacity: 0;
        }

        .trending-badge {
          animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1.2s forwards;
          opacity: 0;
        }

        .float-1 { animation: float 6s ease-in-out infinite; }
        .float-2 { animation: float 5s ease-in-out infinite 0.5s; }
        .float-3 { animation: float 7s ease-in-out infinite 1s; }
        .float-4 { animation: float 6.5s ease-in-out infinite 1.5s; }
        .float-5 { animation: float 5.5s ease-in-out infinite 2s; }
        .float-6 { animation: float 6s ease-in-out infinite 2.5s; }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }

        .code-dots-1 { animation: fadeIn 0.5s ease-out 0.8s forwards; opacity: 0; }
        .code-dots-2 { animation: fadeIn 0.5s ease-out 1.2s forwards; opacity: 0; }
        .code-line-1 { animation: slideInLeft 0.6s ease-out 0.9s forwards; opacity: 0; }
        .code-line-2 { animation: slideInLeft 0.6s ease-out 1s forwards; opacity: 0; }
        .code-line-3 { animation: slideInLeft 0.6s ease-out 1.1s forwards; opacity: 0; }

        .gradient-text {
          background: linear-gradient(135deg, #5A33FF 0%, #7C5CFF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Scroll Animations */
        .scroll-animate {
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .scroll-animate.animate-in {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }

        .scroll-animate {
          transform: translateY(50px);
        }

        /* Feature Cards */
        .feature-card {
          opacity: 0;
          transform: translateY(30px);
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Step Cards */
        .step-card {
          opacity: 0;
          transform: scale(0.9);
          animation: scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .scroll-animate.animate-in .feature-card,
        .scroll-animate.animate-in .step-card {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      `}</style>
    </div>
  );
}