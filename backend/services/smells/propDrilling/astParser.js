// services/astParser.js
const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

/**
 * Parse a single React file and extract component data
 */
function parseReactFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    const components = [];
    
    traverse(ast, {
      FunctionDeclaration(path) {
        if (isReactComponent(path.node)) {
          const component = analyzeComponent(path, filePath);
          if (component) components.push(component);
        }
      },
      
      VariableDeclarator(path) {
        if (isReactComponentVariable(path.node)) {
          const component = analyzeComponent(path, filePath);
          if (component) components.push(component);
        }
      }
    });

    return {
      file: filePath,
      components
    };
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error.message);
    return {
      file: filePath,
      components: [],
      error: error.message
    };
  }
}

/**
 * Analyze a single component
 */
function analyzeComponent(path, filePath) {
  const node = path.node;
  let componentName, funcNode, params;

  if (t.isFunctionDeclaration(node)) {
    componentName = node.id.name;
    funcNode = node;
    params = node.params;
  } else if (t.isVariableDeclarator(node)) {
    componentName = node.id.name;
    funcNode = node.init;
    params = funcNode.params;
  } else {
    return null;
  }

  // Extract props from parameters
  const propsReceived = extractPropsFromParams(params);
  
  // Find all JSX children and props passed to them
  const childrenRendered = [];
  const propsPassedToChildren = new Set();
  
  // Use path.traverse instead of standalone traverse
  path.traverse({
    JSXElement(jsxPath) {
      const child = extractChildComponent(jsxPath);
      if (child) {
        childrenRendered.push(child);
        child.propsPassedDown.forEach(p => propsPassedToChildren.add(p));
      }
    }
  });

  // Determine which props are actually USED (not just forwarded)
  const propsUsedLocally = findPropsActuallyUsed(path, propsReceived, propsPassedToChildren);

  return {
    name: componentName,
    line: funcNode.loc ? funcNode.loc.start.line : 0,
    propsReceived,
    propsUsedLocally,
    childrenRendered
  };
}

/**
 * Find props that are ACTUALLY used in the component
 * (not just passed down to children)
 */
function findPropsActuallyUsed(componentPath, propsReceived, propsPassedToChildren) {
  const propsUsed = new Set();

  componentPath.traverse({
    // Check JSX text content: <h3>{name}</h3>
    JSXExpressionContainer(path) {
      // Skip if this is inside a JSXAttribute (that's passing down)
      if (t.isJSXAttribute(path.parent)) {
        return;
      }
      
      // Check for simple identifier
      if (t.isIdentifier(path.node.expression)) {
        const propName = path.node.expression.name;
        if (propsReceived.includes(propName)) {
          propsUsed.add(propName);
        }
      }
      
      // Handle member expressions: {props.name}
      if (t.isMemberExpression(path.node.expression)) {
        const obj = path.node.expression.object;
        const prop = path.node.expression.property;
        if (t.isIdentifier(obj) && t.isIdentifier(prop)) {
          if (propsReceived.includes(obj.name)) {
            propsUsed.add(obj.name);
          }
          if (obj.name === 'props' && propsReceived.includes(prop.name)) {
            propsUsed.add(prop.name);
          }
        }
      }
      
      // Handle logical/conditional expressions
      if (t.isLogicalExpression(path.node.expression) || 
          t.isConditionalExpression(path.node.expression)) {
        // Walk the expression to find identifiers
        walkExpressionForProps(path.node.expression, propsReceived, propsUsed);
      }
    },

    // Check conditionals in JSX: {highlight ? ... : ...}
    ConditionalExpression(path) {
      if (t.isIdentifier(path.node.test)) {
        if (propsReceived.includes(path.node.test.name)) {
          propsUsed.add(path.node.test.name);
        }
      }
      // Also check consequent and alternate
      walkExpressionForProps(path.node.test, propsReceived, propsUsed);
    },

    // Check template literals: `Price: Rs. ${price}`
    TemplateLiteral(path) {
      path.node.expressions.forEach(expr => {
        if (t.isIdentifier(expr) && propsReceived.includes(expr.name)) {
          propsUsed.add(expr.name);
        }
      });
    },

    // Check binary expressions: numPersons / selectedFood.serves
    BinaryExpression(path) {
      walkExpressionForProps(path.node, propsReceived, propsUsed);
    },

    // Check member expressions: selectedFood.serves
    MemberExpression(path) {
      // Skip if in JSX attribute
      let parent = path.parent;
      if (t.isJSXExpressionContainer(parent) && t.isJSXAttribute(path.parentPath.parent)) {
        return;
      }
      
      if (t.isIdentifier(path.node.object)) {
        const objName = path.node.object.name;
        if (propsReceived.includes(objName)) {
          propsUsed.add(objName);
        }
      }
    },

    // Check function calls: Math.ceil(numPersons / ...)
    CallExpression(path) {
      walkExpressionForProps(path.node, propsReceived, propsUsed);
    }
  });

  return Array.from(propsUsed);
}

