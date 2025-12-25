// services/chainBuilder.js
const { findComponent } = require('./componentMapper');

/**
 * Build all prop flow chains for the entire project
 */
function buildAllPropChains(componentMap) {
  const allChains = [];
  const processedChains = new Set();

  Object.values(componentMap).forEach(component => {
    component.propsReceived.forEach(prop => {
      // Skip special props
      if (prop === 'children' || shouldSkipProp(prop)) {
        return;
      }

      const chain = buildPropChain(prop, component.name, componentMap);
      
      if (chain.length >= 2) {
        const chainKey = generateChainKey(prop, chain);
        
        if (!processedChains.has(chainKey)) {
          allChains.push({
            prop,
            chain
          });
          processedChains.add(chainKey);
        }
      }
    });
  });

  return allChains;
}

/**
 * Check if we should skip this prop
 */
function shouldSkipProp(prop) {
  // Skip spread props in the main prop list
  if (prop.startsWith('...')) return true;
  return false;
}

/**
 * Build a prop flow chain starting from a specific component
 */
function buildPropChain(prop, componentName, componentMap, chain = [], visited = new Set()) {
  if (visited.has(componentName)) {
    return chain;
  }
  visited.add(componentName);

  const component = findComponent(componentMap, componentName);
  
  if (!component) {
    return chain;
  }

  // Check if prop is used in this component
  const usedHere = isPropUsedHere(prop, component);

  // Find which child this prop is passed to BEFORE creating the node
  const passedToChild = findChildReceivingProp(prop, component);
  
  const chainNode = {
    component: component.name,
    file: component.file,
    line: component.line,
    usedHere: usedHere,
    passedTo: passedToChild || null  // Store the child component name
  };

  chain.push(chainNode);

  // If prop is passed to a child, continue the chain
  if (passedToChild) {
    buildPropChain(prop, passedToChild, componentMap, chain, visited);
  }

  return chain;
}

/**
 * Check if a prop is actually used in the component
 */
function isPropUsedHere(prop, component) {
  // Handle spread props
  if (prop.startsWith('...')) {
    const propName = prop.substring(3);
    return component.propsUsedLocally.includes(propName) || 
           component.propsUsedLocally.includes(`...${propName}`);
  }
  
  return component.propsUsedLocally.includes(prop);
}

/**
 * Find which child component receives this prop
 */
function findChildReceivingProp(prop, component) {
  for (const child of component.childrenRendered) {
    // Check for exact prop match
    if (child.propsPassedDown.includes(prop)) {
      return child.component;
    }
    
    // Check for spread props (...props, ...rest, etc.)
    for (const passedProp of child.propsPassedDown) {
      if (passedProp.startsWith('...')) {
        // This child receives props via spread
        const spreadPropName = passedProp.substring(3);
        
        // If the component receives this prop or has spread props
        if (component.propsReceived.includes(spreadPropName) ||
            component.propsReceived.includes(`...${spreadPropName}`) ||
            component.propsReceived.includes(prop)) {
          return child.component;
        }
      }
    }
  }
  
  return null;
}

/**
 * Generate a unique key for a chain
 */
function generateChainKey(prop, chain) {
  const components = chain.map(node => node.component).join('->');
  return `${prop}:${components}`;
}

/**
 * Find root components
 */
function findRootComponents(componentMap) {
  const allComponents = new Set(Object.keys(componentMap));
  const childComponents = new Set();

  Object.values(componentMap).forEach(component => {
    component.childrenRendered.forEach(child => {
      childComponents.add(child.component);
    });
  });

  const roots = [];
  allComponents.forEach(componentName => {
    if (!childComponents.has(componentName)) {
      roots.push(componentName);
    }
  });

  return roots;
}

/**
 * Build chains starting only from root components
 */
function buildChainsFromRoots(componentMap) {
  const rootComponents = findRootComponents(componentMap);
  const allChains = [];
  const processedChains = new Set();

  rootComponents.forEach(rootName => {
    const rootComponent = findComponent(componentMap, rootName);
    if (!rootComponent) return;

    rootComponent.propsReceived.forEach(prop => {
      if (prop === 'children' || shouldSkipProp(prop)) {
        return;
      }

      const chain = buildPropChain(prop, rootName, componentMap);
      
      if (chain.length >= 2) {
        const chainKey = generateChainKey(prop, chain);
        
        if (!processedChains.has(chainKey)) {
          allChains.push({
            prop,
            chain,
            startsFromRoot: true
          });
          processedChains.add(chainKey);
        }
      }
    });
  });

  return allChains;
}

/**
 * Get chain statistics
 */
function getChainStats(chains) {
  return {
    totalChains: chains.length,
    averageDepth: chains.reduce((sum, c) => sum + c.chain.length, 0) / chains.length || 0,
    maxDepth: Math.max(...chains.map(c => c.chain.length), 0),
    uniqueProps: new Set(chains.map(c => c.prop)).size
  };
}

module.exports = {
  buildAllPropChains,
  buildPropChain,
  buildChainsFromRoots,
  findRootComponents,
  getChainStats
};