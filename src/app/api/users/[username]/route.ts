import { supabase } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id, username, email, avatar_url, created_at')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Transform to match expected format
    const transformedUser = {
      _id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
    };

    return NextResponse.json(transformedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
} 