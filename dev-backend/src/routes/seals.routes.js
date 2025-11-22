const express = require('express');
const router = express.Router();
const { SuiClient } = require('@mysten/sui/client');

// Initialize Sui client
const suiClient = new SuiClient({
  url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443'
});

const PACKAGE_ID = process.env.SUI_PACKAGE_ID || process.env.PACKAGE_ID || '0x4ed0363bfb0084f0c75aae40aee7aabddd0413bc21afef40a42ad7c2faa0a9f4';
const SEAL_REGISTRY = process.env.SEAL_REGISTRY || '0x1ca3cf4e05f04a3ae3fd0368cf97c81a4a9ac59c3479ab53d50eeaadf58b37f8';

/**
 * GET /api/seals/all
 * Fetch all startup seals from blockchain using events
 */
router.get('/all', async (req, res) => {
  try {
    console.log('📥 Fetching all startup seals from blockchain...');
    console.log('   Package ID:', PACKAGE_ID);
    console.log('   Event Type:', `${PACKAGE_ID}::startup_seal::SealMinted`);
    
    // Query all SealMinted events
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::startup_seal::SealMinted`
      },
      limit: 50,
      order: 'descending'
    });

    console.log(`   Found ${events.data.length} seal creation events`);

    // Fetch full object data for each seal
    const sealPromises = events.data.map(async (event) => {
      try {
        const sealId = event.parsedJson.seal_id;
        console.log(`   Fetching seal object: ${sealId}`);
        
        const sealObject = await suiClient.getObject({
          id: sealId,
          options: {
            showContent: true,
            showOwner: true,
            showType: true
          }
        });

        if (!sealObject.data) {
          console.log(`   ⚠️ Seal ${sealId} not found`);
          return null;
        }

        const content = sealObject.data.content.fields;
        
        // Helper function to safely convert vector to string
        const vectorToString = (vec) => {
          if (!vec) return '';
          if (typeof vec === 'string') return vec;
          if (Array.isArray(vec)) {
            return Buffer.from(vec).toString('utf-8');
          }
          return String(vec);
        };

        const startupName = vectorToString(content.startup_name);
        console.log(`   ✅ Loaded seal: ${startupName}`);

        return {
          id: sealId,
          name: startupName,
          startup_name: startupName,
          githubRepo: vectorToString(content.github_repo),
          github_repo: vectorToString(content.github_repo),
          hackathon: vectorToString(content.hackathon_name),
          hackathon_name: vectorToString(content.hackathon_name),
          owner: content.owner,
          walletAddress: content.owner,
          trustScore: parseInt(content.overall_trust_score) || 0,
          overall_trust_score: parseInt(content.overall_trust_score) || 0,
          hackathonScore: parseInt(content.hackathon_score) || 0,
          hackathon_score: parseInt(content.hackathon_score) || 0,
          githubScore: parseInt(content.github_score) || 0,
          github_score: parseInt(content.github_score) || 0,
          aiScore: parseInt(content.ai_consistency_score) || 0,
          ai_consistency_score: parseInt(content.ai_consistency_score) || 0,
          documentScore: parseInt(content.document_score) || 0,
          document_score: parseInt(content.document_score) || 0,
          verified: content.hackathon_verified || false,
          hackathon_verified: content.hackathon_verified || false,
          timestamp: parseInt(content.timestamp) || Date.now(),
          createdAt: new Date(parseInt(content.timestamp) || Date.now()).toISOString(),
          certificate_blob_ids: content.certificate_blob_ids || [],
          nonce: content.nonce || '',
          category: "DeFi",
          riskLevel: parseInt(content.overall_trust_score) >= 85 ? "Low" : 
                    parseInt(content.overall_trust_score) >= 70 ? "Medium" : "High",
          description: `Verified startup from ${vectorToString(content.hackathon_name)}`,
          logo: "https://api.dicebear.com/7.x/shapes/svg?seed=" + startupName,
          lastVerified: new Date(parseInt(content.timestamp) || Date.now()).toLocaleDateString()
        };
      } catch (error) {
        console.error('   ❌ Error fetching seal:', error.message);
        return null;
      }
    });

    const seals = (await Promise.all(sealPromises)).filter(seal => seal !== null);

    console.log(`✅ Returning ${seals.length} startup seals`);

    res.json({
      success: true,
      count: seals.length,
      seals: seals
    });

  } catch (error) {
    console.error('❌ Failed to fetch seals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch startup seals',
      message: error.message,
      seals: []
    });
  }
});

/**
 * GET /api/seals/leaderboard
 * Get leaderboard (sorted by trust score)
 * NOTE: This MUST be before /:id route to avoid matching "leaderboard" as an ID
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { hackathon, category, limit = 50 } = req.query;
    
    console.log('📊 Fetching leaderboard...');
    if (hackathon) console.log('   Filter: Hackathon =', hackathon);
    if (category) console.log('   Filter: Category =', category);

    // Fetch all seals (in production, this would be optimized with indexing)
    const allSealsResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/seals/all`);
    const { seals } = await allSealsResponse.json();

    // Apply filters
    let filtered = seals;
    
    if (hackathon && hackathon !== 'All Hackathons') {
      filtered = filtered.filter(s => s.hackathon_name === hackathon);
    }

    // Sort by trust score descending
    const sorted = filtered
      .sort((a, b) => b.overall_trust_score - a.overall_trust_score)
      .slice(0, parseInt(limit));

    console.log(`✅ Returning top ${sorted.length} startups`);

    res.json({
      success: true,
      count: sorted.length,
      seals: sorted
    });

  } catch (error) {
    console.error('❌ Leaderboard fetch failed:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      message: error.message
    });
  }
});

