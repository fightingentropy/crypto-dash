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
    
    console.log('\n' + '='.repeat(80));
    console.log('🎉 SUCCESS! Your Telegram session string:');
    console.log('='.repeat(80));
    console.log(sessionString);
    console.log('='.repeat(80));
    console.log('\n📋 Next steps:');
    console.log('1. Copy the session string above');
    console.log('2. Update your .env.local file: TELEGRAM_SESSION=<session_string>');
    console.log('3. For Vercel deployment:');
    console.log('   - Go to your Vercel project dashboard');
    console.log('   - Navigate to Settings > Environment Variables');
    console.log('   - Add these variables:');
    console.log('     • TELEGRAM_API_ID=' + API_ID);
    console.log('     • TELEGRAM_API_HASH=' + API_HASH);
    console.log('     • TELEGRAM_SESSION=<session_string>');
    console.log('4. Redeploy your application');
    console.log('\n⚠️  IMPORTANT: Keep this session string secure and private!');
    
    await client.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    await client.disconnect();
    process.exit(1);
  }
}

authenticate(); 