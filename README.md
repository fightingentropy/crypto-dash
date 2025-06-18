# Crypto Charts Dashboard

A real-time cryptocurrency dashboard built with Next.js featuring live price charts, funding rates, and social feeds.

## Features

- 📈 **Live Price Charts** - BTC and HYPE perpetual futures with real-time WebSocket updates
- 💰 **Funding Rates** - Live APR calculations from Binance and Hyperliquid
- 📱 **Telegram Feed** - Real-time messages from @mlmonchain channel
- 🐦 **Crypto Tweets** - Latest tweets from @TreeNewsFeed
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
# Twitter API (for crypto tweets)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Telegram API (for @mlmonchain feed)
TELEGRAM_API_ID=your_api_id_here
TELEGRAM_API_HASH=your_api_hash_here
TELEGRAM_PHONE=+1234567890
TELEGRAM_SESSION=your_session_string_here
# Etherscan API (for Ethereum transaction volume)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Telegram Setup

The dashboard includes a live feed from the @mlmonchain Telegram channel. To set this up:

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
   - **Channel access**: Join @mlmonchain before setup

### Twitter Setup

For the crypto tweets feature:

1. **Get Twitter API credentials** from [developer.twitter.com](https://developer.twitter.com)
2. **Add your Bearer Token** to `.env.local`

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes for data fetching
│   │   ├── binance/   # Binance price data
│   │   ├── funding/   # Funding rates from exchanges
│   │   ├── telegram/  # Telegram channel messages
│   │   └── twitter/   # Twitter/X tweets
│   └── page.tsx       # Main dashboard page
├── components/
│   ├── PriceChart.tsx    # Live candlestick charts
│   ├── FundingRates.tsx  # Funding rates table
│   ├── TelegramFeed.tsx  # Telegram messages
│   └── CryptoTweets.tsx  # Twitter feed
└── scripts/
    └── telegram-setup.js # Telegram authentication helper
```

## Technology Stack

- **Framework:** Next.js 15 with App Router
- **Charts:** Lightweight Charts library
- **Styling:** Tailwind CSS
- **APIs:** Binance, Hyperliquid, Twitter, Telegram
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
