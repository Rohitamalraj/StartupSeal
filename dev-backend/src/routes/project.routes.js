const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.service');
const Project = require('../models/project.model');
const mongoose = require('mongoose');
const memoryStore = require('../utils/memory-store');

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

/**
 * POST /api/projects/submit
 * Submit a new project for analysis
 */
router.post('/submit', async (req, res) => {
  try {
    const {
      projectName,
      githubRepo,
      hackathonName,
      contractAddress,
      founderInfo,
      companyName,
      website,
      mediaFiles
    } = req.body;

    // Validate required fields
    if (!projectName) {
      return res.status(400).json({
        error: 'Project name is required'
      });
    }

    console.log(`Processing project submission: ${projectName}`);

    // Run complete AI analysis
    const analysisResult = await aiService.runCompleteAnalysis({
      projectName,
      githubRepo,
      hackathonName,
      contractAddress,
      founderInfo,
      companyName,
      website,
      mediaFiles: mediaFiles || []
    });

    if (!analysisResult.success) {
      return res.status(500).json({
        error: 'Analysis failed',
        details: analysisResult.error
      });
    }

    let projectId;

    // Save to database or memory store
    if (isMongoConnected()) {
      const project = new Project({
        name: projectName,
        githubRepo,
        hackathonName,
        contractAddress,
        trustScore: analysisResult.trustScore.score,
        trustScoreBreakdown: analysisResult.trustScore.breakdown,
        analysisResults: analysisResult.analysis,
        proofCID: analysisResult.trustScore.proof?.proofCID,
        analysisCID: analysisResult.storage.analysisCID,
        verifiable: analysisResult.trustScore.verifiable,
        submittedAt: new Date()
      });
      await project.save();
      projectId = project._id;
    } else {
      // Use in-memory store
      const project = memoryStore.createProject({
        name: projectName,
        githubRepo,
        hackathonName,
        contractAddress,
        trustScore: analysisResult.trustScore.score,
        trustScoreBreakdown: analysisResult.trustScore.breakdown,
        analysisResults: analysisResult.analysis,
        proofCID: analysisResult.trustScore.proof?.proofCID,
        analysisCID: analysisResult.storage.analysisCID,
        verifiable: analysisResult.trustScore.verifiable,
        submittedAt: new Date()
      });
      projectId = project._id;
    }

    res.json({
      success: true,
      projectId: projectId,
      trustScore: analysisResult.trustScore.score,
      breakdown: analysisResult.trustScore.breakdown,
      riskLevel: getRiskLevel(analysisResult.trustScore.score),
      proofs: {
        proofCID: analysisResult.trustScore.proof?.proofCID,
        analysisCID: analysisResult.storage.analysisCID,
        onchainTxHash: analysisResult.trustScore.proof?.onchainTxHash
      },
      message: 'Project analyzed successfully',
      storageMode: isMongoConnected() ? 'mongodb' : 'memory'
    });
  } catch (error) {
    console.error('Project submission error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/projects/:projectId/score
 * Get trust score for a project
 */
router.get('/:projectId/score', async (req, res) => {
  try {
    const { projectId } = req.params;

    let project;
    if (isMongoConnected()) {
      project = await Project.findById(projectId);
    } else {
      project = memoryStore.getProject(projectId);
    }

    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    res.json({
      projectId: project._id || project.id,
      name: project.name,
      trustScore: project.trustScore,
      breakdown: project.trustScoreBreakdown,
      riskLevel: getRiskLevel(project.trustScore),
      verifiable: project.verifiable,
      proofs: {
        proofCID: project.proofCID,
        analysisCID: project.analysisCID
      },
      submittedAt: project.submittedAt,
      lastUpdated: project.updatedAt,
      storageMode: isMongoConnected() ? 'mongodb' : 'memory'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/projects/search
 * Search projects by name or criteria
 */
router.get('/search', async (req, res) => {
  try {
    const { query, minScore, maxScore, verifiedOnly } = req.query;

    let projects;

    if (isMongoConnected()) {
      const filter = {};

      if (query) {
        filter.$or = [
          { name: new RegExp(query, 'i') },
          { githubRepo: new RegExp(query, 'i') }
        ];
      }

      if (minScore) {
        filter.trustScore = { $gte: parseFloat(minScore) };
      }

      if (maxScore) {
        filter.trustScore = { ...filter.trustScore, $lte: parseFloat(maxScore) };
      }

      if (verifiedOnly === 'true') {
        filter.verifiable = true;
      }

      projects = await Project.find(filter)
        .select('name trustScore verifiable proofCID submittedAt')
        .sort({ trustScore: -1 })
        .limit(50);
    } else {
      // In-memory search
      projects = memoryStore.findProjects(query ? { name: query } : {});
      
      // Apply filters
      if (minScore) {
        projects = projects.filter(p => p.trustScore >= parseFloat(minScore));
      }
      if (maxScore) {
        projects = projects.filter(p => p.trustScore <= parseFloat(maxScore));
      }
      if (verifiedOnly === 'true') {
        projects = projects.filter(p => p.verifiable === true);
      }
      
      // Sort and limit
      projects = projects
        .sort((a, b) => b.trustScore - a.trustScore)
        .slice(0, 50);
    }

    res.json({
      count: projects.length,
      projects: projects.map(p => ({
        id: p._id || p.id,
        name: p.name,
        trustScore: p.trustScore,
        riskLevel: getRiskLevel(p.trustScore),
        verifiable: p.verifiable,
        proofCID: p.proofCID,
        submittedAt: p.submittedAt
      })),
      storageMode: isMongoConnected() ? 'mongodb' : 'memory'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/projects/:projectId/details
 * Get full project details including analysis
 */
router.get('/:projectId/details', async (req, res) => {
  try {
    const { projectId } = req.params;

    let project;
    if (isMongoConnected()) {
      project = await Project.findById(projectId);
    } else {
      project = memoryStore.getProject(projectId);
    }

    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    res.json({
      project: {
        id: project._id || project.id,
        name: project.name,
        githubRepo: project.githubRepo,
        hackathonName: project.hackathonName,
        contractAddress: project.contractAddress,
        trustScore: project.trustScore,
        breakdown: project.trustScoreBreakdown,
        riskLevel: getRiskLevel(project.trustScore),
        verifiable: project.verifiable,
        submittedAt: project.submittedAt
      },
      analysis: project.analysisResults,
      proofs: {
        proofCID: project.proofCID,
        analysisCID: project.analysisCID
      },
      storageMode: isMongoConnected() ? 'mongodb' : 'memory'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/projects/:projectId/reanalyze
 * Re-run analysis for a project
 */
router.post('/:projectId/reanalyze', async (req, res) => {
  try {
    const { projectId } = req.params;

    let project;
    if (isMongoConnected()) {
      project = await Project.findById(projectId);
    } else {
      project = memoryStore.getProject(projectId);
    }

    if (!project) {
      return res.status(404).json({
        error: 'Project not found'
      });
    }

    // Run analysis again
    const analysisResult = await aiService.runCompleteAnalysis({
      projectName: project.name,
      githubRepo: project.githubRepo,
      hackathonName: project.hackathonName,
      contractAddress: project.contractAddress,
      mediaFiles: []
    });

    // Update project
    const updates = {
      trustScore: analysisResult.trustScore.score,
      trustScoreBreakdown: analysisResult.trustScore.breakdown,
      analysisResults: analysisResult.analysis,
      proofCID: analysisResult.trustScore.proof?.proofCID,
      analysisCID: analysisResult.storage.analysisCID,
      updatedAt: new Date()
    };

    if (isMongoConnected()) {
      Object.assign(project, updates);
      await project.save();
    } else {
      memoryStore.updateProject(projectId, updates);
    }

    res.json({
      success: true,
      message: 'Project re-analyzed successfully',
      trustScore: updates.trustScore,
      breakdown: updates.trustScoreBreakdown,
      storageMode: isMongoConnected() ? 'mongodb' : 'memory'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Helper: Get risk level from score
 */
function getRiskLevel(score) {
  if (score >= 80) return 'LOW';
  if (score >= 60) return 'MEDIUM';
  if (score >= 40) return 'HIGH';
  return 'CRITICAL';
}

module.exports = router;
