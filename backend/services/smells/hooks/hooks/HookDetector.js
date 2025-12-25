// analyzers/hooks/HookDetector.js
const AnalyzerBase = require('../core/AnalyzerBase');
const t = require('@babel/types');

/**
 * HookDetector - Main detector for React Hook violations
 * Detects hooks used in loops, conditions, nested functions, etc.
 */
class HookDetector extends AnalyzerBase {
  constructor() {
    super('HookDetector', 'Detects improper React Hook usage patterns');
    
    // Built-in React hooks
    this.builtInHooks = new Set([
      'useState',
      'useEffect',
      'useContext',
      'useReducer',
      'useCallback',
      'useMemo',
      'useRef',
      'useImperativeHandle',
      'useLayoutEffect',
      'useDebugValue',
      'useTransition',
      'useDeferredValue',
      'useId',
      'useSyncExternalStore',
      'useInsertionEffect'
    ]);

    this.customHooks = new Set();
  }

  /**
   * Main analysis entry point
   * @param {Object} astResult - Parsed AST result
   * @param {Object} context - Analysis context (fileResolver, etc.)
   */
  analyze(astResult, context = {}) {
    if (!astResult.success || !astResult.ast) {
      return;
    }

    this.currentFile = astResult.filePath;
    this.currentCode = astResult.code;
    this.fileResolver = context.fileResolver;
    this.stats.filesAnalyzed++;

    // First pass: identify custom hooks in this file
    this.identifyCustomHooks(astResult.ast);

    // Track imported hooks from other files
    this.identifyImportedHooks(astResult.ast);

    // Second pass: detect hook violations
    this.detectHookViolations(astResult.ast, astResult);
  }

  /**
   * Identify custom hooks defined in the file
   * @param {Object} ast - AST
   */
  identifyCustomHooks(ast) {
    const self = this;

    require('@babel/traverse').default(ast, {
      // Function declarations: function useCustomHook() {}
      FunctionDeclaration(path) {
        const name = path.node.id?.name;
        if (name && name.startsWith('use') && name.length > 3) {
          if (self.containsHookCalls(path)) {
            self.customHooks.add(name);
          }
        }
      },

      // Variable declarations: const useCustomHook = () => {}
      VariableDeclarator(path) {
        const name = path.node.id?.name;
        if (name && name.startsWith('use') && name.length > 3) {
          const init = path.node.init;
          if (t.isFunctionExpression(init) || t.isArrowFunctionExpression(init)) {
            // Check if function body contains hook calls
            if (self.containsHookCalls(path)) {
              self.customHooks.add(name);
            }
          }
        }
      }
    });
  }

  /**
   * Identify hooks imported from other files
   * @param {Object} ast - AST
   */
  identifyImportedHooks(ast) {
    const self = this;

    require('@babel/traverse').default(ast, {
      // ES6 imports: import { useCustomHook } from './hooks'
      ImportDeclaration(path) {
        path.node.specifiers.forEach(spec => {
          if (t.isImportSpecifier(spec) || t.isImportDefaultSpecifier(spec)) {
            const importedName = spec.local.name;
            // If imported name starts with 'use', it's likely a hook
            if (importedName.startsWith('use') && importedName.length > 3) {
              self.customHooks.add(importedName);
            }
          }
        });
      },

      // CommonJS require: const { useCustomHook } = require('./hooks')
      VariableDeclarator(path) {
        const init = path.node.init;
        if (t.isCallExpression(init) && 
            t.isIdentifier(init.callee) && 
            init.callee.name === 'require') {
          
          const id = path.node.id;
          // Check for destructuring: const { useHook } = require()
          if (t.isObjectPattern(id)) {
            id.properties.forEach(prop => {
              if (t.isObjectProperty(prop) && t.isIdentifier(prop.value)) {
                const name = prop.value.name;
                if (name.startsWith('use') && name.length > 3) {
                  self.customHooks.add(name);
                }
              }
            });
          }
          // Check for direct assignment: const useHook = require()
          else if (t.isIdentifier(id)) {
            const name = id.name;
            if (name.startsWith('use') && name.length > 3) {
              self.customHooks.add(name);
            }
          }
        }
      }
    });
  }

