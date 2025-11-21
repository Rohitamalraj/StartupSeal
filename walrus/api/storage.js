const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const crypto = require('crypto');

// Walrus endpoints
const AGGREGATOR = process.env.AGGREGATOR || 'https://wal-aggregator-testnet.staketab.org';
const PUBLISHER = process.env.PUBLISHER || 'https://wal-publisher-testnet.staketab.org';

/**
 * Upload a single file to Walrus
 * @param {string} filePath - Path to file
 * @param {number} epochs - Number of epochs to store (optional)
 * @param {boolean} permanent - Whether to store permanently (optional)
 * @returns {Promise<Object>} Upload response with blobId
 */
async function uploadFile(filePath, epochs = null, permanent = false) {
    try {
        const fileStream = fs.createReadStream(filePath);
        const fileStats = fs.statSync(filePath);
        
        let url = `${PUBLISHER}/v1/blobs`;
        const params = new URLSearchParams();
        
        if (permanent) {
            params.append('permanent', 'true');
        } else if (epochs) {
            params.append('epochs', epochs.toString());
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        console.log(`📤 Uploading ${filePath} (${fileStats.size} bytes)...`);

        const response = await axios.put(url, fileStream, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Length': fileStats.size
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        const result = response.data;
        
        if (result.newlyCreated) {
            console.log('✅ File uploaded successfully (newly created)');
            return {
                blobId: result.newlyCreated.blobObject.blobId,
                objectId: result.newlyCreated.blobObject.id,
                size: result.newlyCreated.blobObject.size,
                endEpoch: result.newlyCreated.blobObject.storage.endEpoch,
                cost: result.newlyCreated.cost,
                status: 'newly_created'
            };
        } else if (result.alreadyCertified) {
            console.log('✅ File already certified');
            return {
                blobId: result.alreadyCertified.blobId,
                eventTxDigest: result.alreadyCertified.event.txDigest,
                endEpoch: result.alreadyCertified.endEpoch,
                status: 'already_certified'
            };
        }
    } catch (error) {
        console.error('❌ Upload failed:', error.message);
        throw error;
    }
}

/**
 * Upload multiple files as a Quilt
 * @param {Array<{identifier: string, filePath: string, tags: Object}>} files
 * @param {number} epochs - Number of epochs to store
 * @returns {Promise<Object>} Quilt upload response
 */
async function uploadQuilt(files, epochs = 5) {
    try {
        const form = new FormData();
        
        // Add files
        for (const file of files) {
            const fileStream = fs.createReadStream(file.filePath);
            form.append(file.identifier, fileStream);
        }
        
        // Add metadata
        const metadata = files.map(file => ({
            identifier: file.identifier,
            tags: file.tags || {}
        }));
        
        form.append('_metadata', JSON.stringify(metadata));

        const url = `${PUBLISHER}/v1/quilts?epochs=${epochs}`;
        
        console.log(`📦 Uploading quilt with ${files.length} files...`);

        const response = await axios.put(url, form, {
            headers: {
                ...form.getHeaders()
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        const result = response.data;
        
        if (result.newlyCreated) {
            console.log('✅ Quilt uploaded successfully');
            return {
                quiltId: result.newlyCreated.quiltObject.quiltId,
                objectId: result.newlyCreated.quiltObject.id,
                blobs: result.newlyCreated.quiltObject.blobs,
                endEpoch: result.newlyCreated.quiltObject.storage.endEpoch,
                cost: result.newlyCreated.cost,
                status: 'newly_created'
            };
        }
    } catch (error) {
        console.error('❌ Quilt upload failed:', error.message);
        throw error;
    }
}

/**
 * Download a blob by blob ID
 * @param {string} blobId - The blob ID
 * @param {string} outputPath - Where to save the file
 * @returns {Promise<void>}
 */
async function downloadBlob(blobId, outputPath) {
    try {
        const url = `${AGGREGATOR}/v1/blobs/${blobId}`;
        
        console.log(`📥 Downloading blob ${blobId}...`);

        const response = await axios.get(url, {
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ Downloaded to ${outputPath}`);
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('❌ Download failed:', error.message);
        throw error;
    }
}

/**
 * Download a blob from a quilt by identifier
 * @param {string} quiltId - The quilt ID
 * @param {string} identifier - The file identifier within the quilt
 * @param {string} outputPath - Where to save the file
 * @returns {Promise<void>}
 */
async function downloadFromQuilt(quiltId, identifier, outputPath) {
    try {
        const url = `${AGGREGATOR}/v1/blobs/by-quilt-id/${quiltId}/${identifier}`;
        
        console.log(`📥 Downloading ${identifier} from quilt ${quiltId}...`);

        const response = await axios.get(url, {
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ Downloaded to ${outputPath}`);
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('❌ Download failed:', error.message);
        throw error;
    }
}

/**
 * Download a blob by Sui object ID
 * @param {string} objectId - The Sui object ID
 * @param {string} outputPath - Where to save the file
 * @returns {Promise<void>}
 */
async function downloadByObjectId(objectId, outputPath) {
    try {
        const url = `${AGGREGATOR}/v1/blobs/by-object-id/${objectId}`;
        
        console.log(`📥 Downloading blob by object ID ${objectId}...`);

        const response = await axios.get(url, {
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log(`✅ Downloaded to ${outputPath}`);
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('❌ Download failed:', error.message);
        throw error;
    }
}

/**
 * Get blob metadata
 * @param {string} blobId - The blob ID
 * @returns {Promise<Object>} Blob metadata
 */
async function getBlobMetadata(blobId) {
    try {
        const url = `${AGGREGATOR}/v1/blobs/${blobId}/metadata`;
        
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to get metadata:', error.message);
        throw error;
    }
}

/**
 * Calculate SHA-256 hash of a file
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} Hex-encoded hash
 */
async function calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', data => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
}

/**
 * Verify downloaded file matches original
 * @param {string} originalPath - Original file path
 * @param {string} downloadedPath - Downloaded file path
 * @returns {Promise<boolean>} True if hashes match
 */
async function verifyDownload(originalPath, downloadedPath) {
    const originalHash = await calculateFileHash(originalPath);
    const downloadedHash = await calculateFileHash(downloadedPath);
    
    const matches = originalHash === downloadedHash;
    
    if (matches) {
        console.log('✅ File integrity verified');
    } else {
        console.log('❌ File integrity check failed');
    }
    
    return matches;
}

module.exports = {
    uploadFile,
    uploadQuilt,
    downloadBlob,
    downloadFromQuilt,
    downloadByObjectId,
    getBlobMetadata,
    calculateFileHash,
    verifyDownload,
    AGGREGATOR,
    PUBLISHER
};
