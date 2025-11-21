const githubCollector = require('./collectors/github.collector');
const hackathonCollector = require('./collectors/hackathon.collector');
const founderCollector = require('./collectors/founder.collector');
const fundingCollector = require('./collectors/funding.collector');
const nautilusService = require('./nautilus.service');
const walrusService = require('./walrus.service');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class AIService {
  /**
   * Main orchestration method - runs complete AI analysis pipeline
   */
  async runCompleteAnalysis(projectData) {
    try {
      console.log('Starting complete AI analysis pipeline...');

      // Step 1: Collect all data from multiple sources
      const collectedData = await this.collectAllData(projectData);

      // Step 2: Run AI analysis pipelines
      const analysisResults = await this.runAnalysisPipelines(collectedData, projectData);

      // Step 3: Calculate trust score with Nautilus proof
      const trustScoreResult = await this.calculateTrustScoreWithProof(analysisResults);

      // Step 4: Store results on Walrus
      const storedResults = await this.storeResults(trustScoreResult, analysisResults);

      return {
        success: true,
        trustScore: trustScoreResult,
        analysis: analysisResults,
        storage: storedResults,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Collect data from all sources
   */
  async collectAllData(projectData) {
    console.log('Collecting data from all sources...');

    const {
      githubRepo,
      hackathonName,
      projectName,
      founderInfo,
      companyName,
      website,
      mediaFiles
    } = projectData;

    // Collect in parallel for efficiency
    const [
      githubData,
      hackathonData,
      founderData,
      fundingData
    ] = await Promise.all([
      githubRepo ? githubCollector.collectRepoStats(githubRepo) : null,
      hackathonName ? hackathonCollector.verifyHackathonWin(projectName, hackathonName) : null,
      founderInfo ? founderCollector.collectFounderProfile(founderInfo) : null,
      companyName ? fundingCollector.collectFundingInfo(companyName, website) : null
    ]);

    return {
      github: githubData,
      hackathon: hackathonData,
      founder: founderData,
      funding: fundingData,
      media: mediaFiles
    };
  }

  /**
   * Run all AI analysis pipelines
   */
  async runAnalysisPipelines(collectedData, projectData) {
    console.log('Running AI analysis pipelines...');

    const results = {};

    // Media analysis (if media files provided)
    if (collectedData.media && collectedData.media.length > 0) {
      results.media_analysis = await this.runMediaAnalysis(collectedData.media);
    }

    // GitHub analysis
    if (collectedData.github?.success) {
      results.github_analysis = collectedData.github.data;
    }

    // Founder analysis
    if (collectedData.founder?.success) {
      results.founder_analysis = collectedData.founder.data;
    }

    // Governance analysis
    results.governance_analysis = await this.analyzeGovernance(collectedData);

    // On-chain analysis (if contract address provided)
    if (projectData.contractAddress) {
      results.onchain_analysis = await this.analyzeOnChainBehavior(projectData.contractAddress);
    }

    // Social signals analysis
    results.social_analysis = await this.analyzeSocialSignals(collectedData);

    return results;
  }

  /**
   * Run media authenticity analysis
   */
  async runMediaAnalysis(mediaFiles) {
    try {
      // Call Python media pipeline
      const scriptPath = './ai/pipelines/media_pipeline.py';
      
      const results = [];
      for (const mediaFile of mediaFiles) {
        // Store on Walrus first
        const walrusResult = await walrusService.storeFile(mediaFile.path, {
          type: mediaFile.type,
          projectId: mediaFile.projectId
        });

        // Run AI analysis
        const { stdout } = await execAsync(
          `python ${scriptPath} --file "${mediaFile.path}" --type "${mediaFile.type}"`
        );

        const analysis = JSON.parse(stdout);
        
        results.push({
          file: mediaFile.path,
          walrusCID: walrusResult.cid,
          walrusHash: walrusResult.hash,
          analysis
        });
      }

      return {
        files_analyzed: results.length,
        results,
        deepfake_confidence: this.avgScore(results, 'analysis.deepfake_confidence'),
        metadata_integrity: this.avgScore(results, 'analysis.metadata_integrity'),
        provenance_verified: results.every(r => walrusResult.success)
      };
    } catch (error) {
      console.error('Media analysis error:', error);
      return { error: error.message };
    }
  }

  /**
   * Analyze governance and transparency
   */
  async analyzeGovernance(collectedData) {
    const score = {
      team_verified: false,
      governance_activity: 0.5,
      transparency_score: 0.5
    };

    // Team verification based on founder data
    if (collectedData.founder?.success) {
      const founderScore = collectedData.founder.data.score?.total || 0;
      score.team_verified = founderScore > 50;
      score.transparency_score = founderScore / 100;
    }

    // Governance activity from GitHub
    if (collectedData.github?.success) {
      const metrics = collectedData.github.data.metrics;
      score.governance_activity = (
        metrics.activityScore * 0.4 +
        metrics.maintenanceScore * 0.6
      );
    }

    return score;
  }

  /**
   * Analyze on-chain behavior
   */
  async analyzeOnChainBehavior(contractAddress) {
    // Placeholder - would integrate with blockchain explorers
    return {
      transaction_pattern: {
        normalcy_score: 0.72
      },
      rug_pull_risk: 0.15,
      contract_security: 0.80,
      historical_score: 0.75
    };
  }

  /**
   * Analyze social signals
   */
  async analyzeSocialSignals(collectedData) {
    const signals = {
      bot_percentage: 25,
      engagement_rate: 0.5,
      sentiment_score: 0.0,
      growth_rate: 0.5
    };

    // Use Twitter data if available
    if (collectedData.founder?.data?.twitter) {
      const twitter = collectedData.founder.data.twitter;
      signals.engagement_rate = twitter.engagement || 0.5;
      signals.bot_percentage = 20; // Would use bot detection AI
    }

    // Use GitHub community data
    if (collectedData.github?.data) {
      const github = collectedData.github.data;
      const communityScore = github.metrics?.communityScore || 0.5;
      signals.growth_rate = communityScore;
      signals.sentiment_score = communityScore * 2 - 1; // Convert to -1 to 1
    }

    return signals;
  }

  /**
   * Calculate trust score with Nautilus provable computation
   */
  async calculateTrustScoreWithProof(analysisResults) {
    try {
      console.log('Calculating trust score with Nautilus proof...');

      // Execute trust score calculation on Nautilus
      const result = await nautilusService.calculateTrustScoreWithProof(analysisResults);

      return {
        score: result.trustScore,
        breakdown: result.breakdown,
        proof: result.proof,
        verifiable: result.verifiable,
        analysisTimestamp: new Date().toISOString()
      };
    } catch (error) {
      // Fallback to local calculation if Nautilus unavailable
      console.log('Falling back to local trust score calculation');
      return await this.calculateTrustScoreLocal(analysisResults);
    }
  }

  /**
   * Local trust score calculation (fallback)
   */
  async calculateTrustScoreLocal(analysisResults) {
    try {
      const { execSync } = require('child_process');
      const fs = require('fs');

      // Write input to temp file
      const inputFile = '/tmp/trust_input.json';
      fs.writeFileSync(inputFile, JSON.stringify({ analysis_results: analysisResults }));

      // Execute Python calculator
      const output = execSync(
        `python ai/score/score_calculator.py < ${inputFile}`,
        { encoding: 'utf-8' }
      );

      const result = JSON.parse(output);

      return {
        score: result.trust_score,
        breakdown: result.category_scores,
        proof: null,
        verifiable: false,
        fallbackMode: true
      };
    } catch (error) {
      console.error('Local calculation error:', error);
      throw error;
    }
  }

  /**
   * Store results on Walrus
   */
  async storeResults(trustScoreResult, analysisResults) {
    try {
      // Store complete analysis
      const analysisStorage = await walrusService.storeData({
        trustScore: trustScoreResult,
        analysis: analysisResults,
        timestamp: new Date().toISOString()
      }, 'json');

      // Store proof separately if exists
      let proofStorage = null;
      if (trustScoreResult.proof) {
        proofStorage = await walrusService.storeData(
          trustScoreResult.proof,
          'json'
        );
      }

      return {
        analysisCID: analysisStorage.cid,
        proofCID: proofStorage?.cid,
        retrievalUrls: {
          analysis: analysisStorage.walrusUrl,
          proof: proofStorage?.walrusUrl
        }
      };
    } catch (error) {
      console.error('Storage error:', error);
      return { error: error.message };
    }
  }

  /**
   * Verify media authenticity using Walrus
   */
  async verifyMediaAuthenticity(cid, mediaFile = null) {
    try {
      // Retrieve file info from Walrus
      const fileInfo = await walrusService.getFileInfo(cid);

      if (!fileInfo.success) {
        return {
          verified: false,
          error: 'File not found on Walrus'
        };
      }

      // If media file provided, check for manipulation
      if (mediaFile) {
        const manipulation = await walrusService.detectManipulation(cid, mediaFile);
        return {
          verified: !manipulation.manipulated,
          ...manipulation,
          fileInfo
        };
      }

      return {
        verified: true,
        fileInfo,
        message: 'File exists on Walrus with valid provenance'
      };
    } catch (error) {
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Helper: Calculate average score from nested property
   */
  avgScore(results, propertyPath) {
    const values = results.map(r => {
      const value = propertyPath.split('.').reduce((obj, key) => obj?.[key], r);
      return value || 0;
    });
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * REAL-TIME AI ANALYSIS - Dynamic ML-based scoring
   * This is the NEW method that uses actual Python ML models
   */
  async runRealtimeAnalysis(projectData) {
    const fs = require('fs').promises;
    const path = require('path');
    const os = require('os');
    
    try {
      console.log('🤖 Starting real-time AI analysis...');

      // Prepare data for Python AI
      const aiInput = {
        github: projectData.github,
        social: projectData.social || {},
        founder: projectData.founder,
        governance: projectData.governance || {},
        onchain: projectData.onchain || {},
        media: projectData.media || {}
      };

      // Write to temporary file to avoid command-line escaping issues
      const tempFile = path.join(os.tmpdir(), `ai_input_${Date.now()}.json`);
      await fs.writeFile(tempFile, JSON.stringify(aiInput));

      try {
        // Execute Python AI scorer with file input
        const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
        const { stdout, stderr } = await execAsync(
          `${pythonPath} ai/realtime_scorer.py --file "${tempFile}"`
        );

        // Clean up temp file
        await fs.unlink(tempFile).catch(() => {});

        if (stderr && stderr.trim()) {
          console.warn('Python warnings:', stderr);
        }

        const result = JSON.parse(stdout);

        if (!result.success) {
          throw new Error(result.error || 'AI analysis failed');
        }

        console.log('✅ Real-time AI analysis complete');
        console.log('   Trust Score:', result.result.trust_score);
        console.log('   Risk Level:', result.result.risk_level);
        return result.result;

      } catch (pythonError) {
        // Clean up temp file on error
        await fs.unlink(tempFile).catch(() => {});
        throw pythonError;
      }

    } catch (error) {
      console.error('❌ Real-time AI analysis error:', error);
      throw error;
    }
  }

}

module.exports = new AIService();
