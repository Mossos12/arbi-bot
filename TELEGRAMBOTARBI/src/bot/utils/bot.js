import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { handleCalculate } from '../commands/calculate.js';
import { handleHelp } from '../commands/help.js';
import { handleSettings } from '../commands/settings.js';
import { handleStart } from '../commands/start.js';
import { handleHistory } from '../commands/history.js';
import { handlePremium } from '../commands/premium.js';
import { authenticateUser } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { User } from '../../models/User.js';
import * as keyboards from './keyboards.js';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Security middleware
bot.on('message', async (msg) => {
  try {
    // Apply rate limiting
    const isLimited = await rateLimiter(msg);
    if (isLimited) {
      await bot.sendMessage(msg.chat.id, '⚠️ Please wait a few seconds between messages.');
      return;
    }

    // Authenticate user
    const isAuthenticated = await authenticateUser(msg);
    if (!isAuthenticated) {
      await bot.sendMessage(msg.chat.id, '❌ Authentication failed. Please try again.');
      return;
    }

    // Log activity
    await User.logActivity(msg.chat.id, {
      type: 'message',
      content: msg.text,
      timestamp: new Date()
    });

    // Check spam score
    const spamScore = await checkSpamScore(msg);
    if (spamScore > 0.8) {
      await bot.sendMessage(msg.chat.id, '⚠️ Your message has been flagged as potential spam.');
      await notifyAdmin(`Potential spam detected from user ${msg.from.id}`);
      return;
    }
  } catch (error) {
    console.error('Middleware error:', error);
    await handleError(msg.chat.id, error);
  }
});

// Handle phone number sharing
bot.on('contact', async (msg) => {
  try {
    const chatId = msg.chat.id;
    
    if (msg.contact && msg.contact.user_id === msg.from.id) {
      // Update user profile with phone number
      await User.updatePhoneNumber(chatId, msg.contact.phone_number);
      
      await bot.sendMessage(chatId, `
✅ Thank you! Your phone number has been verified.

You can now use all bot features. Type /help to get started!
`, {
        parse_mode: 'Markdown',
        ...keyboards.mainMenuOptions
      });

      // Notify admin of new user verification
      await notifyAdmin(`New user verified:\nID: ${chatId}\nPhone: ${msg.contact.phone_number}`);
    } else {
      await bot.sendMessage(chatId, '❌ Please share your own contact information.');
    }
  } catch (error) {
    console.error('Contact handling error:', error);
    await handleError(msg.chat.id, error);
  }
});

// Command handlers
bot.onText(/\/start/, async (msg) => {
  try {
    await handleStart(bot, msg);
  } catch (error) {
    await handleError(msg.chat.id, error);
  }
});

bot.onText(/💹 Calculate Arbitrage|\/calculate/, async (msg) => {
  try {
    // Check usage limits
    const canCalculate = await User.checkUsageLimit(msg.chat.id);
    if (!canCalculate) {
      await bot.sendMessage(msg.chat.id, `
⚠️ You've reached your free calculations limit.
Upgrade to premium to continue using the bot!
`, keyboards.premiumKeyboard);
      return;
    }

    await handleCalculate(bot, msg);
  } catch (error) {
    await handleError(msg.chat.id, error);
  }
});

bot.onText(/📚 Help|\/help/, async (msg) => {
  try {
    await handleHelp(bot, msg);
  } catch (error) {
    await handleError(msg.chat.id, error);
  }
});

bot.onText(/⚙️ Settings|\/settings/, async (msg) => {
  try {
    await handleSettings(bot, msg);
  } catch (error) {
    await handleError(msg.chat.id, error);
  }
});

// Admin commands
bot.onText(/\/admin/, async (msg) => {
  if (msg.chat.id.toString() !== ADMIN_CHAT_ID) {
    return;
  }

  const stats = await getAdminStats();
  await bot.sendMessage(msg.chat.id, stats, { parse_mode: 'Markdown' });
});

// Error handling
bot.on('error', async (error) => {
  console.error('Bot error:', error);
  await notifyAdmin(`Bot error: ${error.message}`);
});

bot.on('polling_error', async (error) => {
  console.error('Polling error:', error);
  await notifyAdmin(`Polling error: ${error.message}`);
});

process.on('unhandledRejection', async (error) => {
  console.error('Unhandled rejection:', error);
  await notifyAdmin(`Unhandled rejection: ${error.message}`);
});

// Utility functions
async function notifyAdmin(message) {
  if (ADMIN_CHAT_ID) {
    try {
      await bot.sendMessage(ADMIN_CHAT_ID, `🔔 *Admin Alert*\n\n${message}`, {
        parse_mode: 'Markdown'
      });
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  }
}

async function handleError(chatId, error) {
  console.error('Operation error:', error);
  
  await bot.sendMessage(chatId, `
❌ An error occurred. Please try again.
If the problem persists, contact support.
`, keyboards.mainMenuOptions);

  await notifyAdmin(`Error for user ${chatId}:\n${error.message}`);
}

async function checkSpamScore(msg) {
  // Implement spam detection logic
  const signs = [
    msg.text?.includes('http'),
    msg.text?.length > 200,
    msg.from.username === undefined,
    msg.forward_from !== undefined
  ];

  return signs.filter(Boolean).length / signs.length;
}

async function getAdminStats() {
  try {
    const users = await User.getAllUsers();
    const todayUsers = users.filter(u => 
      new Date(u.createdAt).toDateString() === new Date().toDateString()
    );

    return `
📊 *Bot Statistics*

👥 *Users*
• Total: ${users.length}
• Today: ${todayUsers.length}
• Premium: ${users.filter(u => u.isSubscribed).length}

📈 *Activity*
• Total Calculations: ${users.reduce((sum, u) => sum + u.calculationsCount, 0)}
• Active Today: ${users.filter(u => {
      const lastSeen = new Date(u.lastActivity);
      const today = new Date();
      return lastSeen.toDateString() === today.toDateString();
    }).length}

⚠️ *Issues*
• Spam Flags: ${users.filter(u => u.spamScore > 0.8).length}
• Failed Calculations: ${users.reduce((sum, u) => sum + (u.failedCalculations || 0), 0)}
`;
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return 'Error getting statistics';
  }
}

console.log('Bot is running...');

export default bot;