import { userService } from '../../services/UserService.js';
import * as keyboards from '../utils/keyboards.js';

export async function handleHistory(bot, msg) {
    const chatId = msg.chat.id;
    const history = await userService.getCalculationHistory(chatId);
  
    if (!history || history.length === 0) {
      await bot.sendMessage(chatId, `
  📊 *Calculation History*
  
  No calculations found yet.
  Use /calculate to start your first calculation!
  `, {
        parse_mode: 'Markdown',
        ...keyboards.mainMenuOptions
      });
      return;
    }
  
    const totalBets = history.length;
    const totalProfit = history.reduce((sum, bet) => sum + bet.profit, 0);
    const averageROI = history.reduce((sum, bet) => sum + bet.roi, 0) / totalBets;
  
    const message = `
  📊 *Calculation History*
  
  📈 *Statistics*
  • Total Calculations: ${totalBets}
  • Total Profit: $${totalProfit.toFixed(2)}
  • Average ROI: ${averageROI.toFixed(2)}%
  
  🔄 *Recent Calculations*
  ${history.slice(0, 5).map((calc, i) => `
  ${i + 1}. ${new Date(calc.timestamp).toLocaleDateString()}
  💰 Investment: $${calc.investment.toFixed(2)}
  📈 Profit: $${calc.profit.toFixed(2)}
  📊 ROI: ${calc.roi.toFixed(2)}%`).join('\n')}
  `;
  
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      ...keyboards.historyKeyboard
    });
  }