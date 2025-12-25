# Smellify Code Analyzer - React Hooks Module

## 🎯 Overview

The React Hooks analyzer detects improper hook usage patterns that violate the Rules of Hooks. This is the first module of the Smellify code smell detection system.

## 📁 Project Structure

```
backend/analyzers/
├── core/
│   ├── ASTParser.js           # Parses JS/JSX/TS to AST
│   ├── ProjectScanner.js      # Scans project files
│   ├── FileResolver.js        # Resolves imports/exports
│   └── AnalyzerBase.js        # Base class for analyzers
│
├── hooks/
│   └── HookDetector.js        # Main hook violation detector
│
├── index.js                   # Main analyzer orchestrator
├── test-analyzer.js           # Test script
└── test-violations.jsx        # Test file with violations
```

## 🚀 Installation

1. **Install Dependencies**:
```bash
cd backend
npm install
```

This will install:
- `@babel/parser` - Parse JavaScript/JSX/TypeScript
- `@babel/traverse` - Walk AST trees
- `@babel/types` - AST type checking

## 🧪 Testing

### Quick Test

Run the test script to verify everything works:

```bash
node analyzers/test-analyzer.js
```

This will analyze `test-violations.jsx` which contains intentional hook violations.

**Expected output:**
- 10+ violations detected
- Various violation types (HOOK_IN_LOOP, HOOK_IN_CONDITION, etc.)
- Detailed explanations and recommendations

### Test via API

1. **Start the server**:
```bash
npm start
```

2. **Upload a project** (use existing endpoint)

3. **Trigger analysis**:
```bash
POST /api/analysis/:projectId/analyze
Authorization: Bearer YOUR_TOKEN
```

4. **Get results**:
```bash
GET /api/analysis/:projectId
Authorization: Bearer YOUR_TOKEN
```

## 🔍 Detection Capabilities

### 1. Hooks in Loops ❌

**Detects:**
- Hooks inside `for`, `while`, `forEach`, `map`, `filter`, etc.

**Example:**
```javascript
function Bad({ items }) {
  items.map(item => {
    const [state, setState] = useState(0); // ❌ VIOLATION
  });
}
```

**Fix:**
```javascript
function Good({ items }) {
  const [state, setState] = useState(0); // ✅ At top level
  return items.map(item => <div>{state}</div>);
}
```

### 2. Hooks in Conditions ❌

**Detects:**
- Hooks inside `if/else`, ternaries, `switch`, logical operators

**Example:**
```javascript
function Bad({ isLoggedIn }) {
  if (isLoggedIn) {
    const [user, setUser] = useState(null); // ❌ VIOLATION
  }
}
```

**Fix:**
```javascript
function Good({ isLoggedIn }) {
  const [user, setUser] = useState(isLoggedIn ? null : undefined); // ✅
}
```

### 3. Hooks in Nested Functions ❌

**Detects:**
- Hooks inside event handlers, callbacks, nested functions

**Example:**
```javascript
function Bad() {
  const handleClick = () => {
    const [value, setValue] = useState(0); // ❌ VIOLATION
  };
}
```

**Fix:**
```javascript
function Good() {
  const [value, setValue] = useState(0); // ✅ At top level
  const handleClick = () => {
    setValue(1); // Use the hook's setter
  };
}
```

### 4. Hooks After Early Return ❌

**Detects:**
- Hooks called after conditional returns

**Example:**
```javascript
function Bad({ shouldRender }) {
  if (!shouldRender) return null;
  
  const [data, setData] = useState(null); // ❌ VIOLATION
}
```

**Fix:**
```javascript
function Good({ shouldRender }) {
  const [data, setData] = useState(null); // ✅ Before return
  
  if (!shouldRender) return null;
  return <div>{data}</div>;
}
```

## 📊 Output Format

### Analysis Report Structure

