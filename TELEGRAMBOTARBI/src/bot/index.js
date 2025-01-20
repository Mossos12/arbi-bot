import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { userService } from '../services/UserService.js';
import * as keyboards from './utils/keyboards.js';

// Import command handlers
import { handleCalculateInput } from './commands/calculate.js';
import { handleCalculate } from './commands/calculate.js';
import { handleHistory } from './commands/history.js';
import { handleHelp } from './commands/help.js';
import { handleSettings } from './commands/settings.js';
import { handlePremium } from './commands/premium.js';
import { handleStart, handleContact, handleTerms } from './commands/start.js';

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('BOT_TOKEN is required');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Command handlers
bot.onText(/\/start/, (msg) => handleStart(bot, msg));
bot.onText(/\/calculate|💹 Calculate Arbitrage/, (msg) => handleCalculate(bot, msg));
bot.onText(/\/history|📊 My History/, (msg) => handleHistory(bot, msg));
bot.onText(/\/settings|⚙️ Settings/, (msg) => handleSettings(bot, msg));
bot.onText(/\/help|📚 Help/, (msg) => handleHelp(bot, msg));
bot.onText(/\/premium|⭐ Premium Features/, (msg) => handlePremium(bot, msg));

// Handle contact messages
bot.on('contact', async (msg) => {
    try {
      await handleContact(bot, msg);
    } catch (error) {
      console.error('Contact handling error:', error);
      await handleError(msg.chat.id, error);
    }
  });
  
  // Terms acceptance handler
  bot.onText(/✅ Accept Terms|❌ Decline Terms/, async (msg) => {
    try {
      await handleTerms(bot, msg);
    } catch (error) {
      console.error('Terms handling error:', error);
      await handleError(msg.chat.id, error);
    }
  });

// Back to main menu handler
bot.onText(/⬅️ Back to Main Menu/, async (msg) => {
  try {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, `
*Main Menu* 🏠

Choose an option from the menu below:
`, {
      parse_mode: 'Markdown',
      ...keyboards.mainMenuOptions
    });
  } catch (error) {
    await handleError(msg.chat.id, error);
  }
});

// Generic message handler for numeric inputs and other responses
bot.on('message', async (msg) => {
    try {
      const chatId = msg.chat.id;
      const state = await userService.getState(chatId);
      
      // Skip verification for /start command and contact sharing
      if (msg.text?.startsWith('/') && 
          msg.text !== '/start' && 
          !msg.contact) {
        
        if (!state || !state.phoneVerified || !state.termsAccepted) {
          await bot.sendMessage(chatId, `
  ⚠️ *Verification Required*
  
  Please complete the verification process first.
  Use /start to begin.
  `, {
            parse_mode: 'Markdown'
          });
          return;
        }
      }
      
      if (!state) return;
      if (msg.text?.startsWith('/')) return;
      
      // Your existing message handler logic
      switch (state.currentCommand) {
        case 'calculate':
          await handleCalculateInput(bot, msg, state);
          break;
        case 'settings':
          await handleSettingsInput(bot, msg, state);
          break;
        case 'premium':
          await handlePremiumInput(bot, msg, state);
          break;
        default:
          // Handle unknown states or commands
          break;
      }
    } catch (error) {
      console.error('Message handler error:', error);
      await handleError(msg.chat.id, error);
    }
  });
// Error handling
async function handleError(chatId, error) {
  console.error('Operation error:', error);
  try {
    await bot.sendMessage(chatId, `
❌ An error occurred. Please try again.
If the problem persists, contact our support.
`, {
      parse_mode: 'Markdown',
      ...keyboards.mainMenuOptions
    });
  } catch (sendError) {
    console.error('Error sending error message:', sendError);
  }
}

// Bot error events
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  bot.stopPolling();
  process.exit(0);
});

console.log('Bot is running...');

export default bot;