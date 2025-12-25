// analyzers/core/AnalyzerBase.js

/**
 * AnalyzerBase - Base class for all analyzers
 * Provides common functionality and interface
 */
class AnalyzerBase {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.violations = [];
    this.stats = {
      filesAnalyzed: 0,
      violationsFound: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Start analysis timer
   */
  start() {
    this.stats.startTime = Date.now();
    this.violations = [];
  }

  /**
   * End analysis timer
   */
  end() {
    this.stats.endTime = Date.now();
    this.stats.violationsFound = this.violations.length;
  }

  /**
   * Get analysis duration in milliseconds
   * @returns {number} Duration
   */
  getDuration() {
    if (!this.stats.startTime || !this.stats.endTime) {
      return 0;
    }
    return this.stats.endTime - this.stats.startTime;
  }

  /**
   * Add a violation
   * @param {Object} violation - Violation details
   */
  addViolation(violation) {
    const violationWithId = {
      id: `${this.name}-${this.violations.length + 1}`,
      analyzer: this.name,
      timestamp: new Date().toISOString(),
      ...violation
    };

    this.violations.push(violationWithId);
    this.stats.violationsFound++;
  }

  /**
   * Get all violations
   * @returns {Array} Violations
   */
  getViolations() {
    return this.violations;
  }

  /**
   * Get violations by severity
   * @param {string} severity - Severity level
   * @returns {Array} Filtered violations
   */
  getViolationsBySeverity(severity) {
    return this.violations.filter(v => v.severity === severity);
  }

  /**
   * Get violations by file
   * @param {string} filePath - File path
   * @returns {Array} Filtered violations
   */
  getViolationsByFile(filePath) {
    return this.violations.filter(v => v.file === filePath);
  }

  /**
   * Get summary statistics
   * @returns {Object} Summary
   */
  getSummary() {
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    for (const violation of this.violations) {
      if (severityCounts.hasOwnProperty(violation.severity)) {
        severityCounts[violation.severity]++;
      }
    }

    return {
      analyzer: this.name,
      description: this.description,
      filesAnalyzed: this.stats.filesAnalyzed,
      totalViolations: this.stats.violationsFound,
      severityBreakdown: severityCounts,
      duration: this.getDuration(),
      durationFormatted: `${(this.getDuration() / 1000).toFixed(2)}s`
    };
  }

  /**
   * Clear all violations and reset stats
   */
  reset() {
    this.violations = [];
    this.stats = {
      filesAnalyzed: 0,
      violationsFound: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Main analyze method - must be implemented by subclasses
   * @param {Object} astResult - Parsed AST result
   * @param {Object} context - Analysis context
   */
  analyze(astResult, context) {
    throw new Error('analyze() must be implemented by subclass');
  }

  /**
   * Format violation for output
   * @param {Object} violation - Raw violation
   * @returns {Object} Formatted violation
   */
  formatViolation(violation) {
    return {
      ...violation,
      formattedMessage: this.formatMessage(violation)
    };
  }

  /**
   * Format violation message
   * @param {Object} violation - Violation
   * @returns {string} Formatted message
   */
  formatMessage(violation) {
    return `[${violation.severity.toUpperCase()}] ${violation.type} in ${violation.file}:${violation.line}`;
  }
}

module.exports = AnalyzerBase;
