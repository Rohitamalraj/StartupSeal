const express = require('express');
const router = express.Router();

// In-memory storage (replace with database in production)
const donations = {};

/**
 * POST /api/donations/record
 * Record a new donation
 */
router.post('/record', async (req, res) => {
  try {
    const { startupId, amount, from, to, txDigest, timestamp } = req.body;

    if (!startupId || !amount || !from || !to || !txDigest) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Initialize donations array for startup if it doesn't exist
    if (!donations[startupId]) {
      donations[startupId] = [];
    }

    // Add donation
    const donation = {
      id: `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: parseFloat(amount),
      from,
      to,
      txDigest,
      timestamp: timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    donations[startupId].push(donation);

    console.log(`✅ Donation recorded: ${amount} SUI to ${startupId}`);

    res.json({
      success: true,
      donation,
      message: 'Donation recorded successfully'
    });
  } catch (error) {
    console.error('Error recording donation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record donation'
    });
  }
});

/**
 * GET /api/donations/:startupId
 * Get all donations for a startup
 */
router.get('/:startupId', async (req, res) => {
  try {
    const { startupId } = req.params;

    const startupDonations = donations[startupId] || [];
    const totalAmount = startupDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalBackers = startupDonations.length;

    res.json({
      success: true,
      donations: startupDonations,
      stats: {
        totalAmount,
        totalBackers,
        startupId
      }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch donations'
    });
  }
});

/**
 * GET /api/donations/user/:walletAddress
 * Get all donations made by a user
 */
router.get('/user/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const userDonations = [];
    
    // Search through all donations
    for (const [startupId, startupDonations] of Object.entries(donations)) {
      const userDonationsForStartup = startupDonations.filter(
        d => d.from.toLowerCase() === walletAddress.toLowerCase()
      );
      
      userDonationsForStartup.forEach(donation => {
        userDonations.push({
          ...donation,
          startupId
        });
      });
    }

    const totalDonated = userDonations.reduce((sum, d) => sum + d.amount, 0);

    res.json({
      success: true,
      donations: userDonations,
      stats: {
        totalDonated,
        totalDonations: userDonations.length,
        walletAddress
      }
    });
  } catch (error) {
    console.error('Error fetching user donations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user donations'
    });
  }
});

module.exports = router;
