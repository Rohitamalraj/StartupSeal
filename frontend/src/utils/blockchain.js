import axios from 'axios';

const AGGREGATOR = import.meta.env.VITE_WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space';
const PUBLISHER = import.meta.env.VITE_WALRUS_PUBLISHER || 'https://publisher.walrus-testnet.walrus.space';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Upload files to Walrus as individual blobs
 */
export async function uploadToWalrus(files, epochs = 10) {
  const formData = new FormData();
  
  // Add files
  files.forEach(({ identifier, file }) => {
    formData.append(identifier, file);
  });
  
  // Add metadata
  const metadata = files.map(({ identifier, tags }) => ({
    identifier,
    tags: tags || {}
  }));
  formData.append('_metadata', JSON.stringify(metadata));

  try {
    const response = await axios.put(
      `${PUBLISHER}/v1/quilts?epochs=${epochs}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const result = response.data;
    
    if (result.newlyCreated) {
      return {
        quiltId: result.newlyCreated.quiltObject.quiltId,
        objectId: result.newlyCreated.quiltObject.id,
        blobIds: result.newlyCreated.quiltObject.blobs.reduce((acc, blob) => {
          acc[blob.identifier] = blob.blobId;
          return acc;
        }, {}),
        cost: result.newlyCreated.cost,
      };
    } else if (result.alreadyCertified) {
      return {
        quiltId: result.alreadyCertified.quiltId,
        blobIds: {},
        status: 'already_certified',
      };
    }
  } catch (error) {
    console.error('Walrus upload failed:', error);
    throw new Error(`Failed to upload to Walrus: ${error.message}`);
  }
}

/**
 * Download blob from Walrus
 */
export async function downloadFromWalrus(blobId) {
  try {
    const response = await axios.get(
      `${AGGREGATOR}/v1/blobs/${blobId}`,
      { responseType: 'blob' }
    );
    
    return response.data;
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error(`Failed to download from Walrus: ${error.message}`);
  }
}

/**
 * Fetch all startup seals from blockchain using backend API
 */
export async function getAllStartupSeals() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/seals/all`);
    return response.data.seals || [];
  } catch (error) {
    console.error('Failed to fetch seals:', error);
    throw new Error(`Failed to fetch startup seals: ${error.message}`);
  }
}

/**
 * Fetch a specific startup seal by ID
 */
export async function getStartupSealById(sealId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/seals/${sealId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch seal:', error);
    throw new Error(`Failed to fetch startup seal: ${error.message}`);
  }
}

/**
 * Fetch startup seals by wallet address
 */
export async function getStartupSealsByAddress(address) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/seals/address/${address}`);
    return response.data.seals || [];
  } catch (error) {
    console.error('Failed to fetch seals by address:', error);
    throw new Error(`Failed to fetch startup seals: ${error.message}`);
  }
}

/**
 * Search startup seals by name or GitHub repo
 */
export async function searchStartupSeals(query) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/seals/search`, {
      params: { q: query }
    });
    return response.data.seals || [];
  } catch (error) {
    console.error('Search failed:', error);
    throw new Error(`Failed to search startup seals: ${error.message}`);
  }
}

/**
 * Get leaderboard data (top startups by trust score)
 */
export async function getLeaderboard(filters = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/seals/leaderboard`, {
      params: filters
    });
    return response.data.seals || [];
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    throw new Error(`Failed to fetch leaderboard: ${error.message}`);
  }
}

/**
 * Fetch certificate documents from Walrus
 */
export async function fetchCertificateData(blobIds) {
  try {
    const documents = await Promise.all(
      blobIds.map(async (blobId) => {
        try {
          const blob = await downloadFromWalrus(blobId);
          return {
            blobId,
            blob,
            url: URL.createObjectURL(blob),
          };
        } catch (error) {
          console.error(`Failed to fetch blob ${blobId}:`, error);
          return { blobId, error: error.message };
        }
      })
    );
    return documents.filter(doc => !doc.error);
  } catch (error) {
    console.error('Failed to fetch certificates:', error);
    throw new Error(`Failed to fetch certificate data: ${error.message}`);
  }
}
