import { supabaseAdmin } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

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
      views: viewCount || 0
    });
  } catch (error) {
    console.error('Error getting view count:', error);
    return NextResponse.json(
      { error: 'Failed to get view count' },
      { status: 500 }
    );
  }
} 