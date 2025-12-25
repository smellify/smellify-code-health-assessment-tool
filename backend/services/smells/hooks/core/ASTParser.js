// analyzers/core/ASTParser.js
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs').promises;

/**
 * ASTParser - Parses JavaScript/JSX/TypeScript files into AST
 * Handles various file types and provides unified AST interface
 */
class ASTParser {
  constructor() {
    this.parserOptions = {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'classProperties',
        'decorators-legacy',
        'dynamicImport',
        'objectRestSpread',
        'asyncGenerators',
        'optionalChaining',
        'nullishCoalescingOperator'
      ]
    };
  }

  /**
   * Parse a file and return its AST
   * @param {string} filePath - Path to the file
   * @returns {Promise<Object>} AST and metadata
   */
  async parseFile(filePath) {
    try {
      const code = await fs.readFile(filePath, 'utf-8');
      return this.parseCode(code, filePath);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error.message);
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }

  /**
   * Parse code string and return AST
   * @param {string} code - Source code
   * @param {string} filePath - File path (for error reporting)
   * @returns {Object} AST and metadata
   */
  parseCode(code, filePath = 'unknown') {
    try {
      const ast = parser.parse(code, this.parserOptions);
      
      return {
        ast,
        code,
        filePath,
        lines: code.split('\n'),
        success: true
      };
    } catch (error) {
      console.error(`Parse error in ${filePath}:`, error.message);
      
      return {
        ast: null,
        code,
        filePath,
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Get line and column from AST node location
   * @param {Object} node - AST node
   * @returns {Object} Location info
   */
  getNodeLocation(node) {
    if (!node || !node.loc) {
      return { line: 0, column: 0 };
    }
    
    return {
      line: node.loc.start.line,
      column: node.loc.start.column,
      endLine: node.loc.end.line,
      endColumn: node.loc.end.column
    };
  }

  /**
   * Extract code snippet from node
   * @param {string} code - Full source code
   * @param {Object} node - AST node
   * @param {number} contextLines - Lines of context before/after
   * @returns {string} Code snippet
   */
  getCodeSnippet(code, node, contextLines = 2) {
    if (!node || !node.loc) {
      return '';
    }

    const lines = code.split('\n');
    const startLine = Math.max(0, node.loc.start.line - 1 - contextLines);
    const endLine = Math.min(lines.length, node.loc.end.line + contextLines);
    
    const snippet = lines.slice(startLine, endLine);
    
    // Add line numbers
    return snippet.map((line, idx) => {
      const lineNum = startLine + idx + 1;
      const marker = (lineNum >= node.loc.start.line && lineNum <= node.loc.end.line) ? '→' : ' ';
      return `${marker} ${lineNum.toString().padStart(4)} | ${line}`;
    }).join('\n');
  }

  /**
   * Traverse AST with visitor pattern
   * @param {Object} ast - AST to traverse
   * @param {Object} visitors - Visitor functions
   */
  traverse(ast, visitors) {
    traverse(ast, visitors);
  }

  /**
   * Check if file should be analyzed
   * @param {string} filePath - File path
   * @returns {boolean} Should analyze
   */
  shouldAnalyzeFile(filePath) {
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs'];
    const skipPatterns = [
      'node_modules',
      '.test.js',
      '.spec.js',
      '.min.js',
      'dist/',
      'build/',
      'coverage/',
      '.next/',
      '__tests__'
    ];

    // Check extension
    if (!extensions.some(ext => filePath.endsWith(ext))) {
      return false;
    }

    // Check skip patterns
    if (skipPatterns.some(pattern => filePath.includes(pattern))) {
      return false;
    }

    return true;
  }
}

module.exports = ASTParser;
