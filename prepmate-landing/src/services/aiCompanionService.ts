import { apiClient } from "../lib/apiClient";
interface VoiceModel {
  id: string;
  name: string;
  lang: string;
  gender: 'male' | 'female';
  country: string;
}

interface VoicePreferences {
  rate: number;
  pitch: number;
  volume: number;
}

interface AICompanionSettings {
  selectedVoiceModel: string;
  voicePreferences: VoicePreferences;
  hasApiKey: boolean;
  isApiKeyValid: boolean;
  lastApiKeyValidation?: string;
}

class AICompanionService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getVoiceModels(): Promise<VoiceModel[]> {
    try {
      const response = await apiClient.fetch(`/users/ai-companion/voice-models`, {
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch voice models');
      }

      return data.data.voiceModels;
    } catch (error) {
      console.error('Error fetching voice models:', error);
      throw error;
    }
  }

  async getSettings(): Promise<AICompanionSettings> {
    try {
      const response = await apiClient.fetch(`/users/ai-companion/settings`, {
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch settings');
      }

      return data.data.settings;
    } catch (error) {
      console.error('Error fetching AI companion settings:', error);
      throw error;
    }
  }

  async setApiKey(apiKey: string): Promise<void> {
    try {
      const response = await apiClient.fetch(`/users/ai-companion/api-key`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to set API key');
      }
    } catch (error) {
      console.error('Error setting API key:', error);
      throw error;
    }
  }

  async updateVoiceModel(voiceModelId: string): Promise<VoiceModel> {
    try {
      const response = await apiClient.fetch(`/users/ai-companion/voice-model`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ voiceModelId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update voice model');
      }

      return data.data.selectedVoice;
    } catch (error) {
      console.error('Error updating voice model:', error);
      throw error;
    }
  }

  async updateVoicePreferences(preferences: Partial<VoicePreferences>): Promise<void> {
    try {
      const response = await apiClient.fetch(`/users/ai-companion/voice-preferences`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(preferences),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update voice preferences');
      }
    } catch (error) {
      console.error('Error updating voice preferences:', error);
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await apiClient.fetch(`/users/ai-companion/validate-api-key`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to validate API key');
      }

      return data.isValid;
    } catch (error) {
      console.error('Error validating API key:', error);
      throw error;
    }
  }

  async removeApiKey(): Promise<void> {
    try {
      const response = await apiClient.fetch(`/users/ai-companion/api-key`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove API key');
      }
    } catch (error) {
      console.error('Error removing API key:', error);
      throw error;
    }
  }
}

export const aiCompanionService = new AICompanionService();
export type { VoiceModel, VoicePreferences, AICompanionSettings };