import { NextRequest, NextResponse } from 'next/server';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

// You'll need to get these from https://my.telegram.org/apps
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0');
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const SESSION_STRING = process.env.TELEGRAM_SESSION || '';

let client: TelegramClient | null = null;

async function initTelegramClient() {
  if (client) return client;
  
  try {
    const session = new StringSession(SESSION_STRING);
    client = new TelegramClient(session, API_ID, API_HASH, {
      connectionRetries: 5,
    });
    
    await client.start({
      phoneNumber: async () => process.env.TELEGRAM_PHONE || '',
      password: async () => process.env.TELEGRAM_PASSWORD || '',
      phoneCode: async () => {
        // In a real app, you'd need to implement a way to get the phone code
        throw new Error('Phone code required - implement phone code input');
      },
      onError: (err: Error) => console.error('Telegram auth error:', err),
    });
    
    return client;
  } catch (error: unknown) {
    console.error('Failed to initialize Telegram client:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const channelUsername = searchParams.get('channel') || 'mlmonchain';
    
    const telegramClient = await initTelegramClient();
    
    switch (action) {
      case 'messages':
        const limit = parseInt(searchParams.get('limit') || '10');
        const messages = await telegramClient.getMessages(channelUsername, {
          limit,
        });
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedMessages = messages.map((msg: any) => ({
          id: msg.id,
          text: msg.message,
          date: msg.date,
          sender: msg.senderId?.toString() || '',
          views: msg.views,
        }));
        
        return NextResponse.json({ messages: formattedMessages });
        
      case 'channel_info':
        const entity = await telegramClient.getEntity(channelUsername);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entityData = entity as any;
        return NextResponse.json({
          id: entityData.id?.toString() || '',
          title: entityData.title || '',
          username: entityData.username || '',
          participantsCount: entityData.participantsCount || 0,
          about: entityData.about || '',
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Telegram API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch Telegram data', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, channelUsername = 'mlmonchain', message } = body;
    
    const telegramClient = await initTelegramClient();
    
    switch (action) {
      case 'send_message':
        if (!message) {
          return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }
        
        const result = await telegramClient.sendMessage(channelUsername, {
          message,
        });
        
        return NextResponse.json({ success: true, messageId: result.id });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('Telegram POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to perform Telegram action', details: errorMessage },
      { status: 500 }
    );
  }
} 