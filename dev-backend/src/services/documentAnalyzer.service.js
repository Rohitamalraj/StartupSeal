const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const ExifParser = require('exif-parser');

const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

class DocumentAnalyzerService {
  /**
   * Comprehensive document legitimacy analysis
   * @param {string} filePath - Path to the file to analyze
   * @returns {Promise<{legitimate: boolean, score: number, checks: object, flags: array}>}
   */
  async analyzeDocumentLegitimacy(filePath) {
    console.log(`\n🔍 Analyzing document legitimacy: ${filePath}`);
    
    const results = {
      legitimate: true,
      score: 100,
      checks: {},
      flags: [],
      details: {}
    };

    try {
      // Check 1: File metadata analysis
      console.log('   📋 Step 1: Metadata analysis...');
      const metadataCheck = await this.analyzeMetadata(filePath);
      results.checks.metadata = metadataCheck;
      
      if (!metadataCheck.passed) {
        results.score -= 20;
        results.flags.push(...metadataCheck.flags);
      }

      // Check 2: Google Vision API analysis (for images)
      console.log('   📋 Step 2: Checking if image file...');
      const fileExt = filePath.toLowerCase().split('.').pop();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
      console.log(`   File extension: ${fileExt}, Is image: ${imageExtensions.includes(fileExt)}`);
      
      if (imageExtensions.includes(fileExt)) {
        console.log('   📸 Calling Google Vision API...');
        const visionCheck = await this.analyzeWithGoogleVision(filePath);
        results.checks.vision = visionCheck;
        
        console.log(`   Vision API result: passed=${visionCheck.passed}, penalty=${visionCheck.scorePenalty}, flags=${visionCheck.flags.length}`);
        
        if (!visionCheck.passed) {
          results.score -= visionCheck.scorePenalty;
          results.flags.push(...visionCheck.flags);
          results.legitimate = false; // Immediately mark as illegitimate
        }
        
        results.details.visionLabels = visionCheck.labels;
        results.details.safeSearch = visionCheck.safeSearch;
      }

      // Check 3: File hash uniqueness (detect duplicates)
      const hashCheck = this.computeFileHash(filePath);
      results.checks.hash = hashCheck;
      results.details.fileHash = hashCheck.hash;

      // Final legitimacy decision
      if (results.score < 60) {
        results.legitimate = false;
        console.log(`❌ Document FAILED legitimacy check (score: ${results.score}/100)`);
      } else {
        results.legitimate = true;
        console.log(`✅ Document PASSED legitimacy check (score: ${results.score}/100)`);
      }

    } catch (error) {
      console.error('❌ Document analysis error:', error.message);
      console.error('   Stack:', error.stack);
      
      // ❌ On analysis error, REJECT for security
      results.legitimate = false;
      results.score = 0;
      results.checks.error = error.message;
      results.flags.push('❌ Analysis failed - document REJECTED for security');
    }

    return results;
  }

