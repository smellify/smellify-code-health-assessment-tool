const fs = require('fs').promises;
const path = require("path");
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const parseFile = async (filePath) => {
  try {
    const code = await fs.readFile(filePath, 'utf8');
    return parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy'],
      errorRecovery: true,
    });
  } catch (error) {
    console.warn(`Failed to parse ${filePath}:`, error.message);
    return null;
  }
};

const findCodeFiles = async (dirPath, fileList = []) => {
  try {
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules') continue;

      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        await findCodeFiles(itemPath, fileList);
      } else if (stats.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext)) {
          fileList.push(itemPath);
        }
      }
    }
  } catch (error) {
    console.warn(`Error reading directory ${dirPath}:`, error.message);
  }

  return fileList;
};


const analyzeApiRoutes = (ast, filePath) => {
  const issues = [];
  let routeCount = 0;

  if (!ast) return { issues, routeCount };

  try {
    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;

        // Match router.get/post/put/delete/app.get/... style
        const isRouteHandler =
          callee &&
          callee.type === 'MemberExpression' &&
          callee.property &&
          ['get', 'post', 'put', 'patch', 'delete'].includes(callee.property.name);

        if (!isRouteHandler) return;

        routeCount++;

        const args = path.node.arguments;
        const callbackArg = args[args.length - 1];
        if (!callbackArg) return;

        const isFunc =
          callbackArg.type === 'ArrowFunctionExpression' ||
          callbackArg.type === 'FunctionExpression';

        if (!isFunc) return;

        // === Route handler function node ===
        const handlerFn = callbackArg;

        if (!handlerFn.body || handlerFn.body.type !== 'BlockStatement') return;

        const routePath = args[0]?.value || 'unknown';
        const routeMethod =
          (callee.property && callee.property.name) || 'unknown';

        let maxDepth = 0;
        let asyncOpCount = 0;
        let dbQueryCount = 0;

        // --- Recursive walker for nesting / async / DB queries ---
        const walkNode = (node, depth) => {
          if (!node || typeof node !== 'object') return;

          // Increase depth when we enter control structures
          const isControl =
            node.type === 'IfStatement' ||
            node.type === 'ForStatement' ||
            node.type === 'ForInStatement' ||
            node.type === 'ForOfStatement' ||
            node.type === 'WhileStatement' ||
            node.type === 'DoWhileStatement' ||
            node.type === 'TryStatement' ||
            node.type === 'SwitchStatement';

          const nextDepth = isControl ? depth + 1 : depth;
          if (nextDepth > maxDepth) maxDepth = nextDepth;

          // Count await anywhere
          if (node.type === 'AwaitExpression') {
            asyncOpCount++;
          }

          // Count DB-ish calls: Model.find / .aggregate / .populate / .findById
          if (node.type === 'CallExpression' && node.callee) {
            const cal = node.callee;
            if (
              cal.type === 'MemberExpression' &&
              cal.property &&
              ['find', 'findOne', 'findById', 'aggregate', 'populate'].includes(
                cal.property.name
              )
            ) {
              dbQueryCount++;
            }
          }

          // Explicitly follow important children
          switch (node.type) {
            case 'BlockStatement':
              node.body.forEach(child => walkNode(child, nextDepth));
              break;

            case 'IfStatement':
              walkNode(node.consequent, nextDepth);
              if (node.alternate) walkNode(node.alternate, nextDepth);
              break;

            case 'ForStatement':
            case 'ForInStatement':
            case 'ForOfStatement':
            case 'WhileStatement':
            case 'DoWhileStatement':
              walkNode(node.body, nextDepth);
              break;

            case 'TryStatement':
              // try { ... }
              walkNode(node.block, nextDepth);
              // catch (e) { ... }
              if (node.handler && node.handler.body) {
                walkNode(node.handler.body, nextDepth);
              }
              // finally { ... }
              if (node.finalizer) {
                walkNode(node.finalizer, nextDepth);
              }
              break;

            default:
              // Generic fallback: walk all child properties
              for (const key of Object.keys(node)) {
                const val = node[key];
                if (Array.isArray(val)) {
                  val.forEach(child => walkNode(child, nextDepth));
                } else if (val && typeof val === 'object') {
                  walkNode(val, nextDepth);
                }
              }
          }
        };

        // Start from the handler body
        walkNode(handlerFn.body, 0);

        // --- Deeply nested route ---
        if (maxDepth > 2) {
          issues.push({
            type: 'deeply-nested-route',
            severity: maxDepth > 5 ? 'critical' : 'high',
            filePath,
            startLine: path.node.loc?.start?.line || 0,
            routeMethod: routeMethod.toUpperCase(),
            routePath: String(routePath),
            nestingDepth: maxDepth,
            asyncOperations: asyncOpCount,
            dbQueries: dbQueryCount,
            message: `Route handler has nesting depth of ${maxDepth} levels – consider extracting middleware functions.`,
            recommendation:
              'Break complex route logic into smaller middleware or service functions.',
          });
        }

        // --- Too many async operations in one handler ---
        if (asyncOpCount > 4) {
          issues.push({
            type: 'excessive-async-operations',
            severity: 'medium',
            filePath,
            startLine: path.node.loc?.start?.line || 0,
            routeMethod: routeMethod.toUpperCase(),
            routePath: String(routePath),
            asyncOperations: asyncOpCount,
            message: `Route handler has ${asyncOpCount} async operations – consider modularizing heavy logic.`,
            recommendation:
              'Move heavy async logic into dedicated service/helper functions.',
          });
        }

        // You can also add a rule for dbQueryCount here if you like.
      },
    });
  } catch (error) {
    console.warn(`Error analyzing routes in ${filePath}:`, error.message);
  }

  return { issues, routeCount };
};

