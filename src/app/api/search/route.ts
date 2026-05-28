import { NextRequest, NextResponse } from 'next/server';
import { searchLiteratureAction } from '@/app/actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ success: false, error: 'Query parameter q is required' }, { status: 400 });
    }
    
    const results = await searchLiteratureAction(query);
    
    return NextResponse.json({ success: true, ...results }, { status: 200 });
  } catch (error: any) {
    console.error('Error in api/search:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
