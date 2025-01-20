// File: /arbibot/src/services/CalculationService.js
export class CalculationService {
    static calculateTotalFees(stakes, state) {
        try {
          let totalFees = 0;
          const odds = state.includeDraw ? 
            [state.winOdd, state.drawOdd, state.loseOdd] : 
            [state.winOdd, state.loseOdd];
          
          const bookmakers = ['bookkeeper1Fees', 'bookkeeper2Fees', 'bookkeeper3Fees'];
          
          for (let i = 0; i < stakes.length; i++) {
            const bookmakerFees = state[bookmakers[i]];
            if (bookmakerFees && stakes[i]) {
              // Calculate deposit fees
              if (bookmakerFees.deposit) {
                const depositFee = stakes[i] * (bookmakerFees.deposit / 100);
                totalFees += depositFee;
              }
              
              // Calculate withdrawal fees based on potential win
              if (bookmakerFees.withdrawal && odds[i]) {
                const potentialWin = stakes[i] * odds[i];
                const withdrawalFee = potentialWin * (bookmakerFees.withdrawal / 100);
                totalFees += withdrawalFee;
              }
            }
          }
          
          return totalFees;
        } catch (error) {
          console.error('Error calculating fees:', error);
          return 0;
        }
      }
  
    static calculateTaxAmount(profit, stakes, state) {
      try {
        if (!state.includeTax || !state.taxRate) return 0;
        
        if (state.taxOnProfit) {
          return profit * (state.taxRate / 100);
        } else {
          return stakes.reduce((total, stake) => 
            total + (stake * (state.taxRate / 100)), 0
          );
        }
      } catch (error) {
        console.error('Error calculating tax:', error);
        return 0;
      }
    }
  
    static validateOdds(odds) {
      return odds.every(odd => 
        typeof odd === 'number' && 
        odd > 1 && 
        !isNaN(odd) && 
        isFinite(odd)
      );
    }
  
    static calculateArbitrage(state) {
        try {
          const { investment, winOdd, loseOdd, drawOdd } = state;
      
          // Input validation
          if (!investment || investment <= 0) {
            throw new Error('Invalid investment amount');
          }
      
          const odds = drawOdd ? [winOdd, drawOdd, loseOdd] : [winOdd, loseOdd];
          
          if (!this.validateOdds(odds)) {
            throw new Error('Invalid odds values');
          }
      
          const totalOdds = odds.reduce((sum, odd) => sum + (1/odd), 0);
          const isArbitrage = totalOdds < 1;
      
          if (!isArbitrage) {
            return { 
              isArbitrage: false,
              margin: (totalOdds - 1) * 100
            };
          }
      
          // Calculate stakes for each outcome
          const stakes = odds.map(odd => (investment / odd) / totalOdds);
          
          // Calculate initial profit before deductions
          let profit = (investment / totalOdds) - investment;
      
          // Calculate deductions if enabled
          const fees = state.preferences?.includeFeesCalculation ? 
            this.calculateTotalFees(stakes, { ...state, odds }) : 0;
          
          const tax = (state.preferences?.includeTaxCalculation && state.includeTax) ? 
            this.calculateTaxAmount(profit - fees, stakes, state) : 0;
      
          // Calculate final profit after deductions
          profit -= (fees + tax);
      
          return {
            isArbitrage: true,
            investment,
            profit,
            roi: (profit/investment) * 100,
            stakes,
            odds,
            totalOdds,
            margin: (1 - totalOdds) * 100,
            fees,
            tax,
            individualReturns: odds.map((odd, index) => ({
              stake: stakes[index],
              potentialReturn: stakes[index] * odd,
              profitForOutcome: (stakes[index] * odd) - investment
            }))
          };
        } catch (error) {
          console.error('Error calculating arbitrage:', error);
          return { 
            isArbitrage: false, 
            error: error.message 
          };
        }
      }
  
    static convertOdds(odd, fromFormat, toFormat) {
      try {
        // First convert to decimal
        let decimalOdd;
        switch (fromFormat.toLowerCase()) {
          case 'american':
            decimalOdd = odd > 0 ? 
              (odd + 100) / 100 : 
              (100 / Math.abs(odd)) + 1;
            break;
          case 'fractional':
            const [num, den] = odd.toString().split('/').map(Number);
            decimalOdd = (num / den) + 1;
            break;
          case 'hongkong':
          case 'malaysian':
            decimalOdd = odd + 1;
            break;
          case 'indonesian':
            decimalOdd = odd >= 1 ? 
              odd + 1 : 
              1 + (1 / Math.abs(odd));
            break;
          case 'decimal':
          default:
            decimalOdd = odd;
        }
  
        // Convert decimal to target format
        switch (toFormat.toLowerCase()) {
          case 'american':
            return decimalOdd >= 2 
              ? ((decimalOdd - 1) * 100)
              : (-100 / (decimalOdd - 1));
          case 'fractional':
            const decimal = decimalOdd - 1;
            const gcd = this.getGCD(decimal * 100, 100);
            return `${(decimal * 100) / gcd}/${100 / gcd}`;
          case 'hongkong':
          case 'malaysian':
            return decimalOdd - 1;
          case 'indonesian':
            return decimalOdd >= 2 
              ? decimalOdd - 1
              : -1 / (decimalOdd - 1);
          case 'decimal':
          default:
            return decimalOdd;
        }
      } catch (error) {
        console.error('Error converting odds:', error);
        throw error;
      }
    }
  
    static getGCD(a, b) {
      return b ? this.getGCD(b, a % b) : a;
    }
  }
  
  export const calculationService = {
    calculateArbitrage: CalculationService.calculateArbitrage.bind(CalculationService),
    calculateTotalFees: CalculationService.calculateTotalFees.bind(CalculationService),
    calculateTaxAmount: CalculationService.calculateTaxAmount.bind(CalculationService),
    validateOdds: CalculationService.validateOdds.bind(CalculationService),
    getGCD: CalculationService.getGCD.bind(CalculationService)
  };