const analyzeMongooseQueries = (ast, filePath) => {
  const issues = [];
  const queryPatterns = [];

  if (!ast) return { issues, queryPatterns };

  try {
    traverse(ast, {
      CallExpression(path) {
        const callee = path.node.callee;
        
        // Match Mongoose patterns: Model.find(), Model.findById(), etc.
        const isMongooseQuery = 
          (callee.type === 'MemberExpression' &&
           callee.property.name &&
           ['find', 'findById', 'findOne', 'findByIdAndUpdate', 'aggregate', 
            'countDocuments', 'aggregate', 'distinct'].includes(callee.property.name));

        if (!isMongooseQuery) return;

        const queryMethod = callee.property.name;
        const args = path.node.arguments;
        let hasSelect = false;
        let hasProject = false;
        let fullDocument = false;
        let chainLength = 0;

        // Check if query chain has .select() for optimization
        let currentNode = path.parent;
        const chain = [queryMethod];
        
        while (currentNode && currentNode.type === 'MemberExpression') {
          const methodName = currentNode.property?.name;
          if (methodName) {
            chain.push(methodName);
            if (methodName === 'select') hasSelect = true;
            if (methodName === 'project') hasProject = true;
            if (methodName === 'lean') fullDocument = false; // .lean() is good
          }
          currentNode = currentNode.parent;
        }

        chainLength = chain.length;

        // Check if fetching entire document without .select()
        if (!hasSelect && !hasProject && chainLength === 1) {
          issues.push({
            type: 'unoptimized-mongoose-query',
            severity: 'medium',
            filePath,
            startLine: path.node.loc?.start?.line || 0,
            queryMethod,
            chain: chain.join(' -> '),
            message: `Query fetches entire document without .select() optimization`,
            recommendation: 'Use .select("-password -internalField") to exclude unnecessary fields',
            example: `Model.${queryMethod}().select('field1 field2 -password')`
          });
        }

        queryPatterns.push({
          method: queryMethod,
          chain: chain.join(' -> '),
          optimized: hasSelect || hasProject,
          startLine: path.node.loc?.start?.line || 0
        });
      }
    });
  } catch (error) {
    console.warn(`Error analyzing Mongoose queries in ${filePath}:`, error.message);
  }

  return { issues, queryPatterns };
};


