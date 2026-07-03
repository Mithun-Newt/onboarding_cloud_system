// @ts-nocheck
"use client";

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Trash2, RefreshCcw, Loader2 } from 'lucide-react';

export function AiCoworker() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  
  const { messages, sendMessage, status, error, regenerate, setMessages } = useChat({});

  const isLoading = status === 'submitted' || status === 'streaming';
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const clearChat = () => setMessages([]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label="Open AI Coworker"
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-6 right-6 w-96 h-[600px] max-h-[80vh] flex flex-col bg-white border border-gray-200 rounded-2xl shadow-2xl transition-all duration-300 z-50 overflow-hidden origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
          <div className="flex items-center gap-2">
            <Bot size={20} />
            <h3 className="font-semibold text-lg">AI Coworker</h3>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={clearChat} title="Clear conversation" className="p-1 hover:bg-blue-700 rounded transition-colors">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={() => setIsOpen(false)} title="Close" className="p-1 hover:bg-blue-700 rounded transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
              <Bot size={48} className="opacity-20" />
              <p className="text-center text-sm">Hi! I'm your AI Coworker.<br/>Ask me about admissions, fees, or documents.</p>
            </div>
          )}

          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'}`}>
                {m.role !== 'user' && (
                  <div className="flex items-center gap-1 mb-1 text-xs text-blue-600 font-semibold uppercase tracking-wider">
                    <Bot size={12} /> AI
                  </div>
                )}
                
                {/* Render the text content of the message */}
                {m.content && (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed mb-2">
                    {m.content}
                  </div>
                )}
                
                {/* Render tool invocations and text parts */}
                {m.parts?.map((part: any, index: number) => {
                  if (part.type === 'text') {
                    return (
                      <div key={index} className="text-sm whitespace-pre-wrap leading-relaxed mb-2">
                        {part.text}
                      </div>
                    );
                  }
                  if (part.type === 'tool-invocation') {
                    const tool = part.toolInvocation;
                    if (tool.state === 'call') {
                      return (
                        <div key={tool.toolCallId} className="mt-2 text-xs flex items-center gap-2 text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <Loader2 size={12} className="animate-spin" />
                          Executing: {tool.toolName}...
                        </div>
                      );
                    } else if (tool.state === 'result') {
                      return (
                        <div key={tool.toolCallId} className="mt-2 text-xs flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
                          ✓ Finished: {tool.toolName}
                        </div>
                      );
                    }
                  }
                  return null;
                })}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span className="text-xs text-gray-500">Thinking...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-lg text-sm flex flex-col items-center gap-2 text-center">
              <span>Oops! Something went wrong communicating with the AI.</span>
              <button onClick={() => regenerate()} className="flex items-center gap-1 text-xs font-semibold hover:underline">
                <RefreshCcw size={12} /> Retry
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything..."
              className="flex-1 border border-gray-300 rounded-full py-2 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:opacity-50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-1 p-2 rounded-full bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
