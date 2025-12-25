import React, { useState , useEffect} from "react";
import {
  ChevronDown,
  CreditCard,
  Package,
  Shield,
  Code,
  Zap,
  RefreshCw,
  Menu,
  X,
  BarChart3,
  Activity,
  Gem,
  Receipt,
  Settings,
  LogOut,
  UserPlus,
  HelpCircle,
} from "lucide-react";

export default function FAQ() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [openItems, setOpenItems] = useState({});
  const [user] = useState({ name: 'User Name' });

  useEffect(() => {
  const handleResize = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  const faqs = [
    {
      category: "Getting Started",
      icon: Zap,
      questions: [
        {
          id: 1,
          question: "What is Smellify?",
          answer: "Smellify is an advanced code smell detection platform that helps developers identify and fix code quality issues in their projects. Our AI-powered analysis scans your codebase to detect common code smells, anti-patterns, and areas for improvement."
        },
        {
          id: 2,
          question: "How do I start analyzing my code?",
          answer: "Getting started is simple! After creating an account, navigate to the Projects page, click 'New Project', and upload your code repository or connect via GitHub. Our system will automatically scan your code and provide detailed analysis within minutes."
        },
        {
          id: 3,
          question: "What programming languages are supported?",
          answer: "Smellify currently supports JavaScript, TypeScript, Python, Java, C#, and Go. We're continuously adding support for more languages based on user demand. Check our dashboard for the latest list of supported languages."
        }
      ]
    },
    {
      category: "Credits & Billing",
      icon: CreditCard,
      questions: [
        {
          id: 4,
          question: "How do credits work?",
          answer: "Each code scan consumes one credit. Credits are deducted from your account balance when you initiate a project analysis. You can purchase credit packages through our Plans page, and unused credits never expire."
        },
        {
          id: 5,
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards including Visa, Mastercard, American Express, and Discover. All payments are processed securely through our payment provider with industry-standard encryption."
        },
        {
          id: 6,
          question: "Can I get a refund?",
          answer: "We offer a 14-day money-back guarantee on all credit purchases. If you're not satisfied with our service, contact our support team for a full refund. Credits must be unused to qualify for a refund."
        },
        {
          id: 7,
          question: "Do credits expire?",
          answer: "No, your credits never expire! Once you purchase a credit package, you can use those credits at any time without worrying about expiration dates. This gives you complete flexibility to analyze your projects on your schedule."
        }
      ]
    },
    {
      category: "Features & Analysis",
      icon: Code,
      questions: [
        {
          id: 8,
          question: "What types of code smells can Smellify detect?",
          answer: "Smellify detects a wide range of code smells including duplicated code, long methods, large classes, excessive parameters, dead code, complex conditionals, and many more. Our analysis also identifies security vulnerabilities and performance bottlenecks."
        },
        {
          id: 9,
          question: "How accurate is the analysis?",
          answer: "Our AI-powered analysis achieves over 95% accuracy in detecting common code smells. We use advanced machine learning models trained on millions of code samples, combined with static analysis tools to provide reliable and actionable insights."
        },
        {
          id: 10,
          question: "Can I customize the analysis rules?",
          answer: "Yes! Premium users can customize detection rules, set severity thresholds, and exclude specific patterns from analysis. You can configure these settings in your project's advanced configuration panel."
        },
        {
          id: 11,
          question: "How long does an analysis take?",
          answer: "Analysis time depends on your project size. Small projects (under 10,000 lines) typically complete in 1-2 minutes, medium projects (10,000-50,000 lines) in 3-5 minutes, and large projects may take up to 10-15 minutes."
        }
      ]
    },
    {
      category: "Account & Security",
      icon: Shield,
      questions: [
        {
          id: 12,
          question: "Is my code secure?",
          answer: "Absolutely! We take security seriously. Your code is encrypted in transit and at rest, analyzed in isolated environments, and automatically deleted after analysis is complete. We never share your code with third parties or use it for training purposes."
        },
        {
          id: 13,
          question: "Can I invite team members?",
          answer: "Yes! Our Team and Enterprise plans support multiple users. You can invite team members, assign roles, and collaborate on code analysis together. Each team member gets their own dashboard and can work on shared projects."
        },
        {
          id: 14,
          question: "What happens to my data if I cancel?",
          answer: "You can export all your analysis reports and project data before canceling. After cancellation, your data is retained for 30 days in case you want to reactivate. After 30 days, all data is permanently deleted from our systems."
        }
      ]
    },
    {
      category: "Plans & Upgrades",
      icon: Package,
      questions: [
        {
          id: 15,
          question: "What's the difference between credit packages?",
          answer: "Our packages offer different credit amounts at various price points. Larger packages provide better value per credit. The Starter package includes 50 credits, Growth includes 150 credits with a 10% bonus, and Professional includes 500 credits with a 20% bonus."
        },
        {
          id: 16,
          question: "Can I upgrade or downgrade my plan?",
          answer: "Yes! You can purchase additional credit packages at any time. Credits from different packages stack together in your account. If you have questions about which package is right for you, our support team can help you choose."
        },
        {
          id: 17,
          question: "Do you offer enterprise plans?",
          answer: "Yes! We offer custom enterprise plans with dedicated support, advanced features, API access, and volume discounts. Contact our sales team to discuss your organization's specific needs and get a customized quote."
        }
      ]
    },
    {
      category: "Technical Support",
      icon: RefreshCw,
      questions: [
        {
          id: 18,
          question: "How do I get support?",
          answer: "You can reach our support team through multiple channels: email at support@smellify.com, live chat in the app (available to paying customers), or through our community forum. We typically respond within 24 hours on business days."
        },
        {
          id: 19,
          question: "Can I integrate Smellify with my CI/CD pipeline?",
          answer: "Yes! Professional and Enterprise users have access to our API and CLI tools, which can be integrated into your continuous integration and deployment pipelines. We provide documentation and examples for popular CI/CD platforms."
        },
        {
          id: 20,
          question: "Do you offer training or documentation?",
          answer: "We provide comprehensive documentation, video tutorials, and best practice guides in our Learning Center. Enterprise customers can also request custom training sessions for their teams."
        }
      ]
    }
  ];

  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed lg:sticky lg:top-0 lg:self-stretch h-screen z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
              {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#5A33FF] flex items-center justify-center text-white font-bold text-sm">
              <img 
                src="/bug.png" 
                alt="Bug Icon" 
                className="w-7 h-7 object-contain"
              />
            </div>
            {sidebarOpen && (
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-[#5A33FF] to-[#7C5CFF] bg-clip-text text-transparent">
                Smellify
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6">
          <div className="mb-6">
            {sidebarOpen && (
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Navigation
              </p>
            )}
            <div className="space-y-1">
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Dashboard</span>}
              </button>
              <button 
                onClick={() => window.location.href = '/projects'}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Projects</span>}
              </button>
              <button className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <Activity className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Analysis</span>}
              </button>
              <button 
                onClick={() => window.location.href = '/plans'}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Gem className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Plans</span>}
              </button>
              <button 
                onClick={() => window.location.href = '/billing'}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Receipt className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">Billing</span>}
              </button>
              <button 
                onClick={() => window.location.href = '/faq'}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-white bg-[#5A33FF] rounded-lg"
              >
                <HelpCircle className="w-5 h-5" />
                {sidebarOpen && <span className="ml-3">FAQ</span>}
              </button>
            </div>
          </div>
        </nav>

        {/* Desktop Toggle Button */}
        <div className="hidden lg:block px-3 pb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 mr-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg lg:text-2xl font-bold text-gray-900">
              Frequently Asked Questions
            </h1>
          </div>
          
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Profile Dropdown */}
            <div className="relative profile-dropdown-container">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-10 h-10 rounded-full bg-[#5A33FF] flex items-center justify-center text-white font-semibold text-sm hover:bg-[#4A23EF] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A33FF]"
              >
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      window.location.href = '/referral';
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserPlus className="w-4 h-4 mr-3 text-gray-500" />
                    Referrals
                  </button>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      window.location.href = '/settings';
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-500" />
                    Settings
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      window.location.href = '/';
                    }}
                    className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* FAQ Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {/* Hero Section */}
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
              How can we help you?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about Smellify, our features, billing, and more.
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="max-w-4xl mx-auto space-y-6">
            {faqs.map((category) => {
              const IconComponent = category.icon;
              return (
                <div key={category.category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-[#5A33FF] to-[#7C5CFF] px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white bg-opacity-20 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {category.category}
                      </h3>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="divide-y divide-gray-200">
                    {category.questions.map((item) => (
                      <div key={item.id} className="transition-colors">
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-base font-semibold text-gray-900 pr-4">
                            {item.question}
                          </span>
                          <ChevronDown 
                            className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                              openItems[item.id] ? 'transform rotate-180' : ''
                            }`}
                          />
                        </button>
                        {openItems[item.id] && (
                          <div className="px-6 pb-4 pt-0">
                            <p className="text-gray-600 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact Support CTA */}
          <div className="max-w-4xl mx-auto mt-12 bg-gradient-to-r from-[#5A33FF] to-[#7C5CFF] rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              Still have questions?
            </h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help you get the most out of Smellify.
            </p>
            <button className="inline-flex items-center px-6 py-3 text-base font-medium text-[#5A33FF] bg-white hover:bg-gray-50 rounded-lg transition-colors shadow-lg">
              Contact Support
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}