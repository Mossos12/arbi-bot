// File: /arbibot/src/config/index.js
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['BOT_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Bot configuration
export const BOT_CONFIG = {
  token: process.env.BOT_TOKEN,
  adminChatId: process.env.ADMIN_CHAT_ID,
  environment: process.env.NODE_ENV || 'development'
};

// User limits configuration
export const USER_LIMITS = {
  freeDailyCalculations: 10,
  maxHistoryItems: 100,
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30
  }
};

// Premium subscription configuration
export const PREMIUM_CONFIG = {
  prices: {
    monthly: 9.99,
    yearly: 89.99,
    lifetime: 299.99
  },
  features: {
    maxCalculations: Infinity,
    realTimeAlerts: true,
    prioritySupport: true,
    advancedAnalytics: true
  }
};

// Default user preferences
export const DEFAULT_PREFERENCES = {
  language: 'en',
  theme: 'dark',
  oddsFormat: 'decimal',
  defaultInvestment: 1000,
  includeTaxCalculation: true,
  includeFeesCalculation: true,
  notifications: true
};

// Feature flags
export const FEATURES = {
  phoneVerification: true,
  premiumSubscriptions: true,
  affiliateProgram: false,
  notifications: true,
  autoCalculations: true
};

// Application constants
export const CONSTANTS = {
  supportedLanguages: ['en', 'am'],
  supportedThemes: ['light', 'dark'],
  supportedOddsFormats: ['decimal', 'american', 'fractional', 'hong kong', 'indonesian', 'malaysian'],
  maxInvestmentAmount: 1000000,
  minInvestmentAmount: 10,
  maxOddsValue: 1000,
  minOddsValue: 1.01
};

// Error messages
export const ERROR_MESSAGES = {
  general: {
    somethingWentWrong: '❌ An error occurred. Please try again.',
    invalidInput: '⚠️ Invalid input. Please try again.',
    startOver: '⚠️ Please start over with /calculate',
    dailyLimitReached: '⚠️ Daily calculation limit reached. Upgrade to premium for unlimited calculations.',
    invalidPhoneNumber: '❌ Please provide a valid phone number.',
    invalidAmount: '⚠️ Please enter a valid amount.',
    invalidOdds: '⚠️ Please enter valid odds greater than 1.'
  },
  calculation: {
    noArbitrage: '❌ No arbitrage opportunity found with these odds.',
    invalidInvestment: '⚠️ Investment amount must be between $10 and $1,000,000.',
    invalidTaxRate: '⚠️ Tax rate must be between 0 and 100%.',
    invalidFees: '⚠️ Fees must be between 0 and 100%.'
  },
  auth: {
    phoneRequired: '📱 Please verify your phone number to continue.',
    unauthorizedAccess: '⚠️ You do not have access to this feature.',
    premiumRequired: '💎 This feature requires a premium subscription.'
  }
};

// Help messages
export const HELP_MESSAGES = {
  general: `
📚 *ArbiBot Complete Guide*

🔍 *What is Arbitrage Betting?*
Arbitrage betting is placing bets on all possible outcomes with different bookmakers to guarantee profit.

📝 *Basic Steps*
1️⃣ Enter your investment amount
2️⃣ Choose if draw odds are included
3️⃣ Configure tax settings (optional)
4️⃣ Enter odds for each outcome
5️⃣ Get your calculation results

💡 *Tips*
• Consider all fees and taxes
• Verify odds before betting
• Monitor withdrawal times
• Start with smaller amounts
`,
  commands: `
🤖 *Available Commands*
/calculate - Start new calculation
/settings - Adjust preferences
/history - View past calculations
/premium - Upgrade account
/help - Show this help message
`,
  premium: `
💎 *Premium Features*
• Unlimited calculations
• Real-time alerts
• Priority support
• Advanced analytics
• Multiple bookmakers support
`
};

// Export configuration object
export const config = {
  BOT_CONFIG,
  USER_LIMITS,
  PREMIUM_CONFIG,
  DEFAULT_PREFERENCES,
  FEATURES,
  CONSTANTS,
  ERROR_MESSAGES,
  HELP_MESSAGES
};