import { apiClient } from "../../lib/apiClient";

export const commentsApi = {
  async getPostComments(postId: string) {
    const payload = await apiClient.get<any>(`/comments/post/${postId}`);
    return Array.isArray(payload?.data?.comments)
      ? payload.data.comments
      : Array.isArray(payload?.comments)
        ? payload.comments
        : [];
  },

  async addComment(postId: string, content: string) {
    const payload = await apiClient.post<any>(`/comments/post/${postId}`, { content });
    return payload?.data?.comment || payload?.comment || null;
  },

  async toggleCommentLike(commentId: string) {
    const payload = await apiClient.post<any>(`/comments/${commentId}/like`);
    return payload?.data?.comment || payload?.comment || null;
  },

  async addReply(commentId: string, content: string) {
    const payload = await apiClient.post<any>(`/comments/${commentId}/reply`, {
      content,
    });
    return payload?.data?.reply || payload?.reply || null;
  },
};
