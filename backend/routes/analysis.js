// routes/analysis.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/repository');
const MainAnalyzer = require('../services/smells/hooks');

/**
 * POST /api/analysis/:projectId/analyze
 * Trigger analysis for a project
 */
router.post('/:projectId/analyze', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log('🔍 Analysis request received for project:', projectId);
    console.log('👤 User ID:', req.user?.userId || req.user?.user_id);

    // Find project and verify ownership - use lean() to bypass Mongoose cache
    let project = await Project.findOne({
      _id: projectId,
      user: req.user.userId || req.user.user_id
    }).lean();

    console.log('📦 Project found:', project ? 'Yes' : 'No');
    if (project) {
      console.log('📁 Extracted path:', project.extractedPath);
      console.log('📊 Project owner:', project.user);
    }
    
    // If still undefined, get it directly from MongoDB
    if (project && !project.extractedPath) {
      console.log('⚠️  extractedPath is undefined, fetching directly from MongoDB...');
      const rawProject = await Project.collection.findOne({ _id: project._id });
      console.log('📁 Raw extractedPath from MongoDB:', rawProject?.extractedPath);
      if (rawProject?.extractedPath) {
        project.extractedPath = rawProject.extractedPath;
        console.log('✅ Used extractedPath from raw query');
      }
    }

    if (!project) {
      console.log('❌ Project not found or user does not have access');
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if project has been extracted
    if (!project.extractedPath) {
      console.log('❌ Project has no extractedPath');
      return res.status(400).json({
        success: false,
        message: 'Project has not been extracted yet'
      });
    }

    // Update project status - need to get non-lean version for save()
    const projectDoc = await Project.findById(projectId);
    projectDoc.analysisStatus = 'processing';
    await projectDoc.save();

    // Run analysis with timeout protection
    console.log(`Starting analysis for project: ${projectDoc.projectName || project.projectName}`);
    console.log(`Project path: ${project.extractedPath}`);
    
    const analyzer = new MainAnalyzer(project.extractedPath);
    
    // Set a timeout of 2 minutes (120 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timeout after 2 minutes')), 120000);
    });
    
    const analysisResult = await Promise.race([
      analyzer.analyze(),
      timeoutPromise
    ]);

    // Save analysis results
    projectDoc.analysisReport = {
      summary: analysisResult.summary,
      violations: analysisResult.violations,
      analyzers: analysisResult.analyzers,
      metadata: analysisResult.metadata
    };
    projectDoc.analysisStatus = 'completed';
    await projectDoc.save();

    console.log(`✓ Analysis complete for ${projectDoc.projectName}: ${analysisResult.summary.totalViolations} violations found`);

    res.json({
      success: true,
      message: 'Analysis completed successfully',
      summary: analysisResult.summary,
      violations: analysisResult.violations.slice(0, 10) // Return first 10
    });

  } catch (error) {
    console.error('Analysis error:', error);

    // Update project status to failed
    try {
      const project = await Project.findById(req.params.projectId);
      if (project) {
        project.analysisStatus = 'failed';
        await project.save();
      }
    } catch (updateError) {
      console.error('Failed to update project status:', updateError);
    }

    res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
});

/**
 * GET /api/analysis/:projectId
 * Get analysis results for a project
 */
router.get('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      user: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.analysisStatus === 'pending' || project.analysisStatus === 'processing') {
      return res.json({
        success: true,
        status: project.analysisStatus,
        message: `Analysis is ${project.analysisStatus}`
      });
    }

    if (project.analysisStatus === 'failed') {
      return res.json({
        success: false,
        status: 'failed',
        message: 'Analysis failed'
      });
    }

    res.json({
      success: true,
      status: 'completed',
      project: {
        id: project._id,
        name: project.projectName,
        source: project.source
      },
      analysis: project.analysisReport
    });

  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis results'
    });
  }
});

/**
 * GET /api/analysis/:projectId/violations/:severity
 * Get violations by severity
 */
router.get('/:projectId/violations/:severity', auth, async (req, res) => {
  try {
    const { projectId, severity } = req.params;

    const project = await Project.findOne({
      _id: projectId,
      user: req.user.userId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.analysisReport || !project.analysisReport.violations) {
      return res.json({
        success: true,
        violations: []
      });
    }

    const violations = project.analysisReport.violations.filter(
      v => v.severity === severity
    );

    res.json({
      success: true,
      severity,
      count: violations.length,
      violations
    });

  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch violations'
    });
  }
});

module.exports = router;
