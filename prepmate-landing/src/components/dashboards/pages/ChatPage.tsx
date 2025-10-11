import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { ScrollArea } from "../../ui/scroll-area";
import { Textarea } from "../../ui/textarea";
import { useToast } from "../../ui/toast";
import {
  Send,
  Check,
  CheckCheck,
  Eye,
  Plus,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Settings,
  MessageCircle,
  Clock,
  Wifi,
  WifiOff,
  Shield,
  Bell,
  BarChart3,
  X,
  Moon,
  Search,
  Phone,
  Video,
  MoreHorizontal,
  VolumeX,
  Volume2,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import io from "socket.io-client";
import { ReactionIcon, ReactionPicker } from "../../ui/reaction-icons";

interface Message {
  _id: string;
  senderId: {
    _id: string;
    name: string;
    profilePicture: string;
  };
  message: string;
  status: "sent" | "delivered" | "seen" | "pending";
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  reactions?: Array<{
    emoji: string;
    userId: string;
    userName: string;
  }>;
}

interface ChatRoom {
  _id: string;
  name?: string;
  type: "direct" | "group";
  participants: Array<{
    _id: string;
    name: string;
    profilePicture: string;
    isOnline: boolean;
    lastSeen?: string;
  }>;
  unreadCount: number;
  lastMessage?: {
    message: string;
    createdAt: string;
    senderId: {
      name: string;
    };
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  profilePicture: string;
  isOnline: boolean;
}

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { success, error: showError } = useToast();

  const [socket, setSocket] = useState<any>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [mutedRooms, setMutedRooms] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [showMutedRooms, setShowMutedRooms] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [isCurrentlyTyping, setIsCurrentlyTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(
    null
  );
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const [mentionedUsers, setMentionedUsers] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const showErrorRef = useRef(showError);

  // Update ref when showError changes
  useEffect(() => {
    showErrorRef.current = showError;
  }, [showError]);

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);

      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
        });
      }
    }
  }, []);

  // Load muted rooms from localStorage
  useEffect(() => {
    const savedMutedRooms = localStorage.getItem("mutedRooms");
    if (savedMutedRooms) {
      setMutedRooms(new Set(JSON.parse(savedMutedRooms)));
    }
  }, []);

  // Load blocked users from localStorage
  useEffect(() => {
    const savedBlockedUsers = localStorage.getItem("blockedUsers");
    if (savedBlockedUsers) {
      setBlockedUsers(new Set(JSON.parse(savedBlockedUsers)));
    }
  }, []);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      setIsCurrentlyTyping(false);
    };
  }, [typingTimeout]);

  // Save muted rooms to localStorage
  const saveMutedRooms = (mutedRooms: Set<string>) => {
    localStorage.setItem("mutedRooms", JSON.stringify([...mutedRooms]));
  };

  // Initialize socket
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, cannot connect to chat");
      return;
    }

    console.log("Connecting to chat socket...");
    const newSocket = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket", "polling"],
      timeout: 20000,
    });

    newSocket.on("connect", () => {
      console.log("Connected to chat socket");
      setIsConnected(true);
      sendPendingMessages();
    });

    newSocket.on("connect_error", (error: any) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
      showErrorRef.current(
        "Failed to connect to chat",
        "Please check your connection."
      );
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from chat socket");
      setIsConnected(false);
    });

    newSocket.on("new-message", (data: any) => {
      console.log("Received new message:", data);
      setMessages((prev) => [...prev, data.message]);
      scrollToBottom();

      // Show notification if not in current room
      if (data.message.roomId !== currentRoom?._id) {
        const senderName = data.message.senderId.name;
        const messagePreview =
          data.message.message.length > 50
            ? data.message.message.substring(0, 50) + "..."
            : data.message.message;

        showNotification(
          `New message from ${senderName}`,
          messagePreview,
          data.message.roomId
        );
      }
    });

    // Handle typing indicators
    newSocket.on("showTyping", (data: any) => {
      console.log("🔍 [SHOW TYPING] Received showTyping event:", data);
      const { senderId, senderName, roomId, receiverId, groupId } = data;

      // Get user ID from JWT token to match backend
      const token = localStorage.getItem("token");
      let currentUserId = user?.id;

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          currentUserId = payload.id || user?.id;
        } catch (error) {
          console.warn("Could not decode JWT token, using user.id");
        }
      }

      // Check if this typing event is for the current room
      const isCurrentRoom =
        (roomId && roomId === currentRoom?._id) ||
        (groupId && groupId === currentRoom?._id) ||
        (receiverId && receiverId === currentUserId);

      console.log("🔍 [SHOW TYPING] Room check:", {
        roomId,
        currentRoomId: currentRoom?._id,
        groupId,
        receiverId,
        userId: user?.id,
        currentUserId: currentUserId,
        isCurrentRoom,
        senderId,
        isNotSelf: senderId !== currentUserId,
      });

      if (isCurrentRoom && senderId !== currentUserId) {
        console.log("🔍 [SHOW TYPING] Adding typing user:", senderName);
        setTypingUsers((prev) => {
          if (!prev.includes(senderName)) {
            return [...prev, senderName];
          }
          return prev;
        });
      } else {
        console.log(
          "🔍 [SHOW TYPING] Ignoring event - not for current room or self"
        );
      }
    });

    newSocket.on("hideTyping", (data: any) => {
      console.log("🔍 [HIDE TYPING] Received hideTyping event:", data);
      const { senderId, senderName, roomId, receiverId, groupId } = data;

      // Get user ID from JWT token to match backend
      const token = localStorage.getItem("token");
      let currentUserId = user?.id;

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          currentUserId = payload.id || user?.id;
        } catch (error) {
          console.warn("Could not decode JWT token, using user.id");
        }
      }

      // Check if this typing event is for the current room
      const isCurrentRoom =
        (roomId && roomId === currentRoom?._id) ||
        (groupId && groupId === currentRoom?._id) ||
        (receiverId && receiverId === currentUserId);

      console.log("🔍 [HIDE TYPING] Room check:", {
        roomId,
        currentRoomId: currentRoom?._id,
        groupId,
        receiverId,
        userId: user?.id,
        currentUserId: currentUserId,
        isCurrentRoom,
        senderId,
        isNotSelf: senderId !== currentUserId,
      });

      if (isCurrentRoom && senderId !== currentUserId) {
        console.log("🔍 [HIDE TYPING] Removing typing user:", senderName);
        setTypingUsers((prev) => prev.filter((name) => name !== senderName));
      } else {
        console.log(
          "🔍 [HIDE TYPING] Ignoring event - not for current room or self"
        );
      }
    });

    // Legacy event handlers for backward compatibility
    newSocket.on("user-typing", (data: any) => {
      console.log("User typing (legacy):", data);
      if (data.roomId === currentRoom?._id && data.userId !== user?.id) {
        setTypingUsers((prev) => {
          if (data.isTyping && !prev.includes(data.userName)) {
            return [...prev, data.userName];
          } else if (!data.isTyping) {
            return prev.filter((name) => name !== data.userName);
          }
          return prev;
        });
      }
    });

    newSocket.on("user-stopped-typing", (data: any) => {
      console.log("User stopped typing (legacy):", data);
      if (data.roomId === currentRoom?._id && data.userId !== user?.id) {
        setTypingUsers((prev) => prev.filter((name) => name !== data.userName));
      }
    });

    newSocket.on("user-mentioned", (data: any) => {
      console.log("User mentioned:", data);
      if (data.mentionedUserId === user?.id) {
        showNotification(
          "You were mentioned!",
          `${data.mentionedBy} mentioned you in a message`,
          data.roomId
        );
        success("Mentioned!", "You were mentioned in a message");
      }
    });

    newSocket.on("error", (error: any) => {
      console.error("Socket error:", error);

      // Show specific error message if available
      if (error.message) {
        showErrorRef.current("Chat error", error.message);
      } else {
        showErrorRef.current("Chat error", "Please try again.");
      }
    });

    setSocket(newSocket);

    return () => {
      console.log("Disconnecting from chat socket");
      newSocket.disconnect();
    };
  }, []);

  // Fetch chat rooms and users
  useEffect(() => {
    fetchChatRooms();
    fetchUsers();
  }, []);

  // Handle roomId changes - set current room and load messages
  useEffect(() => {
    console.log(
      "roomId changed:",
      roomId,
      "chatRooms length:",
      chatRooms.length
    );
    if (roomId && chatRooms.length > 0) {
      const room = chatRooms.find((r: ChatRoom) => r._id === roomId);
      console.log("Setting current room:", room);
      setCurrentRoom(room || null);

      if (room) {
        setChatLoading(true);
        fetchMessages(roomId);
        markMessagesAsSeen(roomId);
      }
    } else if (roomId && chatRooms.length === 0) {
      // If we have roomId but no chatRooms yet, fetch them
      console.log("No chatRooms yet, fetching...");
      fetchChatRooms();
    }
  }, [roomId, chatRooms]);

  // Join chat room when current room changes
  useEffect(() => {
    if (currentRoom && socket && isConnected) {
      console.log("Joining chat room:", currentRoom._id);
      socket.emit("join-chat", currentRoom._id);
    }
    return () => {
      if (currentRoom && socket) {
        socket.emit("leave-chat", currentRoom._id);
      }
    };
  }, [currentRoom, socket, isConnected]);

  const sendPendingMessages = async () => {
    if (pendingMessages.length === 0 || !currentRoom) return;

    for (const message of pendingMessages) {
      try {
        if (socket) {
          socket.emit("send-message", {
            roomId: currentRoom._id,
            message: message.message,
            type: "text",
          });
        }
      } catch (error) {
        console.error("Failed to send pending message:", error);
      }
    }
    setPendingMessages([]);
  };

  const createDirectChat = async (targetUserId: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/chat/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          participantId: targetUserId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        navigate(`/chat/${data.data.chatRoom._id}`);
        setShowUserList(false);
        success("Chat created", "You can now start messaging!");
      } else {
        throw new Error("Failed to create chat");
      }
    } catch (error) {
      console.error("Error creating direct chat:", error);
      showErrorRef.current("Failed to create chat", "Please try again.");
    }
  };

  const toggleMuteRoom = (roomId: string) => {
    const newMutedRooms = new Set(mutedRooms);
    const room = chatRooms.find((r) => r._id === roomId);
    const roomName = room
      ? room.type === "group"
        ? room.name || "Group Chat"
        : room.participants.find((p) => p._id !== user?.id)?.name ||
          "Unknown User"
      : "Chat";

    if (newMutedRooms.has(roomId)) {
      newMutedRooms.delete(roomId);
      success("Room Unmuted", `${roomName} notifications are now enabled`);
    } else {
      newMutedRooms.add(roomId);
      success("Room Muted", `${roomName} notifications are now disabled`);
    }
    setMutedRooms(newMutedRooms);
    saveMutedRooms(newMutedRooms);
  };

  const toggleBlockUser = (userId: string) => {
    const newBlockedUsers = new Set(blockedUsers);
    const userToToggle = users.find((u) => u._id === userId);
    const userName = userToToggle?.name || "User";

    if (newBlockedUsers.has(userId)) {
      newBlockedUsers.delete(userId);
      success("User Unblocked", `${userName} has been unblocked`);
    } else {
      newBlockedUsers.add(userId);
      success("User Blocked", `${userName} has been blocked`);
    }
    setBlockedUsers(newBlockedUsers);
    localStorage.setItem("blockedUsers", JSON.stringify([...newBlockedUsers]));
  };

  const isUserBlocked = (userId: string) => {
    return blockedUsers.has(userId);
  };

  const handleTyping = () => {
    // Only trigger typing if there's actual content
    if (!newMessage.trim()) return;

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Only emit typing event if not already typing
    if (!isCurrentlyTyping && socket && currentRoom) {
      const receiverId =
        currentRoom.type === "direct"
          ? currentRoom.participants.find((p) => p._id !== user?.id)?._id
          : null;

      // Get user ID from JWT token to match backend
      const token = localStorage.getItem("token");
      let senderId = user?.id;

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          senderId = payload.id || user?.id;
        } catch (error) {
          console.warn("Could not decode JWT token, using user.id");
        }
      }

      const typingData = {
        senderId: senderId,
        receiverId: receiverId,
        groupId: currentRoom.type === "group" ? currentRoom._id : null,
        roomId: currentRoom._id, // fallback
      };

      console.log("🔍 [TYPING] Emitting typing event:", {
        currentRoom: currentRoom._id,
        currentRoomType: currentRoom.type,
        user: user?.id,
        senderId: senderId,
        receiverId: receiverId,
        participants: currentRoom.participants.map((p) => ({
          id: p._id,
          name: p.name,
        })),
        typingData,
      });

      socket.emit("typing", typingData);
      setIsCurrentlyTyping(true);
    }

    // Set new timeout to stop typing indicator (2 seconds as per requirements)
    const timeout = setTimeout(() => {
      setIsCurrentlyTyping(false);
      if (socket && currentRoom) {
        const receiverId =
          currentRoom.type === "direct"
            ? currentRoom.participants.find((p) => p._id !== user?.id)?._id
            : null;

        // Get user ID from JWT token to match backend
        const token = localStorage.getItem("token");
        let senderId = user?.id;

        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            senderId = payload.id || user?.id;
          } catch (error) {
            console.warn("Could not decode JWT token, using user.id");
          }
        }

        const stopTypingData = {
          senderId: senderId,
          receiverId: receiverId,
          groupId: currentRoom.type === "group" ? currentRoom._id : null,
          roomId: currentRoom._id, // fallback
        };

        console.log(
          "🔍 [STOP TYPING] Emitting stopTyping event:",
          stopTypingData
        );
        socket.emit("stopTyping", stopTypingData);
      }
    }, 2000); // 2 second timeout as per requirements

    setTypingTimeout(timeout);
  };

  // Handle mention detection
  const handleMentionDetection = (text: string, cursorPosition: number) => {
    const beforeCursor = text.slice(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setShowMentions(true);
      setMentionQuery(mentionMatch[1]);
      setMentionPosition(cursorPosition);
    } else {
      setShowMentions(false);
    }
  };

  // Handle mention selection
  const handleMentionSelect = (selectedUser: {
    _id: string;
    name: string;
    profilePicture: string;
    isOnline: boolean;
    lastSeen?: string;
  }) => {
    const beforeMention = newMessage.slice(
      0,
      mentionPosition - mentionQuery.length - 1
    );
    const afterMention = newMessage.slice(mentionPosition);
    const newText = `${beforeMention}@${selectedUser.name} ${afterMention}`;

    setNewMessage(newText);
    setShowMentions(false);
    setMentionedUsers((prev) => new Set([...prev, selectedUser._id]));

    // Show notification to mentioned user
    if (socket && currentRoom) {
      socket.emit("user-mentioned", {
        roomId: currentRoom._id,
        mentionedUserId: selectedUser._id,
        mentionedBy: user?.id,
        message: newText,
      });
    }
  };

  const stopTyping = () => {
    // Only stop if currently typing
    if (!isCurrentlyTyping) return;

    setIsCurrentlyTyping(false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    if (socket && currentRoom) {
      const receiverId =
        currentRoom.type === "direct"
          ? currentRoom.participants.find((p) => p._id !== user?.id)?._id
          : null;

      // Get user ID from JWT token to match backend
      const token = localStorage.getItem("token");
      let senderId = user?.id;

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          senderId = payload.id || user?.id;
        } catch (error) {
          console.warn("Could not decode JWT token, using user.id");
        }
      }

      socket.emit("stopTyping", {
        senderId: senderId,
        receiverId: receiverId,
        groupId: currentRoom.type === "group" ? currentRoom._id : null,
        roomId: currentRoom._id, // fallback
      });
    }
  };

  const showNotification = (title: string, body: string, roomId?: string) => {
    if (
      notificationPermission !== "granted" ||
      (roomId && mutedRooms.has(roomId))
    ) {
      return;
    }

    if ("Notification" in window) {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
      });
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/chat/messages/${messageId}/reactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ emoji }),
        }
      );

      if (response.ok) {
        // Update the message in the local state
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg._id === messageId) {
              const existingReaction = msg.reactions?.find(
                (r) => r.userId === user?.id
              );
              if (existingReaction) {
                // Remove existing reaction
                return {
                  ...msg,
                  reactions: msg.reactions?.filter(
                    (r) => r.userId !== user?.id
                  ),
                };
              } else {
                // Add new reaction
                return {
                  ...msg,
                  reactions: [
                    ...(msg.reactions || []),
                    {
                      emoji,
                      userId: user?.id || "",
                      userName: user?.name || "",
                    },
                  ],
                };
              }
            }
            return msg;
          })
        );
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const handleDeleteMessage = async (
    messageId: string,
    deleteForEveryone: boolean = false
  ) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/chat/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ deleteForEveryone }),
        }
      );

      if (response.ok) {
        if (deleteForEveryone) {
          // Remove message from everyone
          setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
        } else {
          // Mark as deleted for current user only
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === messageId ? { ...msg, isDeleted: true } : msg
            )
          );
        }
        success(
          "Message deleted",
          deleteForEveryone
            ? "Message deleted for everyone"
            : "Message deleted for you"
        );
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleReportMessage = async (messageId: string, reason: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/chat/messages/${messageId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (response.ok) {
        success(
          "Message reported",
          "The message has been reported to moderators"
        );
      }
    } catch (error) {
      console.error("Error reporting message:", error);
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor(
      (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatLastMessageTime = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - messageTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return messageTime.toLocaleDateString();
  };

  const fetchChatRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/chat/rooms", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Chat rooms data:", data);
        console.log("Chat rooms count:", data.data?.chatRooms?.length || 0);

        const rooms = data.data.chatRooms || [];
        console.log(
          "Setting chat rooms:",
          rooms.map((r: ChatRoom) => ({
            id: r._id,
            type: r.type,
            participants: r.participants?.length,
          }))
        );

        setChatRooms(rooms);
        // Don't set current room here - let the useEffect handle it
      } else {
        console.error("Failed to fetch chat rooms:", response.status);
        showErrorRef.current("Failed to fetch chat rooms", "Please try again.");
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      showErrorRef.current("Failed to fetch chat rooms", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchMessages = async (roomId: string) => {
    console.log("Fetching messages for room:", roomId);
    try {
      const response = await fetch(
        `http://localhost:5000/api/chat/room/${roomId}/messages`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Messages fetched:", data.data.messages);
        setMessages(data.data.messages);
        scrollToBottom();
      } else {
        console.error("Failed to fetch messages:", response.status);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      showErrorRef.current("Failed to fetch messages", "Please try again.");
    } finally {
      setChatLoading(false);
    }
  };

  const markMessagesAsSeen = async (roomId: string) => {
    try {
      await fetch(`http://localhost:5000/api/chat/room/${roomId}/seen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (socket) {
        socket.emit("seen-message", { roomId });
      }
    } catch (error) {
      console.error("Failed to mark messages as seen:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentRoom) return;

    // Validate message length
    if (newMessage.length > 50000) {
      showErrorRef.current(
        "Message too long",
        "Maximum 50,000 characters allowed. Please shorten your message."
      );
      return;
    }

    const messageText = newMessage.trim();
    setNewMessage("");

    // Stop typing immediately when sending message
    stopTyping();

    // Create a temporary message for immediate UI feedback
    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      senderId: {
        _id: user?.id || "",
        name: user?.name || "",
        profilePicture: user?.profilePicture || "",
      },
      message: messageText,
      status: isConnected ? "sent" : "pending",
      isEdited: false,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    };

    // Add message to UI immediately
    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom();

    if (isConnected && socket) {
      try {
        socket.emit("send-message", {
          roomId: currentRoom._id,
          message: messageText,
          type: "text",
        });
      } catch (error) {
        console.error("Failed to send message:", error);
        showErrorRef.current("Failed to send message", "Please try again.");
      }
    } else {
      // Store message for when connection is restored
      setPendingMessages((prev) => [...prev, tempMessage]);
      showErrorRef.current(
        "Message saved",
        "Will be sent when connection is restored."
      );
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      showErrorRef.current(
        "Please enter group name and select members",
        "Group creation failed."
      );
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/chat/group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: groupName,
          participants: selectedUsers,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        success(
          "Group created successfully",
          "You can now start chatting with the group."
        );
        setShowCreateGroup(false);
        setGroupName("");
        setSelectedUsers([]);
        fetchChatRooms();
      } else {
        const errorData = await response.json();
        showErrorRef.current(
          "Failed to create group",
          errorData.message || "Please try again."
        );
      }
    } catch (error) {
      console.error("Error creating group:", error);
      showErrorRef.current("Failed to create group", "Please try again.");
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="w-3 h-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case "seen":
        return <Eye className="w-3 h-3 text-blue-600" />;
      case "pending":
        return <Clock className="w-3 h-3 text-yellow-500" />;
      default:
        return null;
    }
  };

  const TypingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
        <span className="text-xs text-gray-600 font-medium">
          {`${typingUsers.join(", ")} ${
            typingUsers.length === 1 ? "is" : "are"
          } typing`}
        </span>
      </div>
    </div>
  );

  const getOtherParticipant = () => {
    if (!currentRoom) return null;
    if (currentRoom.type === "group") {
      return {
        name: currentRoom.name || "Group Chat",
        profilePicture: "",
        isOnline: false,
      };
    }
    const participant = currentRoom.participants.find(
      (p) => p._id !== user?.id
    );
    return participant as
      | {
          _id: string;
          name: string;
          profilePicture: string;
          isOnline: boolean;
          lastSeen?: string;
        }
      | undefined;
  };

  // Filter and sort chat rooms - online users first, then by last message time
  const filteredChatRooms = chatRooms
    .filter((room) => {
      if (!chatSearchQuery) return true;

      const otherParticipant = room.participants.find(
        (p) => p._id !== user?.id
      );
      const displayName =
        room.type === "group"
          ? room.name || "Group Chat"
          : otherParticipant?.name || "Unknown User";

      return displayName.toLowerCase().includes(chatSearchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Online users first
      const aOther = a.participants.find((p) => p._id !== user?.id);
      const bOther = b.participants.find((p) => p._id !== user?.id);

      if (aOther?.isOnline && !bOther?.isOnline) return -1;
      if (!aOther?.isOnline && bOther?.isOnline) return 1;

      // Then by last message time (most recent first)
      if (a.lastMessage && b.lastMessage) {
        return (
          new Date(b.lastMessage.createdAt).getTime() -
          new Date(a.lastMessage.createdAt).getTime()
        );
      }

      return 0;
    });

  const filteredUsers = users.filter(
    (u) =>
      u._id !== user?.id &&
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
        if (permission === "granted") {
          success(
            "Notifications Enabled",
            "You'll now receive browser notifications for new messages"
          );
        } else if (permission === "denied") {
          showError(
            "Notifications Blocked",
            "Please enable notifications in your browser settings"
          );
        }
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat Rooms Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-lg">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-lg">My Chat</h2>
                <div className="flex items-center space-x-1">
                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">
                    {chatRooms.reduce(
                      (total, room) => total + (room.unreadCount || 0),
                      0
                    )}
                  </Badge>
                  <span className="text-xs text-purple-200">
                    unread messages
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full w-8 h-8"
              >
                <Moon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full w-8 h-8"
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full w-8 h-8"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChatRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No conversations found</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredChatRooms.map((room) => {
                const otherParticipant = room.participants.find(
                  (p) => p._id !== user?.id
                );
                const displayName =
                  room.type === "group"
                    ? room.name || "Group Chat"
                    : otherParticipant?.name || "Unknown User";
                const isMuted = mutedRooms.has(room._id);
                const isActive = room._id === currentRoom?._id;

                return (
                  <div
                    key={room._id}
                    className={`relative group cursor-pointer rounded-lg p-3 transition-all duration-200 ${
                      isActive
                        ? "bg-purple-100 border-l-4 border-purple-500"
                        : "hover:bg-gray-50"
                    } ${isMuted ? "opacity-60" : ""}`}
                    onClick={() => {
                      navigate(`/chat/${room._id}`);
                      success(
                        "Chat Selected",
                        `Opened conversation with ${displayName}`
                      );
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      toggleMuteRoom(room._id);
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={otherParticipant?.profilePicture} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                            {displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {otherParticipant?.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {displayName}
                            </h3>
                            {room.unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white text-xs">
                                {room.unreadCount}
                              </Badge>
                            )}
                            {/* Mention notification badge */}
                            {room.lastMessage?.message.includes(
                              `@${user?.name}`
                            ) && (
                              <Badge className="bg-blue-500 text-white text-xs">
                                @
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            {isMuted && (
                              <span className="text-gray-400 text-xs">🔇</span>
                            )}
                            {room.lastMessage && (
                              <span className="text-xs text-gray-500">
                                {formatLastMessageTime(
                                  room.lastMessage.createdAt
                                )}
                              </span>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMuteRoom(room._id);
                                  }}
                                >
                                  {isMuted ? (
                                    <>
                                      <Volume2 className="mr-2 h-4 w-4" />
                                      Unmute
                                    </>
                                  ) : (
                                    <>
                                      <VolumeX className="mr-2 h-4 w-4" />
                                      Mute
                                    </>
                                  )}
                                </DropdownMenuItem>
                                {room.type === "direct" && otherParticipant && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleBlockUser(otherParticipant._id);
                                    }}
                                  >
                                    <Shield className="mr-2 h-4 w-4" />
                                    {isUserBlocked(otherParticipant._id)
                                      ? "Unblock"
                                      : "Block"}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Implement delete chat functionality
                                    showError(
                                      "Delete Chat",
                                      "This feature is coming soon!"
                                    );
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Chat
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {room.lastMessage && (
                          <p className="text-sm text-gray-500 truncate">
                            <span className="font-medium">
                              {room.lastMessage.senderId.name}:
                            </span>{" "}
                            {room.lastMessage.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2">
            <Dialog open={showUserList} onOpenChange={setShowUserList}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 hover:bg-purple-50 border-purple-200 text-purple-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Start a New Chat</DialogTitle>
                  <DialogDescription>
                    Select a user to start a conversation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full"
                  />
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {users
                      .filter((u) => u._id !== user?.id)
                      .filter((u) =>
                        u.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .filter((u) => !isUserBlocked(u._id))
                      .sort((a, b) => {
                        // Online users first
                        if (a.isOnline && !b.isOnline) return -1;
                        if (!a.isOnline && b.isOnline) return 1;
                        // Then by name
                        return a.name.localeCompare(b.name);
                      })
                      .slice(0, 20) // Limit to 20 users to show recent ones
                      .map((userItem) => (
                        <div
                          key={userItem._id}
                          className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => createDirectChat(userItem._id)}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={userItem.profilePicture} />
                            <AvatarFallback>
                              {userItem.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {userItem.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {userItem.email}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                userItem.isOnline
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            ></div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBlockUser(userItem._id);
                              }}
                              className="hover:bg-red-50 text-red-600"
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Group Name</label>
                    <Input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Enter group name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Search Members
                    </label>
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => {
                          if (selectedUsers.includes(user._id)) {
                            setSelectedUsers(
                              selectedUsers.filter((id) => id !== user._id)
                            );
                          } else {
                            setSelectedUsers([...selectedUsers, user._id]);
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => {}}
                          className="rounded"
                        />
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.profilePicture} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateGroup(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={createGroup}>Create Group</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={getOtherParticipant()?.profilePicture} />
                  <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                    {getOtherParticipant()?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {getOtherParticipant()?.name || "Unknown User"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {getOtherParticipant()?.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {notificationPermission === "default" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={requestNotificationPermission}
                    className="text-xs"
                  >
                    Enable Notifications
                  </Button>
                )}
                <Button size="sm" variant="ghost">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Video className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {chatLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
                    <p className="mt-2 text-gray-500">Loading messages...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwnMessage = message.senderId._id === user?.id;
                    const showDate =
                      index === 0 ||
                      formatDate(message.createdAt) !==
                        formatDate(messages[index - 1]?.createdAt);

                    return (
                      <div key={message._id}>
                        {showDate && (
                          <div className="flex items-center justify-center my-4">
                            <div className="bg-gray-100 px-3 py-1 rounded-full">
                              <span className="text-xs text-gray-500">
                                {formatDate(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        )}
                        <div
                          className={`flex items-end space-x-2 ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isOwnMessage && (
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage
                                src={message.senderId.profilePicture}
                              />
                              <AvatarFallback className="text-xs">
                                {message.senderId.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className="relative group">
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isOwnMessage
                                  ? "bg-purple-500 text-white"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              {message.isDeleted ? (
                                <p className="text-sm italic text-gray-500">
                                  This message was deleted
                                </p>
                              ) : (
                                <p className="text-sm">{message.message}</p>
                              )}

                              <div
                                className={`flex items-center justify-between mt-1 text-xs ${
                                  isOwnMessage
                                    ? "text-purple-100"
                                    : "text-gray-500"
                                }`}
                              >
                                <span>{formatTime(message.createdAt)}</span>
                                <div className="flex items-center space-x-1">
                                  {message.isEdited && (
                                    <span className="italic">edited</span>
                                  )}
                                  {message.senderId._id === user?.id &&
                                    getStatusIcon(message.status)}
                                </div>
                              </div>
                            </div>

                            {/* Message Actions */}
                            {!message.isDeleted && (
                              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                    >
                                      <MoreHorizontal className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setShowReactionPicker(message._id)
                                      }
                                    >
                                      <span className="mr-2">😊</span>
                                      React
                                    </DropdownMenuItem>
                                    {message.senderId._id === user?.id && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleDeleteMessage(
                                              message._id,
                                              false
                                            )
                                          }
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete for me
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleDeleteMessage(
                                              message._id,
                                              true
                                            )
                                          }
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete for everyone
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleReportMessage(
                                          message._id,
                                          "inappropriate"
                                        )
                                      }
                                    >
                                      <Shield className="w-4 h-4 mr-2" />
                                      Report
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}

                            {/* Reaction Picker */}
                            {showReactionPicker === message._id && (
                              <ReactionPicker
                                onReaction={(emoji) =>
                                  handleReaction(message._id, emoji)
                                }
                                isVisible={true}
                                onClose={() => setShowReactionPicker(null)}
                              />
                            )}
                          </div>

                          {isOwnMessage && (
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarImage src={user?.profilePicture} />
                              <AvatarFallback className="text-xs">
                                {user?.name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>

                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div
                            className={`flex flex-wrap gap-1 mt-1 ${
                              isOwnMessage ? "justify-end" : "justify-start"
                            }`}
                          >
                            {Object.entries(
                              message.reactions.reduce((acc, reaction) => {
                                acc[reaction.emoji] =
                                  (acc[reaction.emoji] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([emoji, count]) => (
                              <ReactionIcon
                                key={emoji}
                                emoji={emoji}
                                count={count}
                                isActive={message.reactions?.some(
                                  (r) =>
                                    r.userId === user?.id && r.emoji === emoji
                                )}
                                onClick={() =>
                                  handleReaction(message._id, emoji)
                                }
                                className="cursor-pointer"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Typing Indicator - Only show for other users */}
                  {typingUsers.length > 0 && <TypingIndicator />}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 p-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      // Trigger typing immediately when user types
                      if (e.target.value.trim()) {
                        handleTyping();
                      } else {
                        stopTyping();
                      }
                      // Handle mention detection
                      handleMentionDetection(
                        e.target.value,
                        e.target.selectionStart || 0
                      );
                    }}
                    onKeyUp={handleTyping}
                    onBlur={stopTyping}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message... Use @ to mention users"
                    className={`min-h-[40px] max-h-32 resize-none ${
                      isTyping ? "border-purple-300 ring-1 ring-purple-300" : ""
                    }`}
                    rows={1}
                  />

                  {/* Character Counter */}
                  {newMessage.length > 0 && (
                    <div className="absolute bottom-1 right-2 text-xs text-gray-500">
                      {newMessage.length}/50,000
                    </div>
                  )}

                  {isTyping && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}

                  {/* Mentions Dropdown */}
                  {showMentions && currentRoom && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                      <div className="p-2">
                        <div className="text-xs text-gray-500 mb-2 px-2">
                          Mention a user:
                        </div>
                        {currentRoom.participants
                          .filter((p) => p._id !== user?.id)
                          .filter((p) =>
                            p.name
                              .toLowerCase()
                              .includes(mentionQuery.toLowerCase())
                          )
                          .map((participant) => (
                            <div
                              key={participant._id}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              onClick={() => handleMentionSelect(participant)}
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={participant.profilePicture} />
                                <AvatarFallback className="text-xs">
                                  {participant.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {participant.name}
                              </span>
                              {participant.isOnline && (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pending Messages Indicator */}
                {pendingMessages.length > 0 && (
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        sendPendingMessages();
                        success(
                          "Pending Messages Sent",
                          `${pendingMessages.length} messages have been sent`
                        );
                      }}
                      className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      Pending
                    </Button>
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {pendingMessages.length}
                    </div>
                  </div>
                )}

                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {!isConnected && (
                <div className="mt-2 text-xs text-yellow-600 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Messages will be sent when connection is restored</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {roomId ? "Loading conversation..." : "Select a conversation"}
              </h3>
              <p className="text-gray-500">
                {roomId
                  ? "Please wait while we load the chat..."
                  : "Choose a chat from the sidebar to start messaging"}
              </p>
              {roomId && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg animate-in slide-in-from-bottom-4 duration-300">
          <DialogHeader className="relative pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-2 text-xl font-semibold">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>Chat Settings</span>
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSettings(false);
                  success(
                    "Settings Saved",
                    "Your chat settings have been updated"
                  );
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <DialogDescription className="text-gray-600 mt-2">
              Manage your chat preferences, notifications, and privacy settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Notifications Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>Notifications</span>
              </h3>
              <div className="space-y-3 pl-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        notificationPermission === "granted"
                          ? "bg-green-500"
                          : notificationPermission === "denied"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Browser Notifications
                      </p>
                      <p className="text-sm text-gray-500">
                        {notificationPermission === "granted"
                          ? "Enabled"
                          : notificationPermission === "denied"
                          ? "Blocked"
                          : "Not set"}
                      </p>
                    </div>
                  </div>
                  {notificationPermission === "default" && (
                    <Button
                      size="sm"
                      onClick={requestNotificationPermission}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      Enable
                    </Button>
                  )}
                </div>

                <div
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                  onClick={() => {
                    setShowMutedRooms(true);
                    success(
                      "Muted Rooms",
                      `Viewing ${mutedRooms.size} muted conversations`
                    );
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <div>
                      <p className="font-medium text-gray-900">Muted Rooms</p>
                      <p className="text-sm text-gray-500">
                        {mutedRooms.size} conversations muted
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Privacy & Security Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-red-600" />
                <span>Privacy & Security</span>
              </h3>
              <div className="space-y-3 pl-6">
                <div
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:transform hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                  onClick={() => {
                    setShowBlockedUsers(true);
                    success(
                      "Blocked Users",
                      `Viewing ${blockedUsers.size} blocked users`
                    );
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div>
                      <p className="font-medium text-gray-900">Blocked Users</p>
                      <p className="text-sm text-gray-500">
                        {blockedUsers.size} users blocked
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Statistics Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-green-600" />
                <span>Statistics</span>
              </h3>
              <div className="grid grid-cols-3 gap-3 pl-6">
                <div className="bg-blue-50 p-3 rounded-lg text-center hover:bg-blue-100 transition-colors">
                  <p className="text-2xl font-bold text-blue-600">
                    {chatRooms.length}
                  </p>
                  <p className="text-xs text-blue-600">Conversations</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center hover:bg-green-100 transition-colors">
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter((u) => u.isOnline).length}
                  </p>
                  <p className="text-xs text-green-600">Online</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center hover:bg-purple-100 transition-colors">
                  <p className="text-2xl font-bold text-purple-600">
                    {users.length}
                  </p>
                  <p className="text-xs text-purple-600">Total Users</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Muted Rooms Dialog */}
      <Dialog open={showMutedRooms} onOpenChange={setShowMutedRooms}>
        <DialogContent className="max-w-md animate-in slide-in-from-bottom-4 duration-300">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                <span>Muted Rooms</span>
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowMutedRooms(false);
                  success(
                    "Muted Rooms Updated",
                    "Your muted rooms settings have been saved"
                  );
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <DialogDescription className="mt-2">
              Manage your muted conversations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {Array.from(mutedRooms).length === 0 ? (
              <div className="text-center py-8">
                <VolumeX className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No muted conversations</p>
              </div>
            ) : (
              Array.from(mutedRooms).map((roomId) => {
                const room = chatRooms.find((r) => r._id === roomId);
                const roomName = room
                  ? room.type === "group"
                    ? room.name || "Group Chat"
                    : room.participants.find((p) => p._id !== user?.id)?.name ||
                      "Unknown User"
                  : "Chat";

                return (
                  <div
                    key={roomId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium text-gray-900">
                      {roomName}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleMuteRoom(roomId)}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      Unmute
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Blocked Users Dialog */}
      <Dialog open={showBlockedUsers} onOpenChange={setShowBlockedUsers}>
        <DialogContent className="max-w-md animate-in slide-in-from-bottom-4 duration-300">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-red-600" />
                <span>Blocked Users</span>
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBlockedUsers(false);
                  success(
                    "Blocked Users Updated",
                    "Your blocked users settings have been saved"
                  );
                }}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <DialogDescription className="mt-2">
              Manage your blocked users list.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {Array.from(blockedUsers).length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No blocked users</p>
              </div>
            ) : (
              <>
                {Array.from(blockedUsers).map((userId) => {
                  const blockedUser = users.find((u) => u._id === userId);
                  return (
                    <div
                      key={userId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={blockedUser?.profilePicture} />
                          <AvatarFallback>
                            {blockedUser?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-900">
                          {blockedUser?.name || "Unknown User"}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleBlockUser(userId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Unblock
                      </Button>
                    </div>
                  );
                })}
                <Button
                  variant="outline"
                  onClick={() => {
                    const blockedCount = blockedUsers.size;
                    setBlockedUsers(new Set());
                    setShowBlockedUsers(false);
                    success(
                      "All Users Unblocked",
                      `${blockedCount} users have been unblocked`
                    );
                  }}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Unblock All Users
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatPage;
