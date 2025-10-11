import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Card, CardContent, CardHeader } from "../../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Skeleton } from "../../ui/skeleton";
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  Send,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PostCard from "../../ui/post-card";
import { useToast } from "../../ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { Trash2, Grid3X3, List } from "lucide-react";

interface Post {
  _id: string;
  content: string;
  type?: string;
  media?: any[];
  codeSnippets?: any[];
  user: {
    _id: string;
    name: string;
    username: string;
    profilePicture: string;
  };
  likes: Array<{ user: string }>;
  shares?: any[];
  bookmarks?: any[];
  comments: Array<{
    _id: string;
    content: string;
    user: {
      _id: string;
      name: string;
      username: string;
      profilePicture: string;
    };
    createdAt: string;
  }>;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  tags?: string[];
  location?: string;
  mood?: string;
  isEdited?: boolean;
  viewCount?: number;
}

const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // Add flag to prevent multiple requests
  const [lastFetchTime, setLastFetchTime] = useState(0); // Track last fetch time
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const fetchPosts = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isFetching) {
      console.log("Already fetching posts, skipping...");
      return;
    }

    // Debounce: prevent requests within 3 seconds of last request
    const now = Date.now();
    if (now - lastFetchTime < 3000) {
      console.log("Debouncing fetch request...");
      return;
    }

    try {
      setIsFetching(true);
      setLastFetchTime(now);
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:5000/api/social/posts/feed",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Posts data:", data);
        setPosts(data.data.posts || []);
      } else if (response.status === 429) {
        // Rate limit exceeded
        setError(
          "Too many requests. Please wait a moment before trying again."
        );
        console.warn("Rate limit exceeded, waiting before retry...");
        // Wait 5 seconds before allowing another request
        setTimeout(() => {
          setLastFetchTime(0);
        }, 5000);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch posts:", response.status, errorData);
        setError(
          `Failed to fetch posts: ${errorData.message || response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError("Network error while fetching posts");
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [isFetching, lastFetchTime]);

  const debouncedFetchPosts = useCallback(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      fetchPosts();
    }, 1000); // 1 second debounce
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;

    setPosting(true);
    try {
      const response = await fetch("http://localhost:5000/api/social/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          content: newPost,
          type: "text",
          visibility: "public",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Post created:", data);
        setNewPost("");
        // Use debounced fetch to prevent rapid requests
        debouncedFetchPosts();
      } else {
        const errorData = await response.json();
        showError(
          "Failed to create post",
          errorData.message || "Please try again."
        );
      }
    } catch (error) {
      console.error("Error creating post:", error);
      showError("Failed to create post", "Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        // Use debounced fetch to prevent rapid requests
        debouncedFetchPosts();
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async (postId: string, comment: string) => {
    if (!comment.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ content: comment }),
        }
      );

      if (response.ok) {
        // Use debounced fetch to prevent rapid requests
        debouncedFetchPosts();
      }
    } catch (error) {
      console.error("Error commenting on post:", error);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${postId}/share`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        // Use debounced fetch to prevent rapid requests
        debouncedFetchPosts();
        success("Post shared", "Post shared successfully!");
      }
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${postId}/bookmark`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        // Use debounced fetch to prevent rapid requests
        debouncedFetchPosts();
      }
    } catch (error) {
      console.error("Error bookmarking post:", error);
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const handleDeletePost = async (postId: string) => {
    if (!user?.id) {
      showError("Authentication required", "Please log in to delete posts.");
      return;
    }

    setPostToDelete(postId);
    setShowDeleteDialog(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/social/posts/${postToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        // Remove post from the posts array
        setPosts((prevPosts) =>
          prevPosts.filter((post) => post._id !== postToDelete)
        );
        success("Post deleted", "Post deleted successfully!");
      } else {
        const data = await response.json();
        showError("Failed to delete post", data.message || "Please try again.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      showError("Network error", "Failed to delete post. Please try again.");
    } finally {
      setShowDeleteDialog(false);
      setPostToDelete(null);
    }
  };

  const navigateToProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  const createTestPost = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/social/posts/test",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Test post created:", data);
        // Use debounced fetch to prevent rapid requests
        debouncedFetchPosts();
      } else {
        const errorData = await response.json();
        console.error("Failed to create test post:", errorData);
      }
    } catch (error) {
      console.error("Error creating test post:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isLikedByUser = (post: Post) => {
    return post.likes.some((like) => like.user === user?.id);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Feed
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Stay updated with the latest posts from your network
          </p>
        </div>
        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              viewMode === "grid"
                ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              viewMode === "list"
                ? "bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
        </div>
      </div>

      {/* Create Post Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user?.profilePicture || "/default-avatar.png"}
              />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold">{user?.name || "User"}</div>
              <div className="text-sm text-gray-500">
                @{user?.username || "username"}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleCreatePost}
                disabled={posting || !newPost.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {posting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-600 mb-4">{error}</div>
            <Button
              onClick={() => {
                debouncedFetchPosts();
              }}
              variant="outline"
              size="sm"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Test Post Button */}
      <div className="text-center">
        <Button onClick={createTestPost} variant="outline">
          Create Test Post
        </Button>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading posts...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <AlertCircle className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Error loading posts
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={fetchPosts} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <MessageCircle className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <div className="text-gray-500">
                No posts yet. Be the first to create a post!
              </div>
              <Button onClick={createTestPost} variant="outline">
                Create Test Post
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {console.log("Posts array:", posts)}
            {console.log("Posts length:", posts.length)}
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                  : "space-y-4"
              }
            >
              {posts.map((post) => {
                // Debug: Log the actual post structure
                console.log("Raw post data:", post);
                console.log("Post user:", post.user);
                console.log("Post type:", typeof post);

                // Check if post has required fields
                if (!post || !post.user) {
                  console.error("Invalid post structure:", post);
                  return null;
                }

                // Transform post data to match PostCard interface
                const transformedPost = {
                  id: post._id,
                  content: post.content,
                  author: {
                    id: post.user?._id || "unknown",
                    name: post.user?.name || "Unknown User",
                    username: post.user?.username || "unknown",
                    profilePicture: post.user?.profilePicture,
                    role: "user", // Default role
                  },
                  type: (post as any).type || "text", // Use actual post type from backend
                  media: (post as any).media || [],
                  codeSnippets: (post as any).codeSnippets || [],
                  likes: post.likeCount || post.likes?.length || 0,
                  comments: post.commentCount || post.comments?.length || 0,
                  shares: (post as any).shares?.length || 0,
                  bookmarks: (post as any).bookmarks?.length || 0,
                  createdAt: post.createdAt,
                  isLiked: isLikedByUser(post),
                  isBookmarked: false, // Default value
                  isFollowing: false, // Default value
                  tags: (post as any).tags || [],
                  location: (post as any).location,
                  mood: (post as any).mood,
                  isEdited: (post as any).isEdited || false,
                  viewCount: (post as any).viewCount || 0,
                };

                console.log("Transformed post:", transformedPost);

                return (
                  <PostCard
                    key={post._id}
                    post={transformedPost}
                    onLike={handleLike}
                    onComment={(postId) => {
                      const comment = prompt("Enter your comment:");
                      if (comment) handleComment(postId, comment);
                    }}
                    onShare={handleShare}
                    onBookmark={handleBookmark}
                    onDelete={handleDeletePost}
                    onViewProfile={navigateToProfile}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Post
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePost}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedPage;
