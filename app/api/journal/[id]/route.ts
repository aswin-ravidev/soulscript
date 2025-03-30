import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { JournalEntry } from '@/lib/models/JournalEntry';
import { withAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// GET a specific journal entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user;
    }

    // Connect to database
    await connectDB();

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid journal entry ID' },
        { status: 400 }
      );
    }

    // Find the entry
    const entry = await JournalEntry.findById(params.id);

    // Check if entry exists
    if (!entry) {
      return NextResponse.json(
        { success: false, message: 'Journal entry not found' },
        { status: 404 }
      );
    }

    // Check if the entry belongs to the user
    if (entry.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to access this entry' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, entry }, { status: 200 });
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch journal entry' },
      { status: 500 }
    );
  }
}

// PUT (update) a journal entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user;
    }

    // Connect to database
    await connectDB();

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid journal entry ID' },
        { status: 400 }
      );
    }

    // Get update data
    const updateData = await request.json();

    // Find the entry
    const entry = await JournalEntry.findById(params.id);

    // Check if entry exists
    if (!entry) {
      return NextResponse.json(
        { success: false, message: 'Journal entry not found' },
        { status: 404 }
      );
    }

    // Check if the entry belongs to the user
    if (entry.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update this entry' },
        { status: 403 }
      );
    }

    // Update the entry
    const updatedEntry = await JournalEntry.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      { success: true, entry: updatedEntry },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating journal entry:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update journal entry' },
      { status: 500 }
    );
  }
}

// DELETE a journal entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user;
    }

    // Connect to database
    await connectDB();

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid journal entry ID' },
        { status: 400 }
      );
    }

    // Find the entry
    const entry = await JournalEntry.findById(params.id);

    // Check if entry exists
    if (!entry) {
      return NextResponse.json(
        { success: false, message: 'Journal entry not found' },
        { status: 404 }
      );
    }

    // Check if the entry belongs to the user
    if (entry.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to delete this entry' },
        { status: 403 }
      );
    }

    // Delete the entry
    await JournalEntry.findByIdAndDelete(params.id);

    return NextResponse.json(
      { success: true, message: 'Journal entry deleted' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete journal entry' },
      { status: 500 }
    );
  }
} 