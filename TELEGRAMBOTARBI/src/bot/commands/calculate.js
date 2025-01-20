import { userService } from '../../services/UserService.js';
import { calculationService } from '../../services/CalculationService.js';
import * as keyboards from '../utils/keyboards.js';

async function handleCalculate(bot, msg) {
  const chatId = msg.chat.id;
  
  try {
    // Check usage limits for free users
    const canCalculate = await userService.checkUsageLimit(chatId);
    if (!canCalculate) {
      await bot.sendMessage(chatId, `
⚠️ *Daily Limit Reached*
You've reached your free calculations limit.
Upgrade to premium for unlimited calculations!
`, {
        parse_mode: 'Markdown',
        ...keyboards.premiumKeyboard
      });
      return;
    }

    // Initialize calculation state
    await userService.setState(chatId, {
      currentCommand: 'calculate',
      step: 'investment_amount',
      preferences: await userService.getPreferences(chatId),
      investment: null,
      includeDraw: false,
      includeTax: false,
      taxOnProfit: false,
      taxRate: null,
      bookkeeper1Fees: { deposit: null, withdrawal: null },
      bookkeeper2Fees: { deposit: null, withdrawal: null },
      bookkeeper3Fees: { deposit: null, withdrawal: null }
    });

    const message = `
💰 *Step 1: Investment Amount*

Select your investment amount or enter a custom value:
- Current default: $1000

Available Options:
- 💰 $100, $500, $1000
- 💰 $5000, $10000
- 💰 Custom Amount
`;

    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      ...keyboards.extendedInvestmentKeyboard
    });

  } catch (error) {
    console.error('Calculate command error:', error);
    await bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
  }
}

async function handleCalculateInput(bot, msg, state) {
    const chatId = msg.chat.id;
  
    switch (state.step) {
      case 'investment_amount':
      case 'custom_investment':
        await handleInvestmentInput(bot, msg);
        break;
      case 'draw_selection':
        await handleDrawSelection(bot, msg);
        break;
      case 'tax_selection':
        await handleTaxSelection(bot, msg);
        break;
      case 'tax_type':
        await handleTaxType(bot, msg);
        break;
      case 'tax_rate':
        await handleTaxRate(bot, msg);
        break;
      case 'win_odd':
      case 'draw_odd':
      case 'lose_odd':
        await handleOddsInput(bot, msg, state);
        break;
      case 'bookkeeper1_check':
      case 'bookkeeper2_check':
      case 'bookkeeper3_check':
        await handleBookkeeperFeeResponse(bot, msg, state);
        break;
      case 'bookkeeper1_deposit':
      case 'bookkeeper1_withdrawal':
      case 'bookkeeper2_deposit':
      case 'bookkeeper2_withdrawal':
      case 'bookkeeper3_deposit':
      case 'bookkeeper3_withdrawal':
        await handleFeeInput(bot, msg, state);
        break;
      default:
        break;
    }
  }

async function handleInvestmentInput(bot, msg) {
  const chatId = msg.chat.id;
  const state = await userService.getState(chatId);
  
  if (!state || !['investment_amount', 'custom_investment'].includes(state.step)) {
    await bot.sendMessage(chatId, '⚠️ Please start over with /calculate');
    return;
  }

  let amount;
  if (msg.text === '💰 Custom Amount') {
    state.step = 'custom_investment';
    await userService.setState(chatId, state);
    await bot.sendMessage(chatId, 
      '💱 Enter your custom investment amount:',
      { reply_markup: { remove_keyboard: true } }
    );
    return;
  }

  if (msg.text.startsWith('💰 $')) {
    amount = parseFloat(msg.text.replace(/[^0-9.]/g, ''));
  } else if (state.step === 'custom_investment') {
    amount = parseFloat(msg.text);
  }

  if (!amount || amount <= 0) {
    await bot.sendMessage(chatId, '⚠️ Please enter a valid amount.');
    return;
  }

  state.investment = amount;
  state.step = 'draw_selection';
  await userService.setState(chatId, state);

  await bot.sendMessage(chatId, `
*Step 2: Draw Selection* ⚽

Include draw odds in your calculation?

✅ Include Draw - For sports like soccer
❌ No Draw - For sports like tennis
`, {
    parse_mode: 'Markdown',
    ...keyboards.drawOptionsKeyboard
  });
}

