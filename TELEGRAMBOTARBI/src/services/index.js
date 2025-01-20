// File: /arbibot/src/services/index.js
class UserService {
  constructor() {
    this.users = new Map();
  }

  async getState(chatId) {
    return this.users.get(chatId.toString());
  }

  async setState(chatId, state) {
    this.users.set(chatId.toString(), state);
    return true;
  }
}

export const userService = new UserService();