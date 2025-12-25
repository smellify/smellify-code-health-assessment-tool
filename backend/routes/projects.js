// // routes/projects.js
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs').promises;
// const AdmZip = require('adm-zip');
// const Project = require('../models/repository');
// const auth = require('../middleware/auth'); // Adjust path as needed
// const router = express.Router();


// // Enhanced validation function with stricter requirements

// // const validateMernProject = async (extractedPath) => {
// //   const validation = {
// //     isValid: false,
// //     type: 'unknown',
// //     errors: [],
// //     warnings: [],
// //     structure: {},
// //     packageJsonLocations: [],
// //     hasSrcDirectory: false
// //   };

// //   try {
// //     console.log(`Starting validation for: ${extractedPath}`);

// //     // Function to find package.json files recursively (up to 3 levels deep)
// //     const findPackageJsonFiles = async (startPath, maxDepth = 3) => {
// //       const packageJsonFiles = [];
      
// //       const searchRecursive = async (currentPath, depth = 0) => {
// //         if (depth > maxDepth) return;
        
// //         try {
// //           const items = await fs.readdir(currentPath);
          
// //           for (const item of items) {
// //             if (item.startsWith('.') || item === 'node_modules') continue;
            
// //             const itemPath = path.join(currentPath, item);
            
// //             if (item === 'package.json') {
// //               const relativePath = path.relative(startPath, itemPath);
// //               packageJsonFiles.push({
// //                 path: itemPath,
// //                 relativePath,
// //                 directory: path.dirname(itemPath)
// //               });
// //             } else if (await directoryExists(itemPath)) {
// //               await searchRecursive(itemPath, depth + 1);
// //             }
// //           }
// //         } catch (error) {
// //           console.warn(`Error reading directory ${currentPath}:`, error.message);
// //         }
// //       };
      
// //       await searchRecursive(startPath);
// //       return packageJsonFiles;
// //     };

// //     // Check for src directory (required)
// //     const checkForSrcDirectory = async (startPath, maxDepth = 3) => {
// //       const searchForSrc = async (currentPath, depth = 0) => {
// //         if (depth > maxDepth) return false;
        
// //         try {
// //           const items = await fs.readdir(currentPath);
          
// //           // Check if src exists in current directory
// //           if (items.includes('src') && await directoryExists(path.join(currentPath, 'src'))) {
// //             return true;
// //           }
          
// //           // Search in subdirectories
// //           for (const item of items) {
// //             if (item.startsWith('.') || item === 'node_modules') continue;
            
// //             const itemPath = path.join(currentPath, item);
// //             if (await directoryExists(itemPath)) {
// //               const found = await searchForSrc(itemPath, depth + 1);
// //               if (found) return true;
// //             }
// //           }
// //         } catch (error) {
// //           console.warn(`Error searching for src in ${currentPath}:`, error.message);
// //         }
        
// //         return false;
// //       };
      
// //       return await searchForSrc(startPath);
// //     };

// //     // Find all package.json files in the project
// //     const packageJsonFiles = await findPackageJsonFiles(extractedPath);
// //     validation.packageJsonLocations = packageJsonFiles.map(f => f.relativePath);

// //     // Check for src directory
// //     validation.hasSrcDirectory = await checkForSrcDirectory(extractedPath);

// //     console.log(`Found package.json files at: ${validation.packageJsonLocations.join(', ')}`);
// //     console.log(`Has src directory: ${validation.hasSrcDirectory}`);

// //     // STRICT VALIDATION: Require at least one package.json
// //     if (packageJsonFiles.length === 0) {
// //       validation.errors.push('No package.json found in project directory or subdirectories - this is required for a valid Node.js/React project');
// //       return validation;
// //     }

// //     // STRICT VALIDATION: Require src directory
// //     if (!validation.hasSrcDirectory) {
// //       validation.errors.push('No src directory found - this is required for a valid project structure');
// //       return validation;
// //     }

// //     // Analyze each package.json to determine project type
// //     let hasReact = false;
// //     let hasExpress = false;
// //     let hasMongodb = false;
// //     let hasNode = false;
// //     let frontendDetected = false;
// //     let backendDetected = false;

// //     const analyzedPackages = [];

// //     for (const pkgFile of packageJsonFiles) {
// //       const packageJson = await readPackageJson(pkgFile.path);
// //       if (!packageJson) {
// //         validation.warnings.push(`Invalid package.json at: ${pkgFile.relativePath}`);
// //         continue;
// //       }

// //       const allDeps = {
// //         ...packageJson.dependencies,
// //         ...packageJson.devDependencies
// //       };

// //       const analysis = {
// //         location: pkgFile.relativePath,
// //         name: packageJson.name,
// //         hasReact: !!(allDeps.react || allDeps['react-dom']),
// //         hasExpress: !!allDeps.express,
// //         hasMongodb: !!(allDeps.mongoose || allDeps.mongodb),
// //         hasNode: !!(packageJson.engines?.node || allDeps.nodemon || packageJson.scripts?.start),
// //         scripts: packageJson.scripts || {},
// //         dependencies: Object.keys(allDeps)
// //       };

// //       analyzedPackages.push(analysis);

// //       // Update global flags
// //       if (analysis.hasReact) {
// //         hasReact = true;
// //         frontendDetected = true;
// //       }
// //       if (analysis.hasExpress) {
// //         hasExpress = true;
// //         backendDetected = true;
// //       }
// //       if (analysis.hasMongodb) {
// //         hasMongodb = true;
// //         backendDetected = true;
// //       }
// //       if (analysis.hasNode) {
// //         hasNode = true;
// //       }
// //     }

// //     validation.structure.analyzedPackages = analyzedPackages;

// //     // Determine overall project type - more strict validation
// //     if (hasReact && hasExpress && (hasMongodb || hasNode)) {
// //       validation.type = 'fullstack-mern';
// //       validation.isValid = true;
// //     } else if (hasReact && hasExpress && packageJsonFiles.length >= 2) {
// //       validation.type = 'fullstack-mern';
// //       validation.isValid = true;
// //       validation.warnings.push('Full-stack project detected but MongoDB dependency not found');
// //     } else if (hasReact && !hasExpress && packageJsonFiles.length === 1) {
// //       validation.type = 'frontend-react';
// //       validation.isValid = true;
// //       validation.warnings.push('Frontend-only React project detected');
// //     } else if (hasExpress && !hasReact && packageJsonFiles.length === 1) {
// //       validation.type = 'backend-node';
// //       validation.isValid = true;
// //       validation.warnings.push('Backend-only Node.js project detected');
// //     } else if ((hasExpress || hasReact || hasMongodb) && packageJsonFiles.length >= 1) {
// //       validation.type = 'partial-mern';
// //       validation.isValid = true;
// //       validation.warnings.push('Partial MERN stack detected - some components may be missing');
// //     } else {
// //       validation.errors.push('Not a recognizable MERN stack project - missing required dependencies (React, Express, or Node.js indicators)');
// //     }

// //     // Enhanced structure analysis
// //     const rootItems = await fs.readdir(extractedPath);
    
// //     // Check for common project directories
// //     const commonDirs = ['src', 'public', 'client', 'server', 'backend', 'frontend', 'routes', 'models', 'controllers', 'components'];
// //     for (const dir of commonDirs) {
// //       const dirPath = path.join(extractedPath, dir);
// //       validation.structure[dir] = await directoryExists(dirPath);
// //     }

// //     // Check for common files in root and subdirectories
// //     const commonFiles = ['index.js', 'app.js', 'server.js', 'index.html'];
// //     for (const file of commonFiles) {
// //       const filePath = path.join(extractedPath, file);
// //       validation.structure[file] = await fileExists(filePath);
      
// //       // Also check in subdirectories if not found in root
// //       if (!validation.structure[file]) {
// //         for (const dir of rootItems) {
// //           const dirPath = path.join(extractedPath, dir);
// //           if (await directoryExists(dirPath)) {
// //             const subFilePath = path.join(dirPath, file);
// //             if (await fileExists(subFilePath)) {
// //               validation.structure[`${dir}/${file}`] = true;
// //             }
// //           }
// //         }
// //       }
// //     }

// //     // Add summary information
// //     validation.structure.summary = {
// //       totalPackageJsonFiles: packageJsonFiles.length,
// //       frontendDetected,
// //       backendDetected,
// //       hasSrcDirectory: validation.hasSrcDirectory,
// //       rootDirectories: rootItems.filter(async item => {
// //         const itemPath = path.join(extractedPath, item);
// //         return await directoryExists(itemPath);
// //       })
// //     };

// //     console.log(`Validation completed: ${validation.type} (valid: ${validation.isValid})`);
    
// //     return validation;

// //   } catch (error) {
// //     console.error('Validation error:', error);
// //     validation.errors.push(`Validation error: ${error.message}`);
// //     return validation;
// //   }
// // };


// // Ensure uploads directory exists


// const ensureUploadDir = async () => {
//   const uploadDir = path.join(__dirname, '../uploads/projects/maual_uploads');
//   try {
//     await fs.access(uploadDir);
//   } catch (error) {
//     await fs.mkdir(uploadDir, { recursive: true });
//   }
//   return uploadDir;
// };

// // Ensure extracted projects directory exists
// const ensureExtractedDir = async () => {
//   const extractedDir = path.join(__dirname, '../uploads/projects/extracted-projects');
//   try {
//     await fs.access(extractedDir);
//   } catch (error) {
//     await fs.mkdir(extractedDir, { recursive: true });
//   }
//   return extractedDir;
// };

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: async function (req, file, cb) {
//     const uploadDir = await ensureUploadDir();
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     // Generate unique filename with timestamp
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, `project-${uniqueSuffix}${path.extname(file.originalname)}`);
//   }
// });

// // File filter to accept only ZIP files
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'application/zip' || 
//       file.mimetype === 'application/x-zip-compressed' ||
//       file.originalname.toLowerCase().endsWith('.zip')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only ZIP files are allowed'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB limit
//   }
// });

// // Helper function to check if directory exists
// const directoryExists = async (dirPath) => {
//   try {
//     const stats = await fs.stat(dirPath);
//     return stats.isDirectory();
//   } catch {
//     return false;
//   }
// };

// // Helper function to check if file exists
// const fileExists = async (filePath) => {
//   try {
//     await fs.access(filePath);
//     return true;
//   } catch {
//     return false;
//   }
// };

// // Helper function to read and parse package.json
// const readPackageJson = async (packagePath) => {
//   try {
//     const content = await fs.readFile(packagePath, 'utf8');
//     return JSON.parse(content);
//   } catch {
//     return null;
//   }
// };

// // Enhanced function to recursively find and remove node_modules
// const removeNodeModulesRecursively = async (startPath) => {
//   const removedPaths = [];
//   const errors = [];

//   const searchAndRemove = async (currentPath) => {
//     try {
//       const items = await fs.readdir(currentPath);
      
//       for (const item of items) {
//         const itemPath = path.join(currentPath, item);
        
//         if (item === 'node_modules') {
//           try {
//             console.log(`Removing node_modules at: ${itemPath}`);
//             await fs.rm(itemPath, { recursive: true, force: true });
//             removedPaths.push(path.relative(startPath, itemPath));
//           } catch (error) {
//             console.error(`Failed to remove node_modules at ${itemPath}:`, error);
//             errors.push(`Failed to remove ${path.relative(startPath, itemPath)}: ${error.message}`);
//           }
//         } else if (await directoryExists(itemPath) && 
//                    !item.startsWith('.') && 
//                    !['dist', 'build', 'coverage'].includes(item)) {
//           // Recursively search subdirectories, but skip common build/cache folders
//           await searchAndRemove(itemPath);
//         }
//       }
//     } catch (error) {
//       console.error(`Error reading directory ${currentPath}:`, error);
//       errors.push(`Error reading directory ${path.relative(startPath, currentPath)}: ${error.message}`);
//     }
//   };

//   await searchAndRemove(startPath);
  
//   return { removedPaths, errors };
// };

// // Enhanced validation function that checks file types and content
// const validateMernProjectEnhanced = async (extractedPath) => {
//   const validation = {
//     isValid: false,
//     type: 'unknown',
//     errors: [],
//     warnings: [],
//     structure: {},
//     packageJsonLocations: [],
//     hasSrcDirectory: false,
//     fileTypeAnalysis: {}
//   };

//   try {
//     console.log(`Starting enhanced validation for: ${extractedPath}`);

//     // Function to analyze file types in a directory
//     const analyzeFileTypes = async (dirPath, maxDepth = 3) => {
//       const fileTypes = {
//         javascript: 0,
//         python: 0,
//         java: 0,
//         php: 0,
//         csharp: 0,
//         other: 0,
//         pythonFiles: [],
//         javaFiles: [],
//         phpFiles: [],
//         csharpFiles: []
//       };

//       const analyzeRecursive = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return;

//         try {
//           const items = await fs.readdir(currentPath);

//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;

//             const itemPath = path.join(currentPath, item);
//             const stats = await fs.stat(itemPath);

//             if (stats.isFile()) {
//               const ext = path.extname(item).toLowerCase();
//               const relativePath = path.relative(dirPath, itemPath);

//               switch (ext) {
//                 case '.js':
//                 case '.jsx':
//                 case '.ts':
//                 case '.tsx':
//                 case '.mjs':
//                   fileTypes.javascript++;
//                   break;
//                 case '.py':
//                 case '.pyw':
//                 case '.pyx':
//                   fileTypes.python++;
//                   fileTypes.pythonFiles.push(relativePath);
//                   break;
//                 case '.java':
//                 case '.class':
//                   fileTypes.java++;
//                   fileTypes.javaFiles.push(relativePath);
//                   break;
//                 case '.php':
//                 case '.phtml':
//                   fileTypes.php++;
//                   fileTypes.phpFiles.push(relativePath);
//                   break;
//                 case '.cs':
//                 case '.vb':
//                   fileTypes.csharp++;
//                   fileTypes.csharpFiles.push(relativePath);
//                   break;
//                 default:
//                   if (ext) {
//                     fileTypes.other++;
//                   }
//                   break;
//               }
//             } else if (stats.isDirectory()) {
//               await analyzeRecursive(itemPath, depth + 1);
//             }
//           }
//         } catch (error) {
//           console.warn(`Error analyzing files in ${currentPath}:`, error.message);
//         }
//       };

//       await analyzeRecursive(dirPath);
//       return fileTypes;
//     };

//     // Function to find package.json files recursively
//     const findPackageJsonFiles = async (startPath, maxDepth = 3) => {
//       const packageJsonFiles = [];
      
//       const searchRecursive = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return;
        
//         try {
//           const items = await fs.readdir(currentPath);
          
//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;
            
//             const itemPath = path.join(currentPath, item);
            
//             if (item === 'package.json') {
//               const relativePath = path.relative(startPath, itemPath);
//               packageJsonFiles.push({
//                 path: itemPath,
//                 relativePath,
//                 directory: path.dirname(itemPath)
//               });
//             } else if (await directoryExists(itemPath)) {
//               await searchRecursive(itemPath, depth + 1);
//             }
//           }
//         } catch (error) {
//           console.warn(`Error reading directory ${currentPath}:`, error.message);
//         }
//       };
      
//       await searchRecursive(startPath);
//       return packageJsonFiles;
//     };

//     // Check for src directory
//     const checkForSrcDirectory = async (startPath, maxDepth = 3) => {
//       const searchForSrc = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return false;
        
//         try {
//           const items = await fs.readdir(currentPath);
          
//           if (items.includes('src') && await directoryExists(path.join(currentPath, 'src'))) {
//             return true;
//           }
          
//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;
            
//             const itemPath = path.join(currentPath, item);
//             if (await directoryExists(itemPath)) {
//               const found = await searchForSrc(itemPath, depth + 1);
//               if (found) return true;
//             }
//           }
//         } catch (error) {
//           console.warn(`Error searching for src in ${currentPath}:`, error.message);
//         }
        
//         return false;
//       };
      
//       return await searchForSrc(startPath);
//     };

//     // Analyze file types in the entire project
//     const fileTypeAnalysis = await analyzeFileTypes(extractedPath);
//     validation.fileTypeAnalysis = fileTypeAnalysis;

//     // CRITICAL: Check for non-JavaScript backend files
//     if (fileTypeAnalysis.python > 0) {
//       validation.errors.push(`Python files detected (${fileTypeAnalysis.pythonFiles.join(', ')}). This appears to be a Python project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.java > 0) {
//       validation.errors.push(`Java files detected (${fileTypeAnalysis.javaFiles.join(', ')}). This appears to be a Java project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.php > 0) {
//       validation.errors.push(`PHP files detected (${fileTypeAnalysis.phpFiles.join(', ')}). This appears to be a PHP project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.csharp > 0) {
//       validation.errors.push(`C#/.NET files detected (${fileTypeAnalysis.csharpFiles.join(', ')}). This appears to be a .NET project, not a MERN stack project.`);
//     }

//     // Check if there are significantly more non-JS files than JS files
//     const nonJsFiles = fileTypeAnalysis.python + fileTypeAnalysis.java + fileTypeAnalysis.php + fileTypeAnalysis.csharp;
//     if (nonJsFiles > fileTypeAnalysis.javascript && nonJsFiles > 0) {
//       validation.errors.push(`Project contains more non-JavaScript files (${nonJsFiles}) than JavaScript files (${fileTypeAnalysis.javascript}). This does not appear to be a JavaScript/Node.js project.`);
//     }

//     // Early exit if non-JS files detected
//     if (validation.errors.length > 0) {
//       return validation;
//     }

//     // Find all package.json files in the project
//     const packageJsonFiles = await findPackageJsonFiles(extractedPath);
//     validation.packageJsonLocations = packageJsonFiles.map(f => f.relativePath);

//     // Check for src directory
//     validation.hasSrcDirectory = await checkForSrcDirectory(extractedPath);

//     console.log(`Found package.json files at: ${validation.packageJsonLocations.join(', ')}`);
//     console.log(`Has src directory: ${validation.hasSrcDirectory}`);
//     console.log(`File type analysis:`, {
//       javascript: fileTypeAnalysis.javascript,
//       python: fileTypeAnalysis.python,
//       java: fileTypeAnalysis.java,
//       php: fileTypeAnalysis.php,
//       other: fileTypeAnalysis.other
//     });

//     // STRICT VALIDATION: Require at least one package.json
//     if (packageJsonFiles.length === 0) {
//       validation.errors.push('No package.json found in project directory or subdirectories - this is required for a valid Node.js/React project');
//       return validation;
//     }

//     // STRICT VALIDATION: Require src directory
//     if (!validation.hasSrcDirectory) {
//       validation.errors.push('No src directory found - this is required for a valid project structure');
//       return validation;
//     }

//     // STRICT VALIDATION: Require JavaScript files
//     if (fileTypeAnalysis.javascript === 0) {
//       validation.errors.push('No JavaScript/TypeScript files found - this is required for a Node.js/React project');
//       return validation;
//     }

//     // Analyze each package.json to determine project type and validate dependencies
//     let hasReact = false;
//     let hasExpress = false;
//     let hasMongodb = false;
//     let hasNode = false;
//     let frontendDetected = false;
//     let backendDetected = false;

//     const analyzedPackages = [];

//     for (const pkgFile of packageJsonFiles) {
//       const packageJson = await readPackageJson(pkgFile.path);
//       if (!packageJson) {
//         validation.warnings.push(`Invalid package.json at: ${pkgFile.relativePath}`);
//         continue;
//       }

//       const allDeps = {
//         ...packageJson.dependencies,
//         ...packageJson.devDependencies
//       };

//       // Check for conflicting dependencies (non-JS technologies)
//       const conflictingDeps = [];
//       const depNames = Object.keys(allDeps);
      
//       // Check for Python-related packages
//       const pythonPackages = depNames.filter(dep => 
//         dep.includes('python') || dep.includes('django') || dep.includes('flask') || dep.includes('tornado')
//       );
//       if (pythonPackages.length > 0) {
//         conflictingDeps.push(`Python packages: ${pythonPackages.join(', ')}`);
//       }

//       // Check for Java-related packages
//       const javaPackages = depNames.filter(dep => 
//         dep.includes('java') || dep.includes('spring') || dep.includes('hibernate')
//       );
//       if (javaPackages.length > 0) {
//         conflictingDeps.push(`Java packages: ${javaPackages.join(', ')}`);
//       }

//       // Check for PHP-related packages
//       const phpPackages = depNames.filter(dep => 
//         dep.includes('php') || dep.includes('laravel') || dep.includes('symfony')
//       );
//       if (phpPackages.length > 0) {
//         conflictingDeps.push(`PHP packages: ${phpPackages.join(', ')}`);
//       }

//       if (conflictingDeps.length > 0) {
//         validation.errors.push(`Non-JavaScript dependencies found in ${pkgFile.relativePath}: ${conflictingDeps.join(', ')}`);
//       }

//       const analysis = {
//         location: pkgFile.relativePath,
//         name: packageJson.name,
//         hasReact: !!(allDeps.react || allDeps['react-dom']),
//         hasExpress: !!allDeps.express,
//         hasMongodb: !!(allDeps.mongoose || allDeps.mongodb),
//         hasNode: !!(packageJson.engines?.node || allDeps.nodemon || packageJson.scripts?.start),
//         scripts: packageJson.scripts || {},
//         dependencies: Object.keys(allDeps),
//         conflictingDeps
//       };

//       analyzedPackages.push(analysis);

//       // Update global flags
//       if (analysis.hasReact) {
//         hasReact = true;
//         frontendDetected = true;
//       }
//       if (analysis.hasExpress) {
//         hasExpress = true;
//         backendDetected = true;
//       }
//       if (analysis.hasMongodb) {
//         hasMongodb = true;
//         backendDetected = true;
//       }
//       if (analysis.hasNode) {
//         hasNode = true;
//       }
//     }

//     validation.structure.analyzedPackages = analyzedPackages;

//     // Check for backend directory validation
//     await validateBackendDirectory(extractedPath, validation);

//     // Early exit if errors found during file type or dependency validation
//     if (validation.errors.length > 0) {
//       return validation;
//     }

//     // Determine overall project type - more strict validation
//     if (hasReact && hasExpress && (hasMongodb || hasNode)) {
//       validation.type = 'fullstack-mern';
//       validation.isValid = true;
//     } else if (hasReact && hasExpress && packageJsonFiles.length >= 2) {
//       validation.type = 'fullstack-mern';
//       validation.isValid = true;
//       validation.warnings.push('Full-stack project detected but MongoDB dependency not found');
//     } else if (hasReact && !hasExpress && packageJsonFiles.length === 1) {
//       validation.type = 'frontend-react';
//       validation.isValid = true;
//       validation.warnings.push('Frontend-only React project detected');
//     } else if (hasExpress && !hasReact && packageJsonFiles.length === 1) {
//       validation.type = 'backend-node';
//       validation.isValid = true;
//       validation.warnings.push('Backend-only Node.js project detected');
//     } else if ((hasExpress || hasReact || hasMongodb) && packageJsonFiles.length >= 1) {
//       validation.type = 'partial-mern';
//       validation.isValid = true;
//       validation.warnings.push('Partial MERN stack detected - some components may be missing');
//     } else {
//       validation.errors.push('Not a recognizable MERN stack project - missing required dependencies (React, Express, or Node.js indicators)');
//     }

//     // Enhanced structure analysis
//     const rootItems = await fs.readdir(extractedPath);
    
//     // Check for common project directories
//     const commonDirs = ['src', 'public', 'client', 'server', 'backend', 'frontend', 'routes', 'models', 'controllers', 'components'];
//     for (const dir of commonDirs) {
//       const dirPath = path.join(extractedPath, dir);
//       validation.structure[dir] = await directoryExists(dirPath);
//     }

//     // Check for common files in root and subdirectories
//     const commonFiles = ['index.js', 'app.js', 'server.js', 'index.html'];
//     for (const file of commonFiles) {
//       const filePath = path.join(extractedPath, file);
//       validation.structure[file] = await fileExists(filePath);
      
//       // Also check in subdirectories if not found in root
//       if (!validation.structure[file]) {
//         for (const dir of rootItems) {
//           const dirPath = path.join(extractedPath, dir);
//           if (await directoryExists(dirPath)) {
//             const subFilePath = path.join(dirPath, file);
//             if (await fileExists(subFilePath)) {
//               validation.structure[`${dir}/${file}`] = true;
//             }
//           }
//         }
//       }
//     }

//     // Add summary information
//     validation.structure.summary = {
//       totalPackageJsonFiles: packageJsonFiles.length,
//       frontendDetected,
//       backendDetected,
//       hasSrcDirectory: validation.hasSrcDirectory,
//       fileTypes: fileTypeAnalysis,
//       rootDirectories: rootItems.filter(async item => {
//         const itemPath = path.join(extractedPath, item);
//         return await directoryExists(itemPath);
//       })
//     };

//     console.log(`Enhanced validation completed: ${validation.type} (valid: ${validation.isValid})`);
    
//     return validation;

//   } catch (error) {
//     console.error('Validation error:', error);
//     validation.errors.push(`Validation error: ${error.message}`);
//     return validation;
//   }
// };

// // Function to specifically validate backend directory
// const validateBackendDirectory = async (extractedPath, validation) => {
//   const backendPaths = ['backend', 'server', 'api'];
  
//   for (const backendDir of backendPaths) {
//     const backendPath = path.join(extractedPath, backendDir);
    
//     if (await directoryExists(backendPath)) {
//       console.log(`Validating backend directory: ${backendDir}`);
      
//       try {
//         const backendFiles = await fs.readdir(backendPath);
        
//         // Check for non-JavaScript main files in backend
//         const mainFiles = backendFiles.filter(file => {
//           const fileName = file.toLowerCase();
//           return fileName.includes('main') || 
//                  fileName.includes('app') || 
//                  fileName.includes('server') || 
//                  fileName.includes('index') ||
//                  fileName === 'backend.py' ||
//                  fileName === 'app.py' ||
//                  fileName === 'server.py' ||
//                  fileName === 'main.py';
//         });

//         for (const file of mainFiles) {
//           const filePath = path.join(backendPath, file);
//           const ext = path.extname(file).toLowerCase();
          
//           if (['.py', '.pyw', '.pyx'].includes(ext)) {
//             validation.errors.push(`Python backend file detected: ${backendDir}/${file}. MERN stack requires Node.js/JavaScript backend, not Python.`);
//           } else if (['.java', '.class'].includes(ext)) {
//             validation.errors.push(`Java backend file detected: ${backendDir}/${file}. MERN stack requires Node.js/JavaScript backend, not Java.`);
//           } else if (['.php', '.phtml'].includes(ext)) {
//             validation.errors.push(`PHP backend file detected: ${backendDir}/${file}. MERN stack requires Node.js/JavaScript backend, not PHP.`);
//           } else if (['.cs', '.vb'].includes(ext)) {
//             validation.errors.push(`C#/.NET backend file detected: ${backendDir}/${file}. MERN stack requires Node.js/JavaScript backend, not C#/.NET.`);
//           }
//         }

//         // Check if backend directory has any JavaScript files
//         const jsFiles = backendFiles.filter(file => {
//           const ext = path.extname(file).toLowerCase();
//           return ['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext);
//         });

//         if (jsFiles.length === 0 && backendFiles.length > 0) {
//           validation.warnings.push(`Backend directory '${backendDir}' contains no JavaScript files. Expected .js, .jsx, .ts, or .tsx files for Node.js backend.`);
//         }

//         // Check for backend-specific Python frameworks/patterns
//         const pythonFrameworkFiles = backendFiles.filter(file => {
//           const fileName = file.toLowerCase();
//           return fileName === 'manage.py' ||       // Django
//                  fileName === 'wsgi.py' ||         // Django/Flask
//                  fileName === 'asgi.py' ||         // Django
//                  fileName === 'settings.py' ||     // Django
//                  fileName === 'requirements.txt' || // Python
//                  fileName === 'pipfile' ||         // Python
//                  fileName === 'poetry.lock';       // Python
//         });

//         if (pythonFrameworkFiles.length > 0) {
//           validation.errors.push(`Python framework files detected in ${backendDir}: ${pythonFrameworkFiles.join(', ')}. This indicates a Python backend (Django/Flask), not Node.js/Express.`);
//         }

//       } catch (error) {
//         console.warn(`Error validating backend directory ${backendDir}:`, error.message);
//       }
//     }
//   }
// };

// // Function to check for framework-specific files that indicate non-MERN projects
// const checkForNonMernFrameworks = async (extractedPath, validation) => {
//   try {
//     const items = await fs.readdir(extractedPath);
    
//     // Django indicators
//     if (items.includes('manage.py')) {
//       validation.errors.push('Django project detected (manage.py found). This is a Python/Django project, not MERN stack.');
//     }
    
//     // Flask indicators
//     if (items.includes('app.py') || items.includes('main.py')) {
//       const appPyPath = path.join(extractedPath, 'app.py');
//       const mainPyPath = path.join(extractedPath, 'main.py');
      
//       if (await fileExists(appPyPath) || await fileExists(mainPyPath)) {
//         validation.errors.push('Flask/Python project detected (app.py or main.py found). This is a Python project, not MERN stack.');
//       }
//     }
    
//     // Spring Boot indicators
//     if (items.includes('pom.xml') || items.includes('build.gradle')) {
//       validation.errors.push('Java Spring Boot project detected (pom.xml or build.gradle found). This is a Java project, not MERN stack.');
//     }
    
//     // Laravel indicators
//     if (items.includes('artisan') || items.includes('composer.json')) {
//       validation.errors.push('PHP Laravel project detected (artisan or composer.json found). This is a PHP project, not MERN stack.');
//     }
    
//     // .NET indicators
//     if (items.some(item => item.endsWith('.csproj') || item.endsWith('.sln'))) {
//       validation.errors.push('.NET project detected (.csproj or .sln files found). This is a C#/.NET project, not MERN stack.');
//     }

//     // Python requirements/dependency files
//     if (items.includes('requirements.txt') || items.includes('Pipfile') || items.includes('poetry.lock')) {
//       validation.errors.push('Python dependency files detected (requirements.txt, Pipfile, or poetry.lock found). This appears to be a Python project, not MERN stack.');
//     }

//   } catch (error) {
//     console.warn('Error checking for non-MERN frameworks:', error.message);
//   }
// };

// // Updated validation function that includes all checks
// const validateMernProject = async (extractedPath) => {
//   // Run enhanced validation
//   const validation = await validateMernProjectEnhanced(extractedPath);
  
//   // Additional framework checks
//   await checkForNonMernFrameworks(extractedPath, validation);
  
//   return validation;
// };

// // Enhanced cleanup function with better node_modules removal
// const cleanupProject = async (extractedPath) => {
//   const cleanupResults = {
//     removed: [],
//     errors: [],
//     nodeModulesRemoved: []
//   };

//   try {
//     console.log('Starting project cleanup...');
    
//     // First, remove all node_modules directories recursively
//     console.log('Removing node_modules directories...');
//     const nodeModulesResult = await removeNodeModulesRecursively(extractedPath);
//     cleanupResults.nodeModulesRemoved = nodeModulesResult.removedPaths;
//     cleanupResults.errors.push(...nodeModulesResult.errors);
    
//     console.log(`Removed ${nodeModulesResult.removedPaths.length} node_modules directories`);

//     // Then remove other unwanted items
//     const itemsToRemove = [
//       '.git',
//       '.DS_Store',
//       'Thumbs.db',
//       '*.log',
//       '.env.local',
//       '.env.development.local',
//       '.env.test.local',
//       '.env.production.local',
//       'npm-debug.log*',
//       'yarn-debug.log*',
//       'yarn-error.log*',
//       'dist',
//       'build',
//       '.cache',
//       '.parcel-cache',
//       '.next',
//       '.nuxt',
//       '.vuepress/dist',
//       'coverage',
//       '.nyc_output'
//     ];

//     for (const item of itemsToRemove) {
//       try {
//         const itemPath = path.join(extractedPath, item);
        
//         // Check if item exists
//         try {
//           const stats = await fs.stat(itemPath);
          
//           if (stats.isDirectory()) {
//             await fs.rm(itemPath, { recursive: true, force: true });
//             cleanupResults.removed.push(`Directory: ${item}`);
//           } else {
//             await fs.unlink(itemPath);
//             cleanupResults.removed.push(`File: ${item}`);
//           }
//         } catch (error) {
//           // Item doesn't exist, skip silently
//           if (error.code !== 'ENOENT') {
//             cleanupResults.errors.push(`Failed to remove ${item}: ${error.message}`);
//           }
//         }
//       } catch (error) {
//         cleanupResults.errors.push(`Error processing ${item}: ${error.message}`);
//       }
//     }

//     console.log(`Cleanup completed: ${cleanupResults.removed.length} items removed, ${cleanupResults.nodeModulesRemoved.length} node_modules removed`);
    
//   } catch (error) {
//     console.error('Cleanup error:', error);
//     cleanupResults.errors.push(`Cleanup error: ${error.message}`);
//   }

//   return cleanupResults;
// };

// // Function to extract ZIP file and handle nested structures
// const extractZipFile = async (zipPath, extractionPath) => {
//   try {
//     const zip = new AdmZip(zipPath);
//     const entries = zip.getEntries();
    
//     if (entries.length === 0) {
//       throw new Error('ZIP file is empty');
//     }
    
//     // Create extraction directory
//     await fs.mkdir(extractionPath, { recursive: true });
    
//     // Extract all files first
//     zip.extractAllTo(extractionPath, true);
    
//     // Clean up any __MACOSX directories immediately
//     const macOSXPath = path.join(extractionPath, '__MACOSX');
//     if (await directoryExists(macOSXPath)) {
//       await fs.rm(macOSXPath, { recursive: true, force: true });
//     }
    
//     // Find the actual project root by looking for meaningful content
//     const projectRoot = await findProjectRoot(extractionPath);
    
//     if (projectRoot && projectRoot !== extractionPath) {
//       console.log(`Found project root at: ${path.relative(extractionPath, projectRoot)}`);
      
//       // Move project content to extraction root
//       await moveDirectoryContents(projectRoot, extractionPath);
      
//       // Clean up empty nested directories
//       await cleanupEmptyDirectories(extractionPath);
//     }
    
//     // Verify extraction worked
//     const extractedItems = await fs.readdir(extractionPath);
//     const validItems = extractedItems.filter(item => 
//       !item.startsWith('.') && 
//       !item.includes('__MACOSX') &&
//       !item.includes('_temp_')
//     );
    
//     if (validItems.length === 0) {
//       throw new Error('No valid files found after extraction');
//     }
    
//     console.log(`Successfully extracted ${validItems.length} items to ${extractionPath}`);
//     console.log('Extracted items:', validItems.slice(0, 10)); // Show first 10 items
    
//     return {
//       success: true,
//       extractedPath: extractionPath,
//       itemCount: validItems.length,
//       projectRootFound: projectRoot !== extractionPath
//     };
//   } catch (error) {
//     console.error('ZIP extraction error:', error);
//     throw new Error(`Failed to extract ZIP: ${error.message}`);
//   }
// };

// // Function to find the actual project root directory depth 10 means 10 folders
// const findProjectRoot = async (startPath, maxDepth = 10) => {
//   const findProjectRootRecursive = async (currentPath, depth = 0) => {
//     if (depth > maxDepth) {
//       return null;
//     }
    
//     try {
//       const items = await fs.readdir(currentPath);
//       const validItems = items.filter(item => 
//         !item.startsWith('.') && 
//         !item.includes('__MACOSX')
//       );
      
//       // Check if current directory has project indicators
//       const hasPackageJson = validItems.includes('package.json');
//       const hasCommonDirs = validItems.some(item => 
//         ['src', 'public', 'backend', 'frontend', 'client', 'server', 'app', 'components'].includes(item.toLowerCase())
//       );
//       const hasIndexFile = validItems.some(item => 
//         ['index.js', 'index.html', 'app.js', 'server.js', 'main.js'].includes(item.toLowerCase())
//       );
      
//       // Strong indicators of project root - require package.json OR src directory
//       if (hasPackageJson || (hasCommonDirs && validItems.includes('src'))) {
//         return currentPath;
//       }
      
//       // Medium indicators - has common directories and index file
//       if (hasCommonDirs && hasIndexFile && validItems.length >= 2) {
//         return currentPath;
//       }
      
//       // Check if this directory only contains one subdirectory (nested structure)
//       const subdirectories = [];
//       for (const item of validItems) {
//         const itemPath = path.join(currentPath, item);
//         if (await directoryExists(itemPath)) {
//           subdirectories.push(item);
//         }
//       }
      
//       // If there's only one subdirectory and few/no files, go deeper
//       if (subdirectories.length === 1 && validItems.length <= 3) {
//         const subPath = path.join(currentPath, subdirectories[0]);
//         const deeperResult = await findProjectRootRecursive(subPath, depth + 1);
//         if (deeperResult) {
//           return deeperResult;
//         }
//       }
      
//       // If there are multiple subdirectories, check each for project indicators
//       if (subdirectories.length > 1) {
//         for (const subdir of subdirectories) {
//           const subPath = path.join(currentPath, subdir);
//           const subItems = await fs.readdir(subPath).catch(() => []);
          
//           // Check if subdirectory has strong project indicators
//           if (subItems.includes('package.json') || 
//               (subItems.includes('src') && subItems.some(item => ['public', 'backend', 'frontend'].includes(item.toLowerCase())))) {
//             return currentPath; // Parent directory is likely the project root
//           }
//         }
//       }
      
//       return currentPath; // Default to current if no better option found
//     } catch (error) {
//       console.error(`Error reading directory ${currentPath}:`, error);
//       return currentPath;
//     }
//   };
  
//   return await findProjectRootRecursive(startPath);
// };

// // Function to move directory contents
// const moveDirectoryContents = async (sourceDir, targetDir) => {
//   try {
//     const items = await fs.readdir(sourceDir);
    
//     // Create a temporary directory to avoid conflicts
//     const tempDir = path.join(targetDir, '_temp_move_' + Date.now());
//     await fs.mkdir(tempDir, { recursive: true });
    
//     // Move all items to temp directory first
//     for (const item of items) {
//       const sourcePath = path.join(sourceDir, item);
//       const tempPath = path.join(tempDir, item);
      
//       try {
//         await fs.rename(sourcePath, tempPath);
//       } catch (error) {
//         console.warn(`Failed to move ${item}:`, error.message);
//       }
//     }
    
//     // Now move items from temp to target root, handling conflicts
//     const tempItems = await fs.readdir(tempDir);
//     for (const item of tempItems) {
//       const tempPath = path.join(tempDir, item);
//       const targetPath = path.join(targetDir, item);
      