const analyzeRedundantQueries = (ast, filePath) => {
  const issues = [];

  if (!ast) return { issues };

  try {
    traverse(ast, {
      FunctionDeclaration(path) {
        const funcName = path.node.id?.name || 'anonymous';
        const queries = [];

        // Use path.traverse() NOT traverse(path.node, ...) 
        path.traverse({
          CallExpression(innerPath) {
            const callee = innerPath.node.callee;

            const isDbOperation =
              (callee.type === 'MemberExpression' &&
               callee.property?.name &&
               ['find', 'findById', 'findOne', 'findByIdAndUpdate', 'aggregate',
                'countDocuments', 'updateOne', 'deleteOne', 'create', 'save',
                'populate', 'exec'].includes(callee.property.name)) ||
              (callee.type === 'Identifier' &&
               ['find', 'findOne', 'insert', 'update', 'delete'].includes(callee.name));

            if (!isDbOperation) return;

            const methodName = callee.property?.name || callee.name;
            const args = innerPath.node.arguments;

            let queryKey = methodName;
            if (args.length > 0 && args[0].type === 'ObjectExpression') {
              const props = args[0].properties.map(p => p.key?.name || '?').join(',');
              queryKey = `${methodName}({${props}})`;
            }

            queries.push({
              method: methodName,
              key: queryKey,
              startLine: innerPath.node.loc?.start?.line || 0
            });
          }
        });

        // Detect duplicate query patterns in same function
        const queryCount = new Map();
        for (const query of queries) {
          queryCount.set(query.key, (queryCount.get(query.key) || 0) + 1);
        }

        for (const [queryKey, count] of queryCount.entries()) {
          if (count >= 2) {
            const matchingQueries = queries.filter(q => q.key === queryKey);
            issues.push({
              type: 'redundant-database-query',
              severity: 'high',
              filePath,
              functionName: funcName,
              queryPattern: queryKey,
              occurrences: count,
              lines: matchingQueries.map(q => q.startLine),
              message: `Query "${queryKey}" appears ${count} times in ${funcName}() - may be redundant`,
              recommendation: 'Cache result or refactor logic to fetch once and reuse',
              example: `const result = await Model.find({...});\n// Reuse 'result' instead of querying again`
            });
          }
        }
      },

      ArrowFunctionExpression(path) {
        if (!path.node.body || path.node.body.type !== 'BlockStatement') return;

        const funcName = path.parent?.id?.name || 
                         path.parent?.key?.name || 
                         'anonymous-arrow';
        const queries = [];

        // Use path.traverse() NOT traverse(path.node, ...)
        path.traverse({
          CallExpression(innerPath) {
            const callee = innerPath.node.callee;

            const isDbOperation =
              callee.type === 'MemberExpression' &&
              callee.property?.name &&
              ['find', 'findById', 'findOne', 'populate', 'exec', 'aggregate',
               'countDocuments', 'updateOne', 'deleteOne', 'create', 'save'].includes(
                callee.property.name
              );

            if (!isDbOperation) return;

            const methodName = callee.property.name;
            const args = innerPath.node.arguments;

            let queryKey = methodName;
            if (args.length > 0 && args[0].type === 'ObjectExpression') {
              const props = args[0].properties.map(p => p.key?.name || '?').join(',');
              queryKey = `${methodName}({${props}})`;
            }

            queries.push({
              method: methodName,
              key: queryKey,
              startLine: innerPath.node.loc?.start?.line || 0
            });
          }
        });

        // Detect duplicate query patterns
        const queryCount = new Map();
        for (const query of queries) {
          queryCount.set(query.key, (queryCount.get(query.key) || 0) + 1);
        }

        for (const [queryKey, count] of queryCount.entries()) {
          if (count >= 2) {
            const matchingQueries = queries.filter(q => q.key === queryKey);
            issues.push({
              type: 'redundant-database-query',
              severity: 'medium',
              filePath,
              functionName: funcName,
              queryPattern: queryKey,
              occurrences: count,
              lines: matchingQueries.map(q => q.startLine),
              message: `Query "${queryKey}" appears ${count} times in ${funcName}() - may be redundant`,
              recommendation: 'Cache result or refactor logic to fetch once and reuse'
            });
          }
        }
      }
    });
  } catch (error) {
    console.warn(`Error analyzing redundant queries in ${filePath}:`, error.message);
  }

  return { issues };
};

