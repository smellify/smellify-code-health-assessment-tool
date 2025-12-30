function buildDUChains(componentMap) {
  const chains = [];
  const visited = new Set();

  Object.values(componentMap).forEach(component => {
    component.defs.forEach(def => {
      if (def.prop === 'children' || def.prop.startsWith('...')) return;

      const chainKey = `${def.prop}::${def.component}`;
      if (visited.has(chainKey)) return;
      visited.add(chainKey);

      const chain = buildSingleDUChain(def.prop, component, componentMap, new Set());
      if (chain) chains.push(chain);
    });
  });

  return chains;
}


function buildSingleDUChain(prop, component, componentMap, visited) {
  if (visited.has(component.name)) return null;
  visited.add(component.name);

  // Gather all uses of this prop in this component
  const localUses = component.uses.filter(u => u.prop === prop);

  // Find if this prop is forwarded to a child (becomes a new DEF there)
  const forwarded = component.forwardedProps.find(f => f.prop === prop);
  let nextChain = null;

  if (forwarded) {
    const childComponent = findComponentByName(componentMap, forwarded.passedTo);
    if (childComponent) {
      nextChain = buildSingleDUChain(prop, childComponent, componentMap, visited);
    }
  }

  return {
    prop,
    def: {
      component: component.name,
      file: component.file,
      line: component.line
    },
    uses: localUses,       // C-USEs and P-USEs at this DEF point
    next: nextChain        // Next DEF in the chain (forwarded-to child)
  };
}

/**
 * Flatten a linked DU chain into an array of nodes for easier processing
 * Returns: Array<{ def, uses, hasLocalUse }>
 */
function flattenDUChain(chain) {
  const nodes = [];
  let current = chain;
  while (current) {
    nodes.push({
      def: current.def,
      uses: current.uses,
      hasLocalUse: current.uses.some(u =>
        u.useType === 'C-USE' || u.useType === 'P-USE'
      )
    });
    current = current.next;
  }
  return nodes;
}

/**
 * Detect prop drilling from DU chains
 *
 * DRILLING DEFINITION (formal):
 * A DU chain exhibits prop drilling when:
 *   1. Chain length >= 3 DEF nodes
 *   2. At least one intermediate DEF node has NO C-USE or P-USE
 *      (the prop is defined there but never used — only re-forwarded)
 */
function detectDrillingFromDUChains(duChains) {
  const issues = [];

  duChains.forEach(chain => {
    const nodes = flattenDUChain(chain);

    // Rule 1: need at least 3 components in the chain
    if (nodes.length < 3) return;

    // Rule 2: at least one intermediate node has no local use
    const intermediates = nodes.slice(1, -1);
    const drillingNodes = intermediates.filter(n => !n.hasLocalUse);
    if (drillingNodes.length === 0) return;

    // Build the formal DU chain report
    const depth = nodes.length;
    const severity = computeSeverity(depth, drillingNodes.length);

    issues.push({
      prop: chain.prop,
      severity,
      depth,

      // The full DU chain as a flat array
      duChain: nodes,

      // Precise drilling locations (DEF nodes with no USE)
      drillingNodes: drillingNodes.map(n => ({
        component: n.def.component,
        file: n.def.file,
        line: n.def.line,
        cUses: n.uses.filter(u => u.useType === 'C-USE'),
        pUses: n.uses.filter(u => u.useType === 'P-USE'),
        issue: 'DEF_WITHOUT_USE', // Formal: definition with no reaching use
        description: `"${n.def.component}" defines prop "${chain.prop}" (receives it) but has no C-USE or P-USE — it only re-forwards the prop`
      })),

      // Source DEF and final USE
      sourceDef: nodes[0].def,
      finalDef: nodes[nodes.length - 1].def,
      finalUses: nodes[nodes.length - 1].uses,

      recommendation: generateRecommendation(chain.prop, nodes)
    });
  });

  // Sort: high → medium → low, then by depth
  const order = { high: 3, medium: 2, low: 1 };
  issues.sort((a, b) => {
    const diff = order[b.severity] - order[a.severity];
    return diff !== 0 ? diff : b.depth - a.depth;
  });

  return issues;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function findComponentByName(componentMap, name) {
  if (componentMap[name]) return componentMap[name];
  return Object.values(componentMap).find(c => c.name === name) || null;
}

// function computeSeverity(depth, drillingCount) {
//   if (depth >= 5 || drillingCount >= 3) return 'high';
//   if (depth === 4 || drillingCount === 2) return 'medium';
//   return 'low';
// }

function computeSeverity(depth, drillingCount) {
  // depth >= 5 OR 3+ components with no use = high
  if (depth >= 5 || drillingCount >= 3) return 'high';

  // depth 4 OR 2 drilling nodes = medium  
  if (depth === 4 || drillingCount === 2) return 'medium';

  // depth 3 with at least 1 drilling node = medium (not low)
  if (depth === 3 && drillingCount >= 1) return 'medium';

  // depth 3 with no drilling nodes, or depth < 3 = low
  return 'low';
}

function generateRecommendation(prop, nodes) {
  const drillingCount = nodes.filter(n => !n.hasLocalUse && nodes.indexOf(n) > 0 && nodes.indexOf(n) < nodes.length - 1).length;
  const intermediateNames = nodes.slice(1, -1).map(n => n.def.component).join(', ');

  if (nodes.length >= 4) {
    return {
      solution: 'React Context API or State Management',
      reason: `Prop "${prop}" has ${drillingCount} DEF node(s) with no C-USE or P-USE. The DU chain spans ${nodes.length} components.`,
      steps: [
        `Create a context: const ${capitalize(prop)}Context = React.createContext()`,
        `Provide at "${nodes[0].def.component}"`,
        `Consume with useContext in "${nodes[nodes.length - 1].def.component}"`,
        `Remove prop threading through: ${intermediateNames}`
      ]
    };
  }
  return {
    solution: 'Component Composition',
    reason: `Short DU chain (${nodes.length} nodes). Consider restructuring component hierarchy.`,
    steps: [
      `Check if "${nodes[nodes.length - 1].def.component}" can be composed into "${nodes[0].def.component}" directly`,
      `Or use render props / children to avoid threading`
    ]
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getDUChainStats(chains) {
  const flat = chains.map(c => flattenDUChain(c));
  return {
    totalChains: chains.length,
    averageDepth: flat.reduce((s, n) => s + n.length, 0) / (flat.length || 1),
    maxDepth: Math.max(...flat.map(n => n.length), 0),
    uniqueProps: new Set(chains.map(c => c.prop)).size
  };
}

module.exports = {
  buildDUChains,
  flattenDUChain,
  detectDrillingFromDUChains,
  getDUChainStats
};