//       try {
//         // Check if target already exists
//         if (await fileExists(targetPath)) {
//           // If it's a directory and both source and target are directories, merge
//           const tempStats = await fs.stat(tempPath);
//           const targetStats = await fs.stat(targetPath);
          
//           if (tempStats.isDirectory() && targetStats.isDirectory()) {
//             await moveDirectoryContents(tempPath, targetPath);
//             await fs.rm(tempPath, { recursive: true, force: true });
//             continue;
//           } else {
//             // For files, create a unique name
//             const ext = path.extname(item);
//             const base = path.basename(item, ext);
//             const uniqueName = `${base}_moved${ext}`;
//             await fs.rename(tempPath, path.join(targetDir, uniqueName));
//             continue;
//           }
//         }
        
//         await fs.rename(tempPath, targetPath);
//       } catch (error) {
//         console.warn(`Failed to move ${item} to root:`, error.message);
//       }
//     }
    
//     // Clean up temp directory
//     await fs.rm(tempDir, { recursive: true, force: true });
    
//     console.log(`Moved contents from ${path.relative(targetDir, sourceDir)} to root`);
//   } catch (error) {
//     console.error('Error moving directory contents:', error);
//   }
// };

// // Function to clean up empty nested directories
// const cleanupEmptyDirectories = async (rootPath) => {
//   try {
//     const items = await fs.readdir(rootPath);
    
//     for (const item of items) {
//       const itemPath = path.join(rootPath, item);
      
//       if (await directoryExists(itemPath)) {
//         // First, recursively clean subdirectories
//         await cleanupEmptyDirectories(itemPath);
        
//         // Check if directory is now empty
//         const subItems = await fs.readdir(itemPath);
//         const validSubItems = subItems.filter(subItem => 
//           !subItem.startsWith('.') && 
//           !subItem.includes('__MACOSX')
//         );
        
//         if (validSubItems.length === 0) {
//           console.log(`Removing empty directory: ${path.relative(rootPath, itemPath)}`);
//           await fs.rm(itemPath, { recursive: true, force: true });
//         }
//       }
//     }
//   } catch (error) {
//     console.error('Error cleaning up empty directories:', error);
//   }
// };

// // Helper function to handle multer errors
// const handleMulterError = (error, res) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         message: 'File too large. Maximum size is 100MB.'
//       });
//     }
//     return res.status(400).json({
//       success: false,
//       message: `Upload error: ${error.message}`
//     });
//   }
  
//   if (error.message === 'Only ZIP files are allowed') {
//     return res.status(400).json({
//       success: false,
//       message: 'Only ZIP files are allowed'
//     });
//   }

//   return res.status(500).json({
//     success: false,
//     message: error.message || 'Upload failed'
//   });
// };

// // POST /api/projects/upload - Upload ZIP project
// // POST /api/projects/upload - Upload ZIP project
// router.post('/upload', auth, (req, res) => {
//   upload.single('project')(req, res, async (err) => {
//     // Handle multer errors first
//     if (err) {
//       return handleMulterError(err, res);
//     }

//     let extractedPath = null;
//     let project = null;

//     try {
//       if (!req.file) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'No file uploaded' 
//         });
//       }

//       const { projectName, description } = req.body;
      
//       // Generate unique extraction directory name
//       const extractionDirName = `project-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//       const extractedDir = await ensureExtractedDir();
//       extractedPath = path.join(extractedDir, extractionDirName);

//       console.log(`Extracting project to: ${extractedPath}`);

//       // Extract ZIP file
//       const extractionResult = await extractZipFile(req.file.path, extractedPath);
      
//       console.log(`Extraction completed:`, {
//         success: extractionResult.success,
//         itemCount: extractionResult.itemCount,
//         projectRootFound: extractionResult.projectRootFound
//       });

//       console.log('ZIP extracted successfully, validating MERN structure...');

//       // Validate MERN stack project with stricter validation
//       const validation = await validateMernProject(extractedPath);
      
//       console.log('Validation result:', {
//         isValid: validation.isValid,
//         type: validation.type,
//         errors: validation.errors,
//         warnings: validation.warnings,
//         hasSrcDirectory: validation.hasSrcDirectory
//       });

//       if (!validation.isValid) {
//         // Clean up extracted files if validation fails
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//         } catch (cleanupError) {
//           console.error('Error cleaning up extracted files:', cleanupError);
//         }

//         // Clean up uploaded ZIP file if validation fails
//         try {
//           await fs.unlink(req.file.path);
//         } catch (zipCleanupError) {
//           console.error('Error cleaning up uploaded ZIP file:', zipCleanupError);
//         }

//         return res.status(400).json({
//           success: false,
//           message: 'Invalid project structure',
//           errors: validation.errors,
//           warnings: validation.warnings,
//           requirements: [
//             'Project must contain at least one package.json file',
//             'Project must have a src directory',
//             'Project must be a valid Node.js/React/MERN project'
//           ]
//         });
//       }

//       console.log(`Valid ${validation.type} project detected, cleaning up...`);

//       // Clean up unwanted files and directories (including node_modules)
//       const cleanupResults = await cleanupProject(extractedPath);

//       console.log('Cleanup completed:', {
//         itemsRemoved: cleanupResults.removed.length,
//         nodeModulesRemoved: cleanupResults.nodeModulesRemoved.length,
//         errors: cleanupResults.errors.length
//       });

//       // Create new project record
//       project = new Project({
//         user: req.user.userId,
//         source: 'zip',
//         zipFilePath: req.file.path,
//         extractedPath: extractedPath,
//         projectName: projectName || req.file.originalname.replace('.zip', ''),
//         description: description || '',
//         analysisStatus: 'processing',
//         projectType: validation.type,
//         validationResult: validation,
//         cleanupResult: cleanupResults
//       });

//       await project.save();

//       res.json({
//         success: true,
//         message: 'Project uploaded, extracted, validated, and cleaned successfully',
//         project: {
//           id: project._id,
//           name: project.projectName,
//           source: project.source,
//           type: project.projectType,
//           status: project.analysisStatus,
//           validation: {
//             type: validation.type,
//             warnings: validation.warnings,
//             structure: validation.structure,
//             hasSrcDirectory: validation.hasSrcDirectory
//           },
//           cleanup: {
//             itemsRemoved: cleanupResults.removed.length,
//             nodeModulesRemoved: cleanupResults.nodeModulesRemoved.length,
//             errors: cleanupResults.errors.length
//           },
//           createdAt: project.createdAt
//         }
//       });

//       console.log(`Project processed successfully: ${project.projectName} (${validation.type}) by user ${req.user.userId}`);
//       console.log(`Removed ${cleanupResults.nodeModulesRemoved.length} node_modules directories`);

//     } catch (error) {
//       console.error('Upload and processing error:', error);
      
//       // Clean up on error
//       if (extractedPath) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//         } catch (cleanupError) {
//           console.error('Error cleaning up extracted files:', cleanupError);
//         }
//       }

//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (unlinkError) {
//           console.error('Error deleting uploaded file:', unlinkError);
//         }
//       }

//       if (project && project._id) {
//         try {
//           await Project.findByIdAndDelete(project._id);
//         } catch (deleteError) {
//           console.error('Error deleting project record:', deleteError);
//         }
//       }

//       res.status(500).json({
//         success: false,
//         message: error.message || 'Upload and processing failed'
//       });
//     }
//   });
// });

// // GET /api/projects - Get user's projects
// router.get('/', auth, async (req, res) => {
//   try {
//     const projects = await Project.find({ user: req.user.userId })
//       .sort({ createdAt: -1 })
//       .select('-zipFilePath -extractedPath -analysisReport -validationResult -cleanupResult'); // Exclude sensitive/large data

//     res.json({
//       success: true,
//       projects
//     });
//   } catch (error) {
//     console.error('Error fetching projects:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch projects'
//     });
//   }
// });

// // GET /api/projects/:id - Get specific project
// router.get('/:id', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     res.json({
//       success: true,
//       project
//     });
//   } catch (error) {
//     console.error('Error fetching project:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch project'
//     });
//   }
// });

// // DELETE /api/projects/:id - Delete project
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     // Delete associated ZIP file if exists
//     if (project.source === 'zip' && project.zipFilePath) {
//       try {
//         await fs.unlink(project.zipFilePath);
//       } catch (unlinkError) {
//         console.error('Error deleting ZIP file:', unlinkError);
//       }
//     }

//     // Delete extracted project directory if exists
//     if (project.extractedPath) {
//       try {
//         await fs.rm(project.extractedPath, { recursive: true, force: true });
//       } catch (unlinkError) {
//         console.error('Error deleting extracted directory:', unlinkError);
//       }
//     }

//     await Project.findByIdAndDelete(req.params.id);

//     res.json({
//       success: true,
//       message: 'Project deleted successfully'
//     });
//   } catch (error) {
//     console.error('Error deleting project:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete project'
//     });
//   }
// });

// const exportedFunctions = {
//   ensureExtractedDir,
//   validateMernProject,
//   cleanupProject,
//   removeNodeModulesRecursively,
//   validateMernProjectEnhanced,
//   validateBackendDirectory,
//   checkForNonMernFrameworks,
//   directoryExists,
//   fileExists,
//   readPackageJson
// };

// // Export both router and utility functions
// module.exports = router;
// module.exports.functions = exportedFunctions;


// sonarqube logic
// // routes/projects.js
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs').promises;
// const AdmZip = require('adm-zip');
// const { exec } = require('child_process');
// const util = require('util');
// const execPromise = util.promisify(exec);
// const Project = require('../models/repository');
// const auth = require('../middleware/auth');
// const router = express.Router();

// // SonarQube configuration
// const SONAR_CONFIG = {
//   // hostUrl: 'http://host.docker.internal:9000',
//   // token: 'squ_e6fff0abf392b80eeae0f6ab475aadbff01b5aeb',
//   hostUrl: process.env.SONAR_HOST_URL,
//   docker: process.env.DOCKER,
//   token: process.env.SONAR_TOKEN ,
//   dockerImage: 'sonarsource/sonar-scanner-cli'
// };

// const ensureUploadDir = async () => {
//   const uploadDir = path.join(__dirname, '../uploads/projects/maual_uploads');
//   try {
//     await fs.access(uploadDir);
//   } catch (error) {
//     await fs.mkdir(uploadDir, { recursive: true });
//   }
//   return uploadDir;
// };

// const ensureExtractedDir = async () => {
//   const extractedDir = path.join(__dirname, '../uploads/projects/extracted-projects');
//   try {
//     await fs.access(extractedDir);
//   } catch (error) {
//     await fs.mkdir(extractedDir, { recursive: true });
//   }
//   return extractedDir;
// };

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: async function (req, file, cb) {
//     const uploadDir = await ensureUploadDir();
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, `project-${uniqueSuffix}${path.extname(file.originalname)}`);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'application/zip' || 
//       file.mimetype === 'application/x-zip-compressed' ||
//       file.originalname.toLowerCase().endsWith('.zip')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only ZIP files are allowed'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB limit
//   }
// });

// // Helper function to create sonar-project.properties file
// const createSonarPropertiesFile = async (projectPath, projectKey) => {
//   try {
//     const sonarProperties = `sonar.projectKey=${projectKey}
// sonar.sources=.
// sonar.exclusions=node_modules/**,build/**,dist/**,.next/**,.turbo/**,coverage/**
// sonar.sourceEncoding=UTF-8`;

//     const propertiesFilePath = path.join(projectPath, 'sonar-project.properties');
//     await fs.writeFile(propertiesFilePath, sonarProperties, 'utf8');
    
//     console.log(`Created sonar-project.properties at: ${propertiesFilePath}`);
//     return propertiesFilePath;
//   } catch (error) {
//     console.error('Error creating sonar-project.properties:', error);
//     throw new Error(`Failed to create SonarQube configuration: ${error.message}`);
//   }
// };

// // Helper function to run SonarQube scan using Docker
// const runSonarQubeAnalysis = async (projectPath, projectKey) => {
//   try {
//     console.log(`Starting SonarQube analysis for project: ${projectKey}`);
//     console.log(`Project path: ${projectPath}`);

//     // Get absolute path
//     const absolutePath = path.resolve(projectPath);
//     console.log(`Absolute path: ${absolutePath}`);

//     // Verify Docker is available
//     try {
//       await execPromise('docker --version');
//     } catch (error) {
//       throw new Error('Docker is not installed or not running. Please ensure Docker is available.');
//     }

//     // Prepare Docker command (Windows-compatible)
//     const dockerCommand = `docker run --rm -e SONAR_HOST_URL=${SONAR_CONFIG.docker} -e SONAR_TOKEN=${SONAR_CONFIG.token} -v "${absolutePath}:/usr/src" ${SONAR_CONFIG.dockerImage}`;

//     console.log('Executing SonarQube scan...');
    
//     // Execute Docker command with timeout (10 minutes)
//     const { stdout, stderr } = await execPromise(dockerCommand, {
//       timeout: 600000, // 10 minutes timeout
//       maxBuffer: 10 * 1024 * 1024 // 10MB buffer
//     });

//     console.log('SonarQube scan completed successfully');
    
//     if (stdout) {
//       console.log('SonarQube stdout:', stdout);
//     }
    
//     if (stderr) {
//       console.log('SonarQube stderr:', stderr);
//     }

//     return {
//       success: true,
//       message: 'SonarQube analysis completed successfully',
//       stdout,
//       stderr,
//       projectKey
//     };

//   } catch (error) {
//     console.error('SonarQube analysis error:', error);
    
//     // Handle specific error types
//     if (error.killed) {
//       throw new Error('SonarQube analysis timed out. Project may be too large.');
//     }
    
//     if (error.message.includes('Docker')) {
//       throw new Error('Docker error: ' + error.message);
//     }

//     throw new Error(`SonarQube analysis failed: ${error.message}`);
//   }
// };

// // Helper function to fetch analysis results from SonarQube API
// const fetchSonarQubeResults = async (projectKey) => {
//   try {
//     const axios = require('axios');
    
//     // Create basic auth token
//     const authToken = Buffer.from(`${SONAR_CONFIG.token}:`).toString('base64');
    
//     // Fetch project issues
//     const issuesResponse = await axios.get(
//       `${SONAR_CONFIG.hostUrl}/api/issues/search`,
//       {
//         params: {
//           componentKeys: projectKey,
//           resolved: false
//         },
//         headers: {
//           'Authorization': `Basic ${authToken}`
//         },
//         timeout: 60000
//       }
//     );

//     // Fetch project metrics
//     const metricsResponse = await axios.get(
//       `${SONAR_CONFIG.hostUrl}/api/measures/component`,
//       {
//         params: {
//           component: projectKey,
//           metricKeys: 'ncloc,complexity,cognitive_complexity,code_smells,bugs,vulnerabilities,coverage,duplicated_lines_density'
//         },
//         headers: {
//           'Authorization': `Basic ${authToken}`
//         },
//         timeout: 60000
//       }
//     );

//     return {
//       issues: issuesResponse.data.issues || [],
//       metrics: metricsResponse.data.component?.measures || [],
//       total: issuesResponse.data.total || 0
//     };

//   } catch (error) {
//     console.error('Error fetching SonarQube results:', error);
//     return null;
//   }
// };

// // Helper function to check if directory exists
// const directoryExists = async (dirPath) => {
//   try {
//     const stats = await fs.stat(dirPath);
//     return stats.isDirectory();
//   } catch {
//     return false;
//   }
// };

// // Helper function to check if file exists
// const fileExists = async (filePath) => {
//   try {
//     await fs.access(filePath);
//     return true;
//   } catch {
//     return false;
//   }
// };

// // Helper function to read and parse package.json
// const readPackageJson = async (packagePath) => {
//   try {
//     const content = await fs.readFile(packagePath, 'utf8');
//     return JSON.parse(content);
//   } catch {
//     return null;
//   }
// };

// // Enhanced function to recursively find and remove node_modules
// const removeNodeModulesRecursively = async (startPath) => {
//   const removedPaths = [];
//   const errors = [];

//   const searchAndRemove = async (currentPath) => {
//     try {
//       const items = await fs.readdir(currentPath);
      
//       for (const item of items) {
//         const itemPath = path.join(currentPath, item);
        
//         if (item === 'node_modules') {
//           try {
//             console.log(`Removing node_modules at: ${itemPath}`);
//             await fs.rm(itemPath, { recursive: true, force: true });
//             removedPaths.push(path.relative(startPath, itemPath));
//           } catch (error) {
//             console.error(`Failed to remove node_modules at ${itemPath}:`, error);
//             errors.push(`Failed to remove ${path.relative(startPath, itemPath)}: ${error.message}`);
//           }
//         } else if (await directoryExists(itemPath) && 
//                    !item.startsWith('.') && 
//                    !['dist', 'build', 'coverage'].includes(item)) {
//           await searchAndRemove(itemPath);
//         }
//       }
//     } catch (error) {
//       console.error(`Error reading directory ${currentPath}:`, error);
//       errors.push(`Error reading directory ${path.relative(startPath, currentPath)}: ${error.message}`);
//     }
//   };

//   await searchAndRemove(startPath);
  
//   return { removedPaths, errors };
// };

// // Enhanced validation function that checks file types and content
// const validateMernProjectEnhanced = async (extractedPath) => {
//   const validation = {
//     isValid: false,
//     type: 'unknown',
//     errors: [],
//     warnings: [],
//     structure: {},
//     packageJsonLocations: [],
//     hasSrcDirectory: false,
//     fileTypeAnalysis: {}
//   };

//   try {
//     console.log(`Starting enhanced validation for: ${extractedPath}`);

//     // Function to analyze file types in a directory
//     const analyzeFileTypes = async (dirPath, maxDepth = 3) => {
//       const fileTypes = {
//         javascript: 0,
//         python: 0,
//         java: 0,
//         php: 0,
//         csharp: 0,
//         other: 0,
//         pythonFiles: [],
//         javaFiles: [],
//         phpFiles: [],
//         csharpFiles: []
//       };

//       const analyzeRecursive = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return;

//         try {
//           const items = await fs.readdir(currentPath);

//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;

//             const itemPath = path.join(currentPath, item);
//             const stats = await fs.stat(itemPath);

//             if (stats.isFile()) {
//               const ext = path.extname(item).toLowerCase();
//               const relativePath = path.relative(dirPath, itemPath);

//               switch (ext) {
//                 case '.js':
//                 case '.jsx':
//                 case '.ts':
//                 case '.tsx':
//                 case '.mjs':
//                   fileTypes.javascript++;
//                   break;
//                 case '.py':
//                 case '.pyw':
//                 case '.pyx':
//                   fileTypes.python++;
//                   fileTypes.pythonFiles.push(relativePath);
//                   break;
//                 case '.java':
//                 case '.class':
//                   fileTypes.java++;
//                   fileTypes.javaFiles.push(relativePath);
//                   break;
//                 case '.php':
//                 case '.phtml':
//                   fileTypes.php++;
//                   fileTypes.phpFiles.push(relativePath);
//                   break;
//                 case '.cs':
//                 case '.vb':
//                   fileTypes.csharp++;
//                   fileTypes.csharpFiles.push(relativePath);
//                   break;
//                 default:
//                   if (ext) {
//                     fileTypes.other++;
//                   }
//                   break;
//               }
//             } else if (stats.isDirectory()) {
//               await analyzeRecursive(itemPath, depth + 1);
//             }
//           }
//         } catch (error) {
//           console.warn(`Error analyzing files in ${currentPath}:`, error.message);
//         }
//       };

//       await analyzeRecursive(dirPath);
//       return fileTypes;
//     };

//     // Function to find package.json files recursively
//     const findPackageJsonFiles = async (startPath, maxDepth = 3) => {
//       const packageJsonFiles = [];
      
//       const searchRecursive = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return;
        
//         try {
//           const items = await fs.readdir(currentPath);
          
//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;
            
//             const itemPath = path.join(currentPath, item);
            
//             if (item === 'package.json') {
//               const relativePath = path.relative(startPath, itemPath);
//               packageJsonFiles.push({
//                 path: itemPath,
//                 relativePath,
//                 directory: path.dirname(itemPath)
//               });
//             } else if (await directoryExists(itemPath)) {
//               await searchRecursive(itemPath, depth + 1);
//             }
//           }
//         } catch (error) {
//           console.warn(`Error reading directory ${currentPath}:`, error.message);
//         }
//       };
      
//       await searchRecursive(startPath);
//       return packageJsonFiles;
//     };

//     // Check for src directory
//     const checkForSrcDirectory = async (startPath, maxDepth = 3) => {
//       const searchForSrc = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return false;
        
//         try {
//           const items = await fs.readdir(currentPath);
          
//           if (items.includes('src') && await directoryExists(path.join(currentPath, 'src'))) {
//             return true;
//           }
          
//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;
            
//             const itemPath = path.join(currentPath, item);
//             if (await directoryExists(itemPath)) {
//               const found = await searchForSrc(itemPath, depth + 1);
//               if (found) return true;
//             }
//           }
//         } catch (error) {
//           console.warn(`Error searching for src in ${currentPath}:`, error.message);
//         }
        
//         return false;
//       };
      
//       return await searchForSrc(startPath);
//     };

//     // Analyze file types in the entire project
//     const fileTypeAnalysis = await analyzeFileTypes(extractedPath);
//     validation.fileTypeAnalysis = fileTypeAnalysis;

//     // CRITICAL: Check for non-JavaScript backend files
//     if (fileTypeAnalysis.python > 0) {
//       validation.errors.push(`Python files detected (${fileTypeAnalysis.pythonFiles.join(', ')}). This appears to be a Python project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.java > 0) {
//       validation.errors.push(`Java files detected (${fileTypeAnalysis.javaFiles.join(', ')}). This appears to be a Java project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.php > 0) {
//       validation.errors.push(`PHP files detected (${fileTypeAnalysis.phpFiles.join(', ')}). This appears to be a PHP project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.csharp > 0) {
//       validation.errors.push(`C#/.NET files detected (${fileTypeAnalysis.csharpFiles.join(', ')}). This appears to be a .NET project, not a MERN stack project.`);
//     }

//     // Check if there are significantly more non-JS files than JS files
//     const nonJsFiles = fileTypeAnalysis.python + fileTypeAnalysis.java + fileTypeAnalysis.php + fileTypeAnalysis.csharp;
//     if (nonJsFiles > fileTypeAnalysis.javascript && nonJsFiles > 0) {
//       validation.errors.push(`Project contains more non-JavaScript files (${nonJsFiles}) than JavaScript files (${fileTypeAnalysis.javascript}). This does not appear to be a JavaScript/Node.js project.`);
//     }

//     // Early exit if non-JS files detected
//     if (validation.errors.length > 0) {
//       return validation;
//     }

//     // Find all package.json files in the project
//     const packageJsonFiles = await findPackageJsonFiles(extractedPath);
//     validation.packageJsonLocations = packageJsonFiles.map(f => f.relativePath);

//     // Check for src directory
//     validation.hasSrcDirectory = await checkForSrcDirectory(extractedPath);

//     console.log(`Found package.json files at: ${validation.packageJsonLocations.join(', ')}`);
//     console.log(`Has src directory: ${validation.hasSrcDirectory}`);

//     // STRICT VALIDATION: Require at least one package.json
//     if (packageJsonFiles.length === 0) {
//       validation.errors.push('No package.json found in project directory or subdirectories - this is required for a valid Node.js/React project');
//       return validation;
//     }

//     // STRICT VALIDATION: Require src directory
//     if (!validation.hasSrcDirectory) {
//       validation.errors.push('No src directory found - this is required for a valid project structure');
//       return validation;
//     }

//     // STRICT VALIDATION: Require JavaScript files
//     if (fileTypeAnalysis.javascript === 0) {
//       validation.errors.push('No JavaScript/TypeScript files found - this is required for a Node.js/React project');
//       return validation;
//     }

//     // Analyze each package.json to determine project type and validate dependencies
//     let hasReact = false;
//     let hasExpress = false;
//     let hasMongodb = false;
//     let hasNode = false;

//     for (const pkgFile of packageJsonFiles) {
//       const packageJson = await readPackageJson(pkgFile.path);
//       if (!packageJson) continue;

//       const allDeps = {
//         ...packageJson.dependencies,
//         ...packageJson.devDependencies
//       };

//       if (allDeps.react || allDeps['react-dom']) hasReact = true;
//       if (allDeps.express) hasExpress = true;
//       if (allDeps.mongoose || allDeps.mongodb) hasMongodb = true;
//       if (packageJson.engines?.node || allDeps.nodemon) hasNode = true;
//     }

//     // Determine overall project type
//     if (hasReact && hasExpress && (hasMongodb || hasNode)) {
//       validation.type = 'fullstack-mern';
//       validation.isValid = true;
//     } else if (hasReact && hasExpress && packageJsonFiles.length >= 2) {
//       validation.type = 'fullstack-mern';
//       validation.isValid = true;
//       validation.warnings.push('Full-stack project detected but MongoDB dependency not found');
//     } else if (hasReact && !hasExpress && packageJsonFiles.length === 1) {
//       validation.type = 'frontend-react';
//       validation.isValid = true;
//       validation.warnings.push('Frontend-only React project detected');
//     } else if (hasExpress && !hasReact && packageJsonFiles.length === 1) {
//       validation.type = 'backend-node';
//       validation.isValid = true;
//       validation.warnings.push('Backend-only Node.js project detected');
//     } else if ((hasExpress || hasReact || hasMongodb) && packageJsonFiles.length >= 1) {
//       validation.type = 'partial-mern';
//       validation.isValid = true;
//       validation.warnings.push('Partial MERN stack detected - some components may be missing');
//     } else {
//       validation.errors.push('Not a recognizable MERN stack project - missing required dependencies (React, Express, or Node.js indicators)');
//     }

//     return validation;

//   } catch (error) {
//     console.error('Validation error:', error);
//     validation.errors.push(`Validation error: ${error.message}`);
//     return validation;
//   }
// };

// // Function to specifically validate backend directory
// const validateBackendDirectory = async (extractedPath, validation) => {
//   const backendPaths = ['backend', 'server', 'api'];
  
//   for (const backendDir of backendPaths) {
//     const backendPath = path.join(extractedPath, backendDir);
    
//     if (await directoryExists(backendPath)) {
//       try {
//         const backendFiles = await fs.readdir(backendPath);
        
//         const mainFiles = backendFiles.filter(file => {
//           const fileName = file.toLowerCase();
//           return fileName.includes('main') || fileName.includes('app') || 
//                  fileName.includes('server') || fileName.includes('index');
//         });

//         for (const file of mainFiles) {
//           const ext = path.extname(file).toLowerCase();
          
//           if (['.py', '.pyw', '.pyx'].includes(ext)) {
//             validation.errors.push(`Python backend file detected: ${backendDir}/${file}. MERN stack requires Node.js/JavaScript backend, not Python.`);
//           } else if (['.java', '.class'].includes(ext)) {
//             validation.errors.push(`Java backend file detected: ${backendDir}/${file}. MERN stack requires Node.js/JavaScript backend, not Java.`);
//           } else if (['.php', '.phtml'].includes(ext)) {
//             validation.errors.push(`PHP backend file detected: ${backendDir}/${file}. MERN stack requires Node.js/JavaScript backend, not PHP.`);
//           } else if (['.cs', '.vb'].includes(ext)) {
//             validation.errors.push(`C#/.NET backend file detected: ${backendDir}/${file}. MERN stack requires Node.js/JavaScript backend, not C#/.NET.`);
//           }
//         }
//       } catch (error) {
//         console.warn(`Error validating backend directory ${backendDir}:`, error.message);
//       }
//     }
//   }
// };

// // Function to check for framework-specific files
// const checkForNonMernFrameworks = async (extractedPath, validation) => {
//   try {
//     const items = await fs.readdir(extractedPath);
    
//     if (items.includes('manage.py')) {
//       validation.errors.push('Django project detected (manage.py found). This is a Python/Django project, not MERN stack.');
//     }
    
//     if (items.includes('pom.xml') || items.includes('build.gradle')) {
//       validation.errors.push('Java Spring Boot project detected. This is a Java project, not MERN stack.');
//     }
    
//     if (items.includes('artisan') || items.includes('composer.json')) {
//       validation.errors.push('PHP Laravel project detected. This is a PHP project, not MERN stack.');
//     }
    
//     if (items.some(item => item.endsWith('.csproj') || item.endsWith('.sln'))) {
//       validation.errors.push('.NET project detected. This is a C#/.NET project, not MERN stack.');
//     }

//     if (items.includes('requirements.txt') || items.includes('Pipfile')) {
//       validation.errors.push('Python dependency files detected. This appears to be a Python project, not MERN stack.');
//     }
//   } catch (error) {
//     console.warn('Error checking for non-MERN frameworks:', error.message);
//   }
// };

// const validateMernProject = async (extractedPath) => {
//   const validation = await validateMernProjectEnhanced(extractedPath);
//   await checkForNonMernFrameworks(extractedPath, validation);
//   return validation;
// };

// const cleanupProject = async (extractedPath) => {
//   const cleanupResults = {
//     removed: [],
//     errors: [],
//     nodeModulesRemoved: []
//   };

//   try {
//     console.log('Starting project cleanup...');
    
//     const nodeModulesResult = await removeNodeModulesRecursively(extractedPath);
//     cleanupResults.nodeModulesRemoved = nodeModulesResult.removedPaths;
//     cleanupResults.errors.push(...nodeModulesResult.errors);
    
//     console.log(`Removed ${nodeModulesResult.removedPaths.length} node_modules directories`);

//     const itemsToRemove = [
//       '.git', '.DS_Store', 'Thumbs.db',
//       'dist', 'build', '.cache', '.parcel-cache', 
//       '.next', '.nuxt', 'coverage', '.nyc_output'
//     ];

//     for (const item of itemsToRemove) {
//       try {
//         const itemPath = path.join(extractedPath, item);
        
//         try {
//           const stats = await fs.stat(itemPath);
          
//           if (stats.isDirectory()) {
//             await fs.rm(itemPath, { recursive: true, force: true });
//             cleanupResults.removed.push(`Directory: ${item}`);
//           } else {
//             await fs.unlink(itemPath);
//             cleanupResults.removed.push(`File: ${item}`);
//           }
//         } catch (error) {
//           if (error.code !== 'ENOENT') {
//             cleanupResults.errors.push(`Failed to remove ${item}: ${error.message}`);
//           }
//         }
//       } catch (error) {
//         cleanupResults.errors.push(`Error processing ${item}: ${error.message}`);
//       }
//     }

//     console.log(`Cleanup completed: ${cleanupResults.removed.length} items removed`);
    
//   } catch (error) {
//     console.error('Cleanup error:', error);
//     cleanupResults.errors.push(`Cleanup error: ${error.message}`);
//   }

//   return cleanupResults;
// };

// const extractZipFile = async (zipPath, extractionPath) => {
//   try {
//     const zip = new AdmZip(zipPath);
//     const entries = zip.getEntries();
    
//     if (entries.length === 0) {
//       throw new Error('ZIP file is empty');
//     }
    
//     await fs.mkdir(extractionPath, { recursive: true });
//     zip.extractAllTo(extractionPath, true);
    
//     const macOSXPath = path.join(extractionPath, '__MACOSX');
//     if (await directoryExists(macOSXPath)) {
//       await fs.rm(macOSXPath, { recursive: true, force: true });
//     }
    
//     const extractedItems = await fs.readdir(extractionPath);
//     const validItems = extractedItems.filter(item => 
//       !item.startsWith('.') && 
//       !item.includes('__MACOSX') &&
//       !item.includes('_temp_')
//     );
    
//     if (validItems.length === 0) {
//       throw new Error('No valid files found after extraction');
//     }
    
//     console.log(`Successfully extracted ${validItems.length} items`);
    
//     return {
//       success: true,
//       extractedPath: extractionPath,
//       itemCount: validItems.length
//     };
//   } catch (error) {
//     console.error('ZIP extraction error:', error);
//     throw new Error(`Failed to extract ZIP: ${error.message}`);
//   }
// };

// const handleMulterError = (error, res) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         message: 'File too large. Maximum size is 100MB.'
//       });
//     }
//     return res.status(400).json({
//       success: false,
//       message: `Upload error: ${error.message}`
//     });
//   }
  
//   if (error.message === 'Only ZIP files are allowed') {
//     return res.status(400).json({
//       success: false,
//       message: 'Only ZIP files are allowed'
//     });
//   }

//   return res.status(500).json({
//     success: false,
//     message: error.message || 'Upload failed'
//   });
// };

// // POST /api/projects/upload - Upload ZIP project with SonarQube analysis
// router.post('/upload', auth, (req, res) => {
//   upload.single('project')(req, res, async (err) => {
//     if (err) {
//       return handleMulterError(err, res);
//     }

//     let extractedPath = null;
//     let project = null;

//     try {
//       if (!req.file) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'No file uploaded' 
//         });
//       }

//       const { projectName, description } = req.body;
      
//       const extractionDirName = `project-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//       const extractedDir = await ensureExtractedDir();
//       extractedPath = path.join(extractedDir, extractionDirName);

//       console.log(`Extracting project to: ${extractedPath}`);

//       // Extract ZIP file
//       const extractionResult = await extractZipFile(req.file.path, extractedPath);
      
//       console.log('ZIP extracted successfully, validating MERN structure...');

//       // Validate MERN stack project
//       const validation = await validateMernProject(extractedPath);
      
//       console.log('Validation result:', {
//         isValid: validation.isValid,
//         type: validation.type,
//         errors: validation.errors
//       });

//       if (!validation.isValid) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//           await fs.unlink(req.file.path);
//         } catch (cleanupError) {
//           console.error('Error cleaning up:', cleanupError);
//         }

//         return res.status(400).json({
//           success: false,
//           message: 'Invalid project structure',
//           errors: validation.errors,
//           warnings: validation.warnings,
//           requirements: [
//             'Project must contain at least one package.json file',
//             'Project must have a src directory',
//             'Project must be a valid Node.js/React/MERN project'
//           ]
//         });
//       }

//       console.log(`Valid ${validation.type} project detected, cleaning up...`);

//       // Clean up unwanted files
//       const cleanupResults = await cleanupProject(extractedPath);

//       console.log('Cleanup completed');

//       // Create project record first (before analysis)
//       const sanitizedProjectName = (projectName || req.file.originalname.replace('.zip', ''))
//         .replace(/[^a-zA-Z0-9-_]/g, '-')
//         .toLowerCase();
      
//       const projectKey = `${sanitizedProjectName}-${Date.now()}`;

//       project = new Project({
//         user: req.user.userId,
//         source: 'zip',
//         zipFilePath: req.file.path,
//         extractedPath: extractedPath,
//         projectName: projectName || req.file.originalname.replace('.zip', ''),
//         description: description || '',
//         analysisStatus: 'processing',
//         projectType: validation.type,
//         validationResult: validation,
//         cleanupResult: cleanupResults,
//         sonarQubeProjectKey: projectKey
//       });

//       await project.save();

//       // Create sonar-project.properties file
//       console.log('Creating SonarQube configuration...');
//       await createSonarPropertiesFile(extractedPath, projectKey);

//       // Send immediate response
//       res.json({
//         success: true,
//         message: 'Project uploaded successfully. SonarQube analysis is in progress.',
//         project: {
//           id: project._id,
//           name: project.projectName,
//           source: project.source,
//           type: project.projectType,
//           status: project.analysisStatus,
//           sonarQubeProjectKey: projectKey,
//           validation: {
//             type: validation.type,
//             warnings: validation.warnings
//           },
//           cleanup: {
//             itemsRemoved: cleanupResults.removed.length,
//             nodeModulesRemoved: cleanupResults.nodeModulesRemoved.length
//           },
//           createdAt: project.createdAt
//         }
//       });

//       // Run SonarQube analysis asynchronously (after response sent)
//       console.log('Starting SonarQube analysis in background...');
//       runSonarQubeAnalysis(extractedPath, projectKey)
//         .then(async (scanResult) => {
//           console.log('SonarQube scan completed, fetching results...');
          
//           // Wait a bit for SonarQube to process the results
//           await new Promise(resolve => setTimeout(resolve, 5000));
          
//           // Fetch analysis results from SonarQube
//           const analysisResults = await fetchSonarQubeResults(projectKey);
          
//           // Update project with completed status and results
//           project.analysisStatus = 'completed';
//           project.sonarQubeResults = {
//             scanCompleted: true,
//             scanDate: new Date(),
//             issues: analysisResults?.issues || [],
//             metrics: analysisResults?.metrics || [],
//             totalIssues: analysisResults?.total || 0
//           };
//           await project.save();
          
//           console.log(`Project analysis completed: ${projectKey} - Found ${analysisResults?.total || 0} issues`);
//         })
//         .catch(async (error) => {
//           console.error('SonarQube analysis failed:', error);
          
//           // Update project with failed status
//           project.analysisStatus = 'failed';
//           project.sonarQubeResults = {
//             scanCompleted: false,
//             error: error.message,
//             scanDate: new Date()
//           };
//           await project.save();
          
//           console.log(`Project analysis failed: ${projectKey}`);
//         });

//       console.log(`Project uploaded and queued for analysis: ${project.projectName}`);

//     } catch (error) {
//       console.error('Upload and processing error:', error);
      
//       if (extractedPath) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//         } catch (cleanupError) {
//           console.error('Error cleaning up extracted files:', cleanupError);
//         }
//       }

//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (unlinkError) {
//           console.error('Error deleting uploaded file:', unlinkError);
//         }
//       }

//       if (project && project._id) {
//         try {
//           await Project.findByIdAndDelete(project._id);
//         } catch (deleteError) {
//           console.error('Error deleting project record:', deleteError);
//         }
//       }

//       res.status(500).json({
//         success: false,
//         message: error.message || 'Upload and processing failed'
//       });
//     }
//   });
// });

// // GET /api/projects - Get user's projects
// router.get('/', auth, async (req, res) => {
//   try {
//     const projects = await Project.find({ user: req.user.userId })
//       .sort({ createdAt: -1 })
//       .select('-zipFilePath -extractedPath -validationResult -cleanupResult');

//     res.json({
//       success: true,
//       projects
//     });
//   } catch (error) {
//     console.error('Error fetching projects:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch projects'
//     });
//   }
// });

// // GET /api/projects/:id - Get specific project
// router.get('/:id', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     res.json({
//       success: true,
//       project
//     });
//   } catch (error) {
//     console.error('Error fetching project:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch project'
//     });
//   }
// });

// // GET /api/projects/:id/sonarqube - Get SonarQube analysis results
// router.get('/:id/sonarqube', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     if (!project.sonarQubeProjectKey) {
//       return res.status(400).json({
//         success: false,
//         message: 'SonarQube analysis not configured for this project'
//       });
//     }

//     // Fetch fresh results from SonarQube if analysis is completed
//     let results = project.sonarQubeResults;
    
