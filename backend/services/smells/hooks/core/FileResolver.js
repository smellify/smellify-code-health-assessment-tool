// analyzers/core/FileResolver.js
const path = require('path');
const fs = require('fs').promises;

/**
 * FileResolver - Resolves import/export statements and builds dependency graph
 */
class FileResolver {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.importGraph = new Map(); // file -> imports
    this.exportGraph = new Map(); // file -> exports
    this.resolvedModules = new Map(); // import path -> resolved file path
  }

  /**
   * Build complete import/export graph for project
   * @param {Array} files - List of file paths
   * @param {Array} astResults - Parsed AST results
   */
  buildGraph(files, astResults) {
    // First pass: collect all exports
    for (const result of astResults) {
      if (result.success) {
        this.analyzeExports(result);
      }
    }

    // Second pass: resolve all imports
    for (const result of astResults) {
      if (result.success) {
        this.analyzeImports(result);
      }
    }
  }

  /**
   * Analyze exports in a file
   * @param {Object} astResult - Parsed AST result
   */
  analyzeExports(astResult) {
    const { ast, filePath } = astResult;
    const exports = [];

    if (!ast || !ast.program) return;

    for (const node of ast.program.body) {
      // Named exports: export const foo = ...
      if (node.type === 'ExportNamedDeclaration') {
        if (node.declaration) {
          // export const foo = ..., export function foo() {}
          if (node.declaration.type === 'VariableDeclaration') {
            for (const declarator of node.declaration.declarations) {
              exports.push({
                name: declarator.id.name,
                type: 'named',
                node: declarator
              });
            }
          } else if (node.declaration.type === 'FunctionDeclaration') {
            exports.push({
              name: node.declaration.id.name,
              type: 'named',
              isFunction: true,
              node: node.declaration
            });
          }
        }
        // export { foo, bar }
        else if (node.specifiers) {
          for (const specifier of node.specifiers) {
            exports.push({
              name: specifier.exported.name,
              type: 'named',
              node: specifier
            });
          }
        }
      }
      // Default export: export default ...
      else if (node.type === 'ExportDefaultDeclaration') {
        exports.push({
          name: 'default',
          type: 'default',
          node: node.declaration
        });
      }
    }

    this.exportGraph.set(filePath, exports);
  }

  /**
   * Analyze imports in a file
   * @param {Object} astResult - Parsed AST result
   */
  analyzeImports(astResult) {
    const { ast, filePath } = astResult;
    const imports = [];

    if (!ast || !ast.program) return;

    for (const node of ast.program.body) {
      if (node.type === 'ImportDeclaration') {
        const importSource = node.source.value;
        const resolvedPath = this.resolveImportPath(importSource, filePath);

        const importInfo = {
          source: importSource,
          resolvedPath,
          specifiers: [],
          node
        };

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportDefaultSpecifier') {
            importInfo.specifiers.push({
              type: 'default',
              local: specifier.local.name
            });
          } else if (specifier.type === 'ImportSpecifier') {
            importInfo.specifiers.push({
              type: 'named',
              imported: specifier.imported.name,
              local: specifier.local.name
            });
          } else if (specifier.type === 'ImportNamespaceSpecifier') {
            importInfo.specifiers.push({
              type: 'namespace',
              local: specifier.local.name
            });
          }
        }

        imports.push(importInfo);
      }
    }

    this.importGraph.set(filePath, imports);
  }

  /**
   * Resolve import path to actual file
   * @param {string} importPath - Import path from code
   * @param {string} currentFile - File containing the import
   * @returns {string|null} Resolved file path or null
   */
  resolveImportPath(importPath, currentFile) {
    // Skip node_modules
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      return null;
    }

    const currentDir = path.dirname(currentFile);
    const possibleExtensions = ['', '.js', '.jsx', '.ts', '.tsx', '/index.js', '/index.jsx', '/index.ts', '/index.tsx'];

    for (const ext of possibleExtensions) {
      const resolvedPath = path.resolve(currentDir, importPath + ext);
      
      // Check if file exists (sync for simplicity in graph building)
      try {
        if (require('fs').existsSync(resolvedPath)) {
          this.resolvedModules.set(`${currentFile}:${importPath}`, resolvedPath);
          return resolvedPath;
        }
      } catch (error) {
        // Continue trying other extensions
      }
    }

    return null;
  }

  /**
   * Get all imports for a file
   * @param {string} filePath - File path
   * @returns {Array} Imports
   */
  getImports(filePath) {
    return this.importGraph.get(filePath) || [];
  }

  /**
   * Get all exports for a file
   * @param {string} filePath - File path
   * @returns {Array} Exports
   */
  getExports(filePath) {
    return this.exportGraph.get(filePath) || [];
  }

  /**
   * Check if imported name is a hook
   * @param {string} name - Imported name
   * @param {string} fromFile - Source file
   * @returns {boolean} Is hook
   */
  isImportedHook(name, fromFile) {
    // Check if name follows hook naming convention
    if (!name.startsWith('use')) {
      return false;
    }

    // If we have the source file, check its exports
    if (fromFile && this.exportGraph.has(fromFile)) {
      const exports = this.exportGraph.get(fromFile);
      const exportedItem = exports.find(exp => exp.name === name);
      
      if (exportedItem && exportedItem.isFunction) {
        return true;
      }
    }

    // Default: assume it's a hook based on naming
    return true;
  }

  /**
   * Get dependency chain for a file
   * @param {string} filePath - Starting file
   * @param {Set} visited - Visited files (for cycle detection)
   * @returns {Array} Dependency chain
   */
  getDependencyChain(filePath, visited = new Set()) {
    if (visited.has(filePath)) {
      return []; // Circular dependency
    }

    visited.add(filePath);
    const imports = this.getImports(filePath);
    const dependencies = [];

    for (const imp of imports) {
      if (imp.resolvedPath) {
        dependencies.push({
          file: imp.resolvedPath,
          imported: imp.specifiers,
          source: imp.source
        });

        // Recursively get dependencies
        const nested = this.getDependencyChain(imp.resolvedPath, new Set(visited));
        dependencies.push(...nested);
      }
    }

    return dependencies;
  }

  /**
   * Find all files that import a specific file
   * @param {string} targetFile - Target file
   * @returns {Array} Files that import the target
   */
  findImporters(targetFile) {
    const importers = [];

    for (const [file, imports] of this.importGraph.entries()) {
      for (const imp of imports) {
        if (imp.resolvedPath === targetFile) {
          importers.push({
            file,
            importInfo: imp
          });
        }
      }
    }

    return importers;
  }
}

module.exports = FileResolver;
