const fs = require('fs');
const path = require('path');
const glob = require('fast-glob');
const { extractDefsAndUses } = require('./defUseAnalyzer');
const { buildComponentMap } = require('./componentMapper');
const { buildDUChains, detectDrillingFromDUChains, getDUChainStats } = require('./duChainBuilder');
const { generateSummary, formatDrillingReport, printDrillingIssues } = require('./drillingDetector');

async function analyzePropDrilling(extractedPath) {
  try {
    console.log('Starting Def-Use prop drilling analysis...');

    const reactFiles = await findReactFiles(extractedPath);
    console.log(`Found ${reactFiles.length} React files`);

    if (reactFiles.length === 0) return emptyResult();

    // STEP 1: Extract DEFs and USEs
    console.log('Extracting DEF and USE points...');
    const parsedFiles = reactFiles.map(f => extractDefsAndUses(f));

    // STEP 2: Build component map
    console.log('Building component map...');
    const { componentMap, stats } = buildComponentMap(parsedFiles);
    console.log(`Components: ${stats.totalComponents}, Files: ${stats.totalFiles}`);

    // STEP 3: Build DU chains
    console.log('Building DU chains...');
    const duChains = buildDUChains(componentMap);
    const chainStats = getDUChainStats(duChains);
    console.log(`Built ${duChains.length} DU chains`);

    // STEP 4: Detect drilling
    console.log('Detecting prop drilling via DU chain analysis...');
    const drillingIssues = detectDrillingFromDUChains(duChains);

    const summary = generateSummary(drillingIssues);
    printDrillingIssues(drillingIssues);
    const report = formatDrillingReport(drillingIssues, summary);

    // STEP 5: Save DU snapshots to disk
    const duSnapshotsDir = path.join(extractedPath, '__du_snapshots__');
    await saveDUSnapshots(duSnapshotsDir, {
      duChains,
      chainStats,
      drillingIssues,
      report,
      stats
    });

    return {
      stats: {
        totalFiles: stats.totalFiles,
        totalComponents: stats.totalComponents,
        filesWithErrors: stats.filesWithErrors
      },
      propDrillingIssues: report.issues,
      summary: report.summary,
      duSnapshotsDir,  // expose path so caller can reference it later
      _debug: { duChains, chainStats }
    };

  } catch (err) {
    console.error('Error in DU analysis:', err);
    throw err;
  }
}

/**
 * Save all DU analysis snapshots to disk under __du_snapshots__/
 *
 * Directory structure:
 *   __du_snapshots__/
 *     summary.json          — high-level summary counts
 *     chain_stats.json      — DU chain statistics
 *     all_chains.json       — every DU chain built
 *     drilling_issues.json  — detected prop drilling issues
 *     full_report.json      — complete formatted report
 *     chains/
 *       <prop>__<component>.json  — one file per DU chain for easy lookup
 */
