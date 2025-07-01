# Crypto Charts Dashboard

A real-time cryptocurrency dashboard built with Next.js featuring live price charts, funding rates, and social feeds.

## Features

- 📈 **Live Price Charts** - BTC and HYPE perpetual futures with real-time WebSocket updates
- 💰 **Funding Rates** - Live APR calculations from Binance and Hyperliquid
- 📱 **Telegram Feeds** - Real-time messages from @mlmonchain and @infinityhedge channels
- 🌙 **Dark Theme** - Professional trading interface

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)** to view the dashboard

## Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# Telegram API (for @mlmonchain and @infinityhedge feeds)
TELEGRAM_API_ID=your_api_id_here
TELEGRAM_API_HASH=your_api_hash_here
TELEGRAM_PHONE=+1234567890
TELEGRAM_SESSION=your_session_string_here

# Etherscan API (for Ethereum transaction volume)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Telegram Setup

The dashboard includes live feeds from the @mlmonchain and @infinityhedge Telegram channels. To set this up:

1. **Get API Credentials:**
   - Visit [my.telegram.org/apps](https://my.telegram.org/apps)
   - Create an application and save your **API ID** and **API Hash**

2. **Authenticate:**
   ```bash
   npm run telegram-setup
   ```
   - Follow prompts to enter your phone number and verification code
   - Copy the generated session string to your `.env.local` file

3. **Common Issues:**
   - **PHONE_CODE_INVALID**: Check verification code in Telegram app
   - **PHONE_NUMBER_INVALID**: Include country code (e.g., +1234567890)
   - **Channel access**: Join @mlmonchain and @infinityhedge before setup



## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes for data fetching
│   │   ├── binance/            # Binance price data
│   │   ├── economic-indicators/# Economic data
│   │   ├── ethereum-volume/    # Ethereum transaction volume
│   │   ├── funding/            # Funding rates from exchanges
│   │   ├── m2-money-supply/    # M2 money supply data
│   │   ├── market-data/        # Market data
│   │   ├── money-market-funds/ # Money market funds data
│   │   └── telegram/           # Telegram channel messages
│   └── page.tsx                # Main dashboard page
├── components/
│   ├── PriceChart.tsx          # Live candlestick charts
│   ├── TelegramFeed.tsx        # Telegram feeds from multiple channels
│   ├── EconomicIndicators.tsx  # Economic indicators charts
│   └── [other components]      # Various dashboard components
└── scripts/
    └── telegram-setup.js       # Telegram authentication helper
```

## Technology Stack

- **Framework:** Next.js 15 with App Router
- **Charts:** Lightweight Charts library
- **Styling:** Tailwind CSS
- **APIs:** Binance, Hyperliquid, Telegram, Etherscan
- **Real-time:** WebSocket connections for live data

## Security Notes

- Keep your `.env.local` file private and never commit it
- Telegram session strings provide account access - treat as passwords
- API keys should be kept secure and rotated regularly

## Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start
```

This project can be deployed on [Vercel](https://vercel.com), [Netlify](https://netlify.com), or any Node.js hosting platform.
