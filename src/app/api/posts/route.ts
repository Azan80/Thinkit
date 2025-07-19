import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/db';
import Post from '@/models/Post';
import User from '@/models/User';
import { Session } from '@/types';
import { getServerSession } from 'next-auth';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Set up headers for SSE
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '8');
    const tag = searchParams.get('tag');
    const userId = searchParams.get('userId');
    const skip = (page - 1) * limit;

    // Build query with proper index usage
    let query: any = {};
    if (tag) query.tags = tag;
    if (userId) {
      const session = await getServerSession(authOptions as any) as Session | null;
      if (!session?.user?.id) {
        return new Response(
          `data: ${JSON.stringify({ type: 'error', message: 'Authentication required' })}\n\n`,
          { headers }
        );
      }
      
      const user = await User.findOne({ username: userId })
        .select('_id')
        .lean()
        .exec();
        
      if (!user) {
        return new Response(
          `data: ${JSON.stringify({ type: 'error', message: 'User not found' })}\n\n`,
          { headers }
        );
      }

      // Fix: user may be an array if multiple users are found, but findOne returns a single object or null.
      // Also, ensure TypeScript knows user is not an array.
      query.userId = (user as { _id: unknown })._id;
    }

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Execute queries in parallel
          const [posts, totalPosts] = await Promise.all([
            Post.find(query)
              .select('title content imageUrls tags createdAt userId upvotes')
              .populate('userId', 'username avatarUrl -_id')
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .lean({ virtuals: true })
              .exec(),
            Post.countDocuments(query)
          ]);

          const totalPages = Math.ceil(totalPosts / limit);

          // Send all posts in one batch for better performance
          if (posts.length > 0) {
            controller.enqueue(
              `data: ${JSON.stringify({ 
                type: 'posts', 
                data: posts 
              })}\n\n`
            );
          }

          // Send pagination info
          controller.enqueue(
            `data: ${JSON.stringify({
              type: 'pagination',
              data: {
                currentPage: page,
                totalPages,
                totalPosts,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
              }
            })}\n\n`
          );

          // Send end message
          controller.enqueue(
            `data: ${JSON.stringify({ type: 'end' })}\n\n`
          );

          // Close the stream
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Error fetching posts:', error);
    return new Response(
      `data: ${JSON.stringify({ type: 'error', message: 'Failed to fetch posts' })}\n\n`,
      { headers }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as Session | null;
    
    if (!session?.user?.id ) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }

    await dbConnect();
    
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
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const tagsString = formData.get('tags') as string;

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        { status: 400 }
      );
    }

    // Parse tags
    let tags: string[] = [];
    if (tagsString) {
      try {
        tags = JSON.parse(tagsString);
      } catch (error) {
        console.error('Error parsing tags:', error);
        tags = [];
      }
    }

    // Handle multiple images
    const imageUrls: string[] = [];
    const formEntries = Array.from(formData.entries());
    const imageFiles = formEntries.filter(([key]) => key.startsWith('image'));

    // Process each image
    for (const [_, file] of imageFiles) {
      if (file instanceof File && file.size > 0) {
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          return new Response(
            JSON.stringify({ error: 'Each image must be less than 5MB' }),
            { status: 400 }
          );
        }
        
        // Convert image to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64String = buffer.toString('base64');
        const mimeType = file.type;
        imageUrls.push(`data:${mimeType};base64,${base64String}`);
      }
    }

    const post = new Post({
      userId: user._id,
      title,
      content,
      imageUrls, // Updated to store multiple image URLs
      tags,
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'username avatarUrl')
      .lean();

    return new Response(JSON.stringify(populatedPost), { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create post' }),
      { status: 500 }
    );
  }
} 