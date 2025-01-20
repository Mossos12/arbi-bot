import { userService } from '../../services/UserService.js';
import * as keyboards from '../utils/keyboards.js';

export async function handleSettings(bot, msg) {
    const chatId = msg.chat.id;
    const userPrefs = await userService.getPreferences(chatId);

    const settingsMessage = `
*Settings* ⚙️

Current Preferences:
• Tax Calculation: ${userPrefs.includeTaxCalculation ? 'Enabled' : 'Disabled'}
• Fees Input: ${userPrefs.includeFeesCalculation ? 'Enabled' : 'Disabled'}
• Default Investment: $${userPrefs.defaultInvestment}
• Odds Format: ${userPrefs.oddsFormat}

*Bookmaker Fee Settings:*
📥 Deposit Fees:
• Bookmaker 1: ${userPrefs.bookmaker1DepositFee || 0}%
• Bookmaker 2: ${userPrefs.bookmaker2DepositFee || 0}%
• Bookmaker 3: ${userPrefs.bookmaker3DepositFee || 0}%

📤 Withdrawal Fees:
• Bookmaker 1: ${userPrefs.bookmaker1WithdrawalFee || 0}%
• Bookmaker 2: ${userPrefs.bookmaker2WithdrawalFee || 0}%
• Bookmaker 3: ${userPrefs.bookmaker3WithdrawalFee || 0}%

Select an option to modify:
`;

    await bot.sendMessage(chatId, settingsMessage, {
        parse_mode: 'Markdown',
        ...keyboards.settingsKeyboard
    });
}

// Update keyboard layout in keyboards.js
const settingsKeyboard = {
  reply_markup: {
    keyboard: [
      ['🔄 Toggle Tax Calculation', '💰 Toggle Fees Input'],
      ['💱 Default Investment', '📊 Default Format'],
      ['📥 Deposit Fees', '📤 Withdrawal Fees'],
      ['⬅️ Back to Main Menu']
    ],
    resize_keyboard: true
  }
};