/**
 * GET /api/seals/:id
 * Fetch a specific startup seal by object ID or transaction digest
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📥 Fetching seal: ${id}`);

    // Check localStorage format first (transaction digest)
    const localData = await getFromLocalStorage(id);
    if (localData) {
      console.log('✅ Found data in localStorage format');
      return res.json(localData);
    }

    // Try to fetch from blockchain as object ID
    try {
      const object = await suiClient.getObject({
        id: id,
        options: {
          showType: true,
          showContent: true,
          showOwner: true,
        }
      });

      if (!object.data) {
        return res.status(404).json({
          error: 'Startup seal not found'
        });
      }

      const content = object.data.content.fields;
      const seal = {
        id: object.data.objectId,
        startup_name: Buffer.from(content.startup_name).toString('utf-8'),
        github_repo: Buffer.from(content.github_repo).toString('utf-8'),
        hackathon_name: Buffer.from(content.hackathon_name).toString('utf-8'),
        owner: content.owner,
        overall_trust_score: parseInt(content.overall_trust_score),
        hackathon_score: parseInt(content.hackathon_score),
        github_score: parseInt(content.github_score),
        ai_consistency_score: parseInt(content.ai_consistency_score),
        document_score: parseInt(content.document_score),
        hackathon_verified: content.hackathon_verified,
        timestamp: parseInt(content.timestamp),
        certificate_blob_ids: content.certificate_blob_ids || [],
      };

      console.log('✅ Seal found on blockchain');
      res.json(seal);

    } catch (blockchainError) {
      console.error('Blockchain fetch failed:', blockchainError);
      res.status(404).json({
        error: 'Startup seal not found'
      });
    }

  } catch (error) {
    console.error('❌ Failed to fetch seal:', error);
    res.status(500).json({
      error: 'Failed to fetch startup seal',
      message: error.message
    });
  }
});

/**
 * GET /api/seals/address/:address
 * Fetch seals by owner address
 */
router.get('/address/:address', async (req, res) => {
  try {
    const { address } = req.params;
    console.log(`📥 Fetching seals for address: ${address}`);

    const allSealsResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/seals/all`);
    const { seals } = await allSealsResponse.json();

    const filtered = seals.filter(s => s.owner === address);

    console.log(`✅ Found ${filtered.length} seals for this address`);

    res.json({
      success: true,
      count: filtered.length,
      seals: filtered
    });

  } catch (error) {
    console.error('❌ Failed to fetch seals by address:', error);
    res.status(500).json({
      error: 'Failed to fetch seals',
      message: error.message
    });
  }
});

/**
 * GET /api/seals/search
 * Search seals by name or repo
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        error: 'Query parameter "q" is required'
      });
    }

    console.log(`🔍 Searching for: ${q}`);

    const allSealsResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/seals/all`);
    const { seals } = await allSealsResponse.json();

    const filtered = seals.filter(s => 
      s.startup_name.toLowerCase().includes(q.toLowerCase()) ||
      s.github_repo.toLowerCase().includes(q.toLowerCase())
    );

    console.log(`✅ Found ${filtered.length} matching seals`);

    res.json({
      success: true,
      count: filtered.length,
      seals: filtered
    });

  } catch (error) {
    console.error('❌ Search failed:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/seals/user/:walletAddress
 * Fetch all seals created by a specific wallet address
 */
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    console.log(`📥 Fetching seals for wallet: ${walletAddress}`);

    // Query all SealMinted events
    const events = await suiClient.queryEvents({
      query: {
        MoveEventType: `${PACKAGE_ID}::startup_seal::SealMinted`
      },
      limit: 50,
      order: 'descending'
    });

    // Fetch full objects and filter by owner
    const sealPromises = events.data.map(async (event) => {
      try {
        const sealId = event.parsedJson.seal_id;
        const sealObject = await suiClient.getObject({
          id: sealId,
          options: {
            showContent: true,
            showOwner: true,
            showType: true
          }
        });

        if (!sealObject.data) return null;

        const content = sealObject.data.content.fields;
        
        // Check if this seal belongs to the wallet
        if (content.owner.toLowerCase() !== walletAddress.toLowerCase()) {
          return null;
        }

        const vectorToString = (vec) => {
          if (!vec) return '';
          if (typeof vec === 'string') return vec;
          if (Array.isArray(vec)) {
            return Buffer.from(vec).toString('utf-8');
          }
          return String(vec);
        };

        return {
          id: sealId,
          name: vectorToString(content.startup_name),
          owner: content.owner,
          trustScore: parseInt(content.overall_trust_score) || 0,
          timestamp: parseInt(content.timestamp) || Date.now()
        };
      } catch (error) {
        return null;
      }
    });

    const userSeals = (await Promise.all(sealPromises)).filter(seal => seal !== null);

    console.log(`✅ Found ${userSeals.length} seals for ${walletAddress}`);

    res.json({
      success: true,
      count: userSeals.length,
      seals: userSeals,
      walletAddress
    });

  } catch (error) {
    console.error('❌ Failed to fetch user seals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user seals',
      message: error.message,
      seals: []
    });
  }
});

// Helper function to check localStorage format (for backward compatibility)
async function getFromLocalStorage(transactionDigest) {
  // This simulates checking if the ID is a transaction digest
  // In reality, the frontend localStorage data would need to be synced
  // For now, return null to fall back to blockchain fetch
  return null;
}

module.exports = router;
