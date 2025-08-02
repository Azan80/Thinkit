import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test a simple query
    const { data, error } = await supabase
      .from('posts')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase test error:', error);
      return NextResponse.json(
        { error: 'Supabase connection failed', details: error.message },
        { status: 500 }
      );
    }

    console.log('Supabase connection successful, data:', data);
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection working',
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