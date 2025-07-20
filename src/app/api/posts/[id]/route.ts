import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { Session } from '@/types';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/posts/[id] - Get a specific post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        profile:profiles(
          username,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Transform to match expected format
    const transformedPost = {
      _id: post.id,
      title: post.title,
      content: post.content,
      imageUrls: post.image_urls || [],
      tags: post.tags || [],
      upvotes: post.upvotes || 0,
      createdAt: post.created_at,
      userId: {
        _id: post.user_id,
        username: post.profile?.username,
        avatarUrl: post.profile?.avatar_url
      }
    };

    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - Update a post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Check if post exists and user owns it
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to update this post' },
        { status: 403 }
      );
    }

    const { title, content, tags } = await request.json();

    // Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        title: title || undefined,
        content: content || undefined,
        tags: tags || undefined,
      })
      .eq('id', id)
      .select(`
        *,
        profile:profiles(
          username,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating post:', updateError);
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      );
    }

    // Transform to match expected format
    const transformedPost = {
      _id: updatedPost.id,
      title: updatedPost.title,
      content: updatedPost.content,
      imageUrls: updatedPost.image_urls || [],
      tags: updatedPost.tags || [],
      upvotes: updatedPost.upvotes || 0,
      createdAt: updatedPost.created_at,
      userId: {
        _id: updatedPost.user_id,
        username: updatedPost.profile?.username,
        avatarUrl: updatedPost.profile?.avatar_url
      }
    };

    return NextResponse.json(transformedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Check if post exists and user owns it
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this post' },
        { status: 403 }
      );
    }

    // Delete post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting post:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
} 