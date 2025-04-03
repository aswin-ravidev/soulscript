import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { EmergencyContact } from '@/lib/models/EmergencyContact';
import { withAuth } from '@/lib/auth';

// GET all emergency contacts for a user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }

    // Connect to database
    await connectDB();

    // Get emergency contacts for the user
    const contacts = await EmergencyContact.find({ userId: user._id });
    
    return NextResponse.json({ success: true, contacts }, { status: 200 });
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch emergency contacts' },
      { status: 500 }
    );
  }
}

// POST create a new emergency contact
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }

    // Connect to database
    await connectDB();

    // Get contact data from request
    const { contactName, phoneNumber, email: rawEmail, relationship } = await request.json();
    let email = rawEmail;

    // Validate required fields
    if (!contactName || !relationship) {
      return NextResponse.json(
        { success: false, message: 'Please provide contact name and relationship' },
        { status: 400 }
      );
    }

    // Validate and format email if provided
    if (email) {
      // If email doesn't contain @, assume it's a Gmail address
      if (!email.includes('@')) {
        email = `${email}@gmail.com`;
      }

      // Validate email format
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: 'Please provide a valid email address' },
          { status: 400 }
        );
      }
    }

    // Create emergency contact
    const contact = await EmergencyContact.create({
      userId: user._id,
      contactName,
      phoneNumber,
      email,
      relationship
    });

    return NextResponse.json(
      { success: true, contact, message: 'Emergency contact created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating emergency contact:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create emergency contact' },
      { status: 500 }
    );
  }
}

// DELETE remove an emergency contact
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }

    // Connect to database
    await connectDB();

    // Get contact ID from URL
    const contactId = request.nextUrl.searchParams.get('id');
    if (!contactId) {
      return NextResponse.json(
        { success: false, message: 'Contact ID is required' },
        { status: 400 }
      );
    }

    // Delete the contact
    const result = await EmergencyContact.deleteOne({
      _id: contactId,
      userId: user._id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Emergency contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Emergency contact deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete emergency contact' },
      { status: 500 }
    );
  }
}