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
      .populate('sender', 'name email role profileImage')
      .populate('receiver', 'name email role profileImage');
      
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
        
        // Also get the current user with full details
        const currentUser = await User.findById(user.id);
        if (!currentUser) {
          return NextResponse.json(
            { success: false, message: 'Current user not found' },
            { status: 404 }
          );
        }
        
        console.log("Other user found:", {
          id: otherUser._id,
          name: otherUser.name,
          role: otherUser.role,
          profileImage: otherUser.profileImage
        });
        
        console.log("Current user found:", {
          id: currentUser._id,
          name: currentUser.name,
          role: currentUser.role,
          profileImage: currentUser.profileImage
        });
        
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
        .populate('sender', 'name email role profileImage')
        .populate('receiver', 'name email role profileImage');
        
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
      // Get all conversations for the current user - using a different approach
      // First, find all messages where the user is either sender or receiver
      const allMessages = await Message.find({
        $or: [
          { sender: user._id },
          { receiver: user._id }
        ]
      })
      .sort({ createdAt: -1 })
      .populate('sender', 'name email role profileImage')
      .populate('receiver', 'name email role profileImage')
      .lean();
      
      console.log(`Found ${allMessages.length} total messages for user ${user._id}`);
      
      // Process messages into conversations
      const conversationsMap = new Map();
      
      for (const message of allMessages) {
        // Determine if the other user is the sender or receiver
        const isUserSender = message.sender._id.toString() === user._id.toString() || 
                            message.sender.id?.toString() === user._id.toString();
        
        const otherUser = isUserSender ? message.receiver : message.sender;
        const otherUserId = otherUser._id.toString();
        
        // Skip if we've already seen this conversation (we only want the latest message)
        if (conversationsMap.has(otherUserId)) continue;
        
        // Create a conversation entry with the other user and latest message
        conversationsMap.set(otherUserId, {
          _id: otherUserId,
          otherUser: {
            _id: otherUser._id,
            id: otherUser._id.toString(),
            name: otherUser.name,
            email: otherUser.email,
            role: otherUser.role,
            profileImage: otherUser.profileImage || '/placeholder-user.jpg'
          },
          latestMessage: {
            content: message.content,
            createdAt: message.createdAt,
            read: message.read
          },
          unreadCount: 0 // Will count below
        });
      }
      
      // Count unread messages for each conversation
      const conversations = Array.from(conversationsMap.values());
      
      for (const conversation of conversations) {
        const unreadCount = await Message.countDocuments({
          sender: conversation._id,
          receiver: user._id,
          read: false
        });
        
        conversation.unreadCount = unreadCount;
      }
      
      console.log(`Processed into ${conversations.length} conversations`);
      if (conversations.length > 0) {
        console.log("First conversation:", {
          otherUser: conversations[0].otherUser,
          hasProfileImage: !!conversations[0].otherUser.profileImage,
          profileImagePath: conversations[0].otherUser.profileImage
        });
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
      .populate('sender', 'name email role profileImage')
      .populate('receiver', 'name email role profileImage');
    
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