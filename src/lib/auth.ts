import { supabase } from '@/lib/supabase/client';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Use Supabase Auth to sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) {
          console.error('Signin error:', error);
          return null;
        }

        // Get user profile from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', data.user.id)
          .single();

        return {
          id: data.user.id,
          email: data.user.email,
          name: profile?.username || data.user.email?.split('@')[0],
          image: profile?.avatar_url || data.user.user_metadata?.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: any; account: any; profile: any }) {
      console.log('SignIn callback triggered:', { 
        provider: account?.provider, 
        userEmail: user?.email,
        userName: user?.name 
      });

      if (account?.provider === 'google') {
        try {
          console.log('Processing Google sign-in for:', user.email);
          
          // Check if user already exists in profiles table by email
          const { data: existingUser, error: fetchError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('email', user.email)
            .maybeSingle();

          if (fetchError) {
            console.error('Error checking existing user:', fetchError);
            return false;
          }

          if (!existingUser) {
            console.log('No existing user found, creating new profile for:', user.email);
            
            // Create new user in profiles table with a simple UUID
            const userId = crypto.randomUUID();
            
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: userId,
                username: user.name || user.email?.split('@')[0],
                email: user.email,
                avatar_url: user.image,
                created_at: new Date().toISOString(),
              });

            if (insertError) {
              console.error('Error creating user profile:', insertError);
              // If there's still a foreign key constraint error, we'll just return true
              // and let the user sign in without creating a profile for now
              console.log('Profile creation failed, but allowing sign-in to continue');
              return true;
            } else {
              // Update the user object with the new ID
              user.id = userId;
              console.log('Successfully created new Google user profile:', userId);
            }
          } else {
            console.log('Found existing user profile:', existingUser.id);
            // Update the user object with existing profile data
            user.id = existingUser.id;
            user.name = existingUser.username || user.name;
            user.image = existingUser.avatar_url || user.image;
          }
        } catch (error) {
          console.error('Error during Google sign-in:', error);
          // Don't fail the sign-in, just log the error
          console.log('Google sign-in error, but allowing to continue');
          return true;
        }
      }
      return true;
    },
    async session({ session, token }: { session: any; token: any }) {
      console.log('Session callback:', { userId: token.sub, userEmail: session.user?.email });
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      console.log('JWT callback:', { userId: user?.id, tokenSub: token.sub });
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXT_PUBLIC_AUTH_SECRET,
};

const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };
