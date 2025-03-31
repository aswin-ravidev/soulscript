import { NextRequest, NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import mongoose from 'mongoose';
import { Message } from '@/lib/models/Message';

// Define ConnectionRequest schema if not already defined in models
let ConnectionRequest: mongoose.Model<any>;

try {
  // Try to get the model if it's already registered
  ConnectionRequest = mongoose.model('ConnectionRequest');
} catch (error) {
  // Define schema and create model if not already registered
  const connectionRequestSchema = new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    concerns: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  ConnectionRequest = mongoose.model('ConnectionRequest', connectionRequestSchema);
}

// Helper function to initialize messaging between user and therapist
async function initializeMessaging(userId: string, therapistId: string) {
  try {
    console.log(`Initializing messaging between user ${userId} and therapist ${therapistId}`);
    
    // Check if a message already exists between these users
    const existingMessage = await Message.findOne({
      $or: [
        { sender: userId, receiver: therapistId },
        { sender: therapistId, receiver: userId }
      ]
    });

    console.log("Existing message check result:", existingMessage ? "Found" : "Not found");

    // If no message exists, create a welcome message from therapist to user
    if (!existingMessage) {
      console.log("Creating welcome message from therapist to user");
      
      // Verify both user and therapist exist
      const user = await User.findById(userId);
      const therapist = await User.findById(therapistId);
      
      if (!user || !therapist) {
        console.error(`User or therapist not found. User: ${!!user}, Therapist: ${!!therapist}`);
        return;
      }
      
      console.log(`Creating message: From ${therapist.name} (${therapistId}) to ${user.name} (${userId})`);
      
      const welcomeMessage = new Message({
        sender: therapistId,
        receiver: userId,
        content: "Welcome! I'm here to help. Feel free to message me with any questions or to schedule an appointment.",
        read: false,
        createdAt: new Date()
      });

      await welcomeMessage.save();
      console.log('Welcome message created successfully with ID:', welcomeMessage._id);
      
      // Create a second message in the opposite direction to ensure the conversation appears for both users
      const acknowledgementMessage = new Message({
        sender: userId,
        receiver: therapistId,
        content: "Thanks for connecting! I look forward to working with you.",
        read: false,
        createdAt: new Date()
      });
      
      await acknowledgementMessage.save();
      console.log('Acknowledgement message created successfully with ID:', acknowledgementMessage._id);
    } else {
      console.log('Existing message found, skipping welcome message creation');
    }
  } catch (error) {
    console.error('Error initializing messaging:', error);
  }
}

// GET - get connection requests for a therapist
export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    
    // Get therapistId from URL params
    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapistId');
    const userId = searchParams.get('userId');
    
    if (therapistId) {
      // Get all connection requests for this therapist
      const requests = await ConnectionRequest.find({ therapist: therapistId })
        .populate('user', 'name email profileImage')
        .sort({ createdAt: -1 })
        .lean();
      
      return NextResponse.json(requests);
    } 
    else if (userId) {
      // Get all connection requests by this user
      const requests = await ConnectionRequest.find({ user: userId })
        .populate('therapist', 'name email specialization profileImage')
        .sort({ createdAt: -1 })
        .lean();
      
      return NextResponse.json(requests);
    }
    else {
      return NextResponse.json(
        { message: 'Missing therapistId or userId parameter' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    return NextResponse.json(
      { message: 'Failed to fetch connection requests' },
      { status: 500 }
    );
  }
}

// POST - create a new connection request
export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    
    const body = await request.json();
    const { userId, therapistId, concerns = '' } = body;
    
    if (!userId || !therapistId) {
      return NextResponse.json(
        { message: 'Missing userId or therapistId' },
        { status: 400 }
      );
    }
    
    // Check if both users exist
    const user = await User.findById(userId);
    const therapist = await User.findById(therapistId);
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    if (!therapist || therapist.role !== 'therapist') {
      return NextResponse.json(
        { message: 'Therapist not found' },
        { status: 404 }
      );
    }
    
    // Check if a request already exists
    const existingRequest = await ConnectionRequest.findOne({
      user: userId,
      therapist: therapistId,
      status: { $in: ['pending', 'accepted'] }
    });
    
    if (existingRequest) {
      return NextResponse.json(
        { 
          message: 'A connection request already exists', 
          status: existingRequest.status,
          requestId: existingRequest._id
        },
        { status: 409 }
      );
    }
    
    // Create new connection request
    const newRequest = new ConnectionRequest({
      user: userId,
      therapist: therapistId,
      concerns,
      status: 'pending'
    });
    
    await newRequest.save();
    
    return NextResponse.json({
      message: 'Connection request sent successfully',
      requestId: newRequest._id,
      status: 'pending'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating connection request:', error);
    return NextResponse.json(
      { message: 'Failed to create connection request' },
      { status: 500 }
    );
  }
}

// PATCH - update a connection request (accept/reject)
export async function PATCH(request: NextRequest) {
  try {
    await connectMongo();
    
    const body = await request.json();
    const { requestId, status } = body;
    
    if (!requestId || !status || !['pending', 'accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    
    const connectionRequest = await ConnectionRequest.findById(requestId);
    
    if (!connectionRequest) {
      return NextResponse.json(
        { message: 'Connection request not found' },
        { status: 404 }
      );
    }
    
    // Update the status
    connectionRequest.status = status;
    await connectionRequest.save();
    
    // If the request was accepted, initialize messaging between the user and therapist
    if (status === 'accepted') {
      await initializeMessaging(connectionRequest.user.toString(), connectionRequest.therapist.toString());
    }
    
    return NextResponse.json({
      message: `Connection request ${status}`,
      request: connectionRequest
    });
  } catch (error) {
    console.error('Error updating connection request:', error);
    return NextResponse.json(
      { message: 'Failed to update connection request' },
      { status: 500 }
    );
  }
} 