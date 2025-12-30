const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    type: String,
    enum: ['zip', 'github'],
    required: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  analysisStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  // For ZIP uploads
  zipFilePath: {
    type: String,
    required: function() { return this.source === 'zip'; }
  },
  // Extracted project path
  extractedPath: {
    type: String
  },
  // For GitHub imports
  githubInfo: {
    repositoryId: {
      type: String,
      required: function() { return this.source === 'github'; }
    },
    repositoryName: {
      type: String,
      required: function() { return this.source === 'github'; }
    },
    repositoryFullName: {
      type: String,
      required: function() { return this.source === 'github'; }
    },
    cloneUrl: {
      type: String,
      required: function() { return this.source === 'github'; }
    },
    importedAt: {
      type: Date,
      default: Date.now
    },
    lastSynced: Date
  },
  // SonarQube integration (legacy - keeping for backward compatibility)
  sonarQubeProjectKey: {
    type: String,
    unique: true,
    sparse: true
  },
  sonarQubeResults: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Project type and validation
  projectType: {
    type: String,
    enum: ['fullstack-mern', 'frontend-react', 'backend-node', 'partial-mern', 'unknown'],
    default: 'unknown'
  },
  validationResult: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  cleanupResult: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  aiSuggestions: {
  duplicates: [{
    issue: String,
    suggestion: String,
    priority: String,
    estimatedImpact: String
  }],
  hooks: [{
    issue: String,
    suggestion: String,
    priority: String,
    estimatedImpact: String
  }],
  propDrilling: [{
    issue: String,
    suggestion: String,
    priority: String,
    estimatedImpact: String
  }],
  codeQuality: [{
    issue: String,
    suggestion: String,
    priority: String,
    estimatedImpact: String
  }],
  generatedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
},
  // ==================== CODE DUPLICATION ANALYSIS ====================
  duplicationAnalysis: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    startedAt: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    error: {
      type: String
    },
    results: {
      // Exact clone groups - identical code structure
      exactClones: [{
        groupId: {
          type: Number,
          required: true
        },
        hash: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['function', 'class', 'method', 'block'],
          required: true
        },
        duplicateCount: {
          type: Number,
          required: true
        },
        occurrences: [{
          type: {
            type: String,
            enum: ['function', 'class', 'method', 'block'],
            required: true
          },
          name: {
            type: String,
            required: true
          },
          file: {
            type: String,
            required: true
          },
          filePath: {
            type: String
          },
          startLine: {
            type: Number,
            required: true
          },
          endLine: {
            type: Number,
            required: true
          },
          lineCount: {
            type: Number,
            required: true
          },
          loc: {
            type: mongoose.Schema.Types.Mixed
          }
        }]
      }],
      
      // Near clone groups - similar code (80%+ similarity)
      nearClones: [{
        groupId: {
          type: Number,
          required: true
        },
        type: {
          type: String,
          enum: ['function', 'class', 'method', 'block'],
          required: true
        },
        similarity: {
          type: Number,
          required: true,
          min: 0,
          max: 1
        },
        occurrences: [{
          type: {
            type: String,
            enum: ['function', 'class', 'method', 'block'],
            required: true
          },
          name: {
            type: String,
            required: true
          },
          file: {
            type: String,
            required: true
          },
          filePath: {
            type: String
          },
          startLine: {
            type: Number,
            required: true
          },
          endLine: {
            type: Number,
            required: true
          },
          lineCount: {
            type: Number,
            required: true
          },
          loc: {
            type: mongoose.Schema.Types.Mixed
          }
        }]
      }],
      
      // Statistics summary
      stats: {
        totalFiles: {
          type: Number,
          default: 0
        },
        totalUnits: {
          type: Number,
          default: 0
        },
        exactCloneGroups: {
          type: Number,
          default: 0
        },
        nearCloneGroups: {
          type: Number,
          default: 0
        },
        duplicatedUnits: {
          type: Number,
          default: 0
        }
      }
    }
  },
  
  // Analysis results (legacy - keeping for backward compatibility)
  analysisReport: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  codeQualityAnalysis: {
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    startedAt: Date,
    completedAt: Date,
    error: String,
    results: {
      // 1. API Route Issues
      apiRouteIssues: [{
        type: {
          type: String,
          enum: ['deeply-nested-route', 'excessive-async-operations']
        },
        severity: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low']
        },
        filePath: String,
        startLine: Number,
        routeMethod: String,
        routePath: String,
        nestingDepth: Number,
        asyncOperations: Number,
        dbQueries: Number,
        message: String,
        recommendation: String
      }],

      // 2. Mongoose Query Issues
      mongooseQueryIssues: [{
        type: {
          type: String,
          enum: ['unoptimized-mongoose-query']
        },
        severity: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low']
        },
        filePath: String,
        startLine: Number,
        queryMethod: String,
        chain: String,
        message: String,
        recommendation: String,
        example: String
      }],

      // 3. Redundant Query Issues
      redundantQueryIssues: [{
        type: {
          type: String,
          enum: ['redundant-database-query']
        },
        severity: {
          type: String,
          enum: ['critical', 'high', 'medium', 'low']
        },
        filePath: String,
        functionName: String,
        queryPattern: String,
        occurrences: Number,
        lines: [Number],
        message: String,
        recommendation: String,
        example: String
      }],

      // Statistics
      stats: {
        totalFiles: Number,
        filesWithIssues: Number,
        totalIssuesFound: Number,
        criticalIssues: Number,
        highIssues: Number,
        mediumIssues: Number,
        lowIssues: Number,
        routeCount: Number,
        queryPatterns: [{
          method: String,
          chain: String,
          optimized: Boolean,
          startLine: Number
        }]
      }
    }
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  propDrillingAnalysis: {
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  startedAt: Date,
  completedAt: Date,
  results: {
    stats: {
      totalFiles: Number,
      totalComponents: Number,
      filesWithErrors: Number
    },
    propDrillingIssues: [{
      prop: String,
      severity: String,
      depth: Number,  // Changed from chainLength to depth
      
      // NEW: Add locations object
      locations: {
        source: {
          component: String,
          file: String,
          line: Number
        },
        drillingPoints: [{
          component: String,
          file: String,
          line: Number,
          issue: String,
          description: String,
          passedTo: String
        }],
        finalDestination: {
          component: String,
          file: String,
          line: Number,
          usedHere: Boolean
        }
      },
      
      // NEW: Change recommendation from String to Object
      recommendation: {
        solution: String,
        reason: String,
        steps: [String]
      },
      
      // Keep fullChain for complete reference
      fullChain: [{
        component: String,
        file: String,
        line: Number,
        usedHere: Boolean,
        passedTo: String
      }]
    }],
    summary: {
      totalIssues: Number,
      highSeverity: Number,
      mediumSeverity: Number,
      lowSeverity: Number,
      affectedProps: Number,      // NEW
      affectedFiles: Number,      // NEW
      deepestChain: Number,       // NEW
      totalDrillingPoints: Number // NEW
    },
    chains: mongoose.Schema.Types.Mixed,
    chainStats: mongoose.Schema.Types.Mixed
  },
  error: String
}
}, {
  // Enable automatic timestamps
  timestamps: true
});

