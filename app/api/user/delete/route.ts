import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { withAuth } from '@/lib/auth';

// DELETE - Delete the user's account
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    // Connect to database
    await connectDB();
    
    // Delete user
    const deletedUser = await User.findByIdAndDelete(user.id);
    
    if (!deletedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    // In a real application, you might want to:
    // 1. Delete all related data (appointments, messages, etc.)
    // 2. Send a confirmation email
    // 3. Log the deletion for audit purposes
    
    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete account',
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 