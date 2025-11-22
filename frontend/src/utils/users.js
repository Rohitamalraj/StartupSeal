import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Get or create user profile
 */
export async function getUserProfile(walletAddress) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/profile/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(walletAddress, updates) {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/users/profile/${walletAddress}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Send contact request to startup owner
 */
export async function sendContactRequest(data) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/users/contact-request`, data);
    return response.data;
  } catch (error) {
    console.error('Error sending contact request:', error);
    throw error;
  }
}

/**
 * Get contact requests (received or sent)
 */
export async function getContactRequests(walletAddress, type = 'received') {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/contact-requests/${walletAddress}?type=${type}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching contact requests:', error);
    throw error;
  }
}

/**
 * Update contact request status
 */
export async function updateContactRequest(requestId, status, response = '') {
  try {
    const res = await axios.put(`${API_BASE_URL}/api/users/contact-request/${requestId}`, {
      status,
      response
    });
    return res.data;
  } catch (error) {
    console.error('Error updating contact request:', error);
    throw error;
  }
}

/**
 * Save/bookmark a startup
 */
export async function saveStartup(walletAddress, startupId, startupName) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/users/save-startup`, {
      walletAddress,
      startupId,
      startupName
    });
    return response.data;
  } catch (error) {
    console.error('Error saving startup:', error);
    throw error;
  }
}

/**
 * Remove saved startup
 */
export async function unsaveStartup(walletAddress, startupId) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/users/save-startup`, {
      data: { walletAddress, startupId }
    });
    return response.data;
  } catch (error) {
    console.error('Error removing saved startup:', error);
    throw error;
  }
}

/**
 * Get saved startups for a user
 */
export async function getSavedStartups(walletAddress) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/saved-startups/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching saved startups:', error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(walletAddress) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/users/stats/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
}

/**
 * Record a donation to a startup
 */
export async function recordDonation(data) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/donations/record`, data);
    return response.data;
  } catch (error) {
    console.error('Error recording donation:', error);
    throw error;
  }
}

/**
 * Get all donations for a startup
 */
export async function getDonations(startupId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/donations/${startupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching donations:', error);
    throw error;
  }
}

/**
 * Get all donations made by a user
 */
export async function getUserDonations(walletAddress) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/donations/user/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user donations:', error);
    throw error;
  }
}
