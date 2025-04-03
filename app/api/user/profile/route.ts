import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { withAuth } from '@/lib/auth';

// GET - Get the current user's profile
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    // Connect to database
    await connectDB();
    
    // Get user from database
    const userData = await User.findById(user._id).select('-password');
    
    if (!userData) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        bio: userData.bio,
        specialization: userData.specialization,
        contactEmail: userData.contactEmail,
        phoneNumber: userData.phoneNumber,
        profileImage: userData.profileImage,
        emergencyContacts: userData.emergencyContacts,
        createdAt: userData.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch profile',
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH - Update the user's profile
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    // Connect to database
    await connectDB();
    
    // Get profile data from request
    const data = await request.json();
    
    // Fields that can be updated
    const allowedFields = ['name', 'bio', 'specialization', 'contactEmail', 'phoneNumber', 'emergencyContacts'];
    
    // Create update object with only allowed fields
    const updates: any = {};
    
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    });
    
    // Validate fields for therapist
    if (user.role === 'therapist' && updates.specialization === '') {
      return NextResponse.json(
        { success: false, message: 'Specialization is required for therapists' },
        { status: 400 }
      );
    }
    
    // Validate emergency contacts for patient
    if (user.role === 'patient' && updates.emergencyContacts) {
      // Ensure emergencyContacts is an array
      if (!Array.isArray(updates.emergencyContacts)) {
        return NextResponse.json(
          { success: false, message: 'Emergency contacts must be an array' },
          { status: 400 }
        );
      }
      
      // Validate each emergency contact has required fields
      const hasValidContact = updates.emergencyContacts.some((contact: any) => 
        contact && contact.name && (contact.phone || contact.email)
      );
      
      if (!hasValidContact && updates.emergencyContacts.length > 0) {
        return NextResponse.json(
          { success: false, message: 'At least one emergency contact must have a name and either a phone number or email' },
          { status: 400 }
        );
      }
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        specialization: updatedUser.specialization,
        contactEmail: updatedUser.contactEmail,
        phoneNumber: updatedUser.phoneNumber,
        profileImage: updatedUser.profileImage,
        emergencyContacts: updatedUser.emergencyContacts,
        createdAt: updatedUser.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update profile',
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 