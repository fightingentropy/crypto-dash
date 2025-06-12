import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Twitter API v2 endpoint for user tweets
    const username = 'TreeNewsFeed';
    const url = `https://api.twitter.com/2/users/by/username/${username}`;
    
    // First, get the user ID
    const userResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (userResponse.status === 429) {
      return NextResponse.json({ 
        error: 'Twitter API rate limit exceeded. Please try again later.',
        rateLimited: true 
      }, { status: 429 });
    }

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Twitter API error:', userResponse.status, errorText);
      throw new Error(`Twitter API error: ${userResponse.status} - ${errorText}`);
    }

    const userData = await userResponse.json();
    const userId = userData.data?.id;

    if (!userId) {
      throw new Error('User not found');
    }

    // Now get the user's tweets
    const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets`;
    const tweetsResponse = await fetch(`${tweetsUrl}?max_results=10&tweet.fields=created_at,public_metrics,context_annotations&expansions=author_id`, {
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (tweetsResponse.status === 429) {
      return NextResponse.json({ 
        error: 'Twitter API rate limit exceeded. Please try again later.',
        rateLimited: true 
      }, { status: 429 });
    }

    if (!tweetsResponse.ok) {
      const errorText = await tweetsResponse.text();
      console.error('Twitter tweets API error:', tweetsResponse.status, errorText);
      throw new Error(`Twitter tweets API error: ${tweetsResponse.status} - ${errorText}`);
    }

    const tweetsData = await tweetsResponse.json();
    
    // Transform Twitter data to our news format
    const tweets = tweetsData.data?.map((tweet: { 
      id: string; 
      text: string; 
      created_at: string; 
      public_metrics?: { 
        retweet_count: number; 
        like_count: number; 
        reply_count: number; 
      }; 
    }) => ({
      id: tweet.id,
      title: tweet.text.length > 100 ? tweet.text.substring(0, 100) + '...' : tweet.text,
      summary: tweet.text,
      timestamp: new Date(tweet.created_at).getTime(),
      source: '@TreeNewsFeed',
      url: `https://twitter.com/TreeNewsFeed/status/${tweet.id}`,
      category: 'News',
      metrics: {
        retweets: tweet.public_metrics?.retweet_count || 0,
        likes: tweet.public_metrics?.like_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
      }
    })) || [];

    return NextResponse.json(tweets);
  } catch (error) {
    console.error('Error fetching Twitter data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tweets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 