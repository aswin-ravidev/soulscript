import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { JournalEntry } from '@/lib/models/JournalEntry';
import { withAuth } from '@/lib/auth';
import mongoose from 'mongoose';
import { predictMentalHealthClass } from '@/lib/ml-utils';
import { sendSuicidalAlert, checkRecentEntriesAndAlert } from '@/lib/services/alert-service';

// Helper function to get random sentiment for now (fallback only)
function getRandomSentiment() {
  const sentiments = ['Anxiety', 'Bipolar', 'Depression', 'Normal', 'Personality disorder', 'Stress', 'Suicidal'];
  return sentiments[Math.floor(Math.random() * sentiments.length)];
}

// GET all journal entries for a user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    // Connect to database
    await connectDB();
    
    // Get entries for the authenticated user
    const entries = await JournalEntry.find({ userId: user._id })
      .sort({ date: -1 });
    
    return NextResponse.json({ success: true, entries }, { status: 200 });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch journal entries' },
      { status: 500 }
    );
  }
}

// POST create a new journal entry
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    // Connect to database
    await connectDB();
    
    // Get entry data from request
    const { title, content, mood, date } = await request.json();
    
    // Validate input
    if (!title || !content || !mood) {
      return NextResponse.json(
        { success: false, message: 'Please provide title, content, and mood' },
        { status: 400 }
      );
    }
    
    // Use sentiment analysis to determine mental health class
    let mentalHealthClass;
    let confidence = 0;
    try {
      // Get sentiment prediction from model
      console.log('Getting sentiment prediction for journal entry...');
      const prediction = await predictMentalHealthClass(content);
      
      if (prediction.success && prediction.mentalHealthClass) {
        mentalHealthClass = prediction.mentalHealthClass;
        confidence = prediction.confidence || 0;
        console.log('Using sentiment prediction:', mentalHealthClass, 'confidence:', prediction.confidence);
      } else {
        // Fallback to random if prediction failed
        mentalHealthClass = getRandomSentiment();
        console.log('Sentiment prediction failed, using random fallback:', mentalHealthClass);
      }
    } catch (error) {
      // Fallback to random if there was an error
      console.error('Error getting sentiment prediction:', error);
      mentalHealthClass = getRandomSentiment();
      console.log('Error in sentiment prediction, using random fallback:', mentalHealthClass);
    }
    
    // Create journal entry
    const entry = await JournalEntry.create({
      title,
      content,
      mood,
      date: date || new Date(),
      mentalHealthClass,
      confidence,
      userId: new mongoose.Types.ObjectId(user._id),
    });
    
    // Handle emergency alerts for suicidal content
    if (mentalHealthClass === 'Suicidal') {
      console.log('Suicidal content detected, sending emergency alerts');
      // Send async - don't wait for alerts to complete
      sendSuicidalAlert(user._id, entry).catch(err => {
        console.error('Error sending suicidal alert:', err);
      });
    }
    
    // Check recent entry patterns
    checkRecentEntriesAndAlert(user._id).catch(err => {
      console.error('Error checking recent entry patterns:', err);
    });
    
    return NextResponse.json(
      { success: true, message: 'Journal entry created', entry },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create journal entry' },
      { status: 500 }
    );
  }
} 