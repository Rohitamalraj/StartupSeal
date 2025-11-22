require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// const connectDB = require('./config/database');

// Import routes
// const projectRoutes = require('./routes/project.routes');
const aiRoutes = require('./routes/ai.routes');
const verifyRoutes = require('./routes/verify.routes');
const githubRoutes = require('./routes/github.routes');
const sealsRoutes = require('./routes/seals.routes');
const donationsRoutes = require('./routes/donations.routes');
const usersRoutes = require('./routes/users.routes');
// const dataRoutes = require('./routes/data.routes');
// const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for demo frontend
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting - lenient for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased to 1000 for development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', limiter);

// Database connection (non-blocking)
// connectDB();

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'StartupSeal - Document Verification Backend with AI Gatekeeper'
  });
});

// API Routes
// app.use('/api/projects', projectRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/seals', sealsRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/users', usersRoutes);
// app.use('/api/data', dataRoutes);
// app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🚀 StartupSeal Document Verification Backend`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 AI Gatekeeper: Enabled`);
  console.log(`💾 Walrus Storage: Testnet`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  POST   /api/verify/media-upload         - Upload single file with AI check`);
  console.log(`  POST   /api/verify/media-upload-batch   - Upload multiple files with AI check`);
  console.log(`  POST   /api/verify/media                - Verify media by CID`);
  console.log(`  POST   /api/verify/integrity            - Check file integrity`);
  console.log(`  GET    /api/verify/file/:cid            - Get file info from Walrus`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

module.exports = app;
