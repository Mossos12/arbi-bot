// database.js
import { config } from './config.js';

class Database {
  constructor() {
    this.users = new Map();
    this.calculations = new Map();
    this.activities = new Map();
  }

  // User Operations
  async createUser(userData) {
    const userId = userData.id.toString();
    if (this.users.has(userId)) {
      throw new Error('User already exists');
    }
    
    const user = {
      ...userData,
      createdAt: new Date().toISOString(),
      isSubscribed: false,
      calculationsCount: 0,
      lastCalculation: null,
      preferences: this.getDefaultPreferences(),
      status: 'active'
    };
    
    this.users.set(userId, user);
    return user;
  }

  async getUser(userId) {
    return this.users.get(userId.toString());
  }

  async updateUser(userId, updates) {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, ...updates };
    this.users.set(userId.toString(), updatedUser);
    return updatedUser;
  }

  // Calculation Operations
  async saveCalculation(userId, calculationData) {
    const calculations = this.calculations.get(userId.toString()) || [];
    const calculation = {
      id: Date.now().toString(),
      ...calculationData,
      timestamp: new Date().toISOString()
    };
    
    calculations.unshift(calculation);
    this.calculations.set(userId.toString(), calculations);
    return calculation;
  }

  async getCalculations(userId, limit = 10) {
    const calculations = this.calculations.get(userId.toString()) || [];
    return calculations.slice(0, limit);
  }

  // Activity Logging
  async logActivity(userId, activity) {
    const activities = this.activities.get(userId.toString()) || [];
    const logEntry = {
      id: Date.now().toString(),
      ...activity,
      timestamp: new Date().toISOString()
    };
    
    activities.unshift(logEntry);
    this.activities.set(userId.toString(), activities);
    return logEntry;
  }

  // Utility Methods
  getDefaultPreferences() {
    return {
      language: 'en',
      theme: 'dark',
      notifications: true,
      defaultInvestment: 1000,
      oddsFormat: 'decimal'
    };
  }

  // Statistics
  async getUserStats(userId) {
    const calculations = this.calculations.get(userId.toString()) || [];
    const activities = this.activities.get(userId.toString()) || [];
    
    return {
      totalCalculations: calculations.length,
      lastCalculation: calculations[0]?.timestamp,
      totalActivities: activities.length,
      lastActivity: activities[0]?.timestamp
    };
  }
}

// Export singleton instance
export const db = new Database();