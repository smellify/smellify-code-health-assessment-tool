function detectPropDrilling(chains) {
  const drillingIssues = [];

  chains.forEach(({ prop, chain }) => {
    const issue = analyzePropChain(prop, chain);
    
    if (issue) {
      drillingIssues.push(issue);
    }
  });

  // Sort by severity (high -> medium -> low) and then by depth
  drillingIssues.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    
    if (severityDiff !== 0) return severityDiff;
    return b.depth - a.depth;
  });

  return drillingIssues;
}

/**
 * Analyze a single prop chain to determine if it's prop drilling
 */
function analyzePropChain(prop, chain) {
  // Rule 1: Chain must be at least 3 components long
  if (chain.length < 3) {
    return null;
  }

  // Rule 2: At least one intermediate component must NOT use the prop
  const intermediateComponents = chain.slice(1, -1);
  const hasUnusedIntermediate = intermediateComponents.some(node => !node.usedHere);

  if (!hasUnusedIntermediate) {
    return null;
  }

  const depth = chain.length;
  const severity = calculateSeverity(depth, intermediateComponents);

  // NEW: Extract specific drilling locations
  const drillingLocations = identifyDrillingLocations(chain);

  return {
    prop,
    severity,
    depth,
    chain,
    drillingLocations, // NEW: Precise locations where drilling occurs
    recommendation: generateRecommendation(prop, chain) // NEW: Actionable advice
  };
}

/**
 * NEW: Identify exact locations where prop drilling occurs
 */
function identifyDrillingLocations(chain) {
  const locations = [];

  chain.forEach((node, index) => {
    // Check if this is an intermediate component that just forwards
    if (index > 0 && index < chain.length - 1 && !node.usedHere) {
      locations.push({
        component: node.component,
        file: node.file,
        line: node.line,
        issue: 'FORWARDING_ONLY',
        description: `Component "${node.component}" receives the prop but only forwards it without using it`,
        passedTo: node.passedTo || 'unknown'
      });
    }
  });

  // Also identify the source and destination
  const source = chain[0];
  const destination = chain[chain.length - 1];

  return {
    drillingPoints: locations,
    source: {
      component: source.component,
      file: source.file,
      line: source.line
    },
    finalDestination: {
      component: destination.component,
      file: destination.file,
      line: destination.line,
      usedHere: destination.usedHere
    }
  };
}

/**
 * NEW: Generate actionable recommendations
 */
function generateRecommendation(prop, chain) {
  const intermediateComponents = chain.slice(1, -1);
  const unusedCount = intermediateComponents.filter(node => !node.usedHere).length;

  if (chain.length >= 4) {
    return {
      solution: 'Context API or State Management',
      reason: `Prop "${prop}" passes through ${unusedCount} intermediate component(s). Consider using React Context or a state management library like Redux/Zustand.`,
      steps: [
        `Create a context for "${prop}"`,
        `Provide the context at "${chain[0].component}"`,
        `Consume directly in "${chain[chain.length - 1].component}"`,
        `Remove prop from intermediate components: ${intermediateComponents.map(n => n.component).join(', ')}`
      ]
    };
  } else {
    return {
      solution: 'Component Composition',
      reason: `Short drilling chain. Consider component composition or lifting shared logic.`,
      steps: [
        `Consider if "${chain[chain.length - 1].component}" can be composed differently`,
        `Or create a wrapper component to avoid prop threading`
      ]
    };
  }
}

/**
 * Calculate severity based on depth and usage pattern
 */
// function calculateSeverity(depth, intermediateComponents) {
//   const unusedCount = intermediateComponents.filter(node => !node.usedHere).length;
//   const unusedRatio = unusedCount / intermediateComponents.length;

//   if (depth >= 4) {
//     return 'high';
//   } else if (depth === 3) {
//     return unusedRatio > 0.5 ? 'medium' : 'low';
//   } else {
//     return 'low';
//   }
// }

function calculateSeverity(depth, intermediateComponents) {
  const unusedCount = intermediateComponents.filter(node => !node.usedHere).length;

  if (depth >= 5 || unusedCount >= 3) return 'high';
  if (depth === 4 || unusedCount === 2) return 'medium';
  if (depth === 3 && unusedCount >= 1) return 'medium';
  return 'low';
}

/**
 * Generate summary statistics for drilling issues
 */
