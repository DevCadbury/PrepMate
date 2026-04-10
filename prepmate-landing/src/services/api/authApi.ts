import { apiClient } from "../../lib/apiClient";

interface AdminLoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: Record<string, unknown>;
  };
  message?: string;
}

export const authApi = {
  async adminLogin(email: string, password: string) {
    const payload = await apiClient.post<AdminLoginResponse>("/auth/admin/login", {
      email,
      password,
    });

    if (!payload?.success || !payload?.data?.token || !payload?.data?.user) {
      throw new Error(payload?.message || "Login failed. Please check your credentials.");
    }

    return payload.data;
  },
};
