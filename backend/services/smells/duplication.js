//server/services/smells/duplication.js

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// ==================== AST PARSING ====================

/**
 * Parse JavaScript/TypeScript file to AST
 */
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

const saveAstToFile = async (ast, originalFilePath, projectPath) => {
  try {
    const astDir = path.join(projectPath, '__ast_snapshots__');
    
    // Mirror the original file's relative path
    const relativePath = path.relative(projectPath, originalFilePath);
    const astFilePath = path.join(astDir, relativePath + '.ast.json');
    
    // Ensure the directory exists
    await fs.mkdir(path.dirname(astFilePath), { recursive: true });
    
    // Strip location info for cleaner output (optional — remove if you want full locs)
    const astPayload = {
      sourceFile: relativePath,
      savedAt: new Date().toISOString(),
      ast: ast
    };
    
    await fs.writeFile(astFilePath, JSON.stringify(astPayload, null, 2), 'utf8');
  } catch (error) {
    // Non-critical — log but don't break analysis
    console.warn(`Failed to save AST for ${originalFilePath}:`, error.message);
  }
};

/**
 * Create a code unit object
 */
const makeUnit = (type, node, filePath, name = 'unnamed') => {
  return {
    type,
    filePath,
    name,
    loc: node.loc,
    node,
    startLine: node.loc?.start?.line || 0,
    endLine: node.loc?.end?.line || 0,
  };
};

/**
 * Collect code units (functions, classes, blocks) from AST
 */
const collectUnits = (ast, filePath) => {
  const units = [];

  if (!ast) return units;

  try {
    traverse(ast, {
      FunctionDeclaration(path) {
        const unit = makeUnit('function', path.node, filePath, path.node.id?.name);
        // Only include functions with 3+ lines of code
        if (unit.endLine - unit.startLine >= 2) {
          units.push(unit);
        }
      },
      ArrowFunctionExpression(path) {
        const parent = path.parent;
        let name = 'anonymous';
        if (parent.type === 'VariableDeclarator' && parent.id) {
          name = parent.id.name;
        }
        
        // Check if it's a single statement arrow function
        const node = path.node;
        let isSingleStatement = false;
        
        if (node.body.type === 'BlockStatement') {
          // Has block body - check if it contains only 1 statement
          isSingleStatement = node.body.body.length === 1;
        } else {
          // Expression body (no curly braces) - always single statement
          // e.g., () => setValue(true)
          isSingleStatement = true;
        }
        
        // Only include multi-statement arrow functions
        if (!isSingleStatement) {
          const unit = makeUnit('function', path.node, filePath, name);
          units.push(unit);
        }
      },
      FunctionExpression(path) {
        const name = path.node.id?.name || 'anonymous';
        const unit = makeUnit('function', path.node, filePath, name);
        // Only include functions with 3+ lines of code
        if (unit.endLine - unit.startLine >= 2) {
          units.push(unit);
        }
      },
      ClassDeclaration(path) {
        units.push(makeUnit('class', path.node, filePath, path.node.id?.name));
      },
      ClassMethod(path) {
        const unit = makeUnit('method', path.node, filePath, path.node.key?.name);
        // Only include methods with 3+ lines of code
        if (unit.endLine - unit.startLine >= 2) {
          units.push(unit);
        }
      },
      ObjectMethod(path) {
        const unit = makeUnit('method', path.node, filePath, path.node.key?.name);
        // Only include methods with 3+ lines of code
        if (unit.endLine - unit.startLine >= 2) {
          units.push(unit);
        }
      },
      BlockStatement(path) {
        // Only capture large blocks to avoid noise
        if (path.node.body && path.node.body.length >= 5) {
          // Skip if it's part of a function/class we already captured
          const parent = path.parent;
          if (!['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 
                'ClassMethod', 'ObjectMethod'].includes(parent.type)) {
            units.push(makeUnit('block', path.node, filePath, 'code-block'));
          }
        }
      },
    });
  } catch (error) {
    console.error(`Error traversing AST for ${filePath}:`, error.message);
  }

  return units;
};

// ==================== AST CANONICALIZATION ====================

/**
 * Canonicalize AST node (normalize variable names, literals)
 */
