// config.js
export const config = {
    // Bot Configuration
    BOT_TOKEN: process.env.BOT_TOKEN || 'your-bot-token',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    
    // Database Configuration
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || 27017,
    DB_NAME: process.env.DB_NAME || 'arbibot',
    
    // API Configuration
    API_VERSION: 'v1',
    API_PORT: process.env.PORT || 3000,
    
    // Service Limits
    FREE_TIER_DAILY_LIMIT: 10,
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    RATE_LIMIT_MAX_REQUESTS: 30,
    
    // Premium Features
    PREMIUM_PRICE_MONTHLY: 9.99,
    PREMIUM_PRICE_YEARLY: 89.99,
    
    // Cache Configuration
    CACHE_TTL: 3600, // 1 hour in seconds
    
    // Security
    JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'your-encryption-key',
    
    // Cloudflare Configuration
    CF_ACCOUNT_ID: process.env.CF_ACCOUNT_ID,
    CF_API_TOKEN: process.env.CF_API_TOKEN,
    
    // Feature Flags
    FEATURES: {
      ENABLE_PHONE_VERIFICATION: true,
      ENABLE_PREMIUM_FEATURES: true,
      ENABLE_AFFILIATE_PROGRAM: true,
      ENABLE_NOTIFICATIONS: true
    }
  };