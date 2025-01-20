# ArbiBot - Telegram Arbitrage Calculator Bot

A Telegram bot for calculating arbitrage betting opportunities with support for multiple bookmakers, tax calculations, and fee handling.

## Features

- 🧮 Arbitrage calculations for 2-way and 3-way bets
- 💰 Multiple investment amount options
- 📊 Tax calculations with support for profit and stake-based taxation
- 💸 Bookmaker fee handling (deposit and withdrawal fees)
- 📈 Detailed profit analysis and outcome breakdowns
- 🔄 History tracking for calculations
- ⚙️ User preferences and settings

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/arbibot.git
cd arbibot
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file with your bot token:
```
BOT_TOKEN=your_telegram_bot_token
```

4. Start the bot:
```bash
npm start
```

## Project Structure

```
src/
├── bot/
│   ├── commands/        # Command handlers
│   ├── utils/          # Utility functions
│   └── index.js        # Main bot file
├── services/           # Business logic services
└── config/            # Configuration files
```

## Commands

- `/start` - Initialize the bot and view welcome message
- `/calculate` - Start a new arbitrage calculation
- `/history` - View calculation history
- `/settings` - Adjust user preferences
- `/help` - View help information

## Environment Variables

- `BOT_TOKEN` - Your Telegram Bot Token
- `NODE_ENV` - Environment (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## License

MIT License - see LICENSE file for details

## Contact

- Create an issue for bug reports or feature requests
- Submit PRs for any improvements

---

Made with ❤️ for the arbitrage betting community
