import React from 'react';
import { Message, Role } from '../types';
import { UserIcon, BotIcon } from './Icons';
import { formatText } from '../utils/markdown';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 px-4 md:px-0`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] lg:max-w-[70%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-emerald-600'} shadow-lg`}>
          {isUser ? <UserIcon className="w-5 h-5 text-white" /> : <BotIcon className="w-6 h-6 text-white" />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
          <div className={`relative px-5 py-3.5 rounded-2xl shadow-md text-sm md:text-base leading-relaxed break-words overflow-hidden
            ${isUser 
              ? 'bg-blue-600 text-white rounded-tr-sm' 
              : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-tl-sm'
            }`}
          >
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {message.attachments.map((att, idx) => (
                        <div key={idx} className="relative group overflow-hidden rounded-lg border border-white/20">
                            <img 
                                src={`data:${att.mimeType};base64,${att.data}`} 
                                alt="Attachment" 
                                className="h-32 w-auto object-cover" 
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Text Content */}
            <div className="prose prose-invert max-w-none">
                {formatText(message.text)}
            </div>

            {/* Streaming Indicator */}
            {message.isStreaming && (
               <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-emerald-400 animate-pulse" />
            )}
          </div>
          
          {/* Metadata */}
          <div className="mt-1.5 text-xs text-gray-500 font-medium px-1">
            {isUser ? 'You' : 'Gemini'} • {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {message.isError && <span className="text-red-500 ml-2">Failed to send</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;