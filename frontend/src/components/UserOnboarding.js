//src/components/UserOnboarding.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotification } from '../components/NotificationPopup';

const TypeWriter = ({ text, speed = 50, onComplete }) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      setTimeout(onComplete, 500);
    }
  }, [currentIndex, text, speed, onComplete]);

  return (
    <span className="inline-block">
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse text-blue-600">|</span>
      )}
    </span>
  );
};

export default function UserOnboarding({ user, onComplete, onSkip }) {
  const [step, setStep] = useState('name');
  const [name, setName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [showTutorialButtons, setShowTutorialButtons] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { showNotification } = useNotification();

  const handleNameSubmit = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      const response = await api.post('/users/update-name', {
        name: name.trim()
      });

      if (response.data) {
        setStep('tutorial');
        setShowTutorialButtons(false);
      }
      showNotification('success', 'Name updated successfully!');
    } catch (error) {
      console.error('Error updating name:', error);
      setError(error.response?.data?.message || 'Failed to update name');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && name.trim() && !isLoading) {
      handleNameSubmit();
    }
  };

  const handleStartTutorial = () => {
    console.log('Starting tutorial...');
    onComplete?.(true);
  };

  const handleSkipTutorial = () => {
    onSkip?.(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className="relative mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="absolute -top-4 -left-4 w-3 h-3 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute -top-2 -right-6 w-2 h-2 bg-indigo-400 rounded-full animate-ping opacity-50 animation-delay-200"></div>
            <div className="absolute -bottom-3 -right-4 w-4 h-4 bg-purple-400 rounded-full animate-ping opacity-60 animation-delay-500"></div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-md mx-auto">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {step === 'name' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                  Welcome to{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Smellify
                  </span>
                </h1>
                
                <div className="text-2xl text-gray-700 font-medium h-8">
                  <TypeWriter
                    text="What shall we call you?"
                    speed={80}
                    onComplete={() => setShowNameInput(true)}
                  />
                </div>
              </div>

              {showNameInput && (
                <div className="animate-fadeIn opacity-0 animate-delay-500">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md mx-auto">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3 text-left">
                          Your name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
                          placeholder="Enter your name..."
                          autoFocus
                          maxLength={50}
                        />
                      </div>

                      <button
                        onClick={handleNameSubmit}
                        disabled={!name.trim() || isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            Continue
                            <svg
                              className="w-5 h-5 ml-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'tutorial' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">
                  Nice to meet you,{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {name}!
                  </span>
                </h1>
                
                <div className="text-2xl text-gray-700 font-medium h-8">
                  <TypeWriter
                    text="Let's start with a quick tutorial"
                    speed={70}
                    onComplete={() => setShowTutorialButtons(true)}
                  />
                </div>
              </div>

              {showTutorialButtons && (
                <div className="animate-fadeIn opacity-0 animate-delay-500">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-lg mx-auto">
                    <div className="space-y-4">
                      <p className="text-gray-600 mb-6 text-center">
                        Our quick tutorial will help you get the most out of Smellify
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={handleStartTutorial}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center transform hover:scale-105"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Start Tutorial
                        </button>

                        <button
                          onClick={handleSkipTutorial}
                          className="flex-1 bg-gray-100 text-gray-700 font-semibold py-4 px-6 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center transform hover:scale-105"
                        >
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Skip for Now
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 text-center mt-4">
                        You can always access the tutorial later from settings
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-delay-500 {
          animation-delay: 0.5s;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
}