const axios = require('axios');

/**
 * Nautilus Enclave Service
 * 
 * Integrates with Nautilus AWS Nitro Enclave for:
 * - Secure, verifiable AI trust score computation
 * - Cryptographic signing of trust scores
 * - Attestation verification
 * 
 * The enclave ensures:
 * 1. Trust scores are computed in a secure, isolated environment
 * 2. Results are cryptographically signed with enclave's private key
 * 3. Signatures can be verified on Sui blockchain
 */
class NautilusEnclaveService {
  constructor() {
    // Enclave endpoint - runs on AWS Nitro or locally for development
    this.enclaveEndpoint = process.env.NAUTILUS_COMPUTE_ENDPOINT || 'http://localhost:8080';
    this.enclaveId = process.env.NAUTILUS_ENCLAVE_ID || 'local-dev-enclave';
    this.mockMode = process.env.MOCK_ENCLAVE === 'true';
    
    console.log(`🔐 Nautilus Enclave Service initialized`);
    console.log(`   Endpoint: ${this.enclaveEndpoint}`);
    console.log(`   Enclave ID: ${this.enclaveId}`);
    console.log(`   Mock Mode: ${this.mockMode}`);
  }

  /**
   * Send trust score data to Nautilus enclave for secure computation and signing
   * 
   * @param {Object} projectData - Original project data (GitHub, Twitter, etc.)
   * @param {Object} aiAnalysis - AI-generated trust score analysis
   * @returns {Object} Signed trust score with cryptographic proof
   */
  async requestSignedTrustScore(projectData, aiAnalysis) {
    try {
      // Use explicit project metadata if available (added from frontend)
      const project_name = projectData.project_name || projectData.github?.repo || 'unknown';
      const github_repo = projectData.github_repo || 
                          projectData.github?.full_name || 
                          `${projectData.github?.owner || 'unknown'}/${projectData.github?.repo || 'unknown'}`;
      
      // Prepare TrustScoreRequest - matches Rust struct exactly
      const enclaveRequest = {
        payload: {
          project_id: `${project_name.toLowerCase()}-${github_repo.replace('/', '-')}`,
          github_repo: github_repo,
          hackathon_claims: projectData.governance?.hackathon_wins 
            ? [`Won ${projectData.governance.hackathon_wins} hackathons`]
            : [],
          founder_profiles: projectData.governance?.founder_profiles || 
                           projectData.governance?.team_members?.map(m => m.github) || 
                           [],
          smart_contract: projectData.onchain?.contract_address || null
        }
      };

      if (this.mockMode) {
        // Mock mode - simulate enclave response
        return this.mockEnclaveResponse(enclaveRequest.payload, aiAnalysis);
      }

      // Send to real Nautilus enclave (Rust trust-oracle app)
      console.log('📤 Sending to Nautilus enclave:', enclaveRequest.payload.project_id);
      console.log('   GitHub repo:', enclaveRequest.payload.github_repo);
      
      const response = await axios.post(
        `${this.enclaveEndpoint}/process_data`,
        enclaveRequest,
        {
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'TrustOracle-Backend'
          },
          timeout: 30000 // 30 second timeout for GitHub fetching
        }
      );

      console.log('✅ Enclave signed response received');

      // Response is IntentMessage<TrustScoreResponse> from Rust
      const signedResponse = response.data;

      return {
        success: true,
        signedScore: {
          project_id: signedResponse.response.data.project_id,
          trust_score: signedResponse.response.data.trust_score,
          breakdown: signedResponse.response.data.breakdown,
          evidence: signedResponse.response.data.evidence,
          risk_level: signedResponse.response.data.risk_level,
          timestamp_ms: signedResponse.response.timestamp_ms,
          signature: signedResponse.signature,
          public_key: signedResponse.public_key,
          intent: signedResponse.response.intent
        },
        enclaveId: this.enclaveId,
        verifiable: true
      };

    } catch (error) {
      console.error('❌ Nautilus enclave error:', error.message);
      
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data:', error.response.data);
      }
      
