import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '8');
    const tag = searchParams.get('tag');
    const userId = searchParams.get('userId');
    const offset = (page - 1) * limit;

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

    // Apply filters
    if (tag) {
      baseQuery = baseQuery.contains('tags', [tag]);
    }

    if (userId) {
      const session = await getServerSession(authOptions as any) as Session | null;
      if (!session?.user?.id) {
        return new Response(
          `data: ${JSON.stringify({ type: 'error', message: 'Authentication required' })}\n\n`,
          { headers }
        );
      }

      // Get user by username
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', userId)
        .single();

      if (!profile) {
        return new Response(
          `data: ${JSON.stringify({ type: 'error', message: 'User not found' })}\n\n`,
          { headers }
        );
      }

      baseQuery = baseQuery.eq('user_id', profile.id);
    }

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get posts with count
          const { data: posts, error: postsError, count } = await baseQuery
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (postsError) {
            console.error('Error fetching posts:', postsError);
            throw postsError;
          }

          const totalPosts = count || 0;
          const totalPages = Math.ceil(totalPosts / limit);

          // Transform posts to match the expected format
          const transformedPosts = (posts || []).map(post => ({
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
          }));

          // Send all posts in one batch
          if (transformedPosts.length > 0) {
            controller.enqueue(
              `data: ${JSON.stringify({ 
                type: 'posts', 
                data: transformedPosts 
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
          console.error('Stream error:', error);
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

    // First, get the user's profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', session.user.id)
      .single();

    // If profile doesn't exist, create a basic one
    if (profileError || !profile) {
      console.log('Profile not found, creating basic profile for user:', session.user.id);
      
      const { data: newProfile, error: createError } = await supabase
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
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile' }),
          { status: 500 }
        );
      }
      
      profile = newProfile;
    }

    // Create post in Supabase
    const { data: post, error: postError } = await supabase
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
      createdAt: post.created_at,
      userId: {
        _id: profile.id,
        username: profile.username,
        avatarUrl: profile.avatar_url
      }
    };

    return new Response(JSON.stringify(transformedPost), { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create post' }),
      { status: 500 }
    );
  }
} 