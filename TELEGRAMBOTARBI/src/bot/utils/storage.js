export class UserStorage {
    static async getUser(telegramId) {
      return USERS.get(telegramId.toString());
    }
  
    static async saveUser(telegramId, data) {
      await USERS.put(telegramId.toString(), JSON.stringify(data));
    }
  
    static async saveCalculation(telegramId, data) {
      const key = `calc:${telegramId}:${Date.now()}`;
      await CALCULATIONS.put(key, JSON.stringify(data));
    }
  }