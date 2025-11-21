const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const crypto = require('crypto');
const walrusConfig = require('../config/walrus.config');

class WalrusService {
  constructor() {
    this.apiUrl = walrusConfig.apiUrl;
    this.storageEndpoint = walrusConfig.storageEndpoint;
  }

  /**
   * Store file on Walrus and get CID
   */
  async storeFile(filePath, metadata = {}) {
    try {
      // Calculate file hash before upload
      const fileHash = await this.calculateFileHash(filePath);

      // Check if file already exists
      if (walrusConfig.integrity.checkExisting) {
        const existing = await this.checkExistingFile(fileHash);
        if (existing) {
          console.log('File already exists on Walrus');
          return {
            success: true,
            cid: existing.cid,
            hash: fileHash,
            alreadyExists: true,
            proofOfIntegrity: existing.poi
          };
        }
      }

      // Upload to Walrus
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('metadata', JSON.stringify({
        ...metadata,
        uploadTimestamp: new Date().toISOString(),
        originalHash: fileHash
      }));

      const response = await axios.post(
        `${this.storageEndpoint}/store`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          maxContentLength: walrusConfig.storage.maxFileSize,
          maxBodyLength: walrusConfig.storage.maxFileSize,
        }
      );

      // Generate Proof of Integrity (POI)
      const poi = await this.generateProofOfIntegrity(fileHash, response.data.cid);

      return {
        success: true,
        cid: response.data.cid,
        hash: fileHash,
        proofOfIntegrity: poi,
        alreadyExists: false,
        walrusUrl: `walrus://${response.data.cid}`
      };
    } catch (error) {
      console.error('Walrus storage error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Store data (not file) on Walrus
   * Uses Walrus Testnet API v1 endpoints
   */
  async storeData(data, dataType = 'json') {
    try {
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const dataHash = crypto.createHash('sha256').update(dataString).digest('hex');
      
      // Convert JSON to buffer for Walrus binary upload
      const dataBuffer = Buffer.from(dataString, 'utf-8');

      // Walrus API uses PUT request to /v1/store endpoint
      const url = `${this.storageEndpoint}/v1/store?epochs=5`;
      
      const response = await axios.put(
        url,
        dataBuffer,
        {
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      // Parse Walrus response (newlyCreated or alreadyCertified)
      let blobId = null;
      if (response.data.newlyCreated) {
        blobId = response.data.newlyCreated.blobObject.blobId;
      } else if (response.data.alreadyCertified) {
        blobId = response.data.alreadyCertified.blobId;
      }

      return {
        success: true,
        cid: blobId,
        hash: dataHash,
        url: blobId ? `${this.apiUrl}/v1/blobs/${blobId}` : null,
        walrusUrl: blobId ? `walrus://${blobId}` : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retrieve file from Walrus by CID
   */
  async retrieveFile(cid, outputPath = null) {
    try {
      const response = await axios.get(
        `${this.storageEndpoint}/retrieve/${cid}`,
        {
          responseType: outputPath ? 'stream' : 'json',
          timeout: walrusConfig.retrieval.timeout
        }
      );

      if (outputPath) {
        // Save to file
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
          writer.on('finish', () => resolve({
            success: true,
            filePath: outputPath,
            cid
          }));
          writer.on('error', reject);
        });
      } else {
        // Return data
        return {
          success: true,
          data: response.data,
          cid
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify file integrity using CID and hash
   */
  async verifyFileIntegrity(filePath, expectedCID) {
    try {
      // Calculate current file hash
      const currentHash = await this.calculateFileHash(filePath);

      // Retrieve stored file info from Walrus
      const storedInfo = await this.getFileInfo(expectedCID);

      if (!storedInfo.success) {
        return {
          verified: false,
          error: 'Could not retrieve file info from Walrus'
        };
      }

      // Compare hashes
      const hashesMatch = currentHash === storedInfo.hash;

      return {
        verified: hashesMatch,
        currentHash,
        storedHash: storedInfo.hash,
        cid: expectedCID,
        tampered: !hashesMatch
      };
    } catch (error) {
      return {
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Get file information from Walrus
   */
  async getFileInfo(cid) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/info/${cid}`,
        {
          timeout: walrusConfig.retrieval.timeout
        }
      );

      return {
        success: true,
        cid,
        hash: response.data.hash,
        metadata: response.data.metadata,
        size: response.data.size,
        uploadedAt: response.data.uploadedAt
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if file already exists on Walrus
   */
  async checkExistingFile(fileHash) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/check/${fileHash}`
      );

      if (response.data.exists) {
        return {
          exists: true,
          cid: response.data.cid,
          poi: response.data.proofOfIntegrity
        };
      }

      return null;
    } catch (error) {
      // File doesn't exist or error checking
      return null;
    }
  }

  /**
   * Calculate SHA-256 hash of file
   */
  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Generate Proof of Integrity
   */
  async generateProofOfIntegrity(fileHash, cid) {
    const proofData = {
      fileHash,
      cid,
      timestamp: new Date().toISOString(),
      algorithm: walrusConfig.integrity.hashAlgorithm
    };

    // Create proof hash
    const proofHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(proofData))
      .digest('hex');

    return {
      ...proofData,
      proofHash,
      verifiable: true
    };
  }

  /**
   * Store AI analysis results on Walrus
   */
  async storeAnalysisResults(analysisData) {
    try {
      const result = await this.storeData(analysisData, 'json');

      return {
        success: result.success,
        analysisCID: result.cid,
        hash: result.hash,
        retrievalUrl: result.walrusUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Detect content manipulation by comparing hashes
   */
  async detectManipulation(originalCID, newFilePath) {
    try {
      // Get original file info
      const originalInfo = await this.getFileInfo(originalCID);
      
      if (!originalInfo.success) {
        return {
          manipulated: null,
          error: 'Could not retrieve original file info'
        };
      }

      // Calculate new file hash
      const newHash = await this.calculateFileHash(newFilePath);

      // Compare
      const manipulated = originalInfo.hash !== newHash;

      return {
        manipulated,
        originalHash: originalInfo.hash,
        newHash,
        originalCID,
        confidence: manipulated ? 1.0 : 0.0
      };
    } catch (error) {
      return {
        manipulated: null,
        error: error.message
      };
    }
  }

  /**
   * Batch store multiple files
   */
  async batchStoreFiles(filePaths) {
    try {
      const results = await Promise.all(
        filePaths.map(path => this.storeFile(path))
      );

      return {
        success: true,
        results,
        totalFiles: filePaths.length,
        successCount: results.filter(r => r.success).length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new WalrusService();
