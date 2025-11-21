/**
 * Trust Oracle API Service
 * Handles communication with the dev2 backend (http://localhost:5000)
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

/**
 * Complete Trust Score Analysis
 * Includes AI scoring, Nautilus enclave signing, and blockchain verification
 * 
 * @param {Object} projectData - The project data to analyze
 * @returns {Promise<Object>} Complete analysis result with trust score, cryptographic proof, and blockchain data
 */
export async function getCompleteTrustScore(projectData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectData }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Trust score analysis failed')
    }

    return data
  } catch (error) {
    console.error('Trust Oracle API Error:', error)
    throw error
  }
}

/**
 * Real-time AI Analysis Only
 * Fast trust scoring without blockchain/enclave integration
 * 
 * @param {Object} projectData - The project data to analyze
 * @returns {Promise<Object>} AI trust score result
 */
export async function getRealtimeTrustScore(projectData) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/realtime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectData }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Real-time analysis failed')
    }

    return data
  } catch (error) {
    console.error('Realtime Analysis Error:', error)
    throw error
  }
}

/**
 * Test Enclave Integration
 * Verify that the Nautilus enclave is responding correctly
 * 
 * @returns {Promise<Object>} Enclave test result
 */
export async function testEnclaveIntegration() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ai/enclave/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Enclave Test Error:', error)
    throw error
  }
}

/**
 * Health Check
 * Check if the backend server is running
 * 
 * @returns {Promise<Object>} Health status
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`)
    
    if (!response.ok) {
      throw new Error(`Backend unhealthy: HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Backend Health Check Failed:', error)
    throw error
  }
}

/**
 * Format project data for Trust Oracle API
 * Converts frontend form data to the expected backend format
 * 
 * @param {Object} formData - Form data from VerifyPage
 * @param {Object} githubData - GitHub repository data (optional)
 * @returns {Object} Formatted project data
 */
export function formatProjectData(formData, githubData = null) {
  // Format GitHub data for Python ML script
  // The Python script expects: { success: true, data: { stars, commits, ... } }
  const formattedGithubData = githubData ? {
    success: true,
    data: {
      owner: githubData.owner || formData.githubRepo?.split('/')[0] || '',
      repo: githubData.repo || formData.githubRepo?.split('/')[1] || '',
      full_name: githubData.full_name || formData.githubRepo || '',
      stars: githubData.stars || 0,
      forks: githubData.forks || 0,
      commits: githubData.commits || 0,
      contributors: githubData.contributors || 0,
      language: githubData.language || 'Unknown',
      openIssues: githubData.openIssues || 0,
      lastUpdate: githubData.lastUpdate || new Date().toISOString(),
    }
  } : {
    success: false,
    data: {}
  }

  const projectData = {
    github: formattedGithubData,
    governance: {
      hackathon_wins: formData.hackathonName ? 1 : 0,
      team_members: formData.teamMembers || [],
      founder_profiles: formData.founderProfiles || [],
    },
    onchain: {
      contract_address: formData.contractAddress || '',
    },
  }

  // Add metadata
  if (formData.startupName) {
    projectData.metadata = {
      startup_name: formData.startupName,
      description: formData.description || '',
    }
  }

  return projectData
}

/**
 * Parse trust score response for UI display
 * 
 * @param {Object} response - Complete API response
 * @returns {Object} Parsed data for UI components
 */
export function parseTrustScoreResponse(response) {
  const { trustScore, cryptographic, storage, verification, mode } = response

  return {
    // Core score data
    score: trustScore.trust_score,
    riskLevel: trustScore.risk_level,
    breakdown: trustScore.breakdown,
    evidence: trustScore.evidence || [],
    
    // Cryptographic proof
    signature: cryptographic.signature,
    publicKey: cryptographic.public_key,
    isDevMode: cryptographic.is_dev_mode || mode === 'DEV_MODE',
    verifiable: cryptographic.verifiable,
    
    // Blockchain data
    blockchain: {
      packageId: storage.blockchain?.packageId,
      explorerUrl: storage.blockchain?.explorerUrl || verification?.blockchain_explorer,
      txData: storage.blockchain?.txData,
      canVerify: verification?.can_verify_onchain || false,
    },
    
    // Walrus storage (optional)
    walrus: storage.walrus,
    
    // Mode indicator
    mode: mode || 'PRODUCTION',
  }
}

/**
 * Get risk level color for UI
 * 
 * @param {string} riskLevel - 'low', 'medium', or 'high'
 * @returns {string} Tailwind color class
 */
export function getRiskLevelColor(riskLevel) {
  const colors = {
    low: 'text-green-600 bg-green-50 border-green-200',
    medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    high: 'text-red-600 bg-red-50 border-red-200',
  }
  return colors[riskLevel?.toLowerCase()] || colors.medium
}

/**
 * Get score color based on value
 * 
 * @param {number} score - Score value (0-100)
 * @returns {string} Tailwind color class
 */
export function getScoreColor(score) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}
