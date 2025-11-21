import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface ChatResponse {
  response: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  generatedJson?: any;
  hasGeneratedJson?: boolean;
}

export interface ChatMessageResult {
  text: string;
  generatedJson?: any;
  hasGeneratedJson: boolean;
}

class ChatService {
  private userId: string;
  private sessionId: string;
  private messages: ChatMessage[] = [];
  private isInitialized: boolean = false;

  constructor() {
    // Generate unique userId and sessionId
    this.userId = this.generateId('user');
    this.sessionId = this.generateId('session');
  }

  private generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}_${random}`;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Create session in backend
      const response = await axios.post(`${API_URL}/create-session`, {
        userId: this.userId,
        sessionId: this.sessionId
      });

      console.log('Session created successfully:', response.data);
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Failed to initialize chat session');
    }
  }

  async sendMessage(userMessage: string): Promise<ChatMessageResult> {
    if (!this.isInitialized) {
      throw new Error('Chat service not initialized. Call initialize() first.');
    }

    // Add user message to history
    this.messages.push({
      role: 'user',
      text: userMessage
    });

    try {
      // Send message to backend
      const response = await axios.post<ChatResponse>(`${API_URL}/llm`, {
        userId: this.userId,
        sessionId: this.sessionId,
        messages: this.messages
      });

      console.log('Full API Response:', JSON.stringify(response.data, null, 2));

      // Validate and extract assistant response with proper error handling
      if (!response.data) {
        throw new Error('No data in response');
      }

      if (!response.data.response || !Array.isArray(response.data.response)) {
        throw new Error('Invalid response format: missing response array');
      }

      if (response.data.response.length === 0) {
        throw new Error('Empty response array');
      }

      const firstResponse = response.data.response[0];

      if (!firstResponse.content) {
        throw new Error('Invalid response format: missing content');
      }

      if (!firstResponse.content.parts || !Array.isArray(firstResponse.content.parts)) {
        throw new Error('Invalid response format: missing parts array');
      }

      if (firstResponse.content.parts.length === 0) {
        throw new Error('Empty parts array');
      }

      const firstPart = firstResponse.content.parts[0];

      if (!firstPart.text || typeof firstPart.text !== 'string') {
        throw new Error('Invalid response format: missing or invalid text');
      }

      const assistantText = firstPart.text.trim();

      if (!assistantText) {
        throw new Error('Empty assistant response');
      }

      console.log('Extracted assistant text:', assistantText);

      // Add assistant response to history
      this.messages.push({
        role: 'assistant',
        text: assistantText
      });

      // Return both text and generated JSON
      return {
        text: assistantText,
        generatedJson: response.data.generatedJson,
        hasGeneratedJson: response.data.hasGeneratedJson || false
      };
    } catch (error) {
      console.error('Error sending message:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Error Response:', error.response?.data);
        console.error('API Error Status:', error.response?.status);
      }
      // Remove the user message from history if request failed
      this.messages.pop();
      throw new Error('Failed to send message');
    }
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  getUserId(): string {
    return this.userId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export default ChatService;
