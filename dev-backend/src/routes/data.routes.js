const express = require('express');
const router = express.Router();
const githubCollector = require('../services/collectors/github.collector');
const hackathonCollector = require('../services/collectors/hackathon.collector');
const founderCollector = require('../services/collectors/founder.collector');
const fundingCollector = require('../services/collectors/funding.collector');

/**
 * GET /api/data/github/:owner/:repo
 * Collect GitHub repository data
 */
router.get('/github/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoUrl = `https://github.com/${owner}/${repo}`;

    const result = await githubCollector.collectRepoStats(repoUrl);

    if (!result.success) {
      return res.status(404).json({
        error: 'Repository not found or error collecting data',
        details: result.error
      });
    }

    // Format for AI analysis
    const repoData = result.data.repository;
    const commitsData = result.data.commits;

    res.json({
      success: true,
      data: {
        name: repoData.name,
        fullName: repoData.fullName,
        description: repoData.description,
        stars: repoData.stars,
        forks: repoData.forks,
        watchers: repoData.watchers,
        openIssues: repoData.openIssues,
        commits: commitsData.total,
        contributors: result.data.contributors.length,
        language: Object.keys(result.data.languages)[0] || 'Unknown',
        lastUpdate: repoData.updatedAt,
        createdAt: repoData.createdAt,
        hasWiki: repoData.hasWiki,
        hasIssues: repoData.hasIssues,
        license: repoData.license,
        metrics: result.data.metrics
      }
    });
  } catch (error) {
    console.error('GitHub collection error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: 'Data collection failed',
      message: error.message,
      details: error.status === 409 ? 'Repository is empty - no commits yet' : error.message
    });
  }
});

/**
 * POST /api/data/hackathon
 * Verify hackathon win
 */
router.post('/hackathon', async (req, res) => {
  try {
    const { projectName, hackathonName, teamMembers } = req.body;

    if (!projectName || !hackathonName) {
      return res.status(400).json({
        error: 'Project name and hackathon name are required'
      });
    }

    const result = await hackathonCollector.verifyHackathonWin(
      projectName,
      hackathonName,
      teamMembers
    );

    res.json({
      success: result.success,
      verified: result.verified,
      sources: result.sources,
      confidence: result.confidence,
      details: result.details
    });
  } catch (error) {
    res.status(500).json({
      error: 'Verification failed',
      message: error.message
    });
  }
});

/**
 * POST /api/data/founder
 * Collect founder profile data
 */
router.post('/founder', async (req, res) => {
  try {
    const founderInfo = req.body;

    if (!founderInfo.name) {
      return res.status(400).json({
        error: 'Founder name is required'
      });
    }

    const result = await founderCollector.collectFounderProfile(founderInfo);

    if (!result.success) {
      return res.status(404).json({
        error: 'Failed to collect founder data',
        details: result.error
      });
    }

    res.json({
      success: true,
      founder: result.data
    });
  } catch (error) {
    res.status(500).json({
      error: 'Data collection failed',
      message: error.message
    });
  }
});

/**
 * GET /api/data/funding/:companyName
 * Collect funding information
 */
router.get('/funding/:companyName', async (req, res) => {
  try {
    const { companyName } = req.params;
    const { website } = req.query;

    const result = await fundingCollector.collectFundingInfo(companyName, website);

    if (!result.success) {
      return res.status(404).json({
        error: 'Failed to collect funding data',
        details: result.error
      });
    }

    res.json({
      success: true,
      funding: result.data
    });
  } catch (error) {
    res.status(500).json({
      error: 'Data collection failed',
      message: error.message
    });
  }
});

/**
 * GET /api/data/github/user/:username
 * Get GitHub user profile
 */
router.get('/github/user/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const result = await githubCollector.getUserProfile(username);

    if (!result.success) {
      return res.status(404).json({
        error: 'User not found',
        details: result.error
      });
    }

    res.json({
      success: true,
      user: result.data
    });
  } catch (error) {
    res.status(500).json({
      error: 'Data collection failed',
      message: error.message
    });
  }
});

/**
 * GET /api/data/twitter/:username
 * Collect Twitter user data
 */
router.get('/twitter/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Use Twitter API v2 with bearer token
    const axios = require('axios');
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;

    if (!bearerToken) {
      return res.status(500).json({
        success: false,
        error: 'Twitter API not configured'
      });
    }

    // Get user by username
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: { 'Authorization': `Bearer ${bearerToken}` },
        params: {
          'user.fields': 'public_metrics,created_at,description,verified'
        }
      }
    );

    const userData = userResponse.data.data;
    const metrics = userData.public_metrics;

    // Calculate engagement rate (simplified)
    const totalEngagement = metrics.tweet_count > 0 
      ? (metrics.like_count || 0) / metrics.tweet_count 
      : 0;
    
    const engagementRate = metrics.followers_count > 0
      ? totalEngagement / metrics.followers_count
      : 0;

    res.json({
      success: true,
      data: {
        username: userData.username,
        name: userData.name,
        description: userData.description,
        verified: userData.verified || false,
        followers: metrics.followers_count,
        following: metrics.following_count,
        tweets: metrics.tweet_count,
        created_at: userData.created_at,
        engagement_rate: Math.min(engagementRate, 1),
        metrics: {
          followers_count: metrics.followers_count,
          following_count: metrics.following_count,
          tweet_count: metrics.tweet_count,
          listed_count: metrics.listed_count || 0
        }
      }
    });
  } catch (error) {
    console.error('Twitter API error:', error.response?.data || error.message);
    
    const status = error.response?.status || 500;
    const isRateLimited = status === 429;
    
    res.status(status).json({
      success: false,
      error: isRateLimited ? 'Twitter API rate limit exceeded' : 'Twitter data collection failed',
      message: isRateLimited 
        ? 'Twitter API rate limit reached. Please try again later or use a different username.'
        : error.response?.data?.detail || error.message,
      rateLimited: isRateLimited
    });
  }
});

module.exports = router;
