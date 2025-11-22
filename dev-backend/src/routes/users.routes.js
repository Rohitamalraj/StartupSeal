const express = require('express');
const router = express.Router();

// In-memory storage (replace with database in production)
const contactRequests = [];
const savedStartups = {};
const userProfiles = {};

/**
 * POST /api/users/contact-request
 * Send a contact request to a startup
 */
router.post('/contact-request', async (req, res) => {
  try {
    const { fromWallet, toWallet, startupId, startupName, purpose, message, contactInfo } = req.body;

    if (!fromWallet || !toWallet || !startupId || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const request = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromWallet,
      toWallet,
      startupId,
      startupName,
      purpose,
      message,
      contactInfo,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    contactRequests.push(request);

    console.log(`✅ Contact request sent from ${fromWallet} to ${startupName}`);

    res.json({
      success: true,
      request,
      message: 'Contact request sent successfully'
    });
  } catch (error) {
    console.error('Error sending contact request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send contact request'
    });
  }
});

/**
 * GET /api/users/contact-requests/:walletAddress
 * Get contact requests (received or sent)
 */
router.get('/contact-requests/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { type } = req.query; // 'received' or 'sent'

    let filtered;
    if (type === 'sent') {
      filtered = contactRequests.filter(
        r => r.fromWallet.toLowerCase() === walletAddress.toLowerCase()
      );
    } else {
      filtered = contactRequests.filter(
        r => r.toWallet.toLowerCase() === walletAddress.toLowerCase()
      );
    }

    res.json({
      success: true,
      requests: filtered
    });
  } catch (error) {
    console.error('Error fetching contact requests:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch contact requests'
    });
  }
});

/**
 * PUT /api/users/contact-request/:requestId
 * Update contact request status
 */
router.put('/contact-request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, response } = req.body;

    const request = contactRequests.find(r => r.id === requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Contact request not found'
      });
    }

    request.status = status;
    request.response = response;
    request.updatedAt = new Date().toISOString();

    res.json({
      success: true,
      request,
      message: 'Contact request updated'
    });
  } catch (error) {
    console.error('Error updating contact request:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update contact request'
    });
  }
});

/**
 * GET /api/users/profile/:walletAddress
 * Get user profile
 */
router.get('/profile/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    const profile = userProfiles[walletAddress] || {
      walletAddress,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user profile'
    });
  }
});

/**
 * GET /api/users/stats/:walletAddress
 * Get user statistics
 */
router.get('/stats/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    const saved = savedStartups[walletAddress] || [];
    const received = contactRequests.filter(
      r => r.toWallet.toLowerCase() === walletAddress.toLowerCase()
    );
    const sent = contactRequests.filter(
      r => r.fromWallet.toLowerCase() === walletAddress.toLowerCase()
    );

    res.json({
      success: true,
      stats: {
        savedStartups: saved.length,
        contactRequestsReceived: received.length,
        contactRequestsSent: sent.length
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user stats'
    });
  }
});

/**
 * POST /api/users/save-startup
 * Save/bookmark a startup
 */
router.post('/save-startup', async (req, res) => {
  try {
    const { walletAddress, startupId, startupName } = req.body;

    if (!savedStartups[walletAddress]) {
      savedStartups[walletAddress] = [];
    }

    if (!savedStartups[walletAddress].find(s => s.startupId === startupId)) {
      savedStartups[walletAddress].push({
        startupId,
        startupName,
        savedAt: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Startup saved successfully'
    });
  } catch (error) {
    console.error('Error saving startup:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save startup'
    });
  }
});

/**
 * GET /api/users/saved-startups/:walletAddress
 * Get saved startups
 */
router.get('/saved-startups/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    res.json({
      success: true,
      savedStartups: savedStartups[walletAddress] || []
    });
  } catch (error) {
    console.error('Error fetching saved startups:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch saved startups'
    });
  }
});

/**
 * DELETE /api/users/save-startup
 * Remove saved startup
 */
router.delete('/save-startup', async (req, res) => {
  try {
    const { walletAddress, startupId } = req.body;

    if (savedStartups[walletAddress]) {
      savedStartups[walletAddress] = savedStartups[walletAddress].filter(
        s => s.startupId !== startupId
      );
    }

    res.json({
      success: true,
      message: 'Startup removed from saved list'
    });
  } catch (error) {
    console.error('Error removing saved startup:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove saved startup'
    });
  }
});

module.exports = router;
