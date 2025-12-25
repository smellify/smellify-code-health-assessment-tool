// analyzers/core/ProjectScanner.js
const fs = require('fs').promises;
const path = require('path');

/**
 * ProjectScanner - Scans project directory and finds all analyzable files
 */
class ProjectScanner {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.files = [];
    this.directories = [];
  }

  /**
   * Scan project and return all JS/JSX/TS/TSX files
   * @returns {Promise<Array>} List of file paths
   */
  async scan() {
    try {
      await this.scanDirectory(this.projectPath);
      
      return {
        files: this.files,
        directories: this.directories,
        summary: {
          totalFiles: this.files.length,
          jsFiles: this.files.filter(f => f.endsWith('.js')).length,
          jsxFiles: this.files.filter(f => f.endsWith('.jsx')).length,
          tsFiles: this.files.filter(f => f.endsWith('.ts')).length,
          tsxFiles: this.files.filter(f => f.endsWith('.tsx')).length
        }
      };
    } catch (error) {
      console.error('Error scanning project:', error);
      throw error;
    }
  }

  /**
   * Recursively scan directory
   * @param {string} dirPath - Directory path
   */
  async scanDirectory(dirPath) {
    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        // Skip hidden files and common ignore patterns
        if (this.shouldSkip(item)) {
          continue;
        }

        const fullPath = path.join(dirPath, item);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          this.directories.push(fullPath);
          await this.scanDirectory(fullPath);
        } else if (stats.isFile() && this.isAnalyzableFile(item)) {
          this.files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dirPath}:`, error.message);
    }
  }

  /**
   * Check if item should be skipped
   * @param {string} name - File or directory name
   * @returns {boolean} Should skip
   */
  shouldSkip(name) {
    const skipPatterns = [
      'node_modules',
      '.git',
      '.next',
      '.nuxt',
      'dist',
      'build',
      'coverage',
      '.cache',
      '.DS_Store',
      'Thumbs.db',
      '__pycache__',
      '.pytest_cache',
      '.vscode',
      '.idea'
    ];

    return name.startsWith('.') || skipPatterns.includes(name);
  }

  /**
   * Check if file is analyzable
   * @param {string} filename - File name
   * @returns {boolean} Is analyzable
   */
  isAnalyzableFile(filename) {
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs'];
    const skipSuffixes = ['.test.js', '.spec.js', '.min.js', '.test.jsx', '.spec.jsx'];

    // Skip test and minified files
    if (skipSuffixes.some(suffix => filename.endsWith(suffix))) {
      return false;
    }

    // Check if has valid extension
    return extensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Get relative path from project root
   * @param {string} fullPath - Full file path
   * @returns {string} Relative path
   */
  getRelativePath(fullPath) {
    return path.relative(this.projectPath, fullPath);
  }

  /**
   * Categorize files by type
   * @returns {Object} Categorized files
   */
  categorizeFiles() {
    const categorized = {
      components: [],
      hooks: [],
      utils: [],
      pages: [],
      other: []
    };

    for (const file of this.files) {
      const relativePath = this.getRelativePath(file);
      
      if (relativePath.includes('component')) {
        categorized.components.push(file);
      } else if (relativePath.includes('hook')) {
        categorized.hooks.push(file);
      } else if (relativePath.includes('util')) {
        categorized.utils.push(file);
      } else if (relativePath.includes('page')) {
        categorized.pages.push(file);
      } else {
        categorized.other.push(file);
      }
    }

    return categorized;
  }

  /**
   * Find files matching pattern
   * @param {RegExp|string} pattern - Pattern to match
   * @returns {Array} Matching files
   */
  findFiles(pattern) {
    if (typeof pattern === 'string') {
      return this.files.filter(file => file.includes(pattern));
    } else if (pattern instanceof RegExp) {
      return this.files.filter(file => pattern.test(file));
    }
    return [];
  }
}

module.exports = ProjectScanner;
