import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";
import {
  AlertCircle,
  Hash,
  MessageCircle,
  RefreshCcw,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import PostCard, { PostCardPost } from "../../ui/post-card";
import PostCreator from "../../ui/post-creator";
import { useToast } from "../../ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import { feedApi } from "../../../services/api/feedApi";

interface FeedUser {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface FeedPost {
  _id: string;
  content: string;
  type?: string;
  media?: any[];
  codeSnippets?: any[];
  user: FeedUser;
  likes?: Array<{ user: string | { _id: string } } | string>;
  comments?: Array<any>;
  shares?: Array<any>;
  bookmarks?: Array<any>;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  bookmarkCount?: number;
  tags?: string[];
  location?: string;
  mood?: string;
  isEdited?: boolean;
  viewCount?: number;
}

interface PostCreatedMeta {
  optimistic?: boolean;
  replaceId?: string;
  removeId?: string;
}

const INITIAL_VISIBLE_POSTS = 6;
const VISIBLE_INCREMENT = 4;

const toArrayCount = (value: unknown) => (Array.isArray(value) ? value.length : 0);

const extractUserIdFromEntity = (entity: any): string => {
  if (!entity) return "";
  if (typeof entity === "string") return entity;
  if (typeof entity.user === "string") return entity.user;
  if (entity.user?._id) return entity.user._id;
  if (entity._id) return entity._id;
  return "";
};

const getPostLikeCount = (post: FeedPost) =>
  typeof post.likeCount === "number" ? post.likeCount : toArrayCount(post.likes);

const getPostCommentCount = (post: FeedPost) =>
  typeof post.commentCount === "number" ? post.commentCount : toArrayCount(post.comments);

const getPostShareCount = (post: FeedPost) =>
  typeof post.shareCount === "number" ? post.shareCount : toArrayCount(post.shares);

const getPostBookmarkCount = (post: FeedPost) =>
  typeof post.bookmarkCount === "number"
    ? post.bookmarkCount
    : toArrayCount(post.bookmarks);

const isPostLikedByUser = (post: FeedPost, currentUserId?: string) => {
  if (!currentUserId || !Array.isArray(post.likes)) return false;
  return post.likes.some((like) => extractUserIdFromEntity(like) === currentUserId);
};

const isPostBookmarkedByUser = (post: FeedPost, currentUserId?: string) => {
  if (!currentUserId || !Array.isArray(post.bookmarks)) return false;
  return post.bookmarks.some(
    (bookmark) => extractUserIdFromEntity(bookmark) === currentUserId
  );
};

const mapPostForCard = (post: FeedPost, currentUserId?: string): PostCardPost => ({
  id: post._id,
  content: post.content,
  author: {
    id: post.user?._id || "unknown",
    name: post.user?.name || "Unknown",
    username: post.user?.username || "unknown",
    profilePicture: post.user?.profilePicture,
    role: "user",
  },
  type: post.type || "text",
  media: post.media || [],
  codeSnippets: post.codeSnippets || [],
  likes: getPostLikeCount(post),
  comments: getPostCommentCount(post),
  shares: getPostShareCount(post),
  bookmarks: getPostBookmarkCount(post),
  createdAt: post.createdAt,
  isLiked: isPostLikedByUser(post, currentUserId),
  isBookmarked: isPostBookmarkedByUser(post, currentUserId),
  tags: post.tags || [],
  location: post.location,
  mood: post.mood,
  isEdited: post.isEdited,
  viewCount: post.viewCount,
});

const FeedPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_POSTS);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async (options?: { silent?: boolean; force?: boolean }) => {
    const silent = options?.silent === true;
    const force = options?.force === true;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const incomingPosts = await feedApi.getFeedPosts({ force });
      setPosts(incomingPosts);
      setVisibleCount((prev) =>
        Math.min(Math.max(prev, INITIAL_VISIBLE_POSTS), Math.max(incomingPosts.length, INITIAL_VISIBLE_POSTS))
      );
    } catch (err: any) {
      setError(err?.message || "Could not load feed posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const node = loadMoreSentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + VISIBLE_INCREMENT, posts.length)
          );
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [posts.length]);

  const updatePostLocally = useCallback(
    (postId: string, updater: (post: FeedPost) => FeedPost) => {
      setPosts((prev) =>
        prev.map((post) => (post._id === postId ? updater(post) : post))
      );
    },
    []
  );

  const handleLikeSync = useCallback(
    (postId: string, isLiked: boolean, likeCount: number) => {
      updatePostLocally(postId, (post) => {
        const nextLikes = Array.isArray(post.likes) ? [...post.likes] : [];
        const currentUserId = user?.id;
        if (currentUserId) {
          const alreadyLiked = nextLikes.some(
            (like) => extractUserIdFromEntity(like) === currentUserId
          );
          if (isLiked && !alreadyLiked) {
            nextLikes.unshift({ user: currentUserId });
          }
          if (!isLiked && alreadyLiked) {
            const filtered = nextLikes.filter(
              (like) => extractUserIdFromEntity(like) !== currentUserId
            );
            return {
              ...post,
              likes: filtered,
              likeCount,
            };
          }
        }

        return {
          ...post,
          likes: nextLikes,
          likeCount,
        };
      });
    },
    [updatePostLocally, user?.id]
  );

  const handleCommentSync = useCallback(
    (postId: string, commentCount: number) => {
      updatePostLocally(postId, (post) => ({
        ...post,
        commentCount,
      }));
    },
    [updatePostLocally]
  );

  const handleShareSync = useCallback(
    (postId: string, shareCount: number) => {
      updatePostLocally(postId, (post) => ({
        ...post,
        shareCount,
      }));
    },
    [updatePostLocally]
  );

  const handleBookmarkSync = useCallback(
    (postId: string, isBookmarked: boolean, bookmarkCount: number) => {
      updatePostLocally(postId, (post) => {
        const nextBookmarks = Array.isArray(post.bookmarks)
          ? [...post.bookmarks]
          : [];
        const currentUserId = user?.id;

        if (currentUserId) {
          const alreadyBookmarked = nextBookmarks.some(
            (bookmark) => extractUserIdFromEntity(bookmark) === currentUserId
          );
          if (isBookmarked && !alreadyBookmarked) {
            nextBookmarks.unshift({ user: currentUserId });
          }
          if (!isBookmarked && alreadyBookmarked) {
            const filtered = nextBookmarks.filter(
              (bookmark) => extractUserIdFromEntity(bookmark) !== currentUserId
            );
            return {
              ...post,
              bookmarks: filtered,
              bookmarkCount,
            };
          }
        }

        return {
          ...post,
          bookmarks: nextBookmarks,
          bookmarkCount,
        };
      });
    },
    [updatePostLocally, user?.id]
  );

  const handleDeletePost = useCallback(
    (postId: string) => {
      if (!user?.id) {
        showError("Authentication required", "Please log in to delete posts.");
        return;
      }
      setPostToDelete(postId);
      setShowDeleteDialog(true);
    },
    [showError, user?.id]
  );

  const confirmDeletePost = async () => {
    if (!postToDelete) return;

    try {
      await feedApi.deletePost(postToDelete);

      setPosts((prev) => prev.filter((post) => post._id !== postToDelete));
      success("Post deleted", "Your post has been removed.");
    } catch (err: any) {
      showError("Delete failed", err?.message || "Please try again.");
    } finally {
      setPostToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleReportPost = (_postId: string) => {
    success("Thanks for reporting", "We will review this post.");
  };

  const handlePostCreated = useCallback(
    (newPost: any, meta?: PostCreatedMeta) => {
      feedApi.clearCache();

      if (meta?.removeId) {
        setPosts((prev) => prev.filter((post) => post._id !== meta.removeId));
        return;
      }

      if (!newPost?._id || !newPost?.user) {
        void fetchPosts({ silent: true, force: true });
        return;
      }

      setPosts((prev) => {
        let updated = [...prev];

        if (meta?.replaceId) {
          updated = updated.map((post) =>
            post._id === meta.replaceId ? (newPost as FeedPost) : post
          );
        }

        const alreadyExists = updated.some((post) => post._id === newPost._id);
        if (alreadyExists) {
          updated = updated.map((post) =>
            post._id === newPost._id ? (newPost as FeedPost) : post
          );
        } else {
          updated = [newPost as FeedPost, ...updated];
        }

        return updated;
      });
      setVisibleCount((prev) => Math.max(prev + 1, INITIAL_VISIBLE_POSTS));
    },
    [fetchPosts]
  );

  const displayedPosts = useMemo(() => posts.slice(0, visibleCount), [posts, visibleCount]);
  const hasMorePosts = visibleCount < posts.length;
  const feedHighlights = useMemo(() => {
    const postCount = posts.length;
    const engagementCount = posts.reduce(
      (total, post) =>
        total +
        getPostLikeCount(post) +
        getPostCommentCount(post) +
        getPostShareCount(post),
      0
    );
    const freshPostCount = posts.filter((post) => {
      const createdAt = new Date(post.createdAt).getTime();
      if (Number.isNaN(createdAt)) return false;
      return Date.now() - createdAt <= 24 * 60 * 60 * 1000;
    }).length;

    return {
      postCount,
      engagementCount,
      freshPostCount,
    };
  }, [posts]);

  const trendingTags = useMemo(() => {
    const frequency = new Map<string, number>();
    posts.forEach((post) => {
      if (!Array.isArray(post.tags)) return;
      post.tags.forEach((rawTag) => {
        const tag = String(rawTag || "").trim().toLowerCase();
        if (!tag) return;
        frequency.set(tag, (frequency.get(tag) || 0) + 1);
      });
    });

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [posts]);

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-background via-background to-social-50/40 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.7)]">
            <div className="h-1 w-full bg-gradient-to-r from-social-500 via-navy-500 to-coding-500" />
            <CardContent className="space-y-4 p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">Feed</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Real-time updates from people and communities you follow.
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchPosts({ silent: true, force: true })}
                  disabled={refreshing || loading}
                  className="rounded-full border-border/80"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {refreshing ? "Refreshing" : "Refresh"}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-social-200 bg-social-50 px-3 py-1 text-xs font-semibold text-social-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  {feedHighlights.postCount} posts in feed
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-coding-200 bg-coding-50 px-3 py-1 text-xs font-semibold text-coding-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {feedHighlights.engagementCount} interactions
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Hash className="h-3.5 w-3.5" />
                  {feedHighlights.freshPostCount} posted today
                </div>
              </div>
            </CardContent>
          </Card>

          {loading && posts.length === 0 ? (
            <Card className="mx-auto w-full max-w-2xl rounded-3xl border border-border/70">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full rounded-2xl" />
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-16 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <PostCreator onPostCreated={handlePostCreated} className="max-w-none" />
          )}

          {error && (
            <Card className="mx-auto w-full max-w-2xl rounded-2xl border-red-200 bg-red-50">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => void fetchPosts({ force: true })}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={`feed-skeleton-${index}`} className="mx-auto w-full max-w-2xl rounded-3xl border border-border/70">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-[95%]" />
                    <Skeleton className="h-4 w-[88%]" />
                    <Skeleton className="h-44 w-full rounded-xl" />
                    <div className="grid grid-cols-4 gap-2">
                      <Skeleton className="h-8 rounded-full" />
                      <Skeleton className="h-8 rounded-full" />
                      <Skeleton className="h-8 rounded-full" />
                      <Skeleton className="h-8 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : displayedPosts.length === 0 ? (
              <Card className="mx-auto w-full max-w-2xl rounded-3xl border border-border/70">
                <CardContent className="py-14 text-center">
                  <MessageCircle className="mx-auto mb-3 h-11 w-11 text-muted-foreground" />
                  <h3 className="text-lg font-semibold text-foreground">No posts yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No posts yet. Start sharing your knowledge 🚀
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {displayedPosts.map((post) => (
                  <div key={post._id} className="flex justify-center">
                    <PostCard
                      post={mapPostForCard(post, user?.id)}
                      onLike={handleLikeSync}
                      onComment={handleCommentSync}
                      onShare={handleShareSync}
                      onBookmark={handleBookmarkSync}
                      onDelete={handleDeletePost}
                      onReport={handleReportPost}
                      onViewProfile={(username) => navigate(`/profile/${username}`)}
                    />
                  </div>
                ))}

                {hasMorePosts && (
                  <div ref={loadMoreSentinelRef} className="mx-auto w-full max-w-2xl py-2">
                    <Card className="rounded-2xl border-dashed bg-muted/10">
                      <CardContent className="p-4">
                        <Skeleton className="h-3 w-28" />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <Card className="rounded-3xl border border-border/70 bg-card/80 backdrop-blur">
              <CardContent className="space-y-3 p-5">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Trending Tags
                </h3>
                {trendingTags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tags will appear here once people start posting topics.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {trendingTags.map(([tag, count]) => (
                      <div
                        key={tag}
                        className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                      >
                        <span className="text-sm font-medium text-foreground">#{tag}</span>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border/70 bg-gradient-to-br from-coding-50/60 via-background to-social-50/50">
              <CardContent className="space-y-2 p-5">
                <h3 className="text-sm font-semibold text-foreground">Feed Tips</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Use category chips and tags in the composer to improve discoverability. Code snippets and media previews render automatically with rich cards.
                </p>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Post
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePost}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeedPage;
