// services/propDrilling/defUseAnalyzer.js
const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

/**
 * USE TYPES for Def-Use Analysis
 */
const USE_TYPE = {
  C_USE: 'C-USE', // Computational use: render, expression, assignment
  P_USE: 'P-USE', // Predicate use: condition, logical guard
  NO_USE: 'NO-USE' // Received but not used — only forwarded
};

/**
 * A single Definition point
 * - A prop is "defined" (enters scope) when a component receives it
 */
function createDef(prop, component, file, line) {
  return { prop, component, file, line };
}

/**
 * A single Use point
 */
function createUse(prop, component, file, line, useType, context = '') {
  return { prop, component, file, line, useType, context };
}

/**
 * Parse a file and extract DEFs and USEs for every prop in every component
 */
function extractDefsAndUses(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');

  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });

  const results = []; // Array of { componentName, defs, uses, forwardedProps, childrenRendered }

  traverse(ast, {
    FunctionDeclaration(path) {
      if (!isReactComponent(path.node)) return;
      const result = analyzeComponentForDefUse(path, filePath);
      if (result) results.push(result);
    },
    VariableDeclarator(path) {
      if (!isReactComponentVariable(path.node)) return;
      const result = analyzeComponentForDefUse(path, filePath);
      if (result) results.push(result);
    }
  });

  return { file: filePath, components: results };
}

/**
 * Core analysis: for each component, extract:
 *  - DEFs: props received (parameter destructuring)
 *  - USEs: where each prop is used (C-USE or P-USE)
 *  - forwardedProps: props passed to children without local use (potential drilling)
 *  - childrenRendered: child components and what props they receive
 */
