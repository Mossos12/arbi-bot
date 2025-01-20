import { userService } from '../../services/UserService.js';
import * as keyboards from '../utils/keyboards.js';

async function handleStart(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    let userState = await userService.getState(chatId);
    
    if (!userState) {
      userState = await userService.createUser({
        chatId: chatId,
        username: msg.from.username,
        firstName: msg.from.first_name,
        lastName: msg.from.last_name,
        termsAccepted: false,
        phoneVerified: false
      });

      // Request contact information
      await bot.sendMessage(chatId, `
*Welcome to ArbiBot!* 👋

Before we begin, we need to verify your contact information.
Please click the button below to share your contact:
`, {
        parse_mode: 'Markdown',
        reply_markup: {
          keyboard: [[{
            text: '📱 Share Contact',
            request_contact: true
          }]],
          resize_keyboard: true,
          one_time_keyboard: true
        }
      });
      return;
    }

    if (!userState.phoneVerified) {
      await requestContact(bot, chatId);
      return;
    }

    if (!userState.termsAccepted) {
      await showTerms(bot, chatId);
      return;
    }

    await showWelcomeMessage(bot, chatId);

  } catch (error) {
    console.error('Start command error:', error);
    await bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
  }
}

async function requestContact(bot, chatId) {
  await bot.sendMessage(chatId, `
*Contact Verification Required* 📱

To use ArbiBot, we need to verify your contact information.
Please click the button below to share your contact:
`, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [[{
        text: '📱 Share Contact',
        request_contact: true
      }]],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
}

async function showTerms(bot, chatId) {
  const termsMessage = `
*Terms and Conditions* 📜

Welcome to ArbiBot! Before using our service, please read and accept our terms:

1. *Usage Agreement*
• You must be 18 or older to use this service
• You are responsible for your betting decisions
• This is a calculation tool only, not betting advice

2. *Legal Compliance*
• You must comply with your local betting laws
• ArbiBot is not responsible for any losses
• Verify all calculations independently

3. *Data Usage*
• We store calculation history and preferences
• Your contact info is used for verification only
• We don't share your data with third parties

4. *Service Limitations*
• Free tier has usage limits
• No guarantee of profit
• Service may be unavailable at times

Do you accept these terms?
`;

  await bot.sendMessage(chatId, termsMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        ['✅ Accept Terms', '❌ Decline Terms']
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  });
}

async function showWelcomeMessage(bot, chatId) {
  const welcomeMessage = `
👋 *Welcome to ArbiBot!*

I'm your personal arbitrage betting assistant. I can help you:
• Calculate arbitrage opportunities
• Track your calculations
• Get notifications for profitable bets

🚀 *Getting Started*
1. Use /calculate to start a new calculation
2. Enter your investment amount
3. Follow the step-by-step guide
4. Get instant results!

Need help? Use /help to see all available commands.
`;

  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    ...keyboards.mainMenuOptions
  });
}

// Handle contact sharing response
async function handleContact(bot, msg) {
  if (!msg.contact) return;
  
  const chatId = msg.chat.id;
  const userState = await userService.getState(chatId);
  
  if (!userState) return;

  // Verify that the contact belongs to the user
  if (msg.contact.user_id === msg.from.id) {
    userState.phoneVerified = true;
    userState.phoneNumber = msg.contact.phone_number;
    await userService.setState(chatId, userState);
    
    // Show terms after contact verification
    await showTerms(bot, chatId);
  } else {
    await bot.sendMessage(chatId, '⚠️ Please share your own contact information.');
    await requestContact(bot, chatId);
  }
}

// Handle terms acceptance
async function handleTerms(bot, msg) {
  const chatId = msg.chat.id;
  const userState = await userService.getState(chatId);
  
  if (!userState) return;

  if (msg.text === '✅ Accept Terms') {
    userState.termsAccepted = true;
    await userService.setState(chatId, userState);
    await showWelcomeMessage(bot, chatId);
  } else if (msg.text === '❌ Decline Terms') {
    await bot.sendMessage(chatId, `
⚠️ *Terms Declined*

You must accept the terms to use ArbiBot.
Use /start when you're ready to accept the terms.
`, {
      parse_mode: 'Markdown',
      reply_markup: {
        remove_keyboard: true
      }
    });
  }
}
export { 
    handleStart,
    handleContact,
    handleTerms 
};