```json
{
  "metadata": {
    "projectPath": "/path/to/project",
    "analyzedAt": "2025-11-22T10:30:00Z",
    "duration": 1234,
    "version": "1.0.0"
  },
  "summary": {
    "totalFiles": 45,
    "filesAnalyzed": 38,
    "totalViolations": 12,
    "violationsBySeverity": {
      "critical": 8,
      "high": 2,
      "medium": 2,
      "low": 0
    }
  },
  "violations": [
    {
      "id": "HookDetector-1",
      "type": "HOOK_IN_CONDITION",
      "severity": "critical",
      "file": "src/components/UserProfile.js",
      "line": 45,
      "column": 8,
      "hookName": "useState",
      "componentName": "UserProfile",
      "codeSnippet": "...",
      "explanation": "...",
      "recommendation": "...",
      "documentation": "https://react.dev/warnings/invalid-hook-call-warning"
    }
  ]
}
```

## 🔧 API Endpoints

### 1. Trigger Analysis

```
POST /api/analysis/:projectId/analyze
```

**Response:**
```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "summary": { ... },
  "violations": [ ... ]
}
```

### 2. Get Analysis Results

```
GET /api/analysis/:projectId
```

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "project": { ... },
  "analysis": { ... }
}
```

### 3. Get Violations by Severity

```
GET /api/analysis/:projectId/violations/:severity
```

**Severity values:** `critical`, `high`, `medium`, `low`

## 🎨 Supported File Types

- `.js` - JavaScript
- `.jsx` - React JSX
- `.ts` - TypeScript
- `.tsx` - TypeScript with JSX
- `.mjs` - ES Modules

## 🚫 Excluded Patterns

The analyzer automatically skips:
- `node_modules/`
- `.test.js`, `.spec.js` files
- `.min.js` files
- `dist/`, `build/`, `coverage/` directories
- `.next/`, `.nuxt/` directories

## 🧩 How It Works

### 1. Project Scanning
- Recursively scans project directory
- Identifies all analyzable files
- Filters out test/build files

### 2. AST Parsing
- Uses Babel parser to convert code to AST
- Supports JSX, TypeScript, and modern JS features
- Handles parse errors gracefully

### 3. Import Resolution
- Builds dependency graph
- Resolves import/export statements
- Tracks custom hooks across files

### 4. Hook Detection
- Identifies built-in React hooks (useState, useEffect, etc.)
- Detects custom hooks (functions starting with 'use')
- Analyzes call context (loops, conditions, nesting)

### 5. Violation Reporting
- Generates detailed violation reports
- Provides code snippets with line numbers
- Suggests fixes with explanations

## 🔮 Future Enhancements

### Phase 2: Performance Analysis
- [ ] Detect unnecessary re-renders
- [ ] Analyze useMemo/useCallback effectiveness
- [ ] Check dependency arrays

### Phase 3: Advanced Hook Analysis
- [ ] Detect missing dependencies in effect hooks
- [ ] Warn about stale closures
- [ ] Identify race conditions

### Phase 4: Cross-File Analysis
- [ ] Track custom hook propagation
- [ ] Analyze hook composition patterns
- [ ] Detect circular dependencies

## 🐛 Troubleshooting

### Parse Errors

If you encounter parse errors:

1. **Check file syntax** - Ensure valid JavaScript/JSX
2. **TypeScript support** - `.ts` and `.tsx` files are supported
3. **Modern syntax** - Most ES2020+ features are supported

### Missing Violations

If expected violations aren't detected:

1. **File is skipped** - Check if file matches excluded patterns
2. **Custom hooks** - Must follow naming convention (`useSomething`)
3. **Complex patterns** - Some edge cases may not be detected yet

### Performance Issues

For large projects:

1. **Exclude directories** - Add more patterns to skip
2. **Run incrementally** - Analyze changed files only
3. **Use async processing** - Implement analysis queue (TODO)

## 📚 Resources

- [Rules of Hooks](https://react.dev/warnings/invalid-hook-call-warning)
- [React Hooks Documentation](https://react.dev/reference/react)
- [Babel Parser](https://babeljs.io/docs/babel-parser)
- [AST Explorer](https://astexplorer.net/)

## 👥 Contributing

To add new violation types:

1. Extend `HookDetector.js`
2. Add detection logic in `analyzeHookCall()`
3. Update `getExplanation()` and `getRecommendation()`
4. Add test cases to `test-violations.jsx`

## 📝 License

Part of the Smellify project.