// Handle settings input
export async function handleSettingsInput(bot, msg, state) {
    const chatId = msg.chat.id;

    switch (msg.text) {
        case '🔄 Toggle Tax Calculation':
            const newTaxPref = !state.preferences.includeTaxCalculation;
            await userService.setPreferences(chatId, {
                ...state.preferences,
                includeTaxCalculation: newTaxPref
            });
            await bot.sendMessage(chatId, `
Tax calculation has been ${newTaxPref ? 'enabled' : 'disabled'}.
`, {
                parse_mode: 'Markdown',
                ...keyboards.settingsKeyboard
            });
            break;

        case '💰 Toggle Fees Input':
            const newFeesPref = !state.preferences.includeFeesCalculation;
            await userService.setPreferences(chatId, {
                ...state.preferences,
                includeFeesCalculation: newFeesPref
            });
            await bot.sendMessage(chatId, `
Fees input has been ${newFeesPref ? 'enabled' : 'disabled'}.
`, {
                parse_mode: 'Markdown',
                ...keyboards.settingsKeyboard
            });
            break;

        case '💱 Default Investment':
            state.currentCommand = 'settings';
            state.step = 'default_investment';
            await userService.setState(chatId, state);
            await bot.sendMessage(chatId, `
*Enter Default Investment Amount* 💰

Current default: $${state.preferences.defaultInvestment}
Enter new amount (numbers only):
`, {
                parse_mode: 'Markdown',
                reply_markup: { remove_keyboard: true }
            });
            break;

        case '📊 Default Format':
            state.currentCommand = 'settings';
            state.step = 'odds_format';
            await userService.setState(chatId, state);
            await bot.sendMessage(chatId, `
*Select Odds Format* 📊

Current format: ${state.preferences.oddsFormat}
`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['Decimal', 'American'],
                        ['Fractional'],
                        ['⬅️ Back to Settings']
                    ],
                    resize_keyboard: true
                }
            });
            break;

        case '📥 Deposit Fees':
            state.currentCommand = 'settings';
            state.step = 'deposit_fees';
            await userService.setState(chatId, state);
            await bot.sendMessage(chatId, `
*Bookmaker Deposit Fees* 📥

Select bookmaker to modify:
`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['Bookmaker 1', 'Bookmaker 2', 'Bookmaker 3'],
                        ['⬅️ Back to Settings']
                    ],
                    resize_keyboard: true
                }
            });
            break;

        case '📤 Withdrawal Fees':
            state.currentCommand = 'settings';
            state.step = 'withdrawal_fees';
            await userService.setState(chatId, state);
            await bot.sendMessage(chatId, `
*Bookmaker Withdrawal Fees* 📤

Select bookmaker to modify:
`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    keyboard: [
                        ['Bookmaker 1', 'Bookmaker 2', 'Bookmaker 3'],
                        ['⬅️ Back to Settings']
                    ],
                    resize_keyboard: true
                }
            });
            break;

        case 'Bookmaker 1':
        case 'Bookmaker 2':
        case 'Bookmaker 3':
            const bookmakerNumber = msg.text.split(' ')[1];
            if (state.step === 'deposit_fees') {
                state.step = `deposit_fee_${bookmakerNumber}`;
                await userService.setState(chatId, state);
                await bot.sendMessage(chatId, `
*Enter Deposit Fee for Bookmaker ${bookmakerNumber}* 📥

Current fee: ${state.preferences[`bookmaker${bookmakerNumber}DepositFee`] || 0}%
Enter new percentage (0-100):
`, {
                    parse_mode: 'Markdown',
                    reply_markup: { remove_keyboard: true }
                });
            } else if (state.step === 'withdrawal_fees') {
                state.step = `withdrawal_fee_${bookmakerNumber}`;
                await userService.setState(chatId, state);
                await bot.sendMessage(chatId, `
*Enter Withdrawal Fee for Bookmaker ${bookmakerNumber}* 📤

Current fee: ${state.preferences[`bookmaker${bookmakerNumber}WithdrawalFee`] || 0}%
Enter new percentage (0-100):
`, {
                    parse_mode: 'Markdown',
                    reply_markup: { remove_keyboard: true }
                });
            }
            break;

        case '⬅️ Back to Settings':
            state.step = null;
            state.currentCommand = 'settings';
            await userService.setState(chatId, state);
            await handleSettings(bot, msg);
            break;

        case '⬅️ Back to Main Menu':
            state.step = null;
            state.currentCommand = null;
            await userService.setState(chatId, state);
            await bot.sendMessage(chatId, `
*Main Menu* 🏠

Choose an option:
`, {
                parse_mode: 'Markdown',
                ...keyboards.mainMenuOptions
            });
            break;

        // Handle numeric inputs
        default:
            if (!state.step) return;

            const value = parseFloat(msg.text);
            if (isNaN(value)) {
                await bot.sendMessage(chatId, '⚠️ Please enter a valid number.');
                return;
            }

            if (state.step === 'default_investment') {
                if (value <= 0) {
                    await bot.sendMessage(chatId, '⚠️ Investment amount must be greater than 0');
                    return;
                }
                await userService.setPreferences(chatId, {
                    ...state.preferences,
                    defaultInvestment: value
                });
                await bot.sendMessage(chatId, `Default investment updated to $${value}`, {
                    ...keyboards.settingsKeyboard
                });
            } else if (state.step.startsWith('deposit_fee_') || state.step.startsWith('withdrawal_fee_')) {
                if (value < 0 || value > 100) {
                    await bot.sendMessage(chatId, '⚠️ Fee percentage must be between 0 and 100');
                    return;
                }

                const bookmakerNum = state.step.slice(-1);
                const feeType = state.step.startsWith('deposit_fee_') ? 'DepositFee' : 'WithdrawalFee';
                const prefKey = `bookmaker${bookmakerNum}${feeType}`;

                await userService.setPreferences(chatId, {
                    ...state.preferences,
                    [prefKey]: value
                });

                await bot.sendMessage(chatId, `
${feeType.includes('Deposit') ? 'Deposit' : 'Withdrawal'} fee for Bookmaker ${bookmakerNum} updated to ${value}%
`, {
                    parse_mode: 'Markdown',
                    ...keyboards.settingsKeyboard
                });

                state.step = null;
                await userService.setState(chatId, state);
                await handleSettings(bot, msg);
            }
            break;
    }
}

export async function handleBackToSettings(bot, msg) {
    await handleSettings(bot, msg);
}