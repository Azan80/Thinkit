import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/db';
import Post from '@/models/Post';
import User from '@/models/User';
import Vote from '@/models/Vote';
import { Session } from '@/types';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/votes - Vote on a post
export async function POST(request: NextRequest )  {
  try {
    const session = await getServerSession(authOptions as any) as Session | null;
    
    if (!session?.user?.id ) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { postId, value } = await request.json();

    if (!postId || ![1, -1].includes(value)) {
      return NextResponse.json(
        { error: 'Post ID and vote value (1 or -1) are required' },
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

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already voted
    const existingVote = await Vote.findOne({
      userId: user._id,
      postId,
    });

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote if same value
        await Vote.findByIdAndDelete(existingVote._id);
        await Post.findByIdAndUpdate(postId, {
          $inc: { upvotes: -value },
        });
      } else {
        // Update vote
        existingVote.value = value;
        await existingVote.save();
        await Post.findByIdAndUpdate(postId, {
          $inc: { upvotes: value * 2 }, // Double the change since we're flipping
        });
      }
    } else {
      // Create new vote
      const vote = new Vote({
        userId: user._id,
        postId,
        value,
      });
      await vote.save();
      await Post.findByIdAndUpdate(postId, {
        $inc: { upvotes: value },
      });
    }

    // Get updated post
    const updatedPost = await Post.findById(postId).lean();

    if (!updatedPost) {
      return NextResponse.json(
        { error: 'Failed to retrieve updated post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Vote recorded successfully',
      upvotes: (updatedPost as any).upvotes,
    });
  } catch (error) {
    console.error('Error voting on post:', error);
    return NextResponse.json(
      { error: 'Failed to vote on post' },
      { status: 500 }
    );
  }
} 