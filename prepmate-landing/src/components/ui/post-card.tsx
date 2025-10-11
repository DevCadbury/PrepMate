import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Copy,
  Check,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Eye,
  Code,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  File,
  Trash2,
  Edit,
  Flag,
  UserPlus,
  Heart as HeartFilled,
  Send,
  Smile,
  Image,
  Paperclip,
} from "lucide-react";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { useToast } from "./toast";
import { useAuth } from "../../contexts/AuthContext";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  atomDark,
  tomorrow,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import io from "socket.io-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface MediaItem {
  type: "image" | "video" | "audio" | "file";
  url: string;
  thumbnail?: string;
  filename?: string;
  size?: string;
  duration?: string;
}

interface CodeSnippet {
  language: string;
  code: string;
  filename?: string;
}

interface Comment {
  _id: string;
  content: string;
  user: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
  createdAt: string;
  likes?: number;
  isLiked?: boolean;
}

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    profilePicture?: string;
    role: string;
  };
  type: "text" | "code" | "media" | "achievement" | "question" | "resource";
  media?: MediaItem[];
  codeSnippets?: CodeSnippet[];
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  createdAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isFollowing?: boolean;
  tags?: string[];
  location?: string;
  mood?: string;
  isEdited?: boolean;
  viewCount?: number;
}

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onBookmark?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onFollow?: (userId: string) => void;
  onReport?: (postId: string) => void;
  showComments?: boolean;
  onViewProfile?: (username: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onDelete,
  onEdit,
  onFollow,
  onReport,
  showComments: initialShowComments = false,
  onViewProfile,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [showComments, setShowComments] = useState(initialShowComments);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMediaControls, setShowMediaControls] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize socket connection for real-time updates
  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      newSocket.emit("join-post", post.id);
    });

    newSocket.on("new-comment", (data: any) => {
      if (data.postId === post.id) {
        setComments((prev) => [data.comment, ...prev]);
        success(
          "New comment!",
          `${data.comment.user.name} commented on this post.`
        );
      }
    });

    newSocket.on("comment-liked", (data: any) => {
      setComments((prev) =>
        prev.map((comment) =>
          comment._id === data.commentId
            ? { ...comment, likes: (comment.likes || 0) + 1, isLiked: true }
            : comment
        )
      );
    });

    newSocket.on("post-liked", (data: any) => {
      if (data.postId === post.id) {
        setLikeCount((prev) => prev + 1);
        setIsLiked(true);
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);
      }
    });

    newSocket.on("post-unliked", (data: any) => {
      if (data.postId === post.id) {
        setLikeCount((prev) => Math.max(0, prev - 1));
        setIsLiked(false);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [post.id]);

  // Fetch comments when comments section is opened
  useEffect(() => {
    if (showComments && comments.length === 0) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${post.id}/comments`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error: any) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      error("Authentication required", "Please log in to like posts.");
      return;
    }

    try {
      // Optimistic update with instant animation
      const wasLiked = isLiked;
      const newLikeCount = wasLiked ? likeCount - 1 : likeCount + 1;

      setIsLiked(!wasLiked);
      setLikeCount(newLikeCount);

      // Instant heart animation with enhanced timing
      if (!wasLiked) {
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1200);
      }

      // Emit socket event for real-time updates
      socket?.emit("like-post", {
        postId: post.id,
        action: wasLiked ? "unlike" : "like",
      });

      const response = await fetch(
        `http://localhost:5000/api/social/posts/${post.id}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        // Revert optimistic update on error
        setIsLiked(wasLiked);
        setLikeCount(wasLiked ? likeCount : likeCount - 1);
        throw new Error("Failed to like post");
      }

      const data = await response.json();
      console.log("Like response:", data);
      onLike?.(post.id);
    } catch (error: any) {
      console.error("Error liking post:", error);
      error("Failed to like post", "Please try again.");
    }
  };

  const handleBookmark = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${post.id}/bookmark`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        setIsBookmarked(!isBookmarked);
        onBookmark?.(post.id);

        if (!isBookmarked) {
          success("Post bookmarked!", "Added to your bookmarks.");
        } else {
          success("Bookmark removed", "Removed from your bookmarks.");
        }
      }
    } catch (error: any) {
      error("Failed to bookmark post", "Please try again.");
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${post.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ content: newComment }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Emit socket event for real-time updates
        socket?.emit("new-comment", {
          postId: post.id,
          comment: data.comment,
        });

        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
        success("Comment posted!", "Your comment has been added.");
        onComment?.(post.id);
      }
    } catch (error: any) {
      error("Failed to post comment", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user) return;

    try {
      // Optimistic update
      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                likes: (comment.likes || 0) + 1,
                isLiked: true,
              }
            : comment
        )
      );

      // Emit socket event
      socket?.emit("like-comment", { commentId, postId: post.id });

      const response = await fetch(
        `http://localhost:5000/api/social/comments/${commentId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        // Revert on error
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId
              ? {
                  ...comment,
                  likes: Math.max(0, (comment.likes || 0) - 1),
                  isLiked: false,
                }
              : comment
          )
        );
      }
    } catch (error: any) {
      console.error("Error liking comment:", error);
    }
  };

  const copyCode = async (code: string, language: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(language);
      success("Code copied!", "Code copied to clipboard.");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error: any) {
      error("Failed to copy code", "Please try again.");
    }
  };

  const handleMediaControl = (action: "play" | "pause" | "mute" | "unmute") => {
    if (post.media?.[currentMediaIndex]?.type === "video" && videoRef.current) {
      if (action === "play") {
        videoRef.current.play();
        setIsPlaying(true);
      } else if (action === "pause") {
        videoRef.current.pause();
        setIsPlaying(false);
      } else if (action === "mute") {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else if (action === "unmute") {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    } else if (
      post.media?.[currentMediaIndex]?.type === "audio" &&
      audioRef.current
    ) {
      if (action === "play") {
        audioRef.current.play();
        setIsPlaying(true);
      } else if (action === "pause") {
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (action === "mute") {
        audioRef.current.muted = true;
        setIsMuted(true);
      } else if (action === "unmute") {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "audio":
        return <Music className="h-5 w-5" />;
      case "file":
        return <File className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!post) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Post Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onViewProfile?.(post.author.username)}
            >
              <AvatarImage src={post.author.profilePicture} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {post.author.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:underline"
                  onClick={() => onViewProfile?.(post.author.username)}
                >
                  {post.author.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {post.type}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatTimeAgo(post.createdAt)}
              </p>
            </div>
          </div>

          {/* Post Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user?.id === post.author.id && (
                <>
                  <DropdownMenuItem onClick={() => onEdit?.(post.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete?.(post.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => onReport?.(post.id)}>
                <Flag className="h-4 w-4 mr-2" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <p
          className="text-gray-900 dark:text-white mb-4 break-words"
          style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
        >
          {post.content}
        </p>

        {/* Media Display */}
        {post.media && post.media.length > 0 && (
          <div className="relative mb-4">
            {post.media[currentMediaIndex]?.type === "image" && (
              <img
                src={post.media[currentMediaIndex].url}
                alt="Post media"
                className="w-full h-auto rounded-lg"
              />
            )}

            {post.media[currentMediaIndex]?.type === "video" && (
              <div className="relative">
                <video
                  ref={videoRef}
                  src={post.media[currentMediaIndex].url}
                  className="w-full h-auto rounded-lg"
                  onMouseEnter={() => setShowMediaControls(true)}
                  onMouseLeave={() => setShowMediaControls(false)}
                />
                {showMediaControls && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleMediaControl(isPlaying ? "pause" : "play")
                        }
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleMediaControl(isMuted ? "unmute" : "mute")
                        }
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {post.media[currentMediaIndex]?.type === "audio" && (
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <audio
                  ref={audioRef}
                  src={post.media[currentMediaIndex].url}
                  controls
                  className="w-full"
                />
              </div>
            )}

            {post.media[currentMediaIndex]?.type === "file" && (
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  {getMediaIcon(post.media[currentMediaIndex].type)}
                  <div className="flex-1">
                    <p className="font-medium">
                      {post.media[currentMediaIndex].filename}
                    </p>
                    <p className="text-sm text-gray-500">
                      {post.media[currentMediaIndex].size &&
                        formatFileSize(
                          parseInt(post.media[currentMediaIndex].size || "0")
                        )}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Media Navigation */}
            {post.media.length > 1 && (
              <div className="flex justify-center gap-2 mt-2">
                {post.media.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentMediaIndex
                        ? "bg-blue-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Code Snippets */}
        {post.codeSnippets && post.codeSnippets.length > 0 && (
          <div className="space-y-4 mb-4">
            {post.codeSnippets.map((snippet, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {snippet.language}
                    </span>
                    {snippet.filename && (
                      <span className="text-xs text-gray-500">
                        ({snippet.filename})
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyCode(snippet.code, snippet.language)}
                  >
                    {copiedCode === snippet.language ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <SyntaxHighlighter
                  language={snippet.language}
                  style={atomDark}
                  className="rounded-b-lg"
                >
                  {snippet.code}
                </SyntaxHighlighter>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`flex items-center gap-2 ${
                isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
              }`}
            >
              <motion.div
                animate={
                  showHeartAnimation
                    ? {
                        scale: [1, 1.5, 1.2, 1],
                        rotate: [0, -10, 10, 0],
                      }
                    : {}
                }
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative"
              >
                {isLiked ? (
                  <HeartFilled className="h-5 w-5 fill-current" />
                ) : (
                  <Heart className="h-5 w-5" />
                )}
                {showHeartAnimation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 2] }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <HeartFilled className="h-8 w-8 text-red-500 fill-current" />
                  </motion.div>
                )}
              </motion.div>
              <span className="text-sm">{likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-gray-500 hover:text-blue-500"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">{comments.length}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare?.(post.id)}
              className="flex items-center gap-2 text-gray-500 hover:text-green-500"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className={`flex items-center gap-2 ${
              isBookmarked
                ? "text-yellow-500"
                : "text-gray-500 hover:text-yellow-500"
            }`}
          >
            <Bookmark
              className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Instagram-style Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 dark:border-gray-700"
          >
            {/* Comments List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoadingComments ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">
                    Loading comments...
                  </p>
                </div>
              ) : comments.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    No comments yet. Be the first to comment!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 p-4">
                  {comments.map((comment) => (
                    <motion.div
                      key={comment._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3"
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={comment.user.profilePicture} />
                        <AvatarFallback className="text-xs">
                          {comment.user.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="font-semibold text-sm text-gray-900 dark:text-white cursor-pointer hover:underline"
                            onClick={() =>
                              onViewProfile?.(comment.user.username)
                            }
                          >
                            {comment.user.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>

                        <p
                          className="text-sm text-gray-700 dark:text-gray-300 break-words"
                          style={{
                            wordBreak: "break-word",
                            overflowWrap: "break-word",
                          }}
                        >
                          {comment.content}
                        </p>

                        <div className="flex items-center gap-4 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCommentLike(comment._id)}
                            className={`h-6 px-2 text-xs ${
                              comment.isLiked
                                ? "text-red-500"
                                : "text-gray-500 hover:text-red-500"
                            }`}
                          >
                            <Heart
                              className={`h-3 w-3 ${
                                comment.isLiked ? "fill-current" : ""
                              }`}
                            />
                            <span className="ml-1">{comment.likes || 0}</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-gray-500 hover:text-blue-500"
                          >
                            Reply
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user?.profilePicture} />
                  <AvatarFallback className="text-xs">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-2">
                  <Input
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border-0 bg-transparent focus:ring-0 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleComment();
                      }
                    }}
                  />

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-500 hover:text-blue-500"
                    >
                      <Smile className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-500 hover:text-blue-500"
                    >
                      <Image className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-500 hover:text-blue-500"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={handleComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostCard;
