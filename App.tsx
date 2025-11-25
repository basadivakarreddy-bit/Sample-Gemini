import React, { useState, useEffect, useRef } from 'react';
import { GenerateContentResponse } from "@google/genai";
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { initializeChat, sendMessageStream } from './services/gemini';
import { Message, Role, Attachment } from './types';
import { BotIcon } from './components/Icons';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize chat on mount
  useEffect(() => {
    initializeChat();
    
    // Add welcome message
    setMessages([{
      id: 'welcome',
      role: Role.MODEL,
      text: "Hello! I'm Gemini. How can I help you today? I can also see images if you attach them.",
      timestamp: Date.now()
    }]);
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string, attachments: Attachment[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text,
      timestamp: Date.now(),
      attachments
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);

    // Create placeholder for bot response
    const botMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: botMessageId,
      role: Role.MODEL,
      text: '',
      timestamp: Date.now(),
      isStreaming: true
    }]);

    try {
      const streamResult = await sendMessageStream(text, attachments);
      
      let fullText = '';
      
      for await (const chunk of streamResult) {
        const chunkContent = chunk as GenerateContentResponse;
        const chunkText = chunkContent.text || '';
        fullText += chunkText;

        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, text: fullText }
            : msg
        ));
      }

      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error: any) {
      console.error("Stream error:", error);
      
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: "Sorry, I encountered an error processing your request.", isStreaming: false, isError: true }
          : msg
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStop = () => {
    setIsStreaming(false);
    setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last.role === Role.MODEL && last.isStreaming) {
            return prev.map(msg => msg.id === last.id ? { ...msg, isStreaming: false } : msg);
        }
        return prev;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="flex-none p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-500 to-emerald-500 rounded-xl shadow-lg">
                <BotIcon className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-emerald-200">
                Chat AI
                </h1>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <p className="text-xs text-emerald-400 font-medium tracking-wide">2.5 Flash Active</p>
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 scroll-smooth">
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 pb-6 bg-gradient-to-t from-gray-950 via-gray-950 to-transparent">
        <ChatInput 
          onSend={handleSend} 
          disabled={false}
          isStreaming={isStreaming}
          onStop={handleStop}
        />
      </footer>
    </div>
  );
};

export default App;