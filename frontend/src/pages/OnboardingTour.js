//src/pages/OnboardingTour.js
import { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, Upload, BarChart3, Settings, FolderOpen, Award, Package, Gem, Receipt, HelpCircle, Activity } from 'lucide-react';
import api from '../services/api';

const steps = [
  {
    target: '[data-tour="stats-scans"]',
    title: 'Your Scan Credits',
    description: 'This shows how many scans you have remaining. Each project upload uses one scan.',
    position: 'bottom',
  },
  {
    target: '[data-tour="stats-projects"]',
    title: 'Total Projects',
    description: 'All your uploaded and analyzed projects appear here.',
    position: 'bottom',
  },
  {
    target: '[data-tour="analysis-settings"]',
    title: 'Analysis Settings',
    description: 'Choose which code smells to detect. Toggle them on or off before uploading a project.',
    position: 'bottom',
  },
  {
    target: '[data-tour="upload-area"]',
    title: 'Upload Your Project',
    description: 'Drag and drop a ZIP file here, or click "Upload Project" to select a file or import from GitHub.',
    position: 'top',
  },
    {
    target: '[data-tour="nav-projects"]',
    title: 'Projects',
    description: 'All your uploaded and analyzed projects appear here. Manage, view, and track their status.',
    icon: <Package className="w-5 h-5" />,
    color: 'blue',
    position: 'right',
  },
   {
    target: '[data-tour="nav-analysis"]',
    title: 'Analysis',
    description: 'View your project analysis results here — code smells, duplications, hooks issues and more.',
    icon: <Activity className="w-5 h-5" />,
    color: 'indigo',
    position: 'right',
  },
  {
    target: '[data-tour="nav-plans"]',
    title: 'Plans',
    description: 'Click here to view available plans and purchase more scan credits.',
    icon: <Gem className="w-5 h-5" />,
    color: 'purple',
    position: 'right',
  },
  {
    target: '[data-tour="nav-billing"]',
    title: 'Billing',
    description: 'View your billing history and manage your payment methods here.',
    icon: <Receipt className="w-5 h-5" />,
    color: 'green',
    position: 'right',
  },
  {
    target: '[data-tour="nav-faq"]',
    title: 'FAQ',
    description: 'Have questions? Visit the FAQ section to find answers to common questions.',
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'amber',
    position: 'right',
  },
 
];

const TOOLTIP_HEIGHT = 220; // approximate tooltip height in px

const getPosition = (targetEl, position) => {
  if (!targetEl) return { top: '50%', left: '50%' };
  const rect = targetEl.getBoundingClientRect();
  const scrollY = window.scrollY;

  // Auto-flip: if bottom position would overflow viewport, switch to top
  const wouldOverflowBottom =
    rect.bottom + 12 + TOOLTIP_HEIGHT > window.innerHeight;
  const resolvedPosition =
    position === 'bottom' && wouldOverflowBottom ? 'top' : position;

  switch (resolvedPosition) {
    case 'bottom':
      return {
        top: rect.bottom + scrollY + 12,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
        arrow: 'top',
      };
    case 'top':
      return {
        top: rect.top + scrollY - 12,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%) translateY(-100%)',
        arrow: 'bottom',
      };
    case 'right':
      return {
        top: rect.top + scrollY + rect.height / 2,
        left: rect.right + 16,
        transform: 'translateY(-50%)',
        arrow: 'left',
      };
    default:
      return {
        top: rect.bottom + scrollY + 12,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
        arrow: 'top',
      };
  }
};

