import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
import { Session } from '@/types';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/comments - Get comments for a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        profile:profiles(
          username,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Organize comments into a tree structure
    const commentMap = new Map();
    const rootComments: any[] = [];

    comments?.forEach(comment => {
      commentMap.set(comment.id, { 
        ...comment, 
        replies: [],
        _id: comment.id,
        userId: {
          _id: comment.user_id,
          username: comment.profile?.username,
          avatarUrl: comment.profile?.avatar_url
        }
      });
    });

    comments?.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id);
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });

    return NextResponse.json(rootComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { postId, content, parentId } = await request.json();

    if (!postId || !content) {
      return NextResponse.json(
        { error: 'Post ID and content are required' },
        { status: 400 }
      );
    }

    // Create comment in Supabase
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: session.user.id,
        content,
        parent_id: parentId || null,
      })
      .select(`
        *,
        profile:profiles(
          username,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Transform comment to match expected format
    const transformedComment = {
      _id: comment.id,
      postId: comment.post_id,
      content: comment.content,
      parentId: comment.parent_id,
      createdAt: comment.created_at,
      userId: {
        _id: comment.user_id,
        username: comment.profile?.username,
        avatarUrl: comment.profile?.avatar_url
      }
    };

    return NextResponse.json(transformedComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
} 