const canonicalizeNode = (node) => {
  const clone = JSON.parse(JSON.stringify(node));
  const idMap = new Map();
  let idCounter = 0;

  const getId = (name) => {
    if (!idMap.has(name)) {
      idMap.set(name, `ID${idCounter++}`);
    }
    return idMap.get(name);
  };

  const visit = (n, depth = 0) => {
    if (!n || typeof n !== 'object') return;

    // Normalize identifiers BUT preserve function call names at statement level
    if (n.type === 'Identifier') {
      // Special case: preserve callback/handler function names
      // These are important for distinguishing different behaviors
      const isCallbackName = n.name && (
        n.name.startsWith('on') ||      // onCartAccess, onLogout
        n.name.startsWith('handle') ||  // handleSubmit
        n.name.includes('Callback') ||
        n.name.includes('Handler')
      );
      
      // If it's a callback/handler name AND it's being called (not defined)
      // preserve a hash of it instead of normalizing
      if (isCallbackName && depth > 0) {
        n.name = `CALLBACK_${n.name}`;  // Preserve the actual callback name
      } else {
        n.name = getId(n.name);
      }
    }

    // Normalize literals
    if (n.type === 'NumericLiteral') n.value = 'NUM';
    if (n.type === 'StringLiteral') n.value = 'STR';
    if (n.type === 'BooleanLiteral') n.value = 'BOOL';
    if (n.type === 'NullLiteral') n.value = 'NULL';

    // Remove location info
    delete n.start;
    delete n.end;
    delete n.loc;
    delete n.range;

    for (const key of Object.keys(n)) {
      const val = n[key];
      if (Array.isArray(val)) {
        val.forEach(v => visit(v, depth + 1));
      } else if (typeof val === 'object') {
        visit(val, depth + 1);
      }
    }
  };

  visit(clone);
  return clone;
};

/**
 * Convert AST node to canonical string
 */
const canonicalString = (node) => {
  const canonical = canonicalizeNode(node);
  return JSON.stringify(canonical);
};

/**
 * Generate hash from string
 */
const hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
};

// ==================== SIMILARITY CALCULATION ====================

/**
 * Calculate similarity between two canonical strings
 */
const calculateSimilarity = (canonA, canonB) => {
  const tokensA = canonA.split(/\W+/).filter(Boolean);
  const tokensB = canonB.split(/\W+/).filter(Boolean);

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return union.size > 0 ? intersection.size / union.size : 0;
};

// ==================== FILE SYSTEM UTILITIES ====================

/**
 * Recursively find all JS/TS files
 */
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

// ==================== MAIN ANALYSIS FUNCTION ====================

/**
 * Main duplication analysis function
 * @param {string} projectPath - Path to the project directory
 * @returns {Promise<Object>} Analysis results
 */
// const analyzeDuplication = async (projectPath) => {
//   console.log('Starting code duplication analysis...');
  
//   const results = {
//     exactClones: [],
//     nearClones: [],
//     stats: {
//       totalFiles: 0,
//       totalUnits: 0,
//       exactCloneGroups: 0,
//       nearCloneGroups: 0,
//       duplicatedUnits: 0,
//     }
//   };

//   try {
//     // Find all code files
//     const codeFiles = await findCodeFiles(projectPath);
//     results.stats.totalFiles = codeFiles.length;

//     if (codeFiles.length === 0) {
//       console.log('No code files found');
//       return results;
//     }

//     console.log(`Found ${codeFiles.length} code files`);

//     // Parse files and collect units
//     const allUnits = [];
//     const hashMap = new Map(); // hash -> [unitInfo]

//     for (const file of codeFiles) {
//       const ast = await parseFile(file);
//       if (!ast) continue;

//       const units = collectUnits(ast, file);
//       allUnits.push(...units);

//       for (const unit of units) {
//         const canon = canonicalString(unit.node);
//         const hash = hashString(canon);

//         if (!hashMap.has(hash)) {
//           hashMap.set(hash, []);
//         }

//         const relativePath = path.relative(projectPath, unit.filePath);
//         hashMap.get(hash).push({
//           type: unit.type,
//           name: unit.name,
//           file: relativePath,
//           filePath: unit.filePath,
//           loc: unit.loc,
//           startLine: unit.startLine,
//           endLine: unit.endLine,
//           canonical: canon,
//           lineCount: unit.endLine - unit.startLine + 1,
//         });
//       }
//     }

//     results.stats.totalUnits = allUnits.length;
//     console.log(`Collected ${allUnits.length} code units`);

