const express = require('express');
const router = express.Router();
const { SuiClient } = require('@mysten/sui/client');

// Initialize Sui client
const suiClient = new SuiClient({
  url: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443'
});

const PACKAGE_ID = process.env.PACKAGE_ID || '0xe1df86bc99868f214f86951db2738bd2c46c47f2a4db6753f4fb98f681bef015';
const SEAL_REGISTRY = process.env.SEAL_REGISTRY || '0xbf8c46c6ded3db79361e84b12ab98e4957fc5cf345e7f43bd466e9775bbda01d';

/**
 * GET /api/seals/all
 * Fetch all startup seals from blockchain
 */
router.get('/all', async (req, res) => {
  try {
    console.log('📥 Fetching all startup seals from blockchain...');
    console.log('   Package ID:', PACKAGE_ID);
    
    // Query all StartupSeal objects owned by the registry
    const objects = await suiClient.getOwnedObjects({
      owner: SEAL_REGISTRY,
      options: {
        showType: true,
        showContent: true,
        showOwner: true,
      }
    });

    console.log(`   Found ${objects.data.length} objects`);

    // Filter for StartupSeal objects and extract data
    const seals = objects.data
      .filter(obj => obj.data?.type?.includes('StartupSeal'))
      .map(obj => {
        const content = obj.data.content.fields;
        return {
          id: obj.data.objectId,
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
          nonce: content.nonce,
        };
      });

    console.log(`✅ Returning ${seals.length} startup seals`);

    res.json({
      success: true,
      count: seals.length,
      seals: seals
    });

  } catch (error) {
    console.error('❌ Failed to fetch seals:', error);
    res.status(500).json({
      error: 'Failed to fetch startup seals',
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
 * GET /api/seals/leaderboard
 * Get leaderboard (sorted by trust score)
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

// Helper function to check localStorage format (for backward compatibility)
async function getFromLocalStorage(transactionDigest) {
  // This simulates checking if the ID is a transaction digest
  // In reality, the frontend localStorage data would need to be synced
  // For now, return null to fall back to blockchain fetch
  return null;
}

module.exports = router;
