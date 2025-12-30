const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/repository');
const MainAnalyzer = require('../services/smells/hooks');


router.post('/:projectId/analyze', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    let project = await Project.findOne({
      _id: projectId,
      user: req.user.userId || req.user.user_id
    }).lean();
    
    // If still undefined, get it directly from MongoDB
    if (project && !project.extractedPath) {
      const rawProject = await Project.collection.findOne({ _id: project._id });
      if (rawProject?.extractedPath) {
        project.extractedPath = rawProject.extractedPath;
      }
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if project has been extracted
    if (!project.extractedPath) {
      return res.status(400).json({
        success: false,
        message: 'Project has not been extracted yet'
      });
    }

    // Update project status - need to get non-lean version for save()
    const projectDoc = await Project.findById(projectId);
    projectDoc.analysisStatus = 'processing';
    await projectDoc.save();
    
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
