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


const { generateAISuggestions } = require('../services/aiSuggestionService');


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