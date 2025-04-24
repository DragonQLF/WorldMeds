// Configuration settings for the application
module.exports = {
  // Server configuration
  PORT: 3001,
  NODE_ENV: 'development',
  
  // JWT configuration
  JWT_SECRET: 'worldmeds-secret-key',
  JWT_EXPIRATION: '24h',
  
  // Database configuration
  DB_HOST: 'localhost',
  DB_USER: 'worldmeds_user',
  DB_PASSWORD: '1234',
  DB_NAME: 'worldmeds_db',
  
  // API configuration
  API_URL: 'http://localhost:3001',
  FRONTEND_URL: 'http://localhost:5173',
  
  // CORS configuration
  ALLOWED_ORIGINS: ['http://localhost:8080', 'http://localhost:5173'],
  
  // File upload configuration
  UPLOAD_DIR: 'public/uploads',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Use these settings in production
  isProduction: () => false,
  
  // Security settings
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100, // 100 requests per window
  PASSWORD_SALT_ROUNDS: 10
}; 