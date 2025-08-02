import { supabaseAdmin } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing Supabase admin connection...');
    
    // Test a simple query with admin client
    const { data, error } = await supabaseAdmin
      .from('posts')
      .select('id, title')
      .limit(1);

    if (error) {
      console.error('Supabase admin test error:', error);
      return NextResponse.json(
        { error: 'Supabase admin connection failed', details: error.message },
        { status: 500 }
      );
    }

    console.log('Supabase admin connection successful, data:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Supabase admin connection working',
      data: data
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 