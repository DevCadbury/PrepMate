import { apiClient } from "../../lib/apiClient";

const FEED_CACHE_TTL_MS = 10000;

let feedCache: {
  expiresAt: number;
  posts: any[];
} | null = null;

const toPosts = (payload: any) => (Array.isArray(payload?.data?.posts) ? payload.data.posts : []);

export const feedApi = {
  clearCache() {
    feedCache = null;
  },

  async getFeedPosts(options?: { force?: boolean }) {
    const force = options?.force === true;
    if (!force && feedCache && feedCache.expiresAt > Date.now()) {
      return feedCache.posts;
    }

    const payload = await apiClient.get<any>("/social/posts/feed");
    const posts = toPosts(payload);

    feedCache = {
      expiresAt: Date.now() + FEED_CACHE_TTL_MS,
      posts,
    };

    return posts;
  },

  async deletePost(postId: string) {
    await apiClient.delete(`/social/posts/${postId}`);
    this.clearCache();
  },
};
