import { apiClient } from "../lib/apiClient";

interface UploadOptions {
  email?: string;
  token?: string;
}

class CloudinaryService {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.fetch("/uploads/image", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Image upload failed");
    }

    return data.data?.url;
  }

  async uploadProfilePicture(file: File, options: UploadOptions = {}): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    if (options.email && options.token) {
      formData.append("email", options.email);
      formData.append("token", options.token);
    }

    const endpoint = options.email && options.token
      ? "/auth/upload-profile-picture"
      : "/uploads/profile-picture";

    const response = await apiClient.fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Profile picture upload failed");
    }

    return data.data?.url;
  }

  async deleteImage(publicId: string): Promise<void> {
    const response = await apiClient.fetch("/uploads/image", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || "Failed to delete image");
    }
  }
}

export default new CloudinaryService();
