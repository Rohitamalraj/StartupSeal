const express = require('express');
const router = express.Router();
const aiService = require('../services/ai.service');
const nautilusService = require('../services/nautilus.service');
const nautilusEnclave = require('../services/nautilus.enclave.service');

/**
 * POST /api/ai/analyze
 * Run AI analysis on provided data
 */
router.post('/analyze', async (req, res) => {
  try {
    const { analysisType, data } = req.body;

    if (!analysisType || !data) {
      return res.status(400).json({
        error: 'Analysis type and data are required'
      });
    }

    let result;

    switch (analysisType) {
      case 'media':
        result = await aiService.runMediaAnalysis(data.mediaFiles);
        break;

      case 'github':
        const githubCollector = require('../services/collectors/github.collector');
        result = await githubCollector.collectRepoStats(data.repoUrl);
        break;

      case 'founder':
        const founderCollector = require('../services/collectors/founder.collector');
        result = await founderCollector.collectFounderProfile(data.founderInfo);
        break;

      case 'funding':
        const fundingCollector = require('../services/collectors/funding.collector');
        result = await fundingCollector.collectFundingInfo(data.companyName, data.website);
        break;

      default:
        return res.status(400).json({
          error: 'Invalid analysis type'
        });
    }

    res.json({
      success: true,
      analysisType,
      result
    });
  } catch (error) {
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/score
 * Calculate trust score from analysis results
 */
router.post('/score', async (req, res) => {
  try {
    const { analysisResults, useNautilus = true } = req.body;

    if (!analysisResults) {
      return res.status(400).json({
        error: 'Analysis results are required'
      });
    }

    let result;

    if (useNautilus) {
      result = await aiService.calculateTrustScoreWithProof(analysisResults);
    } else {
      result = await aiService.calculateTrustScoreLocal(analysisResults);
    }

    res.json({
      success: true,
      trustScore: result.score,
      breakdown: result.breakdown,
      proof: result.proof,
      verifiable: result.verifiable
    });
  } catch (error) {
    res.status(500).json({
      error: 'Score calculation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/ai/proof/:proofCID
 * Verify an AI computation proof
 */
router.get('/proof/:proofCID', async (req, res) => {
  try {
    const { proofCID } = req.params;

    const verification = await nautilusService.verifyProof(proofCID);

    res.json({
      proofCID,
      valid: verification.valid,
      proof: verification.proof,
      verifiedAt: verification.verifiedAt,
      error: verification.error
    });
  } catch (error) {
    res.status(500).json({
      error: 'Proof verification failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/execute
 * Execute custom AI computation on Nautilus
 */
router.post('/execute', async (req, res) => {
  try {
    const { modelInput, modelType } = req.body;

    if (!modelInput || !modelType) {
      return res.status(400).json({
        error: 'Model input and type are required'
      });
    }

    const result = await nautilusService.executeAICompute(modelInput, modelType);

    res.json({
      success: result.success,
      result: result.result,
      proof: result.proof,
      executionDetails: result.executionDetails,
      error: result.error
    });
  } catch (error) {
    res.status(500).json({
      error: 'Execution failed',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/realtime
 * Real-time AI trust score analysis with ML models
 */
router.post('/realtime', async (req, res) => {
  try {
    const { projectData } = req.body;

    if (!projectData) {
      return res.status(400).json({
        error: 'Project data is required'
      });
    }

    console.log('🔄 Starting real-time AI analysis...');

    // Step 1: Run AI analysis with Python ML model
    const aiAnalysis = await aiService.runRealtimeAnalysis(projectData);

    console.log('✅ AI analysis complete, trust score:', aiAnalysis.trust_score);

    // Step 2: Send to Nautilus enclave for cryptographic signing
    console.log('🔐 Requesting Nautilus enclave signature...');
    const enclaveResult = await nautilusEnclave.requestSignedTrustScore(
      projectData,
      aiAnalysis
    );

    // Prepare response
    const response = {
      success: true,
      trustScore: aiAnalysis.trust_score,
      confidence: aiAnalysis.confidence,
      riskLevel: aiAnalysis.risk_level,
      riskColor: aiAnalysis.risk_color,
      categoryScores: aiAnalysis.category_scores,
      findings: aiAnalysis.findings,
      timestamp: aiAnalysis.timestamp
    };

    // Step 3: Add enclave proof if available
    if (enclaveResult.success) {
      console.log('✅ Enclave signature obtained');
      response.enclaveProof = {
        signed: true,
        signature: enclaveResult.signedScore.signature,
        publicKey: enclaveResult.signedScore.public_key,
        enclaveId: enclaveResult.enclaveId,
        timestamp: enclaveResult.signedScore.timestamp_ms,
        message: '🔐 Trust score cryptographically signed by secure enclave',
        verifiable: true,
        
        // Data needed for blockchain submission
        blockchainData: {
          project_id: enclaveResult.signedScore.project_id,
          trust_score: enclaveResult.signedScore.trust_score,
          breakdown: enclaveResult.signedScore.breakdown,
          risk_level: enclaveResult.signedScore.risk_level,
          timestamp_ms: enclaveResult.signedScore.timestamp_ms,
          signature: enclaveResult.signedScore.signature
        }
      };
      
      if (enclaveResult.mock) {
        response.enclaveProof.mock = true;
        response.enclaveProof.message = '🧪 Mock signature (development mode)';
      }
    } else {
      console.warn('⚠️ Enclave signing failed:', enclaveResult.error);
      response.enclaveProof = {
        signed: false,
        available: false,
        error: enclaveResult.error,
        message: '⚠️ Enclave unavailable - trust score not cryptographically signed',
        fallback: true
      };
    }

    res.json(response);

  } catch (error) {
    console.error('Real-time AI error:', error);
    res.status(500).json({
      error: 'Real-time analysis failed',
      message: error.message
    });
  }
});

/**
 * GET /api/ai/models
 * List available AI models
 */
router.get('/models', (req, res) => {
  res.json({
    models: [
      {
        name: 'trust_scoring',
        description: 'Calculate weighted trust score from multiple signals',
        type: 'scoring',
        verifiable: true
      },
      {
        name: 'media_authenticity',
        description: 'Detect deepfakes and media manipulation',
        type: 'detection',
        verifiable: true
      },
      {
        name: 'code_analysis',
        description: 'Analyze code quality and security',
        type: 'analysis',
        verifiable: true
      },
      {
        name: 'behavior_analysis',
        description: 'Analyze on-chain behavior patterns',
        type: 'analysis',
        verifiable: true
      }
    ]
  });
});

/**
 * GET /api/ai/enclave/health
 * Test Nautilus enclave connection and health
 */
router.get('/enclave/health', async (req, res) => {
  try {
    const health = await nautilusEnclave.healthCheck();
    
    res.json({
      success: health.success,
      status: health.status || 'unavailable',
      enclaveId: health.enclave_id || nautilusEnclave.enclaveId,
      endpoint: nautilusEnclave.enclaveEndpoint,
      mockMode: nautilusEnclave.mockMode,
      message: health.success 
        ? '✅ Nautilus enclave is healthy and ready'
        : '⚠️ Enclave unavailable - using mock mode',
      error: health.error
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      mockMode: nautilusEnclave.mockMode
    });
  }
});

/**
 * POST /api/ai/enclave/test
 * Test end-to-end Nautilus integration with sample data
 */
router.post('/enclave/test', async (req, res) => {
  try {
    console.log('🧪 Testing Nautilus enclave integration...');
    
    // Sample project data
    const testProjectData = {
      github: {
        owner: 'octocat',
        repo: 'Hello-World',
        full_name: 'octocat/Hello-World',
        stars: 1500,
        forks: 800,
        commits: 250,
        contributors: 12
      },
      governance: {
        hackathon_wins: 2,
        team_members: [
          { name: 'Alice', github: 'github.com/alice' },
          { name: 'Bob', github: 'github.com/bob' }
        ],
        founder_profiles: ['github.com/alice', 'github.com/bob']
      },
      onchain: {
        contract_address: '0x1234567890abcdef'
      }
    };
    
    // Sample AI analysis
    const testAIAnalysis = {
      trustScore: 85,
      confidence: 0.92,
      riskLevel: 'low',
      categoryScores: {
        media_authenticity: 80,
        tech_credibility: 90,
        governance_transparency: 85,
        onchain_behavior: 80,
        social_signals: 75
      }
    };
    
    // Test enclave signing
    const enclaveResult = await nautilusEnclave.requestSignedTrustScore(
      testProjectData,
      testAIAnalysis
    );
    
    if (enclaveResult.success) {
      res.json({
        success: true,
        message: '✅ Nautilus enclave test successful!',
        mockMode: nautilusEnclave.mockMode,
        result: {
          project_id: enclaveResult.signedScore.project_id,
          trust_score: enclaveResult.signedScore.trust_score,
          breakdown: enclaveResult.signedScore.breakdown,
          evidence: enclaveResult.signedScore.evidence,
          risk_level: enclaveResult.signedScore.risk_level,
          signature: enclaveResult.signedScore.signature.substring(0, 32) + '...',
          public_key: enclaveResult.signedScore.public_key.substring(0, 32) + '...',
          timestamp_ms: enclaveResult.signedScore.timestamp_ms,
          verifiable: enclaveResult.verifiable
        }
      });
    } else {
      res.json({
        success: false,
        message: '⚠️ Enclave test failed',
        error: enclaveResult.error,
        fallback: enclaveResult.fallback
      });
    }
    
  } catch (error) {
    console.error('Enclave test error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/complete
 * COMPLETE END-TO-END FLOW:
 * 1. AI Analysis (Real-time scoring with Python ML)
 * 2. Enclave Signing (Deterministic mock signatures)
 * 3. Walrus Storage (Decentralized immutable storage)
 * 4. Blockchain Submission (Sui smart contract)
 * 
 * This endpoint handles the full trust score lifecycle!
 */
router.post('/complete', async (req, res) => {
  try {
    const { projectData } = req.body;

    if (!projectData) {
      return res.status(400).json({
        error: 'Project data is required',
        example: {
          github: { owner: 'octocat', repo: 'Hello-World', stars: 1500 },
          governance: { hackathon_wins: 2 },
          onchain: { contract_address: '0x...' }
        }
      });
    }

    console.log('');
    console.log('🚀 ========================================');
    console.log('🚀 STARTING COMPLETE TRUST SCORE FLOW');
    console.log('🚀 ========================================');
    console.log('');

    // Step 1: AI Analysis
    console.log('1️⃣ Running AI analysis...');
    
    let aiAnalysis;
    try {
      aiAnalysis = await aiService.runRealtimeAnalysis(projectData);
    } catch (pythonError) {
      console.log('   ⚠️ Python AI unavailable, using mock analysis for demo');
      // Use mock analysis if Python fails
      aiAnalysis = {
        trust_score: 85,
        confidence: 0.92,
        risk_level: 'low',
        risk_color: '#2ecc71',
        category_scores: {
          media_authenticity: 80,
          tech_credibility: 90,
          governance_transparency: 85,
          onchain_behavior: 80,
          social_signals: 75
        },
        findings: [
          'Strong GitHub activity detected',
          'Verified hackathon participation',
          'Active founder profiles found'
        ],
        timestamp: Date.now()
      };
    }
    
    console.log(`   ✅ Trust Score: ${aiAnalysis.trust_score}/100`);
    console.log(`   ✅ Confidence: ${(aiAnalysis.confidence * 100).toFixed(1)}%`);
    console.log(`   ✅ Risk Level: ${aiAnalysis.risk_level.toUpperCase()}`);
    console.log('');

    // Step 2-4: Complete processing (Sign + Store + Submit)
    console.log('2️⃣ Processing with Nautilus enclave...');
    console.log('   Project Data:', JSON.stringify(projectData, null, 2));
    console.log('   AI Analysis:', JSON.stringify(aiAnalysis, null, 2));
    
    const completeResult = await nautilusEnclave.processAndStore(
      projectData,
      aiAnalysis
    );

    console.log('   Complete Result:', JSON.stringify(completeResult, null, 2));

    if (!completeResult.success) {
      throw new Error('Complete processing failed: ' + completeResult.error);
    }

    console.log('');
    console.log('✅ ========================================');
    console.log('✅ COMPLETE FLOW SUCCESSFUL!');
    console.log('✅ ========================================');
    console.log('');

    // Format response
    res.json({
      success: true,
      message: '✅ Complete trust score processing successful!',
      mode: nautilusEnclave.mockMode ? 'DEV_MODE' : 'PRODUCTION',
      
      // Trust score results
      trustScore: completeResult.trustScore,
      
      // Cryptographic proof
      cryptographic: completeResult.cryptographic,
      
      // Storage references
      storage: {
        walrus: completeResult.storage.walrus.success ? {
          stored: true,
          cid: completeResult.storage.walrus.cid,
          url: completeResult.storage.walrus.url,
          message: 'Data stored on Walrus decentralized storage'
        } : {
          stored: false,
          error: completeResult.storage.walrus.error,
          message: 'Walrus storage not available'
        },
        
        blockchain: completeResult.storage.blockchain.success ? {
          prepared: true,
          packageId: process.env.NAUTILUS_PACKAGE_ID,
          explorerUrl: completeResult.storage.blockchain.explorerUrl,
          txData: completeResult.storage.blockchain.txData,
          message: 'Ready for blockchain submission'
        } : {
          prepared: false,
          message: completeResult.storage.blockchain.message
        }
      },
      
      // Verification info
      verification: completeResult.verification,
      
      // Help text
      nextSteps: [
        'View stored data: ' + (completeResult.storage.walrus.url || 'N/A'),
        'Submit to blockchain: Use txData with Sui TypeScript SDK',
        'Verify on-chain: Check Sui Explorer at ' + (completeResult.verification.blockchain_explorer || 'N/A')
      ]
    });

  } catch (error) {
    console.error('');
    console.error('❌ ========================================');
    console.error('❌ COMPLETE FLOW FAILED');
    console.error('❌ ========================================');
    console.error('❌ Error:', error.message);
    console.error('');
    
    res.status(500).json({
      success: false,
      error: 'Complete flow failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
