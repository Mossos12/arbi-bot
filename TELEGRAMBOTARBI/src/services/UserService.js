// File: /arbibot/src/services/UserService.js
class UserService {
    constructor() {
      this.users = new Map();
      this.preferences = new Map();
      this.history = new Map();
    }
  
    async getState(chatId) {
      return this.users.get(chatId.toString());
    }
  
    async setState(chatId, state) {
      this.users.set(chatId.toString(), state);
      return true;
    }
  
    async createUser(data) {
      const user = {
        chatId: String(data.chatId),
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
      return user;
    }
  
    getDefaultPreferences() {
      return {
        language: 'en',
        theme: 'dark',
        oddsFormat: 'decimal',
        defaultInvestment: 1000,
        includeTaxCalculation: true,
        includeFeesCalculation: true,
        notifications: true
      };
    }
  
    async checkUsageLimit(chatId) {
      const state = await this.getState(chatId);
      if (!state) return true;
      if (state.isSubscribed) return true;
  
      const FREE_DAILY_LIMIT = 1000000;
      return (state.calculationsCount || 0) < FREE_DAILY_LIMIT;
    }
  
    async getPreferences(chatId) {
      return this.preferences.get(chatId.toString()) || this.getDefaultPreferences();
    }
  
    async setPreferences(chatId, preferences) {
      this.preferences.set(chatId.toString(), {
        ...this.getDefaultPreferences(),
        ...preferences
      });
      return true;
    }
  
    async addCalculation(chatId, calculationData) {
      const history = this.history.get(chatId.toString()) || [];
      history.unshift({
        ...calculationData,
        timestamp: new Date().toISOString()
      });
      this.history.set(chatId.toString(), history);
  
      const state = await this.getState(chatId);
      if (state) {
        state.calculationsCount = (state.calculationsCount || 0) + 1;
        await this.setState(chatId, state);
      }
    }
  
    async getCalculationHistory(chatId) {
      return this.history.get(chatId.toString()) || [];
    }
  
    async updatePhoneNumber(chatId, phoneNumber) {
      const state = await this.getState(chatId);
      if (state) {
        state.phoneNumber = phoneNumber;
        state.phoneVerified = true;
        await this.setState(chatId, state);
        return true;
      }
      return false;
    }
  }
  
  export const userService = new UserService();