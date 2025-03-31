import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { withAuth } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';
import { mkdir } from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    // Connect to database
    await connectDB();
    
    // Process the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'File type not supported. Please upload a JPG, PNG, or GIF image.' },
        { status: 400 }
      );
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }
    
    // Create a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    
    // Ensure the uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      console.error('Error creating uploads directory:', err);
    }
    
    // Save the file
    const filePath = path.join(uploadsDir, fileName);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    try {
      await writeFile(filePath, fileBuffer);
      console.log(`File saved to ${filePath}`);
    } catch (err) {
      console.error('Error saving file:', err);
      return NextResponse.json(
        { success: false, message: 'Failed to save file' },
        { status: 500 }
      );
    }
    
    // Update user profile with new image URL
    const imageUrl = `/uploads/${fileName}`;
    
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { profileImage: imageUrl },
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
      message: 'Profile picture updated successfully',
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
    console.error('Error uploading profile picture:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to upload profile picture',
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 