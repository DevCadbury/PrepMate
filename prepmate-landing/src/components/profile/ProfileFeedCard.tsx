import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreVertical,
  Trash2,
  Code,
  Send,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Heart,
  Bookmark,
} from "lucide-react";
import { commentsApi } from "../../services/api/commentsApi";
import { socialApi } from "../../services/api/socialApi";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../ui/toast";
import { CommentSkeleton } from "./ProfileSkeletons";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Reply {
  _id: string;
  user: { _id: string; name: string; username?: string; profilePicture?: string };
  content: string;
  likes: string[];
  createdAt: string;
}

interface Comment {
  _id: string;
  user: { _id: string; name: string; username?: string; profilePicture?: string };
  content: string;
  likes: string[];
  replies: Reply[];
  createdAt: string;
  isNew?: boolean;
}

interface ProfileFeedCardProps {
  post: any;
  profileData: any;
  isOwner: boolean;
  userId?: string;
  canComment?: boolean;
  onDelete?: (postId: string) => void;
  onPostUpdated?: () => void;
  onImagePreview?: (url: string) => void;
}

// ─── Time Formatting ────────────────────────────────────────────────────────

const formatTimeAgo = (dateStr: string): string => {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─── Avatar Component ───────────────────────────────────────────────────────

const UserAvatar = ({ user, size = "md" }: { user: any; size?: "sm" | "md" }) => {
  const sizeClasses = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return (
    <div className={`${sizeClasses} rounded-full overflow-hidden border border-border/50 flex-shrink-0 bg-accent`}>
      {user?.profilePicture ? (
        <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
          {user?.name?.charAt(0) || "U"}
        </div>
      )}
    </div>
  );
};

// ─── Single Reply Component ─────────────────────────────────────────────────

const ReplyItem = memo(({ reply, userId, onLikeReply }: { reply: Reply; userId?: string; onLikeReply: (replyId: string) => void }) => {
  const isLiked = userId ? reply.likes?.includes(userId) : false;
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-2.5 py-2.5 group"
    >
      <UserAvatar user={reply.user} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="bg-accent/40 rounded-xl px-3.5 py-2.5">
          <span className="text-[13px] font-semibold text-foreground">{reply.user?.name}</span>
          <p className="text-[13px] text-foreground/85 leading-relaxed mt-0.5">{reply.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-[11px] text-muted-foreground">{formatTimeAgo(reply.createdAt)}</span>
          <button
            onClick={() => onLikeReply(reply._id)}
            className={`text-[11px] font-semibold transition-colors ${isLiked ? "text-blue-500" : "text-muted-foreground hover:text-blue-500"}`}
          >
            Like{reply.likes?.length > 0 ? ` · ${reply.likes.length}` : ""}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// ─── Single Comment Component (with nested replies) ─────────────────────────

const CommentItem = memo(({
  comment,
  userId,
  onLikeComment,
  onReply,
  onLikeReply,
}: {
  comment: Comment;
  userId?: string;
  onLikeComment: (commentId: string) => void;
  onReply: (commentId: string, content: string) => Promise<void>;
  onLikeReply: (commentId: string, replyId: string) => void;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const isLiked = userId ? comment.likes?.includes(userId) : false;

  useEffect(() => {
    if (showReplyInput && replyInputRef.current) {
      replyInputRef.current.focus();
    }
  }, [showReplyInput]);

  const handleSubmitReply = async () => {
    if (!replyText.trim() || isSubmittingReply) return;
    setIsSubmittingReply(true);
    try {
      await onReply(comment._id, replyText.trim());
      setReplyText("");
      setShowReplies(true);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitReply();
    }
  };

  return (
    <motion.div
      initial={comment.isNew ? { opacity: 0, y: -10, backgroundColor: "hsl(var(--accent))" } : { opacity: 1 }}
      animate={{ opacity: 1, y: 0, backgroundColor: "transparent" }}
      transition={{ duration: 0.4 }}
      className="py-2"
    >
      <div className="flex gap-2.5 group">
        <UserAvatar user={comment.user} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="bg-accent/40 rounded-xl px-3.5 py-2.5">
            <span className="text-[13px] font-semibold text-foreground">{comment.user?.name}</span>
            <p className="text-[13px] text-foreground/85 leading-relaxed mt-0.5">{comment.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 px-1">
            <span className="text-[11px] text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
            <button
              onClick={() => onLikeComment(comment._id)}
              className={`text-[11px] font-semibold transition-colors ${isLiked ? "text-blue-500" : "text-muted-foreground hover:text-blue-500"}`}
            >
              Like{comment.likes?.length > 0 ? ` · ${comment.likes.length}` : ""}
            </button>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-[11px] font-semibold text-muted-foreground hover:text-blue-500 transition-colors"
            >
              Reply
            </button>
          </div>

          {/* Replies Thread */}
          {comment.replies?.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-500 hover:text-blue-600 transition-colors pl-1"
              >
                <CornerDownRight className="w-3 h-3" />
                {showReplies ? "Hide" : "View"} {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <AnimatePresence>
                {showReplies && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pl-4 border-l-2 border-border/40 ml-2 mt-1 overflow-hidden"
                  >
                    {comment.replies.map((reply) => (
                      <ReplyItem
                        key={reply._id}
                        reply={reply}
                        userId={userId}
                        onLikeReply={(replyId) => onLikeReply(comment._id, replyId)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Reply Input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mt-2 flex items-center gap-2 overflow-hidden"
              >
                <input
                  ref={replyInputRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a reply..."
                  className="flex-1 bg-accent/40 border-0 rounded-full px-4 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
                <button
                  onClick={handleSubmitReply}
                  disabled={!replyText.trim() || isSubmittingReply}
                  className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-90"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

// ─── Main Feed Card Component ───────────────────────────────────────────────

const ProfileFeedCard: React.FC<ProfileFeedCardProps> = memo(({
  post,
  profileData,
  isOwner,
  userId,
  canComment = true,
  onDelete,
  onPostUpdated,
  onImagePreview,
}) => {
  const { success, error: showError } = useToast();

  // Optimistic like state
  const [isLiked, setIsLiked] = useState(() => {
    if (!userId) return false;
    if (Array.isArray(post.likes)) {
      return post.likes.some((l: any) => (typeof l === "string" ? l : l?.user || l?._id) === userId);
    }
    return false;
  });
  const [likeCount, setLikeCount] = useState(() => {
    return post.likesCount || post.likes?.length || 0;
  });
  const [likeAnimating, setLikeAnimating] = useState(false);

  // Comment state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const commentCount = post.comments?.length || post.commentCount || 0;

  // ─── Fetch Comments ─────────────────────────────────────────────────────
  const fetchComments = useCallback(async () => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const commentsPayload = await commentsApi.getPostComments(post._id);
      setComments(commentsPayload);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoadingComments(false);
    }
  }, [post._id, loadingComments]);

  useEffect(() => {
    if (showComments && comments.length === 0) {
      void fetchComments();
    }
  }, [comments.length, fetchComments, showComments]);

  // ─── Optimistic Like ────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!userId || !canComment) return;
    const prevLiked = isLiked;
    const prevCount = likeCount;

    // Optimistic update
    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);
    if (!prevLiked) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 600);
    }

    try {
      await socialApi.togglePostLike(post._id);
    } catch {
      // Rollback
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      showError("Failed to update", "Please try again.");
    }
  };

  // ─── Add Comment (Optimistic) ───────────────────────────────────────────
  const handleAddComment = async () => {
    if (!commentText.trim() || submittingComment || !userId) return;
    setSubmittingComment(true);

    const optimisticComment: Comment = {
      _id: `temp-${Date.now()}`,
      user: { _id: userId, name: profileData?.name || "You", profilePicture: profileData?.profilePicture },
      content: commentText.trim(),
      likes: [],
      replies: [],
      createdAt: new Date().toISOString(),
      isNew: true,
    };

    setComments((prev) => [optimisticComment, ...prev]);
    setCommentText("");

    try {
      const createdComment = await commentsApi.addComment(post._id, optimisticComment.content);
      if (!createdComment) {
        throw new Error("Failed");
      }

      // Replace optimistic with real
      setComments((prev) =>
        prev.map((c) =>
          c._id === optimisticComment._id
            ? { ...createdComment, isNew: true }
            : c
        )
      );
      onPostUpdated?.();
    } catch {
      // Rollback
      setComments((prev) => prev.filter((c) => c._id !== optimisticComment._id));
      showError("Comment failed", "Could not post your comment. Try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  // ─── Like Comment (Optimistic) ──────────────────────────────────────────
  const handleLikeComment = async (commentId: string) => {
    if (!userId) return;
    setComments((prev) =>
      prev.map((c) =>
        c._id === commentId
          ? {
              ...c,
              likes: c.likes.includes(userId)
                ? c.likes.filter((id) => id !== userId)
                : [...c.likes, userId],
            }
          : c
      )
    );
    try {
      await commentsApi.toggleCommentLike(commentId);
    } catch {
      // Rollback: refetch
      void fetchComments();
    }
  };

  // ─── Reply to Comment (Optimistic) ──────────────────────────────────────
  const handleReply = async (commentId: string, content: string) => {
    if (!userId) return;
    const optimisticReply: Reply = {
      _id: `temp-reply-${Date.now()}`,
      user: { _id: userId, name: profileData?.name || "You", profilePicture: profileData?.profilePicture },
      content,
      likes: [],
      createdAt: new Date().toISOString(),
    };

    setComments((prev) =>
      prev.map((c) => (c._id === commentId ? { ...c, replies: [...(c.replies || []), optimisticReply] } : c))
    );

    try {
      const realReply = await commentsApi.addReply(commentId, content);
      if (!realReply) {
        throw new Error();
      }

      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? {
                ...c,
                replies: c.replies.map((r) =>
                  r._id === optimisticReply._id
                    ? { ...realReply, user: optimisticReply.user }
                    : r
                ),
              }
            : c
        )
      );
    } catch {
      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? { ...c, replies: c.replies.filter((r) => r._id !== optimisticReply._id) }
            : c
        )
      );
      showError("Reply failed", "Could not post your reply.");
    }
  };

  // ─── Like Reply (Optimistic) ────────────────────────────────────────────
  const handleLikeReply = async (commentId: string, replyId: string) => {
    // For now just optimistic toggle in UI — backend route for reply like can be added later
    if (!userId) return;
    setComments((prev) =>
      prev.map((c) =>
        c._id === commentId
          ? {
              ...c,
              replies: c.replies.map((r) =>
                r._id === replyId
                  ? { ...r, likes: r.likes?.includes(userId) ? r.likes.filter((id) => id !== userId) : [...(r.likes || []), userId] }
                  : r
              ),
            }
          : c
      )
    );
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 group"
    >
      <div className="p-5 md:p-6">
        {/* ── Post Header ── */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <UserAvatar user={profileData} />
            <div className="flex flex-col">
              <h4 className="text-[14px] font-semibold text-foreground leading-tight">{profileData?.name}</h4>
              <span className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                {formatTimeAgo(post.createdAt || new Date().toISOString())}
                <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/40" />
                {post.type === "question" ? "Asked a question" : post.type === "resource" ? "Shared a resource" : post.type === "code" ? "Shared code" : "Posted an update"}
              </span>
            </div>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 active:scale-90">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-border/50 bg-background/95 backdrop-blur-md shadow-xl min-w-[140px]">
                <DropdownMenuItem
                  onClick={() => onDelete?.(post._id)}
                  className="text-red-500 font-semibold focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-900/30 cursor-pointer text-[13px] py-2"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* ── Post Content ── */}
        <div className="text-foreground text-[14px] leading-relaxed mb-4 whitespace-pre-wrap">
          {post.content}
        </div>

        {/* ── Post Image ── */}
        {post.image && (
          <div
            className="w-full rounded-xl overflow-hidden border border-border/50 bg-accent/20 mb-4 cursor-pointer group/img"
            onClick={() => onImagePreview?.(post.image)}
          >
            <img
              src={post.image}
              alt="Post attachment"
              className="w-full h-auto object-cover max-h-[420px] group-hover/img:scale-[1.01] transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}

        {/* ── Code Snippet ── */}
        {post.codeSnippet && (
          <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-4 mb-4 overflow-x-auto relative group/code">
            <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-0 group-hover/code:opacity-100 transition-opacity">
              <button
                onClick={() => { navigator.clipboard.writeText(post.codeSnippet); success("Copied", "Code copied to clipboard."); }}
                className="px-2.5 py-1 rounded-md bg-gray-800 text-gray-400 hover:text-gray-200 text-[11px] font-medium transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="text-[13px] font-mono text-gray-300 leading-relaxed"><code>{post.codeSnippet}</code></pre>
          </div>
        )}

        {/* ── Action Bar ── */}
        <div className="flex items-center pt-3 mt-1 border-t border-border/40">
          {/* Like Button */}
          <motion.button
            onClick={handleLike}
            whileTap={{ scale: 0.9 }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-[13px] transition-colors ${
              isLiked ? "text-blue-500 bg-blue-500/10" : "text-muted-foreground hover:bg-accent hover:text-blue-500"
            }`}
          >
            <motion.div animate={likeAnimating ? { scale: [1, 1.4, 1] } : {}} transition={{ duration: 0.3 }}>
              <ThumbsUp className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </motion.div>
            <span>{likeCount}</span>
          </motion.button>

          {/* Comment Toggle */}
          <button
            onClick={() => { setShowComments(!showComments); if (!showComments) setTimeout(() => commentInputRef.current?.focus(), 200); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-[13px] text-muted-foreground hover:bg-accent hover:text-blue-500 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{comments.length || commentCount}</span>
          </button>

          {/* Share */}
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); success("Link copied", "Post link copied to clipboard."); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-[13px] text-muted-foreground hover:bg-accent hover:text-blue-500 transition-colors ml-auto"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* ── Comments Section ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/40 overflow-hidden"
          >
            <div className="p-5 pt-4">
              {/* Comment Input */}
              {canComment && (
                <div className="flex items-center gap-3 mb-4">
                  <UserAvatar user={{ name: profileData?.name, profilePicture: profileData?.profilePicture }} size="sm" />
                  <div className="flex-1 flex items-center gap-2 bg-accent/40 rounded-full pr-1.5 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all">
                    <input
                      ref={commentInputRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={handleCommentKeyDown}
                      placeholder="Write a comment..."
                      className="flex-1 bg-transparent border-0 px-4 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || submittingComment}
                      className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90 flex-shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              {loadingComments ? (
                <div className="space-y-1">
                  <CommentSkeleton />
                  <CommentSkeleton />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-[13px] text-muted-foreground py-4">No comments yet. Be the first to share your thoughts.</p>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment._id}
                      comment={comment}
                      userId={userId}
                      onLikeComment={handleLikeComment}
                      onReply={handleReply}
                      onLikeReply={handleLikeReply}
                    />
                  ))}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
});

export default ProfileFeedCard;
