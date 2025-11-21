const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * GitHub OAuth Configuration
 * Get these from: https://github.com/settings/developers
 */
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'your_client_id_here';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || 'your_client_secret_here';
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:5000/api/auth/github/callback';

/**
 * GET /api/auth/github
 * Redirect to GitHub OAuth authorization
 */
router.get('/github', (req, res) => {
  const scope = 'read:user,repo';
  const state = Math.random().toString(36).substring(7); // CSRF protection
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&state=${state}`;
  
  res.json({
    success: true,
    authUrl: githubAuthUrl,
    message: 'Redirect user to this URL'
  });
});

/**
 * GET /api/auth/github/callback
 * GitHub OAuth callback - exchanges code for access token
 */
router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send(`
      <html>
        <body>
          <h1>❌ Authentication Failed</h1>
          <p>No authorization code received from GitHub.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI
      },
      {
        headers: { Accept: 'application/json' }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      throw new Error('No access token received');
    }

    // Get user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const userData = userResponse.data;

    // Send success page with token and user data
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src * data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';");
    res.send(`
      <html>
        <head>
          <title>GitHub Connected</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 15px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 500px;
            }
            h1 { color: #667eea; margin-bottom: 20px; }
            .user-info {
              display: flex;
              align-items: center;
              gap: 15px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 10px;
              margin: 20px 0;
            }
            .avatar {
              width: 60px;
              height: 60px;
              border-radius: 50%;
            }
            .user-details { text-align: left; }
            .success { color: #38ef7d; font-size: 3em; }
            .btn {
              padding: 12px 30px;
              background: #667eea;
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 20px;
            }
            .btn:hover {
              background: #5568d3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">✅</div>
            <h1>GitHub Connected!</h1>
            <div class="user-info">
              <img src="${userData.avatar_url}" class="avatar" alt="Avatar">
              <div class="user-details">
                <strong>${userData.name || userData.login}</strong><br>
                <span style="color: #666;">@${userData.login}</span>
              </div>
            </div>
            <p>You have successfully connected your GitHub account.</p>
            <button class="btn" id="selectRepoBtn">Select Repository</button>
            <p style="color: #666; font-size: 0.9em; margin-top: 20px;">
              This window will redirect automatically...
            </p>
          </div>
          <script>
            const userData = ${JSON.stringify({
              login: userData.login,
              name: userData.name,
              avatar: userData.avatar_url,
              accessToken: accessToken
            })};

            // Store in localStorage for main window to access
            localStorage.setItem('github_auth', JSON.stringify(userData));

            // Send message to opener window
            if (window.opener) {
              window.opener.postMessage({
                type: 'github_connected',
                data: userData
              }, '*');
            }

            function selectRepository() {
              window.location.href = '/api/auth/github/repos?token=' + encodeURIComponent(userData.accessToken);
            }

            // Add click handler
            document.getElementById('selectRepoBtn').addEventListener('click', selectRepository);

            // Auto redirect to repo selection after 2 seconds
            setTimeout(selectRepository, 2000);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>❌ Authentication Error</h1>
          <p>${error.message}</p>
          <script>
            setTimeout(() => window.close(), 5000);
          </script>
        </body>
      </html>
    `);
  }
});

/**
 * GET /api/auth/github/repos
 * Show repository selection page
 */