//     // Detect exact clones
//     let groupId = 1;
//     for (const [hash, occurrences] of hashMap.entries()) {
//       if (occurrences.length >= 2) {
//         results.exactClones.push({
//           groupId: groupId++,
//           hash,
//           type: occurrences[0].type,
//           occurrences,
//           duplicateCount: occurrences.length,
//           severity: occurrences[0].lineCount <= 5 ? 'low' : 'high'
//         });
//         results.stats.duplicatedUnits += occurrences.length;
//       }
//     }

//     results.stats.exactCloneGroups = results.exactClones.length;
//     console.log(`Found ${results.exactClones.length} exact clone groups`);

//     // Detect near-duplicates (similar but not exact)
//     const SIMILARITY_THRESHOLD = 0.8;
//     const processedPairs = new Set();

//     // Only compare units of same type and similar size
//     const unitsByType = new Map();
//     for (const unit of allUnits) {
//       if (!unitsByType.has(unit.type)) {
//         unitsByType.set(unit.type, []);
//       }
//       unitsByType.get(unit.type).push(unit);
//     }

//     for (const [type, units] of unitsByType.entries()) {
//       // Only check larger units for near-duplicates (≥10 lines)
//       const largeUnits = units.filter(u => (u.endLine - u.startLine) >= 10);

//       for (let i = 0; i < largeUnits.length; i++) {
//         for (let j = i + 1; j < largeUnits.length; j++) {
//           const unitA = largeUnits[i];
//           const unitB = largeUnits[j];

//           // Skip if same file (likely same unit)
//           if (unitA.filePath === unitB.filePath) continue;

//           const canonA = canonicalString(unitA.node);
//           const canonB = canonicalString(unitB.node);
//           const hashA = hashString(canonA);
//           const hashB = hashString(canonB);

//           // Skip if already exact duplicates
//           if (hashA === hashB) continue;

//           const pairKey = [hashA, hashB].sort().join('|');
//           if (processedPairs.has(pairKey)) continue;
//           processedPairs.add(pairKey);

//           // Check size similarity (within 30% of each other)
//           const sizeA = canonA.length;
//           const sizeB = canonB.length;
//           const sizeRatio = Math.min(sizeA, sizeB) / Math.max(sizeA, sizeB);

//           if (sizeRatio < 0.7) continue;

//           // Calculate token-based similarity
//           const similarity = calculateSimilarity(canonA, canonB);

//           if (similarity >= SIMILARITY_THRESHOLD) {
//             const relativePathA = path.relative(projectPath, unitA.filePath);
//             const relativePathB = path.relative(projectPath, unitB.filePath);

//             results.nearClones.push({
//               groupId: groupId++,
//               type,
//               similarity: parseFloat(similarity.toFixed(3)),
//               occurrences: [
//                 {
//                   type: unitA.type,
//                   name: unitA.name,
//                   file: relativePathA,
//                   filePath: unitA.filePath,
//                   loc: unitA.loc,
//                   startLine: unitA.startLine,
//                   endLine: unitA.endLine,
//                   lineCount: unitA.endLine - unitA.startLine + 1,
//                 },
//                 {
//                   type: unitB.type,
//                   name: unitB.name,
//                   file: relativePathB,
//                   filePath: unitB.filePath,
//                   loc: unitB.loc,
//                   startLine: unitB.startLine,
//                   endLine: unitB.endLine,
//                   lineCount: unitB.endLine - unitB.startLine + 1,
//                 }
//               ]
//             });
//           }
//         }
//       }
//     }

//     results.stats.nearCloneGroups = results.nearClones.length;
//     console.log(`Found ${results.nearClones.length} near-clone groups`);

//     return results;

//   } catch (error) {
//     console.error('Duplication analysis error:', error);
//     throw error;
//   }
// };

