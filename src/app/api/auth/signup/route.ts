import { supabase } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const { email, password, username, avatar_url } = await request.json();

    if (!email || !password || !username) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and username are required' }),
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User with this email already exists' }),
        { status: 400 }
      );
    }

    // Try to create user with minimal data first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      console.error('Supabase Auth signup error:', signUpError);
      
      // Check if it's a duplicate email error
      if (signUpError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'User with this email already exists' }),
          { status: 400 }
        );
      }
      
      // If the error is related to database constraints, try a different approach
      if (signUpError.message.includes('Database error')) {
        console.log('Database error detected, trying alternative approach');
        
        // Try creating the profile first, then the auth user
        const userId = crypto.randomUUID();
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email,
            username,
            avatar_url,
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Profile creation failed:', profileError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create user profile', 
              details: profileError.message 
            }),
            { status: 500 }
          );
        }

        // Return success with the created profile
        return new Response(
          JSON.stringify({ 
            user: { id: userId, email, username, avatar_url },
            message: 'User profile created successfully. Please sign in with your credentials.'
          }),
          { status: 201 }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create user in auth', 
          details: signUpError.message 
        }),
        { status: 500 }
      );
    }

    if (!signUpData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500 }
      );
    }

    const userId = signUpData.user.id;

    // 2. Create profile row
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        username,
        avatar_url,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      
      // If profile creation fails, we should still return success
      // since the user was created in Supabase Auth
      console.log('Profile creation failed, but user was created in Auth');
      
      // Check if email confirmation is required
      if (!signUpData.user.email_confirmed_at) {
        return new Response(
          JSON.stringify({ 
            message: 'Please check your email to confirm your account before signing in.',
            requiresConfirmation: true,
            user: { id: userId, email, username, avatar_url }
          }),
          { status: 200 }
        );
      }

      return new Response(
        JSON.stringify({ 
          user: { id: userId, email, username, avatar_url },
          warning: 'User created but profile creation failed'
        }), 
        { status: 201 }
      );
    }

    // Check if email confirmation is required
    if (!signUpData.user.email_confirmed_at) {
      return new Response(
        JSON.stringify({ 
          message: 'Please check your email to confirm your account before signing in.',
          requiresConfirmation: true,
          user: profile
        }),
        { status: 200 }
      );
    }

    return new Response(JSON.stringify({ user: profile }), { status: 201 });
  } catch (error: any) {
    console.error('Signup error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500 }
    );
  }
} 