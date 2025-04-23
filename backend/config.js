// Configuration settings for the application
module.exports = {
  // Server configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'worldmeds-secret-key',
  JWT_EXPIRATION: '7d',
  
  // Database configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'worldmeds_user',
  DB_PASSWORD: process.env.DB_PASSWORD || '1234',
  DB_NAME: process.env.DB_NAME || 'worldmeds_db',
  
  // CORS configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',
  
  // File upload configuration
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'public/uploads',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Use these settings in production
  isProduction: () => process.env.NODE_ENV === 'production'
}; 