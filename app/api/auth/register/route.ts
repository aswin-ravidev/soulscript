import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models/User';

export async function POST(request: NextRequest) {
  console.log('Registration endpoint called');
  
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully');
    
    // Get registration data from request
    const data = await request.json();
    console.log('Registration data received:', { ...data, password: '[REDACTED]' });
    
    // Extract and validate required fields
    const { name, email, password } = data;
    const role = data.role || 'user';
    const specialization = data.specialization || '';
    const bio = data.bio || '';
    
    if (!name || !email || !password) {
      console.log('Validation error: Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Please provide name, email, and password' },
        { status: 400 }
      );
    }
    
    // Check if email already exists
    console.log('Checking if email exists:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('Email already registered:', email);
      return NextResponse.json(
        { success: false, message: 'Email already registered' },
        { status: 400 }
      );
    }
    
    // Validate therapist data
    if (role === 'therapist') {
      console.log('Validating therapist data, specialization:', specialization);
      
      if (!specialization || specialization.trim() === '') {
        console.log('Missing or empty specialization for therapist role');
        return NextResponse.json(
          { success: false, message: 'Therapists must provide a specialization' },
          { status: 400 }
        );
      }
      
      if (specialization.trim().length < 2) {
        console.log('Specialization too short for therapist role');
        return NextResponse.json(
          { success: false, message: 'Specialization must be at least 2 characters' },
          { status: 400 }
        );
      }
    }
    
    // Create user object
    const userData = {
      name,
      email,
      password,
      role,
      ...(role === 'therapist' ? { specialization } : {}),
      ...(bio ? { bio } : {})
    };
    
    console.log('Creating user with data:', { ...userData, password: '[REDACTED]' });
    
    try {
      // Create the user
      const user = await User.create(userData);
      console.log('User created successfully with ID:', user._id.toString());
      
      // Return success response
      return NextResponse.json(
        { 
          success: true, 
          message: 'Registration successful', 
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
          } 
        },
        { status: 201 }
      );
    } catch (createError: any) {
      console.error('Error creating user:', createError);
      
      // Handle validation errors
      if (createError.name === 'ValidationError') {
        const validationErrors = Object.values(createError.errors).map((err: any) => err.message);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Validation error',
            errors: validationErrors
          },
          { status: 400 }
        );
      }
      
      // Handle duplicate key errors
      if (createError.code === 11000) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Email already exists'
          },
          { status: 400 }
        );
      }
      
      // Handle other errors
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to create user',
          error: createError.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred during registration',
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 