// MAIN CODE QUALITY ANALYSIS FUNCTION
const analyzeCodeQuality = async (projectPath) => {
  console.log('Starting comprehensive code quality analysis...');
  
  const results = {
    apiRouteIssues: [],
    mongooseQueryIssues: [],
    redundantQueryIssues: [],
    stats: {
      totalFiles: 0,
      filesWithIssues: 0,
      totalIssuesFound: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      routeCount: 0,
      queryPatterns: []
    }
  };

  try {
    const codeFiles = await findCodeFiles(projectPath);
    results.stats.totalFiles = codeFiles.length;

    if (codeFiles.length === 0) {
      console.log('No code files found for quality analysis');
      return results;
    }

    console.log(`Analyzing ${codeFiles.length} files for code quality issues...`);

    const filesWithIssues = new Set();

    // Analyze each file
    for (const file of codeFiles) {
      const ast = await parseFile(file);
      if (!ast) continue;

      const relativePath = path.relative(projectPath, file);

      // 1. Analyze API Routes
      const routeAnalysis = analyzeApiRoutes(ast, relativePath);
      if (routeAnalysis.issues.length > 0) {
        results.apiRouteIssues.push(...routeAnalysis.issues);
        filesWithIssues.add(relativePath);
      }
      results.stats.routeCount += routeAnalysis.routeCount;

      // 2. Analyze Mongoose Queries
      const queryAnalysis = analyzeMongooseQueries(ast, relativePath);
      if (queryAnalysis.issues.length > 0) {
        results.mongooseQueryIssues.push(...queryAnalysis.issues);
        filesWithIssues.add(relativePath);
      }
      results.stats.queryPatterns.push(...queryAnalysis.queryPatterns);

      // 3. Analyze Redundant Queries
      const redundantAnalysis = analyzeRedundantQueries(ast, relativePath);
      if (redundantAnalysis.issues.length > 0) {
        results.redundantQueryIssues.push(...redundantAnalysis.issues);
        filesWithIssues.add(relativePath);
      }
    }

    // Calculate statistics
    results.stats.filesWithIssues = filesWithIssues.size;
    results.stats.totalIssuesFound = 
      results.apiRouteIssues.length + 
      results.mongooseQueryIssues.length + 
      results.redundantQueryIssues.length;

    const allIssues = [
      ...results.apiRouteIssues,
      ...results.mongooseQueryIssues,
      ...results.redundantQueryIssues
    ];

    for (const issue of allIssues) {
      if (issue.severity === 'critical') results.stats.criticalIssues++;
      else if (issue.severity === 'high') results.stats.highIssues++;
      else if (issue.severity === 'medium') results.stats.mediumIssues++;
      else if (issue.severity === 'low') results.stats.lowIssues++;
    }

    console.log(`✅ Code quality analysis completed:`);
    console.log(`   - API Route Issues: ${results.apiRouteIssues.length}`);
    console.log(`   - Mongoose Query Issues: ${results.mongooseQueryIssues.length}`);
    console.log(`   - Redundant Query Issues: ${results.redundantQueryIssues.length}`);

    return results;

  } catch (error) {
    console.error('Code quality analysis error:', error);
    throw error;
  }
};

module.exports = {
  analyzeCodeQuality,
  analyzeApiRoutes,
  analyzeMongooseQueries,
  analyzeRedundantQueries
};