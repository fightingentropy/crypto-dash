import { NextRequest, NextResponse } from 'next/server';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

// You'll need to get these from https://my.telegram.org/apps
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0');
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const SESSION_STRING = process.env.TELEGRAM_SESSION || '';

interface TelegramEntity {
  id?: unknown;
  title?: string;
  username?: string;
  participantsCount?: number;
  about?: string;
}

interface TelegramMessage {
  id: number;
  message?: string;
  date: Date;
  views?: number;
}

async function createTelegramClient() {
  if (!API_ID || !API_HASH || !SESSION_STRING) {
    throw new Error('Telegram credentials not configured. Please set TELEGRAM_API_ID, TELEGRAM_API_HASH, and TELEGRAM_SESSION environment variables.');
  }

  const session = new StringSession(SESSION_STRING);
  const client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 3,
    requestRetries: 2,
  });

  try {
    await client.connect();
    
    // Verify the session is still valid
    if (!await client.checkAuthorization()) {
      await client.disconnect();
      throw new Error('Session expired. Please regenerate your session string.');
    }
    
    return client;
  } catch (error: unknown) {
    try {
      await client.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    
    if (error instanceof Error && 
        (error.message.includes('AUTH_KEY_DUPLICATED') || 
         (error as { errorMessage?: string }).errorMessage === 'AUTH_KEY_DUPLICATED')) {
      throw new Error('Session conflict detected. Please regenerate your session string using the authentication script.');
    }
    
    throw error;
  }
}

export async function GET(request: NextRequest) {
  let client: TelegramClient | null = null;
  
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'posts';
    const channel = searchParams.get('channel') || 'mlmonchain';
    
    if (action === 'reset') {
      return NextResponse.json({ 
        message: 'For serverless deployment, please regenerate your session string using the authentication script and update your environment variables.' 
      });
    }

    client = await createTelegramClient();

    if (action === 'channel_info') {
      const entity = await client.getEntity(channel) as TelegramEntity;
      return NextResponse.json({
        id: entity.id?.toString(),
        title: entity.title || '',
        username: entity.username || '',
        participantsCount: entity.participantsCount || 0,
        about: entity.about || ''
      });
    }

    // Default: Get recent posts
    const limit = parseInt(searchParams.get('limit') || '10');
    const entity = await client.getEntity(channel);
    const messages = await client.getMessages(entity, { limit });
    
    const posts = (messages as unknown as TelegramMessage[]).map(msg => ({
      id: msg.id,
      message: msg.message || '',
      date: msg.date,
      views: msg.views || 0
    }));

    return NextResponse.json(posts);
    
  } catch (error: unknown) {
    let errorMessage = 'Failed to fetch Telegram data';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Always disconnect the client in serverless environment
    if (client) {
      try {
        await client.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
  }
}

export async function DELETE() {
  return NextResponse.json({ 
    message: 'Session reset not available in serverless environment. Please regenerate your session string using the authentication script and update your TELEGRAM_SESSION environment variable.' 
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, channelUsername = 'mlmonchain', message } = body;
    
    const telegramClient = await createTelegramClient();
    
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to perform Telegram action', details: errorMessage },
      { status: 500 }
    );
  }
} 