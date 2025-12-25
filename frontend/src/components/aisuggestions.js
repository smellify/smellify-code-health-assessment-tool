import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle, TrendingUp, Code, Layers } from 'lucide-react';

export default function AISuggestionsPanel({ analysisData, preloadedSuggestions }) {
  const [suggestions, setSuggestions] = useState(preloadedSuggestions || null);
  
  // If we have preloaded suggestions, show them immediately
  useEffect(() => {
    if (preloadedSuggestions) {
      setSuggestions(preloadedSuggestions);
    }
  }, [preloadedSuggestions]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisData }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate suggestions');
      }

      setSuggestions(data.suggestions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const categoryIcons = {
    duplicates: Code,
    hooks: AlertCircle,
    propDrilling: Layers,
    codeQuality: TrendingUp
  };

  const categoryTitles = {
    duplicates: 'Duplicate Code',
    hooks: 'React Hooks',
    propDrilling: 'Prop Drilling',
    codeQuality: 'Code Quality'
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {!suggestions ? (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-500" />
          <h2 className="text-2xl font-bold mb-2">Get AI-Powered Suggestions</h2>
          <p className="text-gray-600 mb-6">
            Let AI analyze your code issues and provide actionable recommendations
          </p>
          <button
            onClick={generateSuggestions}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Suggestions...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Generate AI Suggestions
              </span>
            )}
          </button>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              AI Suggestions
            </h2>
            {/* <button
              onClick={generateSuggestions}
              disabled={loading}
              className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              Regenerate
            </button> */}
          </div>

          <div className="space-y-6">
            {Object.entries(suggestions).map(([category, items]) => {
              if (!Array.isArray(items) || items.length === 0) return null;


              const Icon = categoryIcons[category];

              return (
                <div key={category} className="bg-white rounded-lg border shadow-sm">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      {categoryTitles[category]}
                      <span className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded-full">
                        {items.length}
                      </span>
                    </h3>
                  </div>

                  <div className="divide-y">
                    {items.map((item, idx) => (
                      <div key={idx} className="p-4">
                        <div className="flex items-start gap-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-medium mb-2">{item.issue}</h4>
                            <p className="text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-100">
                              💡 {item.suggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}