const analyzeDuplication = async (projectPath) => {
  console.log('Starting code duplication analysis...');
  
  const results = {
    exactClones: [],
    nearClones: [],
    stats: {
      totalFiles: 0,
      totalUnits: 0,
      exactCloneGroups: 0,
      nearCloneGroups: 0,
      duplicatedUnits: 0,
    }
  };

  try {
    const codeFiles = await findCodeFiles(projectPath);
    results.stats.totalFiles = codeFiles.length;

    if (codeFiles.length === 0) {
      console.log('No code files found');
      return results;
    }

    console.log(`Found ${codeFiles.length} code files`);

    const allUnits = [];
    const hashMap = new Map();

    for (const file of codeFiles) {
      const ast = await parseFile(file);
      if (!ast) continue;

      // ✅ NEW: Save AST snapshot for this file
      await saveAstToFile(ast, file, projectPath);

      const units = collectUnits(ast, file);
      allUnits.push(...units);

      for (const unit of units) {
        const canon = canonicalString(unit.node);
        const hash = hashString(canon);

        if (!hashMap.has(hash)) {
          hashMap.set(hash, []);
        }

        const relativePath = path.relative(projectPath, unit.filePath);
        hashMap.get(hash).push({
          type: unit.type,
          name: unit.name,
          file: relativePath,
          filePath: unit.filePath,
          loc: unit.loc,
          startLine: unit.startLine,
          endLine: unit.endLine,
          canonical: canon,
          lineCount: unit.endLine - unit.startLine + 1,
        });
      }
    }

    results.stats.totalUnits = allUnits.length;
    console.log(`Collected ${allUnits.length} code units`);

    // Detect exact clones
    let groupId = 1;
    for (const [hash, occurrences] of hashMap.entries()) {
      if (occurrences.length >= 2) {
        results.exactClones.push({
          groupId: groupId++,
          hash,
          type: occurrences[0].type,
          occurrences,
          duplicateCount: occurrences.length,
          severity: occurrences[0].lineCount <= 5 ? 'low' : 'high'
        });
        results.stats.duplicatedUnits += occurrences.length;
      }
    }

    results.stats.exactCloneGroups = results.exactClones.length;
    console.log(`Found ${results.exactClones.length} exact clone groups`);

    // Detect near-duplicates
    const SIMILARITY_THRESHOLD = 0.8;
    const processedPairs = new Set();

    const unitsByType = new Map();
    for (const unit of allUnits) {
      if (!unitsByType.has(unit.type)) {
        unitsByType.set(unit.type, []);
      }
      unitsByType.get(unit.type).push(unit);
    }

    for (const [type, units] of unitsByType.entries()) {
      const largeUnits = units.filter(u => (u.endLine - u.startLine) >= 10);

      for (let i = 0; i < largeUnits.length; i++) {
        for (let j = i + 1; j < largeUnits.length; j++) {
          const unitA = largeUnits[i];
          const unitB = largeUnits[j];

          if (unitA.filePath === unitB.filePath) continue;

          const canonA = canonicalString(unitA.node);
          const canonB = canonicalString(unitB.node);
          const hashA = hashString(canonA);
          const hashB = hashString(canonB);

          if (hashA === hashB) continue;

          const pairKey = [hashA, hashB].sort().join('|');
          if (processedPairs.has(pairKey)) continue;
          processedPairs.add(pairKey);

          const sizeA = canonA.length;
          const sizeB = canonB.length;
          const sizeRatio = Math.min(sizeA, sizeB) / Math.max(sizeA, sizeB);

          if (sizeRatio < 0.7) continue;

          const similarity = calculateSimilarity(canonA, canonB);

          if (similarity >= SIMILARITY_THRESHOLD) {
            const relativePathA = path.relative(projectPath, unitA.filePath);
            const relativePathB = path.relative(projectPath, unitB.filePath);

            results.nearClones.push({
              groupId: groupId++,
              type,
              similarity: parseFloat(similarity.toFixed(3)),
              occurrences: [
                {
                  type: unitA.type,
                  name: unitA.name,
                  file: relativePathA,
                  filePath: unitA.filePath,
                  loc: unitA.loc,
                  startLine: unitA.startLine,
                  endLine: unitA.endLine,
                  lineCount: unitA.endLine - unitA.startLine + 1,
                },
                {
                  type: unitB.type,
                  name: unitB.name,
                  file: relativePathB,
                  filePath: unitB.filePath,
                  loc: unitB.loc,
                  startLine: unitB.startLine,
                  endLine: unitB.endLine,
                  lineCount: unitB.endLine - unitB.startLine + 1,
                }
              ]
            });
          }
        }
      }
    }

    results.stats.nearCloneGroups = results.nearClones.length;
    console.log(`Found ${results.nearClones.length} near-clone groups`);

    // ✅ NEW: Store the AST folder path in results so routes.js can reference it
    results.astSnapshotsDir = path.join(projectPath, '__ast_snapshots__');

    return results;

  } catch (error) {
    console.error('Duplication analysis error:', error);
    throw error;
  }
};

// ==================== EXPORTS ====================

module.exports = {
  analyzeDuplication,
  parseFile,
  collectUnits,
  canonicalizeNode,
  canonicalString,
  hashString,
  calculateSimilarity,
  findCodeFiles,
  makeUnit
};