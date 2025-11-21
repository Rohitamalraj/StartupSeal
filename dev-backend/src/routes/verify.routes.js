const express = require('express');
const router = express.Router();
const walrusService = require('../services/walrus.service');
const aiService = require('../services/ai.service');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

/**
 * POST /api/verify/media
 * Verify media authenticity using CID
 */
router.post('/media', async (req, res) => {
  try {
    const { cid } = req.body;

    if (!cid) {
      return res.status(400).json({
        error: 'CID is required'
      });
    }

    const result = await aiService.verifyMediaAuthenticity(cid);

    res.json({
      cid,
      verified: result.verified,
      fileInfo: result.fileInfo,
      manipulation: result.manipulated,
      error: result.error
    });
  } catch (error) {
    res.status(500).json({
      error: 'Verification failed',
      message: error.message
    });
  }
});

/**
 * POST /api/verify/media-upload
 * Upload and verify media file
 */
router.post('/media-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    const { expectedCID } = req.body;

    // Store on Walrus
    const storeResult = await walrusService.storeFile(req.file.path, {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype
    });

    // Verify integrity if expected CID provided
    let verification = null;
    if (expectedCID) {
      verification = await walrusService.verifyFileIntegrity(req.file.path, expectedCID);
    }

    res.json({
      success: true,
      cid: storeResult.cid,
      hash: storeResult.hash,
      alreadyExists: storeResult.alreadyExists,
      verification,
      proofOfIntegrity: storeResult.proofOfIntegrity
    });
  } catch (error) {
    res.status(500).json({
      error: 'Upload and verification failed',
      message: error.message
    });
  } finally {
    // Clean up uploaded file
    if (req.file) {
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
    }
  }
});

/**
 * GET /api/verify/file/:cid
 * Get file information from Walrus
 */
router.get('/file/:cid', async (req, res) => {
  try {
    const { cid } = req.params;

    const fileInfo = await walrusService.getFileInfo(cid);

    if (!fileInfo.success) {
      return res.status(404).json({
        error: 'File not found',
        cid
      });
    }

    res.json({
      cid,
      hash: fileInfo.hash,
      size: fileInfo.size,
      metadata: fileInfo.metadata,
      uploadedAt: fileInfo.uploadedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve file info',
      message: error.message
    });
  }
});

/**
 * POST /api/verify/integrity
 * Check if file has been tampered with
 */
router.post('/integrity', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    const { originalCID } = req.body;

    if (!originalCID) {
      return res.status(400).json({
        error: 'Original CID is required'
      });
    }

    const result = await walrusService.detectManipulation(originalCID, req.file.path);

    res.json({
      originalCID,
      manipulated: result.manipulated,
      originalHash: result.originalHash,
      currentHash: result.newHash,
      confidence: result.confidence,
      message: result.manipulated 
        ? 'File has been modified from original'
        : 'File matches original'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Integrity check failed',
      message: error.message
    });
  } finally {
    if (req.file) {
      const fs = require('fs');
      fs.unlinkSync(req.file.path);
    }
  }
});

/**
 * POST /api/verify/proof
 * Verify Nautilus computation proof
 */
router.post('/proof', async (req, res) => {
  try {
    const { proofCID } = req.body;

    if (!proofCID) {
      return res.status(400).json({
        error: 'Proof CID is required'
      });
    }

    const nautilusService = require('../services/nautilus.service');
    const verification = await nautilusService.verifyProof(proofCID);

    res.json({
      proofCID,
      valid: verification.valid,
      proof: verification.proof,
      verifiedAt: verification.verifiedAt,
      error: verification.error
    });
  } catch (error) {
    res.status(500).json({
      error: 'Proof verification failed',
      message: error.message
    });
  }
});

/**
 * GET /api/verify/batch
 * Batch verify multiple CIDs
 */
router.post('/batch', async (req, res) => {
  try {
    const { cids } = req.body;

    if (!cids || !Array.isArray(cids)) {
      return res.status(400).json({
        error: 'CIDs array is required'
      });
    }

    const results = await Promise.all(
      cids.map(async (cid) => {
        const fileInfo = await walrusService.getFileInfo(cid);
        return {
          cid,
          exists: fileInfo.success,
          hash: fileInfo.hash,
          error: fileInfo.error
        };
      })
    );

    res.json({
      totalChecked: cids.length,
      results
    });
  } catch (error) {
    res.status(500).json({
      error: 'Batch verification failed',
      message: error.message
    });
  }
});

module.exports = router;
