/**
 * AI Assistant Component (PR #34)
 * 
 * WHY: Provides an intuitive UI for users to interact with the AI canvas agent.
 * Users can type natural language commands and see them execute on the canvas.
 * 
 * WHAT: 
 * - Circular button in bottom-right corner
 * - Expands into a chatbox when clicked
 * - Users type prompts ("create a red rectangle")
 * - AI executes commands and all users see changes in real-time
 * 
 * DESIGN: Clean, modern UI with smooth animations
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useCanvasStore } from '../lib/canvasStore';

interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface AIAssistantProps {
  documentId: string;
  onCommandExecuted?: () => void;
}

export default function AIAssistant({ documentId, onCommandExecuted }: AIAssistantProps) {
  const { user, session } = useAuth();
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: `👋 Welcome to AI Assistant

I can help you design faster with 10 powerful tools:

🎨 CREATE
• "Create a red rectangle at 200, 200"
• "Add a blue circle at 300, 300"
• "Draw a line from 100, 100 to 400, 400"
• "Add text saying 'Hello World' at 150, 150"

✏️ MODIFY (select shapes first)
• "Change color to #FF6B6B"
• "Move to 500, 500"
• "Resize to 200 by 150"
• "Rotate 45 degrees"

🗑️ DELETE
• "Delete selected shapes"
• "Remove all shapes"

📐 ARRANGE & ALIGN
• "Arrange shapes in a horizontal row"
• "Create a 3x3 grid layout"
• "Align shapes to the left"
• "Center shapes vertically"

📋 DUPLICATE
• "Duplicate selected shapes"
• "Copy this shape with 50px offset"

🎯 COMPLEX GROUPS
• "Create a button at 200, 200"
• "Make a card at 300, 300"
• "Design a login form at 100, 100"
• "Build a navbar at 100, 50"

Just type what you want to create!`,
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /**
   * Focus input when chat opens
   */
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  /**
   * Execute AI command
   * 
   * WHY: Sends prompt to backend, which:
   * 1. Uses OpenAI to parse the prompt
   * 2. Executes commands on the Yjs document
   * 3. Changes sync to all users automatically
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim() || isLoading) return;

    const userMessage: AIChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      // Call the AI execute endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      // Debug: Log token availability
      console.log('🔍 AI Request Debug:', {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        tokenPreview: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'NONE',
        userId: user?.id,
        documentId,
      });

      const response = await fetch(`${apiUrl}/api/ai/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          documentId: documentId,
          userId: user?.id,
          selectedShapeIds: selectedIds,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Success message
        const assistantMessage: AIChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: `✅ ${result.message || 'Command executed successfully!'}`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Notify parent component
        if (onCommandExecuted) {
          onCommandExecuted();
        }
      } else {
        // Error message
        const errorMessage: AIChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `❌ ${result.error || 'Failed to execute command'}`,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('AI execute error:', error);
      const errorMessage: AIChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Failed to connect to AI assistant. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Quick action buttons for common commands
   * WHY: These provide one-click examples of every AI tool category
   * WHAT: 12 buttons covering all 10 tools in a professional, Figma-like layout
   */
  const quickActions = [
    // CREATE tools (4 shape types)
    { label: '🟥 Rectangle', prompt: 'Create a red rectangle at 200, 200 with size 100x100' },
    { label: '🔵 Circle', prompt: 'Create a blue circle at 300, 300 with size 100x100' },
    { label: '📏 Line', prompt: 'Draw a black line from 100, 100 to 300, 100' },
    { label: '📝 Text', prompt: 'Add text saying "Hello World" at 150, 150' },
    
    // MODIFY tools
    { label: '🎨 Change Color', prompt: 'Change color to #FF6B6B' },
    { label: '📦 Resize', prompt: 'Resize to 200 by 150' },
    { label: '🔄 Rotate', prompt: 'Rotate 45 degrees' },
    { label: '↗️ Move', prompt: 'Move to 400, 300' },
    
    // ARRANGE & ALIGN tools
    { label: '📐 Grid Layout', prompt: 'Arrange in a 3x3 grid with 20px spacing' },
    { label: '⬅️ Align Left', prompt: 'Align all shapes to the left' },
    
    // DUPLICATE & DELETE tools
    { label: '📋 Duplicate', prompt: 'Duplicate selected shapes' },
    { label: '🗑️ Delete', prompt: 'Delete selected shapes' },
    
    // COMPLEX GROUP tools
    { label: '🎯 Button', prompt: 'Create a button at 200, 200' },
    { label: '🃏 Card', prompt: 'Create a card at 300, 300' },
    { label: '📋 Form', prompt: 'Design a login form at 100, 100' },
    { label: '🧭 Navbar', prompt: 'Build a navbar at 100, 50' },
  ];

  const handleQuickAction = (prompt: string) => {
    setPrompt(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <>
      {/* Circular Button (Bottom-Right Corner) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-14 right-4 w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 z-50 group"
          aria-label="Open AI Assistant"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      )}

      {/* AI Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-[420px] h-[700px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 dark:border-gray-700 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-lg">AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
              aria-label="Close AI Assistant"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`${message.role === 'system' ? 'max-w-full w-full' : 'max-w-[85%]'} rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white shadow-md'
                      : message.role === 'system'
                      ? 'bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 text-gray-800 dark:text-gray-100 border-2 border-purple-200 dark:border-purple-700/50 shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  }`}
                >
                  <p className={`${message.role === 'system' ? 'text-sm leading-relaxed' : 'text-sm'} whitespace-pre-wrap`}>
                    {message.content}
                  </p>
                  {message.role !== 'system' && (
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions - Professional Figma-style layout */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Quick Actions</h4>
              <span className="text-xs text-gray-500 dark:text-gray-500">Click to try</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="text-xs px-2 py-2 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-lg transition-all duration-200 text-left font-medium shadow-sm hover:shadow-md"
                  disabled={isLoading}
                  title={action.prompt}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask AI to create shapes..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