  /**
   * Analyze file metadata and EXIF data
   */
  async analyzeMetadata(filePath) {
    const result = {
      passed: true,
      flags: [],
      details: {}
    };

    try {
      const stats = fs.statSync(filePath);
      const fileBuffer = fs.readFileSync(filePath);
      
      // Check file size (very large files could be suspicious)
      if (stats.size > 50 * 1024 * 1024) { // 50MB
        result.flags.push('File size exceeds 50MB - unusually large');
        result.passed = false;
      }

      // Check EXIF data for images
      const fileExt = filePath.toLowerCase().split('.').pop();
      if (['jpg', 'jpeg'].includes(fileExt)) {
        try {
          const parser = ExifParser.create(fileBuffer);
          const exifData = parser.parse();
          
          result.details.exif = {
            make: exifData.tags.Make,
            model: exifData.tags.Model,
            software: exifData.tags.Software,
            dateTime: exifData.tags.DateTime
          };

          // ❌ STRICT CHECK: Reject AI generation software signatures
          const aiSoftwareSignatures = [
            'midjourney', 'dall-e', 'stable diffusion', 'ai generator',
            'leonardo.ai', 'adobe firefly', 'runway', 'gemini', 'chatgpt',
            'artificial intelligence', 'neural network', 'diffusion model'
          ];
          
          const softwareStr = (exifData.tags.Software || '').toLowerCase();
          if (aiSoftwareSignatures.some(sig => softwareStr.includes(sig))) {
            result.flags.push('❌ AI-generated image detected - REJECTED');
            result.passed = false;
          }

          // ❌ STRICT CHECK: Reject heavy editing software
          const editingSoftware = ['photoshop', 'gimp', 'affinity', 'pixelmator', 'paint.net'];
          if (editingSoftware.some(soft => softwareStr.includes(soft))) {
            result.flags.push('❌ Image edited with professional software - REJECTED');
            result.passed = false;
          }

          // ❌ STRICT CHECK: Reject if metadata appears modified
          if (exifData.tags.DateTime) {
            const exifDate = new Date(exifData.tags.DateTime * 1000);
            const fileDate = stats.mtime;
            const timeDiff = Math.abs(fileDate - exifDate);
            
            // If file modification date is significantly different from EXIF date
            if (timeDiff > 86400000 * 7) { // 7 days difference
              result.flags.push('❌ Metadata appears modified - date mismatch detected');
              result.passed = false;
            }
          }

        } catch (exifError) {
          // No EXIF data found - reject non-screenshot images without EXIF
          result.details.exif = null;
          result.flags.push('⚠️ No EXIF data found - metadata may have been stripped');
          // Don't auto-reject here, let Vision API check if it's a screenshot
        }
      }

      // Check for PNG images (common for AI-generated content)
      if (fileExt === 'png') {
        // PNG files often don't have EXIF data, so we'll rely more on Vision API
        result.details.isPNG = true;
      }

    } catch (error) {
      console.error('Metadata analysis error:', error.message);
      result.flags.push('Could not analyze metadata');
    }

    console.log(`   Metadata check: ${result.passed ? 'PASS' : 'FAIL'} (${result.flags.length} flags)`);
    return result;
  }