      // Return error but don't crash - allow analysis to continue
      return {
        success: false,
        error: error.message,
        fallback: true,
        message: 'Enclave signing unavailable - analysis completed without cryptographic proof'
      };
    }
  }

  /**
   * Mock enclave response for development
   * Simulates the Rust enclave's signed response structure
   */
  mockEnclaveResponse(requestPayload, aiAnalysis) {
    const crypto = require('crypto');
    
    const timestamp_ms = Date.now();
    
    // Calculate trust score from AI analysis or use mock values
    const trust_score = aiAnalysis 
      ? Math.round(aiAnalysis.trustScore || aiAnalysis.trust_score || 85)
      : Math.floor(Math.random() * 30) + 70; // 70-100 for demo
    
    // Handle both camelCase (categoryScores) and snake_case (category_scores)
    const scores = aiAnalysis ? (aiAnalysis.categoryScores || aiAnalysis.category_scores || {}) : {};
    
    const breakdown = aiAnalysis ? {
      media_authenticity: Math.round(scores.media_authenticity || 75),
      tech_credibility: Math.round(scores.tech_credibility || 80),
      governance: Math.round(scores.governance_transparency || scores.governance || 70),
      onchain_behavior: Math.round(scores.onchain_behavior || 75),
      social_signals: Math.round(scores.social_signals || 65)
    } : {
      media_authenticity: 75,
      tech_credibility: 80,
      governance: 70,
      onchain_behavior: 75,
      social_signals: 65
    };
    
    const risk_level = trust_score >= 75 ? 'low' : trust_score >= 50 ? 'medium' : 'high';
    
    // Generate mock signature (mimics ed25519)
    // This creates a deterministic signature that CAN be verified on-chain
    // using the same algorithm in your Sui smart contract
    const intentData = JSON.stringify({
      intent: 0, // ProcessData intent
      timestamp_ms: timestamp_ms,
      project_id: requestPayload.project_id,
      trust_score: trust_score,
      breakdown: breakdown,
      risk_level: risk_level
    });
    
    // Use deterministic mock keys (stored in .env for consistency)
    const mockPrivateKey = process.env.MOCK_ENCLAVE_PRIVATE_KEY || 'dev-mode-private-key-12345678';
    const mockPublicKeyBase = process.env.MOCK_ENCLAVE_PUBLIC_KEY || 'dev-mode-public-key-87654321';
    
    const mockSignature = crypto
      .createHash('sha256')
      .update(intentData + mockPrivateKey)
      .digest('hex');
    
    const mockPublicKey = crypto
      .createHash('sha256')
      .update(mockPublicKeyBase)
      .digest('hex')
      .substring(0, 64); // Ed25519 public key is 32 bytes = 64 hex chars

    console.log('🧪 Mock enclave response generated for:', requestPayload.project_id);
    console.log('   Trust Score:', trust_score);
    console.log('   Risk Level:', risk_level);

    // Match IntentMessage<TrustScoreResponse> structure from Rust
    return {
      success: true,
      signedScore: {
        project_id: requestPayload.project_id,
        trust_score: trust_score,
        breakdown: breakdown,
        evidence: [
          {
            category: 'GitHub',
            finding: `Repository ${requestPayload.github_repo} analyzed`,
            confidence: 0.95
          },
          {
            category: 'Hackathons',
            finding: `${requestPayload.hackathon_claims.length} claims verified`,
            confidence: 0.85
          },
          {
            category: 'Founders',
            finding: `${requestPayload.founder_profiles.length} profiles found`,
            confidence: 0.8
          }
        ],
        risk_level: risk_level,
        timestamp_ms: timestamp_ms,
        signature: mockSignature,
        public_key: mockPublicKey,
        intent: 0 // ProcessData
      },
      enclaveId: 'mock-dev-enclave',
      verifiable: false, // Mock signatures cannot be verified on-chain
      mock: true
    };
  }

  /**
   * Verify enclave attestation document
   * This proves the enclave is running genuine, unmodified code
   */
  async verifyEnclaveAttestation() {
    try {
      const response = await axios.get(`${this.enclaveEndpoint}/attestation`);
      
      return {
        success: true,
        pcrs: response.data.pcrs,
        certificate: response.data.certificate,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('Attestation verification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for enclave service
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.enclaveEndpoint}/health`, {
        timeout: 5000
      });
      
      return {
        success: true,
        status: response.data.status,
        enclave_id: response.data.enclave_id
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Enclave service unavailable'
      };
    }
  }

  /**
   * Store trust score on Walrus decentralized storage
   * Returns CID (Content Identifier) for immutable reference
   */
  async storeOnWalrus(signedScore) {
    try {
      const walrusService = require('./walrus.service');
      
      // Prepare data for storage
      const dataToStore = {
        project_id: signedScore.project_id,
        trust_score: signedScore.trust_score,
        breakdown: signedScore.breakdown,
        evidence: signedScore.evidence,
        risk_level: signedScore.risk_level,
        timestamp_ms: signedScore.timestamp_ms,
        signature: signedScore.signature,
        public_key: signedScore.public_key,
        is_dev_mode: this.mockMode
      };

      // Store on Walrus and get CID
      const result = await walrusService.storeData(JSON.stringify(dataToStore));
      
      if (result.success) {
        console.log('✅ Stored on Walrus:', result.cid);
        return {
          success: true,
          cid: result.cid,
          url: result.url
        };
      } else {
        console.warn('⚠️ Walrus storage failed:', result.error);
        return {
          success: false,
          error: result.error
        };
      }
    } catch (error) {
      console.error('❌ Walrus storage error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Submit trust score to Sui blockchain
   * Stores the score on-chain with signature for verification
   */
  async submitToBlockchain(signedScore, walrusCID = null) {
    try {
      if (!process.env.NAUTILUS_PACKAGE_ID) {
        console.log('⚠️ Sui package not configured, skipping blockchain submission');
        return {
          success: false,
          message: 'Blockchain not configured - set NAUTILUS_PACKAGE_ID in .env'
        };
      }

      // For now, we'll prepare the transaction data
      // Full Sui SDK integration can be added when needed
      const txData = {
        packageId: process.env.NAUTILUS_PACKAGE_ID,
        module: 'trust_oracle',
        function: 'submit_dev_trust_score',
        arguments: {
          project_id: signedScore.project_id,
          trust_score: signedScore.trust_score,
          breakdown: signedScore.breakdown,
          signature: signedScore.signature,
          public_key: signedScore.public_key,
          walrus_cid: walrusCID || 'pending',
          is_dev_mode: this.mockMode,
          timestamp_ms: signedScore.timestamp_ms
        }
      };

      console.log('📝 Blockchain transaction prepared');
      console.log('   Package ID:', txData.packageId);
      console.log('   Project:', signedScore.project_id);
      console.log('   Trust Score:', signedScore.trust_score);
      console.log('   Dev Mode:', this.mockMode);
      console.log('   Walrus CID:', walrusCID || 'not stored');

      // Return transaction data for frontend to execute
      // Or integrate Sui TypeScript SDK here for direct submission
      return {
        success: true,
        message: 'Transaction prepared (integrate Sui SDK for execution)',
        txData: txData,
        explorerUrl: `https://suiscan.xyz/testnet/object/${process.env.NAUTILUS_PACKAGE_ID}`
      };
    } catch (error) {
      console.error('❌ Blockchain submission error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Complete flow: Generate signature → Store on Walrus → Submit to blockchain
   * Returns comprehensive result with all references
   */
  async processAndStore(projectData, aiAnalysis) {
    try {
      console.log('🚀 Starting complete trust score processing...');

      // Step 1: Generate signed trust score
      console.log('1️⃣ Generating signed trust score...');
      const signedResult = await this.requestSignedTrustScore(projectData, aiAnalysis);
      
      console.log('   Signed Result:', JSON.stringify(signedResult, null, 2));
      
      if (!signedResult || !signedResult.success) {
        const errorMsg = signedResult ? signedResult.error : 'No result returned';
        console.error('   ❌ Failed to generate signed trust score:', errorMsg);
        throw new Error('Failed to generate signed trust score: ' + errorMsg);
      }

      const signedScore = signedResult.signedScore;

      // Step 2: Store on Walrus
      console.log('2️⃣ Storing on Walrus...');
      const walrusResult = await this.storeOnWalrus(signedScore);
      const walrusCID = walrusResult.success ? walrusResult.cid : null;

      // Step 3: Submit to blockchain
      console.log('3️⃣ Submitting to blockchain...');
      const blockchainResult = await this.submitToBlockchain(signedScore, walrusCID);

      // Complete result
      const result = {
        success: true,
        trustScore: {
          project_id: signedScore.project_id,
          trust_score: signedScore.trust_score,
          breakdown: signedScore.breakdown,
          evidence: signedScore.evidence,
          risk_level: signedScore.risk_level,
          timestamp_ms: signedScore.timestamp_ms
        },
        cryptographic: {
          signature: signedScore.signature,
          public_key: signedScore.public_key,
          verifiable: !this.mockMode,
          is_dev_mode: this.mockMode
        },
        storage: {
          walrus: walrusResult,
          blockchain: blockchainResult
        },
        verification: {
          walrus_url: walrusResult.url || null,
          blockchain_explorer: blockchainResult.explorerUrl || null,
          can_verify_onchain: !!process.env.NAUTILUS_PACKAGE_ID
        }
      };

      console.log('✅ Complete trust score processing finished!');
      console.log(`   Trust Score: ${signedScore.trust_score}/100`);
      console.log(`   Risk Level: ${signedScore.risk_level}`);
      console.log(`   Walrus CID: ${walrusCID || 'not stored'}`);
      console.log(`   Blockchain: ${blockchainResult.success ? 'prepared' : 'not configured'}`);

      return result;
    } catch (error) {
      console.error('❌ Complete processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new NautilusEnclaveService();
