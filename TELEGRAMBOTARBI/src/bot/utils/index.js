const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
require('dotenv').config();

// Import commands
const startCommand = require('../commands/start');
const calculateCommand = require('../commands/calculate');
const subscribeCommand = require('../commands/subscribe');
const helpCommand = require('../commands/help');

// Import middleware
const authMiddleware = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');

// Initialize bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Middleware
bot.use(rateLimiter);
bot.use(authMiddleware);

// Commands
bot.command('start', startCommand);
bot.command('calculate', calculateCommand);
bot.command('subscribe', subscribeCommand);
bot.command('help', helpCommand);

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}:`, err);
  ctx.reply('An error occurred. Please try again later.');
});

// Start bot
bot.launch().then(() => {
  console.log('Bot is running');
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));