  /**
   * Analyze image with Google Vision API
   */
  async analyzeWithGoogleVision(filePath) {
    const result = {
      passed: true,
      scorePenalty: 0,
      flags: [],
      labels: [],
      safeSearch: {}
    };

    try {
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');

      const requestBody = {
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'SAFE_SEARCH_DETECTION' },
              { type: 'IMAGE_PROPERTIES' },
              { type: 'WEB_DETECTION' },
              { type: 'DOCUMENT_TEXT_DETECTION' }
            ]
          }
        ]
      };

      console.log('   📡 Calling Google Vision API...');
      const response = await axios.post(
        `${VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`,
        requestBody,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );

      const visionResult = response.data.responses[0];

      // Extract labels
      if (visionResult.labelAnnotations) {
        result.labels = visionResult.labelAnnotations.map(l => ({
          description: l.description,
          score: l.score
        }));

        // ✅ ALLOW: Screenshots are legitimate
        const screenshotLabels = ['screenshot', 'computer screen', 'display device', 'monitor', 'screen capture'];
        const isScreenshot = result.labels.some(l => 
          screenshotLabels.some(sl => l.description.toLowerCase().includes(sl))
        );

        if (isScreenshot) {
          console.log('   ✅ Screenshot detected - ALLOWED');
          result.details = { isScreenshot: true };
          // Screenshots are allowed, return early
          return result;
        }

        // ❌ REJECT: AI-generated content
        const aiGeneratedLabels = [
          'digital art', 'cg artwork', 'computer graphics',
          'artificial intelligence', 'ai generated', 'synthetic image',
          'neural network', 'deep learning', 'generated image',
          'ai art', 'machine learning', 'illustration', 'anime'
        ];
        
        const isAIGenerated = result.labels.some(l => 
          aiGeneratedLabels.some(al => l.description.toLowerCase().includes(al)) && l.score > 0.6
        );

        if (isAIGenerated) {
          result.flags.push('❌ AI-generated or digitally created content - REJECTED');
          result.scorePenalty += 100;
          result.passed = false;
        }

        // ❌ REJECT: Graphic design/editing indicators
        const editingLabels = ['graphic design', 'photo editing', 'image editing', 'compositing'];
        const isEdited = result.labels.some(l => 
          editingLabels.some(el => l.description.toLowerCase().includes(el)) && l.score > 0.6
        );

        if (isEdited) {
          result.flags.push('❌ Image appears to be heavily edited - REJECTED');
          result.scorePenalty += 100;
          result.passed = false;
        }
      }

      // Safe Search analysis
      if (visionResult.safeSearchAnnotation) {
        result.safeSearch = visionResult.safeSearchAnnotation;
        
        // ❌ REJECT: Inappropriate content
        const inappropriate = ['adult', 'violence', 'racy', 'spoof', 'medical'];
        for (const category of inappropriate) {
          if (visionResult.safeSearchAnnotation[category] === 'VERY_LIKELY' ||
              visionResult.safeSearchAnnotation[category] === 'LIKELY') {
            result.flags.push(`❌ Inappropriate content detected: ${category} - REJECTED`);
            result.scorePenalty += 100;
            result.passed = false;
          }
        }
      }

      // ❌ REJECT: Stock photos or widely circulated images
      if (visionResult.webDetection) {
        const webMatches = visionResult.webDetection.fullMatchingImages || [];
        const partialMatches = visionResult.webDetection.partialMatchingImages || [];
        
        if (webMatches.length > 3) {
          result.flags.push(`❌ Stock photo or duplicate found online (${webMatches.length} exact matches) - REJECTED`);
          result.scorePenalty += 100;
          result.passed = false;
        }

        result.details = {
          fullMatches: webMatches.length,
          partialMatches: partialMatches.length
        };
      }

      console.log(`   Google Vision check: ${result.passed ? 'PASS' : 'FAIL'} (penalty: -${result.scorePenalty})`);

    } catch (error) {
      console.error('   ❌ Google Vision API error:', error.response?.data || error.message);
      console.error('   Vision API stack:', error.stack);
      
      // ❌ On Vision API failure, REJECT for security
      result.flags.push('❌ Vision API failed - document REJECTED for security');
      result.scorePenalty = 100;
      result.passed = false;
    }

    return result;
  }

  /**
   * Compute SHA-256 hash of file
   */
  computeFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    return {
      hash: `0x${hash}`,
      algorithm: 'SHA-256',
      timestamp: Date.now()
    };
  }

  /**
   * Batch analyze multiple documents
   */
  async analyzeDocumentBatch(filePaths) {
    console.log(`\n🔍 Batch analyzing ${filePaths.length} documents...`);
    
    const results = [];
    let allLegitimate = true;
    let totalScore = 0;

    for (const filePath of filePaths) {
      const analysis = await this.analyzeDocumentLegitimacy(filePath);
      results.push(analysis);
      
      if (!analysis.legitimate) {
        allLegitimate = false;
      }
      totalScore += analysis.score;
    }

    const averageScore = Math.round(totalScore / filePaths.length);

    console.log(`\n📊 Batch Analysis Complete:`);
    console.log(`   Total Documents: ${filePaths.length}`);
    console.log(`   Legitimate: ${results.filter(r => r.legitimate).length}`);
    console.log(`   Suspicious: ${results.filter(r => !r.legitimate).length}`);
    console.log(`   Average Score: ${averageScore}/100`);

    return {
      allLegitimate,
      averageScore,
      results,
      totalDocuments: filePaths.length,
      legitimateCount: results.filter(r => r.legitimate).length,
      suspiciousCount: results.filter(r => !r.legitimate).length
    };
  }
}

module.exports = new DocumentAnalyzerService();
