/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Preset {
  id: string;
  name: string;
  description: string;
  bpm: number;
  stepCount: number;
  tracks: any[];
}

export interface CreatePresetRequest {
  name: string;
  description: string;
  bpm: number;
  stepCount: number;
  tracks: any[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const presetService = {
  async getPresets(): Promise<Preset[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/presets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch presets: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching presets:', error);
      return [];
    }
  },

  async getCurrentPreset(): Promise<Preset | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/presets/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch current preset: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching current preset:', error);
      return null;
    }
  },

  async createPreset(preset: CreatePresetRequest): Promise<Preset | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/presets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preset),
      });

      if (!response.ok) {
        throw new Error(`Failed to create preset: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating preset:', error);
      return null;
    }
  },

  async deletePreset(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/presets/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete preset: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting preset:', error);
      return false;
    }
  }
};

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SendMessageRequest {
  message: string;
  conversationId?: string;
}

export interface SendMessageResponse {
  reply: string;
  conversationId: string;
}

export const chatService = {
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }
};
