import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/db';
import Comment from '@/models/Comment';
import User from '@/models/User';
import { Session } from '@/types';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/comments - Get comments for a post
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const comments = await Comment.find({ postId })
      .populate('userId', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .lean();

    // Organize comments into a tree structure
    const commentMap = new Map();
    const rootComments: any[] = [];

    comments.forEach(comment => {
      commentMap.set((comment._id as any).toString(), { ...comment, replies: [] });
    });

    comments.forEach(comment => {
      const commentWithReplies = commentMap.get((comment._id as any).toString());
      if (comment.parentId) {
        const parent = commentMap.get((comment.parentId as any).toString());
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

    await dbConnect();
    
    const { postId, content, parentId } = await request.json();

    if (!postId || !content) {
      return NextResponse.json(
        { error: 'Post ID and content are required' },
        { status: 400 }
      );
    }

    // Handle both Google OAuth users (string ID) and regular users (ObjectId)
    let user;
    if (session.user.email) {
      // For Google OAuth users, find by email
      user = await User.findOne({ email: session.user.email });
    } else {
      // For regular users, try to find by ObjectId
      user = await User.findById(session.user.id);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const comment = new Comment({
      postId,
      userId: user._id,
      content,
      parentId: parentId || null,
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username avatarUrl')
      .lean();

    return NextResponse.json(populatedComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
} 