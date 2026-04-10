import { apiClient } from "../../lib/apiClient";

export const socialApi = {
  async togglePostLike(postId: string) {
    await apiClient.post(`/social/posts/${postId}/like`);
  },
};