async function handleDrawSelection(bot, msg) {
  const chatId = msg.chat.id;
  const state = await userService.getState(chatId);

  if (!state || state.step !== 'draw_selection') {
    await bot.sendMessage(chatId, '⚠️ Please start over with /calculate');
    return;
  }

  state.includeDraw = msg.text === '✅ Include Draw';
  state.step = 'tax_selection';
  await userService.setState(chatId, state);

  await bot.sendMessage(chatId, `
*Step 3: Tax Settings* 💸

Would you like to include tax calculations?
`, {
    parse_mode: 'Markdown',
    ...keyboards.taxOptionsKeyboard
  });
}

async function handleTaxSelection(bot, msg) {
  const chatId = msg.chat.id;
  const state = await userService.getState(chatId);
  
  if (!state || state.step !== 'tax_selection') return;

  if (msg.text === '💰 Include Tax') {
    state.includeTax = true;
    state.step = 'tax_type';
    await userService.setState(chatId, state);

    await bot.sendMessage(chatId, `
*Tax Type Selection* 💸

How should tax be calculated?
• Tax on Profit - Applied to final profit
• Tax on Stake - Applied to bet amounts
`, {
      parse_mode: 'Markdown',
      ...keyboards.taxTypeKeyboard
    });
  } else if (msg.text === '⏩ Skip Tax') {
    state.includeTax = false;
    state.step = 'win_odd';
    await userService.setState(chatId, state);
    
    await requestWinOdd(bot, chatId);
  }
}

async function handleTaxType(bot, msg) {
  const chatId = msg.chat.id;
  const state = await userService.getState(chatId);
  
  if (!state || state.step !== 'tax_type') return;

  if (msg.text === '📈 Tax on Profit' || msg.text === '💸 Tax on Stake') {
    state.taxOnProfit = msg.text === '📈 Tax on Profit';
    state.step = 'tax_rate';
    await userService.setState(chatId, state);

    await bot.sendMessage(chatId, `
*Enter Tax Rate* 📊

Please enter the tax rate percentage:
Example: Enter 20 for 20% tax rate
`, {
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true }
    });
  }
}

async function handleTaxRate(bot, msg) {
  const chatId = msg.chat.id;
  const state = await userService.getState(chatId);
  
  if (!state || state.step !== 'tax_rate') return;

  const rate = parseFloat(msg.text);
  if (isNaN(rate) || rate < 0 || rate > 100) {
    await bot.sendMessage(chatId, '⚠️ Please enter a valid tax rate between 0 and 100%');
    return;
  }

  state.taxRate = rate;
  state.step = 'win_odd';
  await userService.setState(chatId, state);
  
  await requestWinOdd(bot, chatId);
}

