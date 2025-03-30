import { NextResponse } from 'next/server';

export async function POST() {
  // Create a response
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );
  
  // Clear the token cookie
  response.cookies.set({
    name: 'token',
    value: '',
    expires: new Date(0), // Expire immediately
    path: '/',
  });
  
  return response;
} 