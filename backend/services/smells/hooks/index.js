// analyzers/index.js
const ProjectScanner = require('./core/ProjectScanner');
const ASTParser = require('./core/ASTParser');
const FileResolver = require('./core/FileResolver');
const HookDetector = require('./hooks/HookDetector');

/**
 * MainAnalyzer - Orchestrates all analyzers and produces final report
 */
class MainAnalyzer {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.scanner = new ProjectScanner(projectPath);
    this.parser = new ASTParser();
    this.fileResolver = new FileResolver(projectPath);
    
    // Initialize analyzers
    this.analyzers = [
      new HookDetector()
    ];
  }

  /**
   * Run complete analysis on project
   * @returns {Promise<Object>} Analysis results
   */
  async analyze() {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Starting project analysis...');
      
      // Step 1: Scan project for files
      console.log('📁 Scanning project files...');
      const scanResult = await this.scanner.scan();
      console.log(`✓ Found ${scanResult.files.length} files to analyze`);

      // Step 2: Parse all files to AST
      console.log('🔧 Parsing files to AST...');
      const parseResults = await this.parseAllFiles(scanResult.files);
      console.log(`✓ Successfully parsed ${parseResults.filter(r => r.success).length}/${parseResults.length} files`);

      // Step 3: Build import/export graph
      console.log('🔗 Building dependency graph...');
      this.fileResolver.buildGraph(scanResult.files, parseResults);
      console.log('✓ Dependency graph built');

      // Step 4: Run all analyzers
      console.log('🔍 Running analyzers...');
      await this.runAnalyzers(parseResults);
      console.log('✓ Analysis complete');

      // Step 5: Generate report
      const report = this.generateReport(scanResult, parseResults, startTime);
      
      return report;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  /**
   * Parse all files to AST
   * @param {Array} files - File paths
   * @returns {Promise<Array>} Parse results
   */
  async parseAllFiles(files) {
    const results = [];
    
    for (const file of files) {
      if (this.parser.shouldAnalyzeFile(file)) {
        try {
          const result = await this.parser.parseFile(file);
          results.push(result);
        } catch (error) {
          console.warn(`⚠ Failed to parse ${file}:`, error.message);
          results.push({
            filePath: file,
            success: false,
            error: error.message
          });
        }
      }
    }

    return results;
  }

  /**
   * Run all registered analyzers
   * @param {Array} parseResults - Parsed AST results
   */
  async runAnalyzers(parseResults) {
    const context = {
      fileResolver: this.fileResolver,
      projectPath: this.projectPath
    };

    for (const analyzer of this.analyzers) {
      console.log(`  → Running ${analyzer.name}...`);
      analyzer.start();

      for (const parseResult of parseResults) {
        if (parseResult.success) {
          analyzer.analyze(parseResult, context);
        }
      }

      analyzer.end();
      console.log(`  ✓ ${analyzer.name}: ${analyzer.stats.violationsFound} violations found`);
    }
  }

  /**
   * Generate comprehensive analysis report
   * @param {Object} scanResult - Scan results
   * @param {Array} parseResults - Parse results
   * @param {number} startTime - Start timestamp
   * @returns {Object} Report
   */
  generateReport(scanResult, parseResults, startTime) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Collect all violations from analyzers
    const allViolations = [];
    const analyzerSummaries = [];

    for (const analyzer of this.analyzers) {
      allViolations.push(...analyzer.getViolations());
      analyzerSummaries.push(analyzer.getSummary());
    }

    // Calculate severity breakdown
    const severityBreakdown = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const violation of allViolations) {
      if (severityBreakdown.hasOwnProperty(violation.severity)) {
        severityBreakdown[violation.severity]++;
      }
    }

    // Group violations by file
    const violationsByFile = {};
    for (const violation of allViolations) {
      if (!violationsByFile[violation.file]) {
        violationsByFile[violation.file] = [];
      }
      violationsByFile[violation.file].push(violation);
    }

    // Group violations by type
    const violationsByType = {};
    for (const violation of allViolations) {
      if (!violationsByType[violation.type]) {
        violationsByType[violation.type] = [];
      }
      violationsByType[violation.type].push(violation);
    }

    const report = {
      metadata: {
        projectPath: this.projectPath,
        analyzedAt: new Date().toISOString(),
        duration: duration,
        durationFormatted: `${(duration / 1000).toFixed(2)}s`,
        version: '1.0.0'
      },
      summary: {
        totalFiles: scanResult.files.length,
        filesAnalyzed: parseResults.filter(r => r.success).length,
        filesFailed: parseResults.filter(r => !r.success).length,
        totalViolations: allViolations.length,
        violationsBySeverity: severityBreakdown,
        violationsByType: Object.keys(violationsByType).reduce((acc, type) => {
          acc[type] = violationsByType[type].length;
          return acc;
        }, {})
      },
      violations: allViolations.sort((a, b) => {
        // Sort by severity then by file
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return a.file.localeCompare(b.file);
      }),
      violationsByFile,
      violationsByType,
      analyzers: analyzerSummaries,
      fileBreakdown: {
        byExtension: scanResult.summary,
        totalScanned: scanResult.files.length
      }
    };

    return report;
  }

  /**
   * Get violations for specific file
   * @param {string} filePath - File path
   * @returns {Array} Violations
   */
  getViolationsForFile(filePath) {
    const violations = [];
    
    for (const analyzer of this.analyzers) {
      violations.push(...analyzer.getViolationsByFile(filePath));
    }

    return violations;
  }

  /**
   * Get violations by severity
   * @param {string} severity - Severity level
   * @returns {Array} Violations
   */
  getViolationsBySeverity(severity) {
    const violations = [];
    
    for (const analyzer of this.analyzers) {
      violations.push(...analyzer.getViolationsBySeverity(severity));
    }

    return violations;
  }
}

module.exports = MainAnalyzer;
