import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { JournalEntry } from '@/lib/models/JournalEntry';
import { User } from '@/lib/models/User';
import { withAuth } from '@/lib/auth';
import mongoose from 'mongoose';

// GET journal analytics for a specific patient
export async function GET(request: NextRequest) {
  try {
    // Authenticate user (must be a therapist)
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    // Verify user is a therapist
    if (user.role !== 'therapist') {
      return NextResponse.json(
        { success: false, message: 'Only therapists can access patient analytics' },
        { status: 403 }
      );
    }
    
    // Connect to database
    await connectDB();
    
    // Get patient ID from query
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    if (!patientId) {
      return NextResponse.json(
        { success: false, message: 'Patient ID is required' },
        { status: 400 }
      );
    }
    
    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { success: false, message: 'Patient not found' },
        { status: 404 }
      );
    }
    
    // Get journal entries for the patient
    const journalEntries = await JournalEntry.find({ userId: patientId })
      .sort({ date: -1 });
    
    // Calculate analytics
    const analytics = {
      totalEntries: journalEntries.length,
      recentEntries: journalEntries.slice(0, 5),
      moodDistribution: calculateMoodDistribution(journalEntries),
      mentalHealthDistribution: calculateMentalHealthDistribution(journalEntries),
      moodTrend: calculateMoodTrend(journalEntries),
      yearlyActivity: calculateYearlyActivity(journalEntries),
    };
    
    return NextResponse.json({ success: true, analytics }, { status: 200 });
  } catch (error) {
    console.error('Error fetching patient analytics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch patient analytics' },
      { status: 500 }
    );
  }
}

// Helper functions for analytics calculations

function calculateMoodDistribution(entries: any[]) {
  const moodCounts: Record<string, number> = {};
  
  entries.forEach(entry => {
    const mood = entry.mood;
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  });
  
  // Convert to array format for charts
  const distribution = Object.keys(moodCounts).map(mood => ({
    name: mood,
    value: moodCounts[mood],
    color: getMoodColor(mood)
  }));
  
  return distribution;
}

function calculateMentalHealthDistribution(entries: any[]) {
  const classCounts: Record<string, number> = {};
  
  entries.forEach(entry => {
    const mentalHealthClass = entry.mentalHealthClass;
    classCounts[mentalHealthClass] = (classCounts[mentalHealthClass] || 0) + 1;
  });
  
  // Convert to array format for charts
  const distribution = Object.keys(classCounts).map(cls => ({
    name: cls,
    value: classCounts[cls],
    color: getSentimentColor(cls)
  }));
  
  return distribution;
}

function calculateMoodTrend(entries: any[]) {
  // Sort entries chronologically
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Get last 10 entries (or fewer if there aren't 10)
  const recentEntries = sortedEntries.slice(-10);
  
  return recentEntries.map(entry => ({
    date: new Date(entry.date).toLocaleDateString(),
    mood: entry.mood,
    mentalHealthClass: entry.mentalHealthClass
  }));
}

function calculateYearlyActivity(entries: any[]) {
  const currentYear = new Date().getFullYear();
  const monthlyCount = Array(12).fill(0);
  
  entries.forEach(entry => {
    const entryDate = new Date(entry.date);
    if (entryDate.getFullYear() === currentYear) {
      const month = entryDate.getMonth();
      monthlyCount[month]++;
    }
  });
  
  return {
    year: currentYear,
    months: monthlyCount
  };
}

// Helper function to get mood color
function getMoodColor(mood: string) {
  const colors: Record<string, string> = {
    "Happy": "#4caf50",
    "Sad": "#2196f3",
    "Angry": "#f44336",
    "Anxious": "#ff9800",
    "Calm": "#00bcd4",
    "Tired": "#9e9e9e",
    "Excited": "#ffeb3b",
    "Depressed": "#9c27b0",
    "Neutral": "#607d8b"
  };
  
  return colors[mood] || "#607d8b";
}

// Helper function to get sentiment color
function getSentimentColor(sentiment: string) {
  const colors: Record<string, string> = {
    "Anxiety": "#ff9800",
    "Bipolar": "#e91e63",
    "Depression": "#9c27b0",
    "Normal": "#4caf50",
    "Personality disorder": "#2196f3",
    "Stress": "#f44336",
    "Suicidal": "#6a1b9a"
  };
  
  return colors[sentiment] || "#9e9e9e";
} 