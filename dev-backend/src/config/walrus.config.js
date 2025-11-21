module.exports = {
  apiUrl: process.env.WALRUS_API_URL,
  storageEndpoint: process.env.WALRUS_STORAGE_ENDPOINT,
  
  // Storage configuration
  storage: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['image/*', 'video/*', 'application/pdf', 'text/*'],
    compressionEnabled: true,
  },
  
  // Content integrity settings
  integrity: {
    hashAlgorithm: 'sha256',
    verifyOnUpload: true,
    checkExisting: true,
  },
  
  // Retrieval settings
  retrieval: {
    timeout: 15000, // 15 seconds
    maxRetries: 3,
    cacheDuration: 3600, // 1 hour
  }
};
