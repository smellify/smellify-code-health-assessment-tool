// backend/routes/aiSuggestions.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyCQ4c5mNY_llhNryAQOJaluUV4-2vRFcM8");

// AI Suggestion endpoint
router.post('/generate-suggestions', async (req, res) => {
  try {
    const { analysisData } = req.body;

    if (!analysisData) {
      return res.status(400).json({
        success: false,
        error: 'Analysis data is required'
      });
    }

    // Prepare the prompt for Gemini
    const prompt = formatAnalysisForAI(analysisData);

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    // Parse AI response
    const suggestions = parseAISuggestions(aiText, analysisData);

    res.json({
      success: true,
      suggestions
    });

  } catch (error) {
    console.error('AI Suggestion Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate suggestions'
    });
  }
});



// Format analysis results into a prompt for Gemini
function formatAnalysisForAI(data) {
  const { 
    duplication, 
    hooks, 
    propDrilling, 
    codeQuality,
    summary 
  } = data;

  let prompt = `You are a senior code quality expert. Analyze the following code analysis results and provide specific, actionable suggestions for improvement.

**IMPORTANT**: Respond ONLY with valid JSON. No markdown, no code blocks, no explanation outside the JSON.

Required JSON format:
{
  "duplicates": [{"issue": "description", "suggestion": "specific actionable fix", "priority": "high|medium|low", "estimatedImpact": "description"}],
  "hooks": [{"issue": "description", "suggestion": "specific actionable fix", "priority": "high|medium|low", "estimatedImpact": "description"}],
  "propDrilling": [{"issue": "description", "suggestion": "specific actionable fix", "priority": "high|medium|low", "estimatedImpact": "description"}],
  "codeQuality": [{"issue": "description", "suggestion": "specific actionable fix", "priority": "high|medium|low", "estimatedImpact": "description"}]
}

## Analysis Results Summary:
- Total Files: ${summary?.totalFiles || 0}
- Exact Clones: ${summary?.exactClones || 0}
- Near Clones: ${summary?.nearClones || 0}
- Hooks Issues: ${hooks?.results?.summary?.totalViolations || 0}
- Prop Drilling Issues: ${summary?.propDrillingIssues || 0}
- API Route Issues: ${summary?.apiRouteIssues || 0}
- Query Issues: ${(summary?.mongooseQueryIssues || 0) + (summary?.redundantQueryIssues || 0)}

`;

  // Duplication Details
  const exactClones = duplication?.results?.exactClones || [];
  const nearClones = duplication?.results?.nearClones || [];
  if (exactClones.length > 0 || nearClones.length > 0) {
    prompt += `\n## Code Duplication Found:\n`;
    prompt += `- ${exactClones.length} exact clone groups\n`;
    prompt += `- ${nearClones.length} near clone groups\n`;
    
    if (exactClones.length > 0) {
      prompt += `\nTop Exact Clones:\n`;
      exactClones.slice(0, 3).forEach((group, idx) => {
        prompt += `${idx + 1}. ${group.type} duplicated ${group.duplicateCount} times (${group.occurrences[0]?.lineCount || 0} lines)\n`;
      });
    }
  }

  // Hooks Issues
  const hooksViolations = hooks?.results?.violations || [];
  if (hooksViolations.length > 0) {
    const hooksSummary = hooks?.results?.summary || {};
    prompt += `\n## React Hooks Issues:\n`;
    prompt += `- Total Violations: ${hooksViolations.length}\n`;
    prompt += `- Critical: ${hooksSummary.criticalViolations || 0}\n`;
    prompt += `- High: ${hooksSummary.highViolations || 0}\n`;
    prompt += `- Medium: ${hooksSummary.mediumViolations || 0}\n`;
    
    // Show top violations
    prompt += `\nTop Issues:\n`;
    hooksViolations.slice(0, 3).forEach((v, idx) => {
      prompt += `${idx + 1}. [${v.severity?.toUpperCase()}] ${v.type}: ${v.message}\n`;
      prompt += `   File: ${v.file}:${v.line}\n`;
    });
  }

  // Prop Drilling
  const propResults = propDrilling?.results || {};
  const propIssues = propResults?.propDrillingIssues || propResults?.issues || [];
  const propChains = propResults?.chains || [];
  
  if (propIssues.length > 0 || propChains.length > 0) {
    prompt += `\n## Prop Drilling Issues:\n`;
    const displayIssues = propIssues.length > 0 ? propIssues : propChains;
    
    prompt += `- Total Issues: ${displayIssues.length}\n`;
    prompt += `\nTop Issues:\n`;
    displayIssues.slice(0, 3).forEach((issue, idx) => {
      const depth = issue.depth || issue.chain?.length || 0;
      const prop = issue.prop || 'unknown';
      prompt += `${idx + 1}. Prop "${prop}" drilled through ${depth} levels\n`;
    });
  }

  // Code Quality Issues
  const apiIssues = codeQuality?.results?.apiRouteIssues || [];
  const mongooseIssues = codeQuality?.results?.mongooseQueryIssues || [];
  const redundantIssues = codeQuality?.results?.redundantQueryIssues || [];
  
  if (apiIssues.length > 0 || mongooseIssues.length > 0 || redundantIssues.length > 0) {
    prompt += `\n## Code Quality Issues:\n`;
    prompt += `- API Route Issues: ${apiIssues.length}\n`;
    prompt += `- Mongoose Query Issues: ${mongooseIssues.length}\n`;
    prompt += `- Redundant Query Issues: ${redundantIssues.length}\n`;
    
    if (apiIssues.length > 0) {
      prompt += `\nTop API Issues:\n`;
      apiIssues.slice(0, 2).forEach((issue, idx) => {
        prompt += `${idx + 1}. ${issue.type}: ${issue.message}\n`;
      });
    }
  }

  prompt += `\n\n**Remember**: Respond ONLY with the JSON object. Be specific and actionable in your suggestions. Focus on the most impactful improvements.`;

  return prompt;
}

