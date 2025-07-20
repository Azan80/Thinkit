'use client';

import { supabase } from '@/lib/supabase/client';
import { SessionProvider } from 'next-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';

interface SupabaseSession {
    user: {
        id: string;
        email: string;
        user_metadata?: {
            full_name?: string;
            avatar_url?: string;
        };
    } | null;
    access_token?: string;
}

const SupabaseSessionContext = createContext<{
    session: SupabaseSession | null;
    loading: boolean;
}>({
    session: null,
    loading: true,
});

export const useSupabaseSession = () => {
    return useContext(SupabaseSessionContext);
};

export default function Providers({ children }: { children: React.ReactNode }) {
    const [supabaseSession, setSupabaseSession] = useState<SupabaseSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSupabaseSession(session as SupabaseSession);
            setLoading(false);
        };

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Supabase auth state changed:', event, session?.user?.email);
                setSupabaseSession(session as SupabaseSession);
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    return (
        <SessionProvider>
            <SupabaseSessionContext.Provider value={{ session: supabaseSession, loading }}>
                {children}
            </SupabaseSessionContext.Provider>
        </SessionProvider>
    );
} 