export default function OnboardingTour({ onFinish, setSidebarOpen  }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({});
  const [highlightRect, setHighlightRect] = useState(null);
  const [visible, setVisible] = useState(false);

  const step = steps[currentStep];



  useEffect(() => {
    // Small delay so DOM is fully painted
    setTimeout(() => setVisible(true), 300);
  }, []);

  useEffect(() => {
    if (!visible) return;
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [currentStep, visible]);

//   const updatePositions = () => {
//   const el = document.querySelector(step.target);
//   if (!el) return;

//   // Find scrollable parent
//   const scrollableParent = document.querySelector('main') ||
//                             document.querySelector('.overflow-auto') ||
//                             document.documentElement;

//   // Scroll element into center
//   const elRect = el.getBoundingClientRect();
//   const parentRect = scrollableParent.getBoundingClientRect?.() || { top: 0 };
//   const scrollTop = scrollableParent.scrollTop + elRect.top - parentRect.top - (window.innerHeight / 2) + (elRect.height / 2);
//   scrollableParent.scrollTo({ top: scrollTop, behavior: 'smooth' });

//   // Wait for scroll to fully finish before measuring
//   setTimeout(() => {
//     // Re-query the element after scroll to get fresh coordinates
//     const freshEl = document.querySelector(step.target);
//     if (!freshEl) return;

//     // Force a layout recalculation
//     freshEl.getBoundingClientRect();

//     setTimeout(() => {
//       const rect = freshEl.getBoundingClientRect();
//       const scrollY = window.scrollY;

//       setHighlightRect({
//         top: rect.top + scrollY - 6,
//         left: rect.left - 6,
//         width: rect.width + 12,
//         height: rect.height + 12,
//       });

//       setTooltipPos(getPosition(freshEl, step.position));
//     }, 100);
//   }, 500); // wait for scroll to finish
// };


// Lock body scroll when tour is active

useEffect(() => {
    if (setSidebarOpen && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    setTimeout(() => setVisible(true), 300);
  }, []);  // ← replace your existing "setVisible" useEffect with this one

  // In updatePositions, add this at the very top of the function:
  const updatePositions = () => {
    const isNavStep = step.target.includes('data-tour="nav-');
    if (setSidebarOpen) {
      if (isNavStep && window.innerWidth < 1024) {
        setSidebarOpen(true);
        // Wait for sidebar animation before measuring
        setTimeout(() => measureAndPosition(), 350);
        return;
      } else if (!isNavStep && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
    measureAndPosition();
  };

  const measureAndPosition = () => {
  const el = document.querySelector(step.target);
  if (!el) return;

  const mainEl = document.querySelector('main');

  if (mainEl) {
    // offsetTop gives position relative to offsetParent, walk up to main
    let offsetTop = 0;
    let node = el;
    while (node && node !== mainEl) {
      offsetTop += node.offsetTop;
      node = node.offsetParent;
    }

    const targetScrollTop = offsetTop - mainEl.clientHeight / 2 + el.clientHeight / 2;
    console.log('offsetTop:', offsetTop, 'targetScrollTop:', targetScrollTop);
    mainEl.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
  }

  setTimeout(() => {
    const freshEl = document.querySelector(step.target);
    if (!freshEl) return;

    const rect = freshEl.getBoundingClientRect();
    const scrollY = window.scrollY;

    setHighlightRect({
      top: rect.top + scrollY - 6,
      left: rect.left - 6,
      width: rect.width + 12,
      height: rect.height + 12,
    });

    setTooltipPos(getPosition(freshEl, step.position));
  }, 600);
};


useEffect(() => {
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.overflow = '';
  };
}, []);


  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    try {
      await api.patch('/users/onboarding-tour-complete');
    } catch (e) {
      // non-critical
    }
    onFinish();
  };

  const handleSkip = async () => {
    try {
      await api.patch('/users/onboarding-tour-complete');
    } catch (e) {
      // non-critical
    }
    onFinish();
  };

  if (!visible) return null;

  return (
    <>
      {/* Dark overlay with cutout */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <mask id="cutout">
              <rect width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left}
                  y={highlightRect.top}
                  width={highlightRect.width}
                  height={highlightRect.height}
                  rx="10"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask="url(#cutout)"
          />
        </svg>

        {/* Highlight border */}
        {highlightRect && (
          <div
            className="absolute rounded-xl border-2 border-[#5A33FF] shadow-[0_0_0_4px_rgba(90,51,255,0.25)] transition-all duration-300"
            style={{
              top: highlightRect.top,
              left: highlightRect.left,
              width: highlightRect.width,
              height: highlightRect.height,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>

      {/* Click blocker overlay */}
      <div
        className="fixed inset-0 z-[9997]"
        onClick={handleSkip}
      />

      {/* Tooltip */}
      {tooltipPos.top && (
  <div
    className="fixed z-[9999] w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 transition-all duration-300"
    style={{
      top: tooltipPos.top,
      left: tooltipPos.left,
      transform: tooltipPos.transform,
    }}
    onClick={e => e.stopPropagation()}
  >
    {/* Arrow top — for bottom positioned tooltips */}
    {tooltipPos.arrow === 'top' && (
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-45" />
    )}

    {/* Arrow bottom — for top positioned tooltips */}
    {tooltipPos.arrow === 'bottom' && (
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45" />
    )}

    {/* Arrow left — for right positioned tooltips (sidebar) */}
    {tooltipPos.arrow === 'left' && (
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-l border-b border-gray-100 rotate-45" />
    )}

    {/* Header */}
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 rounded-full bg-[#5A33FF] flex items-center justify-center text-white text-xs font-bold">
          {currentStep + 1}
        </div>
        <h3 className="text-sm font-bold text-gray-900">{step.title}</h3>
      </div>
      <button
        onClick={handleSkip}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>

    {/* Description */}
    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
      {step.description}
    </p>

    {/* Progress dots */}
    <div className="flex items-center justify-between">
      <div className="flex space-x-1.5">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === currentStep ? 'bg-[#5A33FF]' : i < currentStep ? 'bg-purple-200' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleSkip}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip tour
        </button>

        {currentStep > 0 && (
          <button
            onClick={handleBack}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-600" />
          </button>
        )}

        <button
          onClick={handleNext}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#5A33FF] hover:bg-[#4A23EF] text-white text-xs font-medium rounded-lg transition-colors"
        >
          {currentStep === steps.length - 1 ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Done</span>
            </>
          ) : (
            <>
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}