import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Message } from '@/lib/models/Message';
import { User } from '@/lib/models/User';
import { withAuth } from '@/lib/auth';

// GET - Get conversation between current user and another user, or get all conversations
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    console.log("Messages API - Current user:", { id: user.id, _id: user._id });
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('otherUserId');
    
    if (otherUserId) {
      console.log("Getting conversation with other user ID:", otherUserId);
      
      // Get conversation between current user and another user
      const messages = await Message.find({
        $or: [
          { sender: user.id, receiver: otherUserId },
          { sender: otherUserId, receiver: user.id }
        ]
      })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');
      
      console.log(`Found ${messages.length} messages with user ${otherUserId}`);
      
      // If no messages exist, create initial welcome messages
      if (messages.length === 0) {
        console.log(`No existing messages found. Creating initial messages between ${user.id} and ${otherUserId}`);
        
        // Find the other user
        const otherUser = await User.findById(otherUserId);
        if (!otherUser) {
          return NextResponse.json(
            { success: false, message: 'Other user not found' },
            { status: 404 }
          );
        }
        
        // Create welcome messages based on user roles
        const systemMessage = new Message({
          sender: otherUser.role === 'therapist' ? otherUserId : user.id,
          receiver: otherUser.role === 'therapist' ? user.id : otherUserId,
          content: otherUser.role === 'therapist' 
            ? "Welcome! I'm here to help. Feel free to message me with any questions or to schedule an appointment."
            : "Hello! I'm here to assist you. Let me know if you have any questions.",
          read: false,
          createdAt: new Date()
        });
        
        await systemMessage.save();
        console.log("Created initial message:", systemMessage._id);
        
        // Reload messages
        const updatedMessages = await Message.find({
          $or: [
            { sender: user.id, receiver: otherUserId },
            { sender: otherUserId, receiver: user.id }
          ]
        })
        .sort({ createdAt: 1 })
        .populate('sender', 'name email role')
        .populate('receiver', 'name email role');
        
        console.log(`Now have ${updatedMessages.length} messages after initialization`);
        
        // Mark messages as read if the current user is the receiver
        await Message.updateMany(
          { sender: otherUserId, receiver: user.id, read: false },
          { read: true }
        );
        
        return NextResponse.json({ success: true, messages: updatedMessages });
      }
      
      // Mark messages as read if the current user is the receiver
      await Message.updateMany(
        { sender: otherUserId, receiver: user.id, read: false },
        { read: true }
      );
      
      return NextResponse.json({ success: true, messages });
    } else {
      // Get all conversations for the current user
      // This query gets the latest message for each unique conversation partner
      const conversations = await Message.aggregate([
        {
          $match: {
            $or: [
              { sender: user._id },
              { receiver: user._id }
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$sender", user._id] },
                "$receiver",
                "$sender"
              ]
            },
            latestMessage: { $first: "$$ROOT" }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "otherUser"
          }
        },
        {
          $unwind: "$otherUser"
        },
        {
          $project: {
            _id: 1,
            otherUser: {
              _id: 1,
              name: 1,
              email: 1,
              role: 1
            },
            latestMessage: 1,
            unreadCount: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$latestMessage.receiver", user._id] },
                    { $eq: ["$latestMessage.read", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      ]);
      
      // For each conversation, get the unread count
      for (const conversation of conversations) {
        const unreadCount = await Message.countDocuments({
          sender: conversation._id,
          receiver: user._id,
          read: false
        });
        
        conversation.unreadCount = unreadCount;
      }
      
      return NextResponse.json({ success: true, conversations });
    }
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve messages' },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    await connectDB();
    
    const { receiverId, content } = await request.json();
    
    if (!receiverId || !content) {
      return NextResponse.json(
        { success: false, message: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }
    
    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return NextResponse.json(
        { success: false, message: 'Receiver not found' },
        { status: 404 }
      );
    }
    
    // Create new message
    const newMessage = new Message({
      sender: user.id,
      receiver: receiverId,
      content,
      read: false,
      createdAt: new Date()
    });
    
    await newMessage.save();
    
    // Populate sender and receiver
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role');
    
    return NextResponse.json(
      { success: true, message: 'Message sent successfully', data: populatedMessage },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// PATCH - Mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    await connectDB();
    
    const { senderId } = await request.json();
    
    if (!senderId) {
      return NextResponse.json(
        { success: false, message: 'Sender ID is required' },
        { status: 400 }
      );
    }
    
    // Mark all messages from sender to current user as read
    const result = await Message.updateMany(
      { sender: senderId, receiver: user.id, read: false },
      { read: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Messages marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
} 