/**
 * Walk an expression tree to find prop identifiers
 * (Without using nested traverse)
 */
function walkExpressionForProps(node, propsReceived, propsUsed) {
  if (!node) return;

  if (t.isIdentifier(node)) {
    if (propsReceived.includes(node.name)) {
      propsUsed.add(node.name);
    }
  } else if (t.isMemberExpression(node)) {
    walkExpressionForProps(node.object, propsReceived, propsUsed);
    walkExpressionForProps(node.property, propsReceived, propsUsed);
  } else if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) {
    walkExpressionForProps(node.left, propsReceived, propsUsed);
    walkExpressionForProps(node.right, propsReceived, propsUsed);
  } else if (t.isConditionalExpression(node)) {
    walkExpressionForProps(node.test, propsReceived, propsUsed);
    walkExpressionForProps(node.consequent, propsReceived, propsUsed);
    walkExpressionForProps(node.alternate, propsReceived, propsUsed);
  } else if (t.isCallExpression(node)) {
    walkExpressionForProps(node.callee, propsReceived, propsUsed);
    node.arguments.forEach(arg => walkExpressionForProps(arg, propsReceived, propsUsed));
  } else if (t.isArrayExpression(node)) {
    node.elements.forEach(el => walkExpressionForProps(el, propsReceived, propsUsed));
  } else if (t.isObjectExpression(node)) {
    node.properties.forEach(prop => {
      if (t.isObjectProperty(prop)) {
        walkExpressionForProps(prop.value, propsReceived, propsUsed);
      } else if (t.isSpreadElement(prop)) {
        walkExpressionForProps(prop.argument, propsReceived, propsUsed);
      }
    });
  }
}

/**
 * Extract child component and props passed to it
 */
function extractChildComponent(jsxPath) {
  const openingElement = jsxPath.node.openingElement;
  if (!openingElement) return null;

  let componentName;
  
  if (t.isJSXIdentifier(openingElement.name)) {
    componentName = openingElement.name.name;
  } else if (t.isJSXMemberExpression(openingElement.name)) {
    componentName = `${openingElement.name.object.name}.${openingElement.name.property.name}`;
  } else {
    return null;
  }

  // Only track custom components (uppercase)
  if (!/^[A-Z]/.test(componentName)) return null;

  const propsPassedDown = [];
  
  openingElement.attributes.forEach(attr => {
    if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
      // Track the prop being passed
      if (attr.value && t.isJSXExpressionContainer(attr.value)) {
        if (t.isIdentifier(attr.value.expression)) {
          // Direct prop: name={name}
          propsPassedDown.push(attr.value.expression.name);
        } else if (t.isMemberExpression(attr.value.expression)) {
          // Member access: name={props.name}
          const obj = attr.value.expression.object;
          if (t.isIdentifier(obj)) {
            propsPassedDown.push(obj.name);
          }
        }
      }
    } else if (t.isJSXSpreadAttribute(attr)) {
      // Handle {...props}
      if (t.isIdentifier(attr.argument)) {
        propsPassedDown.push(`...${attr.argument.name}`);
      }
    }
  });

  return {
    component: componentName,
    propsPassedDown: [...new Set(propsPassedDown)],
    line: openingElement.loc ? openingElement.loc.start.line : 0
  };
}

/**
 * Check if node is a React component
 */
function isReactComponent(node) {
  if (!node.id || !t.isIdentifier(node.id)) return false;
  return /^[A-Z]/.test(node.id.name);
}

/**
 * Check if variable is a React component
 */
function isReactComponentVariable(node) {
  if (!node.id || !t.isIdentifier(node.id)) return false;
  if (!/^[A-Z]/.test(node.id.name)) return false;
  
  return t.isArrowFunctionExpression(node.init) || 
         t.isFunctionExpression(node.init);
}

/**
 * Extract props from function parameters
 */
function extractPropsFromParams(params) {
  const props = [];
  
  if (!params || params.length === 0) return props;
  
  const firstParam = params[0];
  
  if (t.isObjectPattern(firstParam)) {
    // Destructured: ({ prop1, prop2 })
    firstParam.properties.forEach(prop => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        props.push(prop.key.name);
      } else if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
        props.push(`...${prop.argument.name}`);
      }
    });
  } else if (t.isIdentifier(firstParam)) {
    // Named parameter: (props)
    props.push(firstParam.name);
  }
  
  return props;
}

module.exports = {
  parseReactFile
};