//     if (project.analysisStatus === 'completed') {
//       const freshResults = await fetchSonarQubeResults(project.sonarQubeProjectKey);
//       if (freshResults) {
//         results = {
//           ...project.sonarQubeResults,
//           issues: freshResults.issues,
//           metrics: freshResults.metrics,
//           totalIssues: freshResults.total
//         };
//       }
//     }

//     res.json({
//       success: true,
//       projectKey: project.sonarQubeProjectKey,
//       status: project.analysisStatus,
//       results: results,
//       sonarQubeUrl: `${SONAR_CONFIG.hostUrl}/dashboard?id=${project.sonarQubeProjectKey}`
//     });

//   } catch (error) {
//     console.error('Error fetching SonarQube results:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch SonarQube results'
//     });
//   }
// });

// // GET /api/projects/:id/duplication-metrics - Get detailed duplication metrics
// // GET /api/projects/:id/duplication-metrics - Get detailed duplication metrics
// router.get('/:id/duplication-metrics', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     if (!project.sonarQubeProjectKey) {
//       return res.status(400).json({
//         success: false,
//         message: 'SonarQube analysis not configured for this project'
//       });
//     }

//     const axios = require('axios');
//     const authToken = Buffer.from(`${SONAR_CONFIG.token}:`).toString('base64');

//     try {
//       // Fetch duplication density
//       const densityResponse = await axios.get(
//         `${SONAR_CONFIG.hostUrl}/api/measures/component`,
//         {
//           params: {
//             component: project.sonarQubeProjectKey,
//             metricKeys: 'duplicated_lines_density'
//           },
//           headers: {
//             'Authorization': `Basic ${authToken}`
//           },
//           timeout: 60000
//         }
//       );

//       // Fetch duplicated files count
//       const duplicatedFilesResponse = await axios.get(
//         `${SONAR_CONFIG.hostUrl}/api/measures/component`,
//         {
//           params: {
//             component: project.sonarQubeProjectKey,
//             metricKeys: 'duplicated_files'
//           },
//           headers: {
//             'Authorization': `Basic ${authToken}`
//           },
//           timeout: 60000
//         }
//       );

//       // Fetch duplicated lines count
//       const duplicatedLinesResponse = await axios.get(
//         `${SONAR_CONFIG.hostUrl}/api/measures/component`,
//         {
//           params: {
//             component: project.sonarQubeProjectKey,
//             metricKeys: 'duplicated_lines'
//           },
//           headers: {
//             'Authorization': `Basic ${authToken}`
//           },
//           timeout: 60000
//         }
//       );

//       // Fetch list of duplicated files with detailed metrics
//       const duplicatedFilesListResponse = await axios.get(
//         `${SONAR_CONFIG.hostUrl}/api/measures/component_tree`,
//         {
//           params: {
//             component: project.sonarQubeProjectKey,
//             metricKeys: 'duplicated_lines_density,duplicated_lines,ncloc,lines',
//             qualifiers: 'FIL',
//             ps: 500
//           },
//           headers: {
//             'Authorization': `Basic ${authToken}`
//           },
//           timeout: 60000
//         }
//       );

//       const getDuplicationValue = (response, metricKey) => {
//         const measures = response.data.component?.measures || [];
//         const measure = measures.find(m => m.metric === metricKey);
//         return measure?.value;
//       };

//       // Get duplicated files with their metrics
//       const duplicatedFiles = (duplicatedFilesListResponse.data.components || [])
//         .filter(comp => {
//           const measure = comp.measures?.find(m => m.metric === 'duplicated_lines_density');
//           return measure && parseFloat(measure.value) > 0;
//         })
//         .map(comp => {
//           const densityMeasure = comp.measures?.find(m => m.metric === 'duplicated_lines_density');
//           const duplicatedLinesMeasure = comp.measures?.find(m => m.metric === 'duplicated_lines');
//           const nclocMeasure = comp.measures?.find(m => m.metric === 'ncloc');
//           const linesMeasure = comp.measures?.find(m => m.metric === 'lines');
          
//           const totalLines = parseInt(nclocMeasure?.value || linesMeasure?.value || 0);
          
//           return {
//             key: comp.key,
//             name: comp.name,
//             path: comp.path,
//             duplicatedLinesDensity: parseFloat(densityMeasure?.value || 0),
//             duplicatedLines: parseInt(duplicatedLinesMeasure?.value || 0),
//             totalLines: totalLines
//           };
//         });

//       // Fetch duplication details for each file
//       const duplicationPairs = [];
//       const fetchedPairs = new Set();

//       for (const file of duplicatedFiles) {
//         try {
//           const duplicationResponse = await axios.get(
//             `${SONAR_CONFIG.hostUrl}/api/duplications/show`,
//             {
//               params: {
//                 key: file.key
//               },
//               headers: {
//                 'Authorization': `Basic ${authToken}`
//               },
//               timeout: 60000
//             }
//           );

//           const duplicationBlocks = duplicationResponse.data.duplicationBlocks || [];

//           for (const block of duplicationBlocks) {
//             if (block.duplicateBlocks && block.duplicateBlocks.length > 0) {
//               for (const duplicateBlock of block.duplicateBlocks) {
//                 const duplicateFileKey = duplicateBlock.key;
                
//                 if (duplicateFileKey && duplicateFileKey !== file.key) {
//                   const pair = [file.key, duplicateFileKey].sort().join('|');
                  
//                   if (!fetchedPairs.has(pair)) {
//                     fetchedPairs.add(pair);
                    
//                     const file1 = duplicatedFiles.find(f => f.key === file.key);
//                     const file2 = duplicatedFiles.find(f => f.key === duplicateFileKey);
                    
//                     if (file1 && file2 && file1.totalLines > 0 && file2.totalLines > 0) {
//                       const sharedLines = block.size || 0;
                      
//                       const similarity1 = (sharedLines / file1.totalLines) * 100;
//                       const similarity2 = (sharedLines / file2.totalLines) * 100;
//                       const avgSimilarity = (similarity1 + similarity2) / 2;
                      
