import { authOptions } from '@/lib/auth';
import { supabase, supabaseAdmin } from '@/lib/supabase/client';
import { Session } from '@/types';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Posts API called');
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '8');
    const tag = searchParams.get('tag');
    const userId = searchParams.get('userId');
    const offset = (page - 1) * limit;

    console.log('Query parameters:', { page, limit, tag, userId, offset });

    // Build base query
    let baseQuery = supabase
      .from('posts')
      .select(`
        *,
        profile:profiles(
          username,
          avatar_url
        )
      `, { count: 'exact' });

    console.log('Base query built');

    // Apply filters
    if (tag) {
      console.log('Applying tag filter:', tag);
      baseQuery = baseQuery.contains('tags', [tag]);
    }

    if (userId) {
      console.log('Applying user filter:', userId);
      const session = await getServerSession(authOptions as any) as Session | null;
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Get user by username
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', userId)
        .single();

      if (!profile) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      baseQuery = baseQuery.eq('user_id', profile.id);
    }

    console.log('Executing query...');

    // Get posts with count
    const { data: posts, error: postsError, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    console.log('Query executed, posts:', posts?.length, 'error:', postsError);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: postsError.message },
        { status: 500 }
      );
    }

    const totalPosts = count || 0;
    const totalPages = Math.ceil(totalPosts / limit);

    console.log('Transforming posts...');

    // Transform posts to match the expected format
    const transformedPosts = (posts || []).map(post => ({
      _id: post.id,
      title: post.title,
      content: post.content,
      imageUrls: post.image_urls || [],
      tags: post.tags || [],
      upvotes: post.upvotes || 0,
      views: 0, // Temporarily set to 0 while fixing the query
      createdAt: post.created_at,
      userId: {
        _id: post.user_id,
        username: post.profile?.username,
        avatarUrl: post.profile?.avatar_url
      }
    }));

    console.log('Posts transformed, returning response');

    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      }
    });

  } catch (error) {
    console.error('Error in posts API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as Session | null;
    
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
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

    console.log('Found image files:', imageFiles.length);

    // Process each image
    for (const [_, file] of imageFiles) {
      if (file instanceof File && file.size > 0) {
        console.log('Processing image:', file.name, 'Size:', file.size);
        
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          console.error('Image too large:', file.name, file.size);
          return new Response(
            JSON.stringify({ error: 'Each image must be less than 5MB' }),
            { status: 400 }
          );
        }
        
        // Generate unique filename
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        
        console.log('Uploading image with filename:', fileName);
        
        try {
          // Upload image to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('post-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            // Continue with other images instead of failing completely
            continue;
          }

          console.log('Image uploaded successfully:', uploadData);

          // Get public URL
          const { data: { publicUrl } } = supabase
            .storage
            .from('post-images')
            .getPublicUrl(fileName);

          console.log('Public URL generated:', publicUrl);
          imageUrls.push(publicUrl);
          
        } catch (error) {
          console.error('Exception during image upload:', error);
          // Continue with other images
          continue;
        }
      }
    }

    console.log('Final image URLs:', imageUrls);

    // First, get the user's profile using admin client
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', session.user.id)
      .single();

    // If profile doesn't exist, create a basic one
    if (profileError || !profile) {
      console.log('Profile not found, creating basic profile for user:', session.user.id);
      
      try {
        const { data: newProfile, error: createError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.name || session.user.email?.split('@')[0] || 'user',
            avatar_url: session.user.image || null,
          })
          .select('id, username, avatar_url')
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          // Continue without creating profile, use session data
          profile = {
            id: session.user.id,
            username: session.user.name || session.user.email?.split('@')[0] || 'user',
            avatar_url: session.user.image || null,
          };
        } else {
          profile = newProfile;
        }
      } catch (error) {
        console.error('Exception during profile creation:', error);
        // Continue without creating profile, use session data
        profile = {
          id: session.user.id,
          username: session.user.name || session.user.email?.split('@')[0] || 'user',
          avatar_url: session.user.image || null,
        };
      }
    }

    // Create post in Supabase using admin client
    console.log('Creating post with supabaseAdmin...');
    
    try {
      const { data: post, error: postError } = await supabaseAdmin
        .from('posts')
        .insert({
          user_id: profile.id,
          title,
          content,
          image_urls: imageUrls,
          tags,
          upvotes: 0
        })
        .select('*')
        .single();

      console.log('Post creation result:', { post, error: postError });

      if (postError) {
        console.error('Error creating post:', postError);
        throw postError;
      }

      if (!post) {
        throw new Error('Failed to create post');
      }

      // Transform post to match the expected format
      const transformedPost = {
        _id: post.id,
        title: post.title,
        content: post.content,
        imageUrls: post.image_urls || [],
        tags: post.tags || [],
        upvotes: post.upvotes || 0,
        views: 0, // New posts start with 0 views
        createdAt: post.created_at,
        userId: {
          _id: profile.id,
          username: profile.username,
          avatarUrl: profile.avatar_url
        }
      };

      return new Response(JSON.stringify(transformedPost), { status: 201 });
    } catch (error) {
      console.error('Exception during post creation:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create post', 
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating post:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create post' }),
      { status: 500 }
    );
  }
} 