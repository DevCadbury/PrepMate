import { apiClient } from "../lib/apiClient";
interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;
  private isConfigured: boolean;

  constructor() {
    // Use a demo cloud name for testing, or get from environment
    this.cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || "demo";
    this.uploadPreset =
      process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || "ml_default";
    this.isConfigured = !!(
      process.env.REACT_APP_CLOUDINARY_CLOUD_NAME &&
      process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET
    );
  }

  // Convert file to base64 for fallback
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  async uploadImage(file: File): Promise<string> {
    // If Cloudinary is not configured, use base64 fallback
    if (!this.isConfigured) {
      console.warn("Cloudinary not configured, using base64 fallback");
      return await this.fileToBase64(file);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", this.uploadPreset);

    try {
      const response = await apiClient.fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Cloudinary upload failed:", errorData);
        // Fallback to base64 if Cloudinary fails
        return await this.fileToBase64(file);
      }

      const data: CloudinaryResponse = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      // Fallback to base64
      return await this.fileToBase64(file);
    }
  }

  async uploadProfilePicture(file: File): Promise<string> {
    // If Cloudinary is not configured, use base64 fallback
    if (!this.isConfigured) {
      console.warn(
        "Cloudinary not configured, using base64 fallback for profile picture"
      );
      return await this.fileToBase64(file);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", this.uploadPreset);
    formData.append("folder", "profile-pictures");
    formData.append("transformation", "w_400,h_400,c_fill,g_face");

    try {
      const response = await apiClient.fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Cloudinary profile picture upload failed:", errorData);
        // Fallback to base64 if Cloudinary fails
        return await this.fileToBase64(file);
      }

      const data: CloudinaryResponse = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading profile picture to Cloudinary:", error);
      // Fallback to base64
      return await this.fileToBase64(file);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.isConfigured) {
      console.warn("Cloudinary not configured, skipping image deletion");
      return;
    }

    try {
      const response = await apiClient.fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            public_id: publicId,
          }),
        }
      );

      if (!response.ok) {
        console.warn("Failed to delete image from Cloudinary");
      }
    } catch (error) {
      console.error("Error deleting from Cloudinary:", error);
    }
  }

  // Check if Cloudinary is properly configured
  isCloudinaryConfigured(): boolean {
    return this.isConfigured;
  }
}

export default new CloudinaryService();