// Parse AI response and structure suggestions
function parseAISuggestions(aiText, originalData) {
  try {
    // Remove markdown code blocks if present
    let cleanText = aiText.trim();
    cleanText = cleanText.replace(/```json\n?/g, '');
    cleanText = cleanText.replace(/```\n?/g, '');
    cleanText = cleanText.trim();
    
    // Try to find JSON in the response
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }
    
    throw new Error('No valid JSON found in response');
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    console.log('AI Response:', aiText);
    
    // Fallback: create basic suggestions from the data
    return createFallbackSuggestions(originalData);
  }
}

// Create fallback suggestions if AI parsing fails
function createFallbackSuggestions(data) {
  const suggestions = {
    duplicates: [],
    hooks: [],
    propDrilling: [],
    codeQuality: []
  };

  // Duplication suggestions
  const exactClones = data.duplication?.results?.exactClones || [];
  const nearClones = data.duplication?.results?.nearClones || [];
  
  if (exactClones.length > 0) {
    suggestions.duplicates.push({
      issue: `Found ${exactClones.length} exact code duplications`,
      suggestion: "Extract duplicated code into reusable functions or components. Consider creating a shared utility module for common patterns.",
      priority: "high",
      estimatedImpact: "Reduces code size and improves maintainability"
    });
  }
  
  if (nearClones.length > 0) {
    suggestions.duplicates.push({
      issue: `Found ${nearClones.length} similar code blocks`,
      suggestion: "Refactor similar code blocks into parameterized functions. Look for opportunities to use inheritance or composition patterns.",
      priority: "medium",
      estimatedImpact: "Improves code consistency and reduces duplication"
    });
  }

  // Hooks suggestions
  const hooksViolations = data.hooks?.results?.violations || [];
  const hooksSummary = data.hooks?.results?.summary || {};
  
  if (hooksSummary.criticalViolations > 0) {
    suggestions.hooks.push({
      issue: `${hooksSummary.criticalViolations} critical React Hooks violations detected`,
      suggestion: "Fix critical hook violations immediately. Ensure hooks are only called at the top level and follow React's Rules of Hooks.",
      priority: "high",
      estimatedImpact: "Prevents runtime errors and unpredictable behavior"
    });
  }
  
  if (hooksSummary.highViolations > 0) {
    suggestions.hooks.push({
      issue: `${hooksSummary.highViolations} high-severity hooks issues found`,
      suggestion: "Review and fix hooks dependency arrays. Add missing dependencies or use useCallback/useMemo appropriately.",
      priority: "high",
      estimatedImpact: "Prevents stale closures and ensures correct component updates"
    });
  }

  // Prop Drilling suggestions
  const propResults = data.propDrilling?.results || {};
  const propSummary = propResults?.summary || {};
  
  if (propSummary.highSeverity > 0) {
    suggestions.propDrilling.push({
      issue: `${propSummary.highSeverity} severe prop drilling issues (4+ levels)`,
      suggestion: "Implement React Context API or state management library (Redux, Zustand) for deeply nested props. Consider component composition patterns.",
      priority: "high",
      estimatedImpact: "Simplifies component structure and improves code readability"
    });
  }
  
  if (propSummary.mediumSeverity > 0) {
    suggestions.propDrilling.push({
      issue: `${propSummary.mediumSeverity} moderate prop drilling cases (3 levels)`,
      suggestion: "Evaluate if Context API would be beneficial. Consider using compound components or render props pattern.",
      priority: "medium",
      estimatedImpact: "Reduces prop forwarding and improves maintainability"
    });
  }

  // Code Quality suggestions
  const apiIssues = data.codeQuality?.results?.apiRouteIssues || [];
  const queryIssues = (data.codeQuality?.results?.mongooseQueryIssues || []).length + 
                     (data.codeQuality?.results?.redundantQueryIssues || []).length;
  
  if (apiIssues.length > 0) {
    suggestions.codeQuality.push({
      issue: `${apiIssues.length} API route issues detected`,
      suggestion: "Add proper error handling, input validation, and authentication middleware to API routes. Use try-catch blocks and return appropriate status codes.",
      priority: "high",
      estimatedImpact: "Improves API reliability and security"
    });
  }
  
  if (queryIssues > 0) {
    suggestions.codeQuality.push({
      issue: `${queryIssues} database query issues found`,
      suggestion: "Optimize database queries by adding indexes, using lean() for read-only operations, and combining multiple queries. Avoid N+1 query problems.",
      priority: "medium",
      estimatedImpact: "Improves application performance and reduces database load"
    });
  }

  return suggestions;
}

module.exports = router;