async function handleOddsInput(bot, msg, state) {
    const chatId = msg.chat.id;
    const value = parseFloat(msg.text);
  
    if (isNaN(value) || value <= 1) {
      await bot.sendMessage(chatId, '⚠️ Please enter valid odds greater than 1.0');
      return;
    }
  
    switch (state.step) {
      case 'win_odd':
        state.winOdd = value;
        state.step = state.includeDraw ? 'draw_odd' : 'lose_odd';
        await userService.setState(chatId, state);
        
        if (state.includeDraw) {
          await bot.sendMessage(chatId, `
  *Enter DRAW Odds* 🎯
  
  Please enter the odds for DRAW outcome:
  `, { parse_mode: 'Markdown' });
        } else {
          await bot.sendMessage(chatId, `
  *Enter LOSE Odds* 🎯
  
  Please enter the odds for LOSE outcome:
  `, { parse_mode: 'Markdown' });
        }
        break;
  
      case 'draw_odd':
        state.drawOdd = value;
        state.step = 'lose_odd';
        await userService.setState(chatId, state);
        
        await bot.sendMessage(chatId, `
  *Enter LOSE Odds* 🎯
  
  Please enter the odds for LOSE outcome:
  `, { parse_mode: 'Markdown' });
        break;
  
      case 'lose_odd':
        state.loseOdd = value;
        state.step = 'bookkeeper1_check';
        await userService.setState(chatId, state);
        
        await promptBookkeeperFees(bot, chatId, 1);
        break;
    }
  }
  
  // Add new functions to handle bookkeeper fees
  async function promptBookkeeperFees(bot, chatId, bookkeeperNumber) {
    await bot.sendMessage(chatId, `
  *Bookmaker ${bookkeeperNumber} Fees* 💰
  
  Does bookmaker ${bookkeeperNumber} have any fees?
  `, {
      parse_mode: 'Markdown',
      ...keyboards.bookmakerFeeKeyboard
    });
  }
  
  async function handleBookkeeperFeeResponse(bot, msg, state) {
    const chatId = msg.chat.id;
    const hasFees = msg.text === '✅ Has Fees';
    
    if (state.step === 'bookkeeper1_check') {
      if (hasFees) {
        state.step = 'bookkeeper1_deposit';
        await userService.setState(chatId, state);
        await promptDepositFee(bot, chatId, 1);
      } else {
        state.bookkeeper1Fees = { deposit: 0, withdrawal: 0 };
        state.step = 'bookkeeper2_check';
        await userService.setState(chatId, state);
        await promptBookkeeperFees(bot, chatId, 2);
      }
    } else if (state.step === 'bookkeeper2_check') {
      if (hasFees) {
        state.step = 'bookkeeper2_deposit';
        await userService.setState(chatId, state);
        await promptDepositFee(bot, chatId, 2);
      } else {
        state.bookkeeper2Fees = { deposit: 0, withdrawal: 0 };
        if (state.includeDraw) {
          state.step = 'bookkeeper3_check';
          await userService.setState(chatId, state);
          await promptBookkeeperFees(bot, chatId, 3);
        } else {
          const result = await calculationService.calculateArbitrage(state);
          await handleCalculationResult(bot, chatId, result);
        }
      }
    } else if (state.step === 'bookkeeper3_check') {
      if (hasFees) {
        state.step = 'bookkeeper3_deposit';
        await userService.setState(chatId, state);
        await promptDepositFee(bot, chatId, 3);
      } else {
        state.bookkeeper3Fees = { deposit: 0, withdrawal: 0 };
        const result = await calculationService.calculateArbitrage(state);
        await handleCalculationResult(bot, chatId, result);
      }
    }
  }
  
  async function promptDepositFee(bot, chatId, bookkeeperNumber) {
    await bot.sendMessage(chatId, `
  *Bookmaker ${bookkeeperNumber} Deposit Fee* 💰
  
  Please enter the deposit fee percentage:
  Example: Enter 2.5 for 2.5% fee
  `, {
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true }
    });
  }
  
  async function promptWithdrawalFee(bot, chatId, bookkeeperNumber) {
    await bot.sendMessage(chatId, `
  *Bookmaker ${bookkeeperNumber} Withdrawal Fee* 💰
  
  Please enter the withdrawal fee percentage:
  Example: Enter 1.5 for 1.5% fee
  `, {
      parse_mode: 'Markdown',
      reply_markup: { remove_keyboard: true }
    });
  }
  
  async function handleFeeInput(bot, msg, state) {
    const chatId = msg.chat.id;
    const value = parseFloat(msg.text);
  
    if (isNaN(value) || value < 0 || value > 100) {
      await bot.sendMessage(chatId, '⚠️ Please enter a valid percentage between 0 and 100');
      return;
    }
  
    const bookkeeperNumber = state.step.includes('1') ? 1 : state.step.includes('2') ? 2 : 3;
    const isDeposit = state.step.includes('deposit');
    const bookkeeper = `bookkeeper${bookkeeperNumber}Fees`;
  
    if (isDeposit) {
      state[bookkeeper] = { ...state[bookkeeper], deposit: value };
      state.step = `bookkeeper${bookkeeperNumber}_withdrawal`;
      await userService.setState(chatId, state);
      await promptWithdrawalFee(bot, chatId, bookkeeperNumber);
    } else {
      state[bookkeeper] = { ...state[bookkeeper], withdrawal: value };
      if (bookkeeperNumber < 2 || (bookkeeperNumber === 2 && state.includeDraw)) {
        state.step = `bookkeeper${bookkeeperNumber + 1}_check`;
        await userService.setState(chatId, state);
        await promptBookkeeperFees(bot, chatId, bookkeeperNumber + 1);
      } else {
        const result = await calculationService.calculateArbitrage(state);
        await handleCalculationResult(bot, chatId, result);
      }
    }
  }

