const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

const apiId = parseInt(process.env.TELEGRAM_API_ID || '0');
const apiHash = process.env.TELEGRAM_API_HASH || '';

if (!apiId || !apiHash) {
  console.error('❌ Please set TELEGRAM_API_ID and TELEGRAM_API_HASH in your .env.local file');
  console.log('📖 Get them from: https://my.telegram.org/apps');
  process.exit(1);
}

async function setupTelegram() {
  console.log('🚀 Setting up Telegram connection...');
  console.log('📱 You will need your phone number and verification code');
  
  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.start({
      phoneNumber: async () => {
        console.log('📱 Important: Phone number must be in international format!');
        console.log('   Examples: +1234567890 (US), +447305023385 (UK), +33123456789 (France)');
        console.log('   Current from .env.local: +447305023385');
        return await askQuestion('📱 Enter your phone number (or press Enter to use +447305023385): ');
      },
      password: async () => {
        return await askQuestion('🔒 Enter your 2FA password (press enter if none): ');
      },
      phoneCode: async () => {
        return await askQuestion('💬 Enter the verification code sent to your phone: ');
      },
      onError: (err) => {
        console.error('❌ Authentication error:', err.message);
      },
    });

    console.log('✅ Successfully connected to Telegram!');
    const sessionString = client.session.save();
    
    console.log('\n🔑 Your session string:');
    console.log(sessionString);
    console.log('\n📝 Add this to your .env.local file as:');
    console.log(`TELEGRAM_SESSION=${sessionString}`);
    
    // Test connection by getting user info
    const me = await client.getMe();
    console.log(`\n👋 Logged in as: ${me.firstName} ${me.lastName || ''} (@${me.username || 'no username'})`);
    
    // Test channel access
    try {
      const entity = await client.getEntity('mlmonchain');
      console.log(`\n📢 Successfully found channel: ${entity.title || '@mlmonchain'}`);
    } catch (err) {
      console.log('\n⚠️  Could not access @mlmonchain channel. Make sure you have joined it first.');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.message.includes('PHONE_CODE_INVALID')) {
      console.log('💡 The verification code is incorrect. Please run the script again.');
    } else if (error.message.includes('PHONE_NUMBER_INVALID')) {
      console.log('💡 The phone number format is incorrect. Include country code (e.g., +1234567890)');
    } else if (error.message.includes('PASSWORD_HASH_INVALID')) {
      console.log('💡 The 2FA password is incorrect.');
    }
  } finally {
    await client.disconnect();
    rl.close();
  }
}

setupTelegram().catch(console.error); 