  /**
   * Check if a function path contains hook calls
   * @param {Object} path - AST path
   * @returns {boolean} Contains hooks
   */
  containsHookCalls(path) {
    let hasHooks = false;
    const self = this;

    path.traverse({
      CallExpression(callPath) {
        const callee = callPath.node.callee;
        if (t.isIdentifier(callee) && self.isHook(callee.name)) {
          hasHooks = true;
          callPath.stop();
        }
      }
    });

    return hasHooks;
  }

  /**
   * Detect all hook violations in AST
   * @param {Object} ast - AST
   * @param {Object} astResult - Full AST result
   */
  detectHookViolations(ast, astResult) {
    const self = this;

    require('@babel/traverse').default(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        
        // Check if this is a hook call
        if (t.isIdentifier(callee)) {
          const hookName = callee.name;
          
          if (self.isHook(hookName)) {
            self.analyzeHookCall(path, hookName, astResult);
          }
        }
      }
    });
  }

  /**
   * Check if a name is a hook
   * @param {string} name - Function name
   * @returns {boolean} Is hook
   */
  isHook(name) {
    return this.builtInHooks.has(name) || 
           this.customHooks.has(name) || 
           (name.startsWith('use') && name.length > 3);
  }

  /**
   * Analyze a specific hook call for violations
   * @param {Object} path - AST path of the hook call
   * @param {string} hookName - Name of the hook
   * @param {Object} astResult - Full AST result
   */
  analyzeHookCall(path, hookName, astResult) {
    const context = this.getCallContext(path);

    // CRITICAL: Check for violations
    if (context.inLoop) {
      this.reportViolation({
        type: 'HOOK_IN_LOOP',
        hookName,
        path,
        context,
        astResult
      });
    }

    if (context.inConditional) {
      this.reportViolation({
        type: 'HOOK_IN_CONDITION',
        hookName,
        path,
        context,
        astResult
      });
    }

    if (context.inNestedFunction) {
      this.reportViolation({
        type: 'HOOK_IN_NESTED_FUNCTION',
        hookName,
        path,
        context,
        astResult
      });
    }

    if (context.afterEarlyReturn) {
      this.reportViolation({
        type: 'HOOK_AFTER_EARLY_RETURN',
        hookName,
        path,
        context,
        astResult
      });
    }

    // MEDIUM: Check for dependency array issues
    if (['useEffect', 'useCallback', 'useMemo', 'useLayoutEffect'].includes(hookName)) {
      this.checkDependencyArray(path, hookName, astResult);
    }

    // MEDIUM: Check for performance issues
    if (hookName === 'useState') {
      this.checkUnnecessaryStateUpdate(path, hookName, context, astResult);
    }

    if (hookName === 'useMemo' || hookName === 'useCallback') {
      this.checkInefficientMemoization(path, hookName, astResult);
    }

    // LOW: Check for missing cleanup in useEffect
    if (hookName === 'useEffect' || hookName === 'useLayoutEffect') {
      this.checkMissingCleanup(path, hookName, context, astResult);
    }
  }

  /**
   * Check for dependency array issues (MEDIUM severity)
   * @param {Object} path - AST path
   * @param {string} hookName - Hook name
   * @param {Object} astResult - Full AST result
   */
  checkDependencyArray(path, hookName, astResult) {
    const args = path.node.arguments;
    
    // Missing dependency array entirely
    if (args.length < 2) {
      this.reportViolation({
        type: 'MISSING_DEPENDENCY_ARRAY',
        hookName,
        path,
        context: {},
        astResult
      });
      return;
    }

    const depsArg = args[1];

    // Empty dependency array might be intentional, but check for external references
    if (t.isArrayExpression(depsArg) && depsArg.elements.length === 0) {
      const callback = args[0];
      if (this.hasExternalReferences(callback)) {
        this.reportViolation({
          type: 'EMPTY_DEPENDENCY_ARRAY_WITH_REFS',
          hookName,
          path,
          context: {},
          astResult
        });
      }
    }
  }

  /**
   * Check if callback has external references
   * @param {Object} callbackNode - Callback function node
   * @returns {boolean} Has external refs
   */
  hasExternalReferences(callbackNode) {
    if (!callbackNode || (!t.isFunctionExpression(callbackNode) && !t.isArrowFunctionExpression(callbackNode))) {
      return false;
    }

    let hasRefs = false;
    const self = this;

    try {
      const traverse = require('@babel/traverse').default;
      traverse(callbackNode, {
        Identifier(path) {
          // Check if identifier is used (not declared)
          if (path.isReferencedIdentifier()) {
            const binding = path.scope.getBinding(path.node.name);
            // If binding exists outside callback scope, it's an external reference
            if (binding && !path.scope.hasOwnBinding(path.node.name)) {
              hasRefs = true;
              path.stop();
            }
          }
        }
      }, path.scope);
    } catch (e) {
      // If traversal fails, assume it's safe
      return false;
    }

    return hasRefs;
  }

  /**
   * Check for unnecessary state updates causing re-renders (MEDIUM severity)
   * @param {Object} path - AST path
   * @param {string} hookName - Hook name
   * @param {Object} context - Context
   * @param {Object} astResult - Full AST result
   */
  checkUnnecessaryStateUpdate(path, hookName, context, astResult) {
    // Find the component/function this useState is in
    let componentPath = path;
    while (componentPath && !t.isFunctionDeclaration(componentPath.node) && 
           !t.isFunctionExpression(componentPath.node) && 
           !t.isArrowFunctionExpression(componentPath.node)) {
      componentPath = componentPath.parentPath;
    }

    if (!componentPath) return;

    const setterName = this.getStateSetterName(path);
    if (!setterName) return;

    // Check for setState calls with same value
    try {
      const traverse = require('@babel/traverse').default;
      traverse(componentPath.node, {
        CallExpression(callPath) {
          const callee = callPath.node.callee;
          
          // Check if it's calling the setter
          if (t.isIdentifier(callee) && callee.name === setterName) {
            const arg = callPath.node.arguments[0];
            
            // Pattern 1: setState(value) where value doesn't change
            // Pattern 2: setState in useEffect without dependency on the value
            // Pattern 3: Multiple setState calls in rapid succession
            
            // Check if setState is called with literal that never changes
            if (t.isLiteral(arg) && !t.isFunctionExpression(arg) && !t.isArrowFunctionExpression(arg)) {
              // This is setState(literal) - might cause unnecessary re-renders if called repeatedly
              const parentEffect = this.findParentEffect(callPath);
              if (parentEffect) {
                this.reportViolation({
                  type: 'UNNECESSARY_STATE_UPDATE',
                  hookName: setterName,
                  path: callPath,
                  context: { 
                    updateType: 'literal_in_effect',
                    value: arg.value
                  },
                  astResult
                });
              }
            }
          }
        }
      }, componentPath.scope);
    } catch (e) {
      return;
    }
  }

  /**
   * Get the setter function name from useState call
   * @param {Object} path - useState call path
   * @returns {string|null} Setter name
   */
  getStateSetterName(path) {
    const parent = path.parentPath;
    
    // Pattern: const [state, setState] = useState()
    if (parent && t.isVariableDeclarator(parent.node)) {
      const id = parent.node.id;
      if (t.isArrayPattern(id) && id.elements.length >= 2) {
        const setter = id.elements[1];
        if (t.isIdentifier(setter)) {
          return setter.name;
        }
      }
    }
    
    return null;
  }

  /**
   * Find if a path is inside a useEffect
   * @param {Object} path - AST path
   * @returns {boolean} Is in effect
   */
  findParentEffect(path) {
    let current = path;
    while (current) {
      if (t.isCallExpression(current.node)) {
        const callee = current.node.callee;
        if (t.isIdentifier(callee) && (callee.name === 'useEffect' || callee.name === 'useLayoutEffect')) {
          return current;
        }
      }
      current = current.parentPath;
    }
    return null;
  }

  /**
   * Check for inefficient useMemo/useCallback usage (MEDIUM severity)
   * @param {Object} path - AST path
   * @param {string} hookName - Hook name
   * @param {Object} astResult - Full AST result
   */
  checkInefficientMemoization(path, hookName, astResult) {
    const args = path.node.arguments;
    if (args.length < 2) return;

    const callback = args[0];
    const depsArg = args[1];

    // Issue 1: useMemo/useCallback with empty deps that don't reference anything
    // This is just overhead with no benefit
    if (t.isArrayExpression(depsArg) && depsArg.elements.length === 0) {
      if (!this.hasExternalReferences(callback)) {
        this.reportViolation({
          type: 'INEFFICIENT_MEMOIZATION_NO_DEPS',
          hookName,
          path,
          context: { reason: 'empty_deps_no_refs' },
          astResult
        });
        return;
      }
    }

    // Issue 2: useMemo/useCallback with primitive values
    // Memoizing primitives is wasteful
    if (hookName === 'useMemo') {
      if (this.returnsPrimitive(callback)) {
        this.reportViolation({
          type: 'INEFFICIENT_MEMOIZATION_PRIMITIVE',
          hookName,
          path,
          context: { reason: 'primitive_value' },
          astResult
        });
      }
    }

    // Issue 3: useCallback wrapping inline function that's always new
    if (hookName === 'useCallback') {
      // Check if all dependencies are always new (objects/arrays created inline)
      if (t.isArrayExpression(depsArg)) {
        const allDepsAreNew = depsArg.elements.every(dep => {
          return t.isObjectExpression(dep) || t.isArrayExpression(dep);
        });
        
        if (allDepsAreNew && depsArg.elements.length > 0) {
          this.reportViolation({
            type: 'INEFFICIENT_MEMOIZATION_ALWAYS_NEW',
            hookName,
            path,
            context: { reason: 'deps_always_new' },
            astResult
          });
        }
      }
    }
  }

  /**
   * Check if callback returns a primitive value
   * @param {Object} callbackNode - Callback function node
   * @returns {boolean} Returns primitive
   */
  returnsPrimitive(callbackNode) {
    if (!callbackNode) return false;

    let returnsPrimitive = false;

    try {
      const traverse = require('@babel/traverse').default;
      traverse(callbackNode, {
        ReturnStatement(returnPath) {
          const arg = returnPath.node.argument;
          if (arg && (t.isLiteral(arg) || t.isIdentifier(arg))) {
            returnsPrimitive = true;
            returnPath.stop();
          }
        }
      });
    } catch (e) {
      return false;
    }

    return returnsPrimitive;
  }

  /**
   * Check for missing cleanup in useEffect (LOW severity)
   * @param {Object} path - AST path
   * @param {string} hookName - Hook name
   * @param {Object} context - Context
   * @param {Object} astResult - Full AST result
   */
  checkMissingCleanup(path, hookName, context, astResult) {
    const args = path.node.arguments;
    if (args.length === 0) return;

    const callback = args[0];
    if (!callback || (!t.isFunctionExpression(callback) && !t.isArrowFunctionExpression(callback))) {
      return;
    }

    // Check if effect has side effects that might need cleanup
    let hasTimers = false;
    let hasEventListeners = false;
    let hasSubscriptions = false;
    let hasCleanup = false;

    try {
      const traverse = require('@babel/traverse').default;
      traverse(callback, {
        CallExpression(callPath) {
          const callee = callPath.node.callee;
          
          // Check for timers
          if (t.isIdentifier(callee)) {
            if (['setTimeout', 'setInterval', 'requestAnimationFrame'].includes(callee.name)) {
              hasTimers = true;
            }
          }

          // Check for event listeners
          if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
            if (callee.property.name === 'addEventListener') {
              hasEventListeners = true;
            }
          }
        },
        ReturnStatement(returnPath) {
          // Check if effect returns a cleanup function
          if (t.isFunctionExpression(returnPath.node.argument) || 
              t.isArrowFunctionExpression(returnPath.node.argument)) {
            hasCleanup = true;
          }
        }
      }, path.scope);
    } catch (e) {
      return;
    }

    // Report if side effects exist but no cleanup
    if ((hasTimers || hasEventListeners) && !hasCleanup) {
      this.reportViolation({
        type: 'MISSING_EFFECT_CLEANUP',
        hookName,
        path,
        context: { hasTimers, hasEventListeners },
        astResult
      });
    }
  }

  /**
   * Get the context of where a hook is called
   * @param {Object} path - AST path
   * @returns {Object} Context information
   */
  getCallContext(path) {
    const context = {
      inLoop: false,
      inConditional: false,
      inNestedFunction: false,
      afterEarlyReturn: false,
      loopType: null,
      conditionalType: null,
      functionType: null,
      componentOrHook: null
    };

    let current = path;
    let foundComponentOrHook = false;

    while (current.parentPath) {
      current = current.parentPath;
      const node = current.node;

      // Check for loops
      if (t.isForStatement(node) || 
          t.isWhileStatement(node) || 
          t.isDoWhileStatement(node) ||
          t.isForInStatement(node) ||
          t.isForOfStatement(node)) {
        context.inLoop = true;
        context.loopType = node.type;
      }

      // Check for array methods that are loops
      if (t.isCallExpression(node)) {
        const callee = node.callee;
        if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
          const methodName = callee.property.name;
          if (['map', 'forEach', 'filter', 'reduce', 'some', 'every', 'find'].includes(methodName)) {
            context.inLoop = true;
            context.loopType = `Array.${methodName}`;
          }
        }
      }

      // Check for conditionals
      if (t.isIfStatement(node) || 
          t.isConditionalExpression(node) || 
          t.isSwitchStatement(node) ||
          t.isLogicalExpression(node)) {
        context.inConditional = true;
        context.conditionalType = node.type;
      }

      // Check for nested functions
      if (t.isFunctionDeclaration(node) || 
          t.isFunctionExpression(node) || 
          t.isArrowFunctionExpression(node)) {
        
        if (foundComponentOrHook) {
          // This is a nested function inside a component/hook
          context.inNestedFunction = true;
          context.functionType = node.type;
        } else {
          // This is the component or hook function itself
          foundComponentOrHook = true;
          const functionName = this.getFunctionName(current);
          context.componentOrHook = functionName;
          
          // Check if function name starts with 'use' (custom hook)
          if (functionName && functionName.startsWith('use')) {
            context.isCustomHook = true;
          }
        }
      }

      // Check for early returns
      if (t.isReturnStatement(node) && !foundComponentOrHook) {
        context.afterEarlyReturn = true;
      }
    }

    return context;
  }

  /**
   * Get function name from path
   * @param {Object} path - AST path
   * @returns {string|null} Function name
   */
  getFunctionName(path) {
    const node = path.node;
    
    if (t.isFunctionDeclaration(node) && node.id) {
      return node.id.name;
    }
    
    if (path.parent && t.isVariableDeclarator(path.parent) && path.parent.id) {
      return path.parent.id.name;
    }
    
    return null;
  }

  /**
   * Report a violation
   * @param {Object} data - Violation data
   */
  reportViolation(data) {
    const { type, hookName, path, context, astResult } = data;
    const parser = new (require('../core/ASTParser'))();
    const location = parser.getNodeLocation(path.node);
    const snippet = parser.getCodeSnippet(astResult.code, path.node, 2);

    const violation = {
      type,
      severity: this.getSeverity(type),
      file: this.currentFile,
      line: location.line,
      column: location.column,
      hookName,
      componentName: context.componentOrHook || 'Unknown',
      codeSnippet: snippet,
      context: {
        inLoop: context.inLoop,
        loopType: context.loopType,
        inConditional: context.inConditional,
        conditionalType: context.conditionalType,
        inNestedFunction: context.inNestedFunction,
        functionType: context.functionType,
        isCustomHook: context.isCustomHook || false
      },
      explanation: this.getExplanation(type, hookName, context),
      recommendation: this.getRecommendation(type, hookName, context),
      documentation: 'https://react.dev/warnings/invalid-hook-call-warning'
    };

    this.addViolation(violation);
  }

  /**
   * Get severity level for violation type
   * @param {string} type - Violation type
   * @returns {string} Severity
   */
  getSeverity(type) {
    const severityMap = {
      // CRITICAL: Will break React's Rules of Hooks
      'HOOK_IN_LOOP': 'critical',
      'HOOK_IN_CONDITION': 'critical',
      'HOOK_IN_NESTED_FUNCTION': 'critical',
      
      // HIGH: Very likely to cause bugs
      'HOOK_AFTER_EARLY_RETURN': 'high',
      
      // MEDIUM: May cause bugs or performance issues
      'MISSING_DEPENDENCY_ARRAY': 'medium',
      'EMPTY_DEPENDENCY_ARRAY_WITH_REFS': 'medium',
      'UNNECESSARY_STATE_UPDATE': 'medium',
      'INEFFICIENT_MEMOIZATION_NO_DEPS': 'medium',
      'INEFFICIENT_MEMOIZATION_PRIMITIVE': 'medium',
      'INEFFICIENT_MEMOIZATION_ALWAYS_NEW': 'medium',
      
      // LOW: Best practices, cleanup, minor issues
      'MISSING_EFFECT_CLEANUP': 'low'
    };

    return severityMap[type] || 'medium';
  }

  /**
   * Get explanation for violation
   * @param {string} type - Violation type
   * @param {string} hookName - Hook name
   * @param {Object} context - Context
   * @returns {string} Explanation
   */
  getExplanation(type, hookName, context) {
    const explanations = {
      // CRITICAL violations
      'HOOK_IN_LOOP': `The hook '${hookName}' is called inside a loop (${context.loopType}). React Hooks must be called in the exact same order on every render. Using hooks inside loops can lead to bugs where the order changes.`,
      
      'HOOK_IN_CONDITION': `The hook '${hookName}' is called inside a conditional statement (${context.conditionalType}). Hooks must be called unconditionally to ensure they execute in the same order on every render.`,
      
      'HOOK_IN_NESTED_FUNCTION': `The hook '${hookName}' is called inside a nested function (${context.functionType}). Hooks can only be called from React components or custom hooks at the top level, not from nested functions, event handlers, or callbacks.`,
      
      // HIGH violations
      'HOOK_AFTER_EARLY_RETURN': `The hook '${hookName}' is called after an early return statement. This violates the Rules of Hooks as the hook may not be called on every render.`,
      
      // MEDIUM violations
      'MISSING_DEPENDENCY_ARRAY': `The '${hookName}' hook is missing a dependency array. Without a dependency array, the effect will run after every render, which may cause performance issues or infinite loops.`,
      
      'EMPTY_DEPENDENCY_ARRAY_WITH_REFS': `The '${hookName}' hook has an empty dependency array but references external variables. This means the effect will only run once on mount, but it won't reflect updates to those variables, potentially causing stale closure bugs.`,
      
      'UNNECESSARY_STATE_UPDATE': `The state setter '${hookName}' is called with a static value inside an effect. This can cause unnecessary re-renders if the value doesn't actually change. Setting the same value repeatedly triggers re-renders even if the state hasn't changed.`,
      
      'INEFFICIENT_MEMOIZATION_NO_DEPS': `The '${hookName}' hook has an empty dependency array but doesn't reference any external variables. This is unnecessary overhead - you can move the value outside the component or use a regular variable instead.`,
      
      'INEFFICIENT_MEMOIZATION_PRIMITIVE': `The '${hookName}' hook is memoizing a primitive value (string, number, boolean). Memoizing primitives provides no performance benefit because primitive comparisons are already very fast. This adds unnecessary overhead.`,
      
      'INEFFICIENT_MEMOIZATION_ALWAYS_NEW': `The '${hookName}' dependencies include inline objects or arrays that are recreated on every render. This defeats the purpose of memoization because the dependencies will always be different, causing the callback to be recreated every time anyway.`,
      
      // LOW violations
      'MISSING_EFFECT_CLEANUP': `The '${hookName}' hook ${context.hasTimers ? 'uses timers' : ''}${context.hasTimers && context.hasEventListeners ? ' and ' : ''}${context.hasEventListeners ? 'adds event listeners' : ''} but doesn't return a cleanup function. This can cause memory leaks and unexpected behavior when the component unmounts or re-renders.`
    };

    return explanations[type] || 'Hook usage violation detected.';
  }

  /**
   * Get recommendation for fixing violation
   * @param {string} type - Violation type
   * @param {string} hookName - Hook name
   * @param {Object} context - Context
   * @returns {string} Recommendation
   */
  getRecommendation(type, hookName, context) {
    const recommendations = {
      // CRITICAL violations
      'HOOK_IN_LOOP': `Move the ${hookName} call outside the loop to the component's top level. If you need multiple state values, use an array or object with a single ${hookName} call.`,
      
      'HOOK_IN_CONDITION': `Move the ${hookName} call outside the conditional. Call the hook unconditionally and use the condition to determine how you use the hook's return value.`,
      
      'HOOK_IN_NESTED_FUNCTION': `Call ${hookName} at the top level of your component or custom hook. Store the returned values and use them inside your nested function instead.`,
      
      // HIGH violations
      'HOOK_AFTER_EARLY_RETURN': `Move all hook calls above any early return statements to ensure they execute on every render.`,
      
      // MEDIUM violations
      'MISSING_DEPENDENCY_ARRAY': `Add a dependency array as the second argument to ${hookName}. Include all values from the component scope that are used inside the effect. Use an empty array [] if the effect doesn't depend on any props or state.`,
      
      'EMPTY_DEPENDENCY_ARRAY_WITH_REFS': `Add the external variables to the dependency array of ${hookName}. This ensures the effect re-runs when those values change. If you intentionally want the effect to run only once, make sure you're not using stale values inside it.`,
      
      'UNNECESSARY_STATE_UPDATE': `Use a functional update (${hookName}(prev => newValue)) to check if the value actually changed before updating. Or move the static value outside the effect if it doesn't need to be dynamic. Consider using useRef for values that don't need to trigger re-renders.`,
      
      'INEFFICIENT_MEMOIZATION_NO_DEPS': `Remove ${hookName} entirely and define the value as a constant outside the component, or use a regular variable inside the component. Memoization is only useful when you need to recompute based on changing dependencies.`,
      
      'INEFFICIENT_MEMOIZATION_PRIMITIVE': `Remove ${hookName} and use the primitive value directly. React's reconciliation is already optimized for primitive comparisons. Memoization only helps with expensive computations or object/array reference stability.`,
      
      'INEFFICIENT_MEMOIZATION_ALWAYS_NEW': `Move the object/array creation outside the dependency array and reference stable values instead. Or use useMemo to memoize the dependencies themselves first. The callback will be recreated on every render because the dependencies are always new.`,
      
      // LOW violations
      'MISSING_EFFECT_CLEANUP': `Return a cleanup function from ${hookName} that ${context.hasTimers ? 'clears timers (clearTimeout/clearInterval)' : ''}${context.hasTimers && context.hasEventListeners ? ' and ' : ''}${context.hasEventListeners ? 'removes event listeners' : ''}. This prevents memory leaks and ensures proper cleanup when the component unmounts.`
    };

    return recommendations[type] || 'Follow the Rules of Hooks: only call hooks at the top level of your component.';
  }
}

module.exports = HookDetector;
