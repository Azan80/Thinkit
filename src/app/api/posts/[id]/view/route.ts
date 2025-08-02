import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/client';
import { Session } from '@/types';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any) as Session | null;
    
    // Only track views for authenticated users
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required to track views' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    // Check if user has already viewed this post
    const { data: existingView, error: checkError } = await supabaseAdmin
      .from('post_views')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', session.user.id)
      .single();

    // If user hasn't viewed this post before, add a view record
    if (checkError && checkError.code === 'PGRST116') {
      // No existing view found, create new view record
      const { error: insertError } = await supabaseAdmin
        .from('post_views')
        .insert({
          post_id: id,
          user_id: session.user.id,
        });

      if (insertError) {
        console.error('Error creating view record:', insertError);
        return NextResponse.json(
          { error: 'Failed to track view' },
          { status: 500 }
        );
      }
    } else if (checkError) {
      console.error('Error checking existing view:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing view' },
        { status: 500 }
      );
    }
    // If existingView exists, user has already viewed this post, so no action needed

    // Get the total view count for this post
    const { count: viewCount, error: countError } = await supabaseAdmin
      .from('post_views')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', id);

    if (countError) {
      console.error('Error getting view count:', countError);
      return NextResponse.json(
        { error: 'Failed to get view count' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      views: viewCount || 0,
      isNewView: !existingView 
    });
  } catch (error) {
    console.error('Error in view tracking:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
} 