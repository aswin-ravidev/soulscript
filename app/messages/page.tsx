"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

// Types
interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  _id: string;
  otherUser: User;
  latestMessage: {
    content: string;
    createdAt: string;
    read: boolean;
  };
  unreadCount: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Get current user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setCurrentUser(user)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
  }, [])

  // Check URL params for direct conversation selection
  useEffect(() => {
    if (currentUser) {
      // Check if there's a therapistId or userId in the URL
      const urlParams = new URLSearchParams(window.location.search);
      const therapistId = urlParams.get('therapistId');
      const userId = urlParams.get('userId');
      
      if (therapistId || userId) {
        const directUserId = therapistId || userId;
        console.log("Direct messaging to user:", directUserId);
        
        // First get or create the conversation with this user
        fetch(`/api/messages?otherUserId=${directUserId}`)
          .then(response => response.json())
          .then(data => {
            console.log("Direct conversation initialization:", data);
            
            // Refresh all conversations to include the new one
            return fetchConversations();
          })
          .then(fetchedConversations => {
            if (!fetchedConversations || fetchedConversations.length === 0) {
              console.log("No conversations found after initialization");
              return;
            }
            
            console.log("Finding conversation with user ID:", directUserId);
            
            // Find the conversation with the target user
            const targetConversation = fetchedConversations.find((conv: Conversation) => 
              (conv.otherUser._id && conv.otherUser._id.toString() === directUserId) || 
              (conv.otherUser.id && conv.otherUser.id.toString() === directUserId)
            );
            
            if (targetConversation) {
              console.log("Found target conversation:", targetConversation);
              setActiveConversation(targetConversation);
              
              // Fetch messages for this conversation
              fetchMessages(targetConversation._id);
            } else {
              console.log("Could not find conversation with user:", directUserId);
              console.log("Available conversations:", fetchedConversations);
              
              // Try with a delay in case there's a timing issue
              setTimeout(() => {
                fetchConversations().then(newConversations => {
                  if (!newConversations || newConversations.length === 0) return;
                  
                  const conv = newConversations.find((c: Conversation) => 
                    (c.otherUser._id && c.otherUser._id.toString() === directUserId) || 
                    (c.otherUser.id && c.otherUser.id.toString() === directUserId)
                  );
                  
                  if (conv) {
                    console.log("Found conversation after delay:", conv);
                    setActiveConversation(conv);
                    fetchMessages(conv._id);
                  }
                });
              }, 1500);
            }
          })
          .catch(error => {
            console.error("Error handling direct conversation:", error);
          });
      }
    }
  }, [currentUser]);

  // Fetch conversations when user is loaded
  useEffect(() => {
    if (currentUser) {
      fetchConversations()
    }
  }, [currentUser])

  // Add visibility change handler to refresh data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        console.log('Tab became visible, refreshing messages data')
        fetchConversations()
        if (activeConversation) {
          fetchMessages(activeConversation._id)
        }
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentUser, activeConversation])

  // Fetch messages when an active conversation is selected
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id)
    }
  }, [activeConversation])

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Fetch all conversations
  const fetchConversations = async () => {
    setIsLoadingConversations(true)
    try {
      const response = await fetch('/api/messages')
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }
      
      const data = await response.json()
      console.log("Fetched conversations data:", data)
      
      if (data.success) {
        // Add debugging logs for profile images
        if (data.conversations && data.conversations.length > 0) {
          console.log("First conversation other user:", data.conversations[0].otherUser)
          console.log("Profile image exists:", !!data.conversations[0].otherUser.profileImage)
        }
        
        setConversations(data.conversations)
        
        // Set the first conversation as active if there are any and no active conversation is selected
        if (data.conversations.length > 0 && !activeConversation) {
          setActiveConversation(data.conversations[0])
        }
        
        return data.conversations
      }
      return []
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast({
        title: "Error",
        description: "Failed to load conversations. Please try again.",
        variant: "destructive"
      })
      return []
    } finally {
      setIsLoadingConversations(false)
    }
  }

  // Fetch messages for a specific conversation
  const fetchMessages = async (otherUserId: string) => {
    setIsLoadingMessages(true)
    try {
      const response = await fetch(`/api/messages?otherUserId=${otherUserId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      
      const data = await response.json()
      
      if (data.success) {
        console.log("Fetched messages:", data.messages);
        if (data.messages.length > 0) {
          console.log("First message:", data.messages[0]);
          const hasProfileImg = data.messages[0].sender?.profileImage || data.messages[0].receiver?.profileImage;
          console.log("Message has profile image:", hasProfileImg);
        }
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // Set active conversation and force a profile image refresh
  const selectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    
    // Force a refresh of conversations to ensure profile images are loaded
    if (currentUser) {
      console.log("Refreshing conversations after selection");
      setTimeout(() => fetchConversations(), 100);
    }
  }

  // Send a new message
  const handleSendMessage = async () => {
    if (!activeConversation || newMessage.trim() === "") return
    
    setIsSendingMessage(true)
    try {
      console.log("Sending message to:", activeConversation.otherUser);
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: activeConversation.otherUser._id || activeConversation.otherUser.id,
          content: newMessage
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      const data = await response.json()
      console.log("Message sent response:", data);
      
      if (data.success) {
        // Make sure the sent message has the proper sender data for UI display
        const messageWithSender = data.data;
        
        // If the API response doesn't have proper sender info, add it
        if (!messageWithSender.sender || (!messageWithSender.sender.id && !messageWithSender.sender._id)) {
          messageWithSender.sender = {
            id: currentUser.id,
            _id: currentUser._id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role,
            profileImage: currentUser.profileImage
          };
        }
        
        // Add the new message to the messages list
        setMessages(prev => [...prev, messageWithSender])
        
        // Update the conversation with the latest message
        setConversations(prev => 
          prev.map(conv => 
            conv._id === activeConversation._id
              ? {
                  ...conv,
                  latestMessage: {
                    content: newMessage,
                    createdAt: new Date().toISOString(),
                    read: false
                  }
                }
              : conv
          )
        )
        
        // Clear the input field
        setNewMessage("")
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  // Format timestamp for messages
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Same day - show time
    if (date.toDateString() === now.toDateString()) {
      return format(date, "h:mm a");
    }
    
    // This week - show day
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 7) {
      return format(date, "EEE");
    }
    
    // Older - show date
    return format(date, "MMM d");
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 md:px-6 max-w-screen-xl h-[calc(100vh-3.5rem)] py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            {currentUser?.role === "therapist" 
              ? "Communicate with your patients securely" 
              : "Communicate with your therapist securely"}
          </p>
        </div>

        <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  <div className="space-y-1 p-2">
                  {isLoadingConversations ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      <p>No conversations yet.</p>
                      <p className="mt-1">
                        {currentUser?.role === "therapist" 
                          ? "Connect with patients to start messaging." 
                          : "Connect with a therapist to start messaging."}
                      </p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <button
                        key={conversation._id}
                        className={`flex w-full items-center gap-3 rounded-lg p-2 text-left ${
                          activeConversation?._id === conversation._id ? "bg-muted" : "hover:bg-muted/50"
                        }`}
                        onClick={() => selectConversation(conversation)}
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarImage 
                              src={conversation.otherUser.profileImage || "/placeholder-user.jpg"} 
                              alt={conversation.otherUser.name}
                              onError={(e) => {
                                console.log("Image load error:", e);
                                (e.target as HTMLImageElement).src = "/placeholder-user.jpg";
                              }}
                            />
                            <AvatarFallback>
                              {conversation.otherUser.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.unreadCount > 0 && (
                            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-primary"></span>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{conversation.otherUser.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {conversation.latestMessage?.createdAt 
                                ? formatMessageTime(conversation.latestMessage.createdAt)
                                : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {conversation.otherUser.role === "therapist" ? "Therapist" : "Patient"}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {conversation.latestMessage?.content || "No messages yet"}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                  </div>
                </ScrollArea>
            </CardContent>
          </Card>

          <Card className="flex flex-col md:col-span-2">
            {activeConversation ? (
              <>
            <CardHeader className="border-b p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                      <AvatarImage 
                        src={activeConversation.otherUser.profileImage || "/placeholder-user.jpg"} 
                        alt={activeConversation.otherUser.name}
                        onError={(e) => {
                          console.log("Active conversation image load error:", e);
                          (e.target as HTMLImageElement).src = "/placeholder-user.jpg";
                        }}
                      />
                  <AvatarFallback>
                        {activeConversation.otherUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                      <CardTitle className="text-base">{activeConversation.otherUser.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {activeConversation.otherUser.role === "therapist" ? "Therapist" : "Patient"}
                      </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[calc(100vh-26rem)]">
                    {isLoadingMessages ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
                        <p className="text-muted-foreground">No messages yet.</p>
                        <p className="text-sm text-muted-foreground">Send a message to start the conversation.</p>
                      </div>
                    ) : (
                <div className="flex flex-col gap-3 p-4">
                        {messages.map((message) => {
                          // Check if current user is the sender using both id and _id
                          const isCurrentUser = 
                            (currentUser?.id && message.sender.id === currentUser.id) || 
                            (currentUser?.id && message.sender._id === currentUser.id) ||
                            (currentUser?._id && message.sender.id === currentUser._id) ||
                            (currentUser?._id && message.sender._id === currentUser._id);
                            
                          return (
                            <div
                              key={message._id}
                              className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                                  isCurrentUser
                                    ? "bg-primary text-primary-foreground ml-auto"
                                    : "bg-muted mr-auto"
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <p className={`mt-1 text-right text-xs ${isCurrentUser ? "opacity-70" : "text-muted-foreground"}`}>
                                  {format(new Date(message.createdAt), "h:mm a")}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
              </ScrollArea>
            </CardContent>
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                      disabled={isSendingMessage}
                />
                    <Button type="submit" size="icon" disabled={isSendingMessage || newMessage.trim() === ""}>
                      {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <h3 className="mb-2 text-lg font-medium">No Conversation Selected</h3>
                <p className="text-muted-foreground">
                  {conversations.length > 0
                    ? "Select a conversation to start messaging"
                    : currentUser?.role === "therapist"
                    ? "Connect with patients to start messaging"
                    : "Connect with a therapist to start messaging"}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

