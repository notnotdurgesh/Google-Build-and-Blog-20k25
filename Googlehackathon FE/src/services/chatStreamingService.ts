/**
 * SSE Streaming Chat Service
 * Implements real-time Server-Sent Events (SSE) for bidirectional communication with the AI agent
 * Following ADK session management pattern
 */

export interface StreamingChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface StreamingChatConfig {
  baseUrl?: string;
  appName?: string;
  onMessage?: (message: string, isPartial: boolean) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface SessionInfo {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, unknown>;
  events: unknown[];
  lastUpdateTime: number;
}

export class StreamingChatService {
  private baseUrl: string;
  private appName: string;
  private userId: string;
  private sessionId: string;
  private eventSource: EventSource | null = null;
  private currentMessageBuffer: string = '';
  private isConnected: boolean = false;
  private isSessionCreated: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private config: StreamingChatConfig;

  constructor(config: StreamingChatConfig = {}) {
    this.baseUrl = config.baseUrl || import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';
    this.appName = config.appName || 'multi_tool_agent';
    this.userId = this.generateUserId();
    this.sessionId = this.generateSessionId();
    this.config = config;
  }

  /**
   * Generate unique user ID
   */
  private generateUserId(): string {
    return 'u_' + Math.random().toString(36).substring(2, 10);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return 's_' + Math.random().toString(36).substring(2, 10);
  }

  /**
   * Create a new session
   */
  private async createSession(): Promise<SessionInfo> {
    const url = `${this.baseUrl}/apps/${this.appName}/users/${this.userId}/sessions/${this.sessionId}`;
    console.log('[SESSION] Creating session:', url);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const sessionInfo: SessionInfo = await response.json();
      console.log('[SESSION] Session created:', sessionInfo);

      this.isSessionCreated = true;

      return sessionInfo;
    } catch (error) {
      console.error('[SESSION] Error creating session:', error);
      throw error;
    }
  }

  /**
   * Connect to SSE endpoint (after session is created)
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('[SSE] Already connected');
      return;
    }

    // Step 1: Create session first
    if (!this.isSessionCreated) {
      await this.createSession();
    }

    // Step 2: Connect to SSE
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}/apps/${this.appName}/users/${this.userId}/sessions/${this.sessionId}/events?is_audio=false`;
      console.log('[SSE] Connecting to:', url);

      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('[SSE] Connection opened');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('[SSE] Error parsing message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        this.isConnected = false;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`[SSE] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

          setTimeout(() => {
            this.connectToSSE(); // Reconnect to SSE only, session already exists
          }, 2000 * this.reconnectAttempts);
        } else {
          const err = new Error('Failed to connect after multiple attempts');
          this.config.onError?.(err);
          reject(err);
        }
      };
    });
  }

  /**
   * Connect to SSE only (used for reconnection)
   */
  private async connectToSSE(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}/apps/${this.appName}/users/${this.userId}/sessions/${this.sessionId}/events?is_audio=false`;
      console.log('[SSE] Reconnecting to:', url);

      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        console.log('[SSE] Reconnection successful');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('[SSE] Error parsing message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('[SSE] Reconnection error:', error);
        this.isConnected = false;
        reject(error);
      };
    });
  }

  /**
   * Handle incoming messages from agent
   */
  private handleMessage(data: any): void {
    // Check for turn completion
    if (data.turn_complete) {
      console.log('[AGENT]: Turn complete');
      this.config.onComplete?.();
      this.currentMessageBuffer = '';
      return;
    }

    // Handle text messages
    if (data.mime_type === 'text/plain' && data.data) {
      this.currentMessageBuffer += data.data;
      this.config.onMessage?.(data.data, true);
    }

    // Handle audio (for future implementation)
    if (data.mime_type === 'audio/pcm') {
      console.log('[AGENT]: Received audio data');
      // Audio playback can be implemented here
    }
  }

  /**
   * Send message to agent
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected. Call connect() first.');
    }

    if (!this.isSessionCreated) {
      throw new Error('Session not created. Call connect() first.');
    }

    const url = `${this.baseUrl}/apps/${this.appName}/users/${this.userId}/sessions/${this.sessionId}/send`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mime_type: 'text/plain',
          data: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[CLIENT] Message sent:', message, result);
    } catch (error) {
      console.error('[CLIENT] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Disconnect from SSE
   */
  disconnect(deleteSession: boolean = false): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      console.log('[SSE] Connection closed');
    }

    // Optionally delete session from server
    if (deleteSession && this.isSessionCreated) {
      this.deleteSession();
    }
  }

  /**
   * Delete session from server
   */
  private async deleteSession(): Promise<void> {
    const url = `${this.baseUrl}/apps/${this.appName}/users/${this.userId}/sessions/${this.sessionId}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('[SESSION] Session deleted');
        this.isSessionCreated = false;
      }
    } catch (error) {
      console.error('[SESSION] Error deleting session:', error);
    }
  }

  /**
   * Get session information
   */
  async getSessionInfo(): Promise<SessionInfo | null> {
    if (!this.isSessionCreated) {
      return null;
    }

    const url = `${this.baseUrl}/apps/${this.appName}/users/${this.userId}/sessions/${this.sessionId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
      });

      if (response.ok) {
        const sessionInfo: SessionInfo = await response.json();
        return sessionInfo;
      }

      return null;
    } catch (error) {
      console.error('[SESSION] Error getting session info:', error);
      return null;
    }
  }

  /**
   * Check connection status
   */
  isSessionConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current user ID
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * Get app name
   */
  getAppName(): string {
    return this.appName;
  }

  /**
   * Reconnect with new session
   */
  async reconnect(): Promise<void> {
    this.disconnect(false); // Don't delete session, just disconnect SSE
    this.userId = this.generateUserId();
    this.sessionId = this.generateSessionId();
    this.isSessionCreated = false;
    this.reconnectAttempts = 0;
    await this.connect();
  }
}
