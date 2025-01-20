import { userService } from '../../services/UserService.js';
import * as keyboards from '../utils/keyboards.js';

export async function handlePremium(bot, msg) {
    const chatId = msg.chat.id;
    const userPrefs = await userService.getPreferences(chatId);
  
    const message = `
  💎 *Premium Features*
  
  Unlock the full power of ArbiBot:
  • ♾️ Unlimited calculations
  • 📊 Advanced analytics
  • 🔔 Real-time alerts
  • 🎯 Multiple bookmakers
  • 📱 Mobile app access
  
  💫 *Available Plans*
  1️⃣ Monthly: $9.99/month
  2️⃣ Yearly: $89.99/year (Save 25%)
  3️⃣ Lifetime: $299 (One-time)
  
  🎁 *Special Offer*
  Use code "WELCOME" for 30% off!
  `;
  
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      ...keyboards.premiumOptionsKeyboard
    });
  }