async function saveDUSnapshots(snapshotsDir, { duChains, chainStats, drillingIssues, report, stats }) {
  try {
    // Create base dir and chains subdir
    fs.mkdirSync(snapshotsDir, { recursive: true });
    fs.mkdirSync(path.join(snapshotsDir, 'chains'), { recursive: true });

    // 1. summary.json
    fs.writeFileSync(
      path.join(snapshotsDir, 'summary.json'),
      JSON.stringify({
        savedAt: new Date().toISOString(),
        stats,
        summary: report.summary
      }, null, 2)
    );

    // 2. chain_stats.json
    fs.writeFileSync(
      path.join(snapshotsDir, 'chain_stats.json'),
      JSON.stringify(chainStats, null, 2)
    );

    // 3. all_chains.json — full list of every DU chain
    fs.writeFileSync(
      path.join(snapshotsDir, 'all_chains.json'),
      JSON.stringify(duChains, null, 2)
    );

    // 4. drilling_issues.json — only the detected issues
    fs.writeFileSync(
      path.join(snapshotsDir, 'drilling_issues.json'),
      JSON.stringify(drillingIssues, null, 2)
    );

    // 5. full_report.json — the complete formatted report
    fs.writeFileSync(
      path.join(snapshotsDir, 'full_report.json'),
      JSON.stringify(report, null, 2)
    );

    // 6. Individual chain files — one per (prop, component) pair for easy lookup
    duChains.forEach(chain => {
      // Sanitize for use as filename
      const safeProp = chain.prop.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeComp = (chain.def?.component || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeProp}__${safeComp}.json`;

      fs.writeFileSync(
        path.join(snapshotsDir, 'chains', filename),
        JSON.stringify(chain, null, 2)
      );
    });

    console.log(`✅ DU snapshots saved to: ${snapshotsDir}`);
    console.log(`   - ${duChains.length} chain files`);
    console.log(`   - ${drillingIssues.length} drilling issues`);

  } catch (err) {
    // Non-fatal — log but don't crash the analysis
    console.warn('⚠️  Could not save DU snapshots:', err.message);
  }
}

/**
 * Load a previously saved DU snapshot by project path
 */
async function loadDUSnapshot(extractedPath) {
  const snapshotsDir = path.join(extractedPath, '__du_snapshots__');

  if (!fs.existsSync(snapshotsDir)) {
    return null;
  }

  try {
    const summary     = JSON.parse(fs.readFileSync(path.join(snapshotsDir, 'summary.json'),         'utf-8'));
    const chainStats  = JSON.parse(fs.readFileSync(path.join(snapshotsDir, 'chain_stats.json'),     'utf-8'));
    const allChains   = JSON.parse(fs.readFileSync(path.join(snapshotsDir, 'all_chains.json'),      'utf-8'));
    const issues      = JSON.parse(fs.readFileSync(path.join(snapshotsDir, 'drilling_issues.json'), 'utf-8'));
    const fullReport  = JSON.parse(fs.readFileSync(path.join(snapshotsDir, 'full_report.json'),     'utf-8'));

    return {
      snapshotsDir,
      summary,
      chainStats,
      allChains,
      issues,
      fullReport
    };
  } catch (err) {
    console.warn('⚠️  Could not load DU snapshot:', err.message);
    return null;
  }
}

/**
 * Load a single chain snapshot by prop name and component name
 */
async function loadChainSnapshot(extractedPath, prop, component) {
  const safeProp = prop.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeComp = component.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = path.join(extractedPath, '__du_snapshots__', 'chains', `${safeProp}__${safeComp}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.warn('⚠️  Could not load chain snapshot:', err.message);
    return null;
  }
}

function emptyResult() {
  return {
    stats: { totalFiles: 0, totalComponents: 0, filesWithErrors: 0 },
    propDrillingIssues: [],
    summary: {
      totalIssues: 0, highSeverity: 0, mediumSeverity: 0, lowSeverity: 0,
      affectedProps: 0, affectedFiles: 0, deepestChain: 0, totalDrillingPoints: 0
    },
    duSnapshotsDir: null
  };
}

async function findReactFiles(projectPath) {
  return glob(['**/*.{js,jsx,tsx}', '!**/node_modules/**', '!**/build/**',
               '!**/dist/**', '!**/.next/**', '!**/*.test.{js,jsx,tsx}'], {
    cwd: projectPath, absolute: true
  });
}


async function getAnalysisHistory(req, res) {
  try {
    const userId = req.user?._id;
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const query = userId ? { userId } : {};

    const analyses = await Project.find(query)
      .sort({ 'propDrillingAnalysis.completedAt': -1 })
      .skip(skip)
      .limit(limit)
      .select('projectName propDrillingAnalysis.status propDrillingAnalysis.results.summary propDrillingAnalysis.completedAt');

    const total = await Project.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: analyses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching analysis history:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching analysis history',
      error: error.message
    });
  }
}

/**
 * Get a specific analysis by ID
 */
async function getAnalysisById(req, res) {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .select('projectName propDrillingAnalysis');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.propDrillingAnalysis || project.propDrillingAnalysis.status !== 'completed') {
      return res.status(404).json({
        success: false,
        message: 'Prop drilling analysis not available for this project'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        projectName: project.projectName,
        analysis: project.propDrillingAnalysis
      }
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching analysis',
      error: error.message
    });
  }
}

/**
 * Delete an analysis by ID
 */
async function deleteAnalysis(req, res) {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Clear prop drilling analysis data
    project.propDrillingAnalysis = {
      status: 'pending',
      results: {}
    };

    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Prop drilling analysis deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting analysis',
      error: error.message
    });
  }
}

module.exports = {
  analyzePropDrilling,
  loadDUSnapshot,
  loadChainSnapshot,
  getAnalysisHistory,
  getAnalysisById,
  deleteAnalysis
};
