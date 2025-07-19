import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db/db';
import Post from '@/models/Post';
import User from '@/models/User';
import { Session } from '@/types';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/posts - Get all posts with pagination
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tag = searchParams.get('tag');
    const userId = searchParams.get('userId');
    const skip = (page - 1) * limit;

    let query: any = {};
    if (tag) {
      query.tags = tag;
    }
    if (userId) {
      const user = await User.findOne({ username: userId });
      if (user) {
        query.userId = user._id;
      }
    }

    const posts = await Post.find(query)
      .populate('userId', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    return NextResponse.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as Session | null;
    
    if (!session?.user?.id ) {
      return NextResponse.json(
        { error: 'Authentication required' },
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const tagsString = formData.get('tags') as string;
    const imageFile = formData.get('image') as File | null;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
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

    // Handle image upload
    let imageUrl = '';
    if (imageFile && imageFile.size > 0) {
      // Check file size (limit to 5MB)
      if (imageFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Image size must be less than 5MB' },
          { status: 400 }
        );
      }
      
      // Convert image to base64
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64String = buffer.toString('base64');
      const mimeType = imageFile.type;
      imageUrl = `data:${mimeType};base64,${base64String}`;
    }

    const post = new Post({
      userId: user._id,
      title,
      content,
      imageUrl,
      tags,
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'username avatarUrl')
      .lean();

    return NextResponse.json(populatedPost, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
} 