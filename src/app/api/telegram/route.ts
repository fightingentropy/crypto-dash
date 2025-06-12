import { NextRequest, NextResponse } from 'next/server';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

// You'll need to get these from https://my.telegram.org/apps
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0');
const API_HASH = process.env.TELEGRAM_API_HASH || '';
let SESSION_STRING = process.env.TELEGRAM_SESSION || '';

let client: TelegramClient | null = null;

async function clearSession() {
  if (client) {
    try {
      await client.disconnect();
    } catch (error) {
      console.log('Error disconnecting client:', error);
    }
    client = null;
  }
  SESSION_STRING = ''; // Clear the session string
}

async function initTelegramClient(forceReset = false) {
  if (forceReset) {
    await clearSession();
  }
  
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
    
    // Save the new session string (in a real app, you'd persist this to your database)
    const savedSession = client.session.save();
    SESSION_STRING = typeof savedSession === 'string' ? savedSession : '';
    
    return client;
  } catch (error: unknown) {
    console.error('Failed to initialize Telegram client:', error);
    
    // If we get AUTH_KEY_DUPLICATED error, clear the session and throw
    if (error && typeof error === 'object' && 'errorMessage' in error && 
        (error as any).errorMessage === 'AUTH_KEY_DUPLICATED') {
      await clearSession();
      throw new Error('Session conflict detected. Please try resetting the session.');
    }
    
    throw error;
  }
}

// Add a DELETE endpoint to reset the session
export async function DELETE() {
  try {
    await clearSession();
    return NextResponse.json({ 
      success: true, 
      message: 'Telegram session cleared successfully' 
    });
  } catch (error: unknown) {
    console.error('Error clearing session:', error);
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const channelUsername = searchParams.get('channel') || 'mlmonchain';
    const reset = searchParams.get('reset') === 'true';
    
    // Special action to reset session
    if (action === 'reset') {
      return DELETE();
    }
    
    const telegramClient = await initTelegramClient(reset);
    
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
    
    // If it's a session conflict, suggest resetting
    if (errorMessage.includes('AUTH_KEY_DUPLICATED') || errorMessage.includes('Session conflict')) {
      return NextResponse.json(
        { 
          error: 'Session conflict detected', 
          details: errorMessage,
          suggestion: 'Try resetting the session by calling DELETE /api/telegram or GET /api/telegram?action=reset'
        },
        { status: 409 }
      );
    }
    
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