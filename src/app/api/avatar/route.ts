import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name') || 'U';
    const size = searchParams.get('size') || '256';
    const background = searchParams.get('background') || 'random';
    const color = searchParams.get('color') || 'fff';
    
    // Redirect to UI Avatars service
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=${background}&color=${color}`;
    
    return NextResponse.redirect(avatarUrl);
  } catch (error) {
    console.error('Error in avatar route:', error);
    return NextResponse.json(
      { error: 'Failed to generate avatar' },
      { status: 500 }
    );
  }
} 