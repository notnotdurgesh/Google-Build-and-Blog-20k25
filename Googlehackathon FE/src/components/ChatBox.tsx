import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Sparkles, Loader2, Music, CheckCircle } from 'lucide-react';
import ChatService from '../services/chatService';
import { MarkdownContent } from './MarkdownContent';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatBoxProps {
  onClose: () => void;
}

export function ChatBox({ onClose }: ChatBoxProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m your AI assistant powered by Google\'s Gemini. How can I help you create amazing beats today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPreset, setGeneratedPreset] = useState<any>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatServiceRef = useRef<ChatService | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize chat service and create session
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const service = new ChatService();
        chatServiceRef.current = service;

        // Create session before allowing chat
        await service.initialize();

        setIsReady(true);
        setIsInitializing(false);
        setError(null);
        console.log('Chat initialized with userId:', service.getUserId(), 'sessionId:', service.getSessionId());
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setIsInitializing(false);
        setIsReady(false);
        setError('Failed to connect. Please refresh the page.');
      }
    };

    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isReady) {
      inputRef.current?.focus();
    }
  }, [isReady]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !isReady) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const result = await chatServiceRef.current?.sendMessage(messageToSend);

      if (result) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.text,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Check if JSON was generated
        if (result.hasGeneratedJson && result.generatedJson) {
          console.log('Generated preset:', result.generatedJson);
          setGeneratedPreset(result.generatedJson);
          setShowPresetModal(true);
        }
      } else {
        throw new Error('No response received from assistant');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Get more specific error message
      let errorMsg = 'Sorry, I encountered an error. Please try again.';
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if (error.message.includes('Invalid response format')) {
          errorMsg = 'Sorry, I received an invalid response. Please try again.';
        } else if (error.message.includes('Empty')) {
          errorMsg = 'Sorry, I received an empty response. Please try again.';
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          errorMsg = 'Network error. Please check your connection and try again.';
        }
      }

      setError(errorMsg);

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAcceptPreset = () => {
    if (generatedPreset) {
      // Navigate to studio with the generated preset
      navigate('/studio', {
        state: {
          tracks: generatedPreset.tracks,
          bpm: generatedPreset.bpm,
          stepCount: generatedPreset.stepCount
        }
      });
      onClose(); // Close the chat
    }
  };

  const handleDeclinePreset = () => {
    setShowPresetModal(false);
    setGeneratedPreset(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl h-[600px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Assistant</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : isInitializing ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
                <p className="text-xs text-zinc-500">
                  {isInitializing ? 'Initializing...' : isReady ? 'Ready' : 'Error'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-colors group"
          >
            <X className="w-5 h-5 text-zinc-400 group-hover:text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-800 text-zinc-100'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <MarkdownContent content={message.content} className="text-sm leading-relaxed" />
                )}
                <p className="text-xs mt-1 opacity-60">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <p className="text-sm text-zinc-400">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          {error && (
            <div className="mb-3 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}
          {!isReady && !isInitializing && (
            <div className="mb-3 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
              Failed to connect. Please refresh the page.
            </div>
          )}
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isReady ? "Type your message..." : "Initializing..."}
              disabled={isLoading || !isReady}
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading || !isReady}
              className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:cursor-not-allowed flex items-center justify-center transition-all hover:scale-105 disabled:hover:scale-100"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Preset Generated Modal */}
      {showPresetModal && generatedPreset && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-indigo-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Music className="w-8 h-8 text-white" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-center mb-2 text-white">
              Beat Created! 🎵
            </h3>

            <p className="text-center text-zinc-400 mb-6">
              Your custom beat "{generatedPreset.name}" is ready! Would you like to open it in the studio?
            </p>

            <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 border border-zinc-700">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-zinc-400">Name:</span>
                <span className="text-white font-medium">{generatedPreset.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-zinc-400">BPM:</span>
                <span className="text-white font-medium">{generatedPreset.bpm}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Tracks:</span>
                <span className="text-white font-medium">{generatedPreset.tracks?.length || 0} notes</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeclinePreset}
                className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-semibold transition-all"
              >
                Continue Chatting
              </button>
              <button
                onClick={handleAcceptPreset}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)] flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Open Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