async function requestWinOdd(bot, chatId) {
  await bot.sendMessage(chatId, `
*Enter WIN Odds* 🎯

Please enter the odds for WIN outcome:
Example: 2.5 for 2.5x return
`, {
    parse_mode: 'Markdown',
    reply_markup: { remove_keyboard: true }
  });
}

async function handleCalculationResult(bot, chatId, result) {
    try {
      if (!result.isArbitrage) {
        // Calculate total probability (1/odds for each outcome)
        const totalProbability = result.totalOdds * 100; // totalOdds is already the sum of 1/odds
  
        await bot.sendMessage(chatId, `
  ❌ *No Arbitrage Opportunity*
  
  The current odds do not present a profitable opportunity:
  • Total Probability: ${totalProbability.toFixed(2)}%
  • Required: Less than 100% for arbitrage
  • Current Margin: ${(totalProbability - 100).toFixed(2)}%
  
  Try different odds combinations or adjust your parameters.
  `, {
          parse_mode: 'Markdown',
          ...keyboards.mainMenuOptions
        });
        await userService.setState(chatId, null);
        return;
      }
  
      // Calculate total investment including fees
      const totalInvestmentWithFees = result.investment + result.fees;
  
      // Main calculation message
      let resultMessage = `
  ✅ *ARBITRAGE OPPORTUNITY FOUND!*
  
  💰 *Investment Summary*
  • Base Investment: $${result.investment.toFixed(2)}
  • Total Required: $${totalInvestmentWithFees.toFixed(2)}
  
  📈 *Profit Analysis*
  • Expected Profit: $${result.profit.toFixed(2)}
  • Return on Investment: ${result.roi.toFixed(2)}%
  • Total Margin: ${result.margin.toFixed(2)}%
  
  🎯 *Recommended Bets*`;
  
      // Add stakes information
      result.individualReturns.forEach((bet, index) => {
        const betType = index === 0 ? 'WIN' : index === 1 && result.stakes.length === 3 ? 'DRAW' : 'LOSE';
        resultMessage += `\n• ${betType}: $${bet.stake.toFixed(2)} @ ${result.odds[index].toFixed(2)}`;
      });
  
      // Add deductions section if applicable
      if (result.fees > 0 || result.tax > 0) {
        resultMessage += `\n\n💸 *Deductions*`;
        if (result.fees > 0) {
          resultMessage += `\n• Bookmaker Fees: $${result.fees.toFixed(2)}`;
        }
        if (result.tax > 0) {
          resultMessage += `\n• Tax Amount: $${result.tax.toFixed(2)}`;
        }
      }
  
      // Add detailed returns for each outcome
      resultMessage += `\n\n📊 *Outcome Analysis*`;
      result.individualReturns.forEach((bet, index) => {
        const betType = index === 0 ? 'WIN' : index === 1 && result.stakes.length === 3 ? 'DRAW' : 'LOSE';
        resultMessage += `\n• If ${betType}: $${bet.potentialReturn.toFixed(2)} (${((bet.potentialReturn/totalInvestmentWithFees - 1) * 100).toFixed(2)}% return)`;
      });
  
      // Add important disclaimers
      resultMessage += `\n\n⚠️ *Important Notes*
  • Verify all odds before placing bets
  • Account for potential odds changes
  • Consider bookmaker bet limits
  • Ensure sufficient funds for all bets
  • Place bets simultaneously if possible
    
  *Disclaimer: This is a calculation tool only. Always verify odds and fees independently. Past performance does not guarantee future results.*
  
  🔄 Ready for another calculation? Use /calculate`;
    
      await bot.sendMessage(chatId, resultMessage, {
        parse_mode: 'Markdown',
        ...keyboards.mainMenuOptions
      });
  
      await userService.addCalculation(chatId, result);
      await userService.setState(chatId, null);
    } catch (error) {
      console.error('Error handling calculation result:', error);
      await bot.sendMessage(chatId, '❌ An error occurred while processing the result. Please try again.');
      await userService.setState(chatId, null);
    }
  }
  
  export { 
    handleCalculate,
    handleCalculateInput,
    handleInvestmentInput,
    handleDrawSelection,
    handleCalculationResult
  };