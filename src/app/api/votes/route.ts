import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/client';
import { Session } from '@/types';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/votes - Vote on a post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as Session | null;
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { postId, value } = await request.json();

    if (!postId || ![1, -1].includes(value)) {
      return NextResponse.json(
        { error: 'Post ID and vote value (1 or -1) are required' },
        { status: 400 }
      );
    }

    // Check if post exists
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .select('id, upvotes')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user already voted
    const { data: existingVote, error: voteError } = await supabaseAdmin
      .from('votes')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('post_id', postId)
      .single();

    if (voteError && voteError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is expected
      console.error('Error checking existing vote:', voteError);
      return NextResponse.json(
        { error: 'Failed to check existing vote' },
        { status: 500 }
      );
    }

    let newUpvotes = post.upvotes;

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote if same value
        await supabaseAdmin
          .from('votes')
          .delete()
          .eq('id', existingVote.id);

        newUpvotes -= value;
      } else {
        // Update vote
        await supabaseAdmin
          .from('votes')
          .update({ value })
          .eq('id', existingVote.id);

        newUpvotes += value * 2; // Double the change since we're flipping
      }
    } else {
      // Create new vote
      const { error: insertError } = await supabaseAdmin
        .from('votes')
        .insert({
          user_id: session.user.id,
          post_id: postId,
          value,
        });

      if (insertError) {
        console.error('Error creating vote:', insertError);
        return NextResponse.json(
          { error: 'Failed to create vote' },
          { status: 500 }
        );
      }

      newUpvotes += value;
    }

    // Update post upvotes
    const { error: updateError } = await supabaseAdmin
      .from('posts')
      .update({ upvotes: newUpvotes })
      .eq('id', postId);

    if (updateError) {
      console.error('Error updating post upvotes:', updateError);
      return NextResponse.json(
        { error: 'Failed to update post upvotes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Vote recorded successfully',
      upvotes: newUpvotes,
    });
  } catch (error) {
    console.error('Error voting on post:', error);
    return NextResponse.json(
      { error: 'Failed to vote on post' },
      { status: 500 }
    );
  }
} 