router.get('/github/repos', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('<h1>No access token provided</h1>');
  }

  try {
    // Get user's repositories
    const reposResponse = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        sort: 'updated',
        per_page: 100,
        affiliation: 'owner,collaborator'
      }
    });

    const repos = reposResponse.data;

    res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src * data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';");
    res.send(`
      <html>
        <head>
          <title>Select Repository</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 20px;
            }
            .container {
              max-width: 900px;
              margin: 0 auto;
              background: white;
              border-radius: 15px;
              padding: 30px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            h1 {
              color: #667eea;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              margin-bottom: 30px;
            }
            .search-box {
              width: 100%;
              padding: 12px 15px;
              border: 2px solid #e0e0e0;
              border-radius: 8px;
              font-size: 16px;
              margin-bottom: 20px;
            }
            .search-box:focus {
              outline: none;
              border-color: #667eea;
            }
            .repo-list {
              max-height: 500px;
              overflow-y: auto;
            }
            .repo-item {
              padding: 15px;
              border: 2px solid #e0e0e0;
              border-radius: 10px;
              margin-bottom: 10px;
              cursor: pointer;
              transition: all 0.2s;
            }
            .repo-item:hover {
              border-color: #667eea;
              background: #f8f9fa;
              transform: translateX(5px);
            }
            .repo-name {
              font-weight: 600;
              color: #333;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .repo-desc {
              color: #666;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .repo-meta {
              display: flex;
              gap: 15px;
              font-size: 13px;
              color: #888;
            }
            .repo-meta span {
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .empty {
              text-align: center;
              padding: 40px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🗂️ Select Repository</h1>
            <p class="subtitle">Choose a repository to analyze</p>
            
            <input 
              type="text" 
              class="search-box" 
              id="searchBox" 
              placeholder="🔍 Search repositories..."
            />
            
            <div class="repo-list" id="repoList">
              ${repos.map((repo, index) => `
                <div class="repo-item" data-repo="${repo.full_name.replace(/"/g, '&quot;')}" data-index="${index}">
                  <div class="repo-name">${repo.full_name}</div>
                  ${repo.description ? `<div class="repo-desc">${repo.description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : ''}
                  <div class="repo-meta">
                    <span>⭐ ${repo.stargazers_count}</span>
                    <span>🍴 ${repo.forks_count}</span>
                    <span>🔵 ${repo.language || 'Unknown'}</span>
                    <span>📅 Updated ${new Date(repo.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <script>
            const reposData = ${JSON.stringify(repos)};
            const accessToken = ${JSON.stringify(token)};
            
            // Search functionality
            document.getElementById('searchBox').addEventListener('keyup', function() {
              const searchTerm = this.value.toLowerCase();
              const items = document.querySelectorAll('.repo-item');
              
              items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? 'block' : 'none';
              });
            });

            // Repository selection
            document.getElementById('repoList').addEventListener('click', function(e) {
              const repoItem = e.target.closest('.repo-item');
              if (!repoItem) return;
              
              const fullName = repoItem.getAttribute('data-repo');
              selectRepo(fullName, accessToken);
            });

            function selectRepo(fullName, token) {
              const [owner, repo] = fullName.split('/');
              
              // Check if opener exists first
              if (!window.opener || window.opener.closed) {
                document.body.innerHTML = \`
                  <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                      <div style="font-size: 3em; color: #f44336; margin-bottom: 20px;">❌</div>
                      <h2 style="color: #f44336; margin-bottom: 10px;">Connection Lost</h2>
                      <p style="color: #666; margin-bottom: 15px;">The main window was closed.</p>
                      <p style="color: #999;">Please close this window and try again.</p>
                      <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
                    </div>
                  </div>
                \`;
                return;
              }
              
              // Show loading state
              document.body.innerHTML = \`
                <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                    <div style="font-size: 3em; margin-bottom: 20px;">⏳</div>
                    <h2 style="color: #667eea; margin-bottom: 10px;">Loading Repository...</h2>
                    <p style="color: #666;">\${fullName}</p>
                  </div>
                </div>
              \`;

              // Fetch detailed repo data
              fetch(\`http://localhost:5000/api/data/github/\${owner}/\${repo}\`)
                .then(response => {
                  if (!response.ok) {
                    throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
                  }
                  return response.json();
                })
                .then(data => {
                  // Send to parent window
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                      type: 'github_repo_selected',
                      data: {
                        owner: owner,
                        repo: repo,
                        fullName: fullName,
                        repoData: data
                      }
                    }, '*');
                    
                    // Show success
                    document.body.innerHTML = \`
                      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                          <div style="font-size: 3em; color: #38ef7d; margin-bottom: 20px;">✅</div>
                          <h2 style="color: #667eea; margin-bottom: 10px;">Repository Selected!</h2>
                          <p style="color: #666; margin-bottom: 20px;"><strong>\${fullName}</strong></p>
                          <p style="color: #999;">Closing window...</p>
                        </div>
                      </div>
                    \`;
                    
                    setTimeout(() => {
                      try {
                        window.close();
                      } catch(e) {
                        console.log('Window close blocked:', e);
                      }
                    }, 1500);
                  } else {
                    document.body.innerHTML = \`
                      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                          <div style="font-size: 3em; color: #f44336; margin-bottom: 20px;">❌</div>
                          <h2 style="color: #f44336; margin-bottom: 10px;">Connection Lost</h2>
                          <p style="color: #666;">The main window was closed.</p>
                          <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
                        </div>
                      </div>
                    \`;
                  }
                })
                .catch(error => {
                  console.error('Error:', error);
                  
                  // Still try to send the selection even if data fetch fails
                  if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                      type: 'github_repo_selected',
                      data: {
                        owner: owner,
                        repo: repo,
                        fullName: fullName,
                        repoData: { success: false, error: error.message }
                      }
                    }, '*');
                  }
                  
                  document.body.innerHTML = \`
                    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                      <div style="background: white; padding: 40px; border-radius: 15px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                        <div style="font-size: 3em; color: #ff9800; margin-bottom: 20px;">⚠️</div>
                        <h2 style="color: #ff9800; margin-bottom: 10px;">Repository Selected with Warning</h2>
                        <p style="color: #666; margin-bottom: 10px;"><strong>\${fullName}</strong></p>
                        <p style="color: #999; font-size: 14px; margin-bottom: 20px;">Note: Could not fetch repository data (Error: \${error.message})</p>
                        <p style="color: #666;">You can still continue with analysis.</p>
                        <button onclick="window.close()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Close Window</button>
                      </div>
                    </div>
                  \`;
                });
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error fetching repos:', error);
    res.status(500).send('<h1>Error loading repositories</h1>');
  }
});

module.exports = router;