//                       duplicationPairs.push({
//                         file1: file1.name,
//                         file1Path: file1.path,
//                         file2: file2.name,
//                         file2Path: file2.path,
//                         sharedLines: sharedLines,
//                         file1TotalLines: file1.totalLines,
//                         file2TotalLines: file2.totalLines,
//                         similarity1Percentage: similarity1.toFixed(1),
//                         similarity2Percentage: similarity2.toFixed(1),
//                         avgSimilarity: avgSimilarity.toFixed(1)
//                       });
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         } catch (err) {
//           console.warn(`Could not fetch duplication details for ${file.key}:`, err.message);
//         }
//       }

//       // Filter pairs where similarity is 50%+
//       const highlySimilarPairs = duplicationPairs.filter(pair => 
//         parseFloat(pair.similarity1Percentage) >= 50 || parseFloat(pair.similarity2Percentage) >= 50
//       );

//       highlySimilarPairs.sort((a, b) => parseFloat(b.avgSimilarity) - parseFloat(a.avgSimilarity));

//       res.json({
//         success: true,
//         duplicatedLinesDensity: getDuplicationValue(densityResponse, 'duplicated_lines_density'),
//         duplicatedFiles: getDuplicationValue(duplicatedFilesResponse, 'duplicated_files'),
//         duplicatedLines: getDuplicationValue(duplicatedLinesResponse, 'duplicated_lines'),
//         duplicatedFilesList: duplicatedFiles,
//         highlySimilarPairs: highlySimilarPairs
//       });

//     } catch (sonarError) {
//       console.error('SonarQube API error:', sonarError);
//       res.status(500).json({
//         success: false,
//         message: 'Error fetching duplication metrics from SonarQube'
//       });
//     }

//   } catch (error) {
//     console.error('Error fetching duplication metrics:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch duplication metrics'
//     });
//   }
// });

// // DELETE /api/projects/:id - Delete project
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     if (project.source === 'zip' && project.zipFilePath) {
//       try {
//         await fs.unlink(project.zipFilePath);
//       } catch (unlinkError) {
//         console.error('Error deleting ZIP file:', unlinkError);
//       }
//     }

//     if (project.extractedPath) {
//       try {
//         await fs.rm(project.extractedPath, { recursive: true, force: true });
//       } catch (unlinkError) {
//         console.error('Error deleting extracted directory:', unlinkError);
//       }
//     }

//     await Project.findByIdAndDelete(req.params.id);

//     res.json({
//       success: true,
//       message: 'Project deleted successfully'
//     });
//   } catch (error) {
//     console.error('Error deleting project:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete project'
//     });
//   }
// });

// // Export functions for use in other modules
// const exportedFunctions = {
//   ensureExtractedDir,
//   validateMernProject,
//   cleanupProject,
//   removeNodeModulesRecursively,
//   validateMernProjectEnhanced,
//   validateBackendDirectory,
//   checkForNonMernFrameworks,
//   directoryExists,
//   fileExists,
//   readPackageJson,
//   createSonarPropertiesFile,
//   runSonarQubeAnalysis,
//   fetchSonarQubeResults
// };

// // Export both router and utility functions
// module.exports = router;
// module.exports.functions = exportedFunctions;



//working 
// routes/projects.js - COMPLETE FILE - COPY AND PASTE THIS ENTIRE FILE
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs').promises;
// const AdmZip = require('adm-zip');
// const crypto = require('crypto');
// const parser = require('@babel/parser');
// const traverse = require('@babel/traverse').default;
// const Project = require('../models/repository');
// const auth = require('../middleware/auth');
// const router = express.Router();

// const ensureUploadDir = async () => {
//   const uploadDir = path.join(__dirname, '../uploads/projects/manual_uploads');
//   try {
//     await fs.access(uploadDir);
//   } catch (error) {
//     await fs.mkdir(uploadDir, { recursive: true });
//   }
//   return uploadDir;
// };

// const ensureExtractedDir = async () => {
//   const extractedDir = path.join(__dirname, '../uploads/projects/extracted-projects');
//   try {
//     await fs.access(extractedDir);
//   } catch (error) {
//     await fs.mkdir(extractedDir, { recursive: true });
//   }
//   return extractedDir;
// };

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: async function (req, file, cb) {
//     const uploadDir = await ensureUploadDir();
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, `project-${uniqueSuffix}${path.extname(file.originalname)}`);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'application/zip' || 
//       file.mimetype === 'application/x-zip-compressed' ||
//       file.originalname.toLowerCase().endsWith('.zip')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only ZIP files are allowed'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB limit
//   }
// });

// // ==================== CODE DUPLICATION DETECTION ====================

// // Parse JavaScript/TypeScript file to AST
// const parseFile = async (filePath) => {
//   try {
//     const code = await fs.readFile(filePath, 'utf8');
//     return parser.parse(code, {
//       sourceType: 'module',
//       plugins: ['jsx', 'typescript', 'decorators-legacy'],
//       errorRecovery: true,
//     });
//   } catch (error) {
//     console.warn(`Failed to parse ${filePath}:`, error.message);
//     return null;
//   }
// };

// // Collect code units (functions, classes, blocks) from AST
// const collectUnits = (ast, filePath) => {
//   const units = [];

//   if (!ast) return units;

//   try {
//     traverse(ast, {
//       FunctionDeclaration(path) {
//         units.push(makeUnit('function', path.node, filePath, path.node.id?.name));
//       },
//       ArrowFunctionExpression(path) {
//         const parent = path.parent;
//         let name = 'anonymous';
//         if (parent.type === 'VariableDeclarator' && parent.id) {
//           name = parent.id.name;
//         }
//         units.push(makeUnit('function', path.node, filePath, name));
//       },
//       FunctionExpression(path) {
//         const name = path.node.id?.name || 'anonymous';
//         units.push(makeUnit('function', path.node, filePath, name));
//       },
//       ClassDeclaration(path) {
//         units.push(makeUnit('class', path.node, filePath, path.node.id?.name));
//       },
//       ClassMethod(path) {
//         units.push(makeUnit('method', path.node, filePath, path.node.key?.name));
//       },
//       ObjectMethod(path) {
//         units.push(makeUnit('method', path.node, filePath, path.node.key?.name));
//       },
//       BlockStatement(path) {
//         // Only capture large blocks to avoid noise
//         if (path.node.body && path.node.body.length >= 5) {
//           // Skip if it's part of a function/class we already captured
//           const parent = path.parent;
//           if (!['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 
//                 'ClassMethod', 'ObjectMethod'].includes(parent.type)) {
//             units.push(makeUnit('block', path.node, filePath, 'code-block'));
//           }
//         }
//       },
//     });
//   } catch (error) {
//     console.error(`Error traversing AST for ${filePath}:`, error.message);
//   }

//   return units;
// };

// const makeUnit = (type, node, filePath, name = 'unnamed') => {
//   return {
//     type,
//     filePath,
//     name,
//     loc: node.loc,
//     node,
//     startLine: node.loc?.start?.line || 0,
//     endLine: node.loc?.end?.line || 0,
//   };
// };

// // Canonicalize AST node (normalize variable names, literals)
// const canonicalizeNode = (node) => {
//   const clone = JSON.parse(JSON.stringify(node));
//   const idMap = new Map();
//   let idCounter = 0;

//   const getId = (name) => {
//     if (!idMap.has(name)) {
//       idMap.set(name, `ID${idCounter++}`);
//     }
//     return idMap.get(name);
//   };

//   const visit = (n) => {
//     if (!n || typeof n !== 'object') return;

//     // Normalize identifiers
//     if (n.type === 'Identifier') {
//       n.name = getId(n.name);
//     }

//     // Normalize literals
//     if (n.type === 'NumericLiteral') n.value = 'NUM';
//     if (n.type === 'StringLiteral') n.value = 'STR';
//     if (n.type === 'BooleanLiteral') n.value = 'BOOL';
//     if (n.type === 'NullLiteral') n.value = 'NULL';

//     // Remove location info
//     delete n.start;
//     delete n.end;
//     delete n.loc;
//     delete n.range;

//     for (const key of Object.keys(n)) {
//       const val = n[key];
//       if (Array.isArray(val)) {
//         val.forEach(visit);
//       } else if (typeof val === 'object') {
//         visit(val);
//       }
//     }
//   };

//   visit(clone);
//   return clone;
// };

// const canonicalString = (node) => {
//   const canonical = canonicalizeNode(node);
//   return JSON.stringify(canonical);
// };

// const hashString = (str) => {
//   return crypto.createHash('sha256').update(str).digest('hex');
// };

// // Calculate similarity between two canonical strings
// const calculateSimilarity = (canonA, canonB) => {
//   const tokensA = canonA.split(/\W+/).filter(Boolean);
//   const tokensB = canonB.split(/\W+/).filter(Boolean);

//   const setA = new Set(tokensA);
//   const setB = new Set(tokensB);

//   const intersection = new Set([...setA].filter(x => setB.has(x)));
//   const union = new Set([...setA, ...setB]);

//   return union.size > 0 ? intersection.size / union.size : 0;
// };

// // Recursively find all JS/TS files
// const findCodeFiles = async (dirPath, fileList = []) => {
//   try {
//     const items = await fs.readdir(dirPath);

//     for (const item of items) {
//       if (item.startsWith('.') || item === 'node_modules') continue;

//       const itemPath = path.join(dirPath, item);
//       const stats = await fs.stat(itemPath);

//       if (stats.isDirectory()) {
//         await findCodeFiles(itemPath, fileList);
//       } else if (stats.isFile()) {
//         const ext = path.extname(item).toLowerCase();
//         if (['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext)) {
//           fileList.push(itemPath);
//         }
//       }
//     }
//   } catch (error) {
//     console.warn(`Error reading directory ${dirPath}:`, error.message);
//   }

//   return fileList;
// };

// // Main duplication analysis function
// const analyzeDuplication = async (projectPath) => {
//   console.log('Starting code duplication analysis...');
  
//   const results = {
//     exactClones: [],
//     nearClones: [],
//     stats: {
//       totalFiles: 0,
//       totalUnits: 0,
//       exactCloneGroups: 0,
//       nearCloneGroups: 0,
//       duplicatedUnits: 0,
//     }
//   };

//   try {
//     // Find all code files
//     const codeFiles = await findCodeFiles(projectPath);
//     results.stats.totalFiles = codeFiles.length;

//     if (codeFiles.length === 0) {
//       console.log('No code files found');
//       return results;
//     }

//     console.log(`Found ${codeFiles.length} code files`);

//     // Parse files and collect units
//     const allUnits = [];
//     const hashMap = new Map(); // hash -> [unitInfo]

//     for (const file of codeFiles) {
//       const ast = await parseFile(file);
//       if (!ast) continue;

//       const units = collectUnits(ast, file);
//       allUnits.push(...units);

//       for (const unit of units) {
//         const canon = canonicalString(unit.node);
//         const hash = hashString(canon);

//         if (!hashMap.has(hash)) {
//           hashMap.set(hash, []);
//         }

//         const relativePath = path.relative(projectPath, unit.filePath);
//         hashMap.get(hash).push({
//           type: unit.type,
//           name: unit.name,
//           file: relativePath,
//           filePath: unit.filePath,
//           loc: unit.loc,
//           startLine: unit.startLine,
//           endLine: unit.endLine,
//           canonical: canon,
//           lineCount: unit.endLine - unit.startLine + 1,
//         });
//       }
//     }

//     results.stats.totalUnits = allUnits.length;
//     console.log(`Collected ${allUnits.length} code units`);

//     // Detect exact clones
//     let groupId = 1;
//     for (const [hash, occurrences] of hashMap.entries()) {
//       if (occurrences.length >= 2) {
//         results.exactClones.push({
//           groupId: groupId++,
//           hash,
//           type: occurrences[0].type,
//           occurrences,
//           duplicateCount: occurrences.length,
//         });
//         results.stats.duplicatedUnits += occurrences.length;
//       }
//     }

//     results.stats.exactCloneGroups = results.exactClones.length;
//     console.log(`Found ${results.exactClones.length} exact clone groups`);

//     // Detect near-duplicates (similar but not exact)
//     const SIMILARITY_THRESHOLD = 0.8;
//     const processedPairs = new Set();

//     // Only compare units of same type and similar size
//     const unitsByType = new Map();
//     for (const unit of allUnits) {
//       if (!unitsByType.has(unit.type)) {
//         unitsByType.set(unit.type, []);
//       }
//       unitsByType.get(unit.type).push(unit);
//     }

//     for (const [type, units] of unitsByType.entries()) {
//       // Only check larger units for near-duplicates (≥10 lines)
//       const largeUnits = units.filter(u => (u.endLine - u.startLine) >= 10);

//       for (let i = 0; i < largeUnits.length; i++) {
//         for (let j = i + 1; j < largeUnits.length; j++) {
//           const unitA = largeUnits[i];
//           const unitB = largeUnits[j];

//           // Skip if same file (likely same unit)
//           if (unitA.filePath === unitB.filePath) continue;

//           const canonA = canonicalString(unitA.node);
//           const canonB = canonicalString(unitB.node);
//           const hashA = hashString(canonA);
//           const hashB = hashString(canonB);

//           // Skip if already exact duplicates
//           if (hashA === hashB) continue;

//           const pairKey = [hashA, hashB].sort().join('|');
//           if (processedPairs.has(pairKey)) continue;
//           processedPairs.add(pairKey);

//           // Check size similarity (within 30% of each other)
//           const sizeA = canonA.length;
//           const sizeB = canonB.length;
//           const sizeRatio = Math.min(sizeA, sizeB) / Math.max(sizeA, sizeB);

//           if (sizeRatio < 0.7) continue;

//           // Calculate token-based similarity
//           const similarity = calculateSimilarity(canonA, canonB);

//           if (similarity >= SIMILARITY_THRESHOLD) {
//             const relativePathA = path.relative(projectPath, unitA.filePath);
//             const relativePathB = path.relative(projectPath, unitB.filePath);

//             results.nearClones.push({
//               groupId: groupId++,
//               type,
//               similarity: parseFloat(similarity.toFixed(3)),
//               occurrences: [
//                 {
//                   type: unitA.type,
//                   name: unitA.name,
//                   file: relativePathA,
//                   filePath: unitA.filePath,
//                   loc: unitA.loc,
//                   startLine: unitA.startLine,
//                   endLine: unitA.endLine,
//                   lineCount: unitA.endLine - unitA.startLine + 1,
//                 },
//                 {
//                   type: unitB.type,
//                   name: unitB.name,
//                   file: relativePathB,
//                   filePath: unitB.filePath,
//                   loc: unitB.loc,
//                   startLine: unitB.startLine,
//                   endLine: unitB.endLine,
//                   lineCount: unitB.endLine - unitB.startLine + 1,
//                 }
//               ]
//             });
//           }
//         }
//       }
//     }

//     results.stats.nearCloneGroups = results.nearClones.length;
//     console.log(`Found ${results.nearClones.length} near-clone groups`);

//     return results;

//   } catch (error) {
//     console.error('Duplication analysis error:', error);
//     throw error;
//   }
// };

// // ==================== VALIDATION FUNCTIONS ====================

// const directoryExists = async (dirPath) => {
//   try {
//     const stats = await fs.stat(dirPath);
//     return stats.isDirectory();
//   } catch {
//     return false;
//   }
// };

// const fileExists = async (filePath) => {
//   try {
//     await fs.access(filePath);
//     return true;
//   } catch {
//     return false;
//   }
// };

// const readPackageJson = async (packagePath) => {
//   try {
//     const content = await fs.readFile(packagePath, 'utf8');
//     return JSON.parse(content);
//   } catch {
//     return null;
//   }
// };

// const removeNodeModulesRecursively = async (startPath) => {
//   const removedPaths = [];
//   const errors = [];

//   const searchAndRemove = async (currentPath) => {
//     try {
//       const items = await fs.readdir(currentPath);
      
//       for (const item of items) {
//         const itemPath = path.join(currentPath, item);
        
//         if (item === 'node_modules') {
//           try {
//             console.log(`Removing node_modules at: ${itemPath}`);
//             await fs.rm(itemPath, { recursive: true, force: true });
//             removedPaths.push(path.relative(startPath, itemPath));
//           } catch (error) {
//             console.error(`Failed to remove node_modules at ${itemPath}:`, error);
//             errors.push(`Failed to remove ${path.relative(startPath, itemPath)}: ${error.message}`);
//           }
//         } else if (await directoryExists(itemPath) && 
//                    !item.startsWith('.') && 
//                    !['dist', 'build', 'coverage'].includes(item)) {
//           await searchAndRemove(itemPath);
//         }
//       }
//     } catch (error) {
//       console.error(`Error reading directory ${currentPath}:`, error);
//       errors.push(`Error reading directory ${path.relative(startPath, currentPath)}: ${error.message}`);
//     }
//   };

//   await searchAndRemove(startPath);
  
//   return { removedPaths, errors };
// };

// const validateMernProjectEnhanced = async (extractedPath) => {
//   const validation = {
//     isValid: false,
//     type: 'unknown',
//     errors: [],
//     warnings: [],
//     structure: {},
//     packageJsonLocations: [],
//     hasSrcDirectory: false,
//     fileTypeAnalysis: {}
//   };

//   try {
//     console.log(`Starting enhanced validation for: ${extractedPath}`);

//     const analyzeFileTypes = async (dirPath, maxDepth = 3) => {
//       const fileTypes = {
//         javascript: 0,
//         python: 0,
//         java: 0,
//         php: 0,
//         csharp: 0,
//         other: 0,
//         pythonFiles: [],
//         javaFiles: [],
//         phpFiles: [],
//         csharpFiles: []
//       };

//       const analyzeRecursive = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return;

//         try {
//           const items = await fs.readdir(currentPath);

//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;

//             const itemPath = path.join(currentPath, item);
//             const stats = await fs.stat(itemPath);

//             if (stats.isFile()) {
//               const ext = path.extname(item).toLowerCase();
//               const relativePath = path.relative(dirPath, itemPath);

//               switch (ext) {
//                 case '.js':
//                 case '.jsx':
//                 case '.ts':
//                 case '.tsx':
//                 case '.mjs':
//                   fileTypes.javascript++;
//                   break;
//                 case '.py':
//                 case '.pyw':
//                 case '.pyx':
//                   fileTypes.python++;
//                   fileTypes.pythonFiles.push(relativePath);
//                   break;
//                 case '.java':
//                 case '.class':
//                   fileTypes.java++;
//                   fileTypes.javaFiles.push(relativePath);
//                   break;
//                 case '.php':
//                 case '.phtml':
//                   fileTypes.php++;
//                   fileTypes.phpFiles.push(relativePath);
//                   break;
//                 case '.cs':
//                 case '.vb':
//                   fileTypes.csharp++;
//                   fileTypes.csharpFiles.push(relativePath);
//                   break;
//                 default:
//                   if (ext) {
//                     fileTypes.other++;
//                   }
//                   break;
//               }
//             } else if (stats.isDirectory()) {
//               await analyzeRecursive(itemPath, depth + 1);
//             }
//           }
//         } catch (error) {
//           console.warn(`Error analyzing files in ${currentPath}:`, error.message);
//         }
//       };

//       await analyzeRecursive(dirPath);
//       return fileTypes;
//     };

//     const findPackageJsonFiles = async (startPath, maxDepth = 3) => {
//       const packageJsonFiles = [];
      
//       const searchRecursive = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return;
        
//         try {
//           const items = await fs.readdir(currentPath);
          
//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;
            
//             const itemPath = path.join(currentPath, item);
            
//             if (item === 'package.json') {
//               const relativePath = path.relative(startPath, itemPath);
//               packageJsonFiles.push({
//                 path: itemPath,
//                 relativePath,
//                 directory: path.dirname(itemPath)
//               });
//             } else if (await directoryExists(itemPath)) {
//               await searchRecursive(itemPath, depth + 1);
//             }
//           }
//         } catch (error) {
//           console.warn(`Error reading directory ${currentPath}:`, error.message);
//         }
//       };
      
//       await searchRecursive(startPath);
//       return packageJsonFiles;
//     };

//     const checkForSrcDirectory = async (startPath, maxDepth = 3) => {
//       const searchForSrc = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return false;
        
//         try {
//           const items = await fs.readdir(currentPath);
          
//           if (items.includes('src') && await directoryExists(path.join(currentPath, 'src'))) {
//             return true;
//           }
          
//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;
            
//             const itemPath = path.join(currentPath, item);
//             if (await directoryExists(itemPath)) {
//               const found = await searchForSrc(itemPath, depth + 1);
//               if (found) return true;
//             }
//           }
//         } catch (error) {
//           console.warn(`Error searching for src in ${currentPath}:`, error.message);
//         }
        
//         return false;
//       };
      
//       return await searchForSrc(startPath);
//     };

//     const fileTypeAnalysis = await analyzeFileTypes(extractedPath);
//     validation.fileTypeAnalysis = fileTypeAnalysis;

//     if (fileTypeAnalysis.python > 0) {
//       validation.errors.push(`Python files detected (${fileTypeAnalysis.pythonFiles.join(', ')}). This appears to be a Python project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.java > 0) {
//       validation.errors.push(`Java files detected (${fileTypeAnalysis.javaFiles.join(', ')}). This appears to be a Java project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.php > 0) {
//       validation.errors.push(`PHP files detected (${fileTypeAnalysis.phpFiles.join(', ')}). This appears to be a PHP project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.csharp > 0) {
//       validation.errors.push(`C#/.NET files detected (${fileTypeAnalysis.csharpFiles.join(', ')}). This appears to be a .NET project, not a MERN stack project.`);
//     }

//     const nonJsFiles = fileTypeAnalysis.python + fileTypeAnalysis.java + fileTypeAnalysis.php + fileTypeAnalysis.csharp;
//     if (nonJsFiles > fileTypeAnalysis.javascript && nonJsFiles > 0) {
//       validation.errors.push(`Project contains more non-JavaScript files (${nonJsFiles}) than JavaScript files (${fileTypeAnalysis.javascript}). This does not appear to be a JavaScript/Node.js project.`);
//     }

//     if (validation.errors.length > 0) {
//       return validation;
//     }

//     const packageJsonFiles = await findPackageJsonFiles(extractedPath);
//     validation.packageJsonLocations = packageJsonFiles.map(f => f.relativePath);

//     validation.hasSrcDirectory = await checkForSrcDirectory(extractedPath);

//     console.log(`Found package.json files at: ${validation.packageJsonLocations.join(', ')}`);
//     console.log(`Has src directory: ${validation.hasSrcDirectory}`);

//     if (packageJsonFiles.length === 0) {
//       validation.errors.push('No package.json found in project directory or subdirectories - this is required for a valid Node.js/React project');
//       return validation;
//     }

//     if (!validation.hasSrcDirectory) {
//       validation.errors.push('No src directory found - this is required for a valid project structure');
//       return validation;
//     }

//     if (fileTypeAnalysis.javascript === 0) {
//       validation.errors.push('No JavaScript/TypeScript files found - this is required for a Node.js/React project');
//       return validation;
//     }

//     let hasReact = false;
//     let hasExpress = false;
//     let hasMongodb = false;
//     let hasNode = false;

//     for (const pkgFile of packageJsonFiles) {
//       const packageJson = await readPackageJson(pkgFile.path);
//       if (!packageJson) continue;

//       const allDeps = {
//         ...packageJson.dependencies,
//         ...packageJson.devDependencies
//       };

//       if (allDeps.react || allDeps['react-dom']) hasReact = true;
//       if (allDeps.express) hasExpress = true;
//       if (allDeps.mongoose || allDeps.mongodb) hasMongodb = true;
//       if (packageJson.engines?.node || allDeps.nodemon) hasNode = true;
//     }

//     if (hasReact && hasExpress && (hasMongodb || hasNode)) {
//       validation.type = 'fullstack-mern';
//       validation.isValid = true;
//     } else if (hasReact && hasExpress && packageJsonFiles.length >= 2) {
//       validation.type = 'fullstack-mern';
//       validation.isValid = true;
//       validation.warnings.push('Full-stack project detected but MongoDB dependency not found');
//     } else if (hasReact && !hasExpress && packageJsonFiles.length === 1) {
//       validation.type = 'frontend-react';
//       validation.isValid = true;
//       validation.warnings.push('Frontend-only React project detected');
//     } else if (hasExpress && !hasReact && packageJsonFiles.length === 1) {
//       validation.type = 'backend-node';
//       validation.isValid = true;
//       validation.warnings.push('Backend-only Node.js project detected');
//     } else if ((hasExpress || hasReact || hasMongodb) && packageJsonFiles.length >= 1) {
//       validation.type = 'partial-mern';
//       validation.isValid = true;
//       validation.warnings.push('Partial MERN stack detected - some components may be missing');
//     } else {
//       validation.errors.push('Not a recognizable MERN stack project - missing required dependencies (React, Express, or Node.js indicators)');
//     }

//     return validation;

//   } catch (error) {
//     console.error('Validation error:', error);
//     validation.errors.push(`Validation error: ${error.message}`);
//     return validation;
//   }
// };

// const checkForNonMernFrameworks = async (extractedPath, validation) => {
//   try {
//     const items = await fs.readdir(extractedPath);
    
//     if (items.includes('manage.py')) {
//       validation.errors.push('Django project detected (manage.py found). This is a Python/Django project, not MERN stack.');
//     }
    
//     if (items.includes('pom.xml') || items.includes('build.gradle')) {
//       validation.errors.push('Java Spring Boot project detected. This is a Java project, not MERN stack.');
//     }
    
//     if (items.includes('artisan') || items.includes('composer.json')) {
//       validation.errors.push('PHP Laravel project detected. This is a PHP project, not MERN stack.');
//     }
    
//     if (items.some(item => item.endsWith('.csproj') || item.endsWith('.sln'))) {
//       validation.errors.push('.NET project detected. This is a C#/.NET project, not MERN stack.');
//     }

//     if (items.includes('requirements.txt') || items.includes('Pipfile')) {
//       validation.errors.push('Python dependency files detected. This appears to be a Python project, not MERN stack.');
//     }
//   } catch (error) {
//     console.warn('Error checking for non-MERN frameworks:', error.message);
//   }
// };

// const validateMernProject = async (extractedPath) => {
//   const validation = await validateMernProjectEnhanced(extractedPath);
//   await checkForNonMernFrameworks(extractedPath, validation);
//   return validation;
// };

// const cleanupProject = async (extractedPath) => {
//   const cleanupResults = {
//     removed: [],
//     errors: [],
//     nodeModulesRemoved: []
//   };

//   try {
//     console.log('Starting project cleanup...');
    
//     const nodeModulesResult = await removeNodeModulesRecursively(extractedPath);
//     cleanupResults.nodeModulesRemoved = nodeModulesResult.removedPaths;
//     cleanupResults.errors.push(...nodeModulesResult.errors);
    
//     console.log(`Removed ${nodeModulesResult.removedPaths.length} node_modules directories`);

//     const itemsToRemove = [
//       '.git', '.DS_Store', 'Thumbs.db',
//       'dist', 'build', '.cache', '.parcel-cache', 
//       '.next', '.nuxt', 'coverage', '.nyc_output'
//     ];

//     for (const item of itemsToRemove) {
//       try {
//         const itemPath = path.join(extractedPath, item);
        
//         try {
//           const stats = await fs.stat(itemPath);
          
//           if (stats.isDirectory()) {
//             await fs.rm(itemPath, { recursive: true, force: true });
//             cleanupResults.removed.push(`Directory: ${item}`);
//           } else {
//             await fs.unlink(itemPath);
//             cleanupResults.removed.push(`File: ${item}`);
//           }
//         } catch (error) {
//           if (error.code !== 'ENOENT') {
//             cleanupResults.errors.push(`Failed to remove ${item}: ${error.message}`);
//           }
//         }
//       } catch (error) {
//         cleanupResults.errors.push(`Error processing ${item}: ${error.message}`);
//       }
//     }

//     console.log(`Cleanup completed: ${cleanupResults.removed.length} items removed`);
    
//   } catch (error) {
//     console.error('Cleanup error:', error);
//     cleanupResults.errors.push(`Cleanup error: ${error.message}`);
//   }

//   return cleanupResults;
// };

// const extractZipFile = async (zipPath, extractionPath) => {
//   try {
//     const zip = new AdmZip(zipPath);
//     const entries = zip.getEntries();
    
//     if (entries.length === 0) {
//       throw new Error('ZIP file is empty');
//     }
    
//     await fs.mkdir(extractionPath, { recursive: true });
//     zip.extractAllTo(extractionPath, true);
    
//     const macOSXPath = path.join(extractionPath, '__MACOSX');
//     if (await directoryExists(macOSXPath)) {
//       await fs.rm(macOSXPath, { recursive: true, force: true });
//     }
    
//     const extractedItems = await fs.readdir(extractionPath);
//     const validItems = extractedItems.filter(item => 
//       !item.startsWith('.') && 
//       !item.includes('__MACOSX') &&
//       !item.includes('_temp_')
//     );
    
//     if (validItems.length === 0) {
//       throw new Error('No valid files found after extraction');
//     }
    
//     console.log(`Successfully extracted ${validItems.length} items`);
    
//     return {
//       success: true,
//       extractedPath: extractionPath,
//       itemCount: validItems.length
//     };
//   } catch (error) {
//     console.error('ZIP extraction error:', error);
//     throw new Error(`Failed to extract ZIP: ${error.message}`);
//   }
// };

// const handleMulterError = (error, res) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         message: 'File too large. Maximum size is 100MB.'
//       });
//     }
//     return res.status(400).json({
//       success: false,
//       message: `Upload error: ${error.message}`
//     });
//   }
  
//   if (error.message === 'Only ZIP files are allowed') {
//     return res.status(400).json({
//       success: false,
//       message: 'Only ZIP files are allowed'
//     });
//   }

//   return res.status(500).json({
//     success: false,
//     message: error.message || 'Upload failed'
//   });
// };

// // ==================== ROUTES ====================

// // POST /api/projects/upload - Upload ZIP project with duplication analysis
// router.post('/upload', auth, (req, res) => {
//   upload.single('project')(req, res, async (err) => {
//     if (err) {
//       return handleMulterError(err, res);
//     }

//     let extractedPath = null;
//     let project = null;

//     try {
//       if (!req.file) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'No file uploaded' 
//         });
//       }

//       const { projectName, description } = req.body;
      
//       const extractionDirName = `project-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//       const extractedDir = await ensureExtractedDir();
//       extractedPath = path.join(extractedDir, extractionDirName);

//       console.log(`Extracting project to: ${extractedPath}`);

//       // Extract ZIP file
//       const extractionResult = await extractZipFile(req.file.path, extractedPath);
      
//       console.log('ZIP extracted successfully, validating MERN structure...');

//       // Validate MERN stack project
//       const validation = await validateMernProject(extractedPath);
      
//       console.log('Validation result:', {
//         isValid: validation.isValid,
//         type: validation.type,
//         errors: validation.errors
//       });

//       if (!validation.isValid) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//           await fs.unlink(req.file.path);
//         } catch (cleanupError) {
//           console.error('Error cleaning up:', cleanupError);
//         }

//         return res.status(400).json({
//           success: false,
//           message: 'Invalid project structure',
//           errors: validation.errors,
//           warnings: validation.warnings,
//           requirements: [
//             'Project must contain at least one package.json file',
//             'Project must have a src directory',
//             'Project must be a valid Node.js/React/MERN project'
//           ]
//         });
//       }

//       console.log(`Valid ${validation.type} project detected, cleaning up...`);

//       // Clean up unwanted files
//       const cleanupResults = await cleanupProject(extractedPath);

//       console.log('Cleanup completed, creating project record...');

//       // Create project record
//       const sanitizedProjectName = (projectName || req.file.originalname.replace('.zip', ''))
//         .replace(/[^a-zA-Z0-9-_]/g, '-')
//         .toLowerCase();
      
//       const projectKey = `${sanitizedProjectName}-${Date.now()}`;

//       project = new Project({
//         user: req.user.userId,
//         source: 'zip',
//         zipFilePath: req.file.path,
//         extractedPath: extractedPath,
//         projectName: projectName || req.file.originalname.replace('.zip', ''),
//         description: description || '',
//         analysisStatus: 'processing',
//         projectType: validation.type,
//         validationResult: validation,
//         cleanupResult: cleanupResults,
//         duplicationAnalysis: {
//           status: 'pending',
//           startedAt: new Date()
//         }
//       });

//       await project.save();
//       console.log('✅ Project saved to database with ID:', project._id);

//       // Send immediate response
//       res.json({
//         success: true,
//         message: 'Project uploaded successfully. Code duplication analysis is in progress.',
//         project: {
//           id: project._id,
//           name: project.projectName,
//           source: project.source,
//           type: project.projectType,
//           status: project.analysisStatus,
//           validation: {
//             type: validation.type,
//             warnings: validation.warnings
//           },
//           cleanup: {
//             itemsRemoved: cleanupResults.removed.length,
//             nodeModulesRemoved: cleanupResults.nodeModulesRemoved.length
//           },
//           createdAt: project.createdAt
//         }
//       });

//       // Run duplication analysis asynchronously (ENHANCED WITH DEBUGGING)
//       console.log('\n🚀 Starting code duplication analysis in background...\n');
//       const projectId = project._id;
      
//       analyzeDuplication(extractedPath)
//         .then(async (duplicationResults) => {
//           console.log('\n' + '='.repeat(80));
//           console.log('🎉 DUPLICATION ANALYSIS COMPLETED SUCCESSFULLY');
//           console.log('='.repeat(80));
          
//           // Refetch project from database to get latest data
//           const updatedProject = await Project.findById(projectId);
//           if (!updatedProject) {
//             console.error('❌ Project not found during update');
//             return;
//           }
          
//           console.log('\n📊 ANALYSIS STATISTICS:');
//           console.log('─'.repeat(80));
//           console.log(`   Total Files Analyzed:        ${duplicationResults.stats.totalFiles}`);
//           console.log(`   Total Code Units:            ${duplicationResults.stats.totalUnits}`);
//           console.log(`   Exact Clone Groups:          ${duplicationResults.stats.exactCloneGroups}`);
//           console.log(`   Near Clone Groups:           ${duplicationResults.stats.nearCloneGroups}`);
//           console.log(`   Total Duplicated Units:      ${duplicationResults.stats.duplicatedUnits}`);
//           console.log('─'.repeat(80));
          
//           // Display sample of exact clones
//           if (duplicationResults.exactClones.length > 0) {
//             console.log('\n🔍 EXACT CLONES (First 5 groups):');
//             console.log('─'.repeat(80));
//             duplicationResults.exactClones.slice(0, 5).forEach((group) => {
//               console.log(`\n   Group #${group.groupId} - ${group.type.toUpperCase()} (${group.duplicateCount} duplicates)`);
//               group.occurrences.forEach((occ, i) => {
//                 console.log(`      ${i + 1}. ${occ.name} in ${occ.file}`);
//                 console.log(`         Lines ${occ.startLine}-${occ.endLine} (${occ.lineCount} lines)`);
//               });
//             });
//             if (duplicationResults.exactClones.length > 5) {
//               console.log(`\n   ... and ${duplicationResults.exactClones.length - 5} more groups`);
//             }
//           }
          
//           // Display sample of near clones
//           if (duplicationResults.nearClones.length > 0) {
//             console.log('\n\n🔍 NEAR CLONES (First 5 groups):');
//             console.log('─'.repeat(80));
//             duplicationResults.nearClones.slice(0, 5).forEach((group) => {
//               console.log(`\n   Group #${group.groupId} - ${group.type.toUpperCase()} (Similarity: ${(group.similarity * 100).toFixed(1)}%)`);
//               group.occurrences.forEach((occ, i) => {
//                 console.log(`      ${i + 1}. ${occ.name} in ${occ.file}`);
//                 console.log(`         Lines ${occ.startLine}-${occ.endLine} (${occ.lineCount} lines)`);
//               });
//             });
//             if (duplicationResults.nearClones.length > 5) {
//               console.log(`\n   ... and ${duplicationResults.nearClones.length - 5} more groups`);
//             }
//           }
          
//           console.log('\n' + '='.repeat(80));
//           console.log('💾 SAVING TO DATABASE...');
//           console.log('='.repeat(80));
          
//           // Update project with completed status and results
//           updatedProject.analysisStatus = 'completed';
//           updatedProject.duplicationAnalysis = {
//             status: 'completed',
//             startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             results: duplicationResults
//           };
          
//           await updatedProject.save();
          
//           console.log('✅ Successfully saved to database!');
//           console.log(`   Project ID: ${updatedProject._id}`);
//           console.log(`   Project Name: ${updatedProject.projectName}`);
//           console.log('\n📍 VIEW RESULTS AT:');
//           console.log(`   GET /api/projects/${updatedProject._id}/duplication`);
//           console.log(`   GET /api/projects/${updatedProject._id}/test-data`);
//           console.log('='.repeat(80));
          
//           // Display complete results as JSON
//           console.log('\n📄 COMPLETE RESULTS (JSON):');
//           console.log(JSON.stringify(duplicationResults, null, 2));
//           console.log('\n' + '='.repeat(80) + '\n');
//         })
//         .catch(async (error) => {
//           console.log('\n' + '='.repeat(80));
//           console.error('❌ DUPLICATION ANALYSIS FAILED');
//           console.log('='.repeat(80));
//           console.error('Error:', error.message);
//           console.error('Stack:', error.stack);
          
//           // Refetch project from database to get latest data
//           const updatedProject = await Project.findById(projectId);
//           if (!updatedProject) {
//             console.error('❌ Project not found during error update');
//             return;
//           }
          
//           // Update project with failed status
//           updatedProject.analysisStatus = 'failed';
//           updatedProject.duplicationAnalysis = {
//             status: 'failed',
//             startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             error: error.message
//           };
//           await updatedProject.save();
          
//           console.log('💾 Saved failure status to database');
//           console.log('='.repeat(80) + '\n');
//         });

//       console.log(`Project uploaded and queued for analysis: ${project.projectName}`);

//     } catch (error) {
//       console.error('Upload and processing error:', error);
      
//       if (extractedPath) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//         } catch (cleanupError) {
//           console.error('Error cleaning up extracted files:', cleanupError);
//         }
//       }

//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (unlinkError) {
//           console.error('Error deleting uploaded file:', unlinkError);
//         }
//       }

//       if (project && project._id) {
//         try {
//           await Project.findByIdAndDelete(project._id);
//         } catch (deleteError) {
//           console.error('Error deleting project record:', deleteError);
//         }
//       }

//       res.status(500).json({
//         success: false,
//         message: error.message || 'Upload and processing failed'
//       });
//     }
//   });
// });

// // GET /api/projects - Get user's projects
// router.get('/', auth, async (req, res) => {
//   try {
//     const projects = await Project.find({ user: req.user.userId })
//       .sort({ createdAt: -1 })
//       .select('-zipFilePath -extractedPath -validationResult -cleanupResult');

//     res.json({
//       success: true,
//       projects
//     });
//   } catch (error) {
//     console.error('Error fetching projects:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch projects'
//     });
//   }
// });

// // GET /api/projects/:id - Get specific project
// router.get('/:id', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     res.json({
//       success: true,
//       project
//     });
//   } catch (error) {
//     console.error('Error fetching project:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch project'
//     });
//   }
// });

// // GET /api/projects/:id/test-data - Debug endpoint to see complete raw data
// router.get('/:id/test-data', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     // Return everything for debugging
//     res.json({
//       success: true,
//       debug: {
//         projectId: project._id,
//         projectName: project.projectName,
//         analysisStatus: project.analysisStatus,
//         hasDuplicationAnalysis: !!project.duplicationAnalysis,
//         duplicationStatus: project.duplicationAnalysis?.status,
//         hasResults: !!project.duplicationAnalysis?.results,
//         exactCloneCount: project.duplicationAnalysis?.results?.exactClones?.length || 0,
//         nearCloneCount: project.duplicationAnalysis?.results?.nearClones?.length || 0,
//         stats: project.duplicationAnalysis?.results?.stats,
//       },
//       fullDuplicationAnalysis: project.duplicationAnalysis,
//       rawProject: project.toObject()
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// // GET /api/projects/:id/duplication - Get code duplication analysis results
// router.get('/:id/duplication', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     if (!project.duplicationAnalysis) {
//       return res.status(400).json({
//         success: false,
//         message: 'Duplication analysis not available for this project'
//       });
//     }

//     res.json({
//       success: true,
//       status: project.duplicationAnalysis.status,
//       analysis: project.duplicationAnalysis,
//       projectName: project.projectName,
//       projectType: project.projectType
//     });

//   } catch (error) {
//     console.error('Error fetching duplication results:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch duplication results'
//     });
//   }
// });

// // GET /api/projects/:id/duplication/exact - Get only exact clones
// router.get('/:id/duplication/exact', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project || !project.duplicationAnalysis?.results) {
//       return res.status(404).json({
//         success: false,
//         message: 'Duplication analysis not found'
//       });
//     }

//     res.json({
//       success: true,
//       exactClones: project.duplicationAnalysis.results.exactClones || [],
//       stats: {
//         totalGroups: project.duplicationAnalysis.results.stats.exactCloneGroups,
//         totalDuplicates: project.duplicationAnalysis.results.stats.duplicatedUnits
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching exact clones:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch exact clones'
//     });
//   }
// });

// // GET /api/projects/:id/duplication/near - Get only near clones
// router.get('/:id/duplication/near', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project || !project.duplicationAnalysis?.results) {
//       return res.status(404).json({
//         success: false,
//         message: 'Duplication analysis not found'
//       });
//     }

//     res.json({
//       success: true,
//       nearClones: project.duplicationAnalysis.results.nearClones || [],
//       stats: {
//         totalGroups: project.duplicationAnalysis.results.stats.nearCloneGroups
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching near clones:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch near clones'
//     });
//   }
// });

// // GET /api/projects/:id/file-content - Get file content for viewing duplicates
// router.get('/:id/file-content', auth, async (req, res) => {
//   try {
//     const { filePath, startLine, endLine } = req.query;

//     if (!filePath) {
//       return res.status(400).json({
//         success: false,
//         message: 'File path is required'
//       });
//     }

//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     const fullPath = path.join(project.extractedPath, filePath);
    
//     // Security check: ensure the file is within the project directory
//     const normalizedPath = path.normalize(fullPath);
//     if (!normalizedPath.startsWith(project.extractedPath)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     const content = await fs.readFile(fullPath, 'utf8');
//     const lines = content.split('\n');

//     let resultContent = content;
//     let resultLines = lines;

//     // If line range is specified, extract only those lines
//     if (startLine && endLine) {
//       const start = parseInt(startLine) - 1;
//       const end = parseInt(endLine);
//       resultLines = lines.slice(start, end);
//       resultContent = resultLines.join('\n');
//     }

//     res.json({
//       success: true,
//       filePath,
//       content: resultContent,
//       totalLines: lines.length,
//       extractedLines: resultLines.length
//     });

//   } catch (error) {
//     console.error('Error fetching file content:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch file content'
//     });
//   }
// });

// // DELETE /api/projects/:id - Delete project
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     if (project.source === 'zip' && project.zipFilePath) {
//       try {
//         await fs.unlink(project.zipFilePath);
//       } catch (unlinkError) {
//         console.error('Error deleting ZIP file:', unlinkError);
//       }
//     }

//     if (project.extractedPath) {
//       try {
//         await fs.rm(project.extractedPath, { recursive: true, force: true });
//       } catch (unlinkError) {
//         console.error('Error deleting extracted directory:', unlinkError);
//       }
//     }

//     await Project.findByIdAndDelete(req.params.id);

//     res.json({
//       success: true,
//       message: 'Project deleted successfully'
//     });
//   } catch (error) {
//     console.error('Error deleting project:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete project'
//     });
//   }
// });

// const exportedFunctions = {
//   ensureExtractedDir,
//   validateMernProject,
//   cleanupProject,
//   removeNodeModulesRecursively,
//   validateMernProjectEnhanced,
//   checkForNonMernFrameworks,
//   directoryExists,
//   fileExists,
//   readPackageJson,
// };

// module.exports = router;
// module.exports.functions = exportedFunctions;



//working  3+ lines
// routes/projects.js - COMPLETE FILE - COPY AND PASTE THIS ENTIRE FILE
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs').promises;
// const AdmZip = require('adm-zip');
// const crypto = require('crypto');
// const parser = require('@babel/parser');
// const traverse = require('@babel/traverse').default;
// const Project = require('../models/repository');
// const auth = require('../middleware/auth');
// const router = express.Router();

// const ensureUploadDir = async () => {
//   const uploadDir = path.join(__dirname, '../uploads/projects/manual_uploads');
//   try {
//     await fs.access(uploadDir);
//   } catch (error) {
//     await fs.mkdir(uploadDir, { recursive: true });
//   }
//   return uploadDir;
// };

// const ensureExtractedDir = async () => {
//   const extractedDir = path.join(__dirname, '../uploads/projects/extracted-projects');
//   try {
//     await fs.access(extractedDir);
//   } catch (error) {
//     await fs.mkdir(extractedDir, { recursive: true });
//   }
//   return extractedDir;
// };

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: async function (req, file, cb) {
//     const uploadDir = await ensureUploadDir();
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, `project-${uniqueSuffix}${path.extname(file.originalname)}`);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'application/zip' || 
//       file.mimetype === 'application/x-zip-compressed' ||
//       file.originalname.toLowerCase().endsWith('.zip')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only ZIP files are allowed'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB limit
//   }
// });

// // ==================== CODE DUPLICATION DETECTION ====================

// // Parse JavaScript/TypeScript file to AST
// const parseFile = async (filePath) => {
//   try {
//     const code = await fs.readFile(filePath, 'utf8');
//     return parser.parse(code, {
//       sourceType: 'module',
//       plugins: ['jsx', 'typescript', 'decorators-legacy'],
//       errorRecovery: true,
//     });
//   } catch (error) {
//     console.warn(`Failed to parse ${filePath}:`, error.message);
//     return null;
//   }
// };

// // Collect code units (functions, classes, blocks) from AST
// const collectUnits = (ast, filePath) => {
//   const units = [];

//   if (!ast) return units;

//   try {
//     traverse(ast, {
//       FunctionDeclaration(path) {
//         const unit = makeUnit('function', path.node, filePath, path.node.id?.name);
//         // Only include functions with 3+ lines of code
//         if (unit.endLine - unit.startLine >= 2) {
//           units.push(unit);
//         }
//       },
//       ArrowFunctionExpression(path) {
//         const parent = path.parent;
//         let name = 'anonymous';
//         if (parent.type === 'VariableDeclarator' && parent.id) {
//           name = parent.id.name;
//         }
//         const unit = makeUnit('function', path.node, filePath, name);
//         // Only include arrow functions with 3+ lines of code OR with a block body
//         const hasBlockBody = path.node.body.type === 'BlockStatement';
//         const isMultiLine = unit.endLine - unit.startLine >= 2;
//         if (hasBlockBody || isMultiLine) {
//           units.push(unit);
//         }
//       },
//       FunctionExpression(path) {
//         const name = path.node.id?.name || 'anonymous';
//         const unit = makeUnit('function', path.node, filePath, name);
//         // Only include functions with 3+ lines of code
//         if (unit.endLine - unit.startLine >= 2) {
//           units.push(unit);
//         }
//       },
//       ClassDeclaration(path) {
//         units.push(makeUnit('class', path.node, filePath, path.node.id?.name));
//       },
//       ClassMethod(path) {
//         const unit = makeUnit('method', path.node, filePath, path.node.key?.name);
//         // Only include methods with 3+ lines of code
//         if (unit.endLine - unit.startLine >= 2) {
//           units.push(unit);
//         }
//       },
//       ObjectMethod(path) {
//         const unit = makeUnit('method', path.node, filePath, path.node.key?.name);
//         // Only include methods with 3+ lines of code
//         if (unit.endLine - unit.startLine >= 2) {
//           units.push(unit);
//         }
//       },
//       BlockStatement(path) {
//         // Only capture large blocks to avoid noise
//         if (path.node.body && path.node.body.length >= 5) {
//           // Skip if it's part of a function/class we already captured
//           const parent = path.parent;
//           if (!['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 
//                 'ClassMethod', 'ObjectMethod'].includes(parent.type)) {
//             units.push(makeUnit('block', path.node, filePath, 'code-block'));
//           }
//         }
//       },
//     });
//   } catch (error) {
//     console.error(`Error traversing AST for ${filePath}:`, error.message);
//   }

//   return units;
// };

// const makeUnit = (type, node, filePath, name = 'unnamed') => {
//   return {
//     type,
//     filePath,
//     name,
//     loc: node.loc,
//     node,
//     startLine: node.loc?.start?.line || 0,
//     endLine: node.loc?.end?.line || 0,
//   };
// };

// // Canonicalize AST node (normalize variable names, literals)
// const canonicalizeNode = (node) => {
//   const clone = JSON.parse(JSON.stringify(node));
//   const idMap = new Map();
//   let idCounter = 0;

//   const getId = (name) => {
//     if (!idMap.has(name)) {
//       idMap.set(name, `ID${idCounter++}`);
//     }
//     return idMap.get(name);
//   };

//   const visit = (n) => {
//     if (!n || typeof n !== 'object') return;

//     // Normalize identifiers
//     if (n.type === 'Identifier') {
//       n.name = getId(n.name);
//     }

//     // Normalize literals
//     if (n.type === 'NumericLiteral') n.value = 'NUM';
//     if (n.type === 'StringLiteral') n.value = 'STR';
//     if (n.type === 'BooleanLiteral') n.value = 'BOOL';
//     if (n.type === 'NullLiteral') n.value = 'NULL';

//     // Remove location info
//     delete n.start;
//     delete n.end;
//     delete n.loc;
//     delete n.range;

//     for (const key of Object.keys(n)) {
//       const val = n[key];
//       if (Array.isArray(val)) {
//         val.forEach(visit);
//       } else if (typeof val === 'object') {
//         visit(val);
//       }
//     }
//   };

//   visit(clone);
//   return clone;
// };

// const canonicalString = (node) => {
//   const canonical = canonicalizeNode(node);
//   return JSON.stringify(canonical);
// };

// const hashString = (str) => {
//   return crypto.createHash('sha256').update(str).digest('hex');
// };

// // Calculate similarity between two canonical strings
// const calculateSimilarity = (canonA, canonB) => {
//   const tokensA = canonA.split(/\W+/).filter(Boolean);
//   const tokensB = canonB.split(/\W+/).filter(Boolean);

//   const setA = new Set(tokensA);
//   const setB = new Set(tokensB);

//   const intersection = new Set([...setA].filter(x => setB.has(x)));
//   const union = new Set([...setA, ...setB]);

//   return union.size > 0 ? intersection.size / union.size : 0;
// };

// // Recursively find all JS/TS files
// const findCodeFiles = async (dirPath, fileList = []) => {
//   try {
//     const items = await fs.readdir(dirPath);

//     for (const item of items) {
//       if (item.startsWith('.') || item === 'node_modules') continue;

//       const itemPath = path.join(dirPath, item);
//       const stats = await fs.stat(itemPath);

//       if (stats.isDirectory()) {
//         await findCodeFiles(itemPath, fileList);
//       } else if (stats.isFile()) {
//         const ext = path.extname(item).toLowerCase();
//         if (['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext)) {
//           fileList.push(itemPath);
//         }
//       }
//     }
//   } catch (error) {
//     console.warn(`Error reading directory ${dirPath}:`, error.message);
//   }

//   return fileList;
// };

// // Main duplication analysis function
// const analyzeDuplication = async (projectPath) => {
//   console.log('Starting code duplication analysis...');
  
//   const results = {
//     exactClones: [],
//     nearClones: [],
//     stats: {
//       totalFiles: 0,
//       totalUnits: 0,
//       exactCloneGroups: 0,
//       nearCloneGroups: 0,
//       duplicatedUnits: 0,
//     }
//   };

//   try {
//     // Find all code files
//     const codeFiles = await findCodeFiles(projectPath);
//     results.stats.totalFiles = codeFiles.length;

//     if (codeFiles.length === 0) {
//       console.log('No code files found');
//       return results;
//     }

//     console.log(`Found ${codeFiles.length} code files`);

//     // Parse files and collect units
//     const allUnits = [];
//     const hashMap = new Map(); // hash -> [unitInfo]

//     for (const file of codeFiles) {
//       const ast = await parseFile(file);
//       if (!ast) continue;

//       const units = collectUnits(ast, file);
//       allUnits.push(...units);

//       for (const unit of units) {
//         const canon = canonicalString(unit.node);
//         const hash = hashString(canon);

//         if (!hashMap.has(hash)) {
//           hashMap.set(hash, []);
//         }

//         const relativePath = path.relative(projectPath, unit.filePath);
//         hashMap.get(hash).push({
//           type: unit.type,
//           name: unit.name,
//           file: relativePath,
//           filePath: unit.filePath,
//           loc: unit.loc,
//           startLine: unit.startLine,
//           endLine: unit.endLine,
//           canonical: canon,
//           lineCount: unit.endLine - unit.startLine + 1,
//         });
//       }
//     }

//     results.stats.totalUnits = allUnits.length;
//     console.log(`Collected ${allUnits.length} code units`);

//     // Detect exact clones
//     let groupId = 1;
//     for (const [hash, occurrences] of hashMap.entries()) {
//       if (occurrences.length >= 2) {
//         results.exactClones.push({
//           groupId: groupId++,
//           hash,
//           type: occurrences[0].type,
//           occurrences,
//           duplicateCount: occurrences.length,
//         });
//         results.stats.duplicatedUnits += occurrences.length;
//       }
//     }

//     results.stats.exactCloneGroups = results.exactClones.length;
//     console.log(`Found ${results.exactClones.length} exact clone groups`);

//     // Detect near-duplicates (similar but not exact)
//     const SIMILARITY_THRESHOLD = 0.8;
//     const processedPairs = new Set();

//     // Only compare units of same type and similar size
//     const unitsByType = new Map();
//     for (const unit of allUnits) {
//       if (!unitsByType.has(unit.type)) {
//         unitsByType.set(unit.type, []);
//       }
//       unitsByType.get(unit.type).push(unit);
//     }

//     for (const [type, units] of unitsByType.entries()) {
//       // Only check larger units for near-duplicates (≥10 lines)
//       const largeUnits = units.filter(u => (u.endLine - u.startLine) >= 10);

//       for (let i = 0; i < largeUnits.length; i++) {
//         for (let j = i + 1; j < largeUnits.length; j++) {
//           const unitA = largeUnits[i];
//           const unitB = largeUnits[j];

//           // Skip if same file (likely same unit)
//           if (unitA.filePath === unitB.filePath) continue;

//           const canonA = canonicalString(unitA.node);
//           const canonB = canonicalString(unitB.node);
//           const hashA = hashString(canonA);
//           const hashB = hashString(canonB);

//           // Skip if already exact duplicates
//           if (hashA === hashB) continue;

//           const pairKey = [hashA, hashB].sort().join('|');
//           if (processedPairs.has(pairKey)) continue;
//           processedPairs.add(pairKey);

//           // Check size similarity (within 30% of each other)
//           const sizeA = canonA.length;
//           const sizeB = canonB.length;
//           const sizeRatio = Math.min(sizeA, sizeB) / Math.max(sizeA, sizeB);

//           if (sizeRatio < 0.7) continue;

//           // Calculate token-based similarity
//           const similarity = calculateSimilarity(canonA, canonB);

//           if (similarity >= SIMILARITY_THRESHOLD) {
//             const relativePathA = path.relative(projectPath, unitA.filePath);
//             const relativePathB = path.relative(projectPath, unitB.filePath);

//             results.nearClones.push({
//               groupId: groupId++,
//               type,
//               similarity: parseFloat(similarity.toFixed(3)),
//               occurrences: [
//                 {
//                   type: unitA.type,
//                   name: unitA.name,
//                   file: relativePathA,
//                   filePath: unitA.filePath,
//                   loc: unitA.loc,
//                   startLine: unitA.startLine,
//                   endLine: unitA.endLine,
//                   lineCount: unitA.endLine - unitA.startLine + 1,
//                 },
//                 {
//                   type: unitB.type,
//                   name: unitB.name,
//                   file: relativePathB,
//                   filePath: unitB.filePath,
//                   loc: unitB.loc,
//                   startLine: unitB.startLine,
//                   endLine: unitB.endLine,
//                   lineCount: unitB.endLine - unitB.startLine + 1,
//                 }
//               ]
//             });
//           }
//         }
//       }
//     }

//     results.stats.nearCloneGroups = results.nearClones.length;
//     console.log(`Found ${results.nearClones.length} near-clone groups`);

//     return results;

//   } catch (error) {
//     console.error('Duplication analysis error:', error);
//     throw error;
//   }
// };

// // ==================== VALIDATION FUNCTIONS ====================

// const directoryExists = async (dirPath) => {
//   try {
//     const stats = await fs.stat(dirPath);
//     return stats.isDirectory();
//   } catch {
//     return false;
//   }
// };

// const fileExists = async (filePath) => {
//   try {
//     await fs.access(filePath);
//     return true;
//   } catch {
//     return false;
//   }
// };

// const readPackageJson = async (packagePath) => {
//   try {
//     const content = await fs.readFile(packagePath, 'utf8');
//     return JSON.parse(content);
//   } catch {
//     return null;
//   }
// };

// const removeNodeModulesRecursively = async (startPath) => {
//   const removedPaths = [];
//   const errors = [];

//   const searchAndRemove = async (currentPath) => {
//     try {
//       const items = await fs.readdir(currentPath);
      
//       for (const item of items) {
//         const itemPath = path.join(currentPath, item);
        
//         if (item === 'node_modules') {
//           try {
//             console.log(`Removing node_modules at: ${itemPath}`);
//             await fs.rm(itemPath, { recursive: true, force: true });
//             removedPaths.push(path.relative(startPath, itemPath));
//           } catch (error) {
//             console.error(`Failed to remove node_modules at ${itemPath}:`, error);
//             errors.push(`Failed to remove ${path.relative(startPath, itemPath)}: ${error.message}`);
//           }
//         } else if (await directoryExists(itemPath) && 
//                    !item.startsWith('.') && 
//                    !['dist', 'build', 'coverage'].includes(item)) {
//           await searchAndRemove(itemPath);
//         }
//       }
//     } catch (error) {
//       console.error(`Error reading directory ${currentPath}:`, error);
//       errors.push(`Error reading directory ${path.relative(startPath, currentPath)}: ${error.message}`);
//     }
//   };

//   await searchAndRemove(startPath);
  
//   return { removedPaths, errors };
// };

// const validateMernProjectEnhanced = async (extractedPath) => {
//   const validation = {
//     isValid: false,
//     type: 'unknown',
//     errors: [],
//     warnings: [],
//     structure: {},
//     packageJsonLocations: [],
//     hasSrcDirectory: false,
//     fileTypeAnalysis: {}
//   };

//   try {
//     console.log(`Starting enhanced validation for: ${extractedPath}`);

//     const analyzeFileTypes = async (dirPath, maxDepth = 3) => {
//       const fileTypes = {
//         javascript: 0,
//         python: 0,
//         java: 0,
//         php: 0,
//         csharp: 0,
//         other: 0,
//         pythonFiles: [],
//         javaFiles: [],
//         phpFiles: [],
//         csharpFiles: []
//       };

//       const analyzeRecursive = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return;

//         try {
//           const items = await fs.readdir(currentPath);

//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;

//             const itemPath = path.join(currentPath, item);
//             const stats = await fs.stat(itemPath);

//             if (stats.isFile()) {
//               const ext = path.extname(item).toLowerCase();
//               const relativePath = path.relative(dirPath, itemPath);

//               switch (ext) {
//                 case '.js':
//                 case '.jsx':
//                 case '.ts':
//                 case '.tsx':
//                 case '.mjs':
//                   fileTypes.javascript++;
//                   break;
//                 case '.py':
//                 case '.pyw':
//                 case '.pyx':
//                   fileTypes.python++;
//                   fileTypes.pythonFiles.push(relativePath);
//                   break;
//                 case '.java':
//                 case '.class':
//                   fileTypes.java++;
//                   fileTypes.javaFiles.push(relativePath);
//                   break;
//                 case '.php':
//                 case '.phtml':
//                   fileTypes.php++;
//                   fileTypes.phpFiles.push(relativePath);
//                   break;
//                 case '.cs':
//                 case '.vb':
//                   fileTypes.csharp++;
//                   fileTypes.csharpFiles.push(relativePath);
//                   break;
//                 default:
//                   if (ext) {
//                     fileTypes.other++;
//                   }
//                   break;
//               }
//             } else if (stats.isDirectory()) {
//               await analyzeRecursive(itemPath, depth + 1);
//             }
//           }
//         } catch (error) {
//           console.warn(`Error analyzing files in ${currentPath}:`, error.message);
//         }
//       };

//       await analyzeRecursive(dirPath);
//       return fileTypes;
//     };

//     const findPackageJsonFiles = async (startPath, maxDepth = 3) => {
//       const packageJsonFiles = [];
      
//       const searchRecursive = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return;
        
//         try {
//           const items = await fs.readdir(currentPath);
          
//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;
            
//             const itemPath = path.join(currentPath, item);
            
//             if (item === 'package.json') {
//               const relativePath = path.relative(startPath, itemPath);
//               packageJsonFiles.push({
//                 path: itemPath,
//                 relativePath,
//                 directory: path.dirname(itemPath)
//               });
//             } else if (await directoryExists(itemPath)) {
//               await searchRecursive(itemPath, depth + 1);
//             }
//           }
//         } catch (error) {
//           console.warn(`Error reading directory ${currentPath}:`, error.message);
//         }
//       };
      
//       await searchRecursive(startPath);
//       return packageJsonFiles;
//     };

//     const checkForSrcDirectory = async (startPath, maxDepth = 3) => {
//       const searchForSrc = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return false;
        
//         try {
//           const items = await fs.readdir(currentPath);
          
//           if (items.includes('src') && await directoryExists(path.join(currentPath, 'src'))) {
//             return true;
//           }
          
//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;
            
//             const itemPath = path.join(currentPath, item);
//             if (await directoryExists(itemPath)) {
//               const found = await searchForSrc(itemPath, depth + 1);
//               if (found) return true;
//             }
//           }
//         } catch (error) {
//           console.warn(`Error searching for src in ${currentPath}:`, error.message);
//         }
        
//         return false;
//       };
      
//       return await searchForSrc(startPath);
//     };

//     const fileTypeAnalysis = await analyzeFileTypes(extractedPath);
//     validation.fileTypeAnalysis = fileTypeAnalysis;

//     if (fileTypeAnalysis.python > 0) {
//       validation.errors.push(`Python files detected (${fileTypeAnalysis.pythonFiles.join(', ')}). This appears to be a Python project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.java > 0) {
//       validation.errors.push(`Java files detected (${fileTypeAnalysis.javaFiles.join(', ')}). This appears to be a Java project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.php > 0) {
//       validation.errors.push(`PHP files detected (${fileTypeAnalysis.phpFiles.join(', ')}). This appears to be a PHP project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.csharp > 0) {
//       validation.errors.push(`C#/.NET files detected (${fileTypeAnalysis.csharpFiles.join(', ')}). This appears to be a .NET project, not a MERN stack project.`);
//     }

//     const nonJsFiles = fileTypeAnalysis.python + fileTypeAnalysis.java + fileTypeAnalysis.php + fileTypeAnalysis.csharp;
//     if (nonJsFiles > fileTypeAnalysis.javascript && nonJsFiles > 0) {
//       validation.errors.push(`Project contains more non-JavaScript files (${nonJsFiles}) than JavaScript files (${fileTypeAnalysis.javascript}). This does not appear to be a JavaScript/Node.js project.`);
//     }

//     if (validation.errors.length > 0) {
//       return validation;
//     }

//     const packageJsonFiles = await findPackageJsonFiles(extractedPath);
//     validation.packageJsonLocations = packageJsonFiles.map(f => f.relativePath);

//     validation.hasSrcDirectory = await checkForSrcDirectory(extractedPath);

//     console.log(`Found package.json files at: ${validation.packageJsonLocations.join(', ')}`);
//     console.log(`Has src directory: ${validation.hasSrcDirectory}`);

//     if (packageJsonFiles.length === 0) {
//       validation.errors.push('No package.json found in project directory or subdirectories - this is required for a valid Node.js/React project');
//       return validation;
//     }

//     if (!validation.hasSrcDirectory) {
//       validation.errors.push('No src directory found - this is required for a valid project structure');
//       return validation;
//     }

//     if (fileTypeAnalysis.javascript === 0) {
//       validation.errors.push('No JavaScript/TypeScript files found - this is required for a Node.js/React project');
//       return validation;
//     }

//     let hasReact = false;
//     let hasExpress = false;
//     let hasMongodb = false;
//     let hasNode = false;

//     for (const pkgFile of packageJsonFiles) {
//       const packageJson = await readPackageJson(pkgFile.path);
//       if (!packageJson) continue;

//       const allDeps = {
//         ...packageJson.dependencies,
//         ...packageJson.devDependencies
//       };

//       if (allDeps.react || allDeps['react-dom']) hasReact = true;
//       if (allDeps.express) hasExpress = true;
//       if (allDeps.mongoose || allDeps.mongodb) hasMongodb = true;
//       if (packageJson.engines?.node || allDeps.nodemon) hasNode = true;
//     }

//     if (hasReact && hasExpress && (hasMongodb || hasNode)) {
//       validation.type = 'fullstack-mern';
//       validation.isValid = true;
//     } else if (hasReact && hasExpress && packageJsonFiles.length >= 2) {
//       validation.type = 'fullstack-mern';
//       validation.isValid = true;
//       validation.warnings.push('Full-stack project detected but MongoDB dependency not found');
//     } else if (hasReact && !hasExpress && packageJsonFiles.length === 1) {
//       validation.type = 'frontend-react';
//       validation.isValid = true;
//       validation.warnings.push('Frontend-only React project detected');
//     } else if (hasExpress && !hasReact && packageJsonFiles.length === 1) {
//       validation.type = 'backend-node';
//       validation.isValid = true;
//       validation.warnings.push('Backend-only Node.js project detected');
//     } else if ((hasExpress || hasReact || hasMongodb) && packageJsonFiles.length >= 1) {
//       validation.type = 'partial-mern';
//       validation.isValid = true;
//       validation.warnings.push('Partial MERN stack detected - some components may be missing');
//     } else {
//       validation.errors.push('Not a recognizable MERN stack project - missing required dependencies (React, Express, or Node.js indicators)');
//     }

//     return validation;

//   } catch (error) {
//     console.error('Validation error:', error);
//     validation.errors.push(`Validation error: ${error.message}`);
//     return validation;
//   }
// };

// const checkForNonMernFrameworks = async (extractedPath, validation) => {
//   try {
//     const items = await fs.readdir(extractedPath);
    
//     if (items.includes('manage.py')) {
//       validation.errors.push('Django project detected (manage.py found). This is a Python/Django project, not MERN stack.');
//     }
    
//     if (items.includes('pom.xml') || items.includes('build.gradle')) {
//       validation.errors.push('Java Spring Boot project detected. This is a Java project, not MERN stack.');
//     }
    
//     if (items.includes('artisan') || items.includes('composer.json')) {
//       validation.errors.push('PHP Laravel project detected. This is a PHP project, not MERN stack.');
//     }
    
//     if (items.some(item => item.endsWith('.csproj') || item.endsWith('.sln'))) {
//       validation.errors.push('.NET project detected. This is a C#/.NET project, not MERN stack.');
//     }

//     if (items.includes('requirements.txt') || items.includes('Pipfile')) {
//       validation.errors.push('Python dependency files detected. This appears to be a Python project, not MERN stack.');
//     }
//   } catch (error) {
//     console.warn('Error checking for non-MERN frameworks:', error.message);
//   }
// };

// const validateMernProject = async (extractedPath) => {
//   const validation = await validateMernProjectEnhanced(extractedPath);
//   await checkForNonMernFrameworks(extractedPath, validation);
//   return validation;
// };

// const cleanupProject = async (extractedPath) => {
//   const cleanupResults = {
//     removed: [],
//     errors: [],
//     nodeModulesRemoved: []
//   };

//   try {
//     console.log('Starting project cleanup...');
    
//     const nodeModulesResult = await removeNodeModulesRecursively(extractedPath);
//     cleanupResults.nodeModulesRemoved = nodeModulesResult.removedPaths;
//     cleanupResults.errors.push(...nodeModulesResult.errors);
    
//     console.log(`Removed ${nodeModulesResult.removedPaths.length} node_modules directories`);

//     const itemsToRemove = [
//       '.git', '.DS_Store', 'Thumbs.db',
//       'dist', 'build', '.cache', '.parcel-cache', 
//       '.next', '.nuxt', 'coverage', '.nyc_output'
//     ];

//     for (const item of itemsToRemove) {
//       try {
//         const itemPath = path.join(extractedPath, item);
        
//         try {
//           const stats = await fs.stat(itemPath);
          
//           if (stats.isDirectory()) {
//             await fs.rm(itemPath, { recursive: true, force: true });
//             cleanupResults.removed.push(`Directory: ${item}`);
//           } else {
//             await fs.unlink(itemPath);
//             cleanupResults.removed.push(`File: ${item}`);
//           }
//         } catch (error) {
//           if (error.code !== 'ENOENT') {
//             cleanupResults.errors.push(`Failed to remove ${item}: ${error.message}`);
//           }
//         }
//       } catch (error) {
//         cleanupResults.errors.push(`Error processing ${item}: ${error.message}`);
//       }
//     }

//     console.log(`Cleanup completed: ${cleanupResults.removed.length} items removed`);
    
//   } catch (error) {
//     console.error('Cleanup error:', error);
//     cleanupResults.errors.push(`Cleanup error: ${error.message}`);
//   }

//   return cleanupResults;
// };

// const extractZipFile = async (zipPath, extractionPath) => {
//   try {
//     const zip = new AdmZip(zipPath);
//     const entries = zip.getEntries();
    
//     if (entries.length === 0) {
//       throw new Error('ZIP file is empty');
//     }
    
//     await fs.mkdir(extractionPath, { recursive: true });
//     zip.extractAllTo(extractionPath, true);
    
//     const macOSXPath = path.join(extractionPath, '__MACOSX');
//     if (await directoryExists(macOSXPath)) {
//       await fs.rm(macOSXPath, { recursive: true, force: true });
//     }
    
//     const extractedItems = await fs.readdir(extractionPath);
//     const validItems = extractedItems.filter(item => 
//       !item.startsWith('.') && 
//       !item.includes('__MACOSX') &&
//       !item.includes('_temp_')
//     );
    
//     if (validItems.length === 0) {
//       throw new Error('No valid files found after extraction');
//     }
    
//     console.log(`Successfully extracted ${validItems.length} items`);
    
//     return {
//       success: true,
//       extractedPath: extractionPath,
//       itemCount: validItems.length
//     };
//   } catch (error) {
//     console.error('ZIP extraction error:', error);
//     throw new Error(`Failed to extract ZIP: ${error.message}`);
//   }
// };

// const handleMulterError = (error, res) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         message: 'File too large. Maximum size is 100MB.'
//       });
//     }
//     return res.status(400).json({
//       success: false,
//       message: `Upload error: ${error.message}`
//     });
//   }
  
//   if (error.message === 'Only ZIP files are allowed') {
//     return res.status(400).json({
//       success: false,
//       message: 'Only ZIP files are allowed'
//     });
//   }

//   return res.status(500).json({
//     success: false,
//     message: error.message || 'Upload failed'
//   });
// };

// // ==================== ROUTES ====================

// // POST /api/projects/upload - Upload ZIP project with duplication analysis
// router.post('/upload', auth, (req, res) => {
//   upload.single('project')(req, res, async (err) => {
//     if (err) {
//       return handleMulterError(err, res);
//     }

//     let extractedPath = null;
//     let project = null;

//     try {
//       if (!req.file) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'No file uploaded' 
//         });
//       }

//       const { projectName, description } = req.body;
      
//       const extractionDirName = `project-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//       const extractedDir = await ensureExtractedDir();
//       extractedPath = path.join(extractedDir, extractionDirName);

//       console.log(`Extracting project to: ${extractedPath}`);

//       // Extract ZIP file
//       const extractionResult = await extractZipFile(req.file.path, extractedPath);
      
//       console.log('ZIP extracted successfully, validating MERN structure...');

//       // Validate MERN stack project
//       const validation = await validateMernProject(extractedPath);
      
//       console.log('Validation result:', {
//         isValid: validation.isValid,
//         type: validation.type,
//         errors: validation.errors
//       });

//       if (!validation.isValid) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//           await fs.unlink(req.file.path);
//         } catch (cleanupError) {
//           console.error('Error cleaning up:', cleanupError);
//         }

//         return res.status(400).json({
//           success: false,
//           message: 'Invalid project structure',
//           errors: validation.errors,
//           warnings: validation.warnings,
//           requirements: [
//             'Project must contain at least one package.json file',
//             'Project must have a src directory',
//             'Project must be a valid Node.js/React/MERN project'
//           ]
//         });
//       }

//       console.log(`Valid ${validation.type} project detected, cleaning up...`);

//       // Clean up unwanted files
//       const cleanupResults = await cleanupProject(extractedPath);

//       console.log('Cleanup completed, creating project record...');

//       // Create project record
//       const sanitizedProjectName = (projectName || req.file.originalname.replace('.zip', ''))
//         .replace(/[^a-zA-Z0-9-_]/g, '-')
//         .toLowerCase();
      
//       const projectKey = `${sanitizedProjectName}-${Date.now()}`;

//       project = new Project({
//         user: req.user.userId,
//         source: 'zip',
//         zipFilePath: req.file.path,
//         extractedPath: extractedPath,
//         projectName: projectName || req.file.originalname.replace('.zip', ''),
//         description: description || '',
//         analysisStatus: 'processing',
//         projectType: validation.type,
//         validationResult: validation,
//         cleanupResult: cleanupResults,
//         duplicationAnalysis: {
//           status: 'pending',
//           startedAt: new Date()
//         }
//       });

//       await project.save();
//       console.log('✅ Project saved to database with ID:', project._id);

//       // Send immediate response
//       res.json({
//         success: true,
//         message: 'Project uploaded successfully. Code duplication analysis is in progress.',
//         project: {
//           id: project._id,
//           name: project.projectName,
//           source: project.source,
//           type: project.projectType,
//           status: project.analysisStatus,
//           validation: {
//             type: validation.type,
//             warnings: validation.warnings
//           },
//           cleanup: {
//             itemsRemoved: cleanupResults.removed.length,
//             nodeModulesRemoved: cleanupResults.nodeModulesRemoved.length
//           },
//           createdAt: project.createdAt
//         }
//       });

//       // Run duplication analysis asynchronously (ENHANCED WITH DEBUGGING)
//       console.log('\n🚀 Starting code duplication analysis in background...\n');
//       const projectId = project._id;
      
//       analyzeDuplication(extractedPath)
//         .then(async (duplicationResults) => {
//           console.log('\n' + '='.repeat(80));
//           console.log('🎉 DUPLICATION ANALYSIS COMPLETED SUCCESSFULLY');
//           console.log('='.repeat(80));
          
//           // Refetch project from database to get latest data
//           const updatedProject = await Project.findById(projectId);
//           if (!updatedProject) {
//             console.error('❌ Project not found during update');
//             return;
//           }
          
//           console.log('\n📊 ANALYSIS STATISTICS:');
//           console.log('─'.repeat(80));
//           console.log(`   Total Files Analyzed:        ${duplicationResults.stats.totalFiles}`);
//           console.log(`   Total Code Units:            ${duplicationResults.stats.totalUnits}`);
//           console.log(`   Exact Clone Groups:          ${duplicationResults.stats.exactCloneGroups}`);
//           console.log(`   Near Clone Groups:           ${duplicationResults.stats.nearCloneGroups}`);
//           console.log(`   Total Duplicated Units:      ${duplicationResults.stats.duplicatedUnits}`);
//           console.log('─'.repeat(80));
          
//           // Display sample of exact clones
//           if (duplicationResults.exactClones.length > 0) {
//             console.log('\n🔍 EXACT CLONES (First 5 groups):');
//             console.log('─'.repeat(80));
//             duplicationResults.exactClones.slice(0, 5).forEach((group) => {
//               console.log(`\n   Group #${group.groupId} - ${group.type.toUpperCase()} (${group.duplicateCount} duplicates)`);
//               group.occurrences.forEach((occ, i) => {
//                 console.log(`      ${i + 1}. ${occ.name} in ${occ.file}`);
//                 console.log(`         Lines ${occ.startLine}-${occ.endLine} (${occ.lineCount} lines)`);
//               });
//             });
//             if (duplicationResults.exactClones.length > 5) {
//               console.log(`\n   ... and ${duplicationResults.exactClones.length - 5} more groups`);
//             }
//           }
          
//           // Display sample of near clones
//           if (duplicationResults.nearClones.length > 0) {
//             console.log('\n\n🔍 NEAR CLONES (First 5 groups):');
//             console.log('─'.repeat(80));
//             duplicationResults.nearClones.slice(0, 5).forEach((group) => {
//               console.log(`\n   Group #${group.groupId} - ${group.type.toUpperCase()} (Similarity: ${(group.similarity * 100).toFixed(1)}%)`);
//               group.occurrences.forEach((occ, i) => {
//                 console.log(`      ${i + 1}. ${occ.name} in ${occ.file}`);
//                 console.log(`         Lines ${occ.startLine}-${occ.endLine} (${occ.lineCount} lines)`);
//               });
//             });
//             if (duplicationResults.nearClones.length > 5) {
//               console.log(`\n   ... and ${duplicationResults.nearClones.length - 5} more groups`);
//             }
//           }
          
//           console.log('\n' + '='.repeat(80));
//           console.log('💾 SAVING TO DATABASE...');
//           console.log('='.repeat(80));
          
//           // Update project with completed status and results
//           updatedProject.analysisStatus = 'completed';
//           updatedProject.duplicationAnalysis = {
//             status: 'completed',
//             startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             results: duplicationResults
//           };
          
//           await updatedProject.save();
          
//           console.log('✅ Successfully saved to database!');
//           console.log(`   Project ID: ${updatedProject._id}`);
//           console.log(`   Project Name: ${updatedProject.projectName}`);
//           console.log('\n📍 VIEW RESULTS AT:');
//           console.log(`   GET /api/projects/${updatedProject._id}/duplication`);
//           console.log(`   GET /api/projects/${updatedProject._id}/test-data`);
//           console.log('='.repeat(80));
          
//           // Display complete results as JSON
//           console.log('\n📄 COMPLETE RESULTS (JSON):');
//           console.log(JSON.stringify(duplicationResults, null, 2));
//           console.log('\n' + '='.repeat(80) + '\n');
//         })
//         .catch(async (error) => {
//           console.log('\n' + '='.repeat(80));
//           console.error('❌ DUPLICATION ANALYSIS FAILED');
//           console.log('='.repeat(80));
//           console.error('Error:', error.message);
//           console.error('Stack:', error.stack);
          
//           // Refetch project from database to get latest data
//           const updatedProject = await Project.findById(projectId);
//           if (!updatedProject) {
//             console.error('❌ Project not found during error update');
//             return;
//           }
          
//           // Update project with failed status
//           updatedProject.analysisStatus = 'failed';
//           updatedProject.duplicationAnalysis = {
//             status: 'failed',
//             startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             error: error.message
//           };
//           await updatedProject.save();
          
//           console.log('💾 Saved failure status to database');
//           console.log('='.repeat(80) + '\n');
//         });

//       console.log(`Project uploaded and queued for analysis: ${project.projectName}`);

//     } catch (error) {
//       console.error('Upload and processing error:', error);
      
//       if (extractedPath) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//         } catch (cleanupError) {
//           console.error('Error cleaning up extracted files:', cleanupError);
//         }
//       }

//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (unlinkError) {
//           console.error('Error deleting uploaded file:', unlinkError);
//         }
//       }

//       if (project && project._id) {
//         try {
//           await Project.findByIdAndDelete(project._id);
//         } catch (deleteError) {
//           console.error('Error deleting project record:', deleteError);
//         }
//       }

//       res.status(500).json({
//         success: false,
//         message: error.message || 'Upload and processing failed'
//       });
//     }
//   });
// });

// // GET /api/projects - Get user's projects
// router.get('/', auth, async (req, res) => {
//   try {
//     const projects = await Project.find({ user: req.user.userId })
//       .sort({ createdAt: -1 })
//       .select('-zipFilePath -extractedPath -validationResult -cleanupResult');

//     res.json({
//       success: true,
//       projects
//     });
//   } catch (error) {
//     console.error('Error fetching projects:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch projects'
//     });
//   }
// });

// // GET /api/projects/:id - Get specific project
// router.get('/:id', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     res.json({
//       success: true,
//       project
//     });
//   } catch (error) {
//     console.error('Error fetching project:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch project'
//     });
//   }
// });

// // GET /api/projects/:id/test-data - Debug endpoint to see complete raw data
// router.get('/:id/test-data', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     // Return everything for debugging
//     res.json({
//       success: true,
//       debug: {
//         projectId: project._id,
//         projectName: project.projectName,
//         analysisStatus: project.analysisStatus,
//         hasDuplicationAnalysis: !!project.duplicationAnalysis,
//         duplicationStatus: project.duplicationAnalysis?.status,
//         hasResults: !!project.duplicationAnalysis?.results,
//         exactCloneCount: project.duplicationAnalysis?.results?.exactClones?.length || 0,
//         nearCloneCount: project.duplicationAnalysis?.results?.nearClones?.length || 0,
//         stats: project.duplicationAnalysis?.results?.stats,
//       },
//       fullDuplicationAnalysis: project.duplicationAnalysis,
//       rawProject: project.toObject()
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// // GET /api/projects/:id/duplication - Get code duplication analysis results
// router.get('/:id/duplication', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     if (!project.duplicationAnalysis) {
//       return res.status(400).json({
//         success: false,
//         message: 'Duplication analysis not available for this project'
//       });
//     }

//     res.json({
//       success: true,
//       status: project.duplicationAnalysis.status,
//       analysis: project.duplicationAnalysis,
//       projectName: project.projectName,
//       projectType: project.projectType
//     });

//   } catch (error) {
//     console.error('Error fetching duplication results:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch duplication results'
//     });
//   }
// });

// // GET /api/projects/:id/duplication/exact - Get only exact clones
// router.get('/:id/duplication/exact', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project || !project.duplicationAnalysis?.results) {
//       return res.status(404).json({
//         success: false,
//         message: 'Duplication analysis not found'
//       });
//     }

//     res.json({
//       success: true,
//       exactClones: project.duplicationAnalysis.results.exactClones || [],
//       stats: {
//         totalGroups: project.duplicationAnalysis.results.stats.exactCloneGroups,
//         totalDuplicates: project.duplicationAnalysis.results.stats.duplicatedUnits
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching exact clones:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch exact clones'
//     });
//   }
// });

// // GET /api/projects/:id/duplication/near - Get only near clones
// router.get('/:id/duplication/near', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project || !project.duplicationAnalysis?.results) {
//       return res.status(404).json({
//         success: false,
//         message: 'Duplication analysis not found'
//       });
//     }

//     res.json({
//       success: true,
//       nearClones: project.duplicationAnalysis.results.nearClones || [],
//       stats: {
//         totalGroups: project.duplicationAnalysis.results.stats.nearCloneGroups
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching near clones:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch near clones'
//     });
//   }
// });

// // GET /api/projects/:id/file-content - Get file content for viewing duplicates
// router.get('/:id/file-content', auth, async (req, res) => {
//   try {
//     const { filePath, startLine, endLine } = req.query;

//     if (!filePath) {
//       return res.status(400).json({
//         success: false,
//         message: 'File path is required'
//       });
//     }

//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     const fullPath = path.join(project.extractedPath, filePath);
    
//     // Security check: ensure the file is within the project directory
//     const normalizedPath = path.normalize(fullPath);
//     if (!normalizedPath.startsWith(project.extractedPath)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     const content = await fs.readFile(fullPath, 'utf8');
//     const lines = content.split('\n');

//     let resultContent = content;
//     let resultLines = lines;

//     // If line range is specified, extract only those lines
//     if (startLine && endLine) {
//       const start = parseInt(startLine) - 1;
//       const end = parseInt(endLine);
//       resultLines = lines.slice(start, end);
//       resultContent = resultLines.join('\n');
//     }

//     res.json({
//       success: true,
//       filePath,
//       content: resultContent,
//       totalLines: lines.length,
//       extractedLines: resultLines.length
//     });

//   } catch (error) {
//     console.error('Error fetching file content:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch file content'
//     });
//   }
// });

// // DELETE /api/projects/:id - Delete project
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     if (project.source === 'zip' && project.zipFilePath) {
//       try {
//         await fs.unlink(project.zipFilePath);
//       } catch (unlinkError) {
//         console.error('Error deleting ZIP file:', unlinkError);
//       }
//     }

//     if (project.extractedPath) {
//       try {
//         await fs.rm(project.extractedPath, { recursive: true, force: true });
//       } catch (unlinkError) {
//         console.error('Error deleting extracted directory:', unlinkError);
//       }
//     }

//     await Project.findByIdAndDelete(req.params.id);

//     res.json({
//       success: true,
//       message: 'Project deleted successfully'
//     });
//   } catch (error) {
//     console.error('Error deleting project:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete project'
//     });
//   }
// });

// const exportedFunctions = {
//   ensureExtractedDir,
//   validateMernProject,
//   cleanupProject,
//   removeNodeModulesRecursively,
//   validateMernProjectEnhanced,
//   checkForNonMernFrameworks,
//   directoryExists,
//   fileExists,
//   readPackageJson,
// };

// module.exports = router;
// module.exports.functions = exportedFunctions;



// // routes/projects.js 
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs').promises;
// const AdmZip = require('adm-zip');
// const crypto = require('crypto');
// const parser = require('@babel/parser');
// const traverse = require('@babel/traverse').default;
// const Project = require('../models/repository');
// const auth = require('../middleware/auth');
// const router = express.Router();

// const ensureUploadDir = async () => {
//   const uploadDir = path.join(__dirname, '../uploads/projects/manual_uploads');
//   try {
//     await fs.access(uploadDir);
//   } catch (error) {
//     await fs.mkdir(uploadDir, { recursive: true });
//   }
//   return uploadDir;
// };

// const ensureExtractedDir = async () => {
//   const extractedDir = path.join(__dirname, '../uploads/projects/extracted-projects');
//   try {
//     await fs.access(extractedDir);
//   } catch (error) {
//     await fs.mkdir(extractedDir, { recursive: true });
//   }
//   return extractedDir;
// };

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: async function (req, file, cb) {
//     const uploadDir = await ensureUploadDir();
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, `project-${uniqueSuffix}${path.extname(file.originalname)}`);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'application/zip' || 
//       file.mimetype === 'application/x-zip-compressed' ||
//       file.originalname.toLowerCase().endsWith('.zip')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only ZIP files are allowed'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 100 * 1024 * 1024, // 100MB limit
//   }
// });

// // ==================== CODE DUPLICATION DETECTION ====================

// // Parse JavaScript/TypeScript file to AST
// const parseFile = async (filePath) => {
//   try {
//     const code = await fs.readFile(filePath, 'utf8');
//     return parser.parse(code, {
//       sourceType: 'module',
//       plugins: ['jsx', 'typescript', 'decorators-legacy'],
//       errorRecovery: true,
//     });
//   } catch (error) {
//     console.warn(`Failed to parse ${filePath}:`, error.message);
//     return null;
//   }
// };

// // Collect code units (functions, classes, blocks) from AST
// const collectUnits = (ast, filePath) => {
//   const units = [];

//   if (!ast) return units;

//   try {
//     traverse(ast, {
//       FunctionDeclaration(path) {
//         const unit = makeUnit('function', path.node, filePath, path.node.id?.name);
//         // Only include functions with 3+ lines of code
//         if (unit.endLine - unit.startLine >= 2) {
//           units.push(unit);
//         }
//       },
//       ArrowFunctionExpression(path) {
//         const parent = path.parent;
//         let name = 'anonymous';
//         if (parent.type === 'VariableDeclarator' && parent.id) {
//           name = parent.id.name;
//         }
        
//         // Check if it's a single statement arrow function
//         const node = path.node;
//         let isSingleStatement = false;
        
//         if (node.body.type === 'BlockStatement') {
//           // Has block body - check if it contains only 1 statement
//           isSingleStatement = node.body.body.length === 1;
//         } else {
//           // Expression body (no curly braces) - always single statement
//           // e.g., () => setValue(true)
//           isSingleStatement = true;
//         }
        
//         // Only include multi-statement arrow functions
//         if (!isSingleStatement) {
//           const unit = makeUnit('function', path.node, filePath, name);
//           units.push(unit);
//         }
//       },
//       FunctionExpression(path) {
//         const name = path.node.id?.name || 'anonymous';
//         const unit = makeUnit('function', path.node, filePath, name);
//         // Only include functions with 3+ lines of code
//         if (unit.endLine - unit.startLine >= 2) {
//           units.push(unit);
//         }
//       },
//       ClassDeclaration(path) {
//         units.push(makeUnit('class', path.node, filePath, path.node.id?.name));
//       },
//       ClassMethod(path) {
//         const unit = makeUnit('method', path.node, filePath, path.node.key?.name);
//         // Only include methods with 3+ lines of code
//         if (unit.endLine - unit.startLine >= 2) {
//           units.push(unit);
//         }
//       },
//       ObjectMethod(path) {
//         const unit = makeUnit('method', path.node, filePath, path.node.key?.name);
//         // Only include methods with 3+ lines of code
//         if (unit.endLine - unit.startLine >= 2) {
//           units.push(unit);
//         }
//       },
//       BlockStatement(path) {
//         // Only capture large blocks to avoid noise
//         if (path.node.body && path.node.body.length >= 5) {
//           // Skip if it's part of a function/class we already captured
//           const parent = path.parent;
//           if (!['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 
//                 'ClassMethod', 'ObjectMethod'].includes(parent.type)) {
//             units.push(makeUnit('block', path.node, filePath, 'code-block'));
//           }
//         }
//       },
//     });
//   } catch (error) {
//     console.error(`Error traversing AST for ${filePath}:`, error.message);
//   }

//   return units;
// };

// const makeUnit = (type, node, filePath, name = 'unnamed') => {
//   return {
//     type,
//     filePath,
//     name,
//     loc: node.loc,
//     node,
//     startLine: node.loc?.start?.line || 0,
//     endLine: node.loc?.end?.line || 0,
//   };
// };

// // Canonicalize AST node (normalize variable names, literals)
// const canonicalizeNode = (node) => {
//   const clone = JSON.parse(JSON.stringify(node));
//   const idMap = new Map();
//   let idCounter = 0;

//   const getId = (name) => {
//     if (!idMap.has(name)) {
//       idMap.set(name, `ID${idCounter++}`);
//     }
//     return idMap.get(name);
//   };

//   const visit = (n, depth = 0) => {
//     if (!n || typeof n !== 'object') return;

//     // Normalize identifiers BUT preserve function call names at statement level
//     if (n.type === 'Identifier') {
//       // Special case: preserve callback/handler function names
//       // These are important for distinguishing different behaviors
//       const isCallbackName = n.name && (
//         n.name.startsWith('on') ||      // onCartAccess, onLogout
//         n.name.startsWith('handle') ||  // handleSubmit
//         n.name.includes('Callback') ||
//         n.name.includes('Handler')
//       );
      
//       // If it's a callback/handler name AND it's being called (not defined)
//       // preserve a hash of it instead of normalizing
//       if (isCallbackName && depth > 0) {
//         n.name = `CALLBACK_${n.name}`;  // Preserve the actual callback name
//       } else {
//         n.name = getId(n.name);
//       }
//     }

//     // Normalize literals
//     if (n.type === 'NumericLiteral') n.value = 'NUM';
//     if (n.type === 'StringLiteral') n.value = 'STR';
//     if (n.type === 'BooleanLiteral') n.value = 'BOOL';
//     if (n.type === 'NullLiteral') n.value = 'NULL';

//     // Remove location info
//     delete n.start;
//     delete n.end;
//     delete n.loc;
//     delete n.range;

//     for (const key of Object.keys(n)) {
//       const val = n[key];
//       if (Array.isArray(val)) {
//         val.forEach(v => visit(v, depth + 1));
//       } else if (typeof val === 'object') {
//         visit(val, depth + 1);
//       }
//     }
//   };

//   visit(clone);
//   return clone;
// };

// const canonicalString = (node) => {
//   const canonical = canonicalizeNode(node);
//   return JSON.stringify(canonical);
// };

// const hashString = (str) => {
//   return crypto.createHash('sha256').update(str).digest('hex');
// };

// // Calculate similarity between two canonical strings
// const calculateSimilarity = (canonA, canonB) => {
//   const tokensA = canonA.split(/\W+/).filter(Boolean);
//   const tokensB = canonB.split(/\W+/).filter(Boolean);

//   const setA = new Set(tokensA);
//   const setB = new Set(tokensB);

//   const intersection = new Set([...setA].filter(x => setB.has(x)));
//   const union = new Set([...setA, ...setB]);

//   return union.size > 0 ? intersection.size / union.size : 0;
// };

// // Recursively find all JS/TS files
// const findCodeFiles = async (dirPath, fileList = []) => {
//   try {
//     const items = await fs.readdir(dirPath);

//     for (const item of items) {
//       if (item.startsWith('.') || item === 'node_modules') continue;

//       const itemPath = path.join(dirPath, item);
//       const stats = await fs.stat(itemPath);

//       if (stats.isDirectory()) {
//         await findCodeFiles(itemPath, fileList);
//       } else if (stats.isFile()) {
//         const ext = path.extname(item).toLowerCase();
//         if (['.js', '.jsx', '.ts', '.tsx', '.mjs'].includes(ext)) {
//           fileList.push(itemPath);
//         }
//       }
//     }
//   } catch (error) {
//     console.warn(`Error reading directory ${dirPath}:`, error.message);
//   }

//   return fileList;
// };

// // Main duplication analysis function
// const analyzeDuplication = async (projectPath) => {
//   console.log('Starting code duplication analysis...');
  
//   const results = {
//     exactClones: [],
//     nearClones: [],
//     stats: {
//       totalFiles: 0,
//       totalUnits: 0,
//       exactCloneGroups: 0,
//       nearCloneGroups: 0,
//       duplicatedUnits: 0,
//     }
//   };

//   try {
//     // Find all code files
//     const codeFiles = await findCodeFiles(projectPath);
//     results.stats.totalFiles = codeFiles.length;

//     if (codeFiles.length === 0) {
//       console.log('No code files found');
//       return results;
//     }

//     console.log(`Found ${codeFiles.length} code files`);

//     // Parse files and collect units
//     const allUnits = [];
//     const hashMap = new Map(); // hash -> [unitInfo]

//     for (const file of codeFiles) {
//       const ast = await parseFile(file);
//       if (!ast) continue;

//       const units = collectUnits(ast, file);
//       allUnits.push(...units);

//       for (const unit of units) {
//         const canon = canonicalString(unit.node);
//         const hash = hashString(canon);

//         if (!hashMap.has(hash)) {
//           hashMap.set(hash, []);
//         }

//         const relativePath = path.relative(projectPath, unit.filePath);
//         hashMap.get(hash).push({
//           type: unit.type,
//           name: unit.name,
//           file: relativePath,
//           filePath: unit.filePath,
//           loc: unit.loc,
//           startLine: unit.startLine,
//           endLine: unit.endLine,
//           canonical: canon,
//           lineCount: unit.endLine - unit.startLine + 1,
//         });
//       }
//     }

//     results.stats.totalUnits = allUnits.length;
//     console.log(`Collected ${allUnits.length} code units`);

//     // Detect exact clones
//     let groupId = 1;
//     for (const [hash, occurrences] of hashMap.entries()) {
//       if (occurrences.length >= 2) {
//         // Filter out very simple functions (only 2-3 statements that are all simple calls)
//         const isSimpleWrapper = occurrences.every(occ => {
//           const lineCount = occ.lineCount;
//           // If it's a 3-5 line function, check if it's just sequential function calls
//           if (lineCount >= 3 && lineCount <= 5) {
//             // This is likely a simple wrapper function - include it
//             // but mark it with lower priority
//             return false;
//           }
//           return false;
//         });
        
//         results.exactClones.push({
//           groupId: groupId++,
//           hash,
//           type: occurrences[0].type,
//           occurrences,
//           duplicateCount: occurrences.length,
//           severity: occurrences[0].lineCount <= 5 ? 'low' : 'high' // Mark simple wrappers as low severity
//         });
//         results.stats.duplicatedUnits += occurrences.length;
//       }
//     }

//     results.stats.exactCloneGroups = results.exactClones.length;
//     console.log(`Found ${results.exactClones.length} exact clone groups`);

//     // Detect near-duplicates (similar but not exact)
//     const SIMILARITY_THRESHOLD = 0.8;
//     const processedPairs = new Set();

//     // Only compare units of same type and similar size
//     const unitsByType = new Map();
//     for (const unit of allUnits) {
//       if (!unitsByType.has(unit.type)) {
//         unitsByType.set(unit.type, []);
//       }
//       unitsByType.get(unit.type).push(unit);
//     }

//     for (const [type, units] of unitsByType.entries()) {
//       // Only check larger units for near-duplicates (≥10 lines)
//       const largeUnits = units.filter(u => (u.endLine - u.startLine) >= 10);

//       for (let i = 0; i < largeUnits.length; i++) {
//         for (let j = i + 1; j < largeUnits.length; j++) {
//           const unitA = largeUnits[i];
//           const unitB = largeUnits[j];

//           // Skip if same file (likely same unit)
//           if (unitA.filePath === unitB.filePath) continue;

//           const canonA = canonicalString(unitA.node);
//           const canonB = canonicalString(unitB.node);
//           const hashA = hashString(canonA);
//           const hashB = hashString(canonB);

//           // Skip if already exact duplicates
//           if (hashA === hashB) continue;

//           const pairKey = [hashA, hashB].sort().join('|');
//           if (processedPairs.has(pairKey)) continue;
//           processedPairs.add(pairKey);

//           // Check size similarity (within 30% of each other)
//           const sizeA = canonA.length;
//           const sizeB = canonB.length;
//           const sizeRatio = Math.min(sizeA, sizeB) / Math.max(sizeA, sizeB);

//           if (sizeRatio < 0.7) continue;

//           // Calculate token-based similarity
//           const similarity = calculateSimilarity(canonA, canonB);

//           if (similarity >= SIMILARITY_THRESHOLD) {
//             const relativePathA = path.relative(projectPath, unitA.filePath);
//             const relativePathB = path.relative(projectPath, unitB.filePath);

//             results.nearClones.push({
//               groupId: groupId++,
//               type,
//               similarity: parseFloat(similarity.toFixed(3)),
//               occurrences: [
//                 {
//                   type: unitA.type,
//                   name: unitA.name,
//                   file: relativePathA,
//                   filePath: unitA.filePath,
//                   loc: unitA.loc,
//                   startLine: unitA.startLine,
//                   endLine: unitA.endLine,
//                   lineCount: unitA.endLine - unitA.startLine + 1,
//                 },
//                 {
//                   type: unitB.type,
//                   name: unitB.name,
//                   file: relativePathB,
//                   filePath: unitB.filePath,
//                   loc: unitB.loc,
//                   startLine: unitB.startLine,
//                   endLine: unitB.endLine,
//                   lineCount: unitB.endLine - unitB.startLine + 1,
//                 }
//               ]
//             });
//           }
//         }
//       }
//     }

//     results.stats.nearCloneGroups = results.nearClones.length;
//     console.log(`Found ${results.nearClones.length} near-clone groups`);

//     return results;

//   } catch (error) {
//     console.error('Duplication analysis error:', error);
//     throw error;
//   }
// };

// // ==================== VALIDATION FUNCTIONS ====================

// const directoryExists = async (dirPath) => {
//   try {
//     const stats = await fs.stat(dirPath);
//     return stats.isDirectory();
//   } catch {
//     return false;
//   }
// };

// const fileExists = async (filePath) => {
//   try {
//     await fs.access(filePath);
//     return true;
//   } catch {
//     return false;
//   }
// };

// const readPackageJson = async (packagePath) => {
//   try {
//     const content = await fs.readFile(packagePath, 'utf8');
//     return JSON.parse(content);
//   } catch {
//     return null;
//   }
// };

// const removeNodeModulesRecursively = async (startPath) => {
//   const removedPaths = [];
//   const errors = [];

//   const searchAndRemove = async (currentPath) => {
//     try {
//       const items = await fs.readdir(currentPath);
      
//       for (const item of items) {
//         const itemPath = path.join(currentPath, item);
        
//         if (item === 'node_modules') {
//           try {
//             console.log(`Removing node_modules at: ${itemPath}`);
//             await fs.rm(itemPath, { recursive: true, force: true });
//             removedPaths.push(path.relative(startPath, itemPath));
//           } catch (error) {
//             console.error(`Failed to remove node_modules at ${itemPath}:`, error);
//             errors.push(`Failed to remove ${path.relative(startPath, itemPath)}: ${error.message}`);
//           }
//         } else if (await directoryExists(itemPath) && 
//                    !item.startsWith('.') && 
//                    !['dist', 'build', 'coverage'].includes(item)) {
//           await searchAndRemove(itemPath);
//         }
//       }
//     } catch (error) {
//       console.error(`Error reading directory ${currentPath}:`, error);
//       errors.push(`Error reading directory ${path.relative(startPath, currentPath)}: ${error.message}`);
//     }
//   };

//   await searchAndRemove(startPath);
  
//   return { removedPaths, errors };
// };

// const validateMernProjectEnhanced = async (extractedPath) => {
//   const validation = {
//     isValid: false,
//     type: 'unknown',
//     errors: [],
//     warnings: [],
//     structure: {},
//     packageJsonLocations: [],
//     hasSrcDirectory: false,
//     fileTypeAnalysis: {}
//   };

//   try {
//     console.log(`Starting enhanced validation for: ${extractedPath}`);

//     const analyzeFileTypes = async (dirPath, maxDepth = 3) => {
//       const fileTypes = {
//         javascript: 0,
//         python: 0,
//         java: 0,
//         php: 0,
//         csharp: 0,
//         other: 0,
//         pythonFiles: [],
//         javaFiles: [],
//         phpFiles: [],
//         csharpFiles: []
//       };

//       const analyzeRecursive = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return;

//         try {
//           const items = await fs.readdir(currentPath);

//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;

//             const itemPath = path.join(currentPath, item);
//             const stats = await fs.stat(itemPath);

//             if (stats.isFile()) {
//               const ext = path.extname(item).toLowerCase();
//               const relativePath = path.relative(dirPath, itemPath);

//               switch (ext) {
//                 case '.js':
//                 case '.jsx':
//                 case '.ts':
//                 case '.tsx':
//                 case '.mjs':
//                   fileTypes.javascript++;
//                   break;
//                 case '.py':
//                 case '.pyw':
//                 case '.pyx':
//                   fileTypes.python++;
//                   fileTypes.pythonFiles.push(relativePath);
//                   break;
//                 case '.java':
//                 case '.class':
//                   fileTypes.java++;
//                   fileTypes.javaFiles.push(relativePath);
//                   break;
//                 case '.php':
//                 case '.phtml':
//                   fileTypes.php++;
//                   fileTypes.phpFiles.push(relativePath);
//                   break;
//                 case '.cs':
//                 case '.vb':
//                   fileTypes.csharp++;
//                   fileTypes.csharpFiles.push(relativePath);
//                   break;
//                 default:
//                   if (ext) {
//                     fileTypes.other++;
//                   }
//                   break;
//               }
//             } else if (stats.isDirectory()) {
//               await analyzeRecursive(itemPath, depth + 1);
//             }
//           }
//         } catch (error) {
//           console.warn(`Error analyzing files in ${currentPath}:`, error.message);
//         }
//       };

//       await analyzeRecursive(dirPath);
//       return fileTypes;
//     };

//     const findPackageJsonFiles = async (startPath, maxDepth = 3) => {
//       const packageJsonFiles = [];
      
//       const searchRecursive = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return;
        
//         try {
//           const items = await fs.readdir(currentPath);
          
//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;
            
//             const itemPath = path.join(currentPath, item);
            
//             if (item === 'package.json') {
//               const relativePath = path.relative(startPath, itemPath);
//               packageJsonFiles.push({
//                 path: itemPath,
//                 relativePath,
//                 directory: path.dirname(itemPath)
//               });
//             } else if (await directoryExists(itemPath)) {
//               await searchRecursive(itemPath, depth + 1);
//             }
//           }
//         } catch (error) {
//           console.warn(`Error reading directory ${currentPath}:`, error.message);
//         }
//       };
      
//       await searchRecursive(startPath);
//       return packageJsonFiles;
//     };

//     const checkForSrcDirectory = async (startPath, maxDepth = 3) => {
//       const searchForSrc = async (currentPath, depth = 0) => {
//         if (depth > maxDepth) return false;
        
//         try {
//           const items = await fs.readdir(currentPath);
          
//           if (items.includes('src') && await directoryExists(path.join(currentPath, 'src'))) {
//             return true;
//           }
          
//           for (const item of items) {
//             if (item.startsWith('.') || item === 'node_modules') continue;
            
//             const itemPath = path.join(currentPath, item);
//             if (await directoryExists(itemPath)) {
//               const found = await searchForSrc(itemPath, depth + 1);
//               if (found) return true;
//             }
//           }
//         } catch (error) {
//           console.warn(`Error searching for src in ${currentPath}:`, error.message);
//         }
        
//         return false;
//       };
      
//       return await searchForSrc(startPath);
//     };

//     const fileTypeAnalysis = await analyzeFileTypes(extractedPath);
//     validation.fileTypeAnalysis = fileTypeAnalysis;

//     if (fileTypeAnalysis.python > 0) {
//       validation.errors.push(`Python files detected (${fileTypeAnalysis.pythonFiles.join(', ')}). This appears to be a Python project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.java > 0) {
//       validation.errors.push(`Java files detected (${fileTypeAnalysis.javaFiles.join(', ')}). This appears to be a Java project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.php > 0) {
//       validation.errors.push(`PHP files detected (${fileTypeAnalysis.phpFiles.join(', ')}). This appears to be a PHP project, not a MERN stack project.`);
//     }
    
//     if (fileTypeAnalysis.csharp > 0) {
//       validation.errors.push(`C#/.NET files detected (${fileTypeAnalysis.csharpFiles.join(', ')}). This appears to be a .NET project, not a MERN stack project.`);
//     }

//     const nonJsFiles = fileTypeAnalysis.python + fileTypeAnalysis.java + fileTypeAnalysis.php + fileTypeAnalysis.csharp;
//     if (nonJsFiles > fileTypeAnalysis.javascript && nonJsFiles > 0) {
//       validation.errors.push(`Project contains more non-JavaScript files (${nonJsFiles}) than JavaScript files (${fileTypeAnalysis.javascript}). This does not appear to be a JavaScript/Node.js project.`);
//     }

//     if (validation.errors.length > 0) {
//       return validation;
//     }

//     const packageJsonFiles = await findPackageJsonFiles(extractedPath);
//     validation.packageJsonLocations = packageJsonFiles.map(f => f.relativePath);

//     validation.hasSrcDirectory = await checkForSrcDirectory(extractedPath);

//     console.log(`Found package.json files at: ${validation.packageJsonLocations.join(', ')}`);
//     console.log(`Has src directory: ${validation.hasSrcDirectory}`);

//     if (packageJsonFiles.length === 0) {
//       validation.errors.push('No package.json found in project directory or subdirectories - this is required for a valid Node.js/React project');
//       return validation;
//     }

//     if (!validation.hasSrcDirectory) {
//       validation.errors.push('No src directory found - this is required for a valid project structure');
//       return validation;
//     }

//     if (fileTypeAnalysis.javascript === 0) {
//       validation.errors.push('No JavaScript/TypeScript files found - this is required for a Node.js/React project');
//       return validation;
//     }

//     let hasReact = false;
//     let hasExpress = false;
//     let hasMongodb = false;
//     let hasNode = false;

//     for (const pkgFile of packageJsonFiles) {
//       const packageJson = await readPackageJson(pkgFile.path);
//       if (!packageJson) continue;

//       const allDeps = {
//         ...packageJson.dependencies,
//         ...packageJson.devDependencies
//       };

//       if (allDeps.react || allDeps['react-dom']) hasReact = true;
//       if (allDeps.express) hasExpress = true;
//       if (allDeps.mongoose || allDeps.mongodb) hasMongodb = true;
//       if (packageJson.engines?.node || allDeps.nodemon) hasNode = true;
//     }

//     if (hasReact && hasExpress && (hasMongodb || hasNode)) {
//       validation.type = 'fullstack-mern';
//       validation.isValid = true;
//     } else if (hasReact && hasExpress && packageJsonFiles.length >= 2) {
//       validation.type = 'fullstack-mern';
//       validation.isValid = true;
//       validation.warnings.push('Full-stack project detected but MongoDB dependency not found');
//     } else if (hasReact && !hasExpress && packageJsonFiles.length === 1) {
//       validation.type = 'frontend-react';
//       validation.isValid = true;
//       validation.warnings.push('Frontend-only React project detected');
//     } else if (hasExpress && !hasReact && packageJsonFiles.length === 1) {
//       validation.type = 'backend-node';
//       validation.isValid = true;
//       validation.warnings.push('Backend-only Node.js project detected');
//     } else if ((hasExpress || hasReact || hasMongodb) && packageJsonFiles.length >= 1) {
//       validation.type = 'partial-mern';
//       validation.isValid = true;
//       validation.warnings.push('Partial MERN stack detected - some components may be missing');
//     } else {
//       validation.errors.push('Not a recognizable MERN stack project - missing required dependencies (React, Express, or Node.js indicators)');
//     }

//     return validation;

//   } catch (error) {
//     console.error('Validation error:', error);
//     validation.errors.push(`Validation error: ${error.message}`);
//     return validation;
//   }
// };

// const checkForNonMernFrameworks = async (extractedPath, validation) => {
//   try {
//     const items = await fs.readdir(extractedPath);
    
//     if (items.includes('manage.py')) {
//       validation.errors.push('Django project detected (manage.py found). This is a Python/Django project, not MERN stack.');
//     }
    
//     if (items.includes('pom.xml') || items.includes('build.gradle')) {
//       validation.errors.push('Java Spring Boot project detected. This is a Java project, not MERN stack.');
//     }
    
//     if (items.includes('artisan') || items.includes('composer.json')) {
//       validation.errors.push('PHP Laravel project detected. This is a PHP project, not MERN stack.');
//     }
    
//     if (items.some(item => item.endsWith('.csproj') || item.endsWith('.sln'))) {
//       validation.errors.push('.NET project detected. This is a C#/.NET project, not MERN stack.');
//     }

//     if (items.includes('requirements.txt') || items.includes('Pipfile')) {
//       validation.errors.push('Python dependency files detected. This appears to be a Python project, not MERN stack.');
//     }
//   } catch (error) {
//     console.warn('Error checking for non-MERN frameworks:', error.message);
//   }
// };

// const validateMernProject = async (extractedPath) => {
//   const validation = await validateMernProjectEnhanced(extractedPath);
//   await checkForNonMernFrameworks(extractedPath, validation);
//   return validation;
// };

// const cleanupProject = async (extractedPath) => {
//   const cleanupResults = {
//     removed: [],
//     errors: [],
//     nodeModulesRemoved: []
//   };

//   try {
//     console.log('Starting project cleanup...');
    
//     const nodeModulesResult = await removeNodeModulesRecursively(extractedPath);
//     cleanupResults.nodeModulesRemoved = nodeModulesResult.removedPaths;
//     cleanupResults.errors.push(...nodeModulesResult.errors);
    
//     console.log(`Removed ${nodeModulesResult.removedPaths.length} node_modules directories`);

//     const itemsToRemove = [
//       '.git', '.DS_Store', 'Thumbs.db',
//       'dist', 'build', '.cache', '.parcel-cache', 
//       '.next', '.nuxt', 'coverage', '.nyc_output'
//     ];

//     for (const item of itemsToRemove) {
//       try {
//         const itemPath = path.join(extractedPath, item);
        
//         try {
//           const stats = await fs.stat(itemPath);
          
//           if (stats.isDirectory()) {
//             await fs.rm(itemPath, { recursive: true, force: true });
//             cleanupResults.removed.push(`Directory: ${item}`);
//           } else {
//             await fs.unlink(itemPath);
//             cleanupResults.removed.push(`File: ${item}`);
//           }
//         } catch (error) {
//           if (error.code !== 'ENOENT') {
//             cleanupResults.errors.push(`Failed to remove ${item}: ${error.message}`);
//           }
//         }
//       } catch (error) {
//         cleanupResults.errors.push(`Error processing ${item}: ${error.message}`);
//       }
//     }

//     console.log(`Cleanup completed: ${cleanupResults.removed.length} items removed`);
    
//   } catch (error) {
//     console.error('Cleanup error:', error);
//     cleanupResults.errors.push(`Cleanup error: ${error.message}`);
//   }

//   return cleanupResults;
// };

// const extractZipFile = async (zipPath, extractionPath) => {
//   try {
//     const zip = new AdmZip(zipPath);
//     const entries = zip.getEntries();
    
//     if (entries.length === 0) {
//       throw new Error('ZIP file is empty');
//     }
    
//     await fs.mkdir(extractionPath, { recursive: true });
//     zip.extractAllTo(extractionPath, true);
    
//     const macOSXPath = path.join(extractionPath, '__MACOSX');
//     if (await directoryExists(macOSXPath)) {
//       await fs.rm(macOSXPath, { recursive: true, force: true });
//     }
    
//     const extractedItems = await fs.readdir(extractionPath);
//     const validItems = extractedItems.filter(item => 
//       !item.startsWith('.') && 
//       !item.includes('__MACOSX') &&
//       !item.includes('_temp_')
//     );
    
//     if (validItems.length === 0) {
//       throw new Error('No valid files found after extraction');
//     }
    
//     console.log(`Successfully extracted ${validItems.length} items`);
    
//     return {
//       success: true,
//       extractedPath: extractionPath,
//       itemCount: validItems.length
//     };
//   } catch (error) {
//     console.error('ZIP extraction error:', error);
//     throw new Error(`Failed to extract ZIP: ${error.message}`);
//   }
// };

// const handleMulterError = (error, res) => {
//   if (error instanceof multer.MulterError) {
//     if (error.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         message: 'File too large. Maximum size is 100MB.'
//       });
//     }
//     return res.status(400).json({
//       success: false,
//       message: `Upload error: ${error.message}`
//     });
//   }
  
//   if (error.message === 'Only ZIP files are allowed') {
//     return res.status(400).json({
//       success: false,
//       message: 'Only ZIP files are allowed'
//     });
//   }

//   return res.status(500).json({
//     success: false,
//     message: error.message || 'Upload failed'
//   });
// };
// const {
//   analyzeCodeQuality,
//   analyzeApiRoutes,
//   analyzeMongooseQueries,
//   analyzeRedundantQueries
// } = require('../services/smells/codeQualityAnalysis');

// // ==================== ROUTES ====================

// // POST /api/projects/upload - Upload ZIP project with duplication analysis
// // router.post('/upload', auth, (req, res) => {
// //   upload.single('project')(req, res, async (err) => {
// //     if (err) {
// //       return handleMulterError(err, res);
// //     }

// //     let extractedPath = null;
// //     let project = null;

// //     try {
// //       if (!req.file) {
// //         return res.status(400).json({ 
// //           success: false, 
// //           message: 'No file uploaded' 
// //         });
// //       }

// //       const { projectName, description } = req.body;
      
// //       const extractionDirName = `project-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
// //       const extractedDir = await ensureExtractedDir();
// //       extractedPath = path.join(extractedDir, extractionDirName);

// //       console.log(`Extracting project to: ${extractedPath}`);

// //       // Extract ZIP file
// //       const extractionResult = await extractZipFile(req.file.path, extractedPath);
      
// //       console.log('ZIP extracted successfully, validating MERN structure...');

// //       // Validate MERN stack project
// //       const validation = await validateMernProject(extractedPath);
      
// //       console.log('Validation result:', {
// //         isValid: validation.isValid,
// //         type: validation.type,
// //         errors: validation.errors
// //       });

// //       if (!validation.isValid) {
// //         try {
// //           await fs.rm(extractedPath, { recursive: true, force: true });
// //           await fs.unlink(req.file.path);
// //         } catch (cleanupError) {
// //           console.error('Error cleaning up:', cleanupError);
// //         }

// //         return res.status(400).json({
// //           success: false,
// //           message: 'Invalid project structure',
// //           errors: validation.errors,
// //           warnings: validation.warnings,
// //           requirements: [
// //             'Project must contain at least one package.json file',
// //             'Project must have a src directory',
// //             'Project must be a valid Node.js/React/MERN project'
// //           ]
// //         });
// //       }

// //       console.log(`Valid ${validation.type} project detected, cleaning up...`);

// //       // Clean up unwanted files
// //       const cleanupResults = await cleanupProject(extractedPath);

// //       console.log('Cleanup completed, creating project record...');

// //       // Create project record
// //       const sanitizedProjectName = (projectName || req.file.originalname.replace('.zip', ''))
// //         .replace(/[^a-zA-Z0-9-_]/g, '-')
// //         .toLowerCase();
      
// //       const projectKey = `${sanitizedProjectName}-${Date.now()}`;

// //       project = new Project({
// //         user: req.user.userId,
// //         source: 'zip',
// //         zipFilePath: req.file.path,
// //         extractedPath: extractedPath,
// //         projectName: projectName || req.file.originalname.replace('.zip', ''),
// //         description: description || '',
// //         analysisStatus: 'processing',
// //         projectType: validation.type,
// //         validationResult: validation,
// //         cleanupResult: cleanupResults,
// //         duplicationAnalysis: {
// //           status: 'pending',
// //           startedAt: new Date()
// //         }
// //       });

// //       await project.save();
// //       console.log('✅ Project saved to database with ID:', project._id);

// //       // Send immediate response
// //       res.json({
// //         success: true,
// //         message: 'Project uploaded successfully. Code duplication analysis is in progress.',
// //         project: {
// //           id: project._id,
// //           name: project.projectName,
// //           source: project.source,
// //           type: project.projectType,
// //           status: project.analysisStatus,
// //           validation: {
// //             type: validation.type,
// //             warnings: validation.warnings
// //           },
// //           cleanup: {
// //             itemsRemoved: cleanupResults.removed.length,
// //             nodeModulesRemoved: cleanupResults.nodeModulesRemoved.length
// //           },
// //           createdAt: project.createdAt
// //         }
// //       });

// //       // Run duplication analysis asynchronously (ENHANCED WITH DEBUGGING)
// //       console.log('\n🚀 Starting code duplication analysis in background...\n');
// //       const projectId = project._id;
      
// //       analyzeDuplication(extractedPath)
// //         .then(async (duplicationResults) => {
// //           console.log('\n' + '='.repeat(80));
// //           console.log('🎉 DUPLICATION ANALYSIS COMPLETED SUCCESSFULLY');
// //           console.log('='.repeat(80));
          
// //           // Refetch project from database to get latest data
// //           const updatedProject = await Project.findById(projectId);
// //           if (!updatedProject) {
// //             console.error('❌ Project not found during update');
// //             return;
// //           }
          
// //           console.log('\n📊 ANALYSIS STATISTICS:');
// //           console.log('─'.repeat(80));
// //           console.log(`   Total Files Analyzed:        ${duplicationResults.stats.totalFiles}`);
// //           console.log(`   Total Code Units:            ${duplicationResults.stats.totalUnits}`);
// //           console.log(`   Exact Clone Groups:          ${duplicationResults.stats.exactCloneGroups}`);
// //           console.log(`   Near Clone Groups:           ${duplicationResults.stats.nearCloneGroups}`);
// //           console.log(`   Total Duplicated Units:      ${duplicationResults.stats.duplicatedUnits}`);
// //           console.log('─'.repeat(80));
          
// //           // Display sample of exact clones
// //           if (duplicationResults.exactClones.length > 0) {
// //             console.log('\n🔍 EXACT CLONES (First 5 groups):');
// //             console.log('─'.repeat(80));
// //             duplicationResults.exactClones.slice(0, 5).forEach((group) => {
// //               console.log(`\n   Group #${group.groupId} - ${group.type.toUpperCase()} (${group.duplicateCount} duplicates)`);
// //               group.occurrences.forEach((occ, i) => {
// //                 console.log(`      ${i + 1}. ${occ.name} in ${occ.file}`);
// //                 console.log(`         Lines ${occ.startLine}-${occ.endLine} (${occ.lineCount} lines)`);
// //               });
// //             });
// //             if (duplicationResults.exactClones.length > 5) {
// //               console.log(`\n   ... and ${duplicationResults.exactClones.length - 5} more groups`);
// //             }
// //           }
          
// //           // Display sample of near clones
// //           if (duplicationResults.nearClones.length > 0) {
// //             console.log('\n\n🔍 NEAR CLONES (First 5 groups):');
// //             console.log('─'.repeat(80));
// //             duplicationResults.nearClones.slice(0, 5).forEach((group) => {
// //               console.log(`\n   Group #${group.groupId} - ${group.type.toUpperCase()} (Similarity: ${(group.similarity * 100).toFixed(1)}%)`);
// //               group.occurrences.forEach((occ, i) => {
// //                 console.log(`      ${i + 1}. ${occ.name} in ${occ.file}`);
// //                 console.log(`         Lines ${occ.startLine}-${occ.endLine} (${occ.lineCount} lines)`);
// //               });
// //             });
// //             if (duplicationResults.nearClones.length > 5) {
// //               console.log(`\n   ... and ${duplicationResults.nearClones.length - 5} more groups`);
// //             }
// //           }
          
// //           console.log('\n' + '='.repeat(80));
// //           console.log('💾 SAVING TO DATABASE...');
// //           console.log('='.repeat(80));
          
// //           // Update project with completed status and results
// //           updatedProject.analysisStatus = 'completed';
// //           updatedProject.duplicationAnalysis = {
// //             status: 'completed',
// //             startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
// //             completedAt: new Date(),
// //             results: duplicationResults
// //           };
          
// //           await updatedProject.save();
          
// //           console.log('✅ Successfully saved to database!');
// //           console.log(`   Project ID: ${updatedProject._id}`);
// //           console.log(`   Project Name: ${updatedProject.projectName}`);
// //           console.log('\n📍 VIEW RESULTS AT:');
// //           console.log(`   GET /api/projects/${updatedProject._id}/duplication`);
// //           console.log(`   GET /api/projects/${updatedProject._id}/test-data`);
// //           console.log('='.repeat(80));
          
// //           // Display complete results as JSON
// //           console.log('\n📄 COMPLETE RESULTS (JSON):');
// //           console.log(JSON.stringify(duplicationResults, null, 2));
// //           console.log('\n' + '='.repeat(80) + '\n');
// //         })
// //         .catch(async (error) => {
// //           console.log('\n' + '='.repeat(80));
// //           console.error('❌ DUPLICATION ANALYSIS FAILED');
// //           console.log('='.repeat(80));
// //           console.error('Error:', error.message);
// //           console.error('Stack:', error.stack);
          
// //           // Refetch project from database to get latest data
// //           const updatedProject = await Project.findById(projectId);
// //           if (!updatedProject) {
// //             console.error('❌ Project not found during error update');
// //             return;
// //           }
          
// //           // Update project with failed status
// //           updatedProject.analysisStatus = 'failed';
// //           updatedProject.duplicationAnalysis = {
// //             status: 'failed',
// //             startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
// //             completedAt: new Date(),
// //             error: error.message
// //           };
// //           await updatedProject.save();
          
// //           console.log('💾 Saved failure status to database');
// //           console.log('='.repeat(80) + '\n');
// //         });

// //       console.log(`Project uploaded and queued for analysis: ${project.projectName}`);

// //     } catch (error) {
// //       console.error('Upload and processing error:', error);
      
// //       if (extractedPath) {
// //         try {
// //           await fs.rm(extractedPath, { recursive: true, force: true });
// //         } catch (cleanupError) {
// //           console.error('Error cleaning up extracted files:', cleanupError);
// //         }
// //       }

// //       if (req.file) {
// //         try {
// //           await fs.unlink(req.file.path);
// //         } catch (unlinkError) {
// //           console.error('Error deleting uploaded file:', unlinkError);
// //         }
// //       }

// //       if (project && project._id) {
// //         try {
// //           await Project.findByIdAndDelete(project._id);
// //         } catch (deleteError) {
// //           console.error('Error deleting project record:', deleteError);
// //         }
// //       }

// //       res.status(500).json({
// //         success: false,
// //         message: error.message || 'Upload and processing failed'
// //       });
// //     }
// //   });
// // });

// const performAllAnalyses = async (extractedPath) => {
//   console.log('\n' + '='.repeat(80));
//   console.log('🔍 STARTING COMBINED CODE ANALYSIS');
//   console.log('='.repeat(80) + '\n');

//   try {
//     // Run both analyses in parallel
//     const [duplicationResults, qualityResults] = await Promise.all([
//       analyzeDuplication(extractedPath),
//       analyzeCodeQuality(extractedPath)
//     ]);

//     const combinedResults = {
//       timestamp: new Date(),
//       analyses: {
//         duplication: duplicationResults,
//         codeQuality: qualityResults
//       },
//       summary: {
//         totalFiles: duplicationResults.stats.totalFiles,
//         totalUnits: duplicationResults.stats.totalUnits,
//         exactClones: duplicationResults.stats.exactCloneGroups,
//         nearClones: duplicationResults.stats.nearCloneGroups,
//         routeIssues: qualityResults.stats.totalIssuesFound,
//         criticalIssues: qualityResults.stats.criticalIssues,
//         highIssues: qualityResults.stats.highIssues,
//         mediumIssues: qualityResults.stats.mediumIssues,
//         lowIssues: qualityResults.stats.lowIssues
//       }
//     };

//     return combinedResults;
//   } catch (error) {
//     console.error('Error in combined analysis:', error);
//     throw error;
//   }
// };

// // ==================== ROUTES (UPDATED) ====================

// // POST /api/projects/upload - Upload ZIP project with COMBINED analysis
// router.post('/upload', auth, (req, res) => {
//   upload.single('project')(req, res, async (err) => {
//     if (err) {
//       return handleMulterError(err, res);
//     }

//     let extractedPath = null;
//     let project = null;

//     try {
//       if (!req.file) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'No file uploaded' 
//         });
//       }

//       const { projectName, description } = req.body;
      
//       const extractionDirName = `project-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//       const extractedDir = await ensureExtractedDir();
//       extractedPath = path.join(extractedDir, extractionDirName);

//       console.log(`Extracting project to: ${extractedPath}`);

//       // Extract ZIP file
//       const extractionResult = await extractZipFile(req.file.path, extractedPath);
      
//       console.log('ZIP extracted successfully, validating MERN structure...');

//       // Validate MERN stack project
//       const validation = await validateMernProject(extractedPath);
      
//       if (!validation.isValid) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//           await fs.unlink(req.file.path);
//         } catch (cleanupError) {
//           console.error('Error cleaning up:', cleanupError);
//         }

//         return res.status(400).json({
//           success: false,
//           message: 'Invalid project structure',
//           errors: validation.errors,
//           warnings: validation.warnings,
//           requirements: [
//             'Project must contain at least one package.json file',
//             'Project must have a src directory',
//             'Project must be a valid Node.js/React/MERN project'
//           ]
//         });
//       }

//       console.log(`Valid ${validation.type} project detected, cleaning up...`);

//       // Clean up unwanted files
//       const cleanupResults = await cleanupProject(extractedPath);

//       console.log('Cleanup completed, creating project record...');

//       // Create project record
//       const sanitizedProjectName = (projectName || req.file.originalname.replace('.zip', ''))
//         .replace(/[^a-zA-Z0-9-_]/g, '-')
//         .toLowerCase();
      
//       const projectKey = `${sanitizedProjectName}-${Date.now()}`;

//       project = new Project({
//         user: req.user.userId,
//         source: 'zip',
//         zipFilePath: req.file.path,
//         extractedPath: extractedPath,
//         projectName: projectName || req.file.originalname.replace('.zip', ''),
//         description: description || '',
//         analysisStatus: 'processing',
//         projectType: validation.type,
//         validationResult: validation,
//         cleanupResult: cleanupResults,
//         duplicationAnalysis: {
//           status: 'pending',
//           startedAt: new Date()
//         },
//         codeQualityAnalysis: {
//           status: 'pending',
//           startedAt: new Date()
//         }
//       });

//       await project.save();
//       console.log('✅ Project saved to database with ID:', project._id);

//       // Send immediate response
//       res.json({
//         success: true,
//         message: 'Project uploaded successfully. Code analysis (duplication & quality) is in progress.',
//         project: {
//           id: project._id,
//           name: project.projectName,
//           source: project.source,
//           type: project.projectType,
//           status: project.analysisStatus,
//           validation: {
//             type: validation.type,
//             warnings: validation.warnings
//           },
//           cleanup: {
//             itemsRemoved: cleanupResults.removed.length,
//             nodeModulesRemoved: cleanupResults.nodeModulesRemoved.length
//           },
//           createdAt: project.createdAt
//         }
//       });

//       // Run COMBINED analysis asynchronously
//       console.log('\n🚀 Starting combined code analysis in background...\n');
//       const projectId = project._id;
      
//       performAllAnalyses(extractedPath)
//         .then(async (combinedResults) => {
//           console.log('\n' + '='.repeat(80));
//           console.log('🎉 ALL ANALYSES COMPLETED SUCCESSFULLY');
//           console.log('='.repeat(80));
          
//           const updatedProject = await Project.findById(projectId);
//           if (!updatedProject) {
//             console.error('❌ Project not found during update');
//             return;
//           }
          
//           // Display summary
//           console.log('\n📊 ANALYSIS SUMMARY:');
//           console.log('─'.repeat(80));
//           console.log(`Files Analyzed:           ${combinedResults.summary.totalFiles}`);
//           console.log(`Code Units:               ${combinedResults.summary.totalUnits}`);
//           console.log(`Exact Clone Groups:       ${combinedResults.summary.exactClones}`);
//           console.log(`Near Clone Groups:        ${combinedResults.summary.nearClones}`);
//           console.log(`\n🚨 CODE QUALITY ISSUES:`);
//           console.log(`Critical Issues:          ${combinedResults.summary.criticalIssues}`);
//           console.log(`High Issues:              ${combinedResults.summary.highIssues}`);
//           console.log(`Medium Issues:            ${combinedResults.summary.mediumIssues}`);
//           console.log(`Low Issues:               ${combinedResults.summary.lowIssues}`);
//           console.log('─'.repeat(80));
          
//           // Update project with results
//           updatedProject.analysisStatus = 'completed';
//           updatedProject.duplicationAnalysis = {
//             status: 'completed',
//             startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             results: combinedResults.analyses.duplication
//           };
//           updatedProject.codeQualityAnalysis = {
//             status: 'completed',
//             startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             results: combinedResults.analyses.codeQuality
//           };
          
//           await updatedProject.save();
          
//           console.log('\n✅ Successfully saved all analyses to database!');
//           console.log(`   Project ID: ${updatedProject._id}`);
//           console.log(`   Project Name: ${updatedProject.projectName}`);
//           console.log('\n📍 VIEW RESULTS AT:');
//           console.log(`   GET /api/projects/${updatedProject._id}/analysis`);
//           console.log(`   GET /api/projects/${updatedProject._id}/duplication`);
//           console.log(`   GET /api/projects/${updatedProject._id}/quality`);
//           console.log('='.repeat(80) + '\n');
//         })
//         .catch(async (error) => {
//           console.log('\n' + '='.repeat(80));
//           console.error('❌ ANALYSIS FAILED');
//           console.log('='.repeat(80));
//           console.error('Error:', error.message);
          
//           const updatedProject = await Project.findById(projectId);
//           if (!updatedProject) {
//             console.error('❌ Project not found during error update');
//             return;
//           }
          
//           updatedProject.analysisStatus = 'failed';
//           updatedProject.duplicationAnalysis = {
//             status: 'failed',
//             startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             error: error.message
//           };
//           updatedProject.codeQualityAnalysis = {
//             status: 'failed',
//             startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             error: error.message
//           };
//           await updatedProject.save();
          
//           console.log('💾 Saved failure status to database');
//           console.log('='.repeat(80) + '\n');
//         });

//     } catch (error) {
//       console.error('Upload and processing error:', error);
      
//       if (extractedPath) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//         } catch (cleanupError) {
//           console.error('Error cleaning up extracted files:', cleanupError);
//         }
//       }

//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (unlinkError) {
//           console.error('Error deleting uploaded file:', unlinkError);
//         }
//       }

//       if (project && project._id) {
//         try {
//           await Project.findByIdAndDelete(project._id);
//         } catch (deleteError) {
//           console.error('Error deleting project record:', deleteError);
//         }
//       }

//       res.status(500).json({
//         success: false,
//         message: error.message || 'Upload and processing failed'
//       });
//     }
//   });
// });

// // ==================== NEW ENDPOINTS ====================

// // // GET /api/projects/:id/analysis - Get COMBINED analysis results
// // router.get('/:id/analysis', auth, async (req, res) => {
// //   try {
// //     const project = await Project.findOne({
// //       _id: req.params.id,
// //       user: req.user.userId
// //     });

// //     if (!project) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Project not found'
// //       });
// //     }

// //     res.json({
// //       success: true,
// //       projectName: project.projectName,
// //       projectType: project.projectType,
// //       analysisStatus: project.analysisStatus,
// //       duplication: project.duplicationAnalysis,
// //       codeQuality: project.codeQualityAnalysis,
// //       summary: {
// //         totalFiles: project.duplicationAnalysis?.results?.stats?.totalFiles,
// //         exactClones: project.duplicationAnalysis?.results?.stats?.exactCloneGroups,
// //         nearClones: project.duplicationAnalysis?.results?.stats?.nearCloneGroups,
// //         apiRouteIssues: project.codeQualityAnalysis?.results?.apiRouteIssues?.length || 0,
// //         mongooseQueryIssues: project.codeQualityAnalysis?.results?.mongooseQueryIssues?.length || 0,
// //         redundantQueryIssues: project.codeQualityAnalysis?.results?.redundantQueryIssues?.length || 0
// //       }
// //     });

// //   } catch (error) {
// //     console.error('Error fetching combined analysis:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Failed to fetch analysis results'
// //     });
// //   }
// // });

// // // GET /api/projects/:id/quality - Get CODE QUALITY analysis only
// // router.get('/:id/quality', auth, async (req, res) => {
// //   try {
// //     const project = await Project.findOne({
// //       _id: req.params.id,
// //       user: req.user.userId
// //     });

// //     if (!project || !project.codeQualityAnalysis) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Code quality analysis not found'
// //       });
// //     }

// //     res.json({
// //       success: true,
// //       status: project.codeQualityAnalysis.status,
// //       projectName: project.projectName,
// //       quality: project.codeQualityAnalysis.results,
// //       stats: project.codeQualityAnalysis.results?.stats
// //     });

// //   } catch (error) {
// //     console.error('Error fetching quality analysis:', error);
// //     res.status(500).json({
// //       success: false,
// //       message: 'Failed to fetch quality analysis'
// //     });
// //   }
// // });

// // // GET /api/projects/:id/quality/routes - Get API ROUTE issues only
// // router.get('/:id/quality/routes', auth, async (req, res) => {
// //   try {
// //     const project = await Project.findOne({
// //       _id: req.params.id,
// //       user: req.user.userId
// //     });

// //     if (!project || !project.codeQualityAnalysis?.results) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Analysis not found'
// //       });
// //     }

// //     res.json({
// //       success: true,
// //       routeIssues: project.codeQualityAnalysis.results.apiRouteIssues || [],
// //       stats: {
// //         total: project.codeQualityAnalysis.results.apiRouteIssues?.length || 0,
// //         routes: project.codeQualityAnalysis.results.stats.routeCount
// //       }
// //     });

// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // });

// // // GET /api/projects/:id/quality/queries - Get MONGOOSE QUERY issues only
// // router.get('/:id/quality/queries', auth, async (req, res) => {
// //   try {
// //     const project = await Project.findOne({
// //       _id: req.params.id,
// //       user: req.user.userId
// //     });

// //     if (!project || !project.codeQualityAnalysis?.results) {
// //       return res.status(404).json({
// //         success: false,
// //         message: 'Analysis not found'
// //       });
// //     }

// //     res.json({
// //       success: true,
// //       queryIssues: project.codeQualityAnalysis.results.mongooseQueryIssues || [],
// //       redundantIssues: project.codeQualityAnalysis.results.redundantQueryIssues || [],
// //       stats: {
// //         mongooseIssues: project.codeQualityAnalysis.results.mongooseQueryIssues?.length || 0,
// //         redundantIssues: project.codeQualityAnalysis.results.redundantQueryIssues?.length || 0
// //       }
// //     });

// //   } catch (error) {
// //     res.status(500).json({ success: false, message: error.message });
// //   }
// // });


// // GET /api/projects/:id/analysis - Get COMBINED analysis results
// router.get('/:id/analysis', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     // Transform API route issues to match frontend expectations
//     const apiRouteIssues = (project.codeQualityAnalysis?.results?.apiRouteIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       route: issue.routePath,
//       method: issue.routeMethod,
//       line: issue.startLine,
//       message: issue.message,
//       suggestion: issue.recommendation
//     }));

//     // Transform Mongoose query issues
//     const mongooseQueryIssues = (project.codeQualityAnalysis?.results?.mongooseQueryIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       line: issue.startLine,
//       message: issue.message,
//       suggestion: issue.recommendation,
//       queryMethod: issue.queryMethod,
//       chain: issue.chain
//     }));

//     // Transform redundant query issues
//     const redundantQueryIssues = (project.codeQualityAnalysis?.results?.redundantQueryIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       line: issue.lines?.[0] || 0,
//       message: issue.message,
//       suggestion: issue.recommendation,
//       functionName: issue.functionName,
//       queryPattern: issue.queryPattern,
//       occurrences: issue.occurrences
//     }));

//     res.json({
//       success: true,
//       projectName: project.projectName,
//       projectType: project.projectType,
//       analysisStatus: project.analysisStatus,
//       duplication: {
//         status: project.duplicationAnalysis?.status,
//         startedAt: project.duplicationAnalysis?.startedAt,
//         completedAt: project.duplicationAnalysis?.completedAt,
//         results: project.duplicationAnalysis?.results
//       },
//       codeQuality: {
//         status: project.codeQualityAnalysis?.status,
//         startedAt: project.codeQualityAnalysis?.startedAt,
//         completedAt: project.codeQualityAnalysis?.completedAt,
//         results: {
//           apiRouteIssues,
//           mongooseQueryIssues,
//           redundantQueryIssues,
//           stats: project.codeQualityAnalysis?.results?.stats
//         }
//       },
//       summary: {
//         totalFiles: project.duplicationAnalysis?.results?.stats?.totalFiles || 0,
//         exactClones: project.duplicationAnalysis?.results?.stats?.exactCloneGroups || 0,
//         nearClones: project.duplicationAnalysis?.results?.stats?.nearCloneGroups || 0,
//         apiRouteIssues: apiRouteIssues.length,
//         mongooseQueryIssues: mongooseQueryIssues.length,
//         redundantQueryIssues: redundantQueryIssues.length
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching combined analysis:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch analysis results'
//     });
//   }
// });

// // GET /api/projects/:id/quality - Get CODE QUALITY analysis only
// router.get('/:id/quality', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project || !project.codeQualityAnalysis) {
//       return res.status(404).json({
//         success: false,
//         message: 'Code quality analysis not found'
//       });
//     }

//     // Transform issues to match frontend expectations
//     const apiRouteIssues = (project.codeQualityAnalysis.results?.apiRouteIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       route: issue.routePath,
//       method: issue.routeMethod,
//       line: issue.startLine,
//       message: issue.message,
//       suggestion: issue.recommendation
//     }));

//     const mongooseQueryIssues = (project.codeQualityAnalysis.results?.mongooseQueryIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       line: issue.startLine,
//       message: issue.message,
//       suggestion: issue.recommendation
//     }));

//     const redundantQueryIssues = (project.codeQualityAnalysis.results?.redundantQueryIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       line: issue.lines?.[0] || 0,
//       message: issue.message,
//       suggestion: issue.recommendation
//     }));

//     res.json({
//       success: true,
//       status: project.codeQualityAnalysis.status,
//       projectName: project.projectName,
//       quality: {
//         apiRouteIssues,
//         mongooseQueryIssues,
//         redundantQueryIssues
//       },
//       stats: project.codeQualityAnalysis.results?.stats
//     });

//   } catch (error) {
//     console.error('Error fetching quality analysis:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch quality analysis'
//     });
//   }
// });

// // GET /api/projects/:id/quality/routes - Get API ROUTE issues only
// router.get('/:id/quality/routes', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project || !project.codeQualityAnalysis?.results) {
//       return res.status(404).json({
//         success: false,
//         message: 'Analysis not found'
//       });
//     }

//     const routeIssues = (project.codeQualityAnalysis.results.apiRouteIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       route: issue.routePath,
//       method: issue.routeMethod,
//       line: issue.startLine,
//       message: issue.message,
//       suggestion: issue.recommendation
//     }));

//     res.json({
//       success: true,
//       routeIssues,
//       stats: {
//         total: routeIssues.length,
//         routes: project.codeQualityAnalysis.results.stats?.routeCount || 0
//       }
//     });

//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // GET /api/projects/:id/quality/queries - Get MONGOOSE QUERY issues only
// router.get('/:id/quality/queries', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project || !project.codeQualityAnalysis?.results) {
//       return res.status(404).json({
//         success: false,
//         message: 'Analysis not found'
//       });
//     }

//     const queryIssues = (project.codeQualityAnalysis.results.mongooseQueryIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       line: issue.startLine,
//       message: issue.message,
//       suggestion: issue.recommendation
//     }));

//     const redundantIssues = (project.codeQualityAnalysis.results.redundantQueryIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       line: issue.lines?.[0] || 0,
//       message: issue.message,
//       suggestion: issue.recommendation
//     }));

//     res.json({
//       success: true,
//       queryIssues,
//       redundantIssues,
//       stats: {
//         mongooseIssues: queryIssues.length,
//         redundantIssues: redundantIssues.length
//       }
//     });

//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });

// // GET /api/projects/:id/file-content - Get file content for code viewer
// router.get('/:id/file-content', auth, async (req, res) => {
//   try {
//     const { filePath, startLine, endLine } = req.query;
    
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     if (!project.extractedPath) {
//       return res.status(400).json({
//         success: false,
//         message: 'Project path not available'
//       });
//     }

//     const fs = require('fs').promises;
//     const path = require('path');
    
//     // Construct full file path
//     const fullPath = path.join(project.extractedPath, filePath);
    
//     // Security check - ensure file is within project directory
//     const resolvedPath = path.resolve(fullPath);
//     const resolvedProjectPath = path.resolve(project.extractedPath);
    
//     if (!resolvedPath.startsWith(resolvedProjectPath)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     // Read file content
//     const fileContent = await fs.readFile(fullPath, 'utf-8');
//     const lines = fileContent.split('\n');
    
//     // Extract requested lines (1-indexed to 0-indexed)
//     const start = parseInt(startLine) - 1;
//     const end = parseInt(endLine);
//     const extractedLines = lines.slice(start, end);
    
//     res.json({
//       success: true,
//       content: extractedLines.join('\n'),
//       startLine: parseInt(startLine),
//       endLine: parseInt(endLine),
//       totalLines: lines.length
//     });

//   } catch (error) {
//     console.error('Error fetching file content:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch file content'
//     });
//   }
// });


// // GET /api/projects - Get user's projects
// router.get('/', auth, async (req, res) => {
//   try {
//     const projects = await Project.find({ user: req.user.userId })
//       .sort({ createdAt: -1 })
//       .select('-zipFilePath -extractedPath -validationResult -cleanupResult');

//     res.json({
//       success: true,
//       projects
//     });
//   } catch (error) {
//     console.error('Error fetching projects:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch projects'
//     });
//   }
// });

// // GET /api/projects/:id - Get specific project
// router.get('/:id', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     res.json({
//       success: true,
//       project
//     });
//   } catch (error) {
//     console.error('Error fetching project:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch project'
//     });
//   }
// });

// // GET /api/projects/:id/test-data - Debug endpoint to see complete raw data
// router.get('/:id/test-data', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     // Return everything for debugging
//     res.json({
//       success: true,
//       debug: {
//         projectId: project._id,
//         projectName: project.projectName,
//         analysisStatus: project.analysisStatus,
//         hasDuplicationAnalysis: !!project.duplicationAnalysis,
//         duplicationStatus: project.duplicationAnalysis?.status,
//         hasResults: !!project.duplicationAnalysis?.results,
//         exactCloneCount: project.duplicationAnalysis?.results?.exactClones?.length || 0,
//         nearCloneCount: project.duplicationAnalysis?.results?.nearClones?.length || 0,
//         stats: project.duplicationAnalysis?.results?.stats,
//       },
//       fullDuplicationAnalysis: project.duplicationAnalysis,
//       rawProject: project.toObject()
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// });

// // GET /api/projects/:id/duplication - Get code duplication analysis results
// router.get('/:id/duplication', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     if (!project.duplicationAnalysis) {
//       return res.status(400).json({
//         success: false,
//         message: 'Duplication analysis not available for this project'
//       });
//     }

//     res.json({
//       success: true,
//       status: project.duplicationAnalysis.status,
//       analysis: project.duplicationAnalysis,
//       projectName: project.projectName,
//       projectType: project.projectType
//     });

//   } catch (error) {
//     console.error('Error fetching duplication results:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch duplication results'
//     });
//   }
// });

// // GET /api/projects/:id/duplication/exact - Get only exact clones
// router.get('/:id/duplication/exact', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project || !project.duplicationAnalysis?.results) {
//       return res.status(404).json({
//         success: false,
//         message: 'Duplication analysis not found'
//       });
//     }

//     res.json({
//       success: true,
//       exactClones: project.duplicationAnalysis.results.exactClones || [],
//       stats: {
//         totalGroups: project.duplicationAnalysis.results.stats.exactCloneGroups,
//         totalDuplicates: project.duplicationAnalysis.results.stats.duplicatedUnits
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching exact clones:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch exact clones'
//     });
//   }
// });

// // GET /api/projects/:id/duplication/near - Get only near clones
// router.get('/:id/duplication/near', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project || !project.duplicationAnalysis?.results) {
//       return res.status(404).json({
//         success: false,
//         message: 'Duplication analysis not found'
//       });
//     }

//     res.json({
//       success: true,
//       nearClones: project.duplicationAnalysis.results.nearClones || [],
//       stats: {
//         totalGroups: project.duplicationAnalysis.results.stats.nearCloneGroups
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching near clones:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch near clones'
//     });
//   }
// });

// // GET /api/projects/:id/file-content - Get file content for viewing duplicates
// router.get('/:id/file-content', auth, async (req, res) => {
//   try {
//     const { filePath, startLine, endLine } = req.query;

//     if (!filePath) {
//       return res.status(400).json({
//         success: false,
//         message: 'File path is required'
//       });
//     }

//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     const fullPath = path.join(project.extractedPath, filePath);
    
//     // Security check: ensure the file is within the project directory
//     const normalizedPath = path.normalize(fullPath);
//     if (!normalizedPath.startsWith(project.extractedPath)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     const content = await fs.readFile(fullPath, 'utf8');
//     const lines = content.split('\n');

//     let resultContent = content;
//     let resultLines = lines;

//     // If line range is specified, extract only those lines
//     if (startLine && endLine) {
//       const start = parseInt(startLine) - 1;
//       const end = parseInt(endLine);
//       resultLines = lines.slice(start, end);
//       resultContent = resultLines.join('\n');
//     }

//     res.json({
//       success: true,
//       filePath,
//       content: resultContent,
//       totalLines: lines.length,
//       extractedLines: resultLines.length
//     });

//   } catch (error) {
//     console.error('Error fetching file content:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch file content'
//     });
//   }
// });

// // DELETE /api/projects/:id - Delete project
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     if (project.source === 'zip' && project.zipFilePath) {
//       try {
//         await fs.unlink(project.zipFilePath);
//       } catch (unlinkError) {
//         console.error('Error deleting ZIP file:', unlinkError);
//       }
//     }

//     if (project.extractedPath) {
//       try {
//         await fs.rm(project.extractedPath, { recursive: true, force: true });
//       } catch (unlinkError) {
//         console.error('Error deleting extracted directory:', unlinkError);
//       }
//     }

//     await Project.findByIdAndDelete(req.params.id);

//     res.json({
//       success: true,
//       message: 'Project deleted successfully'
//     });
//   } catch (error) {
//     console.error('Error deleting project:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete project'
//     });
//   }
// });

// const exportedFunctions = {
//   ensureExtractedDir,
//   validateMernProject,
//   cleanupProject,
//   removeNodeModulesRecursively,
//   validateMernProjectEnhanced,
//   checkForNonMernFrameworks,
//   directoryExists,
//   fileExists,
//   readPackageJson,
//   analyzeDuplication
// };

// module.exports = router;
// module.exports.functions = exportedFunctions;



// routes/projects.js 
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const AdmZip = require('adm-zip');
const Project = require('../models/repository');
const auth = require('../middleware/auth');
const router = express.Router();
const MainAnalyzer = require('../services/smells/hooks');
const { analyzePropDrilling: analyzePropDrillingService } = require('../services/smells/propDrilling/propDrillingController');
// Import analysis services
const { analyzeDuplication } = require('../services/smells/duplication');
const {
  analyzeCodeQuality,
  analyzeApiRoutes,
  analyzeMongooseQueries,
  analyzeRedundantQueries
} = require('../services/smells/codeQualityAnalysis');
const User = require('../models/User');

// ==================== DIRECTORY SETUP ====================

const ensureUploadDir = async () => {
  const uploadDir = path.join(__dirname, '../uploads/projects/manual_uploads');
  try {
    await fs.access(uploadDir);
  } catch (error) {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const ensureExtractedDir = async () => {
  const extractedDir = path.join(__dirname, '../uploads/projects/extracted-projects');
  try {
    await fs.access(extractedDir);
  } catch (error) {
    await fs.mkdir(extractedDir, { recursive: true });
  }
  return extractedDir;
};

// ==================== MULTER CONFIGURATION ====================

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = await ensureUploadDir();
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `project-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/zip' || 
      file.mimetype === 'application/x-zip-compressed' ||
      file.originalname.toLowerCase().endsWith('.zip')) {
    cb(null, true);
  } else {
    cb(new Error('Only ZIP files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// ==================== VALIDATION FUNCTIONS ====================

const directoryExists = async (dirPath) => {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const readPackageJson = async (packagePath) => {
  try {
    const content = await fs.readFile(packagePath, 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
};

const removeNodeModulesRecursively = async (startPath) => {
  const removedPaths = [];
  const errors = [];

  const searchAndRemove = async (currentPath) => {
    try {
      const items = await fs.readdir(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        
        if (item === 'node_modules') {
          try {
            console.log(`Removing node_modules at: ${itemPath}`);
            await fs.rm(itemPath, { recursive: true, force: true });
            removedPaths.push(path.relative(startPath, itemPath));
          } catch (error) {
            console.error(`Failed to remove node_modules at ${itemPath}:`, error);
            errors.push(`Failed to remove ${path.relative(startPath, itemPath)}: ${error.message}`);
          }
        } else if (await directoryExists(itemPath) && 
                   !item.startsWith('.') && 
                   !['dist', 'build', 'coverage'].includes(item)) {
          await searchAndRemove(itemPath);
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${currentPath}:`, error);
      errors.push(`Error reading directory ${path.relative(startPath, currentPath)}: ${error.message}`);
    }
  };

  await searchAndRemove(startPath);
  
  return { removedPaths, errors };
};

const validateMernProjectEnhanced = async (extractedPath) => {
  const validation = {
    isValid: false,
    type: 'unknown',
    errors: [],
    warnings: [],
    structure: {},
    packageJsonLocations: [],
    hasSrcDirectory: false,
    fileTypeAnalysis: {}
  };

  try {
    console.log(`Starting enhanced validation for: ${extractedPath}`);

    const analyzeFileTypes = async (dirPath, maxDepth = 3) => {
      const fileTypes = {
        javascript: 0,
        python: 0,
        java: 0,
        php: 0,
        csharp: 0,
        other: 0,
        pythonFiles: [],
        javaFiles: [],
        phpFiles: [],
        csharpFiles: []
      };

      const analyzeRecursive = async (currentPath, depth = 0) => {
        if (depth > maxDepth) return;

        try {
          const items = await fs.readdir(currentPath);

          for (const item of items) {
            if (item.startsWith('.') || item === 'node_modules') continue;

            const itemPath = path.join(currentPath, item);
            const stats = await fs.stat(itemPath);

            if (stats.isFile()) {
              const ext = path.extname(item).toLowerCase();
              const relativePath = path.relative(dirPath, itemPath);

              switch (ext) {
                case '.js':
                case '.jsx':
                case '.ts':
                case '.tsx':
                case '.mjs':
                  fileTypes.javascript++;
                  break;
                case '.py':
                case '.pyw':
                case '.pyx':
                  fileTypes.python++;
                  fileTypes.pythonFiles.push(relativePath);
                  break;
                case '.java':
                case '.class':
                  fileTypes.java++;
                  fileTypes.javaFiles.push(relativePath);
                  break;
                case '.php':
                case '.phtml':
                  fileTypes.php++;
                  fileTypes.phpFiles.push(relativePath);
                  break;
                case '.cs':
                case '.vb':
                  fileTypes.csharp++;
                  fileTypes.csharpFiles.push(relativePath);
                  break;
                default:
                  if (ext) {
                    fileTypes.other++;
                  }
                  break;
              }
            } else if (stats.isDirectory()) {
              await analyzeRecursive(itemPath, depth + 1);
            }
          }
        } catch (error) {
          console.warn(`Error analyzing files in ${currentPath}:`, error.message);
        }
      };

      await analyzeRecursive(dirPath);
      return fileTypes;
    };

    const findPackageJsonFiles = async (startPath, maxDepth = 3) => {
      const packageJsonFiles = [];
      
      const searchRecursive = async (currentPath, depth = 0) => {
        if (depth > maxDepth) return;
        
        try {
          const items = await fs.readdir(currentPath);
          
          for (const item of items) {
            if (item.startsWith('.') || item === 'node_modules') continue;
            
            const itemPath = path.join(currentPath, item);
            
            if (item === 'package.json') {
              const relativePath = path.relative(startPath, itemPath);
              packageJsonFiles.push({
                path: itemPath,
                relativePath,
                directory: path.dirname(itemPath)
              });
            } else if (await directoryExists(itemPath)) {
              await searchRecursive(itemPath, depth + 1);
            }
          }
        } catch (error) {
          console.warn(`Error reading directory ${currentPath}:`, error.message);
        }
      };
      
      await searchRecursive(startPath);
      return packageJsonFiles;
    };

    const checkForSrcDirectory = async (startPath, maxDepth = 3) => {
      const searchForSrc = async (currentPath, depth = 0) => {
        if (depth > maxDepth) return false;
        
        try {
          const items = await fs.readdir(currentPath);
          
          if (items.includes('src') && await directoryExists(path.join(currentPath, 'src'))) {
            return true;
          }
          
          for (const item of items) {
            if (item.startsWith('.') || item === 'node_modules') continue;
            
            const itemPath = path.join(currentPath, item);
            if (await directoryExists(itemPath)) {
              const found = await searchForSrc(itemPath, depth + 1);
              if (found) return true;
            }
          }
        } catch (error) {
          console.warn(`Error searching for src in ${currentPath}:`, error.message);
        }
        
        return false;
      };
      
      return await searchForSrc(startPath);
    };

    const fileTypeAnalysis = await analyzeFileTypes(extractedPath);
    validation.fileTypeAnalysis = fileTypeAnalysis;

    if (fileTypeAnalysis.python > 0) {
      validation.errors.push(`Python files detected (${fileTypeAnalysis.pythonFiles.join(', ')}). This appears to be a Python project, not a MERN stack project.`);
    }
    
    if (fileTypeAnalysis.java > 0) {
      validation.errors.push(`Java files detected (${fileTypeAnalysis.javaFiles.join(', ')}). This appears to be a Java project, not a MERN stack project.`);
    }
    
    if (fileTypeAnalysis.php > 0) {
      validation.errors.push(`PHP files detected (${fileTypeAnalysis.phpFiles.join(', ')}). This appears to be a PHP project, not a MERN stack project.`);
    }
    
    if (fileTypeAnalysis.csharp > 0) {
      validation.errors.push(`C#/.NET files detected (${fileTypeAnalysis.csharpFiles.join(', ')}). This appears to be a .NET project, not a MERN stack project.`);
    }

    const nonJsFiles = fileTypeAnalysis.python + fileTypeAnalysis.java + fileTypeAnalysis.php + fileTypeAnalysis.csharp;
    if (nonJsFiles > fileTypeAnalysis.javascript && nonJsFiles > 0) {
      validation.errors.push(`Project contains more non-JavaScript files (${nonJsFiles}) than JavaScript files (${fileTypeAnalysis.javascript}). This does not appear to be a JavaScript/Node.js project.`);
    }

    if (validation.errors.length > 0) {
      return validation;
    }

    const packageJsonFiles = await findPackageJsonFiles(extractedPath);
    validation.packageJsonLocations = packageJsonFiles.map(f => f.relativePath);

    validation.hasSrcDirectory = await checkForSrcDirectory(extractedPath);

    console.log(`Found package.json files at: ${validation.packageJsonLocations.join(', ')}`);
    console.log(`Has src directory: ${validation.hasSrcDirectory}`);

    if (packageJsonFiles.length === 0) {
      validation.errors.push('No package.json found in project directory or subdirectories - this is required for a valid Node.js/React project');
      return validation;
    }

    if (!validation.hasSrcDirectory) {
      validation.errors.push('No src directory found - this is required for a valid project structure');
      return validation;
    }

    if (fileTypeAnalysis.javascript === 0) {
      validation.errors.push('No JavaScript/TypeScript files found - this is required for a Node.js/React project');
      return validation;
    }

    let hasReact = false;
    let hasExpress = false;
    let hasMongodb = false;
    let hasNode = false;

    for (const pkgFile of packageJsonFiles) {
      const packageJson = await readPackageJson(pkgFile.path);
      if (!packageJson) continue;

      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      if (allDeps.react || allDeps['react-dom']) hasReact = true;
      if (allDeps.express) hasExpress = true;
      if (allDeps.mongoose || allDeps.mongodb) hasMongodb = true;
      if (packageJson.engines?.node || allDeps.nodemon) hasNode = true;
    }

    if (hasReact && hasExpress && (hasMongodb || hasNode)) {
      validation.type = 'fullstack-mern';
      validation.isValid = true;
    } else if (hasReact && hasExpress && packageJsonFiles.length >= 2) {
      validation.type = 'fullstack-mern';
      validation.isValid = true;
      validation.warnings.push('Full-stack project detected but MongoDB dependency not found');
    } else if (hasReact && !hasExpress && packageJsonFiles.length === 1) {
      validation.type = 'frontend-react';
      validation.isValid = true;
      validation.warnings.push('Frontend-only React project detected');
    } else if (hasExpress && !hasReact && packageJsonFiles.length === 1) {
      validation.type = 'backend-node';
      validation.isValid = true;
      validation.warnings.push('Backend-only Node.js project detected');
    } else if ((hasExpress || hasReact || hasMongodb) && packageJsonFiles.length >= 1) {
      validation.type = 'partial-mern';
      validation.isValid = true;
      validation.warnings.push('Partial MERN stack detected - some components may be missing');
    } else {
      validation.errors.push('Not a recognizable MERN stack project - missing required dependencies (React, Express, or Node.js indicators)');
    }

    return validation;

  } catch (error) {
    console.error('Validation error:', error);
    validation.errors.push(`Validation error: ${error.message}`);
    return validation;
  }
};

const checkForNonMernFrameworks = async (extractedPath, validation) => {
  try {
    const items = await fs.readdir(extractedPath);
    
    if (items.includes('manage.py')) {
      validation.errors.push('Django project detected (manage.py found). This is a Python/Django project, not MERN stack.');
    }
    
    if (items.includes('pom.xml') || items.includes('build.gradle')) {
      validation.errors.push('Java Spring Boot project detected. This is a Java project, not MERN stack.');
    }
    
    if (items.includes('artisan') || items.includes('composer.json')) {
      validation.errors.push('PHP Laravel project detected. This is a PHP project, not MERN stack.');
    }
    
    if (items.some(item => item.endsWith('.csproj') || item.endsWith('.sln'))) {
      validation.errors.push('.NET project detected. This is a C#/.NET project, not MERN stack.');
    }

    if (items.includes('requirements.txt') || items.includes('Pipfile')) {
      validation.errors.push('Python dependency files detected. This appears to be a Python project, not MERN stack.');
    }
  } catch (error) {
    console.warn('Error checking for non-MERN frameworks:', error.message);
  }
};

const validateMernProject = async (extractedPath) => {
  const validation = await validateMernProjectEnhanced(extractedPath);
  await checkForNonMernFrameworks(extractedPath, validation);
  return validation;
};

const cleanupProject = async (extractedPath) => {
  const cleanupResults = {
    removed: [],
    errors: [],
    nodeModulesRemoved: []
  };

  try {
    console.log('Starting project cleanup...');
    
    const nodeModulesResult = await removeNodeModulesRecursively(extractedPath);
    cleanupResults.nodeModulesRemoved = nodeModulesResult.removedPaths;
    cleanupResults.errors.push(...nodeModulesResult.errors);
    
    console.log(`Removed ${nodeModulesResult.removedPaths.length} node_modules directories`);

    const itemsToRemove = [
      '.git', '.DS_Store', 'Thumbs.db',
      'dist', 'build', '.cache', '.parcel-cache', 
      '.next', '.nuxt', 'coverage', '.nyc_output'
    ];

    for (const item of itemsToRemove) {
      try {
        const itemPath = path.join(extractedPath, item);
        
        try {
          const stats = await fs.stat(itemPath);
          
          if (stats.isDirectory()) {
            await fs.rm(itemPath, { recursive: true, force: true });
            cleanupResults.removed.push(`Directory: ${item}`);
          } else {
            await fs.unlink(itemPath);
            cleanupResults.removed.push(`File: ${item}`);
          }
        } catch (error) {
          if (error.code !== 'ENOENT') {
            cleanupResults.errors.push(`Failed to remove ${item}: ${error.message}`);
          }
        }
      } catch (error) {
        cleanupResults.errors.push(`Error processing ${item}: ${error.message}`);
      }
    }

    console.log(`Cleanup completed: ${cleanupResults.removed.length} items removed`);
    
  } catch (error) {
    console.error('Cleanup error:', error);
    cleanupResults.errors.push(`Cleanup error: ${error.message}`);
  }

  return cleanupResults;
};

const extractZipFile = async (zipPath, extractionPath) => {
  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();
    
    if (entries.length === 0) {
      throw new Error('ZIP file is empty');
    }
    
    await fs.mkdir(extractionPath, { recursive: true });
    zip.extractAllTo(extractionPath, true);
    
    const macOSXPath = path.join(extractionPath, '__MACOSX');
    if (await directoryExists(macOSXPath)) {
      await fs.rm(macOSXPath, { recursive: true, force: true });
    }
    
    const extractedItems = await fs.readdir(extractionPath);
    const validItems = extractedItems.filter(item => 
      !item.startsWith('.') && 
      !item.includes('__MACOSX') &&
      !item.includes('_temp_')
    );
    
    if (validItems.length === 0) {
      throw new Error('No valid files found after extraction');
    }
    
    console.log(`Successfully extracted ${validItems.length} items`);
    
    return {
      success: true,
      extractedPath: extractionPath,
      itemCount: validItems.length
    };
  } catch (error) {
    console.error('ZIP extraction error:', error);
    throw new Error(`Failed to extract ZIP: ${error.message}`);
  }
};

const handleMulterError = (error, res) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${error.message}`
    });
  }
  
  if (error.message === 'Only ZIP files are allowed') {
    return res.status(400).json({
      success: false,
      message: 'Only ZIP files are allowed'
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || 'Upload failed'
  });
};

// ==================== COMBINED ANALYSIS ====================

// const performAllAnalyses = async (extractedPath) => {
//   console.log('\n' + '='.repeat(80));
//   console.log('🔍 STARTING COMBINED CODE ANALYSIS');
//   console.log('='.repeat(80) + '\n');

//   try {
//     // Run both analyses in parallel
//     const [duplicationResults, qualityResults] = await Promise.all([
//       analyzeDuplication(extractedPath),
//       analyzeCodeQuality(extractedPath)
//     ]);

//     const combinedResults = {
//       timestamp: new Date(),
//       analyses: {
//         duplication: duplicationResults,
//         codeQuality: qualityResults
//       },
//       summary: {
//         totalFiles: duplicationResults.stats.totalFiles,
//         totalUnits: duplicationResults.stats.totalUnits,
//         exactClones: duplicationResults.stats.exactCloneGroups,
//         nearClones: duplicationResults.stats.nearCloneGroups,
//         routeIssues: qualityResults.stats.totalIssuesFound,
//         criticalIssues: qualityResults.stats.criticalIssues,
//         highIssues: qualityResults.stats.highIssues,
//         mediumIssues: qualityResults.stats.mediumIssues,
//         lowIssues: qualityResults.stats.lowIssues
//       }
//     };

//     return combinedResults;
//   } catch (error) {
//     console.error('Error in combined analysis:', error);
//     throw error;
//   }
// };

// const performAllAnalyses = async (extractedPath) => {
//   console.log('\n' + '='.repeat(80));
//   console.log('🔍 STARTING COMBINED CODE ANALYSIS (3 ANALYSES)');
//   console.log('='.repeat(80) + '\n');

//   try {
//     // Run all THREE analyses in parallel
//     const [duplicationResults, qualityResults, hooksResults] = await Promise.all([
//       analyzeDuplication(extractedPath),
//       analyzeCodeQuality(extractedPath),
//       (async () => {
//         try {
//           const analyzer = new MainAnalyzer(extractedPath);
//           const result = await analyzer.analyze();
//           return result;
//         } catch (error) {
//           console.error('Hooks analysis error:', error);
//           return {
//             summary: { totalViolations: 0 },
//             violations: [],
//             analyzers: {},
//             metadata: { error: error.message }
//           };
//         }
//       })()
//     ]);

//     const combinedResults = {
//       timestamp: new Date(),
//       analyses: {
//         duplication: duplicationResults,
//         codeQuality: qualityResults,
//         hooks: hooksResults // NEW
//       },
//       summary: {
//         // Duplication stats
//         totalFiles: duplicationResults.stats.totalFiles,
//         totalUnits: duplicationResults.stats.totalUnits,
//         exactClones: duplicationResults.stats.exactCloneGroups,
//         nearClones: duplicationResults.stats.nearCloneGroups,
        
//         // Quality stats
//         routeIssues: qualityResults.stats.totalIssuesFound,
//         criticalIssues: qualityResults.stats.criticalIssues,
//         highIssues: qualityResults.stats.highIssues,
//         mediumIssues: qualityResults.stats.mediumIssues,
//         lowIssues: qualityResults.stats.lowIssues,
        
//         // Hooks stats (NEW)
//         hooksViolations: hooksResults.summary?.totalViolations || 0,
//         criticalHooks: hooksResults.violations?.filter(v => v.severity === 'critical').length || 0,
//         highHooks: hooksResults.violations?.filter(v => v.severity === 'high').length || 0,
//         mediumHooks: hooksResults.violations?.filter(v => v.severity === 'medium').length || 0,
//         lowHooks: hooksResults.violations?.filter(v => v.severity === 'low').length || 0
//       }
//     };

//     return combinedResults;
//   } catch (error) {
//     console.error('Error in combined analysis:', error);
//     throw error;
//   }
// };


//real
// const performAllAnalyses = async (extractedPath) => {
//   console.log('\n' + '='.repeat(80));
//   console.log(' STARTING COMBINED CODE ANALYSIS (4 ANALYSES)');
//   console.log('='.repeat(80) + '\n');

//   try {
//     // Run all FOUR analyses in parallel
//     const [duplicationResults, qualityResults, hooksResults, propDrillingResults] = await Promise.all([
//       analyzeDuplication(extractedPath),
//       analyzeCodeQuality(extractedPath),
//       (async () => {
//         try {
//           const analyzer = new MainAnalyzer(extractedPath);
//           const result = await analyzer.analyze();
//           return result;
//         } catch (error) {
//           console.error('Hooks analysis error:', error);
//           return {
//             summary: { totalViolations: 0 },
//             violations: [],
//             analyzers: {},
//             metadata: { error: error.message }
//           };
//         }
//       })(),
//       // NEW: Prop Drilling Analysis
//       (async () => {
//         try {
//           const result = await analyzePropDrillingService(extractedPath);
//           return result;
//         } catch (error) {
//           console.error('Prop drilling analysis error:', error);
//           return {
//             summary: { totalIssues: 0, highSeverity: 0, mediumSeverity: 0, lowSeverity: 0 },
//             propDrillingIssues: [],
//             stats: { totalFiles: 0, totalComponents: 0 },
//             error: error.message
//           };
//         }
//       })()
//     ]);

//     const combinedResults = {
//       timestamp: new Date(),
//       analyses: {
//         duplication: duplicationResults,
//         codeQuality: qualityResults,
//         hooks: hooksResults,
//         propDrilling: propDrillingResults // NEW
//       },
//       summary: {
//         // Duplication stats
//         totalFiles: duplicationResults.stats.totalFiles,
//         totalUnits: duplicationResults.stats.totalUnits,
//         exactClones: duplicationResults.stats.exactCloneGroups,
//         nearClones: duplicationResults.stats.nearCloneGroups,
        
//         // Quality stats
//         routeIssues: qualityResults.stats.totalIssuesFound,
//         criticalIssues: qualityResults.stats.criticalIssues,
//         highIssues: qualityResults.stats.highIssues,
//         mediumIssues: qualityResults.stats.mediumIssues,
//         lowIssues: qualityResults.stats.lowIssues,
        
//         // Hooks stats
//         hooksViolations: hooksResults.summary?.totalViolations || 0,
//         criticalHooks: hooksResults.violations?.filter(v => v.severity === 'critical').length || 0,
//         highHooks: hooksResults.violations?.filter(v => v.severity === 'high').length || 0,
//         mediumHooks: hooksResults.violations?.filter(v => v.severity === 'medium').length || 0,
//         lowHooks: hooksResults.violations?.filter(v => v.severity === 'low').length || 0,
        
//         // Prop Drilling stats (NEW)
//         propDrillingIssues: propDrillingResults.summary?.totalIssues || 0,
//         highPropDrilling: propDrillingResults.summary?.highSeverity || 0,
//         mediumPropDrilling: propDrillingResults.summary?.mediumSeverity || 0,
//         lowPropDrilling: propDrillingResults.summary?.lowSeverity || 0
//       }
//     };

//     return combinedResults;
//   } catch (error) {
//     console.error('Error in combined analysis:', error);
//     throw error;
//   }
// };

const { generateAISuggestions } = require('../services/aiSuggestionService');

// const performAllAnalyses = async (extractedPath, projectId) => {
//   console.log('\n' + '='.repeat(80));
//   console.log(' STARTING COMBINED CODE ANALYSIS (4 ANALYSES + AI)');
//   console.log('='.repeat(80) + '\n');

//   try {
//     // Run all FOUR analyses in parallel
//     const [duplicationResults, qualityResults, hooksResults, propDrillingResults] = await Promise.all([
//       analyzeDuplication(extractedPath),
//       analyzeCodeQuality(extractedPath),
//       (async () => {
//         try {
//           const analyzer = new MainAnalyzer(extractedPath);
//           const result = await analyzer.analyze();
//           return result;
//         } catch (error) {
//           console.error('Hooks analysis error:', error);
//           return {
//             summary: { totalViolations: 0 },
//             violations: [],
//             analyzers: {},
//             metadata: { error: error.message }
//           };
//         }
//       })(),
//       (async () => {
//         try {
//           const result = await analyzePropDrillingService(extractedPath);
//           return result;
//         } catch (error) {
//           console.error('Prop drilling analysis error:', error);
//           return {
//             summary: { totalIssues: 0, highSeverity: 0, mediumSeverity: 0, lowSeverity: 0 },
//             propDrillingIssues: [],
//             stats: { totalFiles: 0, totalComponents: 0 },
//             error: error.message
//           };
//         }
//       })()
//     ]);

//     const combinedResults = {
//       timestamp: new Date(),
//       analyses: {
//         duplication: duplicationResults,
//         codeQuality: qualityResults,
//         hooks: hooksResults,
//         propDrilling: propDrillingResults
//       },
//       summary: {
//         // Duplication stats
//         totalFiles: duplicationResults.stats.totalFiles,
//         totalUnits: duplicationResults.stats.totalUnits,
//         exactClones: duplicationResults.stats.exactCloneGroups,
//         nearClones: duplicationResults.stats.nearCloneGroups,
        
//         // Quality stats
// routeIssues: qualityResults.stats.totalIssuesFound,
// criticalIssues: qualityResults.stats.criticalIssues,
// highIssues: qualityResults.stats.highIssues,
// mediumIssues: qualityResults.stats.mediumIssues,
// lowIssues: qualityResults.stats.lowIssues,

// // Quality stats — broken down by type (for AI suggestions)
// apiRouteIssues:   qualityResults.results?.apiRouteIssues?.length      || 0,
// mongooseIssues:   qualityResults.results?.mongooseQueryIssues?.length  || 0,
// redundantQueries: qualityResults.results?.redundantQueryIssues?.length || 0,
        
//         // Hooks stats
//         hooksViolations: hooksResults.summary?.totalViolations || 0,
//         criticalHooks: hooksResults.violations?.filter(v => v.severity === 'critical').length || 0,
//         highHooks: hooksResults.violations?.filter(v => v.severity === 'high').length || 0,
//         mediumHooks: hooksResults.violations?.filter(v => v.severity === 'medium').length || 0,
//         lowHooks: hooksResults.violations?.filter(v => v.severity === 'low').length || 0,
        
//         // Prop Drilling stats
//         propDrillingIssues: propDrillingResults.summary?.totalIssues || 0,
//         highPropDrilling: propDrillingResults.summary?.highSeverity || 0,
//         mediumPropDrilling: propDrillingResults.summary?.mediumSeverity || 0,
//         lowPropDrilling: propDrillingResults.summary?.lowSeverity || 0
//       }
//     };

//     // 🚀 NEW: Generate AI Suggestions Automatically
//     console.log('\n🤖 Generating AI suggestions...');
//     try {
//       const aiSuggestions = await generateAISuggestions(combinedResults);
      
//       // Save to database
//       if (projectId) {
//         await Project.findByIdAndUpdate(projectId, {
//           aiSuggestions: {
//             ...aiSuggestions,
//             generatedAt: new Date(),
//             status: 'completed'
//           }
//         });
//         console.log('AI suggestions saved to database');
//       }
      
//       // Add to results for immediate return
//       combinedResults.aiSuggestions = aiSuggestions;
      
//     } catch (aiError) {
//       console.error(' AI generation failed (non-critical):', aiError.message);
//       // Mark as failed but don't break the analysis
//       if (projectId) {
//         await Project.findByIdAndUpdate(projectId, {
//           'aiSuggestions.status': 'failed',
//           'aiSuggestions.error': aiError.message
//         });
//       }
//     }

//     return combinedResults;
//   } catch (error) {
//     console.error('Error in combined analysis:', error);
//     throw error;
//   }
// };


// ==================== ROUTES ====================

// POST /api/projects/upload - Upload ZIP project with COMBINED analysis
// router.post('/upload', auth, (req, res) => {
//   upload.single('project')(req, res, async (err) => {
//     if (err) {
//       return handleMulterError(err, res);
//     }

//     let extractedPath = null;
//     let project = null;

//     try {
//       if (!req.file) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'No file uploaded' 
//         });
//       }

//       const { projectName, description } = req.body;
      
//       const extractionDirName = `project-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//       const extractedDir = await ensureExtractedDir();
//       extractedPath = path.join(extractedDir, extractionDirName);

//       console.log(`Extracting project to: ${extractedPath}`);

//       // Extract ZIP file
//       const extractionResult = await extractZipFile(req.file.path, extractedPath);
      
//       console.log('ZIP extracted successfully, validating MERN structure...');

//       // Validate MERN stack project
//       const validation = await validateMernProject(extractedPath);
      
//       if (!validation.isValid) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//           await fs.unlink(req.file.path);
//         } catch (cleanupError) {
//           console.error('Error cleaning up:', cleanupError);
//         }

//         return res.status(400).json({
//           success: false,
//           message: 'Invalid project structure',
//           errors: validation.errors,
//           warnings: validation.warnings,
//           requirements: [
//             'Project must contain at least one package.json file',
//             'Project must have a src directory',
//             'Project must be a valid Node.js/React/MERN project'
//           ]
//         });
//       }

//       console.log(`Valid ${validation.type} project detected, cleaning up...`);

//       // Clean up unwanted files
//       const cleanupResults = await cleanupProject(extractedPath);

//       console.log('Cleanup completed, creating project record...');

//       // Create project record
//       const sanitizedProjectName = (projectName || req.file.originalname.replace('.zip', ''))
//         .replace(/[^a-zA-Z0-9-_]/g, '-')
//         .toLowerCase();
      
//       const projectKey = `${sanitizedProjectName}-${Date.now()}`;

//       project = new Project({
//         user: req.user.userId,
//         source: 'zip',
//         zipFilePath: req.file.path,
//         extractedPath: extractedPath,
//         projectName: projectName || req.file.originalname.replace('.zip', ''),
//         description: description || '',
//         analysisStatus: 'processing',
//         projectType: validation.type,
//         validationResult: validation,
//         cleanupResult: cleanupResults,
//         duplicationAnalysis: {
//           status: 'pending',
//           startedAt: new Date()
//         },
//         codeQualityAnalysis: {
//           status: 'pending',
//           startedAt: new Date()
//         }
//       });

//       await project.save();
//       console.log('✅ Project saved to database with ID:', project._id);

//       // Send immediate response
//       res.json({
//         success: true,
//         message: 'Project uploaded successfully. Code analysis (duplication & quality) is in progress.',
//         project: {
//           id: project._id,
//           name: project.projectName,
//           source: project.source,
//           type: project.projectType,
//           status: project.analysisStatus,
//           validation: {
//             type: validation.type,
//             warnings: validation.warnings
//           },
//           cleanup: {
//             itemsRemoved: cleanupResults.removed.length,
//             nodeModulesRemoved: cleanupResults.nodeModulesRemoved.length
//           },
//           createdAt: project.createdAt
//         }
//       });

//       // Run COMBINED analysis asynchronously
//       console.log('\n🚀 Starting combined code analysis in background...\n');
//       const projectId = project._id;
      
//       performAllAnalyses(extractedPath)
//         .then(async (combinedResults) => {
//           console.log('\n' + '='.repeat(80));
//           console.log('🎉 ALL ANALYSES COMPLETED SUCCESSFULLY');
//           console.log('='.repeat(80));
          
//           const updatedProject = await Project.findById(projectId);
//           if (!updatedProject) {
//             console.error('❌ Project not found during update');
//             return;
//           }
          
//           // Display summary
//           console.log('\n📊 ANALYSIS SUMMARY:');
//           console.log('─'.repeat(80));
//           console.log(`Files Analyzed:           ${combinedResults.summary.totalFiles}`);
//           console.log(`Code Units:               ${combinedResults.summary.totalUnits}`);
//           console.log(`Exact Clone Groups:       ${combinedResults.summary.exactClones}`);
//           console.log(`Near Clone Groups:        ${combinedResults.summary.nearClones}`);
//           console.log(`\n🚨 CODE QUALITY ISSUES:`);
//           console.log(`Critical Issues:          ${combinedResults.summary.criticalIssues}`);
//           console.log(`High Issues:              ${combinedResults.summary.highIssues}`);
//           console.log(`Medium Issues:            ${combinedResults.summary.mediumIssues}`);
//           console.log(`Low Issues:               ${combinedResults.summary.lowIssues}`);
//           console.log('─'.repeat(80));
          
//           // Update project with results
//           updatedProject.analysisStatus = 'completed';
//           updatedProject.duplicationAnalysis = {
//             status: 'completed',
//             startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             results: combinedResults.analyses.duplication
//           };
//           updatedProject.codeQualityAnalysis = {
//             status: 'completed',
//             startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             results: combinedResults.analyses.codeQuality
//           };
          
//           await updatedProject.save();
          
//           console.log('\n✅ Successfully saved all analyses to database!');
//           console.log(`   Project ID: ${updatedProject._id}`);
//           console.log(`   Project Name: ${updatedProject.projectName}`);
//           console.log('\n📍 VIEW RESULTS AT:');
//           console.log(`   GET /api/projects/${updatedProject._id}/analysis`);
//           console.log(`   GET /api/projects/${updatedProject._id}/duplication`);
//           console.log(`   GET /api/projects/${updatedProject._id}/quality`);
//           console.log('='.repeat(80) + '\n');
//         })
//         .catch(async (error) => {
//           console.log('\n' + '='.repeat(80));
//           console.error('❌ ANALYSIS FAILED');
//           console.log('='.repeat(80));
//           console.error('Error:', error.message);
          
//           const updatedProject = await Project.findById(projectId);
//           if (!updatedProject) {
//             console.error('❌ Project not found during error update');
//             return;
//           }
          
//           updatedProject.analysisStatus = 'failed';
//           updatedProject.duplicationAnalysis = {
//             status: 'failed',
//             startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             error: error.message
//           };
//           updatedProject.codeQualityAnalysis = {
//             status: 'failed',
//             startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             error: error.message
//           };
//           await updatedProject.save();
          
//           console.log('💾 Saved failure status to database');
//           console.log('='.repeat(80) + '\n');
//         });

//     } catch (error) {
//       console.error('Upload and processing error:', error);
      
//       if (extractedPath) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//         } catch (cleanupError) {
//           console.error('Error cleaning up extracted files:', cleanupError);
//         }
//       }

//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (unlinkError) {
//           console.error('Error deleting uploaded file:', unlinkError);
//         }
//       }

//       if (project && project._id) {
//         try {
//           await Project.findByIdAndDelete(project._id);
//         } catch (deleteError) {
//           console.error('Error deleting project record:', deleteError);
//         }
//       }

//       res.status(500).json({
//         success: false,
//         message: error.message || 'Upload and processing failed'
//       });
//     }
//   });
// });

// router.post('/upload', auth, (req, res) => {
//   upload.single('project')(req, res, async (err) => {
//     if (err) {
//       return handleMulterError(err, res);
//     }

//     let extractedPath = null;
//     let project = null;

//     try {
//       if (!req.file) {
//         return res.status(400).json({ 
//           success: false, 
//           message: 'No file uploaded' 
//         });
//       }

//       const { projectName, description } = req.body;
      
//       const extractionDirName = `project-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//       const extractedDir = await ensureExtractedDir();
//       extractedPath = path.join(extractedDir, extractionDirName);

//       console.log(`Extracting project to: ${extractedPath}`);

//       // Extract ZIP file
//       const extractionResult = await extractZipFile(req.file.path, extractedPath);
      
//       console.log('ZIP extracted successfully, validating MERN structure...');

//       // Validate MERN stack project
//       const validation = await validateMernProject(extractedPath);
      
//       if (!validation.isValid) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//           await fs.unlink(req.file.path);
//         } catch (cleanupError) {
//           console.error('Error cleaning up:', cleanupError);
//         }

//         return res.status(400).json({
//           success: false,
//           message: 'Invalid project structure',
//           errors: validation.errors,
//           warnings: validation.warnings,
//           requirements: [
//             'Project must contain at least one package.json file',
//             'Project must have a src directory',
//             'Project must be a valid Node.js/React/MERN project'
//           ]
//         });
//       }

//       console.log(`Valid ${validation.type} project detected, cleaning up...`);

//       // Clean up unwanted files
//       const cleanupResults = await cleanupProject(extractedPath);

//       console.log('Cleanup completed, creating project record...');

//       // Create project record with ALL THREE analyses
//       const sanitizedProjectName = (projectName || req.file.originalname.replace('.zip', ''))
//         .replace(/[^a-zA-Z0-9-_]/g, '-')
//         .toLowerCase();

//       project = new Project({
//         user: req.user.userId,
//         source: 'zip',
//         zipFilePath: req.file.path,
//         extractedPath: extractedPath,
//         projectName: projectName || req.file.originalname.replace('.zip', ''),
//         description: description || '',
//         analysisStatus: 'processing',
//         projectType: validation.type,
//         validationResult: validation,
//         cleanupResult: cleanupResults,
//         duplicationAnalysis: {
//           status: 'pending',
//           startedAt: new Date()
//         },
//         codeQualityAnalysis: {
//           status: 'pending',
//           startedAt: new Date()
//         },
//         hooksAnalysis: {  // NEW
//           status: 'pending',
//           startedAt: new Date()
//         }
//       });

//       await project.save();
//       console.log('✅ Project saved to database with ID:', project._id);

//       // Send immediate response
//       res.json({
//         success: true,
//         message: 'Project uploaded successfully. Code analysis (duplication, quality & hooks) is in progress.',
//         project: {
//           id: project._id,
//           name: project.projectName,
//           source: project.source,
//           type: project.projectType,
//           status: project.analysisStatus,
//           validation: {
//             type: validation.type,
//             warnings: validation.warnings
//           },
//           cleanup: {
//             itemsRemoved: cleanupResults.removed.length,
//             nodeModulesRemoved: cleanupResults.nodeModulesRemoved.length
//           },
//           createdAt: project.createdAt
//         }
//       });

//       // Run COMBINED analysis asynchronously (ALL 3)
//       console.log('\n🚀 Starting combined code analysis (3 analyses) in background...\n');
//       const projectId = project._id;
      
//       performAllAnalyses(extractedPath)
//         .then(async (combinedResults) => {
//           console.log('\n' + '='.repeat(80));
//           console.log('🎉 ALL 3 ANALYSES COMPLETED SUCCESSFULLY');
//           console.log('='.repeat(80));
          
//           const updatedProject = await Project.findById(projectId);
//           if (!updatedProject) {
//             console.error('❌ Project not found during update');
//             return;
//           }
          
//           // Display summary
//           console.log('\n📊 ANALYSIS SUMMARY:');
//           console.log('─'.repeat(80));
//           console.log(`Files Analyzed:           ${combinedResults.summary.totalFiles}`);
//           console.log(`Code Units:               ${combinedResults.summary.totalUnits}`);
//           console.log(`Exact Clone Groups:       ${combinedResults.summary.exactClones}`);
//           console.log(`Near Clone Groups:        ${combinedResults.summary.nearClones}`);
//           console.log(`\n🚨 CODE QUALITY ISSUES:`);
//           console.log(`Critical Issues:          ${combinedResults.summary.criticalIssues}`);
//           console.log(`High Issues:              ${combinedResults.summary.highIssues}`);
//           console.log(`Medium Issues:            ${combinedResults.summary.mediumIssues}`);
//           console.log(`Low Issues:               ${combinedResults.summary.lowIssues}`);
//           console.log(`\n⚛️  REACT HOOKS VIOLATIONS:`);
//           console.log(`Total Violations:         ${combinedResults.summary.hooksViolations}`);
//           console.log(`Critical:                 ${combinedResults.summary.criticalHooks}`);
//           console.log(`High:                     ${combinedResults.summary.highHooks}`);
//           console.log(`Medium:                   ${combinedResults.summary.mediumHooks}`);
//           console.log(`Low:                      ${combinedResults.summary.lowHooks}`);
//           console.log('─'.repeat(80));
          
//           // Update project with ALL results
//           updatedProject.analysisStatus = 'completed';
          
//           // Duplication
//           updatedProject.duplicationAnalysis = {
//             status: 'completed',
//             startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             results: combinedResults.analyses.duplication
//           };
          
//           // Quality
//           updatedProject.codeQualityAnalysis = {
//             status: 'completed',
//             startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             results: combinedResults.analyses.codeQuality
//           };
          
//           // Hooks (NEW)
//           updatedProject.hooksAnalysis = {
//             status: 'completed',
//             startedAt: updatedProject.hooksAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             results: combinedResults.analyses.hooks
//           };
          
//           // Also store in analysisReport for backward compatibility
//           updatedProject.analysisReport = {
//             summary: combinedResults.analyses.hooks.summary,
//             violations: combinedResults.analyses.hooks.violations,
//             analyzers: combinedResults.analyses.hooks.analyzers,
//             metadata: combinedResults.analyses.hooks.metadata
//           };
          
//           await updatedProject.save();
          
//           console.log('\n✅ Successfully saved all 3 analyses to database!');
//           console.log(`   Project ID: ${updatedProject._id}`);
//           console.log(`   Project Name: ${updatedProject.projectName}`);
//           console.log('\n📍 VIEW RESULTS AT:');
//           console.log(`   GET /api/projects/${updatedProject._id}/analysis`);
//           console.log(`   GET /api/projects/${updatedProject._id}/duplication`);
//           console.log(`   GET /api/projects/${updatedProject._id}/quality`);
//           console.log(`   GET /api/projects/${updatedProject._id}/hooks`);
//           console.log('='.repeat(80) + '\n');
//         })
//         .catch(async (error) => {
//           console.log('\n' + '='.repeat(80));
//           console.error('❌ ANALYSIS FAILED');
//           console.log('='.repeat(80));
//           console.error('Error:', error.message);
          
//           const updatedProject = await Project.findById(projectId);
//           if (!updatedProject) {
//             console.error('❌ Project not found during error update');
//             return;
//           }
          
//           updatedProject.analysisStatus = 'failed';
//           updatedProject.duplicationAnalysis = {
//             status: 'failed',
//             startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             error: error.message
//           };
//           updatedProject.codeQualityAnalysis = {
//             status: 'failed',
//             startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             error: error.message
//           };
//           updatedProject.hooksAnalysis = {
//             status: 'failed',
//             startedAt: updatedProject.hooksAnalysis?.startedAt || new Date(),
//             completedAt: new Date(),
//             error: error.message
//           };
//           await updatedProject.save();
          
//           console.log('💾 Saved failure status to database');
//           console.log('='.repeat(80) + '\n');
//         });

//     } catch (error) {
//       console.error('Upload and processing error:', error);
      
//       if (extractedPath) {
//         try {
//           await fs.rm(extractedPath, { recursive: true, force: true });
//         } catch (cleanupError) {
//           console.error('Error cleaning up extracted files:', cleanupError);
//         }
//       }

//       if (req.file) {
//         try {
//           await fs.unlink(req.file.path);
//         } catch (unlinkError) {
//           console.error('Error deleting uploaded file:', unlinkError);
//         }
//       }

//       if (project && project._id) {
//         try {
//           await Project.findByIdAndDelete(project._id);
//         } catch (deleteError) {
//           console.error('Error deleting project record:', deleteError);
//         }
//       }

//       res.status(500).json({
//         success: false,
//         message: error.message || 'Upload and processing failed'
//       });
//     }
//   });
// });

const performAllAnalyses = async (extractedPath, projectId, preferences = {
  codeDuplication: true,
  expressMiddleware: true,
  reactHooks: true,
  propDrilling: true,
}) => {
  console.log('\n' + '='.repeat(80));
  console.log(' STARTING COMBINED CODE ANALYSIS (4 ANALYSES + AI)');
  console.log('Preferences:', preferences);
  console.log('='.repeat(80) + '\n');

  try {
    const [duplicationResults, qualityResults, hooksResults, propDrillingResults] = await Promise.all([
      // Code Duplication
      preferences.codeDuplication
        ? analyzeDuplication(extractedPath)
        : Promise.resolve({
            stats: { totalFiles: 0, totalUnits: 0, exactCloneGroups: 0, nearCloneGroups: 0, duplicatedUnits: 0 },
            exactClones: [],
            nearClones: [],
            skipped: true
          }),

      // Express Middleware (codeQuality)
      preferences.expressMiddleware
        ? analyzeCodeQuality(extractedPath)
        : Promise.resolve({
            stats: { totalIssuesFound: 0, criticalIssues: 0, highIssues: 0, mediumIssues: 0, lowIssues: 0 },
            results: { apiRouteIssues: [], mongooseQueryIssues: [], redundantQueryIssues: [] },
            skipped: true
          }),

      // React Hooks
      preferences.reactHooks
        ? (async () => {
            try {
              const analyzer = new MainAnalyzer(extractedPath);
              return await analyzer.analyze();
            } catch (error) {
              console.error('Hooks analysis error:', error);
              return {
                summary: { totalViolations: 0 },
                violations: [],
                analyzers: {},
                metadata: { error: error.message }
              };
            }
          })()
        : Promise.resolve({
            summary: { totalViolations: 0 },
            violations: [],
            analyzers: {},
            metadata: { skipped: true }
          }),

      // Prop Drilling
      preferences.propDrilling
        ? (async () => {
            try {
              return await analyzePropDrillingService(extractedPath);
            } catch (error) {
              console.error('Prop drilling analysis error:', error);
              return {
                summary: { totalIssues: 0, highSeverity: 0, mediumSeverity: 0, lowSeverity: 0 },
                propDrillingIssues: [],
                stats: { totalFiles: 0, totalComponents: 0 },
                error: error.message
              };
            }
          })()
        : Promise.resolve({
            summary: { totalIssues: 0, highSeverity: 0, mediumSeverity: 0, lowSeverity: 0 },
            propDrillingIssues: [],
            stats: { totalFiles: 0, totalComponents: 0 },
            skipped: true
          }),
    ]);

    const combinedResults = {
      timestamp: new Date(),
      analyses: {
        duplication: duplicationResults,
        codeQuality: qualityResults,
        hooks: hooksResults,
        propDrilling: propDrillingResults
      },
      summary: {
        // Duplication stats
        totalFiles: duplicationResults.stats?.totalFiles || 0,
        totalUnits: duplicationResults.stats?.totalUnits || 0,
        exactClones: duplicationResults.stats?.exactCloneGroups || 0,
        nearClones: duplicationResults.stats?.nearCloneGroups || 0,

        // Quality stats
        routeIssues: qualityResults.stats?.totalIssuesFound || 0,
        criticalIssues: qualityResults.stats?.criticalIssues || 0,
        highIssues: qualityResults.stats?.highIssues || 0,
        mediumIssues: qualityResults.stats?.mediumIssues || 0,
        lowIssues: qualityResults.stats?.lowIssues || 0,

        // Quality stats broken down by type
        apiRouteIssues: qualityResults.results?.apiRouteIssues?.length || 0,
        mongooseIssues: qualityResults.results?.mongooseQueryIssues?.length || 0,
        redundantQueries: qualityResults.results?.redundantQueryIssues?.length || 0,

        // Hooks stats
        hooksViolations: hooksResults.summary?.totalViolations || 0,
        criticalHooks: hooksResults.violations?.filter(v => v.severity === 'critical').length || 0,
        highHooks: hooksResults.violations?.filter(v => v.severity === 'high').length || 0,
        mediumHooks: hooksResults.violations?.filter(v => v.severity === 'medium').length || 0,
        lowHooks: hooksResults.violations?.filter(v => v.severity === 'low').length || 0,

        // Prop Drilling stats
        propDrillingIssues: propDrillingResults.summary?.totalIssues || 0,
        highPropDrilling: propDrillingResults.summary?.highSeverity || 0,
        mediumPropDrilling: propDrillingResults.summary?.mediumSeverity || 0,
        lowPropDrilling: propDrillingResults.summary?.lowSeverity || 0,

        // Track which were skipped
        skipped: {
          codeDuplication: !preferences.codeDuplication,
          expressMiddleware: !preferences.expressMiddleware,
          reactHooks: !preferences.reactHooks,
          propDrilling: !preferences.propDrilling,
        }
      }
    };

    // Generate AI Suggestions
    console.log('\n Generating AI suggestions...');
    try {
      const aiSuggestions = await generateAISuggestions(combinedResults);

      if (projectId) {
        await Project.findByIdAndUpdate(projectId, {
          aiSuggestions: {
            ...aiSuggestions,
            generatedAt: new Date(),
            status: 'completed'
          }
        });
        console.log('AI suggestions saved to database');
      }

      combinedResults.aiSuggestions = aiSuggestions;

    } catch (aiError) {
      console.error('AI generation failed (non-critical):', aiError.message);
      if (projectId) {
        await Project.findByIdAndUpdate(projectId, {
          'aiSuggestions.status': 'failed',
          'aiSuggestions.error': aiError.message
        });
      }
    }

    return combinedResults;

  } catch (error) {
    console.error('Error in combined analysis:', error);
    throw error;
  }
};

router.post('/upload', auth, (req, res) => {
  upload.single('project')(req, res, async (err) => {
    if (err) {
      return handleMulterError(err, res);
    }

    let extractedPath = null;
    let project = null;

    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      const { projectName, description } = req.body;
      
      const extractionDirName = `project-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const extractedDir = await ensureExtractedDir();
      extractedPath = path.join(extractedDir, extractionDirName);

      console.log(`Extracting project to: ${extractedPath}`);

      // Extract ZIP file
      const extractionResult = await extractZipFile(req.file.path, extractedPath);
      
      console.log('ZIP extracted successfully, validating MERN structure...');

      // Validate MERN stack project
      const validation = await validateMernProject(extractedPath);
      
      if (!validation.isValid) {
        try {
          await fs.rm(extractedPath, { recursive: true, force: true });
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up:', cleanupError);
        }

        return res.status(400).json({
          success: false,
          message: 'Invalid project structure',
          errors: validation.errors,
          warnings: validation.warnings,
          requirements: [
            'Project must contain at least one package.json file',
            'Project must have a src directory',
            'Project must be a valid Node.js/React/MERN project'
          ]
        });
      }

      console.log(`Valid ${validation.type} project detected, cleaning up...`);

      // Clean up unwanted files
      const cleanupResults = await cleanupProject(extractedPath);

      console.log('Cleanup completed, creating project record...');

      // Create project record with ALL FOUR analyses
      const sanitizedProjectName = (projectName || req.file.originalname.replace('.zip', ''))
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase();

      project = new Project({
        user: req.user.userId,
        source: 'zip',
        zipFilePath: req.file.path,
        extractedPath: extractedPath,
        projectName: projectName || req.file.originalname.replace('.zip', ''),
        description: description || '',
        analysisStatus: 'processing',
        projectType: validation.type,
        validationResult: validation,
        cleanupResult: cleanupResults,
        duplicationAnalysis: {
          status: 'pending',
          startedAt: new Date()
        },
        codeQualityAnalysis: {
          status: 'pending',
          startedAt: new Date()
        },
        hooksAnalysis: {
          status: 'pending',
          startedAt: new Date()
        },
        propDrillingAnalysis: {  // NEW
          status: 'pending',
          startedAt: new Date()
        }
      });

      await project.save();
      console.log('✅ Project saved to database with ID:', project._id);

      // Send immediate response
      res.json({
        success: true,
        message: 'Project uploaded successfully. Code analysis (duplication, quality, hooks & prop drilling) is in progress.',
        project: {
          id: project._id,
          name: project.projectName,
          source: project.source,
          type: project.projectType,
          status: project.analysisStatus,
          validation: {
            type: validation.type,
            warnings: validation.warnings
          },
          cleanup: {
            itemsRemoved: cleanupResults.removed.length,
            nodeModulesRemoved: cleanupResults.nodeModulesRemoved.length
          },
          createdAt: project.createdAt
        }
      });

      // Run COMBINED analysis asynchronously (ALL 4)
      const projectId = project._id;
      const userId = req.user.userId;

      (async () => {
  const User = require('../models/User');
  const user = await User.findById(userId).select('analysisPreferences');
  const preferences = user?.analysisPreferences || {
    codeDuplication: true,
    expressMiddleware: true,
    reactHooks: true,
    propDrilling: true,
  };
  console.log('User preferences fetched:', preferences);
  return performAllAnalyses(extractedPath, projectId, preferences);
})()
        .then(async (combinedResults) => {
     
          
          const updatedProject = await Project.findById(projectId);
          if (!updatedProject) {
            return;
          }
          
          
          
          // Update project with ALL results
          updatedProject.analysisStatus = 'completed';
          
          // Duplication
          updatedProject.duplicationAnalysis = {
            status: 'completed',
            startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
            completedAt: new Date(),
            results: combinedResults.analyses.duplication
          };
          
          // Quality
          updatedProject.codeQualityAnalysis = {
            status: 'completed',
            startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
            completedAt: new Date(),
            results: combinedResults.analyses.codeQuality
          };
          
          // Hooks
          updatedProject.hooksAnalysis = {
            status: 'completed',
            startedAt: updatedProject.hooksAnalysis?.startedAt || new Date(),
            completedAt: new Date(),
            results: combinedResults.analyses.hooks
          };
          
          // Also store in analysisReport for backward compatibility
          updatedProject.analysisReport = {
            summary: combinedResults.analyses.hooks.summary,
            violations: combinedResults.analyses.hooks.violations,
            analyzers: combinedResults.analyses.hooks.analyzers,
            metadata: combinedResults.analyses.hooks.metadata
          };
          
          // Prop Drilling (NEW)
          updatedProject.propDrillingAnalysis = {
            status: 'completed',
            startedAt: updatedProject.propDrillingAnalysis?.startedAt || new Date(),
            completedAt: new Date(),
            results: combinedResults.analyses.propDrilling
          };
          
          await updatedProject.save();
          
          
        })
        .catch(async (error) => {
          console.log('\n' + '='.repeat(80));
          console.error('ANALYSIS FAILED');
          console.log('='.repeat(80));
          console.error('Error:', error.message);
          
          const updatedProject = await Project.findById(projectId);
          if (!updatedProject) {
            console.error(' Project not found during error update');
            return;
          }
          
          updatedProject.analysisStatus = 'failed';
          updatedProject.duplicationAnalysis = {
            status: 'failed',
            startedAt: updatedProject.duplicationAnalysis?.startedAt || new Date(),
            completedAt: new Date(),
            error: error.message
          };
          updatedProject.codeQualityAnalysis = {
            status: 'failed',
            startedAt: updatedProject.codeQualityAnalysis?.startedAt || new Date(),
            completedAt: new Date(),
            error: error.message
          };
          updatedProject.hooksAnalysis = {
            status: 'failed',
            startedAt: updatedProject.hooksAnalysis?.startedAt || new Date(),
            completedAt: new Date(),
            error: error.message
          };
          updatedProject.propDrillingAnalysis = {
            status: 'failed',
            startedAt: updatedProject.propDrillingAnalysis?.startedAt || new Date(),
            completedAt: new Date(),
            error: error.message
          };
          await updatedProject.save();
          
          console.log('Saved failure status to database');
          console.log('='.repeat(80) + '\n');
        });

    } catch (error) {
      console.error('Upload and processing error:', error);
      
      if (extractedPath) {
        try {
          await fs.rm(extractedPath, { recursive: true, force: true });
        } catch (cleanupError) {
          console.error('Error cleaning up extracted files:', cleanupError);
        }
      }

      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }

      if (project && project._id) {
        try {
          await Project.findByIdAndDelete(project._id);
        } catch (deleteError) {
          console.error('Error deleting project record:', deleteError);
        }
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Upload and processing failed'
      });
    }
  });
});

// GET /api/projects/:id/analysis - Get COMBINED analysis results
// router.get('/:id/analysis', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     // Transform API route issues to match frontend expectations
//     const apiRouteIssues = (project.codeQualityAnalysis?.results?.apiRouteIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       route: issue.routePath,
//       method: issue.routeMethod,
//       line: issue.startLine,
//       message: issue.message,
//       suggestion: issue.recommendation
//     }));

//     // Transform Mongoose query issues
//     const mongooseQueryIssues = (project.codeQualityAnalysis?.results?.mongooseQueryIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       line: issue.startLine,
//       message: issue.message,
//       suggestion: issue.recommendation,
//       queryMethod: issue.queryMethod,
//       chain: issue.chain
//     }));

//     // Transform redundant query issues
//     const redundantQueryIssues = (project.codeQualityAnalysis?.results?.redundantQueryIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       line: issue.lines?.[0] || 0,
//       message: issue.message,
//       suggestion: issue.recommendation,
//       functionName: issue.functionName,
//       queryPattern: issue.queryPattern,
//       occurrences: issue.occurrences
//     }));

//     res.json({
//       success: true,
//       projectName: project.projectName,
//       projectType: project.projectType,
//       analysisStatus: project.analysisStatus,
//       duplication: {
//         status: project.duplicationAnalysis?.status,
//         startedAt: project.duplicationAnalysis?.startedAt,
//         completedAt: project.duplicationAnalysis?.completedAt,
//         results: project.duplicationAnalysis?.results
//       },
//       codeQuality: {
//         status: project.codeQualityAnalysis?.status,
//         startedAt: project.codeQualityAnalysis?.startedAt,
//         completedAt: project.codeQualityAnalysis?.completedAt,
//         results: {
//           apiRouteIssues,
//           mongooseQueryIssues,
//           redundantQueryIssues,
//           stats: project.codeQualityAnalysis?.results?.stats
//         }
//       },
//       summary: {
//         totalFiles: project.duplicationAnalysis?.results?.stats?.totalFiles || 0,
//         exactClones: project.duplicationAnalysis?.results?.stats?.exactCloneGroups || 0,
//         nearClones: project.duplicationAnalysis?.results?.stats?.nearCloneGroups || 0,
//         apiRouteIssues: apiRouteIssues.length,
//         mongooseQueryIssues: mongooseQueryIssues.length,
//         redundantQueryIssues: redundantQueryIssues.length
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching combined analysis:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch analysis results'
//     });
//   }
// });

// router.get('/:id/analysis', auth, async (req, res) => {
//   try {
//     const project = await Project.findOne({
//       _id: req.params.id,
//       user: req.user.userId
//     });

//     if (!project) {
//       return res.status(404).json({
//         success: false,
//         message: 'Project not found'
//       });
//     }

//     // Transform API route issues
//     const apiRouteIssues = (project.codeQualityAnalysis?.results?.apiRouteIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       route: issue.routePath,
//       method: issue.routeMethod,
//       line: issue.startLine,
//       message: issue.message,
//       suggestion: issue.recommendation
//     }));

//     // Transform Mongoose query issues
//     const mongooseQueryIssues = (project.codeQualityAnalysis?.results?.mongooseQueryIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       line: issue.startLine,
//       message: issue.message,
//       suggestion: issue.recommendation,
//       queryMethod: issue.queryMethod,
//       chain: issue.chain
//     }));

//     // Transform redundant query issues
//     const redundantQueryIssues = (project.codeQualityAnalysis?.results?.redundantQueryIssues || []).map(issue => ({
//       type: issue.type,
//       severity: issue.severity,
//       file: issue.filePath,
//       line: issue.lines?.[0] || 0,
//       message: issue.message,
//       suggestion: issue.recommendation,
//       functionName: issue.functionName,
//       queryPattern: issue.queryPattern,
//       occurrences: issue.occurrences
//     }));

//     res.json({
//       success: true,
//       projectName: project.projectName,
//       projectType: project.projectType,
//       analysisStatus: project.analysisStatus,
      
//       // Duplication
//       duplication: {
//         status: project.duplicationAnalysis?.status,
//         startedAt: project.duplicationAnalysis?.startedAt,
//         completedAt: project.duplicationAnalysis?.completedAt,
//         results: project.duplicationAnalysis?.results
//       },
      
//       // Code Quality
//       codeQuality: {
//         status: project.codeQualityAnalysis?.status,
//         startedAt: project.codeQualityAnalysis?.startedAt,
//         completedAt: project.codeQualityAnalysis?.completedAt,
//         results: {
//           apiRouteIssues,
//           mongooseQueryIssues,
//           redundantQueryIssues,
//           stats: project.codeQualityAnalysis?.results?.stats
//         }
//       },
      
//       // React Hooks (NEW)
//       hooks: {
//         status: project.hooksAnalysis?.status,
//         startedAt: project.hooksAnalysis?.startedAt,
//         completedAt: project.hooksAnalysis?.completedAt,
//         results: {
//           summary: project.hooksAnalysis?.results?.summary,
//           violations: project.hooksAnalysis?.results?.violations,
//           analyzers: project.hooksAnalysis?.results?.analyzers
//         }
//       },
      
//       // Combined Summary
//       summary: {
//         totalFiles: project.duplicationAnalysis?.results?.stats?.totalFiles || 0,
//         exactClones: project.duplicationAnalysis?.results?.stats?.exactCloneGroups || 0,
//         nearClones: project.duplicationAnalysis?.results?.stats?.nearCloneGroups || 0,
//         apiRouteIssues: apiRouteIssues.length,
//         mongooseQueryIssues: mongooseQueryIssues.length,
//         redundantQueryIssues: redundantQueryIssues.length,
//         hooksViolations: project.hooksAnalysis?.results?.violations?.length || 0
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching combined analysis:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch analysis results'
//     });
//   }
// });

router.get('/:id/analysis', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Transform API route issues
    const apiRouteIssues = (project.codeQualityAnalysis?.results?.apiRouteIssues || []).map(issue => ({
      type: issue.type,
      severity: issue.severity,
      file: issue.filePath,
      route: issue.routePath,
      method: issue.routeMethod,
      line: issue.startLine,
      message: issue.message,
      suggestion: issue.recommendation
    }));

    // Transform Mongoose query issues
    const mongooseQueryIssues = (project.codeQualityAnalysis?.results?.mongooseQueryIssues || []).map(issue => ({
      type: issue.type,
      severity: issue.severity,
      file: issue.filePath,
      line: issue.startLine,
      message: issue.message,
      suggestion: issue.recommendation,
      queryMethod: issue.queryMethod,
      chain: issue.chain
    }));

    // Transform redundant query issues
    const redundantQueryIssues = (project.codeQualityAnalysis?.results?.redundantQueryIssues || []).map(issue => ({
      type: issue.type,
      severity: issue.severity,
      file: issue.filePath,
      line: issue.lines?.[0] || 0,
      message: issue.message,
      suggestion: issue.recommendation,
      functionName: issue.functionName,
      queryPattern: issue.queryPattern,
      occurrences: issue.occurrences
    }));

    res.json({
      success: true,
      projectName: project.projectName,
      projectType: project.projectType,
      analysisStatus: project.analysisStatus,
      
      // Duplication
      duplication: {
        status: project.duplicationAnalysis?.status,
        startedAt: project.duplicationAnalysis?.startedAt,
        completedAt: project.duplicationAnalysis?.completedAt,
        results: project.duplicationAnalysis?.results
      },
      
      // Code Quality
      codeQuality: {
        status: project.codeQualityAnalysis?.status,
        startedAt: project.codeQualityAnalysis?.startedAt,
        completedAt: project.codeQualityAnalysis?.completedAt,
        results: {
          apiRouteIssues,
          mongooseQueryIssues,
          redundantQueryIssues,
          stats: project.codeQualityAnalysis?.results?.stats
        }
      },
      
      // React Hooks
      // REPLACE the hooks section with this:
hooks: {
  status: project.hooksAnalysis?.status || (project.analysisReport?.violations ? 'completed' : 'pending'),
  startedAt: project.hooksAnalysis?.startedAt || project.analysisReport?.timestamp,
  completedAt: project.hooksAnalysis?.completedAt || project.analysisReport?.timestamp,
  results: {
    summary: project.hooksAnalysis?.results?.summary || project.analysisReport?.summary || {
      filesAnalyzed: 0,
      totalViolations: project.analysisReport?.violations?.length || 0,
      criticalViolations: project.analysisReport?.violations?.filter(v => v.severity === 'critical').length || 0,
      highViolations: project.analysisReport?.violations?.filter(v => v.severity === 'high').length || 0,
      mediumViolations: project.analysisReport?.violations?.filter(v => v.severity === 'medium').length || 0,
      lowViolations: project.analysisReport?.violations?.filter(v => v.severity === 'low').length || 0
    },
    violations: project.hooksAnalysis?.results?.violations || project.analysisReport?.violations || [],
    analyzers: project.hooksAnalysis?.results?.analyzers || project.analysisReport?.analyzers || {},
    metadata: project.hooksAnalysis?.results?.metadata || {
      analyzedAt: project.analysisReport?.timestamp,
      version: 'legacy'
    }
  }
  
},

      
      // Prop Drilling (NEW)
      propDrilling: {
        status: project.propDrillingAnalysis?.status,
        startedAt: project.propDrillingAnalysis?.startedAt,
        completedAt: project.propDrillingAnalysis?.completedAt,
        results: {
          summary: project.propDrillingAnalysis?.results?.summary,
          issues: project.propDrillingAnalysis?.results?.propDrillingIssues,
          stats: project.propDrillingAnalysis?.results?.stats
        }
      },
      // 🚀 AI SUGGESTIONS - ADD THIS SECTION
      aiSuggestions: project.aiSuggestions || {
        status: 'pending',
        duplicates: [],
        hooks: [],
        propDrilling: [],
        codeQuality: [],
        generatedAt: null
      },
      // Combined Summary
      summary: {
        totalFiles: project.duplicationAnalysis?.results?.stats?.totalFiles || 0,
        exactClones: project.duplicationAnalysis?.results?.stats?.exactCloneGroups || 0,
        nearClones: project.duplicationAnalysis?.results?.stats?.nearCloneGroups || 0,
        apiRouteIssues: apiRouteIssues.length,
        mongooseQueryIssues: mongooseQueryIssues.length,
        redundantQueryIssues: redundantQueryIssues.length,
        hooksViolations: project.hooksAnalysis?.results?.violations?.length || 0,
        propDrillingIssues: project.propDrillingAnalysis?.results?.propDrillingIssues?.length || 0
      }
    });

  } catch (error) {
    console.error('Error fetching combined analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis results'
    });
  }
});

// GET /api/projects/:id/quality - Get CODE QUALITY analysis only
router.get('/:id/quality', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project || !project.codeQualityAnalysis) {
      return res.status(404).json({
        success: false,
        message: 'Code quality analysis not found'
      });
    }

    // Transform issues to match frontend expectations
    const apiRouteIssues = (project.codeQualityAnalysis.results?.apiRouteIssues || []).map(issue => ({
      type: issue.type,
      severity: issue.severity,
      file: issue.filePath,
      route: issue.routePath,
      method: issue.routeMethod,
      line: issue.startLine,
      message: issue.message,
      suggestion: issue.recommendation
    }));

    const mongooseQueryIssues = (project.codeQualityAnalysis.results?.mongooseQueryIssues || []).map(issue => ({
      type: issue.type,
      severity: issue.severity,
      file: issue.filePath,
      line: issue.startLine,
      message: issue.message,
      suggestion: issue.recommendation
    }));

    const redundantQueryIssues = (project.codeQualityAnalysis.results?.redundantQueryIssues || []).map(issue => ({
      type: issue.type,
      severity: issue.severity,
      file: issue.filePath,
      line: issue.lines?.[0] || 0,
      message: issue.message,
      suggestion: issue.recommendation
    }));

    res.json({
      success: true,
      status: project.codeQualityAnalysis.status,
      projectName: project.projectName,
      quality: {
        apiRouteIssues,
        mongooseQueryIssues,
        redundantQueryIssues
      },
      stats: project.codeQualityAnalysis.results?.stats
    });

  } catch (error) {
    console.error('Error fetching quality analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quality analysis'
    });
  }
});

// GET /api/projects/:id/quality/routes - Get API ROUTE issues only
router.get('/:id/quality/routes', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project || !project.codeQualityAnalysis?.results) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    const routeIssues = (project.codeQualityAnalysis.results.apiRouteIssues || []).map(issue => ({
      type: issue.type,
      severity: issue.severity,
      file: issue.filePath,
      route: issue.routePath,
      method: issue.routeMethod,
      line: issue.startLine,
      message: issue.message,
      suggestion: issue.recommendation
    }));

    res.json({
      success: true,
      routeIssues,
      stats: {
        total: routeIssues.length,
        routes: project.codeQualityAnalysis.results.stats?.routeCount || 0
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/projects/:id/quality/queries - Get MONGOOSE QUERY issues only
router.get('/:id/quality/queries', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project || !project.codeQualityAnalysis?.results) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found'
      });
    }

    const queryIssues = (project.codeQualityAnalysis.results.mongooseQueryIssues || []).map(issue => ({
      type: issue.type,
      severity: issue.severity,
      file: issue.filePath,
      line: issue.startLine,
      message: issue.message,
      suggestion: issue.recommendation
    }));

    const redundantIssues = (project.codeQualityAnalysis.results.redundantQueryIssues || []).map(issue => ({
      type: issue.type,
      severity: issue.severity,
      file: issue.filePath,
      line: issue.lines?.[0] || 0,
      message: issue.message,
      suggestion: issue.recommendation
    }));

    res.json({
      success: true,
      queryIssues,
      redundantIssues,
      stats: {
        mongooseIssues: queryIssues.length,
        redundantIssues: redundantIssues.length
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/projects/:id/file-content - Get file content for code viewer
router.get('/:id/file-content', auth, async (req, res) => {
  try {
    const { filePath, startLine, endLine } = req.query;
    
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.extractedPath) {
      return res.status(400).json({
        success: false,
        message: 'Project path not available'
      });
    }

    const fs = require('fs').promises;
    const path = require('path');
    
    // Construct full file path
    const fullPath = path.join(project.extractedPath, filePath);
    
    // Security check - ensure file is within project directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedProjectPath = path.resolve(project.extractedPath);
    
    if (!resolvedPath.startsWith(resolvedProjectPath)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Read file content
    const fileContent = await fs.readFile(fullPath, 'utf-8');
    const lines = fileContent.split('\n');
    
    // Extract requested lines (1-indexed to 0-indexed)
    const start = parseInt(startLine) - 1;
    const end = parseInt(endLine);
    const extractedLines = lines.slice(start, end);
    
    res.json({
      success: true,
      content: extractedLines.join('\n'),
      startLine: parseInt(startLine),
      endLine: parseInt(endLine),
      totalLines: lines.length
    });

  } catch (error) {
    console.error('Error fetching file content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file content'
    });
  }
});

// Add this route in your routes file
router.get('/:id/debug-hooks', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    res.json({
      success: true,
      debug: {
        hasAnalysisReport: !!project.analysisReport,
        analysisReportKeys: project.analysisReport ? Object.keys(project.analysisReport) : [],
        analysisReportType: typeof project.analysisReport,
        violationsCount: project.analysisReport?.violations?.length || 0,
        firstViolation: project.analysisReport?.violations?.[0] || null,
        fullAnalysisReport: project.analysisReport
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// GET /api/projects - Get user's projects
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .select('-zipFilePath -extractedPath -validationResult -cleanupResult');

    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects'
    });
  }
});

// GET /api/projects/:id - Get specific project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project'
    });
  }
});



// GET /api/projects/:id/duplication - Get code duplication analysis results
router.get('/:id/duplication', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.duplicationAnalysis) {
      return res.status(400).json({
        success: false,
        message: 'Duplication analysis not available for this project'
      });
    }

    res.json({
      success: true,
      status: project.duplicationAnalysis.status,
      analysis: project.duplicationAnalysis,
      projectName: project.projectName,
      projectType: project.projectType
    });

  } catch (error) {
    console.error('Error fetching duplication results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch duplication results'
    });
  }
});

// GET /api/projects/:id/duplication/exact - Get only exact clones
router.get('/:id/duplication/exact', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project || !project.duplicationAnalysis?.results) {
      return res.status(404).json({
        success: false,
        message: 'Duplication analysis not found'
      });
    }

    res.json({
      success: true,
      exactClones: project.duplicationAnalysis.results.exactClones || [],
      stats: {
        totalGroups: project.duplicationAnalysis.results.stats.exactCloneGroups,
        totalDuplicates: project.duplicationAnalysis.results.stats.duplicatedUnits
      }
    });

  } catch (error) {
    console.error('Error fetching exact clones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exact clones'
    });
  }
});

// GET /api/projects/:id/duplication/near - Get only near clones
router.get('/:id/duplication/near', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project || !project.duplicationAnalysis?.results) {
      return res.status(404).json({
        success: false,
        message: 'Duplication analysis not found'
      });
    }

    res.json({
      success: true,
      nearClones: project.duplicationAnalysis.results.nearClones || [],
      stats: {
        totalGroups: project.duplicationAnalysis.results.stats.nearCloneGroups
      }
    });

  } catch (error) {
    console.error('Error fetching near clones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch near clones'
    });
  }
});

// GET /api/projects/:id/file-content - Get file content for viewing duplicates
router.get('/:id/file-content', auth, async (req, res) => {
  try {
    const { filePath, startLine, endLine } = req.query;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const fullPath = path.join(project.extractedPath, filePath);
    
    // Security check: ensure the file is within the project directory
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(project.extractedPath)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const content = await fs.readFile(fullPath, 'utf8');
    const lines = content.split('\n');

    let resultContent = content;
    let resultLines = lines;

    // If line range is specified, extract only those lines
    if (startLine && endLine) {
      const start = parseInt(startLine) - 1;
      const end = parseInt(endLine);
      resultLines = lines.slice(start, end);
      resultContent = resultLines.join('\n');
    }

    res.json({
      success: true,
      filePath,
      content: resultContent,
      totalLines: lines.length,
      extractedLines: resultLines.length
    });

  } catch (error) {
    console.error('Error fetching file content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch file content'
    });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.source === 'zip' && project.zipFilePath) {
      try {
        await fs.unlink(project.zipFilePath);
      } catch (unlinkError) {
        console.error('Error deleting ZIP file:', unlinkError);
      }
    }

    if (project.extractedPath) {
      try {
        await fs.rm(project.extractedPath, { recursive: true, force: true });
      } catch (unlinkError) {
        console.error('Error deleting extracted directory:', unlinkError);
      }
    }

    await Project.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
});

router.get('/:id/hooks', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.hooksAnalysis) {
      return res.status(400).json({
        success: false,
        message: 'Hooks analysis not available for this project'
      });
    }

    res.json({
      success: true,
      status: project.hooksAnalysis.status,
      projectName: project.projectName,
      analysis: project.hooksAnalysis,
      // Return structured data
      summary: project.hooksAnalysis.results?.summary,
      violations: project.hooksAnalysis.results?.violations,
      analyzers: project.hooksAnalysis.results?.analyzers
    });

  } catch (error) {
    console.error('Error fetching hooks analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hooks analysis'
    });
  }
});

// GET /api/projects/:id/hooks/violations/:severity - Get hooks violations by severity
router.get('/:id/hooks/violations/:severity', auth, async (req, res) => {
  try {
    const { severity } = req.params;
    
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project || !project.hooksAnalysis?.results) {
      return res.status(404).json({
        success: false,
        message: 'Hooks analysis not found'
      });
    }

    const violations = (project.hooksAnalysis.results.violations || []).filter(
      v => v.severity === severity
    );

    res.json({
      success: true,
      severity,
      count: violations.length,
      violations
    });

  } catch (error) {
    console.error('Error fetching hooks violations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch violations'
    });
  }
});

// GET /api/projects/:id/propdrilling - Get prop drilling analysis
router.get('/:id/propdrilling', auth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.propDrillingAnalysis) {
      return res.status(400).json({
        success: false,
        message: 'Prop drilling analysis not available for this project'
      });
    }

    res.json({
      success: true,
      status: project.propDrillingAnalysis.status,
      projectName: project.projectName,
      analysis: project.propDrillingAnalysis,
      summary: project.propDrillingAnalysis.results?.summary,
      issues: project.propDrillingAnalysis.results?.propDrillingIssues,
      stats: project.propDrillingAnalysis.results?.stats
    });

  } catch (error) {
    console.error('Error fetching prop drilling analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prop drilling analysis'
    });
  }
});

// GET /api/projects/:id/propdrilling/severity/:severity - Get prop drilling issues by severity
router.get('/:id/propdrilling/severity/:severity', auth, async (req, res) => {
  try {
    const { severity } = req.params;
    
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!project || !project.propDrillingAnalysis?.results) {
      return res.status(404).json({
        success: false,
        message: 'Prop drilling analysis not found'
      });
    }

    const issues = (project.propDrillingAnalysis.results.propDrillingIssues || []).filter(
      issue => issue.severity === severity
    );

    res.json({
      success: true,
      severity,
      count: issues.length,
      issues
    });

  } catch (error) {
    console.error('Error fetching prop drilling issues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch issues'
    });
  }
});

const exportedFunctions = {
  ensureExtractedDir,
  validateMernProject,
  cleanupProject,
  removeNodeModulesRecursively,
  validateMernProjectEnhanced,
  checkForNonMernFrameworks,
  directoryExists,
  fileExists,
  readPackageJson,
  analyzeDuplication
};

module.exports = router;
module.exports.functions = exportedFunctions;