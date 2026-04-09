import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreVertical,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Code,
  Loader2,
  Reply,
  Trash2,
  Edit,
  Flag,
  Send,
} from "lucide-react";
import { Button } from "./button";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "./badge";
import { Textarea } from "./textarea";
import { useToast } from "./toast";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Skeleton } from "./skeleton";
import { apiClient } from "../../lib/apiClient";

interface MediaItem {
  type: "image" | "video" | "audio" | "file" | "document";
  url: string;
  thumbnail?: string;
  filename?: string;
  size?: string | number;
  duration?: string;
}

interface CodeSnippet {
  language: string;
  code: string;
  filename?: string;
}

interface ThreadUser {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface ThreadReply {
  _id: string;
  content: string;
  user: ThreadUser;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

interface ThreadComment {
  _id: string;
  content: string;
  user: ThreadUser;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  replies: ThreadReply[];
}

export interface PostCardPost {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    username: string;
    profilePicture?: string;
    role?: string;
  };
  type: string;
  media?: MediaItem[];
  codeSnippets?: CodeSnippet[];
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  createdAt: string;
  isLiked?: boolean;
  isBookmarked?: boolean;
  tags?: string[];
  location?: string;
  mood?: string;
  isEdited?: boolean;
  viewCount?: number;
}

interface PostCardProps {
  post: PostCardPost;
  onLike?: (postId: string, isLiked: boolean, likeCount: number) => void;
  onComment?: (postId: string, commentCount: number) => void;
  onShare?: (postId: string, shareCount: number) => void;
  onBookmark?: (
    postId: string,
    isBookmarked: boolean,
    bookmarkCount: number
  ) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onViewProfile?: (username: string) => void;
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const CONTENT_PREVIEW_LIMIT = 360;

const highlightContent = (value: string) => {
  const tokens = value.split(/(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g);
  return tokens.map((token, index) => {
    if (/^#[a-zA-Z0-9_]+$/.test(token)) {
      return (
        <span
          key={`token-${index}`}
          className="font-medium text-social-700 bg-social-50 px-1 py-0.5 rounded"
        >
          {token}
        </span>
      );
    }

    if (/^@[a-zA-Z0-9_]+$/.test(token)) {
      return (
        <span
          key={`token-${index}`}
          className="font-medium text-coding-700 bg-coding-50 px-1 py-0.5 rounded"
        >
          {token}
        </span>
      );
    }

    return <React.Fragment key={`token-${index}`}>{token}</React.Fragment>;
  });
};

const normalizeReply = (reply: any): ThreadReply => {
  const likesValue = Array.isArray(reply?.likes)
    ? reply.likes.length
    : Number(reply?.likes || 0);

  return {
    _id: reply?._id || `reply-${Date.now()}`,
    content: reply?.content || "",
    user: {
      _id: reply?.user?._id || "",
      name: reply?.user?.name || "Unknown",
      username: reply?.user?.username || "unknown",
      profilePicture: reply?.user?.profilePicture,
    },
    createdAt: reply?.createdAt || new Date().toISOString(),
    likes: likesValue,
    isLiked: Boolean(reply?.isLiked),
  };
};

const normalizeComment = (comment: any): ThreadComment => {
  const likesValue = Array.isArray(comment?.likes)
    ? comment.likes.length
    : Number(comment?.likes || 0);

  return {
    _id: comment?._id || `comment-${Date.now()}`,
    content: comment?.content || "",
    user: {
      _id: comment?.user?._id || "",
      name: comment?.user?.name || "Unknown",
      username: comment?.user?.username || "unknown",
      profilePicture: comment?.user?.profilePicture,
    },
    createdAt: comment?.createdAt || new Date().toISOString(),
    likes: likesValue,
    isLiked: Boolean(comment?.isLiked),
    replies: Array.isArray(comment?.replies)
      ? comment.replies.map(normalizeReply)
      : [],
  };
};

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onDelete,
  onEdit,
  onReport,
  onViewProfile,
}) => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [isBookmarked, setIsBookmarked] = useState(Boolean(post.isBookmarked));
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmarks || 0);
  const [shareCount, setShareCount] = useState(post.shares || 0);
  const [commentCount, setCommentCount] = useState(post.comments || 0);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [showAllComments, setShowAllComments] = useState(false);

  const [commentDraft, setCommentDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(
    null
  );
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const [likePending, setLikePending] = useState(false);
  const [bookmarkPending, setBookmarkPending] = useState(false);
  const [sharePending, setSharePending] = useState(false);
  const [commentPending, setCommentPending] = useState(false);
  const [commentLikePendingMap, setCommentLikePendingMap] = useState<
    Record<string, boolean>
  >({});
  const [replyPendingMap, setReplyPendingMap] = useState<Record<string, boolean>>({});

  const [heartBurst, setHeartBurst] = useState(false);
  const [copiedSnippetKey, setCopiedSnippetKey] = useState<string | null>(null);
  const [highlightedThreadIds, setHighlightedThreadIds] = useState<Set<string>>(
    new Set()
  );
  const [isContentExpanded, setIsContentExpanded] = useState(false);

  const replyComposerRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setIsLiked(Boolean(post.isLiked));
    setLikeCount(post.likes || 0);
    setIsBookmarked(Boolean(post.isBookmarked));
    setBookmarkCount(post.bookmarks || 0);
    setShareCount(post.shares || 0);
    setCommentCount(post.comments || 0);
  }, [post]);

  useEffect(() => {
    setIsContentExpanded(false);
  }, [post.id]);

  const postContent = post.content || "";
  const shouldCollapseContent = postContent.length > CONTENT_PREVIEW_LIMIT;
  const visibleContent =
    shouldCollapseContent && !isContentExpanded
      ? `${postContent.slice(0, CONTENT_PREVIEW_LIMIT).trimEnd()}...`
      : postContent;

  const imageMedia = useMemo(
    () =>
      Array.isArray(post.media)
        ? post.media.filter((item) => item.type === "image")
        : [],
    [post.media]
  );

  const nonImageMedia = useMemo(
    () =>
      Array.isArray(post.media)
        ? post.media.filter((item) => item.type !== "image")
        : [],
    [post.media]
  );

  const addThreadHighlight = useCallback((threadId: string) => {
    setHighlightedThreadIds((prev) => {
      const next = new Set(prev);
      next.add(threadId);
      return next;
    });

    window.setTimeout(() => {
      setHighlightedThreadIds((prev) => {
        const next = new Set(prev);
        next.delete(threadId);
        return next;
      });
    }, 2200);
  }, []);

  const visibleComments = useMemo(() => {
    if (showAllComments) return comments;
    return comments.slice(0, 3);
  }, [comments, showAllComments]);

  const loadComments = useCallback(async () => {
    if (commentsLoading || commentsLoaded) {
      return;
    }

    setCommentsLoading(true);
    try {
      const response = await apiClient.fetch(
        `/social/posts/${post.id}/comments`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load comments");
      }

      const payload = await response.json();
      const fetchedComments = Array.isArray(payload?.data?.comments)
        ? payload.data.comments
        : Array.isArray(payload?.comments)
          ? payload.comments
          : [];

      const normalizedComments = fetchedComments.map(normalizeComment);
      setComments(normalizedComments);
      setCommentsLoaded(true);
      setCommentCount(normalizedComments.length);
      onComment?.(post.id, normalizedComments.length);
    } catch (err) {
      showError("Could not load comments", "Please try again.");
    } finally {
      setCommentsLoading(false);
    }
  }, [commentsLoaded, commentsLoading, onComment, post.id, showError]);

  const handleToggleComments = () => {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    if (nextOpen) {
      void loadComments();
    }
  };

  const handleLike = async () => {
    if (!user || likePending) {
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likeCount;
    const optimisticLiked = !previousLiked;
    const optimisticCount = optimisticLiked
      ? previousCount + 1
      : Math.max(0, previousCount - 1);

    setIsLiked(optimisticLiked);
    setLikeCount(optimisticCount);
    onLike?.(post.id, optimisticLiked, optimisticCount);

    if (optimisticLiked) {
      setHeartBurst(true);
      window.setTimeout(() => setHeartBurst(false), 240);
    }

    setLikePending(true);
    try {
      const response = await apiClient.fetch(
        `/social/posts/${post.id}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update like status");
      }

      const payload = await response.json();
      const serverLiked =
        typeof payload?.data?.isLiked === "boolean"
          ? payload.data.isLiked
          : optimisticLiked;
      const serverCount =
        typeof payload?.data?.likeCount === "number"
          ? payload.data.likeCount
          : optimisticCount;

      setIsLiked(serverLiked);
      setLikeCount(serverCount);
      onLike?.(post.id, serverLiked, serverCount);
    } catch (err) {
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      onLike?.(post.id, previousLiked, previousCount);
      showError("Like failed", "We rolled back that change.");
    } finally {
      setLikePending(false);
    }
  };

  const handleBookmark = async () => {
    if (!user || bookmarkPending) {
      return;
    }

    const previousBookmarked = isBookmarked;
    const previousCount = bookmarkCount;
    const optimisticBookmarked = !previousBookmarked;
    const optimisticCount = optimisticBookmarked
      ? previousCount + 1
      : Math.max(0, previousCount - 1);

    setIsBookmarked(optimisticBookmarked);
    setBookmarkCount(optimisticCount);
    onBookmark?.(post.id, optimisticBookmarked, optimisticCount);

    setBookmarkPending(true);
    try {
      const response = await apiClient.fetch(
        `/social/posts/${post.id}/bookmark`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update bookmark status");
      }

      const payload = await response.json();
      const serverBookmarked =
        typeof payload?.data?.isBookmarked === "boolean"
          ? payload.data.isBookmarked
          : optimisticBookmarked;
      const serverCount =
        typeof payload?.data?.bookmarkCount === "number"
          ? payload.data.bookmarkCount
          : optimisticCount;

      setIsBookmarked(serverBookmarked);
      setBookmarkCount(serverCount);
      onBookmark?.(post.id, serverBookmarked, serverCount);
    } catch (err) {
      setIsBookmarked(previousBookmarked);
      setBookmarkCount(previousCount);
      onBookmark?.(post.id, previousBookmarked, previousCount);
      showError("Bookmark failed", "We rolled back that change.");
    } finally {
      setBookmarkPending(false);
    }
  };

  const handleShare = async () => {
    if (!user || sharePending) {
      return;
    }

    const previousCount = shareCount;
    const optimisticCount = previousCount + 1;

    setShareCount(optimisticCount);
    onShare?.(post.id, optimisticCount);
    setSharePending(true);

    let linkCopied = false;
    const shareUrl = `${window.location.origin}/feed?post=${post.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      linkCopied = true;
    } catch {
      linkCopied = false;
    }

    try {
      const response = await apiClient.fetch(
        `/social/posts/${post.id}/share`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to share post");
      }

      const payload = await response.json();
      const serverCount =
        typeof payload?.data?.shareCount === "number"
          ? payload.data.shareCount
          : optimisticCount;

      setShareCount(serverCount);
      onShare?.(post.id, serverCount);
      success(
        "Post shared",
        linkCopied ? "Link copied to clipboard." : "Shared successfully."
      );
    } catch (err) {
      setShareCount(previousCount);
      onShare?.(post.id, previousCount);
      showError("Share failed", "We rolled back that change.");
    } finally {
      setSharePending(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!user || commentPending || !commentDraft.trim()) {
      return;
    }

    const tempCommentId = `temp-comment-${Date.now()}`;
    const optimisticComment: ThreadComment = {
      _id: tempCommentId,
      content: commentDraft.trim(),
      user: {
        _id: user.id,
        name: user.name,
        username: user.username || "you",
        profilePicture: user.profilePicture,
      },
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
      replies: [],
    };

    setCommentDraft("");
    setComments((prev) => [optimisticComment, ...prev]);
    setCommentCount((prev) => {
      const next = prev + 1;
      onComment?.(post.id, next);
      return next;
    });
    addThreadHighlight(tempCommentId);

    setCommentPending(true);
    try {
      const response = await apiClient.fetch(
        `/social/posts/${post.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ content: optimisticComment.content }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const payload = await response.json();
      const serverComment = normalizeComment(payload?.data?.comment || payload?.comment);

      setComments((prev) =>
        prev.map((comment) =>
          comment._id === tempCommentId ? serverComment : comment
        )
      );
      addThreadHighlight(serverComment._id);
      setCommentsLoaded(true);
      setShowAllComments(true);
    } catch (err) {
      setComments((prev) => prev.filter((comment) => comment._id !== tempCommentId));
      setCommentCount((prev) => {
        const next = Math.max(0, prev - 1);
        onComment?.(post.id, next);
        return next;
      });
      setCommentDraft(optimisticComment.content);
      showError("Comment failed", "We rolled back that change.");
    } finally {
      setCommentPending(false);
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user || commentLikePendingMap[commentId]) {
      return;
    }

    const targetComment = comments.find((comment) => comment._id === commentId);
    if (!targetComment) {
      return;
    }

    const previousLiked = targetComment.isLiked;
    const previousLikes = targetComment.likes;
    const optimisticLiked = !previousLiked;
    const optimisticLikes = optimisticLiked
      ? previousLikes + 1
      : Math.max(0, previousLikes - 1);

    setComments((prev) =>
      prev.map((comment) =>
        comment._id === commentId
          ? {
              ...comment,
              isLiked: optimisticLiked,
              likes: optimisticLikes,
            }
          : comment
      )
    );

    setCommentLikePendingMap((prev) => ({ ...prev, [commentId]: true }));
    try {
      const response = await apiClient.fetch(
        `/social/comments/${commentId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update comment like");
      }

      const payload = await response.json();
      const serverLiked =
        typeof payload?.data?.isLiked === "boolean"
          ? payload.data.isLiked
          : optimisticLiked;
      const serverLikes =
        typeof payload?.data?.likes === "number"
          ? payload.data.likes
          : optimisticLikes;

      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                isLiked: serverLiked,
                likes: serverLikes,
              }
            : comment
        )
      );
    } catch (err) {
      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                isLiked: previousLiked,
                likes: previousLikes,
              }
            : comment
        )
      );
      showError("Comment like failed", "We rolled back that change.");
    } finally {
      setCommentLikePendingMap((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    }
  };

  const openReplyComposer = (commentId: string) => {
    setActiveReplyCommentId(commentId);
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });

    window.setTimeout(() => {
      replyComposerRefs.current[commentId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!user || replyPendingMap[commentId]) {
      return;
    }

    const draft = (replyDrafts[commentId] || "").trim();
    if (!draft) {
      return;
    }

    const tempReplyId = `temp-reply-${Date.now()}`;
    const optimisticReply: ThreadReply = {
      _id: tempReplyId,
      content: draft,
      user: {
        _id: user.id,
        name: user.name,
        username: user.username || "you",
        profilePicture: user.profilePicture,
      },
      createdAt: new Date().toISOString(),
      likes: 0,
      isLiked: false,
    };

    setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }));
    setComments((prev) =>
      prev.map((comment) =>
        comment._id === commentId
          ? {
              ...comment,
              replies: [...comment.replies, optimisticReply],
            }
          : comment
      )
    );
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.add(commentId);
      return next;
    });
    addThreadHighlight(tempReplyId);

    setReplyPendingMap((prev) => ({ ...prev, [commentId]: true }));
    try {
      const response = await apiClient.fetch(
        `/social/posts/${post.id}/comments/${commentId}/replies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ content: draft }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add reply");
      }

      const payload = await response.json();
      const serverReply = normalizeReply(payload?.data?.reply || {});

      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply._id === tempReplyId ? serverReply : reply
                ),
              }
            : comment
        )
      );
      addThreadHighlight(serverReply._id);
    } catch (err) {
      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                replies: comment.replies.filter(
                  (reply) => reply._id !== tempReplyId
                ),
              }
            : comment
        )
      );
      setReplyDrafts((prev) => ({ ...prev, [commentId]: draft }));
      showError("Reply failed", "We rolled back that change.");
    } finally {
      setReplyPendingMap((prev) => {
        const next = { ...prev };
        delete next[commentId];
        return next;
      });
    }
  };

  const copyCode = async (snippetKey: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSnippetKey(snippetKey);
      success("Code copied", "Snippet copied to clipboard.");
      window.setTimeout(() => setCopiedSnippetKey(null), 1200);
    } catch (err) {
      showError("Copy failed", "Could not copy code snippet.");
    }
  };

  const handleProfileNavigation = useCallback(
    (username?: string, userId?: string) => {
      const normalizedUsername = (username || "").trim();
      const normalizedUserId = (userId || "").trim();

      const target =
        normalizedUsername && normalizedUsername !== "unknown"
          ? normalizedUsername
          : normalizedUserId;

      if (!target) {
        return;
      }

      onViewProfile?.(target);
    },
    [onViewProfile]
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card via-card to-muted/20 shadow-[0_20px_40px_-28px_rgba(15,23,42,0.6)]"
    >
      <div className="h-1 w-full bg-gradient-to-r from-social-500 via-navy-500 to-coding-500" />

      <header className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            className="h-11 w-11 cursor-pointer ring-1 ring-border"
            onClick={() => handleProfileNavigation(post.author.username, post.author.id)}
          >
            <AvatarImage src={post.author.profilePicture} />
            <AvatarFallback className="bg-social-100 text-social-700 font-semibold">
              {(post.author.name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <button
              type="button"
              onClick={() => handleProfileNavigation(post.author.username, post.author.id)}
              className="font-semibold text-foreground text-sm hover:underline truncate"
            >
              {post.author.name}
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="truncate">@{post.author.username}</span>
              <span>•</span>
              <span>{formatTimeAgo(post.createdAt)}</span>
              {post.isEdited && <span>• Edited</span>}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="rounded-full">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {user?.id === post.author.id && (
              <>
                <DropdownMenuItem onClick={() => onEdit?.(post.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(post.id)}
                  className="text-red-600 focus:text-red-600"
                >
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
      </header>

      <div className="px-5 pt-4">
        <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-foreground/95 tracking-[0.01em]">
          {highlightContent(visibleContent)}
        </p>

        {shouldCollapseContent && (
          <button
            type="button"
            onClick={() => setIsContentExpanded((prev) => !prev)}
            className="mt-2 text-xs font-semibold text-social-700 hover:text-social-800 transition-colors"
          >
            {isContentExpanded ? "Show less" : "Read more"}
          </button>
        )}

        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.slice(0, 8).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {imageMedia.length > 0 && (
        <div className="px-5 pt-4 space-y-3">
          <div
            className={cn(
              "grid gap-2",
              imageMedia.length === 1 && "grid-cols-1",
              imageMedia.length === 2 && "grid-cols-2",
              imageMedia.length >= 3 && "grid-cols-2 md:grid-cols-3"
            )}
          >
            {imageMedia.map((mediaItem, index) => (
              <div
                key={`${post.id}-image-media-${index}`}
                className={cn(
                  "rounded-xl border overflow-hidden bg-muted/30",
                  imageMedia.length >= 3 && index === 0 && "md:col-span-2"
                )}
              >
                <img
                  src={mediaItem.url}
                  alt={mediaItem.filename || "Post media"}
                  className="w-full h-52 md:h-64 object-cover transition-transform duration-300 hover:scale-[1.02]"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {nonImageMedia.length > 0 && (
        <div className="px-5 pt-4 space-y-3">
          {nonImageMedia.map((mediaItem, index) => (
            <div key={`${post.id}-media-${index}`} className="rounded-xl border overflow-hidden bg-muted/30">
              {mediaItem.type === "video" && (
                <video src={mediaItem.url} controls className="w-full max-h-[460px] object-contain bg-black" />
              )}
              {mediaItem.type === "audio" && (
                <div className="p-4">
                  <audio src={mediaItem.url} controls className="w-full" />
                </div>
              )}
              {(mediaItem.type === "file" || mediaItem.type === "document") && (
                <div className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{mediaItem.filename || "Attachment"}</p>
                    <p className="text-xs text-muted-foreground">{mediaItem.size || "File"}</p>
                  </div>
                  <a href={mediaItem.url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">
                      Open
                    </Button>
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {Array.isArray(post.codeSnippets) && post.codeSnippets.length > 0 && (
        <div className="px-5 pt-4 space-y-3">
          {post.codeSnippets.map((snippet, index) => {
            const snippetKey = `${snippet.language}-${index}`;
            return (
              <div
                key={`${post.id}-snippet-${index}`}
                className="overflow-hidden rounded-xl border border-border"
              >
                <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <Code className="h-4 w-4 text-coding-600" />
                    <span className="text-xs uppercase font-semibold tracking-wide">
                      {snippet.language}
                    </span>
                    {snippet.filename && (
                      <span className="text-xs text-muted-foreground truncate">
                        {snippet.filename}
                      </span>
                    )}
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => copyCode(snippetKey, snippet.code)}
                    className="rounded-full"
                  >
                    {copiedSnippetKey === snippetKey ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <SyntaxHighlighter
                  language={snippet.language || "javascript"}
                  style={atomDark}
                  customStyle={{ margin: 0, borderRadius: 0, fontSize: "13px" }}
                >
                  {snippet.code || ""}
                </SyntaxHighlighter>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 border-t border-border/70 bg-gradient-to-r from-muted/30 via-background to-muted/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={likePending}
              className={cn(
                "h-9 px-3 gap-2 rounded-full transition-all duration-200 active:scale-95",
                isLiked
                  ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="relative">
                <Heart className={cn("h-4.5 w-4.5", isLiked && "fill-current")} />
                <AnimatePresence>
                  {heartBurst && (
                    <motion.span
                      initial={{ opacity: 0.7, scale: 1 }}
                      animate={{ opacity: 0, scale: 2.1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0"
                    >
                      <Heart className="h-4.5 w-4.5 fill-current text-red-500" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className="text-sm font-medium">{likeCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleComments}
              className="h-9 px-3 gap-2 rounded-full text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95"
            >
              <MessageCircle className="h-4.5 w-4.5" />
              <span className="text-sm font-medium">{commentCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              disabled={sharePending}
              className="h-9 px-3 gap-2 rounded-full text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95"
            >
              {sharePending ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <Share2 className="h-4.5 w-4.5" />
              )}
              <span className="text-sm font-medium">{shareCount}</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            disabled={bookmarkPending}
            className={cn(
              "h-9 px-3 gap-2 rounded-full transition-all duration-200 active:scale-95",
              isBookmarked
                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {bookmarkPending ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Bookmark className={cn("h-4.5 w-4.5", isBookmarked && "fill-current")} />
            )}
            <span className="text-sm font-medium">{bookmarkCount}</span>
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {commentsOpen && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border/70"
          >
            <div className="p-4 space-y-4 bg-card">
              {commentsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={`comment-skeleton-${index}`} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-sm">
                  No comments yet. Start the conversation.
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {visibleComments.map((comment) => {
                      const repliesExpanded = expandedReplies.has(comment._id);
                      const commentLikePending = Boolean(commentLikePendingMap[comment._id]);
                      const replyPending = Boolean(replyPendingMap[comment._id]);

                      return (
                        <motion.div
                          key={comment._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "rounded-xl border p-3 transition-colors",
                            highlightedThreadIds.has(comment._id)
                              ? "border-social-300 bg-social-50/70"
                              : "border-border bg-muted/10"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              onClick={() =>
                                handleProfileNavigation(comment.user.username, comment.user._id)
                              }
                              title={`Open @${comment.user.username} profile`}
                            >
                              <Avatar className="h-8 w-8 ring-1 ring-border transition-transform hover:scale-105">
                                <AvatarImage src={comment.user.profilePicture} />
                                <AvatarFallback>
                                  {(comment.user.name || "U").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleProfileNavigation(comment.user.username, comment.user._id)
                                  }
                                  className="font-semibold text-foreground hover:underline"
                                >
                                  {comment.user.name}
                                </button>
                                <span>@{comment.user.username}</span>
                                <span>•</span>
                                <span>{formatTimeAgo(comment.createdAt)}</span>
                              </div>

                              <p className="mt-1 text-sm leading-relaxed break-words text-foreground/95">
                                {comment.content}
                              </p>

                              <div className="mt-2 flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={commentLikePending}
                                  onClick={() => toggleCommentLike(comment._id)}
                                  className={cn(
                                    "h-7 px-2.5 gap-1 rounded-full text-xs",
                                    comment.isLiked
                                      ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {commentLikePending ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Heart
                                      className={cn(
                                        "h-3.5 w-3.5",
                                        comment.isLiked && "fill-current"
                                      )}
                                    />
                                  )}
                                  {comment.likes}
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openReplyComposer(comment._id)}
                                  className="h-7 px-2.5 gap-1 rounded-full text-xs text-muted-foreground"
                                >
                                  <Reply className="h-3.5 w-3.5" />
                                  Reply
                                </Button>

                                {comment.replies.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleReplies(comment._id)}
                                    className="h-7 px-2.5 gap-1 rounded-full text-xs text-social-700"
                                  >
                                    {repliesExpanded ? (
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    )}
                                    {repliesExpanded
                                      ? "Hide replies"
                                      : `${comment.replies.length} repl${comment.replies.length > 1 ? "ies" : "y"}`}
                                  </Button>
                                )}
                              </div>

                              <AnimatePresence>
                                {repliesExpanded && comment.replies.length > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-3 pl-3 border-l-2 border-border space-y-2"
                                  >
                                    {comment.replies.map((reply) => (
                                      <motion.div
                                        key={reply._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                          "rounded-lg border px-3 py-2",
                                          highlightedThreadIds.has(reply._id)
                                            ? "border-social-300 bg-social-50/70"
                                            : "border-border bg-background"
                                        )}
                                      >
                                        <div className="flex items-start gap-2.5">
                                          <button
                                            type="button"
                                            className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            onClick={() =>
                                              handleProfileNavigation(reply.user.username, reply.user._id)
                                            }
                                            title={`Open @${reply.user.username} profile`}
                                          >
                                            <Avatar className="h-7 w-7 ring-1 ring-border transition-transform hover:scale-105">
                                              <AvatarImage src={reply.user.profilePicture} />
                                              <AvatarFallback>
                                                {(reply.user.name || "U").charAt(0).toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                          </button>

                                          <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleProfileNavigation(
                                                    reply.user.username,
                                                    reply.user._id
                                                  )
                                                }
                                                className="font-semibold text-foreground hover:underline"
                                              >
                                                {reply.user.name}
                                              </button>
                                              <span>@{reply.user.username}</span>
                                              <span>•</span>
                                              <span>{formatTimeAgo(reply.createdAt)}</span>
                                            </div>
                                            <p className="mt-1 text-sm break-words">{reply.content}</p>
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <AnimatePresence>
                                {activeReplyCommentId === comment._id && (
                                  <motion.div
                                    ref={(node) => {
                                      replyComposerRefs.current[comment._id] = node;
                                    }}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.18 }}
                                    className="mt-3 rounded-xl border border-border bg-background p-3"
                                  >
                                    <Textarea
                                      value={replyDrafts[comment._id] || ""}
                                      onChange={(event) =>
                                        setReplyDrafts((prev) => ({
                                          ...prev,
                                          [comment._id]: event.target.value,
                                        }))
                                      }
                                      placeholder={`Reply to ${comment.user.name}...`}
                                      className="min-h-[72px]"
                                    />
                                    <div className="mt-2 flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setActiveReplyCommentId(null)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        disabled={
                                          replyPending ||
                                          !(replyDrafts[comment._id] || "").trim()
                                        }
                                        onClick={() => handleReplySubmit(comment._id)}
                                      >
                                        {replyPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <>
                                            <Send className="h-4 w-4 mr-1.5" />
                                            Reply
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {comments.length > 3 && (
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAllComments((prev) => !prev)}
                        className="text-xs"
                      >
                        {showAllComments
                          ? "Show fewer comments"
                          : `Show ${comments.length - 3} more comments`}
                      </Button>
                    </div>
                  )}
                </>
              )}

              <div className="rounded-xl border border-border bg-muted/10 p-3">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => handleProfileNavigation(user?.username, user?.id)}
                    title="Open your profile"
                  >
                    <Avatar className="h-8 w-8 ring-1 ring-border transition-transform hover:scale-105">
                      <AvatarImage src={user?.profilePicture} />
                      <AvatarFallback>
                        {(user?.name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  <div className="flex-1">
                    <Textarea
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      placeholder="Write a comment..."
                      className="min-h-[84px]"
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          (event.ctrlKey || event.metaKey)
                        ) {
                          event.preventDefault();
                          void handleCommentSubmit();
                        }
                      }}
                    />

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-[11px] text-muted-foreground">
                        Press Ctrl/Cmd + Enter to post quickly
                      </p>
                      <Button
                        size="sm"
                        onClick={handleCommentSubmit}
                        disabled={commentPending || !commentDraft.trim()}
                        className="rounded-full"
                      >
                        {commentPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1.5" />
                            Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

export default PostCard;