function analyzeComponentForDefUse(path, filePath) {
  const node = path.node;
  let componentName, funcNode, params;

  if (t.isFunctionDeclaration(node)) {
    componentName = node.id.name;
    funcNode = node;
    params = node.params;
  } else if (t.isVariableDeclarator(node)) {
    componentName = node.id.name;
    funcNode = node.init;
    params = funcNode?.params;
  } else {
    return null;
  }

  if (!params) return null;

  const receivedProps = extractPropsFromParams(params);
  const startLine = funcNode.loc?.start.line || 0;

  // --- DEF: one def per received prop ---
  const defs = receivedProps.map(prop =>
    createDef(prop, componentName, filePath, startLine)
  );

  // --- Collect USEs and child info ---
  const uses = [];
  const childrenRendered = [];

  path.traverse({
    // P-USE: props used in if conditions
    IfStatement(ifPath) {
      collectPropsFromExpression(ifPath.node.test, receivedProps).forEach(prop => {
        uses.push(createUse(
          prop, componentName, filePath,
          ifPath.node.loc?.start.line || 0,
          USE_TYPE.P_USE,
          'if-condition'
        ));
      });
    },

    // P-USE: ternary / logical expressions used as conditions
    ConditionalExpression(condPath) {
      // Only count the TEST part as P-USE (consequent/alternate may be C-USE)
      collectPropsFromExpression(condPath.node.test, receivedProps).forEach(prop => {
        uses.push(createUse(
          prop, componentName, filePath,
          condPath.node.loc?.start.line || 0,
          USE_TYPE.P_USE,
          'ternary-condition'
        ));
      });
      // Consequent and alternate count as C-USE
      [...collectPropsFromExpression(condPath.node.consequent, receivedProps),
       ...collectPropsFromExpression(condPath.node.alternate, receivedProps)
      ].forEach(prop => {
        uses.push(createUse(
          prop, componentName, filePath,
          condPath.node.loc?.start.line || 0,
          USE_TYPE.C_USE,
          'ternary-branch'
        ));
      });
    },

    // P-USE: logical expressions like {isAdmin && <Admin />}
    LogicalExpression(logPath) {
      // Only flag the LEFT side (the guard) as P-USE
      collectPropsFromExpression(logPath.node.left, receivedProps).forEach(prop => {
        uses.push(createUse(
          prop, componentName, filePath,
          logPath.node.loc?.start.line || 0,
          USE_TYPE.P_USE,
          'logical-guard'
        ));
      });
    },

    // C-USE: JSX expression content (not in attribute position)
    JSXExpressionContainer(jsxPath) {
      if (t.isJSXAttribute(jsxPath.parent)) return; // attribute = forwarding, not use
      collectPropsFromExpression(jsxPath.node.expression, receivedProps).forEach(prop => {
        uses.push(createUse(
          prop, componentName, filePath,
          jsxPath.node.loc?.start.line || 0,
          USE_TYPE.C_USE,
          'jsx-expression'
        ));
      });
    },

    // C-USE: variable assignments using props
    AssignmentExpression(assignPath) {
      collectPropsFromExpression(assignPath.node.right, receivedProps).forEach(prop => {
        uses.push(createUse(
          prop, componentName, filePath,
          assignPath.node.loc?.start.line || 0,
          USE_TYPE.C_USE,
          'assignment'
        ));
      });
    },

    // C-USE: template literals
    TemplateLiteral(tmplPath) {
      tmplPath.node.expressions.forEach(expr => {
        collectPropsFromExpression(expr, receivedProps).forEach(prop => {
          uses.push(createUse(
            prop, componentName, filePath,
            tmplPath.node.loc?.start.line || 0,
            USE_TYPE.C_USE,
            'template-literal'
          ));
        });
      });
    },

    // Track children rendered (for building chains later)
    JSXElement(jsxPath) {
      const child = extractChildInfo(jsxPath, receivedProps);
      if (child) childrenRendered.push(child);
    }
  });

  // --- Determine which props are forwarded but never locally used ---
  const locallyUsedProps = new Set(uses.map(u => u.prop));

  const forwardedProps = [];
  childrenRendered.forEach(child => {
    child.propsPassedDown.forEach(prop => {
      if (receivedProps.includes(prop) && !locallyUsedProps.has(prop)) {
        forwardedProps.push({ prop, passedTo: child.component, line: child.line });
      }
    });
  });

  return {
    name: componentName,
    file: filePath,
    line: startLine,
    receivedProps,
    defs,            // Formal DEF points
    uses,            // Formal USE points (C-USE and P-USE)
    forwardedProps,  // Props passed down without local use
    childrenRendered
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Walk any AST expression node and collect prop names that appear as identifiers
 */
function collectPropsFromExpression(node, receivedProps) {
  const found = new Set();
  walkNode(node, receivedProps, found);
  return [...found];
}

function walkNode(node, receivedProps, found) {
  if (!node) return;
  if (t.isIdentifier(node)) {
    if (receivedProps.includes(node.name)) found.add(node.name);
  } else if (t.isMemberExpression(node)) {
    walkNode(node.object, receivedProps, found);
  } else if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) {
    walkNode(node.left, receivedProps, found);
    walkNode(node.right, receivedProps, found);
  } else if (t.isConditionalExpression(node)) {
    walkNode(node.test, receivedProps, found);
    walkNode(node.consequent, receivedProps, found);
    walkNode(node.alternate, receivedProps, found);
  } else if (t.isCallExpression(node)) {
    walkNode(node.callee, receivedProps, found);
    node.arguments.forEach(a => walkNode(a, receivedProps, found));
  } else if (t.isArrayExpression(node)) {
    node.elements.forEach(e => walkNode(e, receivedProps, found));
  } else if (t.isObjectExpression(node)) {
    node.properties.forEach(p => {
      if (t.isObjectProperty(p)) walkNode(p.value, receivedProps, found);
      else if (t.isSpreadElement(p)) walkNode(p.argument, receivedProps, found);
    });
  }
}

function extractChildInfo(jsxPath, parentReceivedProps) {
  const opening = jsxPath.node.openingElement;
  if (!opening) return null;

  let componentName;
  if (t.isJSXIdentifier(opening.name)) {
    componentName = opening.name.name;
  } else if (t.isJSXMemberExpression(opening.name)) {
    componentName = `${opening.name.object.name}.${opening.name.property.name}`;
  } else return null;

  if (!/^[A-Z]/.test(componentName)) return null; // skip HTML elements

  const propsPassedDown = [];
  opening.attributes.forEach(attr => {
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
      if (attr.value && t.isJSXExpressionContainer(attr.value)) {
        if (t.isIdentifier(attr.value.expression)) {
          propsPassedDown.push(attr.value.expression.name);
        } else if (t.isMemberExpression(attr.value.expression)) {
          if (t.isIdentifier(attr.value.expression.object)) {
            propsPassedDown.push(attr.value.expression.object.name);
          }
        }
      }
    } else if (t.isJSXSpreadAttribute(attr) && t.isIdentifier(attr.argument)) {
      propsPassedDown.push(`...${attr.argument.name}`);
    }
  });

  return {
    component: componentName,
    propsPassedDown: [...new Set(propsPassedDown)],
    line: opening.loc?.start.line || 0
  };
}

function extractPropsFromParams(params) {
  const props = [];
  if (!params?.length) return props;
  const first = params[0];
  if (t.isObjectPattern(first)) {
    first.properties.forEach(p => {
      if (t.isObjectProperty(p) && t.isIdentifier(p.key)) props.push(p.key.name);
      else if (t.isRestElement(p) && t.isIdentifier(p.argument)) props.push(`...${p.argument.name}`);
    });
  } else if (t.isIdentifier(first)) {
    props.push(first.name);
  }
  return props;
}

function isReactComponent(node) {
  return node.id && t.isIdentifier(node.id) && /^[A-Z]/.test(node.id.name);
}

function isReactComponentVariable(node) {
  if (!node.id || !t.isIdentifier(node.id) || !/^[A-Z]/.test(node.id.name)) return false;
  return t.isArrowFunctionExpression(node.init) || t.isFunctionExpression(node.init);
}

module.exports = { extractDefsAndUses, USE_TYPE };