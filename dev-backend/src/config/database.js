const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.warn('⚠️  MongoDB not available - Using in-memory storage for demo');
    console.warn('💡 Install MongoDB or use Docker for persistence');
    // Don't exit - continue without MongoDB for demo purposes
  }
};

module.exports = connectDB;