function generateSummary(drillingIssues) {
  const summary = {
    totalIssues: drillingIssues.length,
    highSeverity: 0,
    mediumSeverity: 0,
    lowSeverity: 0,
    affectedProps: new Set(),
    affectedFiles: new Set(),
    deepestChain: 0,
    totalDrillingPoints: 0
  };

  drillingIssues.forEach(issue => {
    // Severity counts
    if (issue.severity === 'high') summary.highSeverity++;
    else if (issue.severity === 'medium') summary.mediumSeverity++;
    else summary.lowSeverity++;

    // Affected props
    summary.affectedProps.add(issue.prop);

    // Affected files — iterate duChain nodes instead of old chain
    const nodes = issue.duChain || [];
    nodes.forEach(node => {
      if (node.def?.file) {
        summary.affectedFiles.add(node.def.file);
      }
    });

    // Deepest chain
    if (issue.depth > summary.deepestChain) {
      summary.deepestChain = issue.depth;
    }

    // Total drilling points — use drillingNodes instead of old drillingLocations
    summary.totalDrillingPoints += (issue.drillingNodes || []).length;
  });

  summary.affectedProps = summary.affectedProps.size;
  summary.affectedFiles = summary.affectedFiles.size;

  return summary;
}


/**
 * ENHANCED: Format drilling issues with precise location details
 */
function formatDrillingReport(drillingIssues, summary) {
  return {
    summary: {
      totalIssues: summary.totalIssues,
      highSeverity: summary.highSeverity,
      mediumSeverity: summary.mediumSeverity,
      lowSeverity: summary.lowSeverity,
      affectedProps: summary.affectedProps,
      affectedFiles: summary.affectedFiles,
      deepestChain: summary.deepestChain,
      totalDrillingPoints: summary.totalDrillingPoints
    },
    issues: drillingIssues.map(issue => ({
      prop: issue.prop,
      severity: issue.severity,
      depth: issue.depth,

      locations: {
        source: issue.sourceDef,
        drillingPoints: issue.drillingNodes,
        finalDestination: {
          ...issue.finalDef,
          uses: issue.finalUses || []
        }
      },

      recommendation: issue.recommendation,

      // Full DU chain for reference
      fullChain: (issue.duChain || []).map(node => ({
        component: node.def.component,
        file: node.def.file,
        line: node.def.line,
        hasLocalUse: node.hasLocalUse,
        cUses: (node.uses || []).filter(u => u.useType === 'C-USE'),
        pUses: (node.uses || []).filter(u => u.useType === 'P-USE')
      }))
    }))
  };
}

/**
 * ENHANCED: Print drilling issues with clear location info
 */
function printDrillingIssues(drillingIssues) {
  

  if (drillingIssues.length === 0) {
    console.log('✅ No prop drilling detected!\n');
    return;
  }

  console.log(`Found ${drillingIssues.length} prop drilling issue(s):\n`);

  drillingIssues.forEach((issue, index) => {
    const emoji = { high: '🔴', medium: '🟡', low: '🟢' };

    console.log(`\n${'='.repeat(70)}`);
    console.log(`${index + 1}. ${emoji[issue.severity]} ${issue.severity.toUpperCase()} | Prop: "${issue.prop}" | Depth: ${issue.depth}`);
    console.log(`${'='.repeat(70)}`);

    // Source DEF
    console.log(`\n🏁 SOURCE DEF:`);
    console.log(`   ${issue.sourceDef.component} @ ${issue.sourceDef.file}:${issue.sourceDef.line}`);

    // DU Chain walkthrough
    console.log(`\n�chain DU CHAIN (${issue.depth} nodes):`);
    (issue.duChain || []).forEach((node, i) => {
      const useLabel = node.hasLocalUse
        ? `✅ has ${node.uses.length} use(s)`
        : `❌ NO USE — DEF_WITHOUT_USE`;
      console.log(`   ${i + 1}. ${node.def.component} → ${useLabel}`);
    });

    // Drilling nodes (DEF without USE)
    if (issue.drillingNodes?.length > 0) {
      console.log(`\n⚠️  DRILLING NODES (DEF without C-USE or P-USE):`);
      issue.drillingNodes.forEach((n, i) => {
        console.log(`   ${i + 1}. ${n.component} @ ${n.file}:${n.line}`);
        console.log(`      ↳ ${n.description}`);
      });
    }

    // Final destination
    console.log(`\n🎯 FINAL DEF:`);
    console.log(`   ${issue.finalDef.component} @ ${issue.finalDef.file}:${issue.finalDef.line}`);
    console.log(`   Uses here: ${issue.finalUses?.length || 0}`);

    // Recommendation
    console.log(`\n💡 ${issue.recommendation.solution}`);
    issue.recommendation.steps.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
  });

  console.log(`\n${'='.repeat(70)}\n`);
}

/**
 * Filter drilling issues by severity
 */
function filterBySeverity(drillingIssues, severity) {
  return drillingIssues.filter(issue => issue.severity === severity);
}

/**
 * Get top N most severe drilling issues
 */
function getTopIssues(drillingIssues, limit = 10) {
  return drillingIssues.slice(0, limit);
}

module.exports = {
  detectPropDrilling,
  analyzePropChain,
  generateSummary,
  filterBySeverity,
  getTopIssues,
  formatDrillingReport,
  printDrillingIssues
};