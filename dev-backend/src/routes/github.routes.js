const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * GitHub OAuth Configuration
 */
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liUJMzE0Sna7ya5c';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

/**
 * POST /api/github/auth
 * Exchange GitHub OAuth code for access token
 */
router.post('/auth', async (req, res) => {
  const { code } = req.body;

  console.log('📥 GitHub auth request:', { code: code ? `${code.substring(0, 10)}...` : 'MISSING' });

  if (!code) {
    return res.status(400).json({ 
      error: 'Authorization code is required',
      success: false 
    });
  }

  if (!GITHUB_CLIENT_SECRET) {
    console.error('❌ GITHUB_CLIENT_SECRET not configured in .env');
    return res.status(500).json({ 
      error: 'GitHub OAuth not properly configured on server',
      success: false 
    });
  }

  try {
    console.log('🔄 Exchanging code for access token...');
    
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code
      },
      {
        headers: { 
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('📥 Token response status:', tokenResponse.status);

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      console.error('❌ No access token in response:', tokenResponse.data);
      throw new Error(tokenResponse.data.error_description || 'Failed to obtain access token');
    }

    console.log('✅ Access token obtained');

    // Get user info
    console.log('👤 Fetching user info...');
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const userData = userResponse.data;
    console.log('✅ User authenticated:', userData.login);

    res.json({
      success: true,
      access_token: accessToken,
      username: userData.login,
      name: userData.name,
      avatar_url: userData.avatar_url,
      email: userData.email
    });
  } catch (error) {
    console.error('❌ GitHub auth error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: error.response?.data?.error_description || error.message || 'GitHub authentication failed',
      success: false 
    });
  }
});

/**
 * POST /api/github/verify-repository
 * Verify user has access to a repository and analyze it
 */
router.post('/verify-repository', async (req, res) => {
  const { access_token, repo_full_name } = req.body;

  console.log('📥 Repository verification request:', { repo: repo_full_name });

  if (!access_token || !repo_full_name) {
    return res.status(400).json({ 
      error: 'Access token and repository name are required',
      success: false 
    });
  }

  try {
    const [owner, repo] = repo_full_name.split('/');
    
    if (!owner || !repo) {
      return res.status(400).json({ 
        error: 'Invalid repository format. Use: owner/repo',
        success: false 
      });
    }

    console.log('🔍 Fetching repository data...');
    
    // Get repository info
    const repoResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: { 
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    const repoData = repoResponse.data;
    console.log('✅ Repository found:', repoData.full_name);

    // Get commit stats
    console.log('📊 Analyzing commits...');
    const commitsResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      {
        headers: { 
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/vnd.github.v3+json'
        },
        params: {
          per_page: 100
        }
      }
    );

    const commits = commitsResponse.data;
    console.log(`✅ Fetched ${commits.length} commits`);

    // Get authenticated user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { 
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const currentUser = userResponse.data;
    console.log('👤 Authenticated user:', currentUser.login);

    // Analyze user's contribution
    const userCommits = commits.filter(commit => 
      commit.author?.login === currentUser.login || 
      commit.commit?.author?.email === currentUser.email
    );

    const ownershipScore = commits.length > 0 
      ? Math.round((userCommits.length / commits.length) * 100) 
      : 0;

    // Calculate activity score based on recent commits
    const now = Date.now();
    const recentCommits = commits.filter(commit => {
      const commitDate = new Date(commit.commit.author.date).getTime();
      const daysAgo = (now - commitDate) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30; // Last 30 days
    });

    const activityScore = Math.min(100, recentCommits.length * 5); // 5 points per commit, max 100

    // Get contributors count
    const contributorsResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contributors`,
      {
        headers: { 
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );

    const contributors = contributorsResponse.data.length;

    console.log('📊 Analysis complete:', {
      totalCommits: commits.length,
      userCommits: userCommits.length,
      ownershipScore,
      activityScore,
      contributors
    });

    res.json({
      success: true,
      has_access: true,
      repository_data: {
        full_name: repoData.full_name,
        name: repoData.name,
        owner: repoData.owner.login,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        open_issues: repoData.open_issues_count,
        language: repoData.language,
        created_at: repoData.created_at,
        updated_at: repoData.updated_at,
        description: repoData.description
      },
      commit_analysis: {
        total_commits: commits.length,
        user_commits: userCommits.length,
        ownership_score: ownershipScore,
        activity_score: activityScore,
        contributors: contributors,
        recent_commits_30d: recentCommits.length
      }
    });
  } catch (error) {
    console.error('❌ Repository verification error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Repository not found or you do not have access',
        success: false,
        has_access: false
      });
    }

    res.status(500).json({ 
      error: error.response?.data?.message || error.message || 'Repository verification failed',
      success: false 
    });
  }
});

module.exports = router;
