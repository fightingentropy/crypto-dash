require('dotenv').config({ path: '.env.local' });
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline');

const API_ID = parseInt(process.env.TELEGRAM_API_ID);
const API_HASH = process.env.TELEGRAM_API_HASH;
const PHONE = process.env.TELEGRAM_PHONE;

console.log('🔍 Environment check:');
console.log('API_ID:', API_ID);
console.log('API_HASH:', API_HASH ? `${API_HASH.substring(0, 8)}...` : 'undefined');
console.log('PHONE:', PHONE);

if (!API_ID || !API_HASH || !PHONE) {
  console.error('❌ Missing required environment variables!');
  console.log('Required: TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_PHONE');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function authenticate() {
  console.log('🔐 Starting Telegram authentication...');
  console.log(`📱 Using phone number: ${PHONE}`);
  
  const session = new StringSession('');
  const client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 5,
  });

  try {
    await client.start({
      phoneNumber: PHONE,
      password: async () => {
        return new Promise((resolve) => {
          rl.question('🔒 Enter your 2FA password (if enabled, otherwise press Enter): ', resolve);
        });
      },
      phoneCode: async () => {
        return new Promise((resolve) => {
          rl.question('📝 Enter the code you received: ', resolve);
        });
      },
      onError: (err) => console.error('❌ Auth error:', err),
    });

    console.log('✅ Authentication successful!');
    const sessionString = client.session.save();
    console.log('\n🔑 Your session string:');
    console.log(sessionString);
    console.log('\n📝 Add this to your .env.local file:');
    console.log(`TELEGRAM_SESSION=${sessionString}`);
    
  } catch (error) {
    console.error('❌ Authentication failed:', error);
  } finally {
    await client.disconnect();
    rl.close();
  }
}

authenticate(); 