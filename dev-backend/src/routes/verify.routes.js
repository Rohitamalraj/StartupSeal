const express = require('express');
const router = express.Router();
const walrusService = require('../services/walrus.service');
const aiService = require('../services/ai.service');
const documentAnalyzer = require('../services/documentAnalyzer.service');
const multer = require('multer');
const path = require('path');

// Configure multer to preserve file extensions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Preserve original file extension for proper analysis
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

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
 * Upload and verify media file with AI legitimacy check
 */
router.post('/media-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    console.log(`\n📤 Processing upload: ${req.file.originalname}`);

    // STEP 1: AI Legitimacy Analysis
    console.log('🔍 STEP 1: AI Legitimacy Check...');
    const legitimacyCheck = await documentAnalyzer.analyzeDocumentLegitimacy(req.file.path);

    if (!legitimacyCheck.legitimate) {
      // Clean up file
      const fs = require('fs');
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        error: 'Document failed legitimacy check',
        legitimate: false,
        score: legitimacyCheck.score,
        flags: legitimacyCheck.flags,
        details: legitimacyCheck.details,
        message: 'AI-generated, edited, or manipulated images are not allowed'
      });
    }

    console.log(`✅ Legitimacy check PASSED (score: ${legitimacyCheck.score}/100)`);

    // STEP 2: Store on Walrus
    console.log('📤 STEP 2: Storing on Walrus...');
    const storeResult = await walrusService.storeFile(req.file.path, {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      legitimacyScore: legitimacyCheck.score,
      fileHash: legitimacyCheck.details.fileHash
    });

    if (!storeResult.success) {
      // Clean up file
      const fs = require('fs');
      fs.unlinkSync(req.file.path);

      return res.status(500).json({
        error: 'Failed to store file on Walrus',
        message: storeResult.error
      });
    }

    console.log(`✅ Stored on Walrus - Blob ID: ${storeResult.cid}`);

    // STEP 3: Verify integrity if expected CID provided
    const { expectedCID } = req.body;
    let verification = null;
    if (expectedCID) {
      verification = await walrusService.verifyFileIntegrity(req.file.path, expectedCID);
    }

    // Clean up uploaded file
    const fs = require('fs');
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      legitimate: true,
      legitimacyScore: legitimacyCheck.score,
      cid: storeResult.cid,
      blobId: storeResult.cid,
      hash: storeResult.hash,
      fileHash: legitimacyCheck.details.fileHash,
      alreadyExists: storeResult.alreadyExists,
      verification,
      proofOfIntegrity: storeResult.proofOfIntegrity,
      walrusUrl: storeResult.walrusUrl,
      checks: {
        legitimacy: legitimacyCheck.checks,
        flags: legitimacyCheck.flags
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      error: 'Upload and verification failed',
      message: error.message
    });
  } finally {
    // Ensure cleanup
    if (req.file) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Already deleted
      }
    }
  }
});

/**
 * POST /api/verify/media-upload-batch
 * Upload and verify multiple media files with AI legitimacy check
 */
router.post('/media-upload-batch', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded'
      });
    }

    console.log(`\n📤 Processing batch upload: ${req.files.length} files`);

    // STEP 1: AI Legitimacy Analysis (Batch)
    console.log('🔍 STEP 1: AI Legitimacy Check (Batch)...');
    const filePaths = req.files.map(f => f.path);
    const batchAnalysis = await documentAnalyzer.analyzeDocumentBatch(filePaths);

    if (!batchAnalysis.allLegitimate) {
      // Clean up all files
      const fs = require('fs');
      req.files.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (e) {}
      });

      return res.status(400).json({
        error: 'One or more documents failed legitimacy check',
        legitimate: false,
        averageScore: batchAnalysis.averageScore,
        results: batchAnalysis.results.map((r, idx) => ({
          filename: req.files[idx].originalname,
          legitimate: r.legitimate,
          score: r.score,
          flags: r.flags
        })),
        message: 'AI-generated, edited, or manipulated images are not allowed'
      });
    }

    console.log(`✅ All files passed legitimacy check (avg score: ${batchAnalysis.averageScore}/100)`);

    // STEP 2: Store on Walrus (Batch)
    console.log('📤 STEP 2: Storing on Walrus (Batch)...');
    const uploadResults = [];
    const fs = require('fs');
    const filesToCleanup = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const analysis = batchAnalysis.results[i];

      try {
        const storeResult = await walrusService.storeFile(file.path, {
          originalName: file.originalname,
          mimeType: file.mimetype,
          legitimacyScore: analysis.score,
          fileHash: analysis.details.fileHash
        });

        uploadResults.push({
          filename: file.originalname,
          legitimacyScore: analysis.score,
          cid: storeResult.cid,
          blobId: storeResult.cid,
          hash: storeResult.hash,
          fileHash: analysis.details.fileHash,
          walrusUrl: storeResult.walrusUrl,
          success: storeResult.success
        });
        
        // Mark for cleanup after successful upload
        filesToCleanup.push(file.path);
      } catch (uploadError) {
        console.error(`❌ Failed to upload ${file.originalname}:`, uploadError.message);
        uploadResults.push({
          filename: file.originalname,
          legitimacyScore: analysis.score,
          success: false,
          error: uploadError.message
        });
        // Still cleanup this file
        filesToCleanup.push(file.path);
      }
    }
    
    // Clean up all files after processing
    filesToCleanup.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn(`Warning: Could not delete ${filePath}`);
      }
    });

    const allSuccess = uploadResults.every(r => r.success);

    res.json({
      success: allSuccess,
      totalFiles: req.files.length,
      legitimacyCheck: {
        allLegitimate: true,
        averageScore: batchAnalysis.averageScore
      },
      results: uploadResults,
      message: allSuccess ? 'All files uploaded successfully' : 'Some files failed to upload'
    });
  } catch (error) {
    console.error('❌ Batch upload error:', error);
    
    // Cleanup files on error
    if (req.files) {
      const fs = require('fs');
      req.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        } catch (e) {}
      });
    }
    
    res.status(500).json({
      error: 'Batch upload failed',
      message: error.message
    });
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
