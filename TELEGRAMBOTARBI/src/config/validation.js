// File: /arbibot/src/config/validation.js
import { CONSTANTS } from './index.js';

export class ConfigValidation {
  static validateInvestment(amount) {
    const value = parseFloat(amount);
    return !isNaN(value) && 
           value >= CONSTANTS.minInvestmentAmount && 
           value <= CONSTANTS.maxInvestmentAmount;
  }

  static validateOdds(odds) {
    return odds.every(odd => 
      typeof odd === 'number' && 
      odd >= CONSTANTS.minOddsValue && 
      odd <= CONSTANTS.maxOddsValue
    );
  }

  static validateLanguage(language) {
    return CONSTANTS.supportedLanguages.includes(language);
  }

  static validateTheme(theme) {
    return CONSTANTS.supportedThemes.includes(theme);
  }

  static validateOddsFormat(format) {
    return CONSTANTS.supportedOddsFormats.includes(format.toLowerCase());
  }

  static validateTaxRate(rate) {
    const value = parseFloat(rate);
    return !isNaN(value) && value >= 0 && value <= 100;
  }

  static validateFeeRate(rate) {
    const value = parseFloat(rate);
    return !isNaN(value) && value >= 0 && value <= 100;
  }

  static validatePhoneNumber(phoneNumber) {
    // Basic phone number validation
    // You might want to use a more sophisticated validation library in production
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  }

  static validatePreferences(prefs) {
    return {
      language: this.validateLanguage(prefs.language),
      theme: this.validateTheme(prefs.theme),
      oddsFormat: this.validateOddsFormat(prefs.oddsFormat),
      defaultInvestment: this.validateInvestment(prefs.defaultInvestment),
      includeTaxCalculation: typeof prefs.includeTaxCalculation === 'boolean',
      includeFeesCalculation: typeof prefs.includeFeesCalculation === 'boolean',
      notifications: typeof prefs.notifications === 'boolean'
    };
  }
}

// Utility function to check if required environment variables are set
export function validateEnv() {
  const required = ['BOT_TOKEN'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return true;
}

export const validation = {
  validateInvestment: ConfigValidation.validateInvestment,
  validateOdds: ConfigValidation.validateOdds,
  validateLanguage: ConfigValidation.validateLanguage,
  validateTheme: ConfigValidation.validateTheme,
  validateOddsFormat: ConfigValidation.validateOddsFormat,
  validateTaxRate: ConfigValidation.validateTaxRate,
  validateFeeRate: ConfigValidation.validateFeeRate,
  validatePhoneNumber: ConfigValidation.validatePhoneNumber,
  validatePreferences: ConfigValidation.validatePreferences,
  validateEnv
};