// Update timestamp on save
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for duplication percentage
projectSchema.virtual('duplicationPercentage').get(function() {
  if (!this.duplicationAnalysis?.results?.stats) {
    return 0;
  }
  
  const { totalUnits, duplicatedUnits } = this.duplicationAnalysis.results.stats;
  
  if (totalUnits === 0) return 0;
  
  return ((duplicatedUnits / totalUnits) * 100).toFixed(2);
});

// Virtual for total clone groups
projectSchema.virtual('totalCloneGroups').get(function() {
  if (!this.duplicationAnalysis?.results?.stats) {
    return 0;
  }
  
  const { exactCloneGroups, nearCloneGroups } = this.duplicationAnalysis.results.stats;
  
  return exactCloneGroups + nearCloneGroups;
});

// Method to get duplication summary
projectSchema.methods.getDuplicationSummary = function() {
  if (!this.duplicationAnalysis?.results) {
    return null;
  }
  
  const { stats, exactClones, nearClones } = this.duplicationAnalysis.results;
  
  return {
    totalFiles: stats.totalFiles,
    totalUnits: stats.totalUnits,
    duplicatedUnits: stats.duplicatedUnits,
    duplicationPercentage: this.duplicationPercentage,
    exactCloneGroups: stats.exactCloneGroups,
    nearCloneGroups: stats.nearCloneGroups,
    totalCloneGroups: this.totalCloneGroups,
    status: this.duplicationAnalysis.status,
    completedAt: this.duplicationAnalysis.completedAt,
    // Top 5 most duplicated files
    topDuplicatedFiles: this.getTopDuplicatedFiles(5)
  };
};

// Method to get top duplicated files
projectSchema.methods.getTopDuplicatedFiles = function(limit = 5) {
  if (!this.duplicationAnalysis?.results) {
    return [];
  }
  
  const fileDuplicates = new Map();
  
  // Count duplicates per file from exact clones
  this.duplicationAnalysis.results.exactClones?.forEach(group => {
    group.occurrences.forEach(occ => {
      const count = fileDuplicates.get(occ.file) || 0;
      fileDuplicates.set(occ.file, count + 1);
    });
  });
  
  // Count duplicates per file from near clones
  this.duplicationAnalysis.results.nearClones?.forEach(group => {
    group.occurrences.forEach(occ => {
      const count = fileDuplicates.get(occ.file) || 0;
      fileDuplicates.set(occ.file, count + 0.5); // Half weight for near clones
    });
  });
  
  // Sort and return top files
  return Array.from(fileDuplicates.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([file, count]) => ({
      file,
      duplicateCount: Math.round(count)
    }));
};

// Method to check if analysis is complete
projectSchema.methods.isAnalysisComplete = function() {
  return this.duplicationAnalysis?.status === 'completed';
};

// Method to check if analysis has results
projectSchema.methods.hasAnalysisResults = function() {
  return !!(
    this.duplicationAnalysis?.results &&
    (this.duplicationAnalysis.results.exactClones?.length > 0 ||
     this.duplicationAnalysis.results.nearClones?.length > 0)
  );
};

// Add indexes for efficient queries
projectSchema.index({ user: 1, createdAt: -1 });
projectSchema.index({ user: 1, 'githubInfo.repositoryId': 1 });
projectSchema.index({ sonarQubeProjectKey: 1 });
projectSchema.index({ user: 1, analysisStatus: 1 });
projectSchema.index({ user: 1, 'duplicationAnalysis.status': 1 });
projectSchema.index({ 'duplicationAnalysis.completedAt': -1 });

// Ensure virtuals are included when converting to JSON
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema);