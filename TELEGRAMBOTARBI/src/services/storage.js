// File: /arbibot/src/services/storage.js
export class Storage {
    constructor() {
      this.states = new Map();
      this.preferences = new Map();
      this.history = new Map();
      this.activities = new Map();
      this.calculations = new Map();
    }
  
    // State management
    async setState(chatId, state) {
      this.states.set(chatId.toString(), state);
    }
  
    async getState(chatId) {
      return this.states.get(chatId.toString());
    }
  
    async deleteState(chatId) {
      return this.states.delete(chatId.toString());
    }
  
    // Preferences management
    async setPreferences(chatId, preferences) {
      this.preferences.set(chatId.toString(), preferences);
    }
  
    async getPreferences(chatId) {
      return this.preferences.get(chatId.toString());
    }
  
    // History management
    async addCalculation(chatId, calculation) {
      const calculations = this.calculations.get(chatId.toString()) || [];
      calculations.unshift({
        ...calculation,
        timestamp: new Date().toISOString()
      });
      this.calculations.set(chatId.toString(), calculations);
    }
  
    async getCalculations(chatId) {
      return this.calculations.get(chatId.toString()) || [];
    }
  
    async appendToList(key, value) {
      const list = this.activities.get(key) || [];
      list.unshift(value);
      this.activities.set(key, list);
    }
  
    // Statistics helpers
    async getTodayCalculationsForUser(chatId) {
      const today = new Date().toDateString();
      const calculations = await this.getCalculations(chatId);
      return calculations.filter(calc => 
        new Date(calc.timestamp).toDateString() === today
      ).length;
    }
  }
  
  export const storage = new Storage();
  
  // File: /arbibot/src/services/UserService.js
  import { storage } from './storage.js';
  
  class UserService {
    // User State Management
    async getState(chatId) {
      return storage.getState(String(chatId)) || null;
    }
  
    async setState(chatId, state) {
      storage.setState(String(chatId), state);
      return true;
    }
  
    // Activity Logging
    async logActivity(chatId, activity) {
      const timestamp = new Date().toISOString();
      const activityList = storage.activities.get(String(chatId)) || [];
      activityList.unshift({ ...activity, timestamp });
      storage.activities.set(String(chatId), activityList);
  
      // Update last activity in user state
      const state = await this.getState(chatId);
      if (state) {
        state.lastActivity = timestamp;
        await this.setState(chatId, state);
      }
    }
  
    // Usage Limits
    async checkUsageLimit(chatId) {
      const state = await this.getState(chatId);
      if (!state) return false;
      if (state.isSubscribed) return true;
  
      const today = new Date().toDateString();
      const calculations = storage.calculations.get(String(chatId)) || [];
      const todayCalcs = calculations.filter(calc => 
        new Date(calc.timestamp).toDateString() === today
      ).length;
  
      const FREE_DAILY_LIMIT = 10;
      return todayCalcs < FREE_DAILY_LIMIT;
    }
  
    // Preferences
    getDefaultPreferences() {
      return {
        includeTaxCalculation: true,
        includeFeesCalculation: true,
        defaultInvestment: 1000,
        oddsFormat: 'Decimal',
        language: 'en',
        theme: 'light',
        notifications: true
      };
    }
  
    async getPreferences(chatId) {
      return storage.getPreferences(chatId) || this.getDefaultPreferences();
    }
  
    async setPreferences(chatId, preferences) {
      await storage.setPreferences(chatId, {
        ...this.getDefaultPreferences(),
        ...preferences
      });
      return true;
    }
  
    // User Creation and Management
    async createUser(data) {
      const user = {
        chatId: data.chatId,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        createdAt: new Date().toISOString(),
        phoneVerified: false,
        isSubscribed: false,
        calculationsCount: 0,
        preferences: this.getDefaultPreferences(),
        status: 'active'
      };
  
      await this.setState(data.chatId, user);
      await this.logActivity(data.chatId, {
        type: 'user_created',
        timestamp: user.createdAt
      });
  
      return user;
    }
  }
  
  export const userService = new UserService();
  
  // File: /arbibot/src/services/CalculationService.js
  class CalculationService {
    static calculateTotalFees(stakes, state) {
      let totalFees = 0;
      
      // Calculate fees for each bookkeeper
      ['bookkeeper1Fees', 'bookkeeper2Fees', 'bookkeeper3Fees'].forEach((bookie, index) => {
        if (state[bookie]) {
          if (state[bookie].deposit) {
            totalFees += stakes[index] * (state[bookie].deposit / 100);
          }
          if (state[bookie].withdrawal) {
            totalFees += stakes[index] * (state[bookie].withdrawal / 100);
          }
        }
      });
  
      return totalFees;
    }
  
    static calculateTaxAmount(profit, stakes, state) {
      if (!state.includeTax || !state.taxRate) return 0;
      
      if (state.taxOnProfit) {
        return profit * (state.taxRate / 100);
      } else {
        return stakes.reduce((total, stake) => total + (stake * (state.taxRate / 100)), 0);
      }
    }
  
    static calculateArbitrage(state) {
      const { investment, winOdd, loseOdd, drawOdd } = state;
  
      try {
        const odds = drawOdd ? [winOdd, drawOdd, loseOdd] : [winOdd, loseOdd];
        const totalOdds = odds.reduce((sum, odd) => sum + (1/odd), 0);
        const isArbitrage = totalOdds < 1;
  
        if (!isArbitrage) {
          return { isArbitrage: false };
        }
  
        const stakes = odds.map(odd => (investment / odd) / totalOdds);
        let profit = (investment / totalOdds) - investment;
  
        // Calculate deductions
        const fees = state.preferences?.includeFeesCalculation ? 
          this.calculateTotalFees(stakes, state) : 0;
        const tax = (state.preferences?.includeTaxCalculation && state.includeTax) ? 
          this.calculateTaxAmount(profit, stakes, state) : 0;
  
        profit -= (fees + tax);
  
        return {
          isArbitrage: true,
          investment,
          profit,
          roi: (profit/investment) * 100,
          stakes,
          odds,
          totalOdds,
          fees,
          tax
        };
      } catch (error) {
        console.error('Error calculating arbitrage:', error);
        return { isArbitrage: false, error: error.message };
      }
    }
  }
  
  export const calculationService = new CalculationService();