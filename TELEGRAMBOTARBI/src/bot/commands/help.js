import * as keyboards from '../utils/keyboards.js';

export async function handleHelp(bot, msg) {
    const chatId = msg.chat.id;
    
    const helpMessage = `
*ArbiBot Help Guide* ❓

*Basic Commands:*
• /calculate - Start a new calculation
• /history - View calculation history
• /settings - Adjust your preferences
• /help - Show this help message

*How to Calculate Arbitrage:*
1. Press 🧮 Calculate
2. Enter investment amount
3. Choose whether to include draw
4. Enter odds for each outcome
5. Add tax information if applicable
6. Add bookmaker fees if any
7. Get your results!

*Understanding Results:*
• ROI - Return on Investment
• Margin - Profit margin percentage
• Stakes - How much to bet on each outcome

*Tips:*
• Higher odds don't always mean better profit
• Consider bookmaker fees in calculations
• Monitor your calculation history
• Enable notifications for opportunities

*Need More Help?*
• Use ⭐ Premium for advanced features
• Contact support for specific questions

*Terms:*
• Arbitrage - Betting on all outcomes for guaranteed profit
• ROI - Percentage return on your investment
• Margin - Profit percentage on total stakes
`;

    try {
        await bot.sendMessage(chatId, helpMessage, {
            parse_mode: 'Markdown',
            ...keyboards.mainMenuOptions
        });
    } catch (error) {
        console.error('Help command error:', error);
        await bot.sendMessage(chatId, '❌ An error occurred while displaying help. Please try again.');
    }
}