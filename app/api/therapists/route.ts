import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { User } from '@/lib/models/User';

interface TherapistDocument {
  _id: string;
  name: string;
  email: string;
  role: string;
  specialization?: string;
  bio?: string;
  profileImage?: string;
  createdAt?: Date;
}

export async function GET() {
  try {
    await connectMongo();
    
    // Find all users with role "therapist"
    const therapists = await User.find({ role: 'therapist' })
      .select('name email role specialization bio profileImage createdAt')
      .lean();
    
    if (!therapists || therapists.length === 0) {
      return NextResponse.json(
        { message: 'No therapists found' },
        { status: 404 }
      );
    }

    // Transform the data to include additional fields needed for the UI
    const formattedTherapists = therapists.map((therapist: any) => ({
      id: therapist._id?.toString(),
      name: therapist.name,
      specialty: therapist.specialization || 'General Therapy',
      experience: 'Available',
      rating: 4.8,
      reviews: Math.floor(Math.random() * 50) + 5, // Random number of reviews for demo
      availability: 'Mon, Wed, Fri',
      status: 'Available',
      bio: therapist.bio || `${therapist.name} is a registered therapist on SoulScript.`,
      image: therapist.profileImage || '/placeholder-user.jpg',
      email: therapist.email,
      member_since: therapist.createdAt ? new Date(therapist.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
    }));

    return NextResponse.json(formattedTherapists);
  } catch (error) {
    console.error('Error fetching therapists:', error);
    return NextResponse.json(
      { message: 'Failed to fetch therapists' },
      { status: 500 }
    );
  }
} 